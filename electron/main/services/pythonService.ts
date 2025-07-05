import { spawn, ChildProcess, exec } from 'node:child_process'
import { join } from 'node:path'
import { app } from 'electron'
import log from 'electron-log'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface PythonServiceConfig {
    host: string
    port: number
    autoStart: boolean
}

export interface PythonServiceStatus {
    running: boolean
    pid?: number
    port: number
    startTime?: Date
    error?: string
}

export class PythonServiceManager {
    private process: ChildProcess | null = null
    private config: PythonServiceConfig
    private status: PythonServiceStatus
    private retryCount = 0
    private maxRetries = 3
    private retryTimeout?: NodeJS.Timeout
    private isManualStop = false // 标记是否为用户主动停止

    constructor(config: Partial<PythonServiceConfig> = {}) {
        this.config = {
            host: '127.0.0.1',
            port: 8000,
            autoStart: true,
            ...config
        }

        this.status = {
            running: false,
            port: this.config.port
        }
    }

    /**
     * 获取 Python 服务可执行文件路径
     */
    private getExecutablePath(): string {
        const isDev = !app.isPackaged

        if (isDev) {
            // 开发环境：使用 dist-python 目录下的文件
            return join(process.cwd(), 'dist-python', 'ele-py.com')
        } else {
            // 生产环境：使用打包后的 resources 目录
            return join(process.resourcesPath, 'dist-python', 'ele-py.com')
        }
    }

    /**
     * 检查可执行文件是否存在
     */
    private checkExecutableExists(): boolean {
        const exePath = this.getExecutablePath()
        const exists = existsSync(exePath)

        if (!exists) {
            log.error(`Python 服务可执行文件不存在: ${exePath}`)
        }

        return exists
    }

    /**
     * 检查端口是否被占用
     */
    private async checkPortAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`http://${this.config.host}:${this.config.port}/status`, {
                signal: AbortSignal.timeout(1000)
            })
            // 如果能连接到端口，说明端口被占用
            return false
        } catch (error) {
            // 连接失败说明端口可用
            return true
        }
    }

    /**
     * 启动 Python 服务
     */
    async start(): Promise<boolean> {
        if (this.status.running) {
            log.warn('Python 服务已在运行中')
            return true
        }

        if (!this.checkExecutableExists()) {
            this.status.error = 'Python 服务可执行文件不存在'
            return false
        }

        // 检查端口是否可用
        const portAvailable = await this.checkPortAvailable()
        if (!portAvailable) {
            const errorMsg = `端口 ${this.config.port} 已被占用，请检查是否有其他服务在运行`
            log.error(errorMsg)
            this.status.error = errorMsg
            return false
        }

        try {
            const exePath = this.getExecutablePath()
            log.info(`启动 Python 服务: ${exePath}`)

            // 设置环境变量
            const env = {
                ...process.env,
                HTTP_HOST: this.config.host,
                HTTP_PORT: this.config.port.toString(),
                DEBUG: 'false',
                // 设置 Python 使用 UTF-8 编码
                PYTHONIOENCODING: 'utf-8',
                PYTHONLEGACYWINDOWSFSENCODING: 'utf-8',
                // 强制使用 UTF-8 输出
                PYTHONUTF8: '1'
            }

            // 启动子进程
            this.process = spawn(exePath, [], {
                env,
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: true
            })

            // 监听进程事件
            this.setupProcessListeners()

            // 等待服务启动
            await this.waitForServiceReady()

            this.status = {
                running: true,
                pid: this.process.pid,
                port: this.config.port,
                startTime: new Date(),
                error: undefined
            }

            // 重置标记
            this.isManualStop = false
            this.retryCount = 0

            log.info(`Python 服务启动成功 [PID: ${this.process.pid}]`)
            return true

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error(`启动 Python 服务失败: ${errorMsg}`)
            this.status.error = errorMsg
            this.status.running = false
            return false
        }
    }

    /**
     * 停止 Python 服务
     */
    async stop(): Promise<boolean> {
        if (!this.process || !this.status.running) {
            log.warn('Python 服务未运行')
            return true
        }

        try {
            const pid = this.process.pid
            log.info(`停止 Python 服务 [PID: ${pid}]`)

            // 标记为手动停止，防止自动重启
            this.isManualStop = true

            // 清除重试定时器
            if (this.retryTimeout) {
                clearTimeout(this.retryTimeout)
                this.retryTimeout = undefined
            }

            // 先尝试优雅关闭
            this.process.kill('SIGTERM')

            // 等待进程结束
            const killed = await new Promise<boolean>((resolve) => {
                const timeout = setTimeout(async () => {
                    if (this.process && !this.process.killed) {
                        log.warn('优雅关闭超时，强制终止 Python 服务')
                        try {
                            this.process.kill('SIGKILL')
                        } catch (e) {
                            log.warn('SIGKILL 失败:', e)
                        }

                        // 如果 SIGKILL 也失败，使用系统命令强制终止进程树
                        if (process.platform === 'win32') {
                            await this.forceKillProcess(pid)
                        }
                    }
                    resolve(false)
                }, 2000) // 减少等待时间为 2 秒

                this.process?.on('exit', () => {
                    clearTimeout(timeout)
                    log.info(`Python 服务进程 [PID: ${pid}] 已退出`)
                    resolve(true)
                })
            })

            // 确保进程引用被清理
            this.process = null
            this.status = {
                running: false,
                port: this.config.port
            }

            // 额外检查：验证端口是否真正释放
            setTimeout(async () => {
                const portStillUsed = !(await this.checkPortAvailable())
                if (portStillUsed) {
                    log.warn(`端口 ${this.config.port} 仍被占用，尝试按端口清理进程`)
                    await this.killProcessByPort(this.config.port)
                }
            }, 1000)

            log.info(`Python 服务已停止 [优雅退出: ${killed}]`)
            return true

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error(`停止 Python 服务失败: ${errorMsg}`)

            // 即使出错也要清理状态
            this.process = null
            this.status = {
                running: false,
                port: this.config.port
            }
            return false
        }
    }

    /**
     * 重启 Python 服务
     */
    async restart(): Promise<boolean> {
        log.info('重启 Python 服务')
        await this.stop()
        await new Promise(resolve => setTimeout(resolve, 1000))
        return await this.start()
    }

    /**
     * 获取服务状态
     */
    getStatus(): PythonServiceStatus {
        return { ...this.status }
    }

    /**
     * 检查服务是否健康
     */
    async checkHealth(): Promise<boolean> {
        if (!this.status.running) {
            return false
        }

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)

            const response = await fetch(`http://${this.config.host}:${this.config.port}/status`, {
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            return response.ok

        } catch (error) {
            log.warn('Python 服务健康检查失败:', error)
            return false
        }
    }

    /**
     * 设置进程监听器
     */
    private setupProcessListeners(): void {
        if (!this.process) return

        // 标准输出
        this.process.stdout?.on('data', (data) => {
            log.info(`[Python Service] ${data.toString().trim()}`)
        })

        // 错误输出
        this.process.stderr?.on('data', (data) => {
            log.warn(`[Python Service Error] ${data.toString().trim()}`)
        })

        // 进程退出
        this.process.on('exit', (code, signal) => {
            log.info(`Python 服务退出 [Code: ${code}, Signal: ${signal}]`)
            this.status.running = false
            this.process = null

            // 只有在非手动停止且异常退出时才自动重启
            const shouldRestart = !this.isManualStop &&
                code !== 0 &&
                this.config.autoStart &&
                this.retryCount < this.maxRetries

            if (shouldRestart) {
                this.scheduleRestart()
            } else if (this.isManualStop) {
                log.info('用户主动停止服务，不进行自动重启')
                this.isManualStop = false // 重置标记
            }
        })

        // 进程错误
        this.process.on('error', (error) => {
            log.error('Python 服务进程错误:', error)
            this.status.error = error.message
            this.status.running = false
        })
    }

    /**
     * 计划重启服务
     */
    private scheduleRestart(): void {
        this.retryCount++
        const delay = Math.min(1000 * this.retryCount, 10000) // 最大延迟 10 秒

        log.info(`计划在 ${delay}ms 后重启 Python 服务 (尝试 ${this.retryCount}/${this.maxRetries})`)

        this.retryTimeout = setTimeout(async () => {
            try {
                await this.start()
            } catch (error) {
                log.error('自动重启 Python 服务失败:', error)
            }
        }, delay)
    }

    /**
     * 等待服务就绪
     */
    private async waitForServiceReady(timeout = 10000): Promise<void> {
        const startTime = Date.now()

        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(`http://${this.config.host}:${this.config.port}/status`, {
                    signal: AbortSignal.timeout(1000)
                })

                if (response.ok) {
                    return
                }
            } catch (error) {
                // 继续等待
            }

            await new Promise(resolve => setTimeout(resolve, 500))
        }

        throw new Error('等待 Python 服务启动超时')
    }

    /**
     * 强制清理进程（Windows 特定）
     */
    private async forceKillProcess(pid: number): Promise<boolean> {
        if (process.platform !== 'win32') {
            return false
        }

        try {
            // 使用 /T 参数杀死整个进程树，确保子进程也被终止
            await execAsync(`taskkill /F /T /PID ${pid}`)
            log.info(`强制终止进程树 ${pid} 成功`)
            return true
        } catch (error) {
            log.warn(`强制终止进程树 ${pid} 失败:`, error)
            return false
        }
    }

    /**
     * 按端口杀死进程
     */
    private async killProcessByPort(port: number): Promise<boolean> {
        if (process.platform !== 'win32') {
            return false
        }

        try {
            // 查找占用端口的进程
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
            const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))

            for (const line of lines) {
                const match = line.trim().match(/\s+(\d+)$/)
                if (match) {
                    const pid = parseInt(match[1])
                    log.info(`发现占用端口 ${port} 的进程 PID: ${pid}`)
                    await this.forceKillProcess(pid)
                }
            }
            return true
        } catch (error) {
            log.warn(`按端口 ${port} 杀死进程失败:`, error)
            return false
        }
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout)
        }

        // 如果进程仍在运行，尝试强制清理
        if (this.process && this.process.pid && this.status.running) {
            const pid = this.process.pid
            log.info(`清理时发现进程 ${pid} 仍在运行，尝试强制清理`)

            // 先尝试正常停止
            const stopped = await this.stop()

            // 如果正常停止失败，在 Windows 上使用 taskkill
            if (!stopped && process.platform === 'win32') {
                await this.forceKillProcess(pid)
            }
        }

        // 确保状态被重置
        this.process = null
        this.status = {
            running: false,
            port: this.config.port
        }
    }
} 
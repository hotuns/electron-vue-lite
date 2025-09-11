import { app } from 'electron'
import log from 'electron-log'
import { join } from 'node:path'
import path from 'node:path'
import { promisify } from 'node:util'
import { exec } from 'node:child_process'
import { UvManager, ProcessCallbacks } from './uvManager'

const execAsync = promisify(exec)

export interface UvPythonServiceConfig {
    host: string
    port: number
    autoStart: boolean
    pythonVersion?: string
    projectPath: string
    mainScript: string
}

export interface UvPythonServiceStatus {
    running: boolean
    pid?: number
    port: number
    startTime?: Date
    error?: string
    venvReady: boolean
}

export class UvPythonServiceManager {
    private uvManager: UvManager
    private config: UvPythonServiceConfig
    private status: UvPythonServiceStatus
    private retryCount = 0
    private maxRetries = 3
    private retryTimeout?: NodeJS.Timeout
    private isManualStop = false
    private pythonProcess?: any

    constructor(config: Partial<UvPythonServiceConfig> = {}) {
        this.config = {
            host: '127.0.0.1',
            port: 8000,
            autoStart: true,
            pythonVersion: '3.12',
            projectPath: this.getProjectPath(),
            mainScript: 'main.py',
            ...config
        }

        this.status = {
            running: false,
            port: this.config.port,
            venvReady: false
        }

        // 初始化 UvManager
        this.uvManager = new UvManager(this.config.projectPath, {
            pythonVersion: this.config.pythonVersion
        })
    }

    /**
     * 获取 Python 项目路径
     */
    private getProjectPath(): string {
        const isDev = !app.isPackaged

        if (isDev) {
            // 开发环境：使用项目中的 python-project/ele-py 目录
            return join(process.cwd(), 'python-project', 'ele-py')
        } else {
            // 生产环境：使用打包后的 resources 目录
            return join(process.resourcesPath, 'python-project', 'ele-py')
        }
    }

    /**
     * 检查 uv 是否可用
     */
    private checkUvAvailable(): boolean {
        if (!this.uvManager.isUvAvailable()) {
            const error = 'uv 可执行文件不存在，请确保已正确下载并打包'
            log.error(error)
            this.status.error = error
            return false
        }
        return true
    }

    /**
     * 检查端口是否被占用
     */
    private async checkPortAvailable(): Promise<boolean> {
        try {
            // 尝试多个可能的健康检查端点
            const endpoints = [
                `http://${this.config.host}:${this.config.port}/health`,
                `http://${this.config.host}:${this.config.port}/status`,
                `http://${this.config.host}:${this.config.port}/api/health`
            ]

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        signal: AbortSignal.timeout(1000)
                    })
                    if (response.ok) {
                        // 如果任何端点响应成功，说明端口被占用
                        log.warn(`端口 ${this.config.port} 被占用，检测到服务响应: ${endpoint}`)
                        return false
                    }
                } catch (error) {
                    // 单个端点失败，继续尝试下一个
                    continue
                }
            }
            
            // 所有端点都失败，说明端口可用
            return true
        } catch (error) {
            // 连接失败说明端口可用
            return true
        }
    }

    /**
     * 设置虚拟环境
     */
    async setupVirtualEnvironment(): Promise<boolean> {
        if (!this.checkUvAvailable()) {
            return false
        }

        log.info('设置 Python 虚拟环境...')

        // 检查虚拟环境是否存在
        if (!this.uvManager.venvExists()) {
            log.info('创建新的虚拟环境...')
            
            const callbacks: ProcessCallbacks = {
                onStdout: (data) => log.info(`[venv setup] ${data.trim()}`),
                onStderr: (data) => log.warn(`[venv setup] ${data.trim()}`)
            }

            const created = await this.uvManager.createVenv(callbacks)
            if (!created) {
                this.status.error = '创建虚拟环境失败'
                return false
            }
        }

        // 检查虚拟环境健康状态
        const healthy = await this.uvManager.checkVenvHealth()
        if (!healthy) {
            log.warn('虚拟环境不健康，重新创建...')
            const created = await this.uvManager.createVenv()
            if (!created) {
                this.status.error = '重新创建虚拟环境失败'
                return false
            }
        }

        // 安装依赖
        const dependenciesInstalled = await this.installDependencies()
        if (!dependenciesInstalled) {
            this.status.error = '安装依赖失败'
            return false
        }

        this.status.venvReady = true
        log.info('虚拟环境设置完成')
        return true
    }

    /**
     * 安装 Python 依赖
     */
    private async installDependencies(): Promise<boolean> {
        log.info('安装 Python 依赖...')

        const callbacks: ProcessCallbacks = {
            onStdout: (data) => log.info(`[pip install] ${data.trim()}`),
            onStderr: (data) => log.warn(`[pip install] ${data.trim()}`)
        }

        // 安装 requirements.txt 中的依赖
        const requirementsFile = join(this.config.projectPath, 'pyproject.toml')
        
        // 先尝试使用 uv sync 安装依赖（推荐方式）
        const { exitCode } = await this.uvManager.runUvCommand(['sync'], callbacks)
        
        if (exitCode === 0) {
            log.info('使用 uv sync 安装依赖成功')
            return true
        }

        // 如果 uv sync 失败，回退到传统方式
        log.warn('uv sync 失败，尝试使用 pip install 安装依赖')
        
        const installed = await this.uvManager.installPackages([], callbacks, {
            requirementsFile: join(this.config.projectPath, 'requirements.txt')
        })

        if (!installed) {
            log.error('安装依赖失败')
            return false
        }

        log.info('依赖安装完成')
        return true
    }

    /**
     * 启动 Python 服务
     */
    async start(): Promise<boolean> {
        if (this.status.running) {
            log.warn('Python 服务已在运行中')
            return true
        }

        // 检查端口是否可用
        const portAvailable = await this.checkPortAvailable()
        if (!portAvailable) {
            const errorMsg = `端口 ${this.config.port} 已被占用，请检查是否有其他服务在运行`
            log.error(errorMsg)
            this.status.error = errorMsg
            return false
        }

        // 设置虚拟环境
        if (!this.status.venvReady) {
            const envReady = await this.setupVirtualEnvironment()
            if (!envReady) {
                return false
            }
        }

        try {
            log.info(`启动 Python 服务: ${this.config.mainScript}`)

            // 设置环境变量
            const env = {
                PYTHON_SERVICE_HOST: this.config.host,
                PYTHON_SERVICE_PORT: this.config.port.toString(),
                DEBUG: 'false',
                PYTHONIOENCODING: 'utf-8',
                PYTHONUTF8: '1'
            }

            const callbacks: ProcessCallbacks = {
                onStdout: (data) => {
                    log.info(`[Python Service] ${data.trim()}`)
                },
                onStderr: (data) => {
                    log.warn(`[Python Service Error] ${data.trim()}`)
                },
                onClose: (code, signal) => {
                    log.info(`Python 服务退出 [Code: ${code}, Signal: ${signal}]`)
                    this.status.running = false
                    this.pythonProcess = undefined

                    // 只有在非手动停止且异常退出时才自动重启
                    const shouldRestart = !this.isManualStop &&
                        code !== 0 &&
                        this.config.autoStart &&
                        this.retryCount < this.maxRetries

                    if (shouldRestart) {
                        this.scheduleRestart()
                    } else if (this.isManualStop) {
                        log.info('用户主动停止服务，不进行自动重启')
                        this.isManualStop = false
                    }
                }
            }

            // 启动 Python 脚本
            this.pythonProcess = await this.uvManager.runPythonScript(
                this.config.mainScript,
                [],
                callbacks,
                {
                    cwd: this.config.projectPath,
                    env
                }
            )

            // 等待服务启动
            await this.waitForServiceReady()

            this.status = {
                ...this.status,
                running: true,
                pid: this.pythonProcess.pid,
                startTime: new Date(),
                error: undefined
            }

            // 重置标记
            this.isManualStop = false
            this.retryCount = 0

            log.info(`Python 服务启动成功 [PID: ${this.pythonProcess.pid}]`)
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
        if (!this.pythonProcess || !this.status.running) {
            log.warn('Python 服务未运行')
            return true
        }

        try {
            const pid = this.pythonProcess.pid
            log.info(`停止 Python 服务 [PID: ${pid}]`)

            // 标记为手动停止，防止自动重启
            this.isManualStop = true

            // 清除重试定时器
            if (this.retryTimeout) {
                clearTimeout(this.retryTimeout)
                this.retryTimeout = undefined
            }

            // 在 Windows 上使用更强力的终止方法
            if (process.platform === 'win32') {
                const success = await this.forceKillProcessTree(pid)
                if (success) {
                    log.info(`强制终止进程树 ${pid} 成功`)
                } else {
                    log.warn(`强制终止进程树 ${pid} 失败，尝试常规方法`)
                }
            }

            // 先尝试优雅关闭
            try {
                this.pythonProcess.kill('SIGTERM')
            } catch (e) {
                log.warn('SIGTERM 失败:', e)
            }

            // 等待进程结束
            const killed = await new Promise<boolean>((resolve) => {
                const timeout = setTimeout(async () => {
                    if (this.pythonProcess && !this.pythonProcess.killed) {
                        log.warn('优雅关闭超时，强制终止 Python 服务')
                        try {
                            this.pythonProcess.kill('SIGKILL')
                        } catch (e) {
                            log.warn('SIGKILL 失败:', e)
                        }

                        // 如果 SIGKILL 也失败，在 Windows 上使用系统命令强制终止进程树
                        if (process.platform === 'win32') {
                            await this.forceKillProcessTree(pid)
                        }
                    }
                    resolve(false)
                }, 3000) // 减少等待时间为 3 秒

                this.pythonProcess?.on('exit', () => {
                    clearTimeout(timeout)
                    log.info(`Python 服务进程 [PID: ${pid}] 已退出`)
                    resolve(true)
                })
            })

            // 确保进程引用被清理
            this.pythonProcess = undefined
            this.status = {
                ...this.status,
                running: false,
                error: undefined
            }

            // 额外检查：验证端口是否真正释放
            setTimeout(async () => {
                const portStillUsed = !(await this.checkPortAvailable())
                if (portStillUsed) {
                    log.warn(`端口 ${this.config.port} 仍被占用，尝试按端口清理进程`)
                    await this.killProcessByPort(this.config.port)
                }
            }, 1000)

            // 最后的清理：杀死所有相关的 Python 进程
            setTimeout(async () => {
                await this.killAllRelatedPythonProcesses()
            }, 2000)

            log.info(`Python 服务已停止 [优雅退出: ${killed}]`)
            return true

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error(`停止 Python 服务失败: ${errorMsg}`)

            // 即使出错也要清理状态
            this.pythonProcess = undefined
            this.status = {
                ...this.status,
                running: false
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
        await new Promise(resolve => setTimeout(resolve, 2000))
        return await this.start()
    }

    /**
     * 重建虚拟环境
     */
    async rebuildEnvironment(): Promise<boolean> {
        log.info('重建 Python 虚拟环境')
        
        // 停止服务
        if (this.status.running) {
            await this.stop()
        }

        // 重置状态
        this.status.venvReady = false

        // 清理缓存
        await this.uvManager.clearCache()

        // 重新设置虚拟环境
        return await this.setupVirtualEnvironment()
    }

    /**
     * 获取服务状态
     */
    getStatus(): UvPythonServiceStatus {
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

            // 尝试多个可能的健康检查端点
            const endpoints = [
                `http://${this.config.host}:${this.config.port}/health`,
                `http://${this.config.host}:${this.config.port}/status`,
                `http://${this.config.host}:${this.config.port}/api/health`
            ]

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        signal: controller.signal
                    })
                    
                    clearTimeout(timeoutId)
                    return response.ok
                } catch (error) {
                    // 继续尝试下一个端点
                    continue
                }
            }

            clearTimeout(timeoutId)
            return false

        } catch (error) {
            log.warn('Python 服务健康检查失败:', error)
            return false
        }
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
    private async waitForServiceReady(timeout = 30000): Promise<void> {
        const startTime = Date.now()
        const endpoints = [
            `http://${this.config.host}:${this.config.port}/health`,
            `http://${this.config.host}:${this.config.port}/status`,
            `http://${this.config.host}:${this.config.port}/api/health`
        ]

        while (Date.now() - startTime < timeout) {
            // 尝试所有可能的端点
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, {
                        signal: AbortSignal.timeout(1000)
                    })

                    if (response.ok) {
                        log.info(`Python 服务就绪，响应端点: ${endpoint}`)
                        return
                    }
                } catch (error) {
                    // 继续尝试
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        throw new Error('等待 Python 服务启动超时')
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        log.info('开始清理 Python 服务...')
        
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout)
        }

        if (this.pythonProcess && this.pythonProcess.pid && this.status.running) {
            const pid = this.pythonProcess.pid
            log.info(`清理时发现进程 ${pid} 仍在运行，尝试强制清理`)

            // 先尝试正常停止
            const stopped = await this.stop()

            // 如果正常停止失败，在 Windows 上使用 taskkill
            if (!stopped && process.platform === 'win32') {
                await this.forceKillProcessTree(pid)
            }
        }

        // 强制清理所有相关的 Python 进程
        if (process.platform === 'win32') {
            try {
                await this.killAllRelatedPythonProcesses()
                await this.killProcessByPort(this.config.port)
            } catch (error) {
                log.warn('强制清理过程中发生错误:', error)
            }
        }

        // 确保状态被重置
        this.pythonProcess = undefined
        this.status = {
            running: false,
            port: this.config.port,
            venvReady: false
        }
        
        log.info('Python 服务清理完成')
    }

    /**
     * 强制清理进程树（Windows 特定）
     */
    private async forceKillProcessTree(pid: number): Promise<boolean> {
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
                    await this.forceKillProcessTree(pid)
                }
            }
            return true
        } catch (error) {
            log.warn(`按端口 ${port} 杀死进程失败:`, error)
            return false
        }
    }

    /**
     * 杀死所有相关的 Python 进程
     */
    private async killAllRelatedPythonProcesses(): Promise<void> {
        if (process.platform !== 'win32') {
            return
        }

        try {
            const venvPath = path.join(this.getProjectPath(), '.venv', 'Scripts', 'python.exe')
            // 转义反斜杠
            const escapedPath = venvPath.replace(/\\/g, '\\\\')
            
            log.info(`清理所有相关的 Python 进程，路径: ${venvPath}`)
            
            // 使用 WMIC 杀死所有相关的 python 进程
            await execAsync(`wmic process where "CommandLine like '%${escapedPath}%'" delete`)
            log.info('成功清理所有相关的 Python 进程')
        } catch (error) {
            log.warn('清理相关 Python 进程失败:', error)
            
            // 备用方案：使用项目路径匹配
            try {
                const projectName = path.basename(this.getProjectPath())
                await execAsync(`taskkill /F /IM python.exe /FI "WINDOWTITLE eq *${projectName}*"`)
                log.info('使用备用方案清理 Python 进程')
            } catch (backupError) {
                log.warn('备用清理方案也失败:', backupError)
            }
        }
    }
}

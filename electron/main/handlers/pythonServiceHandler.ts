import { ipcMain } from 'electron'
import { PythonServiceManager, PythonServiceStatus } from '../services/pythonService'
import log from 'electron-log'

// 全局 Python 服务管理器实例
let pythonServiceManager: PythonServiceManager | null = null

/**
 * 初始化 Python 服务管理器
 */
export function initializePythonService(config?: { host?: string; port?: number; autoStart?: boolean }) {
    if (pythonServiceManager) {
        log.warn('Python 服务管理器已初始化')
        return pythonServiceManager
    }

    pythonServiceManager = new PythonServiceManager(config)
    log.info('Python 服务管理器已初始化')
    return pythonServiceManager
}

/**
 * 获取 Python 服务管理器实例
 */
export function getPythonServiceManager(): PythonServiceManager | null {
    return pythonServiceManager
}

/**
 * 设置 Python 服务相关的 IPC 处理程序
 */
export function setupPythonServiceHandlers() {
    // 启动 Python 服务
    ipcMain.handle('python-service:start', async (event, config?: { host?: string; port?: number }) => {
        try {
            if (!pythonServiceManager) {
                initializePythonService(config)
            }

            const success = await pythonServiceManager!.start()
            log.info(`Python 服务启动${success ? '成功' : '失败'}`)
            return {
                success,
                status: pythonServiceManager!.getStatus(),
                message: success ? 'Python 服务启动成功' : 'Python 服务启动失败'
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error('启动 Python 服务时发生错误:', errorMsg)
            return {
                success: false,
                status: pythonServiceManager?.getStatus() || null,
                message: `启动失败: ${errorMsg}`
            }
        }
    })

    // 停止 Python 服务
    ipcMain.handle('python-service:stop', async () => {
        try {
            if (!pythonServiceManager) {
                return {
                    success: true,
                    status: null,
                    message: 'Python 服务未运行'
                }
            }

            const success = await pythonServiceManager.stop()
            log.info(`Python 服务停止${success ? '成功' : '失败'}`)
            return {
                success,
                status: pythonServiceManager.getStatus(),
                message: success ? 'Python 服务已停止' : 'Python 服务停止失败'
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error('停止 Python 服务时发生错误:', errorMsg)
            return {
                success: false,
                status: pythonServiceManager?.getStatus() || null,
                message: `停止失败: ${errorMsg}`
            }
        }
    })

    // 重启 Python 服务
    ipcMain.handle('python-service:restart', async () => {
        try {
            if (!pythonServiceManager) {
                initializePythonService()
            }

            const success = await pythonServiceManager!.restart()
            log.info(`Python 服务重启${success ? '成功' : '失败'}`)
            return {
                success,
                status: pythonServiceManager!.getStatus(),
                message: success ? 'Python 服务重启成功' : 'Python 服务重启失败'
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error('重启 Python 服务时发生错误:', errorMsg)
            return {
                success: false,
                status: pythonServiceManager?.getStatus() || null,
                message: `重启失败: ${errorMsg}`
            }
        }
    })

    // 获取 Python 服务状态
    ipcMain.handle('python-service:status', async () => {
        try {
            if (!pythonServiceManager) {
                return {
                    success: true,
                    status: {
                        running: false,
                        port: 8000
                    } as PythonServiceStatus,
                    message: 'Python 服务未初始化'
                }
            }

            const status = pythonServiceManager.getStatus()
            return {
                success: true,
                status,
                message: status.running ? 'Python 服务运行中' : 'Python 服务未运行'
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error('获取 Python 服务状态时发生错误:', errorMsg)
            return {
                success: false,
                status: null,
                message: `获取状态失败: ${errorMsg}`
            }
        }
    })

    // 检查 Python 服务健康状态
    ipcMain.handle('python-service:health', async () => {
        try {
            if (!pythonServiceManager) {
                return {
                    success: false,
                    healthy: false,
                    message: 'Python 服务未初始化'
                }
            }

            const healthy = await pythonServiceManager.checkHealth()
            return {
                success: true,
                healthy,
                message: healthy ? 'Python 服务健康' : 'Python 服务不健康'
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            log.error('检查 Python 服务健康状态时发生错误:', errorMsg)
            return {
                success: false,
                healthy: false,
                message: `健康检查失败: ${errorMsg}`
            }
        }
    })

    log.info('Python 服务 IPC 处理程序已设置')
}

/**
 * 自动启动 Python 服务
 */
export async function autoStartPythonService(config?: { host?: string; port?: number }) {
    try {
        if (!pythonServiceManager) {
            initializePythonService({ autoStart: true, ...config })
        }

        log.info('尝试自动启动 Python 服务...')
        const success = await pythonServiceManager!.start()

        if (success) {
            log.info('Python 服务自动启动成功')
        } else {
            log.warn('Python 服务自动启动失败')
        }

        return success
    } catch (error) {
        log.error('自动启动 Python 服务时发生错误:', error)
        return false
    }
}

/**
 * 清理 Python 服务
 */
export async function cleanupPythonService() {
    if (pythonServiceManager) {
        log.info('清理 Python 服务...')
        await pythonServiceManager.cleanup()
        pythonServiceManager = null
        log.info('Python 服务已清理')
    }
} 
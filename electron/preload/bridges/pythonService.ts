import { contextBridge, ipcRenderer } from 'electron'

export interface PythonServiceStatus {
    running: boolean
    pid?: number
    port: number
    startTime?: Date
    error?: string
}

export interface PythonServiceResponse {
    success: boolean
    status?: PythonServiceStatus | null
    message: string
}

export interface PythonServiceHealthResponse {
    success: boolean
    healthy: boolean
    message: string
}

/**
 * Python 服务 API
 */
const pythonServiceApi = {
    /**
     * 启动 Python 服务
     */
    async start(config?: { host?: string; port?: number }): Promise<PythonServiceResponse> {
        return await ipcRenderer.invoke('python-service:start', config)
    },

    /**
     * 停止 Python 服务
     */
    async stop(): Promise<PythonServiceResponse> {
        return await ipcRenderer.invoke('python-service:stop')
    },

    /**
     * 重启 Python 服务
     */
    async restart(): Promise<PythonServiceResponse> {
        return await ipcRenderer.invoke('python-service:restart')
    },

    /**
     * 获取 Python 服务状态
     */
    async getStatus(): Promise<PythonServiceResponse> {
        return await ipcRenderer.invoke('python-service:status')
    },

    /**
     * 检查 Python 服务健康状态
     */
    async checkHealth(): Promise<PythonServiceHealthResponse> {
        return await ipcRenderer.invoke('python-service:health')
    }
}

// 暴露 Python 服务 API 到渲染进程
contextBridge.exposeInMainWorld('pythonServiceApi', pythonServiceApi) 
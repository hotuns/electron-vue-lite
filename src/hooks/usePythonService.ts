import { ref, reactive, onMounted, onUnmounted, readonly } from 'vue'

export interface PythonServiceStatus {
    running: boolean
    pid?: number
    port: number
    startTime?: Date
    error?: string
}

/**
 * Python 服务管理 Hook
 */
export function usePythonService() {
    // 服务状态
    const status = ref<PythonServiceStatus>({
        running: false,
        port: 8000
    })

    // 健康状态
    const isHealthy = ref(false)

    // 加载状态
    const loading = reactive({
        starting: false,
        stopping: false,
        restarting: false,
        checking: false
    })

    // 错误信息
    const error = ref<string | null>(null)

    // 定时器
    let statusCheckInterval: NodeJS.Timeout | null = null

    /**
     * 获取服务状态
     */
    const getStatus = async () => {
        try {
            loading.checking = true
            error.value = null

            const response = await window.pythonServiceApi.getStatus()

            if (response.success && response.status) {
                status.value = response.status
            } else {
                error.value = response.message
            }

            return response
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            error.value = `获取状态失败: ${errorMsg}`
            console.error('获取 Python 服务状态失败:', err)
        } finally {
            loading.checking = false
        }
    }

    /**
     * 检查健康状态
     */
    const checkHealth = async () => {
        try {
            const response = await window.pythonServiceApi.checkHealth()

            if (response.success) {
                isHealthy.value = response.healthy
            } else {
                isHealthy.value = false
                error.value = response.message
            }

            return response
        } catch (err) {
            isHealthy.value = false
            const errorMsg = err instanceof Error ? err.message : String(err)
            error.value = `健康检查失败: ${errorMsg}`
            console.error('Python 服务健康检查失败:', err)
        }
    }

    /**
     * 启动服务
     */
    const start = async (config?: { host?: string; port?: number }) => {
        try {
            loading.starting = true
            error.value = null

            const response = await window.pythonServiceApi.start(config)

            if (response.success && response.status) {
                status.value = response.status
                // 启动成功后检查健康状态
                setTimeout(checkHealth, 1000)
            } else {
                error.value = response.message
            }

            return response
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            error.value = `启动失败: ${errorMsg}`
            console.error('启动 Python 服务失败:', err)
            return {
                success: false,
                message: errorMsg
            }
        } finally {
            loading.starting = false
        }
    }

    /**
     * 停止服务
     */
    const stop = async () => {
        try {
            loading.stopping = true
            error.value = null

            const response = await window.pythonServiceApi.stop()

            if (response.success && response.status) {
                status.value = response.status
                isHealthy.value = false
            } else {
                error.value = response.message
            }

            return response
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            error.value = `停止失败: ${errorMsg}`
            console.error('停止 Python 服务失败:', err)
            return {
                success: false,
                message: errorMsg
            }
        } finally {
            loading.stopping = false
        }
    }

    /**
     * 重启服务
     */
    const restart = async () => {
        try {
            loading.restarting = true
            error.value = null

            const response = await window.pythonServiceApi.restart()

            if (response.success && response.status) {
                status.value = response.status
                // 重启成功后检查健康状态
                setTimeout(checkHealth, 1000)
            } else {
                error.value = response.message
            }

            return response
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            error.value = `重启失败: ${errorMsg}`
            console.error('重启 Python 服务失败:', err)
            return {
                success: false,
                message: errorMsg
            }
        } finally {
            loading.restarting = false
        }
    }

    /**
     * 启动状态检查定时器
     */
    const startStatusMonitoring = (interval = 5000) => {
        stopStatusMonitoring()

        statusCheckInterval = setInterval(async () => {
            await getStatus()

            // 如果服务运行中，检查健康状态
            if (status.value.running) {
                await checkHealth()
            }
        }, interval)
    }

    /**
     * 停止状态检查定时器
     */
    const stopStatusMonitoring = () => {
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            statusCheckInterval = null
        }
    }

    /**
     * 清除错误信息
     */
    const clearError = () => {
        error.value = null
    }

    // 组件挂载时获取初始状态
    onMounted(async () => {
        await getStatus()

        // 如果服务运行中，检查健康状态
        if (status.value.running) {
            await checkHealth()
        }

        // 启动状态监控
        startStatusMonitoring()
    })

    // 组件卸载时清理定时器
    onUnmounted(() => {
        stopStatusMonitoring()
    })

    return {
        // 状态
        status: readonly(status),
        isHealthy: readonly(isHealthy),
        loading: readonly(loading),
        error: readonly(error),

        // 方法
        start,
        stop,
        restart,
        getStatus,
        checkHealth,
        startStatusMonitoring,
        stopStatusMonitoring,
        clearError
    }
} 
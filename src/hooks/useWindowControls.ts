import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 窗口控制Hook
 * 处理窗口的最小化、最大化、关闭等操作
 */
export function useWindowControls() {
    const isMaximized = ref(false)

    // 最小化窗口
    const minimizeWindow = async (): Promise<boolean> => {
        try {
            return await window.windowControls.minimize()
        } catch (error) {
            console.error('最小化窗口失败:', error)
            return false
        }
    }

    // 切换最大化状态
    const toggleMaximize = async (): Promise<boolean> => {
        try {
            return await window.windowControls.maximize()
        } catch (error) {
            console.error('切换最大化失败:', error)
            return false
        }
    }

    // 关闭窗口
    const closeWindow = async (): Promise<boolean> => {
        try {
            return await window.windowControls.close()
        } catch (error) {
            console.error('关闭窗口失败:', error)
            return false
        }
    }

    // 检查窗口最大化状态
    const checkMaximizedState = async (): Promise<void> => {
        try {
            isMaximized.value = await window.windowControls.isMaximized()
        } catch (error) {
            console.error('检查窗口状态失败:', error)
        }
    }

    // 设置窗口状态监听器
    const setupWindowStateListeners = (): void => {
        if (window.windowControls) {
            // 监听窗口最大化事件
            window.windowControls.onMaximize(() => {
                isMaximized.value = true
            })

            // 监听窗口还原事件
            window.windowControls.onUnmaximize(() => {
                isMaximized.value = false
            })
        }
    }

    // 清理监听器
    const cleanupWindowStateListeners = (): void => {
        if (window.windowControls) {
            window.windowControls.removeAllListeners('window-maximized')
            window.windowControls.removeAllListeners('window-unmaximized')
        }
    }

    // 初始化
    onMounted(() => {
        setupWindowStateListeners()
        checkMaximizedState()
    })

    onUnmounted(() => {
        cleanupWindowStateListeners()
    })

    return {
        isMaximized,
        minimizeWindow,
        toggleMaximize,
        closeWindow,
        checkMaximizedState
    }
} 
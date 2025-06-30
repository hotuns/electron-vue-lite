import { ref, onMounted, onUnmounted } from 'vue'

// 窗口信息接口
export interface WindowInfo {
    windowId: string
    title: string
    isMainWindow: boolean
}

export interface WindowListItem {
    id: string
    title: string
    visible: boolean
    focused: boolean
}

export interface CreateWindowOptions {
    title?: string
    width?: number
    height?: number
    route?: string
    modal?: boolean
}

/**
 * 窗口管理Hook
 * 处理多窗口的创建、管理和通信
 */
export function useWindowManager() {
    const currentWindowInfo = ref<WindowInfo | null>(null)
    const windowList = ref<WindowListItem[]>([])

    // 创建新窗口
    const createWindow = async (options: CreateWindowOptions = {}): Promise<string | null> => {
        try {
            const windowId = await window.windowAPI.createWindow({
                title: options.title || '新窗口',
                width: options.width || 800,
                height: options.height || 600,
                route: options.route || '/',
                modal: options.modal || false
            })

            console.log('窗口创建成功:', windowId)
            await refreshWindowList()
            return windowId
        } catch (error) {
            console.error('创建窗口失败:', error)
            return null
        }
    }

    // 关闭指定窗口
    const closeWindow = async (windowId: string): Promise<boolean> => {
        try {
            const success = await window.windowAPI.closeWindow(windowId)
            if (success) {
                await refreshWindowList()
            }
            return success
        } catch (error) {
            console.error('关闭窗口失败:', error)
            return false
        }
    }

    // 聚焦到指定窗口
    const focusWindow = async (windowId: string): Promise<boolean> => {
        try {
            return await window.windowAPI.focusWindow(windowId)
        } catch (error) {
            console.error('聚焦窗口失败:', error)
            return false
        }
    }

    // 刷新窗口列表
    const refreshWindowList = async (): Promise<void> => {
        try {
            windowList.value = await window.windowAPI.getWindowList()
        } catch (error) {
            console.error('获取窗口列表失败:', error)
        }
    }

    // 向指定窗口发送消息
    const sendMessageToWindow = async (
        targetWindowId: string,
        channel: string,
        data?: any
    ): Promise<boolean> => {
        try {
            return await window.windowAPI.sendToWindow(targetWindowId, channel, data)
        } catch (error) {
            console.error('发送消息失败:', error)
            return false
        }
    }

    // 广播消息到所有窗口
    const broadcastMessage = async (channel: string, data?: any): Promise<boolean> => {
        try {
            return await window.windowAPI.broadcast(channel, data)
        } catch (error) {
            console.error('广播消息失败:', error)
            return false
        }
    }

    // 设置窗口事件监听器
    const setupWindowEventListeners = (): void => {
        if (window.windowAPI) {
            // 监听窗口信息
            window.windowAPI.onWindowInfo((info: WindowInfo) => {
                currentWindowInfo.value = info
            })

            // 监听窗口关闭事件
            window.windowAPI.onWindowClosed((data: { windowId: string }) => {
                console.log('窗口已关闭:', data.windowId)
                refreshWindowList()
            })

            // 监听窗口焦点事件
            window.windowAPI.onWindowFocus((data: { windowId: string }) => {
                console.log('窗口获得焦点:', data.windowId)
                refreshWindowList()
            })

            window.windowAPI.onWindowBlur((data: { windowId: string }) => {
                console.log('窗口失去焦点:', data.windowId)
                refreshWindowList()
            })
        }
    }

    // 清理窗口事件监听器
    const cleanupWindowEventListeners = (): void => {
        if (window.windowAPI) {
            window.windowAPI.removeAllListeners('window-info')
            window.windowAPI.removeAllListeners('window-closed')
            window.windowAPI.removeAllListeners('window-focus')
            window.windowAPI.removeAllListeners('window-blur')
        }
    }

    // 初始化
    onMounted(() => {
        setupWindowEventListeners()
        refreshWindowList()
    })

    onUnmounted(() => {
        cleanupWindowEventListeners()
    })

    return {
        // 状态
        currentWindowInfo,
        windowList,

        // 方法
        createWindow,
        closeWindow,
        focusWindow,
        refreshWindowList,
        sendMessageToWindow,
        broadcastMessage
    }
} 
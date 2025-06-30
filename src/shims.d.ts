/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

interface Window {
    // expose in the `electron/preload/index.ts`
    ipcRenderer: import('electron').IpcRenderer

    // 存储 API
    storeAPI: {
        get(key: string): Promise<any>
        set(key: string, value: any): Promise<boolean>
        delete(key: string): Promise<boolean>
        clear(): Promise<boolean>
        getAll(): Promise<Record<string, any>>
        has(key: string): Promise<boolean>
        onChanged(callback: (data: { key: string; value: any; timestamp: number }) => void): void
        onDeleted(callback: (data: { key: string; timestamp: number }) => void): void
        onCleared(callback: (data: { timestamp: number }) => void): void
        removeListener(channel: string, callback?: (...args: any[]) => void): void
        removeAllListeners(channel: string): void
    }

    // 应用功能 API
    appAPI: {
        reload(): Promise<boolean>
        forceReload(): Promise<boolean>
        toggleDevTools(): Promise<boolean>
        showAllWindows(): Promise<boolean>
        quit(): Promise<boolean>
        getVersion(): Promise<string>
        getAppInfo(): Promise<{
            name: string
            version: string
            electronVersion: string
            nodeVersion: string
            platform: string
            arch: string
        }>
    }

    // 窗口控制 API
    windowControls: {
        minimize(): Promise<boolean>
        maximize(): Promise<boolean>
        close(): Promise<boolean>
        isMaximized(): Promise<boolean>
        onMaximize(callback: () => void): void
        onUnmaximize(callback: () => void): void
        removeAllListeners(channel: string): void
    }

    // 窗口管理 API
    windowAPI: {
        // 创建新窗口
        createWindow(options?: {
            title?: string
            width?: number
            height?: number
            route?: string
            modal?: boolean
        }): Promise<string>

        // 关闭窗口
        closeWindow(windowId?: string): Promise<boolean>

        // 获取窗口列表
        getWindowList(): Promise<Array<{
            id: string
            title: string
            visible: boolean
            focused: boolean
        }>>

        // 向指定窗口发送消息
        sendToWindow(targetWindowId: string, channel: string, data?: any): Promise<boolean>

        // 广播消息到所有窗口
        broadcast(channel: string, data?: any): Promise<boolean>

        // 聚焦到指定窗口
        focusWindow(windowId: string): Promise<boolean>

        // 监听窗口事件
        onWindowInfo(callback: (windowInfo: {
            windowId: string
            title: string
            isMainWindow: boolean
        }) => void): void

        onWindowClosed(callback: (data: { windowId: string }) => void): void
        onWindowFocus(callback: (data: { windowId: string }) => void): void
        onWindowBlur(callback: (data: { windowId: string }) => void): void

        // 移除监听器
        removeListener(channel: string, callback?: (...args: any[]) => void): void
        removeAllListeners(channel: string): void
    }
}
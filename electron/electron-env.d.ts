/// <reference types="vite-plugin-electron/electron-env" />
/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬ dist-electron
     * │ ├─┬ main
     * │ │ └── index.js    > Electron-Main
     * │ └─┬ preload
     * │   └── index.mjs   > Preload-Scripts
     * ├─┬ dist
     * │ └── index.html    > Electron-Renderer
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

interface Window {
  // Expose some Api through preload script
  ipcRenderer: {
    on(channel: string, func: (...args: any[]) => void): void
    off(channel: string, func: (...args: any[]) => void): void
    send(channel: string, ...args: any[]): void
    invoke(channel: string, ...args: any[]): Promise<any>
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

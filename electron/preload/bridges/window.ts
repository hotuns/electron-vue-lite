import { contextBridge, ipcRenderer } from 'electron'

// 窗口信息接口
interface WindowInfo {
  windowId: string
  title: string
  isMainWindow: boolean
}

// 窗口列表项接口
interface WindowListItem {
  id: string
  title: string
  visible: boolean
  focused: boolean
}

// --------- 窗口管理 API ---------
contextBridge.exposeInMainWorld('windowAPI', {
  // 创建新窗口
  createWindow: (options?: {
    title?: string
    width?: number
    height?: number
    route?: string
    modal?: boolean
  }): Promise<string> => {
    return ipcRenderer.invoke('window:create', options)
  },

  // 关闭窗口
  closeWindow: (windowId?: string): Promise<boolean> => {
    return ipcRenderer.invoke('window:close', windowId)
  },

  // 获取窗口列表
  getWindowList: (): Promise<WindowListItem[]> => {
    return ipcRenderer.invoke('window:list')
  },

  // 向指定窗口发送消息
  sendToWindow: (targetWindowId: string, channel: string, data?: any): Promise<boolean> => {
    return ipcRenderer.invoke('window:send-message', targetWindowId, channel, data)
  },

  // 广播消息到所有窗口
  broadcast: (channel: string, data?: any): Promise<boolean> => {
    return ipcRenderer.invoke('window:broadcast', channel, data)
  },

  // 聚焦到指定窗口
  focusWindow: (windowId: string): Promise<boolean> => {
    return ipcRenderer.invoke('window:focus', windowId)
  },

  // 监听窗口事件
  onWindowInfo: (callback: (windowInfo: WindowInfo) => void) => {
    return ipcRenderer.on('window-info', (_, windowInfo) => callback(windowInfo))
  },

  onWindowClosed: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-closed', (_, data) => callback(data))
  },

  onWindowFocus: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-focus', (_, data) => callback(data))
  },

  onWindowBlur: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-blur', (_, data) => callback(data))
  },

  // 移除监听器
  removeListener: (channel: string, callback?: (...args: any[]) => void) => {
    return ipcRenderer.removeListener(channel, callback)
  },

  removeAllListeners: (channel: string) => {
    return ipcRenderer.removeAllListeners(channel)
  }
}) 
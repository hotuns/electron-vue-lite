import { contextBridge, ipcRenderer } from 'electron'

// --------- 窗口控制 API ---------
contextBridge.exposeInMainWorld('windowControls', {
  // 最小化窗口
  minimize: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:minimize')
  },

  // 最大化/还原窗口
  maximize: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:maximize')
  },

  // 关闭窗口
  close: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:close')
  },

  // 检查窗口是否最大化
  isMaximized: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:is-maximized')
  },

  // 监听窗口状态变化
  onMaximize: (callback: () => void) => {
    return ipcRenderer.on('window-maximized', callback)
  },

  onUnmaximize: (callback: () => void) => {
    return ipcRenderer.on('window-unmaximized', callback)
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    return ipcRenderer.removeAllListeners(channel)
  }
}) 
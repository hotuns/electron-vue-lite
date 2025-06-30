import { contextBridge, ipcRenderer } from 'electron'

// --------- 应用功能 API ---------
contextBridge.exposeInMainWorld('appAPI', {
  // 重新加载应用
  reload: (): Promise<boolean> => {
    return ipcRenderer.invoke('app:reload')
  },

  // 强制重新加载
  forceReload: (): Promise<boolean> => {
    return ipcRenderer.invoke('app:force-reload')
  },

  // 切换开发者工具
  toggleDevTools: (): Promise<boolean> => {
    return ipcRenderer.invoke('app:toggle-devtools')
  },

  // 显示所有窗口
  showAllWindows: (): Promise<boolean> => {
    return ipcRenderer.invoke('app:show-all-windows')
  },

  // 退出应用
  quit: (): Promise<boolean> => {
    return ipcRenderer.invoke('app:quit')
  },

  // 获取应用版本
  getVersion: (): Promise<string> => {
    return ipcRenderer.invoke('app:get-version')
  },

  // 获取应用信息
  getAppInfo: (): Promise<{
    name: string
    version: string
    electronVersion: string
    nodeVersion: string
    platform: string
    arch: string
  }> => {
    return ipcRenderer.invoke('app:get-app-info')
  }
}) 
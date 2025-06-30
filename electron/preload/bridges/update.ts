import { contextBridge, ipcRenderer } from 'electron'

export interface UpdateInfo {
  version: string
  files: any[]
  path: string
  sha512: string
  releaseDate: string
}

export interface DownloadProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

// --------- 更新功能 API ---------
contextBridge.exposeInMainWorld('updateAPI', {
  // 检查更新
  checkForUpdates: (): Promise<{ success: boolean; updateInfo?: UpdateInfo; error?: string }> => {
    return ipcRenderer.invoke('app:check-for-updates')
  },

  // 下载更新
  downloadUpdate: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('app:download-update')
  },

  // 安装更新并重启
  installUpdate: (): Promise<void> => {
    return ipcRenderer.invoke('app:install-update')
  },

  // 获取当前版本
  getVersion: (): Promise<string> => {
    return ipcRenderer.invoke('app:get-version')
  },

  // 监听更新事件
  onCheckingForUpdate: (callback: () => void) => {
    ipcRenderer.on('update:checking-for-update', callback)
    return () => ipcRenderer.removeListener('update:checking-for-update', callback)
  },

  onUpdateAvailable: (callback: (updateInfo: UpdateInfo) => void) => {
    const handler = (event: any, updateInfo: UpdateInfo) => callback(updateInfo)
    ipcRenderer.on('update:update-available', handler)
    return () => ipcRenderer.removeListener('update:update-available', handler)
  },

  onUpdateNotAvailable: (callback: (info: any) => void) => {
    const handler = (event: any, info: any) => callback(info)
    ipcRenderer.on('update:update-not-available', handler)
    return () => ipcRenderer.removeListener('update:update-not-available', handler)
  },

  onUpdateError: (callback: (error: string) => void) => {
    const handler = (event: any, error: string) => callback(error)
    ipcRenderer.on('update:error', handler)
    return () => ipcRenderer.removeListener('update:error', handler)
  },

  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (event: any, progress: DownloadProgress) => callback(progress)
    ipcRenderer.on('update:download-progress', handler)
    return () => ipcRenderer.removeListener('update:download-progress', handler)
  },

  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    const handler = (event: any, info: UpdateInfo) => callback(info)
    ipcRenderer.on('update:update-downloaded', handler)
    return () => ipcRenderer.removeListener('update:update-downloaded', handler)
  }
}) 
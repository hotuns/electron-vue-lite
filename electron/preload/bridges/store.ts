import { contextBridge, ipcRenderer } from 'electron'

// --------- 存储 API ---------
contextBridge.exposeInMainWorld('storeAPI', {
  // 获取存储数据
  get: (key: string): Promise<any> => {
    return ipcRenderer.invoke('store:get', key)
  },

  // 设置存储数据
  set: (key: string, value: any): Promise<boolean> => {
    return ipcRenderer.invoke('store:set', key, value)
  },

  // 删除存储数据
  delete: (key: string): Promise<boolean> => {
    return ipcRenderer.invoke('store:delete', key)
  },

  // 清空存储
  clear: (): Promise<boolean> => {
    return ipcRenderer.invoke('store:clear')
  },

  // 获取所有存储数据
  getAll: (): Promise<Record<string, any>> => {
    return ipcRenderer.invoke('store:getAll')
  },

  // 检查键是否存在
  has: (key: string): Promise<boolean> => {
    return ipcRenderer.invoke('store:has', key)
  },

  // 监听存储变化
  onChanged: (callback: (data: { key: string; value: any; timestamp: number }) => void) => {
    return ipcRenderer.on('store:changed', (_, data) => callback(data))
  },

  onDeleted: (callback: (data: { key: string; timestamp: number }) => void) => {
    return ipcRenderer.on('store:deleted', (_, data) => callback(data))
  },

  onCleared: (callback: (data: { timestamp: number }) => void) => {
    return ipcRenderer.on('store:cleared', (_, data) => callback(data))
  },

  // 移除监听器
  removeListener: (channel: string, callback?: (...args: any[]) => void) => {
    return ipcRenderer.removeListener(channel, callback)
  },

  removeAllListeners: (channel: string) => {
    return ipcRenderer.removeAllListeners(channel)
  }
}) 
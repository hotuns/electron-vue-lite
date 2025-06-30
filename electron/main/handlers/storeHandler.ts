import { ipcMain } from 'electron'
import { WindowManager } from '../window/WindowManager'
import { store } from '../store/store'

export function setupStoreHandlers(windowManager: WindowManager) {
  // 获取存储数据
  ipcMain.handle('store:get', (event, key: string) => {
    try {
      return (store as any).get(key)
    } catch (error) {
      console.error('获取存储数据失败:', error)
      return null
    }
  })

  // 设置存储数据
  ipcMain.handle('store:set', (event, key: string, value: any) => {
    try {
      ; (store as any).set(key, value)

      // 广播数据变更到所有窗口
      windowManager.broadcastToAll('store:changed', {
        key,
        value,
        timestamp: Date.now()
      })

      return true
    } catch (error) {
      console.error('设置存储数据失败:', error)
      return false
    }
  })

  // 删除存储数据
  ipcMain.handle('store:delete', (event, key: string) => {
    try {
      ; (store as any).delete(key)

      // 广播数据删除到所有窗口
      windowManager.broadcastToAll('store:deleted', {
        key,
        timestamp: Date.now()
      })

      return true
    } catch (error) {
      console.error('删除存储数据失败:', error)
      return false
    }
  })

  // 清空存储
  ipcMain.handle('store:clear', (event) => {
    try {
      ; (store as any).clear()

      // 广播清空事件到所有窗口
      windowManager.broadcastToAll('store:cleared', {
        timestamp: Date.now()
      })

      return true
    } catch (error) {
      console.error('清空存储失败:', error)
      return false
    }
  })

  // 获取所有存储数据
  ipcMain.handle('store:getAll', (event) => {
    try {
      return (store as any).store
    } catch (error) {
      console.error('获取所有存储数据失败:', error)
      return {}
    }
  })

  // 检查键是否存在
  ipcMain.handle('store:has', (event, key: string) => {
    try {
      return (store as any).has(key)
    } catch (error) {
      console.error('检查存储键失败:', error)
      return false
    }
  })
} 
import { ipcMain, BrowserWindow } from 'electron'
import { WindowManager } from '../window/WindowManager'

export function setupWindowHandlers(windowManager: WindowManager) {
  // 创建新窗口
  ipcMain.handle('window:create', async (event, options: {
    title?: string
    width?: number
    height?: number
    route?: string
    modal?: boolean
  }) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    return await windowManager.createWindow({
      ...options,
      parent: options.modal ? senderWindow || undefined : undefined
    })
  })

  // 关闭窗口
  ipcMain.handle('window:close', (event, windowId?: string) => {
    if (windowId) {
      return windowManager.closeWindow(windowId)
    } else {
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      if (senderWindow) {
        senderWindow.close()
        return true
      }
    }
    return false
  })

  // 获取窗口列表
  ipcMain.handle('window:list', () => {
    return windowManager.getWindowsInfo()
  })

  // 向指定窗口发送消息
  ipcMain.handle('window:send-message', (event, targetWindowId: string, channel: string, data?: any) => {
    windowManager.sendToWindow(targetWindowId, channel, data)
    return true
  })

  // 广播消息到所有窗口
  ipcMain.handle('window:broadcast', (event, channel: string, data?: any) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    const senderWindowId = senderWindow ? windowManager.getWindowId(senderWindow) : undefined

    windowManager.broadcastToAll(channel, {
      ...data,
      fromWindowId: senderWindowId
    })
    return true
  })

  // 窗口焦点控制
  ipcMain.handle('window:focus', (event, windowId: string) => {
    const window = windowManager.getWindow(windowId)
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore()
      window.focus()
      return true
    }
    return false
  })

  // 兼容旧的 open-win 处理程序
  ipcMain.handle('open-win', (event, arg) => {
    return windowManager.createWindow({
      route: arg,
      title: `新窗口 - ${arg}`
    })
  })

  // 窗口控制处理程序
  ipcMain.handle('window-control:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.minimize()
      return true
    }
    return false
  })

  ipcMain.handle('window-control:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
      return true
    }
    return false
  })

  ipcMain.handle('window-control:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.close()
      return true
    }
    return false
  })

  ipcMain.handle('window-control:is-maximized', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window ? window.isMaximized() : false
  })
} 
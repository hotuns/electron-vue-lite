import { ipcMain, BrowserWindow, app } from 'electron'
import { WindowManager } from '../window/WindowManager'

export function setupAppHandlers(windowManager: WindowManager) {
  // 应用菜单功能处理程序
  ipcMain.handle('app:reload', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.reload()
      return true
    }
    return false
  })

  ipcMain.handle('app:force-reload', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.webContents.reloadIgnoringCache()
      return true
    }
    return false
  })

  ipcMain.handle('app:toggle-devtools', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      window.webContents.toggleDevTools()
      return true
    }
    return false
  })

  ipcMain.handle('app:show-all-windows', () => {
    windowManager.getAllWindows().forEach(window => {
      if (window.isMinimized()) window.restore()
      window.show()
    })
    return true
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
    return true
  })

  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:get-app-info', () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch
    }
  })
} 
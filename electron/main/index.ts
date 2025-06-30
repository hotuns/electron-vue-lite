import { app, BrowserWindow, shell, ipcMain, Menu, MenuItemConstructorOptions } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import ElectronStore from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

import { WindowManager } from './window/WindowManager'
import { createMenu } from './window/menu'
import { setupWindowHandlers } from './handlers/windowHandler'
import { setupAppHandlers } from './handlers/appHandler'
import { setupStoreHandlers } from './handlers/storeHandler'
import { setupUpdateHandlers } from './handlers/updateHandler'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// 创建窗口管理器实例
const windowManager = new WindowManager(
  path.join(__dirname, '../preload/index.mjs'),
  path.join(RENDERER_DIST, 'index.html'),
  VITE_DEV_SERVER_URL
)

// 应用启动
app.whenReady().then(async () => {
  // 创建菜单
  createMenu(windowManager)

  // 设置 IPC 处理程序
  setupWindowHandlers(windowManager)
  setupAppHandlers(windowManager)
  setupStoreHandlers(windowManager)
  setupUpdateHandlers(windowManager)

  // 创建主窗口
  await windowManager.createWindow({
    windowId: 'main',
    title: '  应用 - 主窗口',
    width: 1200,
    height: 800
  })
})

// macOS 退出处理
let isQuitting = false

app.on('before-quit', (event) => {
  // 在 macOS 上，Command+Q 会触发此事件
  console.log('应用即将退出')
  isQuitting = true
  
  // 关闭所有窗口
  const windows = windowManager.getAllWindows()
  windows.forEach(window => {
    if (!window.isDestroyed()) {
      window.destroy() // 强制关闭窗口
    }
  })
})

app.on('will-quit', (event) => {
  // 应用即将退出，可以在这里执行清理工作
  console.log('应用正在退出')
})

// 处理窗口关闭事件，防止阻止退出
app.on('window-all-closed', () => {
  // 在 macOS 上，通常应用不会完全退出，除非用户明确退出
  if (process.platform !== 'darwin' || isQuitting) {
    app.quit()
  }
})

app.on('second-instance', () => {
  const windows = windowManager.getAllWindows()
  if (windows.length > 0) {
    const mainWindow = windows[0]
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const windows = windowManager.getAllWindows()
  if (windows.length === 0) {
    windowManager.createWindow({
      windowId: 'main',
      title: '主窗口'
    })
  } else {
    windows[0].focus()
  }
})

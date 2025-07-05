import { app } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import log from 'electron-log'

// 配置electron-log
log.transports.console.level = 'debug'
log.transports.file.level = 'debug'
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] {text}'

// 设置控制台编码以支持中文
if (process.platform === 'win32') {
  try {
    // 设置控制台代码页为UTF-8
    process.stdout.setDefaultEncoding('utf8')
    process.stderr.setDefaultEncoding('utf8')
  } catch (error) {
    log.error('Failed to set console encoding:', error)
  }
}

import { WindowManager } from './window/WindowManager'
import { createMenu } from './window/menu'
import { setupWindowHandlers } from './handlers/windowHandler'
import { setupAppHandlers } from './handlers/appHandler'
import { setupStoreHandlers } from './handlers/storeHandler'
import { setupUpdateHandlers } from './handlers/updateHandler'
import { setupPythonServiceHandlers, autoStartPythonService, cleanupPythonService } from './handlers/pythonServiceHandler'
import { readFileSync } from 'node:fs'

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
  setupPythonServiceHandlers()

  // 自动启动 Python 服务
  log.info('正在启动 Python 服务...')
  await autoStartPythonService()

  // 创建主窗口
  await windowManager.createWindow({
    windowId: 'main',
    width: 800,
    height: 600
  })
})

// macOS 退出处理
let isQuitting = false

// 标记是否已经在清理过程中
let isCleaningUp = false

app.on('before-quit', (event) => {
  // 在 macOS 上，Command+Q 会触发此事件
  log.info('应用即将退出')

  if (!isCleaningUp) {
    isQuitting = true
    isCleaningUp = true

    // 阻止默认退出行为，等待清理完成
    event.preventDefault()

    // 异步执行清理工作
    performCleanup()
  }
})

async function performCleanup() {
  try {
    log.info('开始清理资源...')

    // 清理 Python 服务
    log.info('正在清理 Python 服务...')
    await cleanupPythonService()

    // 关闭所有窗口
    const windows = windowManager.getAllWindows()
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.destroy() // 强制关闭窗口
      }
    })

    log.info('清理完成，退出应用')
    // 完成清理后真正退出
    app.exit(0)
  } catch (error) {
    log.error('退出清理过程中发生错误:', error)
    app.exit(1)
  }
}

app.on('will-quit', (event) => {
  // 应用即将退出，可以在这里执行清理工作
  log.info('应用正在退出')
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
      windowId: 'main'
    })
  } else {
    windows[0].focus()
  }
})

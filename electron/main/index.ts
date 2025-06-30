import { app, BrowserWindow, shell, ipcMain, Menu, MenuItemConstructorOptions } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import ElectronStore from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

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

// 窗口管理器类
class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()
  private windowCounter = 0
  private preload = path.join(__dirname, '../preload/index.mjs')
  private indexHtml = path.join(RENDERER_DIST, 'index.html')

  // 获取所有窗口
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values())
  }

  // 获取指定窗口
  getWindow(windowId: string): BrowserWindow | undefined {
    return this.windows.get(windowId)
  }

  // 获取窗口ID
  getWindowId(window: BrowserWindow): string | undefined {
    for (const [id, win] of Array.from(this.windows.entries())) {
      if (win === window) return id
    }
    return undefined
  }

  // 创建新窗口
  async createWindow(options: {
    windowId?: string
    title?: string
    width?: number
    height?: number
    route?: string
    parent?: BrowserWindow
    modal?: boolean
    show?: boolean
  } = {}): Promise<string> {
    const windowId = options.windowId || uuidv4()

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: options.title || `窗口 ${this.windowCounter}`,
      width: options.width || 1200,
      height: options.height || 800,
      icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
      show: options.show !== false,
      frame: false, // 禁用默认标题栏
      titleBarStyle: 'hidden', // 隐藏标题栏
      webPreferences: {
        preload: this.preload,
        contextIsolation: true,
        nodeIntegration: false,
      },
    }

    // 如果有父窗口，设置模态窗口
    if (options.parent) {
      windowOptions.parent = options.parent
      windowOptions.modal = options.modal || false
    }

    const window = new BrowserWindow(windowOptions)

    // 加载页面
    const route = options.route || '/'
    if (VITE_DEV_SERVER_URL) {
      await window.loadURL(`${VITE_DEV_SERVER_URL}#${route}`)
      // 开发模式下打开开发者工具
      if (this.windowCounter === 1) {
        window.webContents.openDevTools()
      }
    } else {
      await window.loadFile(this.indexHtml, { hash: route })
    }

    // 设置窗口事件处理
    this.setupWindowEvents(window, windowId)

    // 存储窗口
    this.windows.set(windowId, window)

    console.log(`create window: ${windowId}, title: ${windowOptions.title}, route: ${route}`)
    return windowId
  }

  // 设置窗口事件
  private setupWindowEvents(window: BrowserWindow, windowId: string) {
    // 窗口关闭事件
    window.on('closed', () => {
      this.windows.delete(windowId)
      console.log(`窗口已关闭: ${windowId}`)

      // 通知其他窗口
      this.broadcastToAll('window-closed', { windowId })
    })

    // 窗口完成加载
    window.webContents.on('did-finish-load', () => {
      // 发送窗口信息
      window.webContents.send('window-info', {
        windowId,
        title: window.getTitle(),
        isMainWindow: windowId === 'main'
      })

      // 发送主进程消息
      window.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // 阻止外部链接在应用内打开
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })

    // 窗口焦点变化
    window.on('focus', () => {
      this.broadcastToAll('window-focus', { windowId })
    })

    window.on('blur', () => {
      this.broadcastToAll('window-blur', { windowId })
    })

    // 窗口最大化/还原事件
    window.on('maximize', () => {
      window.webContents.send('window-maximized')
    })

    window.on('unmaximize', () => {
      window.webContents.send('window-unmaximized')
    })
  }

  // 关闭指定窗口
  closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (window && !window.isDestroyed()) {
      window.close()
      return true
    }
    return false
  }

  // 广播消息到所有窗口
  broadcastToAll(channel: string, data?: any) {
    this.windows.forEach((window, windowId) => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, { ...data, targetWindowId: windowId })
      }
    })
  }

  // 发送消息到指定窗口
  sendToWindow(windowId: string, channel: string, data?: any) {
    const window = this.windows.get(windowId)
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }

  // 获取窗口列表信息
  getWindowsInfo() {
    const windowsInfo: Array<{
      id: string
      title: string
      visible: boolean
      focused: boolean
    }> = []

    this.windows.forEach((window, id) => {
      if (!window.isDestroyed()) {
        windowsInfo.push({
          id,
          title: window.getTitle(),
          visible: window.isVisible(),
          focused: window.isFocused()
        })
      }
    })

    return windowsInfo
  }
}

function createMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            windowManager.createWindow({
              title: '新窗口',
              width: 800,
              height: 600
            })
          }
        },
        {
          label: '关闭窗口',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: '显示所有窗口',
          click: () => {
            windowManager.getAllWindows().forEach(window => {
              if (window.isMinimized()) window.restore()
              window.show()
            })
          }
        }
      ]
    },
    {
      label: '开发',
      submenu: [
        {
          label: '重新加载',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload'
        },
        {
          label: '强制重新加载',
          accelerator: 'CmdOrCtrl+Shift+R',
          role: 'forceReload'
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          role: 'toggleDevTools'
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 创建窗口管理器实例
const windowManager = new WindowManager()

// 创建 electron-store 实例
const store = new ElectronStore({
  name: 'app-data',
  defaults: {
    counter: {
      count: 0,
      lastUpdatedBy: '未知窗口'
    }
  }
})

// 应用启动
app.whenReady().then(async () => {
  // 创建菜单
  // 虽然不显示，但是需要创建才能使用快捷键
  createMenu()

  // 创建主窗口
  await windowManager.createWindow({
    windowId: 'main',
    title: '  应用 - 主窗口',
    width: 1200,
    height: 800
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
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

// IPC 处理程序
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

// --------- Electron Store IPC 处理程序 ---------

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

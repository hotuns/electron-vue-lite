import { BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import path from 'node:path'

export class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()
  private windowCounter = 0
  private preload: string
  private indexHtml: string
  private VITE_DEV_SERVER_URL: string | undefined

  constructor(preload: string, indexHtml: string, viteDevServerUrl?: string) {
    this.preload = preload
    this.indexHtml = indexHtml
    this.VITE_DEV_SERVER_URL = viteDevServerUrl
  }

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
    const isMac = process.platform === 'darwin'

    const windowOptions: Electron.BrowserWindowConstructorOptions = {
      title: options.title || `窗口 ${this.windowCounter}`,
      width: options.width || 1200,
      height: options.height || 800,
      icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
      show: options.show !== false,
      // macOS 特殊处理
      frame: isMac, // macOS 下保留原生窗口框架
      titleBarStyle: isMac ? 'hiddenInset' : 'hidden', // macOS 下使用 hiddenInset 样式
      trafficLightPosition: { x: 10, y: 10 }, // 调整红绿灯按钮位置
      vibrancy: 'under-window', // 添加毛玻璃效果
      visualEffectState: 'active',
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

    // macOS 下设置标题栏样式
    if (isMac) {
      window.setWindowButtonVisibility(true) // 显示红绿灯按钮
    }

    // 加载页面
    const route = options.route || '/'
    if (this.VITE_DEV_SERVER_URL) {
      await window.loadURL(`${this.VITE_DEV_SERVER_URL}#${route}`)
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
    this.windowCounter++

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
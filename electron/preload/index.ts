import { ipcRenderer, contextBridge } from 'electron'

// 窗口信息接口
interface WindowInfo {
  windowId: string
  title: string
  isMainWindow: boolean
}

// 窗口列表项接口
interface WindowListItem {
  id: string
  title: string
  visible: boolean
  focused: boolean
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  removeAllListeners(...args: Parameters<typeof ipcRenderer.removeAllListeners>) {
    const [channel, ...omit] = args
    return ipcRenderer.removeAllListeners(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- 窗口管理 API ---------
contextBridge.exposeInMainWorld('windowAPI', {
  // 创建新窗口
  createWindow: (options?: {
    title?: string
    width?: number
    height?: number
    route?: string
    modal?: boolean
  }): Promise<string> => {
    return ipcRenderer.invoke('window:create', options)
  },

  // 关闭窗口
  closeWindow: (windowId?: string): Promise<boolean> => {
    return ipcRenderer.invoke('window:close', windowId)
  },

  // 获取窗口列表
  getWindowList: (): Promise<WindowListItem[]> => {
    return ipcRenderer.invoke('window:list')
  },

  // 向指定窗口发送消息
  sendToWindow: (targetWindowId: string, channel: string, data?: any): Promise<boolean> => {
    return ipcRenderer.invoke('window:send-message', targetWindowId, channel, data)
  },

  // 广播消息到所有窗口
  broadcast: (channel: string, data?: any): Promise<boolean> => {
    return ipcRenderer.invoke('window:broadcast', channel, data)
  },

  // 聚焦到指定窗口
  focusWindow: (windowId: string): Promise<boolean> => {
    return ipcRenderer.invoke('window:focus', windowId)
  },

  // 监听窗口事件
  onWindowInfo: (callback: (windowInfo: WindowInfo) => void) => {
    return ipcRenderer.on('window-info', (_, windowInfo) => callback(windowInfo))
  },

  onWindowClosed: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-closed', (_, data) => callback(data))
  },

  onWindowFocus: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-focus', (_, data) => callback(data))
  },

  onWindowBlur: (callback: (data: { windowId: string }) => void) => {
    return ipcRenderer.on('window-blur', (_, data) => callback(data))
  },

  // 移除监听器
  removeListener: (channel: string, callback?: (...args: any[]) => void) => {
    return ipcRenderer.removeListener(channel, callback)
  },

  removeAllListeners: (channel: string) => {
    return ipcRenderer.removeAllListeners(channel)
  }
})

// --------- 窗口控制 API ---------
contextBridge.exposeInMainWorld('windowControls', {
  // 最小化窗口
  minimize: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:minimize')
  },

  // 最大化/还原窗口
  maximize: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:maximize')
  },

  // 关闭窗口
  close: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:close')
  },

  // 检查窗口是否最大化
  isMaximized: (): Promise<boolean> => {
    return ipcRenderer.invoke('window-control:is-maximized')
  },

  // 监听窗口状态变化
  onMaximize: (callback: () => void) => {
    return ipcRenderer.on('window-maximized', callback)
  },

  onUnmaximize: (callback: () => void) => {
    return ipcRenderer.on('window-unmaximized', callback)
  },

  // 移除监听器
  removeAllListeners: (channel: string) => {
    return ipcRenderer.removeAllListeners(channel)
  }
})

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

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

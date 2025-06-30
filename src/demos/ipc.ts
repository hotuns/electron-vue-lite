// 监听主进程消息
window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})

// 多窗口通信演示
export const windowCommunicationDemo = {
  // 创建新窗口
  async createWindow(title: string = '演示窗口') {
    try {
      const windowId = await (window as any).windowAPI.createWindow({
        title,
        width: 600,
        height: 400,
        route: '/'
      })
      console.log('窗口创建成功:', windowId)
      return windowId
    } catch (error) {
      console.error('创建窗口失败:', error)
      throw error
    }
  },

  // 获取所有窗口
  async getAllWindows() {
    try {
      const windows = await (window as any).windowAPI.getWindowList()
      console.log('当前窗口列表:', windows)
      return windows
    } catch (error) {
      console.error('获取窗口列表失败:', error)
      return []
    }
  },

  // 向指定窗口发送消息
  async sendMessageToWindow(windowId: string, message: string) {
    try {
      await (window as any).windowAPI.sendToWindow(windowId, 'demo-message', {
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'demo'
      })
      console.log(`消息已发送到窗口 ${windowId}:`, message)
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  },

  // 广播消息到所有窗口
  async broadcastMessage(message: string) {
    try {
      await (window as any).windowAPI.broadcast('demo-broadcast', {
        content: message,
        timestamp: new Date().toISOString(),
        type: 'broadcast'
      })
      console.log('广播消息:', message)
    } catch (error) {
      console.error('广播消息失败:', error)
    }
  },

  // 监听窗口间消息
  setupMessageListeners() {
    // 监听演示消息
    window.ipcRenderer.on('demo-message', (_event, data) => {
      console.log('收到窗口消息:', data)
      // 可以在这里更新UI或执行其他操作
    })

    // 监听广播消息
    window.ipcRenderer.on('demo-broadcast', (_event, data) => {
      console.log('收到广播消息:', data)
      // 可以在这里处理广播消息
    })

      // 监听窗口事件
      ; (window as any).windowAPI.onWindowClosed((data: any) => {
        console.log('窗口关闭事件:', data)
      })

      ; (window as any).windowAPI.onWindowFocus((data: any) => {
        console.log('窗口聚焦事件:', data)
      })

    console.log('窗口消息监听器已设置')
  },

  // 清理监听器
  cleanupListeners() {
    window.ipcRenderer.removeAllListeners('demo-message')
    window.ipcRenderer.removeAllListeners('demo-broadcast')
      ; (window as any).windowAPI.removeAllListeners('window-closed')
      ; (window as any).windowAPI.removeAllListeners('window-focus')
    console.log('窗口消息监听器已清理')
  }
}

// 自动设置消息监听器
if (typeof window !== 'undefined' && (window as any).windowAPI) {
  windowCommunicationDemo.setupMessageListeners()
}

// 导出到全局以便在控制台测试
if (typeof window !== 'undefined') {
  ; (window as any).windowDemo = windowCommunicationDemo
}

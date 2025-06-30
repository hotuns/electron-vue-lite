import { ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'

import pkg from 'electron-updater'
const { autoUpdater } = pkg
import log from 'electron-log'
import { WindowManager } from '../window/WindowManager'

const require = createRequire(import.meta.url)


export function setupUpdateHandlers(windowManager: WindowManager) {
  // 配置更新器
  autoUpdater.checkForUpdatesAndNotify()
  
  // 设置更新日志
  autoUpdater.logger = log
  log.transports.file.level = 'info'
  
  // 检查更新
  ipcMain.handle('app:check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, updateInfo: result?.updateInfo }
    } catch (error) {
      console.error('检查更新失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 下载更新
  ipcMain.handle('app:download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      console.error('下载更新失败:', error)
      return { success: false, error: error.message }
    }
  })
  
  // 安装更新并重启
  ipcMain.handle('app:install-update', () => {
    autoUpdater.quitAndInstall()
  })
  
  // 获取当前版本
  ipcMain.handle('app:get-version', () => {
    return require('../../../package.json').version
  })
  
  // 自动更新器事件监听
  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...')
    windowManager.broadcastToAll('update:checking-for-update')
  })
  
  autoUpdater.on('update-available', (info) => {
    console.log('发现可用更新:', info)
    windowManager.broadcastToAll('update:update-available', info)
  })
  
  autoUpdater.on('update-not-available', (info) => {
    console.log('没有可用更新')
    windowManager.broadcastToAll('update:update-not-available', info)
  })
  
  autoUpdater.on('error', (err) => {
    console.error('自动更新错误:', err)
    windowManager.broadcastToAll('update:error', err.message)
  })
  
  autoUpdater.on('download-progress', (progressObj) => {
    let logMessage = "下载速度: " + progressObj.bytesPerSecond
    logMessage = logMessage + ' - 已下载: ' + progressObj.percent + '%'
    logMessage = logMessage + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    console.log(logMessage)
    windowManager.broadcastToAll('update:download-progress', progressObj)
  })
  
  autoUpdater.on('update-downloaded', (info) => {
    console.log('更新下载完成')
    windowManager.broadcastToAll('update:update-downloaded', info)
    
    // 显示更新确认对话框
    const windows = windowManager.getAllWindows()
    if (windows.length > 0) {
      dialog.showMessageBox(windows[0], {
        type: 'info',
        title: '更新已就绪',
        message: '更新已下载完成，是否立即重启应用以安装更新？',
        buttons: ['立即重启', '稍后重启'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
    }
  })
} 
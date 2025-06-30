import { Menu, MenuItemConstructorOptions } from 'electron'
import { WindowManager } from './WindowManager'

export function createMenu(windowManager: WindowManager) {
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
            require('electron').app.quit()
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
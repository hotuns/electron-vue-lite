import ElectronStore from 'electron-store'

// 创建 electron-store 实例
export const store = new ElectronStore({
  name: 'app-data',
  defaults: {
    counter: {
      count: 0,
      lastUpdatedBy: '未知窗口'
    }
  }
}) 
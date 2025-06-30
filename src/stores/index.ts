import { createPinia } from 'pinia'
import { createElectronStorePlugin } from './plugins/electronStorePlugin'

export const pinia = createPinia()

// 应用 electron-store 插件
pinia.use(createElectronStorePlugin())

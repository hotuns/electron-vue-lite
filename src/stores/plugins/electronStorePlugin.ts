import type { PiniaPluginContext } from 'pinia'
import { watch, nextTick } from 'vue'

/**
 * Pinia 插件：自动同步 electron-store
 * 
 * 使用说明：
 * 1. 在 store 中设置 $persist: true 或 $persist: { key: 'custom-key' }
 * 2. 插件会自动将状态变化同步到 electron-store
 * 3. 应用启动时会自动从 electron-store 恢复状态
 * 4. 支持跨窗口实时同步
 */

interface PersistOptions {
    key?: string
    enabled?: boolean
}

// 扩展 Pinia 选项类型
declare module 'pinia' {
    interface DefineStoreOptionsInPlugin<Id, S, G, A> {
        $persist?: boolean | PersistOptions
    }

    // @ts-ignore: 忽略类型参数不匹配的错误
    interface DefineSetupStoreOptions<Id, SS, S, G, A> {
        $persist?: boolean | PersistOptions
    }

    interface DefineStoreOptions<Id, S, G, A> {
        $persist?: boolean | PersistOptions
    }
}

// 正在同步的状态键，避免循环同步
const syncingKeys = new Set<string>()

export function createElectronStorePlugin() {
    return (context: PiniaPluginContext) => {
        const { store, options } = context

        // 检查是否启用持久化
        const persistConfig = options.$persist as boolean | PersistOptions | undefined
        if (!persistConfig) return

        // 解析配置
        const config: PersistOptions = typeof persistConfig === 'boolean'
            ? { enabled: persistConfig }
            : persistConfig

        if (config.enabled === false) return

        // 生成存储键
        const storeKey = config.key || `pinia-store-${store.$id}`

        console.log(`[ElectronStore Plugin] 初始化持久化存储: ${storeKey}`)

        // 从 electron-store 恢复状态
        const restoreState = async () => {
            try {
                if (window.storeAPI) {
                    const savedState = await window.storeAPI.get(storeKey)
                    if (savedState && typeof savedState === 'object') {
                        console.log(`[ElectronStore Plugin] 恢复状态:`, savedState)
                        store.$patch(savedState)
                    }
                }
            } catch (error) {
                console.warn(`[ElectronStore Plugin] 恢复状态失败:`, error)
            }
        }

        // 保存状态到 electron-store
        const saveState = async (state: any) => {
            try {
                if (window.storeAPI && !syncingKeys.has(storeKey)) {
                    const stateToSave = { ...state }
                    console.log(`[ElectronStore Plugin] 保存状态:`, stateToSave)
                    await window.storeAPI.set(storeKey, stateToSave)
                }
            } catch (error) {
                console.warn(`[ElectronStore Plugin] 保存状态失败:`, error)
            }
        }

        // 监听状态变化
        const stopWatcher = watch(
            () => store.$state,
            (newState) => {
                saveState(newState)
            },
            {
                deep: true,
                flush: 'post' // 在 DOM 更新后执行
            }
        )

        // 监听来自其他窗口的状态同步
        const setupCrossWindowSync = () => {
            if (window.storeAPI) {
                window.storeAPI.onChanged((data) => {
                    if (data.key === storeKey && !syncingKeys.has(storeKey)) {
                        console.log(`[ElectronStore Plugin] 接收跨窗口同步:`, data.value)

                        // 设置同步标记，避免循环
                        syncingKeys.add(storeKey)

                        // 更新本地状态
                        nextTick(() => {
                            store.$patch(data.value)
                            // 延迟移除同步标记
                            setTimeout(() => {
                                syncingKeys.delete(storeKey)
                            }, 100)
                        })
                    }
                })
            }
        }

        // 初始化
        restoreState()
        setupCrossWindowSync()

        // 清理函数
        store.$dispose = () => {
            stopWatcher()
            if (window.storeAPI) {
                window.storeAPI.removeAllListeners('store:changed')
            }
        }
    }
}

/**
 * 手动触发状态同步到 electron-store
 * @param store Pinia store 实例
 * @param key 可选的自定义存储键
 */
export async function syncStoreToElectron(store: any, key?: string) {
    const storeKey = key || `pinia-store-${store.$id}`
    try {
        if (window.storeAPI) {
            await window.storeAPI.set(storeKey, store.$state)
            console.log(`[ElectronStore Plugin] 手动同步完成: ${storeKey}`)
        }
    } catch (error) {
        console.warn(`[ElectronStore Plugin] 手动同步失败:`, error)
    }
}

/**
 * 从 electron-store 手动恢复状态
 * @param store Pinia store 实例
 * @param key 可选的自定义存储键
 */
export async function restoreStoreFromElectron(store: any, key?: string) {
    const storeKey = key || `pinia-store-${store.$id}`
    try {
        if (window.storeAPI) {
            const savedState = await window.storeAPI.get(storeKey)
            if (savedState && typeof savedState === 'object') {
                store.$patch(savedState)
                console.log(`[ElectronStore Plugin] 手动恢复完成: ${storeKey}`)
            }
        }
    } catch (error) {
        console.warn(`[ElectronStore Plugin] 手动恢复失败:`, error)
    }
} 
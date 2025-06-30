import { ref } from 'vue'

export interface AppInfo {
    name: string
    version: string
    electronVersion: string
    nodeVersion: string
    platform: string
    arch: string
}

/**
 * 应用功能Hook
 * 处理应用级别的操作，如重新加载、开发工具等
 */
export function useAppActions() {
    const appInfo = ref<AppInfo | null>(null)
    const loading = ref(false)

    // 重新加载应用
    const reloadApp = async (): Promise<boolean> => {
        try {
            loading.value = true
            return await window.appAPI.reload()
        } catch (error) {
            console.error('重新加载失败:', error)
            return false
        } finally {
            loading.value = false
        }
    }

    // 强制重新加载
    const forceReloadApp = async (): Promise<boolean> => {
        try {
            loading.value = true
            return await window.appAPI.forceReload()
        } catch (error) {
            console.error('强制重新加载失败:', error)
            return false
        } finally {
            loading.value = false
        }
    }

    // 切换开发者工具
    const toggleDevTools = async (): Promise<boolean> => {
        try {
            return await window.appAPI.toggleDevTools()
        } catch (error) {
            console.error('切换开发者工具失败:', error)
            return false
        }
    }

    // 显示所有窗口
    const showAllWindows = async (): Promise<boolean> => {
        try {
            return await window.appAPI.showAllWindows()
        } catch (error) {
            console.error('显示所有窗口失败:', error)
            return false
        }
    }

    // 退出应用
    const quitApp = async (): Promise<boolean> => {
        try {
            return await window.appAPI.quit()
        } catch (error) {
            console.error('退出应用失败:', error)
            return false
        }
    }

    // 获取应用版本
    const getVersion = async (): Promise<string | null> => {
        try {
            return await window.appAPI.getVersion()
        } catch (error) {
            console.error('获取版本失败:', error)
            return null
        }
    }

    // 获取应用信息
    const getAppInfo = async (): Promise<void> => {
        try {
            appInfo.value = await window.appAPI.getAppInfo()
        } catch (error) {
            console.error('获取应用信息失败:', error)
        }
    }

    // 刷新应用信息
    const refreshAppInfo = async (): Promise<void> => {
        await getAppInfo()
    }

    return {
        // 状态
        appInfo,
        loading,

        // 方法
        reloadApp,
        forceReloadApp,
        toggleDevTools,
        showAllWindows,
        quitApp,
        getVersion,
        getAppInfo,
        refreshAppInfo
    }
} 
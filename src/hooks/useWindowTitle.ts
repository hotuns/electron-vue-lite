import { ref, onMounted, onUnmounted } from 'vue'
import type { WindowInfo } from './useWindowManager'

/**
 * 窗口标题管理Hook
 * 管理窗口标题的显示和更新
 */
export function useWindowTitle() {
    const windowTitle = ref('主窗口')

    // 设置窗口标题监听器
    const setupTitleListener = (): void => {
        if (window.windowAPI) {
            window.windowAPI.onWindowInfo((info: WindowInfo) => {
                windowTitle.value = info.title || '主窗口'
            })
        }
    }

    // 清理监听器
    const cleanupTitleListener = (): void => {
        if (window.windowAPI) {
            window.windowAPI.removeAllListeners('window-info')
        }
    }

    // 初始化
    onMounted(() => {
        setupTitleListener()
    })

    onUnmounted(() => {
        cleanupTitleListener()
    })

    return {
        windowTitle
    }
} 
<template>
    <div class="app-setting">
                <!-- 主题设置 -->
                <div class="mb-6">
            <n-card title="主题设置" size="small" segmented>
                <n-space>
                    <n-button :type="currentTheme === 'light' ? 'primary' : 'default'" @click="setTheme('light')">
                        <template #icon>
                            <n-icon>
                                <svg viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0-7l2.39 3.42C13.65 5.15 12.84 5 12 5c-.84 0-1.65.15-2.39.42L12 2M3.34 7l4.16-.35A7.2 7.2 0 0 0 5.94 8.5c-.44.74-.69 1.5-.83 2.29L3.34 7m.02 10l1.76-3.77a7.131 7.131 0 0 0 2.38 4.14L3.36 17M20.65 7l-1.77 3.79a7.023 7.023 0 0 0-2.38-4.15l4.15.36m-.01 10l-4.14.36c.59-.51 1.12-1.14 1.54-1.86c.42-.73.69-1.5.83-2.29L20.64 17M12 22l-2.41-3.44c.74.27 1.55.44 2.41.44c.82 0 1.63-.17 2.37-.44L12 22Z" />
                                </svg>
                            </n-icon>
                        </template>
                        浅色主题
                    </n-button>

                    <n-button :type="currentTheme === 'dark' ? 'primary' : 'default'" @click="setTheme('dark')">
                        <template #icon>
                            <n-icon>
                                <svg viewBox="0 0 24 24">
                                    <path fill="currentColor"
                                        d="M17.75 4.09L15.22 6.03L16.13 9.09L13.5 7.28L10.87 9.09L11.78 6.03L9.25 4.09L12.44 4L13.5 1L14.56 4L17.75 4.09M21.25 11L19.61 12.25L20.2 14.23L18.5 13.06L16.8 14.23L17.39 12.25L15.75 11L17.81 10.95L18.5 9L19.19 10.95L21.25 11M18.97 15.95C19.8 15.87 20.69 17.05 20.16 17.8C19.84 18.25 19.5 18.67 19.08 19.07C15.17 23 8.84 23 4.94 19.07C1.03 15.17 1.03 8.83 4.94 4.93C5.34 4.53 5.76 4.17 6.21 3.85C6.96 3.32 8.14 4.21 8.06 5.04C7.79 7.9 8.75 10.87 10.95 13.06C13.14 15.26 16.1 16.22 18.97 15.95Z" />
                                </svg>
                            </n-icon>
                        </template>
                        深色主题
                    </n-button>
                </n-space>
            </n-card>
        </div>
        
        <!-- 应用信息 -->
        <div class="mb-6">
            <n-card title="应用信息" size="small" segmented>
                <template #header-extra>
                    <n-button size="small" @click="refreshInfo" :loading="loading">
                        刷新
                    </n-button>
                </template>

                <n-descriptions v-if="appInfo" :column="2" bordered>
                    <n-descriptions-item label="应用名称">
                        {{ appInfo.name }}
                    </n-descriptions-item>
                    <n-descriptions-item label="版本">
                        {{ appInfo.version }}
                    </n-descriptions-item>
                    <n-descriptions-item label="Electron">
                        {{ appInfo.electronVersion }}
                    </n-descriptions-item>
                    <n-descriptions-item label="Node.js">
                        {{ appInfo.nodeVersion }}
                    </n-descriptions-item>
                    <n-descriptions-item label="平台">
                        {{ appInfo.platform }}
                    </n-descriptions-item>
                    <n-descriptions-item label="架构">
                        {{ appInfo.arch }}
                    </n-descriptions-item>
                </n-descriptions>

                <n-empty v-else description="暂无应用信息" />
            </n-card>
        </div>

        <!-- 应用操作 -->
        <div class="mb-6">
            <n-card title="应用操作" size="small" segmented>

                <div class="flex  gap-4">
                <n-button-group>
                        <n-button type="primary" @click="handleReload" :loading="loading">
                            重新加载
                        </n-button>

                        <n-button @click="handleForceReload" :loading="loading">
                            强制重新加载
                        </n-button>
                    </n-button-group>
                   

                    <n-button-group>
                        <n-button @click="handleToggleDevTools" type="info">
                            开发者工具
                        </n-button>

                        <n-button @click="handleShowAllWindows" type="success">
                            显示所有窗口
                        </n-button>
                    </n-button-group>

                        <n-popconfirm @positive-click="handleQuit" positive-text="确认退出" negative-text="取消">
                            <template #trigger>
                                <n-button type="error" :loading="loading">
                                    退出应用
                                </n-button>
                            </template>
                            确定要退出应用程序吗？
                        </n-popconfirm>
                    </div>
            </n-card>
        </div>

        <!-- 应用更新 -->
        <div class="mb-6">
            <n-card title="应用更新" size="small" segmented>
                <app-updater />
            </n-card>
        </div>

        <!-- 窗口管理 -->
        <div class="mb-6">
            <n-card title="窗口管理" size="small" segmented>
                <window-manager-panel />
            </n-card>
        </div>


    </div>
</template>

<script setup lang="ts">
import { onMounted, inject, ref, computed } from 'vue'
import { useAppActions } from '@/hooks/useAppActions'
import { useMessage, NDescriptions, NDescriptionsItem, NEmpty } from 'naive-ui'
import WindowManagerPanel from './WindowManagerPanel.vue'
import AppUpdater from './AppUpdater.vue'
import { useAppStore } from '@/stores/appStore'

// 使用应用功能Hook
const {
    appInfo,
    loading,
    reloadApp,
    forceReloadApp,
    toggleDevTools,
    showAllWindows,
    quitApp,
    refreshAppInfo
} = useAppActions()

const message = useMessage()

// 使用应用 store
const appStore = useAppStore()

// 设置主题
const setTheme = (theme: 'light' | 'dark') => {
    appStore.setTheme(theme)
    message.success(`已切换到${theme === 'light' ? '浅色' : '深色'}主题`)
}

// 计算当前主题
const currentTheme = computed(() => appStore.theme)

// 刷新信息
const refreshInfo = async () => {
    await refreshAppInfo()
    message.success('应用信息已刷新')
}

// 重新加载
const handleReload = async () => {
    const success = await reloadApp()
    if (success) {
        message.success('应用正在重新加载...')
    } else {
        message.error('重新加载失败')
    }
}

// 强制重新加载
const handleForceReload = async () => {
    const success = await forceReloadApp()
    if (success) {
        message.success('应用正在强制重新加载...')
    } else {
        message.error('强制重新加载失败')
    }
}

// 切换开发者工具
const handleToggleDevTools = async () => {
    const success = await toggleDevTools()
    if (success) {
        message.info('开发者工具已切换')
    } else {
        message.error('切换开发者工具失败')
    }
}

// 显示所有窗口
const handleShowAllWindows = async () => {
    const success = await showAllWindows()
    if (success) {
        message.success('所有窗口已显示')
    } else {
        message.error('显示所有窗口失败')
    }
}

// 退出应用
const handleQuit = async () => {
    const success = await quitApp()
    if (!success) {
        message.error('退出应用失败')
    }
}

// 初始化
onMounted(() => {
    refreshAppInfo()
})
</script>

<style lang="postcss" scoped>
.app-setting {
    @apply space-y-6;
}

.mb-6 {
    margin-bottom: 24px;
}

/* 深色主题支持 */
.dark .info-item {
    @apply bg-gray-800;
}

.dark .label {
    @apply text-gray-300;
}
</style>

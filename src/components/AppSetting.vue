<template>
    <div class="app-setting">
        <!-- 应用信息 -->
        <div class="mb-6">
            <n-card title="应用信息" size="small" segmented>
                <template #header-extra>
                    <n-button size="small" @click="refreshInfo" :loading="loading">
                        刷新
                    </n-button>
                </template>

                <div v-if="appInfo" class="app-info-grid">
                    <div class="info-item">
                        <n-text class="label">应用名称：</n-text>
                        <n-text>{{ appInfo.name }}</n-text>
                    </div>
                    <div class="info-item">
                        <n-text class="label">版本：</n-text>
                        <n-text>{{ appInfo.version }}</n-text>
                    </div>
                    <div class="info-item">
                        <n-text class="label">Electron：</n-text>
                        <n-text>{{ appInfo.electronVersion }}</n-text>
                    </div>
                    <div class="info-item">
                        <n-text class="label">Node.js：</n-text>
                        <n-text>{{ appInfo.nodeVersion }}</n-text>
                    </div>
                    <div class="info-item">
                        <n-text class="label">平台：</n-text>
                        <n-text>{{ appInfo.platform }}</n-text>
                    </div>
                    <div class="info-item">
                        <n-text class="label">架构：</n-text>
                        <n-text>{{ appInfo.arch }}</n-text>
                    </div>
                </div>
            </n-card>
        </div>

        <!-- 应用操作 -->
        <div class="mb-6">
            <n-card title="应用操作" size="small" segmented>
                <n-space vertical>
                    <n-space>
                        <n-button type="primary" @click="handleReload" :loading="loading">
                            <template #icon>
                                <n-icon>
                                    <svg viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                            d="M12 20q-3.35 0-5.675-2.325T4 12q0-3.35 2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20Z" />
                                    </svg>
                                </n-icon>
                            </template>
                            重新加载
                        </n-button>

                        <n-button @click="handleForceReload" :loading="loading">
                            <template #icon>
                                <n-icon>
                                    <svg viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                            d="M12 4V1l4 4l-4 4V6c-3.31 0-6 2.69-6 6c0 1.01.25 1.97.7 2.8l-1.46 1.46A7.93 7.93 0 0 1 4 12c0-4.42 3.58-8 8-8zm5.76 7.46l1.46-1.46A7.93 7.93 0 0 1 20 12c0 4.42-3.58 8-8 8v3l-4-4l4-4v3c3.31 0 6-2.69 6-6c0-1.01-.25-1.97-.7-2.8z" />
                                    </svg>
                                </n-icon>
                            </template>
                            强制重新加载
                        </n-button>
                    </n-space>

                    <n-space>
                        <n-button @click="handleToggleDevTools" type="info">
                            <template #icon>
                                <n-icon>
                                    <svg viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                            d="M7 3V1h10v2H7zM12 6a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6a6 6 0 0 1-6-6v-4a6 6 0 0 1 6-6m0 2a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4z" />
                                    </svg>
                                </n-icon>
                            </template>
                            开发者工具
                        </n-button>

                        <n-button @click="handleShowAllWindows" type="success">
                            <template #icon>
                                <n-icon>
                                    <svg viewBox="0 0 24 24">
                                        <path fill="currentColor"
                                            d="M3 3v18h18V3H3zm16 16H5V5h14v14zm-8-2V9l5 4l-5 4z" />
                                    </svg>
                                </n-icon>
                            </template>
                            显示所有窗口
                        </n-button>
                    </n-space>

                    <n-divider />

                    <n-space>
                        <n-popconfirm @positive-click="handleQuit" positive-text="确认退出" negative-text="取消">
                            <template #trigger>
                                <n-button type="error" :loading="loading">
                                    <template #icon>
                                        <n-icon>
                                            <svg viewBox="0 0 24 24">
                                                <path fill="currentColor"
                                                    d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5l-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                                            </svg>
                                        </n-icon>
                                    </template>
                                    退出应用
                                </n-button>
                            </template>
                            确定要退出应用程序吗？
                        </n-popconfirm>
                    </n-space>
                </n-space>
            </n-card>
        </div>

        <!-- 窗口管理 -->
        <div class="mb-6">
            <n-card title="窗口管理" size="small" segmented>
                <window-manager-panel />
            </n-card>
        </div>

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
    </div>
</template>

<script setup lang="ts">
import { onMounted, inject, ref } from 'vue'
import { useAppActions } from '@/hooks/useAppActions'
import { useMessage } from 'naive-ui'
import WindowManagerPanel from './WindowManagerPanel.vue'

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

// 主题相关
const currentTheme = ref<'light' | 'dark'>('light')

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

// 设置主题
const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme
    // 这里可以添加主题切换逻辑
    message.success(`已切换到${theme === 'light' ? '浅色' : '深色'}主题`)
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

.app-info-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.info-item {
    @apply flex items-center gap-2 p-3 bg-gray-50 rounded-lg;
}

.label {
    @apply font-medium text-gray-600 min-w-20;
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

<template>
    <div class="window-manager-panel">
        <!-- 创建新窗口 -->
        <div class="mb-4">
            <n-space>
                <n-input v-model:value="newWindowTitle" placeholder="窗口标题" style="width: 180px" />
                <n-input-number v-model:value="newWindowWidth" placeholder="宽度" :min="400" :max="2000"
                    style="width: 100px" />
                <n-input-number v-model:value="newWindowHeight" placeholder="高度" :min="300" :max="1500"
                    style="width: 100px" />
                <n-button type="primary" @click="handleCreateWindow">
                    <template #icon>
                        <n-icon>
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </n-icon>
                    </template>
                    创建窗口
                </n-button>
                <n-button @click="refreshWindowList">
                    <template #icon>
                        <n-icon>
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M12 20q-3.35 0-5.675-2.325T4 12q0-3.35 2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12q0 2.5 1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20Z" />
                            </svg>
                        </n-icon>
                    </template>
                    刷新
                </n-button>
            </n-space>
        </div>

        <!-- 当前窗口信息 -->
        <div v-if="currentWindowInfo" class="mb-4">
            <n-alert type="info" :show-icon="false">
                当前窗口：{{ currentWindowInfo.windowId }}
            </n-alert>
        </div>

        <!-- 窗口列表 -->
        <div class="window-list">
            <div v-for="window in windowList" :key="window.id" class="window-item">
                <div class="window-info">
                    <div class="window-title">
                        <n-tag size="small" class="ml-2">{{ window.id }}</n-tag>
                    </div>
                    <div class="window-status">
                        <n-tag size="small" :type="window.visible ? 'success' : 'warning'" class="mr-2">
                            {{ window.visible ? '可见' : '隐藏' }}
                        </n-tag>
                        <n-tag size="small" :type="window.focused ? 'info' : 'default'">
                            {{ window.focused ? '已聚焦' : '未聚焦' }}
                        </n-tag>
                    </div>
                </div>
                <div class="window-actions">
                    <n-button size="small" type="primary" @click="handleFocusWindow(window.id)">
                        聚焦
                    </n-button>
                    <n-button size="small" type="error" @click="handleCloseWindow(window.id)"
                        :disabled="window.id === currentWindowInfo?.windowId">
                        关闭
                    </n-button>
                </div>
            </div>

            <div v-if="windowList.length === 0" class="empty-state">
                <n-empty description="暂无窗口">
                    <template #icon>
                        <n-icon>
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M4 6v2h16V6H4m0 5v2h16v-2H4m0 5v2h16v-2H4Z" />
                            </svg>
                        </n-icon>
                    </template>
                </n-empty>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWindowManager } from '@/hooks/useWindowManager'
import { useMessage } from 'naive-ui'

// 使用窗口管理Hook
const {
    currentWindowInfo,
    windowList,
    createWindow,
    closeWindow,
    focusWindow,
    refreshWindowList
} = useWindowManager()

const message = useMessage()

// 新窗口表单
const newWindowTitle = ref('新窗口')
const newWindowWidth = ref(800)
const newWindowHeight = ref(600)

// 创建窗口
const handleCreateWindow = async () => {
    const windowId = await createWindow({
        width: newWindowWidth.value,
        height: newWindowHeight.value,
        route: '/'
    })

    if (windowId) {
        message.success(`窗口创建成功：${windowId}`)
        // 重置表单
        newWindowTitle.value = '新窗口'
    } else {
        message.error('窗口创建失败')
    }
}

// 聚焦窗口
const handleFocusWindow = async (windowId: string) => {
    const success = await focusWindow(windowId)
    if (success) {
        message.success('窗口已聚焦')
    } else {
        message.error('聚焦窗口失败')
    }
}

// 关闭窗口
const handleCloseWindow = async (windowId: string) => {
    const success = await closeWindow(windowId)
    if (success) {
        message.success('窗口已关闭')
    } else {
        message.error('关闭窗口失败')
    }
}
</script>

<style lang="postcss" scoped>
.window-manager-panel {
    @apply space-y-4;
}

.window-list {
    @apply space-y-2;
}

.window-item {
    @apply flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg;
}

.window-info {
    @apply flex-1;
}

.window-title {
    @apply flex items-center mb-2;
}

.window-status {
    @apply flex items-center;
}

.window-actions {
    @apply flex gap-2;
}

.empty-state {
    @apply py-8;
}


/* 深色主题支持 */
.dark .window-item {
    @apply bg-gray-800 border-gray-700;
}
</style>
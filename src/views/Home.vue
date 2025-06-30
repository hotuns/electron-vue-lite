<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 当前窗口信息
const currentWindowInfo = ref<any>(null)
const windowList = ref<any[]>([])

// 新窗口表单
const newWindowTitle = ref('新窗口')
const newWindowWidth = ref(800)
const newWindowHeight = ref(600)

// 创建窗口
const createWindow = async () => {
    try {
        const windowId = await (window as any).windowAPI.createWindow({
            title: newWindowTitle.value,
            width: newWindowWidth.value,
            height: newWindowHeight.value,
            route: '/'
        })
        console.log('窗口创建成功:', windowId)
        await refreshWindowList()
    } catch (error) {
        console.error('创建窗口失败:', error)
    }
}

// 刷新窗口列表
const refreshWindowList = async () => {
    try {
        windowList.value = await (window as any).windowAPI.getWindowList()
    } catch (error) {
        console.error('获取窗口列表失败:', error)
    }
}

// 关闭窗口
const closeWindow = async (windowId: string) => {
    try {
        await (window as any).windowAPI.closeWindow(windowId)
        await refreshWindowList()
    } catch (error) {
        console.error('关闭窗口失败:', error)
    }
}

// 聚焦窗口
const focusWindow = async (windowId: string) => {
    try {
        await (window as any).windowAPI.focusWindow(windowId)
    } catch (error) {
        console.error('聚焦窗口失败:', error)
    }
}

onMounted(() => {
    // 监听窗口信息
    ; (window as any).windowAPI.onWindowInfo((info: any) => {
        currentWindowInfo.value = info
    })

    // 初始加载窗口列表
    refreshWindowList()
})
</script>

<template>
    <div class="p-6">
        <n-card title="Electron 多窗口应用">
            <!-- 当前窗口信息 -->
            <div class="mb-4" v-if="currentWindowInfo">
                <n-tag type="primary">
                    当前窗口：{{ currentWindowInfo.title }} ({{ currentWindowInfo.windowId }})
                </n-tag>
            </div>

            <!-- 创建新窗口 -->
            <div class="mb-6">
                <n-card title="创建新窗口" size="small">
                    <n-space vertical>
                        <n-space>
                            <n-input v-model:value="newWindowTitle" placeholder="窗口标题" style="width: 200px" />
                            <n-input-number v-model:value="newWindowWidth" placeholder="宽度" :min="400" :max="2000"
                                style="width: 100px" />
                            <n-input-number v-model:value="newWindowHeight" placeholder="高度" :min="300" :max="1500"
                                style="width: 100px" />
                            <n-button type="primary" @click="createWindow">
                                创建窗口
                            </n-button>
                        </n-space>
                    </n-space>
                </n-card>
            </div>

            <!-- 窗口列表 -->
            <div class="mb-6">
                <n-card title="窗口列表" size="small">
                    <n-space>
                        <n-button type="success" @click="refreshWindowList">
                            刷新列表
                        </n-button>
                    </n-space>

                    <div class="mt-4">
                        <div v-for="window in windowList" :key="window.id" class="window-item p-3 border rounded mb-2">
                            <div class="flex justify-between items-center">
                                <div>
                                    <strong>{{ window.title }}</strong>
                                    <n-tag size="small" class="ml-2">{{ window.id }}</n-tag>
                                    <n-tag size="small" :type="window.visible ? 'success' : 'warning'" class="ml-2">
                                        {{ window.visible ? '可见' : '隐藏' }}
                                    </n-tag>
                                    <n-tag size="small" :type="window.focused ? 'info' : 'default'" class="ml-2">
                                        {{ window.focused ? '已聚焦' : '未聚焦' }}
                                    </n-tag>
                                </div>
                                <n-space>
                                    <n-button size="small" type="primary" @click="focusWindow(window.id)">
                                        聚焦
                                    </n-button>
                                    <n-button size="small" type="error" @click="closeWindow(window.id)"
                                        :disabled="window.id === currentWindowInfo?.windowId">
                                        关闭
                                    </n-button>
                                </n-space>
                            </div>
                        </div>
                    </div>
                </n-card>
            </div>

            <!-- 应用信息 -->
            <HelloWorld msg="Electron + Vue 3 + Vite 多窗口应用" />
        </n-card>
    </div>
</template>

<style scoped>
.window-item {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background-color: #fafafa;
}

.p-6 {
    padding: 24px;
}

.p-3 {
    padding: 12px;
}

.mb-4 {
    margin-bottom: 16px;
}

.mb-6 {
    margin-bottom: 24px;
}

.mb-2 {
    margin-bottom: 8px;
}

.mt-4 {
    margin-top: 16px;
}

.ml-2 {
    margin-left: 8px;
}

.flex {
    display: flex;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.border {
    border: 1px solid #e0e0e0;
}

.rounded {
    border-radius: 6px;
}
</style>

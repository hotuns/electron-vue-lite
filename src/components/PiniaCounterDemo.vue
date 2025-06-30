<template>
    <div class="pinia-counter-demo">
        <n-card title=" 计数器演示" class="counter-card">
            <template #header-extra>
                <n-space>
                    <n-tag type="success">自动持久化</n-tag>
                    <n-tag type="info">跨窗口同步</n-tag>
                </n-space>
            </template>

            <div class="counter-display">
                <div class="count-value" :class="getCountClass()">{{ count }}</div>
                <div class="counter-info">
                    <div class="last-updated">
                        <span>最后更新：{{ lastUpdatedBy }}</span>
                        <span class="timestamp">{{ formatLastUpdated }}</span>
                    </div>
                </div>
            </div>

            <n-space justify="center" class="counter-controls" size="small">
                <n-button @click="decrement()" secondary size="small">
                    <template #icon>
                        <n-icon><svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H5v-2h14v2z" />
                            </svg></n-icon>
                    </template>
                    -1
                </n-button>

                <n-button @click="increment()" type="primary" size="small">
                    <template #icon>
                        <n-icon><svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg></n-icon>
                    </template>
                    +1
                </n-button>

                <n-button @click="reset()" :disabled="isZero" tertiary size="small">
                    <template #icon>
                        <n-icon><svg viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                            </svg></n-icon>
                    </template>
                    重置
                </n-button>
            </n-space>

            <n-divider />


            <n-space justify="space-between" class="demo-actions">
                <n-button @click="openNewWindow" secondary size="small">
                    <template #icon>
                        <n-icon><svg viewBox="0 0 24 24" fill="currentColor">
                                <path
                                    d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg></n-icon>
                    </template>
                    打开新窗口
                </n-button>
            </n-space>
        </n-card>
    </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '../stores/counterStore'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'

// 使用 Pinia store
const counterStore = useCounterStore()

// 解构响应式状态和计算属性
const {
    count,
    lastUpdatedBy,
    formatLastUpdated,
    isPositive,
    isNegative,
    isZero
} = storeToRefs(counterStore)

// 解构方法
const {
    increment,
    decrement,
    reset
} = counterStore

const message = useMessage()

// 获取计数器颜色类
const getCountClass = () => {
    if (isPositive.value) return 'positive'
    if (isNegative.value) return 'negative'
    return 'zero'
}

// 打开新窗口
const openNewWindow = async () => {
    try {
        if (window.windowAPI) {
            const windowId = await window.windowAPI.createWindow({
                title: ' 计数器演示',
                width: 700,
                height: 600,
                route: '/count'
            })
            message.success(`新窗口已创建: ${windowId}`)
        }
    } catch (error) {
        message.error('创建窗口失败')
    }
}
</script>

<style scoped>
.pinia-counter-demo {
    max-width: 600px;
    margin: 0 auto;
}

.counter-card {
    text-align: center;
}

.counter-display {
    margin: 24px 0;
}

.count-value {
    font-size: 56px;
    font-weight: bold;
    margin-bottom: 12px;
    transition: color 0.3s ease;
}

.count-value.positive {
    color: #18a058;
}

.count-value.negative {
    color: #d03050;
}

.count-value.zero {
    color: #666;
}

.counter-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.status-indicators {
    display: flex;
    gap: 4px;
}

.last-updated {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--text-color-3);
}

.timestamp {
    font-size: 11px;
    opacity: 0.7;
}

.counter-controls {
    margin: 24px 0;
}

.demo-instructions {
    text-align: left;
    background: var(--code-color);
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
}

.demo-instructions h4 {
    margin: 0 0 12px 0;
    color: var(--text-color-1);
}

.demo-instructions ul {
    margin: 0;
    padding-left: 20px;
}

.demo-instructions li {
    margin: 6px 0;
    color: var(--text-color-2);
    font-size: 14px;
}

.demo-actions {
    margin-top: 16px;
}
</style>

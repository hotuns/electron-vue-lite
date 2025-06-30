import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 计数器 Store
 * 演示 Pinia + electron-store 自动同步功能
 */
export const useCounterStore = defineStore('counter', () => {
    // 状态
    const count = ref(0)
    const lastUpdatedBy = ref('未知')
    const lastUpdatedAt = ref<Date | null>(null)

    // 计算属性
    const isPositive = computed(() => count.value > 0)
    const isNegative = computed(() => count.value < 0)
    const isZero = computed(() => count.value === 0)

    const formatLastUpdated = computed(() => {
        if (!lastUpdatedAt.value) return '从未更新'
        return lastUpdatedAt.value.toLocaleString()
    })

    // 操作
    const increment = (step = 1) => {
        count.value += step
        lastUpdatedBy.value = '当前窗口'
        lastUpdatedAt.value = new Date()
    }

    const decrement = (step = 1) => {
        count.value -= step
        lastUpdatedBy.value = '当前窗口'
        lastUpdatedAt.value = new Date()
    }

    const reset = () => {
        count.value = 0
        lastUpdatedBy.value = '当前窗口'
        lastUpdatedAt.value = new Date()
    }

    const setCount = (value: number, updatedBy = '当前窗口') => {
        count.value = value
        lastUpdatedBy.value = updatedBy
        lastUpdatedAt.value = new Date()
    }

    const addRandom = () => {
        const randomValue = Math.floor(Math.random() * 10) + 1
        increment(randomValue)
    }

    const subtractRandom = () => {
        const randomValue = Math.floor(Math.random() * 10) + 1
        decrement(randomValue)
    }

    return {
        // 状态
        count,
        lastUpdatedBy,
        lastUpdatedAt,

        // 计算属性
        isPositive,
        isNegative,
        isZero,
        formatLastUpdated,

        // 操作
        increment,
        decrement,
        reset,
        setCount,
        addRandom,
        subtractRandom
    }
}, {
    // 启用 electron-store 自动持久化
    $persist: {
        key: 'app-counter',
        enabled: true
    }
} as any) 
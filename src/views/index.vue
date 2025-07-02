<script setup lang="ts">
import { useWindowManager } from '@/hooks/useWindowManager'

const title = useTitle()
console.log(title.value) // 打印当前标题
title.value = 'Electron Vue 应用' // 更改当前标题

const { createWindow } = useWindowManager()

const openOnNewWindow = (tag: string) => {
    switch (tag) {
        case 'count':
            createWindow({
                route: '/count',
                width: 600,
                height: 400
            })
            break
        case 'python-service':
            createWindow({
                route: '/python-service',
                width: 800,
                height: 1000
            })
            break
        default:
            break
    }
}

</script>

<template>
    <div class="flex p-10 gap-4 h-full">
        <n-card title="Electron Vue   应用">
            <div class="flex flex-col">
                <p class="text-gray-600">
                    这是一个基于 Electron + Vue 3 + Pinia + electron-store 构建的现代化桌面应用程序，提供完整的状态管理和跨窗口数据同步功能。
                </p>

                <div class="feature-list">
                    <h4>核心特性：</h4>
                    <ul>
                        <li>🔄 <strong>自动状态持久化</strong>：基于 electron-store 的数据持久化</li>
                        <li>🪟 <strong>跨窗口状态同步</strong>：多窗口实时数据同步</li>
                        <li>⚡ <strong>现代化技术栈</strong>：Vue 3 + Pinia + TypeScript</li>
                        <li>🎨 <strong>美观界面</strong>：Naive UI 组件库 + UnoCSS</li>
                        <li>🐍 <strong>Python服务集成</strong>：支持HTTP API、WebSocket</li>
                    </ul>
                </div>

                <div class="navigation-section">
                    <h4>页面导航：</h4>
                    <n-space>
                        <n-button type="primary" size="small" @click="openOnNewWindow('count')">计数器演示</n-button>
                        <n-button type="success" size="small" @click="openOnNewWindow('python-service')">
                            Python服务</n-button>
                    </n-space>
                </div>
            </div>
        </n-card>
    </div>
</template>

<style scoped>
.feature-list {
    background: var(--code-color);
    padding: 16px;
    border-radius: 8px;
    margin-top: 12px;
}

.feature-list h4 {
    margin: 0 0 12px 0;
    color: var(--text-color-1);
}

.feature-list ul {
    margin: 0;
    padding-left: 20px;
}

.feature-list li {
    margin: 8px 0;
    color: var(--text-color-2);
    line-height: 1.6;
}

.navigation-section {
    background: var(--code-color);
    padding: 16px;
    border-radius: 8px;
    margin-top: 12px;
}

.navigation-section h4 {
    margin: 0 0 12px 0;
    color: var(--text-color-1);
}
</style>

<style scoped></style>

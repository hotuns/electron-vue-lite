<script setup lang="ts">
import PiniaCounterDemo from '../components/PiniaCounterDemo.vue'
</script>

<template>
    <div class="flex p-10 gap-4 h-full">
        <n-card title="Electron Vue   应用" class="w-1/2">
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
                    </ul>
                </div>
            </div>
        </n-card>

        <!-- Pinia + electron-store 计数器演示 -->
        <PiniaCounterDemo />
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
</style>

<style scoped></style>

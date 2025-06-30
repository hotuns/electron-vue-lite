<template>
  <div class="titlebar" :class="{ 'mac-titlebar': isMac }">
    <!-- 左侧：应用图标和标题 -->
    <div class="titlebar-left" :class="{ 'mac-titlebar-left': isMac }">
      <template v-if="!isMac">
        <div class="app-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="app-title">自定义标题栏</span>
      </template>
      <button class="settings-btn" @click="showSettings" title="设置">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
          />
        </svg>
      </button>
    </div>

    <!-- 中间：可拖拽区域 -->
    <div
      class="titlebar-center drag-region"
      :class="{ 'mac-titlebar-center': isMac }"
    >
      <span class="window-title" :class="{ 'mac-window-title': isMac }">{{
        windowTitle
      }}</span>
    </div>

    <!-- 右侧：窗口控制按钮 -->
    <div class="titlebar-right" :class="{ 'mac-titlebar-right': isMac }">
      <template v-if="!isMac">
        <button
          class="control-btn minimize-btn"
          @click="minimizeWindow"
          title="最小化"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="5" width="8" height="2" />
          </svg>
        </button>

        <button
          class="control-btn maximize-btn"
          @click="toggleMaximize"
          :title="isMaximized ? '向下还原' : '最大化'"
        >
          <svg
            v-if="!isMaximized"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <rect
              x="2"
              y="2"
              width="8"
              height="8"
              stroke="currentColor"
              stroke-width="1"
              fill="none"
            />
          </svg>
          <svg
            v-else
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <rect
              x="1"
              y="3"
              width="6"
              height="6"
              stroke="currentColor"
              stroke-width="1"
              fill="none"
            />
            <rect
              x="3"
              y="1"
              width="6"
              height="6"
              stroke="currentColor"
              stroke-width="1"
              fill="none"
            />
          </svg>
        </button>

        <button class="control-btn close-btn" @click="closeWindow" title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              stroke-width="1"
            />
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowTitle } from "@/hooks/useWindowTitle";
import { useAppActions } from "@/hooks/useAppActions";

// 使用窗口控制Hook
const { isMaximized, minimizeWindow, toggleMaximize, closeWindow } = useWindowControls();

// 使用窗口标题Hook
const { windowTitle } = useWindowTitle();

// 使用应用信息Hook
const { appInfo, refreshAppInfo } = useAppActions();

// 定义事件
const emit = defineEmits<{
  showSettings: [];
}>();

// 检查是否为 macOS 平台
const isMac = ref(false);

onMounted(async () => {
  await refreshAppInfo();
  isMac.value = appInfo.value?.platform === "darwin";
});

// 显示设置
const showSettings = () => {
  emit("showSettings");
};
</script>

<style lang="postcss" scoped>
.titlebar {
  @apply flex items-center justify-between bg-gray-100 border-b border-gray-200;
  height: 32px;
  min-height: 32px;
  user-select: none;
  -webkit-user-select: none;
}

/* macOS 标题栏样式 */
.mac-titlebar {
  @apply bg-transparent border-none;
  height: 28px;
  min-height: 28px;
  padding-left: 80px; /* 为红绿灯按钮留出空间 */
}

.titlebar-left {
  @apply flex items-center px-3 gap-2;
  min-width: 200px;
}

.mac-titlebar-left {
  min-width: auto;
}

.app-icon {
  @apply text-blue-600;
  width: 20px;
  height: 20px;
}

.app-title {
  @apply text-sm font-medium text-gray-700;
}

.settings-btn {
  @apply flex items-center justify-center transition-colors duration-200 ml-2;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: #666;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.settings-btn:hover {
  @apply bg-gray-200;
  color: #333;
}

.titlebar-center {
  @apply flex-1 flex items-center justify-center px-4;
  min-height: 32px;
}

.mac-titlebar-center {
  justify-content: flex-start;
  min-height: 28px;
}

.drag-region {
  -webkit-app-region: drag;
  app-region: drag;
}

.window-title {
  @apply text-sm text-gray-600;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.mac-window-title {
  @apply font-medium;
}

.titlebar-right {
  @apply flex items-center;
  min-width: 138px;
}

.mac-titlebar-right {
  min-width: auto;
}

.control-btn {
  @apply flex items-center justify-center transition-colors duration-200;
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.minimize-btn:hover,
.maximize-btn:hover {
  @apply bg-gray-200;
}

.close-btn:hover {
  @apply bg-red-500 text-white;
}

.control-btn:active {
  @apply bg-gray-300;
}

.close-btn:active {
  @apply bg-red-600;
}

/* 深色主题支持 */
.dark .titlebar {
  @apply bg-gray-800 border-gray-700;
}

.dark .mac-titlebar {
  @apply bg-transparent border-none;
}

.dark .app-title {
  @apply text-gray-300;
}

.dark .window-title {
  @apply text-gray-400;
}

.dark .minimize-btn:hover,
.dark .maximize-btn:hover {
  @apply bg-gray-700;
}

.dark .control-btn:active {
  @apply bg-gray-600;
}

.dark .settings-btn {
  color: #ccc;
}

.dark .settings-btn:hover {
  @apply bg-gray-700;
  color: #fff;
}
</style>

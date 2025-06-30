<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { darkTheme, lightTheme } from 'naive-ui'
import { NConfigProvider, GlobalThemeOverrides, NDrawer, NDrawerContent } from 'naive-ui'
import TitleBar from '@/components/TitleBar.vue'
import AppSetting from '@/components/AppSetting.vue'

const themeOverrides: GlobalThemeOverrides = {
  // common: {
  //   primaryColor: '#FF0000'
  // },
  // Button: {
  //   textColor: '#FF0000'
  // }
}

const theme = ref(lightTheme)
const showSettingsDrawer = ref(false)

// 显示设置
const handleShowSettings = () => {
  showSettingsDrawer.value = true
}

// 关闭设置
const handleCloseSettings = () => {
  showSettingsDrawer.value = false
}

// 监听菜单事件
onMounted(() => {
  if (window.ipcRenderer) {
    // 监听来自菜单的设置打开事件
    window.ipcRenderer.on('menu:open-settings', () => {
      handleShowSettings()
    })
  }
})

onUnmounted(() => {
  if (window.ipcRenderer) {
    window.ipcRenderer.removeAllListeners('menu:open-settings')
  }
})

const route = useRoute()

</script>

<template>
  <div class="app-container">
    <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
      <n-modal-provider>
        <n-message-provider>
          <n-dialog-provider>

            <!-- 自定义标题栏 -->
            <TitleBar @show-settings="handleShowSettings" />


            <!-- 主要内容区域 -->
            <div class="content-area">
              <RouterView />
            </div>

            <!-- 设置抽屉 -->
            <n-drawer v-model:show="showSettingsDrawer" :width="800" placement="right" :block-scroll="true">
              <n-drawer-content title="应用设置" closable>
                <AppSetting />
              </n-drawer-content>
            </n-drawer>

          </n-dialog-provider>
        </n-message-provider>
      </n-modal-provider>
    </n-config-provider>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 16px;
}
</style>
<template>
  <div class="app-updater">
    <!-- 更新检查按钮 -->
    <div class="update-controls" v-if="!isChecking && !updateAvailable && !isDownloading">
      <n-button 
        type="primary" 
        @click="checkForUpdates"
        :loading="isChecking"
        size="small"
      >
        检查更新
      </n-button>
      <span class="current-version">当前版本: v{{ currentVersion }}</span>
    </div>

    <!-- 检查更新中 -->
    <div class="update-status" v-if="isChecking">
      <n-spin size="small" />
      <span>正在检查更新...</span>
    </div>

    <!-- 发现新版本 -->
    <div class="update-available" v-if="updateAvailable && !isDownloading">
      <n-alert type="info" :bordered="false">
        <template #header>
          发现新版本
        </template>
        <div class="update-info">
          <p>新版本: v{{ updateInfo?.version }}</p>
          <p>当前版本: v{{ currentVersion }}</p>
        </div>
        <template #action>
          <n-button size="small" type="primary" @click="downloadUpdate">
            下载更新
          </n-button>
        </template>
      </n-alert>
    </div>

    <!-- 下载进度 -->
    <div class="download-progress" v-if="isDownloading">
      <n-alert type="info" :bordered="false">
        <template #header>
          正在下载更新
        </template>
        <div class="progress-info">
          <n-progress 
            type="line" 
            :percentage="downloadProgress.percent || 0"
            :show-indicator="true"
          />
          <div class="progress-details">
            <span>下载速度: {{ formatBytes(downloadProgress.bytesPerSecond || 0) }}/s</span>
            <span>{{ formatBytes(downloadProgress.transferred || 0) }} / {{ formatBytes(downloadProgress.total || 0) }}</span>
          </div>
        </div>
      </n-alert>
    </div>

    <!-- 下载完成 -->
    <div class="download-complete" v-if="updateDownloaded">
      <n-alert type="success" :bordered="false">
        <template #header>
          更新下载完成
        </template>
        <p>更新已下载完成，重启应用即可安装新版本</p>
        <template #action>
          <n-button size="small" type="primary" @click="installUpdate">
            立即重启
          </n-button>
        </template>
      </n-alert>
    </div>

    <!-- 错误提示 -->
    <div class="update-error" v-if="errorMessage">
      <n-alert type="error" :bordered="false" closable @close="clearError">
        <template #header>
          更新失败
        </template>
        {{ errorMessage }}
      </n-alert>
    </div>

    <!-- 暂无更新 -->
    <div class="no-update" v-if="noUpdateAvailable">
      <n-alert type="success" :bordered="false" closable @close="noUpdateAvailable = false">
        <template #header>
          已是最新版本
        </template>
        您的应用已经是最新版本
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton, NAlert, NProgress, NSpin, useMessage } from 'naive-ui'

interface UpdateInfo {
  version: string
  files: any[]
  path: string
  sha512: string
  releaseDate: string
}

interface DownloadProgress {
  bytesPerSecond: number
  percent: number
  transferred: number
  total: number
}

const message = useMessage()

// 状态管理
const currentVersion = ref('')
const isChecking = ref(false)
const updateAvailable = ref(false)
const updateInfo = ref<UpdateInfo | null>(null)
const isDownloading = ref(false)
const downloadProgress = ref<DownloadProgress>({
  bytesPerSecond: 0,
  percent: 0,
  transferred: 0,
  total: 0
})
const updateDownloaded = ref(false)
const errorMessage = ref('')
const noUpdateAvailable = ref(false)

// 清理函数
let cleanupFunctions: (() => void)[] = []

// 检查更新
const checkForUpdates = async () => {
  isChecking.value = true
  errorMessage.value = ''
  noUpdateAvailable.value = false
  
  try {
    const result = await window.updateAPI.checkForUpdates()
    if (result.success && result.updateInfo) {
      updateAvailable.value = true
      updateInfo.value = result.updateInfo
      message.success('发现新版本!')
    } else if (result.error) {
      errorMessage.value = result.error
    }
  } catch (error) {
    errorMessage.value = '检查更新失败'
    console.error('检查更新失败:', error)
  } finally {
    isChecking.value = false
  }
}

// 下载更新
const downloadUpdate = async () => {
  isDownloading.value = true
  updateAvailable.value = false
  
  try {
    const result = await window.updateAPI.downloadUpdate()
    if (!result.success && result.error) {
      errorMessage.value = result.error
      isDownloading.value = false
    }
  } catch (error) {
    errorMessage.value = '下载更新失败'
    isDownloading.value = false
    console.error('下载更新失败:', error)
  }
}

// 安装更新
const installUpdate = async () => {
  try {
    await window.updateAPI.installUpdate()
  } catch (error) {
    errorMessage.value = '安装更新失败'
    console.error('安装更新失败:', error)
  }
}

// 清除错误信息
const clearError = () => {
  errorMessage.value = ''
}

// 格式化字节大小
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 组件挂载
onMounted(async () => {
  // 获取当前版本
  try {
    currentVersion.value = await window.appAPI.getVersion()
  } catch (error) {
    console.error('获取版本失败:', error)
  }

  // 监听更新事件
  cleanupFunctions.push(
    window.updateAPI.onCheckingForUpdate(() => {
      isChecking.value = true
    }),
    
    window.updateAPI.onUpdateAvailable((info: UpdateInfo) => {
      updateAvailable.value = true
      updateInfo.value = info
      isChecking.value = false
    }),
    
    window.updateAPI.onUpdateNotAvailable(() => {
      noUpdateAvailable.value = true
      isChecking.value = false
    }),
    
    window.updateAPI.onUpdateError((error: string) => {
      errorMessage.value = error
      isChecking.value = false
      isDownloading.value = false
    }),
    
    window.updateAPI.onDownloadProgress((progress: DownloadProgress) => {
      downloadProgress.value = progress
    }),
    
    window.updateAPI.onUpdateDownloaded(() => {
      isDownloading.value = false
      updateDownloaded.value = true
      message.success('更新下载完成!')
    })
  )
})

// 组件卸载
onUnmounted(() => {
  cleanupFunctions.forEach(cleanup => cleanup())
})
</script>

<style scoped>
.app-updater {
  padding: 16px;
}

.update-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-version {
  color: #666;
  font-size: 12px;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

.update-info {
  margin: 8px 0;
}

.update-info p {
  margin: 4px 0;
}

.progress-info {
  margin-top: 8px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.update-available,
.download-progress,
.download-complete,
.update-error,
.no-update {
  margin-top: 12px;
}
</style> 
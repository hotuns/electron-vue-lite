<template>
  <div class="app-updater">
    <!-- 更新检查按钮 -->
    <div class="update-controls" v-if="!isChecking && !updateAvailable && !isDownloading">
      <n-button type="primary" @click="checkForUpdates" :loading="isChecking" size="small">
        检查更新
      </n-button>
      <span class="current-version">当前版本: v{{ currentVersion }}</span>
    </div>

    <!-- 检查更新中 -->
    <div class="update-status" v-if="isChecking">
      <n-spin size="small" />
      <span>正在检查更新...</span>
    </div>

    <!-- 下载进度 -->
    <div class="download-progress" v-if="isDownloading">
      <div class="progress-info">
        <h3>正在下载更新</h3>
        <n-progress type="line" :percentage="downloadProgress.percent || 0" :show-indicator="true" />
        <div class="progress-details">
          <span>下载速度: {{ formatBytes(downloadProgress.bytesPerSecond || 0) }}/s</span>
          <span>{{ formatBytes(downloadProgress.transferred || 0) }} / {{ formatBytes(downloadProgress.total || 0)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton, NProgress, NSpin, useMessage, useDialog } from 'naive-ui'

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
const dialog = useDialog()

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

// 显示更新可用对话框
const showUpdateAvailableDialog = () => {
  dialog.info({
    title: '发现新版本',
    content: `新版本: v${updateInfo.value?.version}\n当前版本: v${currentVersion.value}`,
    positiveText: '下载更新',
    negativeText: '取消',
    onPositiveClick: () => {
      downloadUpdate()
    }
  })
}

// 显示下载完成对话框
const showDownloadCompleteDialog = () => {
  dialog.success({
    title: '更新下载完成',
    content: '更新已下载完成，重启应用即可安装新版本',
    positiveText: '立即重启',
    negativeText: '稍后重启',
    onPositiveClick: () => {
      installUpdate()
    }
  })
}

// 显示错误对话框
const showErrorDialog = (error: string) => {
  dialog.error({
    title: '更新失败',
    content: error,
    positiveText: '确定'
  })
}

// 显示无更新对话框
const showNoUpdateDialog = () => {
  dialog.success({
    title: '已是最新版本',
    content: '您的应用已经是最新版本',
    positiveText: '确定'
  })
}

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
      showUpdateAvailableDialog()
    } else if (result.error) {
      errorMessage.value = result.error
      showErrorDialog(result.error)
    }
  } catch (error) {
    errorMessage.value = '检查更新失败'
    showErrorDialog('检查更新失败')
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
      showErrorDialog(result.error)
      isDownloading.value = false
    }
  } catch (error) {
    errorMessage.value = '下载更新失败'
    showErrorDialog('下载更新失败')
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
    showErrorDialog('安装更新失败')
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
      showUpdateAvailableDialog()
    }),

    window.updateAPI.onUpdateNotAvailable(() => {
      noUpdateAvailable.value = true
      isChecking.value = false
      showNoUpdateDialog()
    }),

    window.updateAPI.onUpdateError((error: string) => {
      errorMessage.value = error
      isChecking.value = false
      isDownloading.value = false
      showErrorDialog(error)
    }),

    window.updateAPI.onDownloadProgress((progress: DownloadProgress) => {
      downloadProgress.value = progress
    }),

    window.updateAPI.onUpdateDownloaded(() => {
      isDownloading.value = false
      updateDownloaded.value = true
      message.success('更新下载完成!')
      showDownloadCompleteDialog()
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

.progress-info {
  margin-top: 8px;
}

.progress-info h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.download-progress {
  margin-top: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
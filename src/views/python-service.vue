<template>
    <div class="python-service-container">
        <div class="header-section">
            <!-- Python 服务管理面板 -->
            <n-card title="🔧 Python 服务管理" class="service-control-card">
                <div class="service-control-row">
                    <div class="service-status">
                        <n-tag :type="pythonServiceStatus.running ? 'success' : 'error'" size="medium">
                            {{ pythonServiceStatus.running ? '运行中' : '已停止' }}
                        </n-tag>
                        <span v-if="pythonServiceStatus.running && pythonServiceStatus.pid" class="service-info-text">
                            PID: {{ pythonServiceStatus.pid }} | 端口: {{ pythonServiceStatus.port }}
                        </span>
                        <n-tag v-if="pythonServiceIsHealthy" type="success" size="small">健康</n-tag>
                        <n-tag v-else-if="pythonServiceStatus.running" type="warning" size="small">不健康</n-tag>
                    </div>

                    <div class="service-controls">
                        <n-button @click="handleStartPythonService" :loading="pythonServiceLoading.starting"
                            :disabled="pythonServiceStatus.running" type="success" size="small">
                            🚀 启动服务
                        </n-button>
                        <n-button @click="handleStopPythonService" :loading="pythonServiceLoading.stopping"
                            :disabled="!pythonServiceStatus.running" type="error" size="small">
                            🛑 停止服务
                        </n-button>
                        <n-button @click="handleRestartPythonService" :loading="pythonServiceLoading.restarting"
                            type="warning" size="small">
                            🔄 重启服务
                        </n-button>
                        <n-button @click="refreshPythonServiceStatus" :loading="pythonServiceLoading.checking"
                            size="small">
                            ⚡ 刷新状态
                        </n-button>
                    </div>
                </div>

                <div v-if="pythonServiceError" class="service-error">
                    <n-alert type="error" :title="pythonServiceError" closable @close="clearPythonServiceError" />
                </div>
            </n-card>

            <n-card title="🐍 Python 服务连接" class="service-status-card">
                <div class="status-row">
                    <n-tag :type="serviceStatus.http ? 'success' : 'error'" size="small">
                        HTTP API: {{ serviceStatus.http ? '已连接' : '断开' }}
                    </n-tag>
                    <n-tag :type="serviceStatus.websocket ? 'success' : 'error'" size="small">
                        WebSocket: {{ serviceStatus.websocket ? '已连接' : '断开' }}
                    </n-tag>
                    <n-button @click="checkServiceStatus" :loading="statusLoading" size="small">
                        刷新状态
                    </n-button>
                </div>
                <div v-if="pythonServiceInfo" class="service-info">
                    <p><strong>服务名:</strong> {{ pythonServiceInfo.app_name }}</p>
                    <p><strong>版本:</strong> {{ pythonServiceInfo.version }}</p>
                </div>
            </n-card>
        </div>

        <div class="content-section">
            <!-- HTTP API 面板 -->
            <n-card title="📡 HTTP API 数据管理" class="api-panel">
                <div class="data-controls">
                    <n-space>
                        <n-button @click="loadDataList" :loading="loading" type="primary">
                            🔄 刷新数据
                        </n-button>
                        <n-button @click="showCreateModal = true" type="success">
                            ➕ 创建数据
                        </n-button>
                        <n-input v-model:value="searchText" placeholder="搜索数据..." @keyup.enter="searchData"
                            style="width: 200px" />
                        <n-button @click="searchData">🔍 搜索</n-button>
                    </n-space>
                </div>

                <!-- 数据表格 -->
                <n-data-table :columns="dataColumns" :data="dataList" :loading="loading" :pagination="pagination"
                    class="data-table" />
            </n-card>

            <!-- WebSocket 面板 -->
            <n-card title="⚡ WebSocket 实时通信" class="websocket-panel">
                <div class="websocket-controls">
                    <n-space>
                        <n-button @click="toggleWebSocket" :type="serviceStatus.websocket ? 'error' : 'success'">
                            {{ serviceStatus.websocket ? '断开连接' : '连接WebSocket' }}
                        </n-button>
                        <n-button @click="sendPing" :disabled="!serviceStatus.websocket">
                            📡 发送Ping
                        </n-button>
                        <n-button @click="sendTestData" :disabled="!serviceStatus.websocket">
                            📤 发送测试数据
                        </n-button>
                    </n-space>
                </div>

                <div class="message-area">
                    <n-input v-model:value="broadcastMessage" placeholder="输入广播消息..." @keyup.enter="sendBroadcast" />
                    <n-button @click="sendBroadcast" :disabled="!serviceStatus.websocket" style="margin-left: 8px">
                        📢 广播
                    </n-button>
                </div>

                <!-- 消息日志 -->
                <div class="message-log">
                    <h4>消息日志:</h4>
                    <div class="log-content" ref="logContainer">
                        <div v-for="(msg, index) in messageLog" :key="index" class="log-item">
                            <span class="timestamp">{{ msg.timestamp }}</span>
                            <span class="message-type" :class="msg.type">{{ msg.type }}</span>
                            <span class="message-content">{{ msg.content }}</span>
                        </div>
                    </div>
                </div>
            </n-card>
        </div>

        <!-- 创建/编辑数据模态框 -->
        <n-modal v-model:show="showCreateModal" title="创建数据">
            <n-card style="width: 500px" title="数据信息">
                <n-form :model="formData" label-placement="left" label-width="auto">
                    <n-form-item label="名称" required>
                        <n-input v-model:value="formData.name" placeholder="请输入名称" />
                    </n-form-item>
                    <n-form-item label="值">
                        <n-input v-model:value="formData.value" placeholder="请输入值" />
                    </n-form-item>
                    <n-form-item label="元数据 (JSON)">
                        <n-input v-model:value="formData.metadataStr" type="textarea" placeholder='{"key": "value"}'
                            :rows="3" />
                    </n-form-item>
                </n-form>
                <div class="modal-actions">
                    <n-space>
                        <n-button @click="showCreateModal = false">取消</n-button>
                        <n-button @click="handleCreateData" type="primary" :loading="saving">
                            创建
                        </n-button>
                    </n-space>
                </div>
            </n-card>
        </n-modal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, h } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import { pythonApi, pythonWs, type DataItem } from '@/utils/pythonApi'
import { usePythonService } from '@/hooks/usePythonService'

// 消息通知
const message = useMessage()

// Python 服务管理
const {
    status: pythonServiceStatus,
    isHealthy: pythonServiceIsHealthy,
    loading: pythonServiceLoading,
    error: pythonServiceError,
    start: startPythonService,
    stop: stopPythonService,
    restart: restartPythonService,
    getStatus: getPythonServiceStatus,
    clearError: clearPythonServiceError
} = usePythonService()

// 响应式数据
const serviceStatus = reactive({
    http: false,
    websocket: false
})

const pythonServiceInfo = ref<any>(null)
const statusLoading = ref(false)
const loading = ref(false)
const saving = ref(false)
const dataList = ref<DataItem[]>([])
const searchText = ref('')
const showCreateModal = ref(false)
const broadcastMessage = ref('')
const messageLog = ref<Array<{ timestamp: string; type: string; content: string }>>([])
const logContainer = ref<HTMLElement>()

// 表单数据
const formData = reactive({
    name: '',
    value: '',
    metadataStr: ''
})

// 分页配置
const pagination = reactive({
    page: 1,
    pageSize: 10,
    itemCount: 0,
    onChange: (page: number) => {
        pagination.page = page
        loadDataList()
    }
})

// 数据表格列配置
const dataColumns = [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', ellipsis: true },
    { title: '值', key: 'value', ellipsis: true },
    { title: '创建时间', key: 'created_at', width: 180 },
    {
        title: '操作',
        key: 'actions',
        width: 120,
        render: (row: DataItem) => {
            return [
                h(NButton, {
                    size: 'small',
                    type: 'error',
                    onClick: () => handleDeleteData(row.id!)
                }, '删除')
            ]
        }
    }
]

// 检查服务状态
const checkServiceStatus = async () => {
    statusLoading.value = true
    try {
        // 检查HTTP API
        const healthResponse = await pythonApi.healthCheck()
        serviceStatus.http = healthResponse.status === 'healthy'

        // 获取服务信息
        const statusResponse = await pythonApi.getStatus()
        pythonServiceInfo.value = statusResponse

        addLog('info', '服务状态检查完成')
    } catch (error) {
        serviceStatus.http = false
        addLog('error', `HTTP API连接失败: ${error}`)
    } finally {
        statusLoading.value = false
    }
}

// 加载数据列表
const loadDataList = async () => {
    loading.value = true
    try {
        const response = await pythonApi.getDataList({
            page: pagination.page,
            page_size: pagination.pageSize,
            search: searchText.value
        })

        if (response.success) {
            dataList.value = response.data || []
            pagination.itemCount = response.total || 0
            addLog('info', `加载了 ${dataList.value.length} 条数据`)
        }
    } catch (error) {
        addLog('error', `加载数据失败: ${error}`)
    } finally {
        loading.value = false
    }
}

// 搜索数据
const searchData = () => {
    pagination.page = 1
    loadDataList()
}

// 创建数据
const handleCreateData = async () => {
    if (!formData.name.trim()) {
        message.error('请输入名称')
        return
    }

    saving.value = true
    try {
        let metadata = undefined
        if (formData.metadataStr.trim()) {
            try {
                metadata = JSON.parse(formData.metadataStr)
            } catch {
                message.error('元数据JSON格式错误')
                return
            }
        }

        const response = await pythonApi.createData({
            name: formData.name,
            value: formData.value,
            metadata
        })

        if (response.success) {
            message.success('创建成功')
            showCreateModal.value = false
            Object.assign(formData, { name: '', value: '', metadataStr: '' })
            loadDataList()
            addLog('success', `创建数据: ${formData.name}`)
        }
    } catch (error) {
        addLog('error', `创建数据失败: ${error}`)
    } finally {
        saving.value = false
    }
}

// 删除数据
const handleDeleteData = async (id: number) => {
    try {
        const response = await pythonApi.deleteData(id)
        if (response.success) {
            message.success('删除成功')
            loadDataList()
            addLog('success', `删除数据ID: ${id}`)
        }
    } catch (error) {
        addLog('error', `删除数据失败: ${error}`)
    }
}

// WebSocket 连接切换
const toggleWebSocket = async () => {
    if (serviceStatus.websocket) {
        pythonWs.disconnect()
        serviceStatus.websocket = false
        addLog('info', 'WebSocket已断开')
    } else {
        try {
            await pythonWs.connect()
            serviceStatus.websocket = true
            addLog('success', 'WebSocket连接成功')
        } catch (error) {
            addLog('error', `WebSocket连接失败: ${error}`)
        }
    }
}

// 发送Ping
const sendPing = () => {
    pythonWs.sendPing()
    addLog('info', '发送Ping')
}

// 发送测试数据
const sendTestData = () => {
    const testData = {
        message: '来自Vue应用的测试数据',
        timestamp: new Date().toISOString(),
        random: Math.random()
    }
    pythonWs.sendData(testData)
    addLog('info', `发送测试数据: ${JSON.stringify(testData)}`)
}

// 发送广播
const sendBroadcast = () => {
    if (!broadcastMessage.value.trim()) return

    pythonWs.broadcast(broadcastMessage.value)
    addLog('info', `广播消息: ${broadcastMessage.value}`)
    broadcastMessage.value = ''
}

// 添加日志
const addLog = (type: string, content: string) => {
    messageLog.value.push({
        timestamp: new Date().toLocaleTimeString(),
        type,
        content
    })

    // 限制日志数量
    if (messageLog.value.length > 100) {
        messageLog.value.shift()
    }

    // 滚动到底部
    nextTick(() => {
        if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
    })
}

// 组件挂载
onMounted(() => {
    // 设置WebSocket消息处理器
    pythonWs.onMessage('pong', (data) => {
        addLog('pong', `收到Pong: ${JSON.stringify(data)}`)
    })

    pythonWs.onMessage('data', (data) => {
        addLog('data', `收到数据: ${JSON.stringify(data)}`)
    })

    pythonWs.onMessage('broadcast', (data) => {
        addLog('broadcast', `收到广播: ${JSON.stringify(data)}`)
    })

    pythonWs.onMessage('error', (data) => {
        addLog('error', `WebSocket错误: ${JSON.stringify(data)}`)
    })

    pythonWs.onConnection((connected) => {
        serviceStatus.websocket = connected
    })

    // 初始化检查服务状态
    checkServiceStatus()
})

// Python 服务管理方法
const handleStartPythonService = async () => {
    const response = await startPythonService()
    if (response?.success) {
        message.success('Python 服务启动成功')
        // 启动成功后检查连接状态
        setTimeout(checkServiceStatus, 2000)
    } else {
        message.error(`Python 服务启动失败: ${response?.message || '未知错误'}`)
    }
}

const handleStopPythonService = async () => {
    const response = await stopPythonService()
    if (response?.success) {
        message.success('Python 服务已停止')
        // 停止服务后更新连接状态
        serviceStatus.http = false
        serviceStatus.websocket = false
        pythonWs.disconnect()
    } else {
        message.error(`Python 服务停止失败: ${response?.message || '未知错误'}`)
    }
}

const handleRestartPythonService = async () => {
    const response = await restartPythonService()
    if (response?.success) {
        message.success('Python 服务重启成功')
        // 重启成功后检查连接状态
        setTimeout(checkServiceStatus, 2000)
    } else {
        message.error(`Python 服务重启失败: ${response?.message || '未知错误'}`)
    }
}

const refreshPythonServiceStatus = async () => {
    await getPythonServiceStatus()
}

// 组件卸载
onUnmounted(() => {
    pythonWs.disconnect()
})
</script>

<style scoped>
.python-service-container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: calc(100vh - 120px);
}

.header-section {
    flex-shrink: 0;
}

.service-control-card {
    color: white;
    margin-bottom: 16px;
}

.service-control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.service-status {
    display: flex;
    align-items: center;
    gap: 12px;
}

.service-info-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
}

.service-controls {
    display: flex;
    gap: 8px;
}

.service-error {
    margin-top: 12px;
}

.service-status-card {
    color: white;
}

.status-row {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
}

.service-info {
    margin-top: 8px;
    opacity: 0.9;
}

.content-section {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    min-height: 0;
}

.api-panel,
.websocket-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.data-controls {
    margin-bottom: 16px;
}

.data-table {
    flex: 1;
}

.websocket-controls {
    margin-bottom: 16px;
}

.message-area {
    display: flex;
    margin-bottom: 16px;
}

.message-log {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.log-content {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 8px;
    height: 200px;
    overflow-y: auto;
    background: var(--code-color);
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.log-item {
    margin: 2px 0;
    word-break: break-all;
}

.timestamp {
    color: #888;
    margin-right: 8px;
}

.message-type {
    font-weight: bold;
    margin-right: 8px;
    padding: 2px 4px;
    border-radius: 2px;
}

.message-type.success {
    background: #52c41a;
    color: white;
}

.message-type.error {
    background: #ff4d4f;
    color: white;
}

.message-type.info {
    background: #1890ff;
    color: white;
}

.message-type.pong {
    background: #722ed1;
    color: white;
}

.message-type.data {
    background: #13c2c2;
    color: white;
}

.message-type.broadcast {
    background: #fa8c16;
    color: white;
}

.modal-actions {
    margin-top: 16px;
    text-align: right;
}

@media (max-width: 1600px) {
    .content-section {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
}

@media (max-width: 1200px) {
    .content-section {
        grid-template-columns: 1fr;
        gap: 12px;
    }
}
</style>
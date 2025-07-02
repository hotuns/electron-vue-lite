/**
 * Python服务API调用工具
 */

// Python服务配置
const PYTHON_API_BASE = 'http://localhost:8000'
const PYTHON_WS_URL = 'ws://localhost:8000/ws/connect'

// 数据类型定义
export interface DataItem {
    id?: number
    name: string
    value?: string
    metadata?: Record<string, any>
    created_at?: string
    updated_at?: string
}

export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data?: T
    total?: number
}

export interface WSMessage {
    type: 'ping' | 'pong' | 'data' | 'broadcast' | 'error'
    data?: any
    timestamp?: string
    client_id?: string
}

/**
 * HTTP API 调用类
 */
export class PythonHttpApi {
    private baseUrl: string

    constructor(baseUrl = PYTHON_API_BASE) {
        this.baseUrl = baseUrl
    }

    // 通用请求方法
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response.json()
    }

    // 健康检查
    async healthCheck() {
        return this.request<{ status: string; timestamp: string; services: Record<string, string> }>('/api/health')
    }

    // 获取数据列表
    async getDataList(params: { page?: number; page_size?: number; search?: string } = {}) {
        const searchParams = new URLSearchParams()
        if (params.page) searchParams.set('page', params.page.toString())
        if (params.page_size) searchParams.set('page_size', params.page_size.toString())
        if (params.search) searchParams.set('search', params.search)

        const query = searchParams.toString()
        return this.request<ApiResponse<DataItem[]>>(`/api/data${query ? `?${query}` : ''}`)
    }

    // 获取单个数据
    async getData(id: number) {
        return this.request<ApiResponse<DataItem>>(`/api/data/${id}`)
    }

    // 创建数据
    async createData(data: Omit<DataItem, 'id'>) {
        return this.request<ApiResponse<DataItem>>('/api/data', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    // 更新数据
    async updateData(id: number, data: Omit<DataItem, 'id'>) {
        return this.request<ApiResponse<DataItem>>(`/api/data/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    // 删除数据
    async deleteData(id: number) {
        return this.request<ApiResponse<DataItem>>(`/api/data/${id}`, {
            method: 'DELETE',
        })
    }

    // 获取服务状态
    async getStatus() {
        return this.request<{
            app_name: string
            version: string
            services: Record<string, string>
            endpoints: Record<string, string>
        }>('/status')
    }
}

/**
 * WebSocket 连接管理类
 */
export class PythonWebSocket {
    private ws: WebSocket | null = null
    private url: string
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000
    private messageHandlers: Map<string, (data: any) => void> = new Map()
    private connectionHandlers: Array<(connected: boolean) => void> = []

    constructor(url = PYTHON_WS_URL) {
        this.url = url
    }

    // 连接WebSocket
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url)

                this.ws.onopen = () => {
                    console.log('WebSocket connected to Python service')
                    this.reconnectAttempts = 0
                    this.notifyConnectionHandlers(true)
                    resolve()
                }

                this.ws.onmessage = (event) => {
                    try {
                        const message: WSMessage = JSON.parse(event.data)
                        this.handleMessage(message)
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error)
                    }
                }

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected from Python service')
                    this.notifyConnectionHandlers(false)
                    this.attemptReconnect()
                }

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    reject(error)
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    // 断开连接
    disconnect() {
        if (this.ws) {
            this.ws.close()
            this.ws = null
        }
    }

    // 发送消息
    send(message: WSMessage) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.warn('WebSocket is not connected')
        }
    }

    // 发送Ping
    sendPing() {
        this.send({ type: 'ping' })
    }

    // 发送数据
    sendData(data: any) {
        this.send({ type: 'data', data })
    }

    // 广播消息
    broadcast(data: any) {
        this.send({ type: 'broadcast', data })
    }

    // 处理收到的消息
    private handleMessage(message: WSMessage) {
        const handler = this.messageHandlers.get(message.type)
        if (handler) {
            handler(message.data)
        }

        // 处理特殊消息类型
        if (message.type === 'ping') {
            // 自动回复pong
            this.send({ type: 'pong' })
        }
    }

    // 注册消息处理器
    onMessage(type: string, handler: (data: any) => void) {
        this.messageHandlers.set(type, handler)
    }

    // 注册连接状态处理器
    onConnection(handler: (connected: boolean) => void) {
        this.connectionHandlers.push(handler)
    }

    // 通知连接状态变化
    private notifyConnectionHandlers(connected: boolean) {
        this.connectionHandlers.forEach(handler => handler(connected))
    }

    // 尝试重连
    private attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error)
                })
            }, this.reconnectDelay * this.reconnectAttempts)
        }
    }

    // 获取连接状态
    get isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }
}

// 导出实例
export const pythonApi = new PythonHttpApi()
export const pythonWs = new PythonWebSocket() 
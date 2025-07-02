/**
 * gRPC客户端工具 - 通过IPC与主进程通信
 * 专为Electron渲染进程设计
 */


// 数据接口定义
export interface GrpcDataItem {
    id: number
    name: string
    value: string
    metadata: { [key: string]: string }
    created_at: string
    updated_at: string
}

export interface GrpcDataRequest {
    id?: number
    name?: string
    value?: string
    metadata?: { [key: string]: string }
}

export interface GrpcListRequest {
    page?: number
    page_size?: number
    search?: string
}

export interface GrpcDataResponse {
    success: boolean
    message: string
    data?: GrpcDataItem
    total?: number
}

export interface GrpcListResponse {
    success: boolean
    message: string
    items: GrpcDataItem[]
    total: number
}

export interface GrpcHealthResponse {
    status: string
    timestamp: string
    services: { [key: string]: string }
}

/**
 * gRPC客户端类 - 通过IPC与主进程通信
 */
export class ElectronGrpcClient {
    private isConnected = false

    /**
     * 初始化gRPC客户端
     */
    async initialize() {
        try {
            const result = await window.grpcApi.init()
            this.isConnected = result.success
            return result
        } catch (error) {
            this.isConnected = false
            throw error
        }
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<GrpcHealthResponse> {
        return await window.grpcApi.health()
    }

    /**
     * 获取单个数据
     */
    async getData(request: GrpcDataRequest): Promise<GrpcDataResponse> {
        if (request.id) {
            return await window.grpcApi.get(request.id)
        }
        throw new Error('需要提供数据ID')
    }

    /**
     * 创建数据
     */
    async createData(request: GrpcDataRequest): Promise<GrpcDataResponse> {
        return await window.grpcApi.create({
            name: request.name || '',
            value: request.value,
            metadata: request.metadata
        })
    }

    /**
     * 更新数据
     */
    async updateData(request: GrpcDataRequest): Promise<GrpcDataResponse> {
        if (!request.id) {
            throw new Error('需要提供数据ID')
        }
        return await window.grpcApi.update(request.id, {
            name: request.name,
            value: request.value,
            metadata: request.metadata
        })
    }

    /**
     * 删除数据
     */
    async deleteData(request: GrpcDataRequest): Promise<GrpcDataResponse> {
        if (!request.id) {
            throw new Error('需要提供数据ID')
        }
        return await window.grpcApi.delete(request.id)
    }

    /**
     * 获取数据列表
     */
    async listData(request: GrpcListRequest = {}): Promise<GrpcListResponse> {
        return await window.grpcApi.list({
            page: request.page,
            pageSize: request.page_size,
            search: request.search
        })
    }

    /**
     * 流式获取数据
     */
    async streamData(request: GrpcListRequest = {}): Promise<GrpcDataResponse[]> {
        return await window.grpcApi.stream({
            page: request.page,
            pageSize: request.page_size,
            search: request.search
        })
    }

    /**
     * 批量处理数据 (暂不支持)
     */
    async processDataBatch(requests: GrpcDataRequest[]): Promise<GrpcDataResponse> {
        throw new Error('批量处理暂不支持，请使用单个操作')
    }

    /**
     * 关闭连接
     */
    async close() {
        const result = await window.grpcApi.close()
        this.isConnected = false
        return result
    }

    /**
     * 获取连接状态
     */
    get connected() {
        return this.isConnected
    }
}

// 导出单例实例
export const grpcClient = new ElectronGrpcClient()

// 简化的API函数
export const grpcApi = {
    async init() {
        return grpcClient.initialize()
    },

    async health() {
        return grpcClient.healthCheck()
    },

    async create(data: { name: string; value?: string; metadata?: Record<string, string> }) {
        return grpcClient.createData(data)
    },

    async get(id: number) {
        return grpcClient.getData({ id })
    },

    async update(id: number, data: { name?: string; value?: string; metadata?: Record<string, string> }) {
        return grpcClient.updateData({ id, ...data })
    },

    async delete(id: number) {
        return grpcClient.deleteData({ id })
    },

    async list(params: { page?: number; pageSize?: number; search?: string } = {}) {
        return grpcClient.listData({
            page: params.page || 1,
            page_size: params.pageSize || 10,
            search: params.search || ''
        })
    },

    async stream(params: { page?: number; pageSize?: number; search?: string } = {}) {
        return grpcClient.streamData({
            page: params.page || 1,
            page_size: params.pageSize || 10,
            search: params.search || ''
        })
    },

    async batchCreate(dataList: Array<{ name: string; value?: string; metadata?: Record<string, string> }>) {
        return grpcClient.processDataBatch(dataList)
    },

    close() {
        grpcClient.close()
    }
}

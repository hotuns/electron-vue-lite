"""gRPC客户端工具"""
import asyncio
import grpc
from typing import List, Dict, Optional

from config import settings

# 导入生成的protobuf文件
try:
    from .proto import service_pb2, service_pb2_grpc
except ImportError:
    print("警告: protobuf文件未生成，请先运行生成命令")
    service_pb2 = None
    service_pb2_grpc = None


class DataServiceClient:
    """数据服务客户端"""
    
    def __init__(self, host: str = None, port: int = None):
        self.host = host or settings.grpc_host
        self.port = port or settings.grpc_port
        self.address = f"{self.host}:{self.port}"
        self.channel = None
        self.stub = None
    
    async def connect(self):
        """连接到gRPC服务器"""
        if not service_pb2_grpc:
            raise Exception("protobuf文件未生成")
        
        self.channel = grpc.aio.insecure_channel(self.address)
        self.stub = service_pb2_grpc.DataServiceStub(self.channel)
        print(f"已连接到gRPC服务器: {self.address}")
    
    async def close(self):
        """关闭连接"""
        if self.channel:
            await self.channel.close()
            print("gRPC连接已关闭")
    
    async def health_check(self) -> Dict:
        """健康检查"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.Empty()
        response = await self.stub.HealthCheck(request)
        
        return {
            "status": response.status,
            "timestamp": response.timestamp,
            "services": dict(response.services)
        }
    
    async def create_data(self, name: str, value: str = "", metadata: Dict[str, str] = None) -> Dict:
        """创建数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.DataRequest(
            name=name,
            value=value,
            metadata=metadata or {}
        )
        
        response = await self.stub.CreateData(request)
        
        return {
            "success": response.success,
            "message": response.message,
            "data": {
                "id": response.data.id,
                "name": response.data.name,
                "value": response.data.value,
                "metadata": dict(response.data.metadata),
                "created_at": response.data.created_at,
                "updated_at": response.data.updated_at
            } if response.data else None
        }
    
    async def get_data(self, data_id: int) -> Dict:
        """获取数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.DataRequest(id=data_id)
        response = await self.stub.GetData(request)
        
        return {
            "success": response.success,
            "message": response.message,
            "data": {
                "id": response.data.id,
                "name": response.data.name,
                "value": response.data.value,
                "metadata": dict(response.data.metadata),
                "created_at": response.data.created_at,
                "updated_at": response.data.updated_at
            } if response.data else None
        }
    
    async def update_data(self, data_id: int, name: str, value: str = "", metadata: Dict[str, str] = None) -> Dict:
        """更新数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.DataRequest(
            id=data_id,
            name=name,
            value=value,
            metadata=metadata or {}
        )
        
        response = await self.stub.UpdateData(request)
        
        return {
            "success": response.success,
            "message": response.message,
            "data": {
                "id": response.data.id,
                "name": response.data.name,
                "value": response.data.value,
                "metadata": dict(response.data.metadata),
                "created_at": response.data.created_at,
                "updated_at": response.data.updated_at
            } if response.data else None
        }
    
    async def delete_data(self, data_id: int) -> Dict:
        """删除数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.DataRequest(id=data_id)
        response = await self.stub.DeleteData(request)
        
        return {
            "success": response.success,
            "message": response.message,
            "data": {
                "id": response.data.id,
                "name": response.data.name,
                "value": response.data.value,
                "metadata": dict(response.data.metadata),
                "created_at": response.data.created_at,
                "updated_at": response.data.updated_at
            } if response.data else None
        }
    
    async def list_data(self, page: int = 1, page_size: int = 10, search: str = "") -> Dict:
        """获取数据列表"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.ListRequest(
            page=page,
            page_size=page_size,
            search=search
        )
        
        response = await self.stub.ListData(request)
        
        items = []
        for item in response.items:
            items.append({
                "id": item.id,
                "name": item.name,
                "value": item.value,
                "metadata": dict(item.metadata),
                "created_at": item.created_at,
                "updated_at": item.updated_at
            })
        
        return {
            "success": response.success,
            "message": response.message,
            "items": items,
            "total": response.total
        }
    
    async def stream_data(self, page: int = 1, page_size: int = 10, search: str = ""):
        """流式获取数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        request = service_pb2.ListRequest(
            page=page,
            page_size=page_size,
            search=search
        )
        
        async for response in self.stub.StreamData(request):
            yield {
                "success": response.success,
                "message": response.message,
                "data": {
                    "id": response.data.id,
                    "name": response.data.name,
                    "value": response.data.value,
                    "metadata": dict(response.data.metadata),
                    "created_at": response.data.created_at,
                    "updated_at": response.data.updated_at
                } if response.data else None
            }
    
    async def process_data_batch(self, data_list: List[Dict]) -> Dict:
        """批量处理数据"""
        if not self.stub:
            raise Exception("未连接到服务器")
        
        async def request_generator():
            for data in data_list:
                yield service_pb2.DataRequest(
                    name=data.get("name", ""),
                    value=data.get("value", ""),
                    metadata=data.get("metadata", {})
                )
        
        response = await self.stub.ProcessData(request_generator())
        
        return {
            "success": response.success,
            "message": response.message
        }


# 便捷函数
async def test_grpc_client():
    """测试gRPC客户端"""
    client = DataServiceClient()
    
    try:
        await client.connect()
        
        # 健康检查
        print("=== 健康检查 ===")
        health = await client.health_check()
        print(f"健康状态: {health}")
        
        # 创建数据
        print("\n=== 创建数据 ===")
        result = await client.create_data(
            name="测试数据",
            value="测试值",
            metadata={"type": "test", "version": "1.0"}
        )
        print(f"创建结果: {result}")
        
        if result["success"] and result["data"]:
            data_id = result["data"]["id"]
            
            # 获取数据
            print(f"\n=== 获取数据 {data_id} ===")
            get_result = await client.get_data(data_id)
            print(f"获取结果: {get_result}")
            
            # 更新数据
            print(f"\n=== 更新数据 {data_id} ===")
            update_result = await client.update_data(
                data_id,
                name="更新后的测试数据",
                value="更新后的测试值",
                metadata={"type": "test", "version": "2.0"}
            )
            print(f"更新结果: {update_result}")
            
            # 列表数据
            print("\n=== 获取数据列表 ===")
            list_result = await client.list_data()
            print(f"列表结果: {list_result}")
            
            # 流式获取数据
            print("\n=== 流式获取数据 ===")
            async for item in client.stream_data():
                print(f"流式数据: {item}")
            
            # 删除数据
            print(f"\n=== 删除数据 {data_id} ===")
            delete_result = await client.delete_data(data_id)
            print(f"删除结果: {delete_result}")
        
        # 批量处理
        print("\n=== 批量处理数据 ===")
        batch_data = [
            {"name": "批量数据1", "value": "值1", "metadata": {"batch": "true"}},
            {"name": "批量数据2", "value": "值2", "metadata": {"batch": "true"}},
        ]
        batch_result = await client.process_data_batch(batch_data)
        print(f"批量处理结果: {batch_result}")
        
    except Exception as e:
        print(f"测试过程中出错: {e}")
    
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(test_grpc_client()) 
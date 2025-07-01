"""gRPC服务器"""
import asyncio
import grpc
from concurrent import futures
from datetime import datetime
from typing import Dict, Optional

from config import settings

# 导入生成的protobuf文件（将在生成后可用）
try:
    from .proto import service_pb2, service_pb2_grpc
except ImportError:
    print("警告: protobuf文件未生成，请先运行生成命令")
    service_pb2 = None
    service_pb2_grpc = None


def create_data_servicer():
    
    class DataServicer(service_pb2_grpc.DataServiceServicer):
        """数据服务实现"""
        
        def __init__(self):
            # 模拟数据存储，与HTTP API共享
            self.data_store: Dict[int, dict] = {}
            self.next_id = 1
        
        def GetData(self, request, context):
            """获取单个数据"""
            if request.id not in self.data_store:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details('数据不存在')
                return service_pb2.DataResponse()
            
            data = self.data_store[request.id]
            item = service_pb2.DataItem(
                id=data['id'],
                name=data['name'],
                value=data.get('value', ''),
                metadata=data.get('metadata', {}),
                created_at=data.get('created_at', ''),
                updated_at=data.get('updated_at', '')
            )
            
            return service_pb2.DataResponse(
                success=True,
                message="获取数据成功",
                data=item
            )
        
        def CreateData(self, request, context):
            """创建数据"""
            item_id = self.next_id
            now = datetime.now().isoformat()
            
            data = {
                'id': item_id,
                'name': request.name,
                'value': request.value,
                'metadata': dict(request.metadata),
                'created_at': now,
                'updated_at': ''
            }
            
            self.data_store[item_id] = data
            self.next_id += 1
            
            item = service_pb2.DataItem(**data)
            
            return service_pb2.DataResponse(
                success=True,
                message="创建数据成功",
                data=item
            )
        
        def UpdateData(self, request, context):
            """更新数据"""
            if request.id not in self.data_store:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details('数据不存在')
                return service_pb2.DataResponse()
            
            data = self.data_store[request.id]
            data.update({
                'name': request.name,
                'value': request.value,
                'metadata': dict(request.metadata),
                'updated_at': datetime.now().isoformat()
            })
            
            item = service_pb2.DataItem(**data)
            
            return service_pb2.DataResponse(
                success=True,
                message="更新数据成功",
                data=item
            )
        
        def DeleteData(self, request, context):
            """删除数据"""
            if request.id not in self.data_store:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details('数据不存在')
                return service_pb2.DataResponse()
            
            data = self.data_store.pop(request.id)
            item = service_pb2.DataItem(**data)
            
            return service_pb2.DataResponse(
                success=True,
                message="删除数据成功",
                data=item
            )
        
        def ListData(self, request, context):
            """获取数据列表"""
            items = list(self.data_store.values())
            
            # 搜索过滤
            if request.search:
                items = [item for item in items if request.search.lower() in item['name'].lower()]
            
            total = len(items)
            
            # 分页
            page = max(1, request.page)
            page_size = min(max(1, request.page_size), 100) if request.page_size > 0 else 10
            start = (page - 1) * page_size
            end = start + page_size
            items = items[start:end]
            
            # 转换为protobuf对象
            pb_items = []
            for item in items:
                pb_items.append(service_pb2.DataItem(**item))
            
            return service_pb2.ListResponse(
                success=True,
                message=f"获取数据列表成功，共{total}条",
                items=pb_items,
                total=total
            )
        
        def StreamData(self, request, context):
            """流式获取数据"""
            items = list(self.data_store.values())
            
            # 搜索过滤
            if request.search:
                items = [item for item in items if request.search.lower() in item['name'].lower()]
            
            # 流式返回数据
            for item in items:
                pb_item = service_pb2.DataItem(**item)
                yield service_pb2.DataResponse(
                    success=True,
                    message="流式数据",
                    data=pb_item
                )
        
        def ProcessData(self, request_iterator, context):
            """流式处理数据"""
            processed_count = 0
            
            for request in request_iterator:
                # 处理每个请求
                item_id = self.next_id
                now = datetime.now().isoformat()
                
                data = {
                    'id': item_id,
                    'name': request.name,
                    'value': request.value,
                    'metadata': dict(request.metadata),
                    'created_at': now,
                    'updated_at': ''
                }
                
                self.data_store[item_id] = data
                self.next_id += 1
                processed_count += 1
            
            return service_pb2.DataResponse(
                success=True,
                message=f"批量处理完成，处理了{processed_count}条数据"
            )
        
        def HealthCheck(self, request, context):
            """健康检查"""
            return service_pb2.HealthResponse(
                status="healthy",
                timestamp=datetime.now().isoformat(),
                services={
                    "grpc": "running",
                    "data_count": str(len(self.data_store))
                }
            )
    
    return DataServicer


async def start_grpc_server() -> Optional[grpc.aio.Server]:
    """启动gRPC服务器"""
    
    # 动态创建服务器类
    DataServicer = create_data_servicer()
    if not DataServicer:
        print("无法创建gRPC服务类")
        return None
    
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    
    # 添加服务
    service_pb2_grpc.add_DataServiceServicer_to_server(DataServicer(), server)
    
    # 监听地址
    listen_addr = f"{settings.grpc_host}:{settings.grpc_port}"
    server.add_insecure_port(listen_addr)
    
    print(f"gRPC服务器启动在: {listen_addr}")
    await server.start()
    
    return server


def run_grpc_server():
    """同步方式运行gRPC服务器"""
    async def main():
        server = await start_grpc_server()
        if server:
            try:
                await server.wait_for_termination()
            except KeyboardInterrupt:
                print("gRPC服务器停止")
                await server.stop(0)
    
    asyncio.run(main())


if __name__ == "__main__":
    run_grpc_server() 
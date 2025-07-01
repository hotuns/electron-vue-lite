"""WebSocket处理器"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect

from models import WebSocketMessage, MessageType
from config import settings


class ConnectionManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        # 活跃连接
        self.active_connections: Dict[str, WebSocket] = {}
        # 心跳任务
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket) -> str:
        """接受新连接"""
        await websocket.accept()
        client_id = str(uuid.uuid4())
        self.active_connections[client_id] = websocket
        
        # 启动心跳任务
        task = asyncio.create_task(self._heartbeat_task(client_id))
        self.heartbeat_tasks[client_id] = task
        
        # 发送连接确认消息
        await self.send_personal_message(
            WebSocketMessage(
                type=MessageType.DATA,
                data={"action": "connected", "client_id": client_id},
                client_id=client_id
            ),
            client_id
        )
        
        print(f"客户端 {client_id} 已连接")
        return client_id
    
    def disconnect(self, client_id: str):
        """断开连接"""
        if client_id in self.active_connections:
            # 取消心跳任务
            if client_id in self.heartbeat_tasks:
                self.heartbeat_tasks[client_id].cancel()
                del self.heartbeat_tasks[client_id]
            
            del self.active_connections[client_id]
            print(f"客户端 {client_id} 已断开连接")
    
    async def send_personal_message(self, message: WebSocketMessage, client_id: str):
        """发送个人消息"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(message.model_dump_json())
            except Exception as e:
                print(f"发送消息失败，客户端 {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: WebSocketMessage, exclude_client: str = None):
        """广播消息给所有连接的客户端"""
        message.type = MessageType.BROADCAST
        message_data = message.model_dump_json()
        
        disconnected_clients = []
        for client_id, websocket in self.active_connections.items():
            if exclude_client and client_id == exclude_client:
                continue
            
            try:
                await websocket.send_text(message_data)
            except Exception as e:
                print(f"广播消息失败，客户端 {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # 清理断开的连接
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def _heartbeat_task(self, client_id: str):
        """心跳任务"""
        while client_id in self.active_connections:
            try:
                await asyncio.sleep(settings.ws_heartbeat_interval)
                await self.send_personal_message(
                    WebSocketMessage(
                        type=MessageType.PING,
                        data={"timestamp": datetime.now().isoformat()},
                        client_id=client_id
                    ),
                    client_id
                )
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"心跳任务异常，客户端 {client_id}: {e}")
                break
    
    def get_connection_count(self) -> int:
        """获取连接数"""
        return len(self.active_connections)
    
    def get_connected_clients(self) -> list[str]:
        """获取已连接客户端ID列表"""
        return list(self.active_connections.keys())


# 全局连接管理器
manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点处理函数"""
    client_id = await manager.connect(websocket)
    
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            
            try:
                # 解析消息
                message_dict = json.loads(data)
                message = WebSocketMessage(**message_dict)
                message.client_id = client_id
                message.timestamp = datetime.now()
                
                # 处理不同类型的消息
                await handle_message(message, client_id)
                
            except json.JSONDecodeError:
                # 发送错误消息
                await manager.send_personal_message(
                    WebSocketMessage(
                        type=MessageType.ERROR,
                        data={"error": "无效的JSON格式"},
                        client_id=client_id
                    ),
                    client_id
                )
            except Exception as e:
                await manager.send_personal_message(
                    WebSocketMessage(
                        type=MessageType.ERROR,
                        data={"error": f"处理消息时出错: {str(e)}"},
                        client_id=client_id
                    ),
                    client_id
                )
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket连接异常，客户端 {client_id}: {e}")
        manager.disconnect(client_id)


async def handle_message(message: WebSocketMessage, client_id: str):
    """处理接收到的消息"""
    
    if message.type == MessageType.PING:
        # 响应心跳
        await manager.send_personal_message(
            WebSocketMessage(
                type=MessageType.PONG,
                data={"timestamp": datetime.now().isoformat()},
                client_id=client_id
            ),
            client_id
        )
    
    elif message.type == MessageType.DATA:
        # 处理数据消息
        response_data = {
            "received": message.data,
            "processed_at": datetime.now().isoformat(),
            "client_count": manager.get_connection_count()
        }
        
        await manager.send_personal_message(
            WebSocketMessage(
                type=MessageType.DATA,
                data=response_data,
                client_id=client_id
            ),
            client_id
        )
    
    elif message.type == MessageType.BROADCAST:
        # 广播消息
        broadcast_message = WebSocketMessage(
            type=MessageType.BROADCAST,
            data={
                "from_client": client_id,
                "message": message.data,
                "timestamp": datetime.now().isoformat()
            }
        )
        await manager.broadcast(broadcast_message, exclude_client=client_id)
    
    else:
        # 未知消息类型
        await manager.send_personal_message(
            WebSocketMessage(
                type=MessageType.ERROR,
                data={"error": f"未知消息类型: {message.type}"},
                client_id=client_id
            ),
            client_id
        ) 
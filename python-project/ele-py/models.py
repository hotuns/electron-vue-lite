"""数据模型定义"""
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from enum import Enum


class MessageType(str, Enum):
    """WebSocket消息类型"""
    PING = "ping"
    PONG = "pong"
    DATA = "data"
    BROADCAST = "broadcast"
    ERROR = "error"


class WebSocketMessage(BaseModel):
    """WebSocket消息模型"""
    type: MessageType
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    client_id: Optional[str] = None


class DataItem(BaseModel):
    """数据项模型"""
    id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=100)
    value: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None


class DataResponse(BaseModel):
    """数据响应模型"""
    success: bool = True
    message: str = "操作成功"
    data: Optional[Any] = None
    total: Optional[int] = None


class HealthStatus(BaseModel):
    """健康检查响应"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    services: Dict[str, str] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """错误响应模型"""
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None 
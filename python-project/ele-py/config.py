"""配置文件"""
import os
from typing import Optional


class Settings:
    """应用设置"""
    def __init__(self):
        # HTTP服务配置
        self.http_host: str = os.getenv("HTTP_HOST", "0.0.0.0")
        self.http_port: int = int(os.getenv("HTTP_PORT", "8000"))
        
        # gRPC服务配置
        self.grpc_host: str = os.getenv("GRPC_HOST", "0.0.0.0")
        self.grpc_port: int = int(os.getenv("GRPC_PORT", "50051"))
        
        # 应用配置
        self.app_name: str = os.getenv("APP_NAME", "Ele-Py服务")
        self.app_version: str = os.getenv("APP_VERSION", "1.0.0")
        self.debug: bool = os.getenv("DEBUG", "true").lower() == "true"
        
        # WebSocket配置
        self.ws_heartbeat_interval: int = int(os.getenv("WS_HEARTBEAT_INTERVAL", "30"))


# 全局设置实例
settings = Settings() 
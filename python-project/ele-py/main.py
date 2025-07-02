"""主应用入口"""
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager

from config import settings
from api.http_routes import router as http_router
from api.websocket_handler import websocket_endpoint, manager



@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    
    print(f"🚀 启动 {settings.app_name} v{settings.app_version}")
    

    
    print(f"🌐 HTTP服务器将启动在: http://{settings.http_host}:{settings.http_port}")
    print(f"📡 WebSocket端点: ws://{settings.http_host}:{settings.http_port}/ws/connect")
    print(f"🔧 API文档: http://{settings.http_host}:{settings.http_port}/docs")
    
    yield  # 这里必须有yield，哪怕后面没有清理代码
    


# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="简单的Python服务：FastAPI + HTTP + WebSocket ",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册HTTP路由
app.include_router(
    http_router,
    prefix="/api",
    tags=["数据API"]
)


@app.get("/", response_class=HTMLResponse, tags=["首页"])
async def root():
    return 'Hello World'


@app.websocket("/ws/connect")
async def websocket_connect(websocket: WebSocket):
    """WebSocket连接端点"""
    await websocket_endpoint(websocket)


@app.get("/status", tags=["状态"])
async def get_status():
    """获取服务状态"""
    return {
        "app_name": settings.app_name,
        "version": settings.app_version,
        "services": {
            "http": "running",
            "websocket": f"running ({manager.get_connection_count()} connections)"
        },
        "endpoints": {
            "http_api": f"http://{settings.http_host}:{settings.http_port}/api",
            "websocket": f"ws://{settings.http_host}:{settings.http_port}/ws/connect",
            "docs": f"http://{settings.http_host}:{settings.http_port}/docs"
        }
    }


def main():
    """主函数"""
    print("🔧 正在启动服务...")
    
    # 启动HTTP/WebSocket服务器
    uvicorn.run(
        "main:app",
        host=settings.http_host,
        port=settings.http_port,
        reload=settings.debug,
        log_level="info"
    )


if __name__ == "__main__":
    main()

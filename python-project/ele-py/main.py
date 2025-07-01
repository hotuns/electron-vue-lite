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
from grpc_service.grpc_server import start_grpc_server


# gRPC服务器实例
grpc_server = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global grpc_server
    
    print(f"🚀 启动 {settings.app_name} v{settings.app_version}")
    
    # 启动gRPC服务器
    try:
        grpc_server = await start_grpc_server()
        print("✅ gRPC服务器启动成功")
    except Exception as e:
        print(f"❌ gRPC服务器启动失败: {e}")
    
    print(f"🌐 HTTP服务器将启动在: http://{settings.http_host}:{settings.http_port}")
    print(f"📡 WebSocket端点: ws://{settings.http_host}:{settings.http_port}/ws/connect")
    print(f"🔧 API文档: http://{settings.http_host}:{settings.http_port}/docs")
    
    yield
    
    # 关闭gRPC服务器
    if grpc_server:
        print("🛑 正在关闭gRPC服务器...")
        await grpc_server.stop(5)
        print("✅ gRPC服务器已关闭")


# 创建FastAPI应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="简单的Python服务：FastAPI + HTTP + WebSocket + gRPC",
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
    """主页面"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{settings.app_name}</title>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
            .container {{ max-width: 800px; margin: 0 auto; }}
            .service {{ margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }}
            .status {{ color: #28a745; font-weight: bold; }}
            code {{ background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }}
            .ws-demo {{ margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }}
            #messages {{ height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin: 10px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 {settings.app_name}</h1>
            <p>版本: {settings.app_version}</p>
            
            <div class="service">
                <h3>📊 HTTP API</h3>
                <p class="status">✅ 运行中</p>
                <p>RESTful API接口，支持数据的增删改查操作</p>
                <ul>
                    <li><a href="/docs" target="_blank">🔧 API文档 (Swagger)</a></li>
                    <li><a href="/redoc" target="_blank">📖 API文档 (ReDoc)</a></li>
                    <li><a href="/api/health" target="_blank">💓 健康检查</a></li>
                    <li><a href="/api/data" target="_blank">📋 数据列表</a></li>
                </ul>
            </div>
            
            <div class="service">
                <h3>⚡ WebSocket</h3>
                <p class="status">✅ 运行中 (当前连接: <span id="ws-count">{manager.get_connection_count()}</span>)</p>
                <p>实时双向通信，支持消息广播和心跳保活</p>
                <p>连接地址: <code>ws://{settings.http_host}:{settings.http_port}/ws/connect</code></p>
                
                <div class="ws-demo">
                    <h4>WebSocket 测试</h4>
                    <button onclick="connectWS()">连接</button>
                    <button onclick="sendPing()">发送Ping</button>
                    <button onclick="sendData()">发送数据</button>
                    <button onclick="broadcast()">广播消息</button>
                    <button onclick="disconnectWS()">断开</button>
                    <div id="messages"></div>
                </div>
            </div>
            
            <div class="service">
                <h3>🔌 gRPC</h3>
                <p class="status">✅ 运行中</p>
                <p>高性能RPC服务，支持流式数据传输</p>
                <p>服务地址: <code>{settings.grpc_host}:{settings.grpc_port}</code></p>
                <p>协议文件: <code>proto/service.proto</code></p>
            </div>
            
            <div class="service">
                <h3>📝 使用说明</h3>
                <ul>
                    <li><strong>HTTP API</strong>: 访问 <a href="/docs">/docs</a> 查看完整API文档</li>
                    <li><strong>WebSocket</strong>: 连接到 <code>/ws/connect</code> 端点进行实时通信</li>
                    <li><strong>gRPC</strong>: 使用生成的客户端代码调用RPC服务</li>
                </ul>
            </div>
        </div>
        
        <script>
            let ws = null;
            
            function addMessage(msg) {{
                const messages = document.getElementById('messages');
                const div = document.createElement('div');
                div.textContent = new Date().toLocaleTimeString() + ': ' + msg;
                messages.appendChild(div);
                messages.scrollTop = messages.scrollHeight;
            }}
            
            function connectWS() {{
                if (ws) return;
                ws = new WebSocket('ws://{settings.http_host}:{settings.http_port}/ws/connect');
                
                ws.onopen = function() {{
                    addMessage('WebSocket连接已建立');
                }};
                
                ws.onmessage = function(event) {{
                    addMessage('收到: ' + event.data);
                }};
                
                ws.onclose = function() {{
                    addMessage('WebSocket连接已关闭');
                    ws = null;
                }};
                
                ws.onerror = function(error) {{
                    addMessage('WebSocket错误: ' + error);
                }};
            }}
            
            function sendPing() {{
                if (!ws) {{ addMessage('请先连接WebSocket'); return; }}
                ws.send(JSON.stringify({{ type: 'ping' }}));
            }}
            
            function sendData() {{
                if (!ws) {{ addMessage('请先连接WebSocket'); return; }}
                ws.send(JSON.stringify({{ 
                    type: 'data', 
                    data: {{ message: '这是一条测试数据', timestamp: new Date().toISOString() }}
                }}));
            }}
            
            function broadcast() {{
                if (!ws) {{ addMessage('请先连接WebSocket'); return; }}
                ws.send(JSON.stringify({{ 
                    type: 'broadcast', 
                    data: '这是一条广播消息来自网页'
                }}));
            }}
            
            function disconnectWS() {{
                if (ws) {{
                    ws.close();
                    ws = null;
                }}
            }}
        </script>
    </body>
    </html>
    """
    return html_content


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
            "websocket": f"running ({manager.get_connection_count()} connections)",
            "grpc": "running" if grpc_server else "stopped"
        },
        "endpoints": {
            "http_api": f"http://{settings.http_host}:{settings.http_port}/api",
            "websocket": f"ws://{settings.http_host}:{settings.http_port}/ws/connect",
            "grpc": f"{settings.grpc_host}:{settings.grpc_port}",
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

# Ele-Py 服务

基于 FastAPI 的 Python 后端服务，为 Electron 应用提供 HTTP API 和 WebSocket 支持。

## ✨ 技术特性

- **FastAPI**: 现代、快速的Python Web框架
- **WebSocket**: 实时双向通信支持
- **uvicorn**: 高性能ASGI服务器
- **自动文档**: 集成 Swagger UI 和 ReDoc
- **跨平台**: 支持独立打包和部署

## 📁 目录结构

```
ele-py/
├── main.py              # 主入口文件，启动FastAPI应用
├── config.py            # 配置文件，端口和环境设置
├── models.py            # 数据模型定义（Pydantic）
├── api/                 # API模块
│   ├── __init__.py      # 模块初始化
│   ├── http_routes.py   # HTTP REST API路由
│   └── websocket_handler.py # WebSocket连接处理
├── pyproject.toml       # Python项目配置文件
├── uv.lock             # 依赖锁定文件
└── README.md           # 项目说明文档
```

## 🚀 使用方式

### 1. 环境准备

确保已安装以下软件：
- Python 3.13+
- uv (Python包管理器)

```bash
# 安装uv (如果尚未安装)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. 安装依赖

```bash
# 进入Python项目目录
cd python-project/ele-py

# 安装所有依赖
uv sync
```

### 3. 启动服务

```bash
# 开发模式启动
uv run python main.py

# 或者使用uvicorn直接启动
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 访问服务

启动成功后，可以通过以下地址访问：

- **服务主页**: http://localhost:8000
- **API交互文档**: http://localhost:8000/docs
- **API文档（ReDoc）**: http://localhost:8000/redoc
- **WebSocket连接**: ws://localhost:8000/ws/connect

## 🔌 API接口

### HTTP REST API

#### 健康检查
```bash
GET /health
# 响应: {"status": "ok", "timestamp": "..."}
```

#### 数据管理
```bash
# 获取数据列表
GET /api/data
# 响应: {"items": [...], "total": 10}

# 创建新数据
POST /api/data
# 请求体: {"name": "test", "value": 123}
# 响应: {"id": 1, "name": "test", "value": 123, "created_at": "..."}

# 删除数据
DELETE /api/data/{id}
# 响应: {"message": "Data deleted successfully"}
```

### WebSocket API

#### 连接和通信
```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:8000/ws/connect');

// 发送ping测试
ws.send(JSON.stringify({type: 'ping'}));

// 发送数据
ws.send(JSON.stringify({
  type: 'data',
  payload: {message: 'Hello Python!'}
}));

// 广播消息
ws.send(JSON.stringify({
  type: 'broadcast',
  message: 'Hello everyone!'
}));
```

## ⚙️ 配置选项

可以通过环境变量或修改 `config.py` 来配置服务：

```python
# config.py
HOST = "0.0.0.0"        # 服务器地址
PORT = 8000             # 服务器端口
DEBUG = True            # 调试模式
CORS_ORIGINS = ["*"]    # CORS允许的源
```

环境变量：
```bash
export PYTHON_SERVICE_HOST="127.0.0.1"
export PYTHON_SERVICE_PORT="8000"
export DEBUG="false"
```

## 🔧 开发指南

### 添加新的HTTP路由

在 `api/http_routes.py` 中添加新的路由：

```python
from fastapi import APIRouter

router = APIRouter(prefix="/api")

@router.get("/custom-endpoint")
async def custom_endpoint():
    """自定义API端点"""
    return {"message": "这是一个自定义端点", "status": "success"}

@router.post("/process-data")
async def process_data(data: dict):
    """处理数据的端点"""
    # 在这里添加你的业务逻辑
    processed = {"original": data, "processed": True}
    return processed
```

### 扩展WebSocket功能

在 `api/websocket_handler.py` 中添加新的消息处理：

```python
async def handle_custom_message(websocket: WebSocket, data: dict):
    """处理自定义消息类型"""
    if data.get("type") == "custom":
        response = {
            "type": "custom_response",
            "data": "处理完成",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(response))
```

### 数据模型定义

在 `models.py` 中定义新的数据模型：

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CustomData(BaseModel):
    name: str
    value: int
    description: Optional[str] = None
    created_at: datetime = datetime.now()
```

## 📦 构建和部署

### 开发环境运行
```bash
# 开发模式（自动重载）
uv run uvicorn main:app --reload

# 生产模式
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### 独立可执行文件构建

使用 PyFuze 构建独立的可执行文件：

```bash
# 安装PyFuze
uvx install pyfuze

# 构建可执行文件
uvx pyfuze . \
  --entry main.py \
  --pyproject pyproject.toml \
  --uv-lock uv.lock \
  --unzip-path ele-py-pkgs
```

构建完成后，在 `dist/` 目录中会生成：
- **Windows**: `ele-py.exe` 
- **Linux/macOS**: `ele-py`

生成的可执行文件可以：
- 直接在终端运行
- 被 Node.js 或其他程序调用
- 无需 Python 环境即可运行

### Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY . .

RUN pip install uv
RUN uv sync

EXPOSE 8000
CMD ["uv", "run", "python", "main.py"]
```

构建和运行：
```bash
docker build -t ele-py .
docker run -p 8000:8000 ele-py
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep 8000
   # 或者
   lsof -i :8000
   ```

2. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   uv cache clean
   uv sync --reinstall
   ```

3. **WebSocket连接失败**
   - 检查防火墙设置
   - 确认服务正常启动
   - 查看浏览器控制台错误信息

4. **跨域问题**
   - 修改 `config.py` 中的 `CORS_ORIGINS` 设置
   - 确认前端请求地址正确

### 日志调试

服务启动时会输出详细的启动信息：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

可以通过设置日志级别来获取更多调试信息：
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🔗 相关资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Uvicorn 文档](https://www.uvicorn.org/)
- [Pydantic 数据验证](https://pydantic-docs.helpmanual.io/)
- [WebSocket 协议规范](https://tools.ietf.org/html/rfc6455)
- [Python asyncio 文档](https://docs.python.org/3/library/asyncio.html)
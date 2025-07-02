# Ele-Py 服务

简单的Python服务：FastAPI + HTTP + WebSocket

## 目录结构
```
ele-py/
├── main.py              #  主入口文件
├── config.py            #  配置文件  
├── models.py            #  数据模型
├── api/                 #  HTTP和WebSocket API
│   ├── __init__.py
│   ├── http_routes.py
│   └── websocket_handler.py
├── pyproject.toml
└── README.md
```

## 使用方式

### 1. 安装依赖
```bash
# Python依赖
cd python-project/ele-py
uv sync

# Node.js依赖（如果还未安装）
cd ../..
npm install
```

### 2. 启动服务
```bash
# 启动Python服务
cd python-project/ele-py
uv run python main.py

# 启动Electron应用（新终端）
cd ../..
npm run dev
```

### 3. 访问服务
- **主页**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws/connect

## 开发流程

1. 修改API或WebSocket逻辑
2. 重启Python服务器和Electron应用

### 优势
- ✅ Electron运行时不需要解析proto文件
- ✅ 避免文件系统权限问题
- ✅ 更好的TypeScript支持
- ✅ 更快的启动速度
- ✅ 生产环境更稳定




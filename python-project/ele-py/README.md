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


## build
```bash
uvx pyfuze . --entry main.py --pyproject pyproject.toml --uv-lock uv.lock --unzip-path ele-py-pkgs
```

编译之后的dist目录里面的 `ele-py.com` 就是我们的产物。可以在终端运行，也可以用node调用。
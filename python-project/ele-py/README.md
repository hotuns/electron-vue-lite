# Ele-Py 服务

简单的Python服务：FastAPI + HTTP + WebSocket + gRPC

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
├── grpc/                # 🔌 gRPC服务
│   ├── __init__.py
│   ├── grpc_server.py
│   ├── grpc_client.py
│   └── proto/
│       ├── service.proto
│       ├── service_pb2.py
│       └── service_pb2_grpc.py
├── pyproject.toml
└── README.md
```

## 使用方式

### 1. 安装依赖
```bash
uv sync
```

### 2. 生成gRPC代码
```bash
uv run python -m grpc_tools.protoc --python_out=grpc_service/proto --grpc_python_out=grpc_service/proto --proto_path=grpc_service/proto --experimental_allow_proto3_optional grpc_service/proto/service.proto
```

### 3. 启动服务
```bash
uv run python main.py
```

### 4. 访问服务
- **主页**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws/connect
- **gRPC**: localhost:50051

### 5. 测试gRPC客户端
```bash
uv run python grpc/grpc_client.py
```




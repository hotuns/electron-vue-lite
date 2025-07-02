# Electron Vue Lite

Electron + Vue + Vite 样板代码，集成Python服务支持。

![预览](./images/home.png)

## ✨ 技术栈

- Electron v29.4.6
- Vue 3 v3.4.21 + TypeScript v5.8.3
- Vite v5.4.19
- Naive UI v2.42.0
- UnoCSS v66.3.2

```
electron-serial/
├── electron/                    # Electron主进程和预加载脚本
├── src/                        # Vue渲染进程
│   ├── components/             # Vue组件
│   ├── views/                  # 页面组件
│   ├── utils/                  # 工具函数
│   │   ├── pythonApi.ts        # Python HTTP API
└── python-project/             # Python服务
    └── ele-py/                 # FastAPI服务
```

## 🛠 开发环境

### 前置要求
- Node.js 18+
- Python 3.13+
- uv (Python包管理)


### 安装和启动

#### 1. 启动Python服务
```bash
cd python-project/ele-py
uv sync
uv run python main.py
```

#### 2. 启动Electron应用
```bash
npm install
npm run dev
```

## 🐍 Python服务功能

Python服务提供三种通信方式：

### 1. HTTP API (端口: 8000)
- RESTful API，支持数据CRUD操作
- 健康检查和状态监控
- 自动API文档：http://localhost:8000/docs

### 2. WebSocket (端口: 8000)
- 实时双向通信
- 消息广播和心跳保活
- 连接地址：ws://localhost:8000/ws/connect


## 🖥 Vue应用功能

### 页面结构
- **首页** (`/`): 应用介绍和导航
- **计数器** (`/count`): Pinia状态管理演示
- **Python服务** (`/python-service`): Python服务集成页面

### Python服务页面功能

#### HTTP API面板
- ✅ 服务状态检测
- 📋 数据列表查看
- ➕ 创建新数据
- 🔍 搜索和分页
- 🗑️ 删除数据

#### WebSocket面板
- 🔗 连接管理
- 📡 Ping/Pong测试
- 📤 数据发送
- 📢 消息广播
- 📝 实时日志


## 🔧 开发说明


### 自定义API调用

```typescript
// HTTP API
import { pythonApi } from '@/utils/pythonApi'
const response = await pythonApi.getDataList()

// WebSocket
import { pythonWs } from '@/utils/pythonApi'
await pythonWs.connect()
pythonWs.sendData({ message: 'Hello' })

```

## 📋 构建和发布

```bash
# 开发模式
npm run dev

# 构建应用
npm run build

# 构建目录版本（不打包）
npm run build:dir
```

## 🔍 故障排除

### Python服务连接问题
1. 确认Python服务正在运行：http://localhost:8000
2. 检查防火墙设置
3. 查看浏览器控制台错误信息


### WebSocket连接问题
1. 检查WebSocket服务状态
2. 确认没有其他应用占用端口
3. 查看网络面板的WebSocket连接状态

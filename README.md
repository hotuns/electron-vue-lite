# Electron Vue Lite

基于 Electron + Vue 3 + Vite 构建的轻量级桌面应用程序模板。

![预览](./images/home.png)

## ✨ 技术栈

- Electron v29.4.6
- Vue 3 v3.4.21 + TypeScript v5.8.3
- Vite v5.4.19
- Naive UI v2.42.0
- UnoCSS v66.3.2

## 🚀 特性

- ⚡️ 快速开发 - 基于 Vite 的热重载
- 🎨 现代 UI - Naive UI + UnoCSS
- 📦 自动导入 - 组件和 API 自动导入
- 🔒 安全架构 - Electron 安全最佳实践
- 🪟 多窗口支持 - 完整的窗口管理系统
- 🌐 IPC 通信 - 主进程与渲染进程通信

## 📁 目录结构

```
electron-vue-lite/
├── electron/          # Electron 相关代码
│   ├── main/         # 主进程
│   └── preload/      # 预加载脚本
├── src/              # Vue 应用（渲染进程）
│   ├── components/   # 组件
│   ├── views/        # 页面
│   ├── stores/       # 状态管理
│   └── demos/        # 示例代码
└── ...配置文件
```

## 🛠️ 开发指南

### 环境要求

- Node.js >= 16.0.0
- npm / yarn / pnpm

### 安装

```bash
pnpm install  # 或 npm install / yarn
```

### 开发

```bash
pnpm dev  # 启动开发服务器
```

### 构建

```bash
pnpm build  # 构建应用
```

## 🔧 核心架构

- **主进程** - 应用生命周期、窗口管理、系统 API
- **预加载脚本** - 安全地暴露 Node.js API、IPC 通信
- **渲染进程** - Vue 3 应用、UI 渲染、用户交互

## todos

已有功能：
✅ 多窗口管理系统
✅ IPC 通信机制
✅ 数据持久化存储 (electron-store)
✅ 跨窗口状态同步
✅ 窗口控制 (最小化/最大化/关闭)
✅ 应用菜单和快捷键
✅ 开发者工具集成

快速启动模板添加的常用通用功能：
🔧 系统集成功能
系统托盘 (Tray) - 后台运行、托盘菜单、点击显示/隐藏窗口
原生通知 (Notifications) - 系统通知推送
自动更新 (Auto Updater) - 应用自动检查和更新
深度链接 (Deep Links) - 自定义协议支持，如 myapp://
全局快捷键 (Global Shortcuts) - 系统级快捷键注册
📁 文件系统功能
文件对话框 (Dialog) - 打开文件、保存文件、选择文件夹
拖拽支持 (Drag & Drop) - 文件拖拽到应用窗口
文件关联 (File Association) - 注册文件类型关联
最近文件列表 (Recent Files) - 应用菜单中的最近文件
🔐 安全与隐私
权限管理 (Permissions) - 相机、麦克风、位置等权限请求
安全存储 (Secure Storage) - 密码/敏感数据加密存储
证书锁定 (Certificate Pinning) - HTTPS 请求安全验证
🌐 网络与通信
网络状态检测 (Network Status) - 在线/离线状态监听
下载管理 (Download Manager) - 文件下载进度、暂停、恢复
代理设置 (Proxy Settings) - 网络代理配置
🎨 UI/UX 增强
主题管理 (Theme Manager) - 明暗主题切换、系统主题跟随
缩放控制 (Zoom Control) - 页面缩放级别控制
窗口状态保存 (Window State) - 记住窗口位置、大小等状态
启动画面 (Splash Screen) - 应用启动时的加载界面
⚙️ 系统信息与性能
系统信息获取 (System Info) - CPU、内存、磁盘等系统信息
应用性能监控 (Performance Monitoring) - 内存使用、渲染性能监控
错误收集 (Error Reporting) - 崩溃报告和错误日志收集
🔧 开发工具功能
日志系统 (Logging) - 结构化日志记录和管理
调试信息面板 (Debug Panel) - 开发环境下的调试信息展示
性能分析工具 (Profiling) - 应用性能分析工具
📱 跨平台特性
平台特定功能 (Platform Specific)
Windows: 任务栏进度、缩略图工具栏
macOS: 原生菜单栏、Dock 集成、Touch Bar
Linux: 桌面通知、应用指示器
🔄 数据管理
数据导入导出 (Import/Export) - 配置和数据的备份恢复
数据同步 (Data Sync) - 云端数据同步框架
离线数据处理 (Offline Data) - 离线时数据缓存和同步
🎯 用户体验
用户引导 (User Onboarding) - 首次使用向导
快捷操作 (Quick Actions) - 常用功能快速访问
搜索功能 (Search) - 全局搜索框架

#!/usr/bin/env node

import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

console.log('🚀 设置项目资源...\n');

// 检查并安装新的依赖
console.log('📦 安装新的依赖...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ 依赖安装完成\n');
} catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
}

// 下载 uv
console.log('⬇️ 下载 uv...');
try {
    execSync('npm run download-uv', { stdio: 'inherit' });
    console.log('✅ uv 下载完成\n');
} catch (error) {
    console.error('❌ uv 下载失败:', error.message);
    process.exit(1);
}

// 检查 Python 项目是否存在
const pythonProjectPath = path.join(process.cwd(), 'python-project', 'ele-py');
if (!existsSync(pythonProjectPath)) {
    console.warn('⚠️ Python 项目目录不存在，请确保 python-project/ele-py 目录包含 Python 代码');
} else {
    console.log('✅ Python 项目目录存在');
}

// 检查 Python 项目的 pyproject.toml
const pyprojectPath = path.join(pythonProjectPath, 'pyproject.toml');
if (!existsSync(pyprojectPath)) {
    console.warn('⚠️ pyproject.toml 文件不存在，uv sync 可能会失败');
} else {
    console.log('✅ pyproject.toml 文件存在');
}

console.log('\n🎉 项目设置完成！');
console.log('\n接下来你可以：');
console.log('1. 运行 `npm run dev` 启动开发环境');
console.log('2. 在应用中测试 Python 服务功能');
console.log('3. Python 服务将使用 uv 自动管理虚拟环境和依赖\n');

console.log('📝 主要变更：');
console.log('- 从 PyFuze 编译 Python 改为使用 uv 运行 Python');
console.log('- 自动创建和管理 Python 虚拟环境');
console.log('- 使用 uv sync 安装依赖（推荐）或回退到 pip install');
console.log('- 添加了虚拟环境重建和设置功能\n');

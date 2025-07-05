import { existsSync, cpSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 源文件夹路径
const src = resolve(__dirname, '../python-project/ele-py/dist');
// 目标文件夹路径
const dest = resolve(__dirname, '../dist-python');

// 检查源文件夹是否存在
if (!existsSync(src)) {
  console.error(`源文件夹不存在: ${src}`);
  process.exit(1);
}

// 如果目标文件夹存在，先删除
if (existsSync(dest)) {
  console.log(`删除现有目标文件夹: ${dest}`);
  rmSync(dest, { recursive: true, force: true });
}

// 复制整个文件夹
cpSync(src, dest, { recursive: true });
console.log(`已复制文件夹: ${src} -> ${dest}`);

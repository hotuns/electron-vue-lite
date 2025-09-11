import axios from 'axios';
import extractZip from 'extract-zip';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';
import { readFileSync } from 'node:fs';

// 从 package.json 中读取 uv 版本
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const uvVer = packageJson.config?.uvVersion || '0.5.11'; // 默认版本

/** @typedef {{ [key]: { zipFile: string, uvOutputFolderName: string, zip: boolean } }} UvDownloadOptions */
const options = {
  win32: {
    zipFile: 'uv-x86_64-pc-windows-msvc.zip',
    uvOutputFolderName: 'win',
    zip: true,
  },
  darwin: {
    zipFile: 'uv-aarch64-apple-darwin.tar.gz',
    uvOutputFolderName: 'macos',
    zip: false,
  },
  linux: {
    zipFile: 'uv-x86_64-unknown-linux-gnu.tar.gz',
    uvOutputFolderName: 'linux',
    zip: false,
  },
};

async function downloadUV() {
  const allFlag = process.argv[2];
  const baseDownloadURL = `https://github.com/astral-sh/uv/releases/download/${uvVer}/`;
  
  if (allFlag) {
    if (allFlag === 'all') {
      await downloadAndExtract(baseDownloadURL, options.win32);
      await downloadAndExtract(baseDownloadURL, options.darwin);
      await downloadAndExtract(baseDownloadURL, options.linux);
      return;
    }
    if (allFlag === 'none') {
      return;
    }
  }

  const uvDownloaded = fs.existsSync(path.join('./assets', 'uv'));
  if (!uvDownloaded) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await downloadAndExtract(baseDownloadURL, options[os.platform()]);
    return;
  }
  console.log('< UV Folder Exists, Skipping >');
}

/** @param {UvDownloadOptions[any]} options */
async function downloadAndExtract(baseURL, options) {
  const downloadURL = baseURL + options.zipFile;
  const downloadPath = path.join('./temp', options.zipFile);
  const uvOutputDir = path.join('./assets', 'uv', options.uvOutputFolderName);

  // 确保目录存在
  await fs.ensureDir('./temp');
  await fs.ensureDir(uvOutputDir);

  console.log(`Downloading UV from ${downloadURL}...`);

  try {
    // 下载文件
    const response = await axios({
      method: 'GET',
      url: downloadURL,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(downloadPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(`Downloaded to ${downloadPath}`);

    // 解压文件
    console.log(`Extracting to ${uvOutputDir}...`);
    
    if (options.zip) {
      // ZIP 文件
      await extractZip(downloadPath, { dir: path.resolve(uvOutputDir) });
    } else {
      // TAR.GZ 文件
      await tar.extract({
        file: downloadPath,
        cwd: uvOutputDir,
        strip: 1, // 移除顶级目录
      });
    }

    // 在 Unix 系统上确保 uv 可执行
    if (process.platform !== 'win32') {
      const uvExecutable = path.join(uvOutputDir, 'uv');
      await fs.chmod(uvExecutable, '755');
    }

    console.log(`UV extracted successfully to ${uvOutputDir}`);

    // 清理下载的文件
    await fs.remove(downloadPath);

  } catch (error) {
    console.error(`Error downloading/extracting UV: ${error.message}`);
    throw error;
  }
}

//** Download and Extract UV. Default uses OS.Platform. Add 'all' will download all. Add 'none' will skip */
await downloadUV();

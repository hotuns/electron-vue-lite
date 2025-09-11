import { spawn, ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import { app } from 'electron'
import log from 'electron-log'
import { existsSync } from 'node:fs'

export interface UvConfig {
    pythonVersion?: string;
    cacheDir?: string;
    pypiMirror?: string;
    pythonMirror?: string;
}

export interface ProcessCallbacks {
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
    onClose?: (code: number | null, signal: string | null) => void;
}

export class UvManager {
    private uvPath: string;
    private basePath: string;
    private venvPath: string;
    private config: UvConfig;

    constructor(basePath: string, config: UvConfig = {}) {
        this.basePath = basePath;
        this.venvPath = join(basePath, '.venv');
        this.config = {
            pythonVersion: '3.12',
            ...config
        };

        // 根据平台确定 uv 可执行文件路径
        const uvFolder = app.isPackaged
            ? join(process.resourcesPath, 'uv')
            : join(app.getAppPath(), 'assets', 'uv');

        switch (process.platform) {
            case 'win32':
                this.uvPath = join(uvFolder, 'win', 'uv.exe');
                break;
            case 'linux':
                this.uvPath = join(uvFolder, 'linux', 'uv');
                break;
            case 'darwin':
                this.uvPath = join(uvFolder, 'macos', 'uv');
                break;
            default:
                throw new Error(`Unsupported platform: ${process.platform}`);
        }

        log.info(`Using uv at ${this.uvPath}`);
    }

    /**
     * 检查 uv 是否可用
     */
    isUvAvailable(): boolean {
        return existsSync(this.uvPath);
    }

    /**
     * 检查虚拟环境是否存在
     */
    venvExists(): boolean {
        const pythonPath = this.getPythonPath();
        return existsSync(pythonPath);
    }

    /**
     * 获取 Python 解释器路径
     */
    getPythonPath(): string {
        return process.platform === 'win32'
            ? join(this.venvPath, 'Scripts', 'python.exe')
            : join(this.venvPath, 'bin', 'python');
    }

    /**
     * 获取虚拟环境的激活命令
     */
    getActivateCommand(): string {
        if (process.platform === 'win32') {
            return `& "${join(this.venvPath, 'Scripts', 'activate.ps1')}"`;
        } else {
            return `source "${join(this.venvPath, 'bin', 'activate')}"`;
        }
    }

    /**
     * 运行 uv 命令
     */
    async runUvCommand(
        args: string[],
        callbacks?: ProcessCallbacks,
        options: { cwd?: string; env?: Record<string, string> } = {}
    ): Promise<{ exitCode: number | null; signal: string | null }> {
        return new Promise((resolve, reject) => {
            log.info(`Running uv command: ${this.uvPath} ${args.join(' ')}`);

            const env = {
                ...process.env,
                VIRTUAL_ENV: this.venvPath,
                ...(this.config.pythonMirror ? { UV_PYTHON_INSTALL_MIRROR: this.config.pythonMirror } : {}),
                ...(this.config.pypiMirror ? { UV_INDEX_URL: this.config.pypiMirror } : {}),
                ...options.env
            };

            const child = spawn(this.uvPath, args, {
                cwd: options.cwd || this.basePath,
                env,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            child.stdout?.on('data', (data) => {
                const output = data.toString();
                log.info(`[uv stdout] ${output.trim()}`);
                callbacks?.onStdout?.(output);
            });

            child.stderr?.on('data', (data) => {
                const output = data.toString();
                log.warn(`[uv stderr] ${output.trim()}`);
                callbacks?.onStderr?.(output);
            });

            child.on('close', (code, signal) => {
                log.info(`uv command finished with code ${code}, signal ${signal}`);
                callbacks?.onClose?.(code, signal);
                resolve({ exitCode: code, signal });
            });

            child.on('error', (error) => {
                log.error(`uv command error:`, error);
                reject(error);
            });
        });
    }

    /**
     * 创建虚拟环境
     */
    async createVenv(callbacks?: ProcessCallbacks): Promise<boolean> {
        try {
            log.info(`Creating virtual environment at ${this.venvPath} with Python ${this.config.pythonVersion}`);
            
            const args = [
                'venv',
                '--python', this.config.pythonVersion!,
                '--python-preference', 'only-managed',
                this.venvPath
            ];

            const { exitCode } = await this.runUvCommand(args, callbacks);
            return exitCode === 0;
        } catch (error) {
            log.error('Failed to create virtual environment:', error);
            return false;
        }
    }

    /**
     * 安装包
     */
    async installPackages(
        packages: string[],
        callbacks?: ProcessCallbacks,
        options: { 
            requirementsFile?: string;
            indexUrl?: string;
            extraIndexUrl?: string;
            upgrade?: boolean;
        } = {}
    ): Promise<boolean> {
        try {
            const args = ['pip', 'install'];

            if (options.upgrade) {
                args.push('--upgrade');
            }

            if (options.indexUrl) {
                args.push('--index-url', options.indexUrl);
            }

            if (options.extraIndexUrl) {
                args.push('--extra-index-url', options.extraIndexUrl);
            }

            if (options.requirementsFile) {
                args.push('-r', options.requirementsFile);
            } else {
                args.push(...packages);
            }

            const { exitCode } = await this.runUvCommand(args, callbacks);
            return exitCode === 0;
        } catch (error) {
            log.error('Failed to install packages:', error);
            return false;
        }
    }

    /**
     * 运行 Python 脚本
     */
    async runPythonScript(
        scriptPath: string,
        args: string[] = [],
        callbacks?: ProcessCallbacks,
        options: { cwd?: string; env?: Record<string, string> } = {}
    ): Promise<ChildProcess> {
        log.info(`Running Python script: ${scriptPath} ${args.join(' ')}`);

        const env = {
            ...process.env,
            VIRTUAL_ENV: this.venvPath,
            PYTHONPATH: this.basePath,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1',
            ...options.env
        };

        const pythonArgs = ['run', '--python', this.getPythonPath(), scriptPath, ...args];

        const child = spawn(this.uvPath, pythonArgs, {
            cwd: options.cwd || this.basePath,
            env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        child.stdout?.on('data', (data) => {
            const output = data.toString();
            log.info(`[Python stdout] ${output.trim()}`);
            callbacks?.onStdout?.(output);
        });

        child.stderr?.on('data', (data) => {
            const output = data.toString();
            log.warn(`[Python stderr] ${output.trim()}`);
            callbacks?.onStderr?.(output);
        });

        child.on('close', (code, signal) => {
            log.info(`Python script finished with code ${code}, signal ${signal}`);
            callbacks?.onClose?.(code, signal);
        });

        child.on('error', (error) => {
            log.error(`Python script error:`, error);
        });

        return child;
    }

    /**
     * 运行 Python 命令
     */
    async runPythonCommand(
        args: string[],
        callbacks?: ProcessCallbacks,
        options: { cwd?: string; env?: Record<string, string> } = {}
    ): Promise<{ exitCode: number | null; signal: string | null }> {
        const pythonArgs = ['run', '--python', this.getPythonPath(), ...args];
        return this.runUvCommand(pythonArgs, callbacks, options);
    }

    /**
     * 清理缓存
     */
    async clearCache(callbacks?: ProcessCallbacks): Promise<boolean> {
        try {
            const { exitCode } = await this.runUvCommand(['cache', 'clean'], callbacks);
            return exitCode === 0;
        } catch (error) {
            log.error('Failed to clear uv cache:', error);
            return false;
        }
    }

    /**
     * 检查虚拟环境健康状态
     */
    async checkVenvHealth(): Promise<boolean> {
        if (!this.venvExists()) {
            return false;
        }

        try {
            const { exitCode } = await this.runPythonCommand(['--version']);
            return exitCode === 0;
        } catch (error) {
            log.error('Virtual environment health check failed:', error);
            return false;
        }
    }
}

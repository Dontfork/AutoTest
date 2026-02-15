import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AutoTestConfig } from '../types';

const defaultConfig: AutoTestConfig = {
    server: {
        host: "192.168.1.100",
        port: 22,
        username: "root",
        password: "",
        privateKeyPath: "",
        localProjectPath: "",
        remoteDirectory: "/tmp/autotest"
    },
    command: {
        executeCommand: "pytest {filePath} -v",
        filterPatterns: ["error", "failed", "FAILED", "Error", "ERROR"],
        filterMode: "include"
    },
    ai: {
        provider: "qwen",
        qwen: {
            apiKey: "",
            apiUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            model: "qwen-turbo"
        },
        openai: {
            apiKey: "",
            apiUrl: "https://api.openai.com/v1/chat/completions",
            model: "gpt-3.5-turbo"
        }
    },
    logs: {
        directories: [
            { name: "应用日志", path: "/var/logs" },
            { name: "测试日志", path: "/var/log/autotest" }
        ],
        downloadPath: "",
        refreshInterval: 5000
    }
};

function deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
        if (source[key] !== undefined) {
            if (
                typeof source[key] === 'object' &&
                source[key] !== null &&
                !Array.isArray(source[key]) &&
                typeof target[key] === 'object' &&
                target[key] !== null
            ) {
                result[key] = deepMerge(target[key], source[key] as any);
            } else {
                result[key] = source[key] as any;
            }
        }
    }
    return result;
}

let config: AutoTestConfig | null = null;
let configFilePath: string = '';
let fileWatcher: vscode.FileSystemWatcher | null = null;
let configChangeEmitter = new vscode.EventEmitter<AutoTestConfig>();

export const onConfigChanged = configChangeEmitter.event;

export function loadConfig(workspacePath: string): AutoTestConfig {
    const configPath = vscode.workspace.getConfiguration('autotest').get<string>('configPath') || 'autotest-config.json';
    
    const pathsToTry = [
        path.join(workspacePath, '.vscode', configPath),
        path.join(workspacePath, configPath)
    ];

    let fullPath = '';
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            fullPath = p;
            break;
        }
    }

    if (!fullPath) {
        fullPath = pathsToTry[0];
    }

    configFilePath = fullPath;

    try {
        if (!fs.existsSync(fullPath)) {
            const vscodeDir = path.join(workspacePath, '.vscode');
            if (!fs.existsSync(vscodeDir)) {
                fs.mkdirSync(vscodeDir, { recursive: true });
            }
            fs.writeFileSync(fullPath, JSON.stringify(defaultConfig, null, 4), 'utf-8');
            vscode.window.showInformationMessage(`已创建默认配置文件: ${path.join('.vscode', configPath)}`);
            config = defaultConfig;
            return config as AutoTestConfig;
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        const loadedConfig = JSON.parse(content);
        config = deepMerge(defaultConfig, loadedConfig);
        return config as AutoTestConfig;
    } catch (error: any) {
        config = defaultConfig;
        return config as AutoTestConfig;
    }
}

export function getConfig(): AutoTestConfig {
    return config || defaultConfig;
}

export function reloadConfig(workspacePath?: string): AutoTestConfig {
    const wsPath = workspacePath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!wsPath) {
        return getConfig();
    }
    
    const oldConfig = config;
    const newConfig = loadConfig(wsPath);
    
    if (JSON.stringify(oldConfig) !== JSON.stringify(newConfig)) {
        configChangeEmitter.fire(newConfig);
    }
    
    return newConfig;
}

export function setupConfigWatcher(context: vscode.ExtensionContext): void {
    if (fileWatcher) {
        fileWatcher.dispose();
    }

    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
        return;
    }

    const configPath = vscode.workspace.getConfiguration('autotest').get<string>('configPath') || 'autotest-config.json';

    fileWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspacePath, `**/${configPath}`),
        false,
        false,
        false
    );

    fileWatcher.onDidChange((uri) => {
        reloadConfig(workspacePath);
        vscode.window.showInformationMessage('AutoTest 配置已自动刷新');
    });

    fileWatcher.onDidCreate((uri) => {
        reloadConfig(workspacePath);
        vscode.window.showInformationMessage('AutoTest 配置文件已创建并加载');
    });

    fileWatcher.onDidDelete((uri) => {
        config = defaultConfig;
        configChangeEmitter.fire(defaultConfig);
        vscode.window.showWarningMessage('AutoTest 配置文件已删除，使用默认配置');
    });

    context.subscriptions.push(fileWatcher);
}

export function getConfigFilePath(): string {
    return configFilePath;
}

export function dispose(): void {
    if (fileWatcher) {
        fileWatcher.dispose();
        fileWatcher = null;
    }
    configChangeEmitter.dispose();
}

export { defaultConfig };

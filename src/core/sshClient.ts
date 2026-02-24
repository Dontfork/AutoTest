import * as fs from 'fs';
import * as vscode from 'vscode';
import { Client, ConnectConfig } from 'ssh2';
import { getConfig } from '../config';
import { ServerConfig, CommandConfig } from '../types';
import { 
    filterCommandOutput, 
    stripAnsiEscapeCodes
} from '../utils/outputFilter';
import { UnifiedOutputChannel } from '../utils/outputChannel';
import {
    resolveServerConfig,
    buildFullCommand,
    outputCommandHeader,
    outputCommandCompletion,
    processOutputLine,
    processErrorLine,
    buildExecuteResult
} from './commandExecutorUtils';

let isCommandExecuting = false;

export function isExecuting(): boolean {
    return isCommandExecuting;
}

export class SSHClient {
    private client: Client | null = null;
    private connected: boolean = false;
    private serverConfig: ServerConfig | null = null;

    constructor(serverConfig?: ServerConfig) {
        this.serverConfig = serverConfig || null;
    }

    private getServerConfig(): ServerConfig {
        if (this.serverConfig) {
            return this.serverConfig;
        }
        const config = getConfig();
        if (config.projects && config.projects.length > 0 && config.projects[0].enabled !== false) {
            return config.projects[0].server;
        }
        throw new Error('未配置服务器信息');
    }

    async connect(): Promise<Client> {
        if (this.client && this.connected) {
            return this.client;
        }

        const serverConfig = this.getServerConfig();
        const sshConfig: ConnectConfig = {
            host: serverConfig.host,
            port: serverConfig.port,
            username: serverConfig.username,
            readyTimeout: 30000
        };

        if (serverConfig.privateKeyPath && fs.existsSync(serverConfig.privateKeyPath)) {
            sshConfig.privateKey = fs.readFileSync(serverConfig.privateKeyPath);
        } else if (serverConfig.password) {
            sshConfig.password = serverConfig.password;
        } else {
            throw new Error('未配置 SSH 认证方式（密码或私钥）');
        }

        return new Promise((resolve, reject) => {
            this.client = new Client();
            
            this.client.on('ready', () => {
                this.connected = true;
                resolve(this.client!);
            });

            this.client.on('error', (err) => {
                this.connected = false;
                reject(new Error(`SSH 连接失败: ${err.message}`));
            });

            this.client.on('close', () => {
                this.connected = false;
            });

            this.client.connect(sshConfig);
        });
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            this.client.end();
            this.client = null;
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    getClient(): Client | null {
        return this.client;
    }
}

export interface ExecuteResult {
    stdout: string;
    stderr: string;
    code: number;
    filteredOutput: string;
}

/**
 * 执行远程命令
 * 
 * @param command - 要执行的命令
 * @param outputChannel - 输出通道
 * @param serverConfig - 服务器配置
 * @param commandConfig - 命令配置
 * @param clearOutput - 是否清空输出
 * @returns 执行结果
 */
export async function executeRemoteCommand(
    command: string,
    outputChannel?: UnifiedOutputChannel,
    serverConfig?: ServerConfig,
    commandConfig?: Partial<CommandConfig>,
    clearOutput?: boolean
): Promise<ExecuteResult> {
    if (isCommandExecuting) {
        throw new Error('当前有命令正在执行中，请等待执行完成后再试');
    }
    
    isCommandExecuting = true;
    const sshClient = new SSHClient(serverConfig);
    
    try {
        const client = await sshClient.connect();
        const finalServerConfig = resolveServerConfig(serverConfig);
        const includePatterns = commandConfig?.includePatterns || [];
        const excludePatterns = commandConfig?.excludePatterns || [];
        const fullCommand = buildFullCommand(command, finalServerConfig);
        
        if (outputChannel) {
            outputCommandHeader(outputChannel, finalServerConfig, fullCommand, clearOutput);
        }

        return executeCommandStream(
            client, sshClient, outputChannel, fullCommand, 
            includePatterns, excludePatterns
        );
    } catch (error) {
        isCommandExecuting = false;
        await sshClient.disconnect();
        throw error;
    }
}

/**
 * 执行命令流处理
 */
function executeCommandStream(
    client: any,
    sshClient: SSHClient,
    outputChannel: UnifiedOutputChannel | undefined,
    fullCommand: string,
    includePatterns: string[],
    excludePatterns: string[]
): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        client.exec(fullCommand, (err: any, stream: any) => {
            if (err) {
                isCommandExecuting = false;
                reject(new Error(`命令执行失败: ${err.message}`));
                return;
            }

            setupStreamHandlers(
                stream, sshClient, outputChannel,
                includePatterns, excludePatterns,
                stdout, stderr, exitCode, resolve
            );
        });
    });
}

/**
 * 设置流处理程序
 */
function setupStreamHandlers(
    stream: any,
    sshClient: SSHClient,
    outputChannel: UnifiedOutputChannel | undefined,
    includePatterns: string[],
    excludePatterns: string[],
    stdout: string,
    stderr: string,
    exitCode: number,
    resolve: (result: ExecuteResult) => void
): void {
    stream.on('close', (code: number, signal: string) => {
        exitCode = code;
        isCommandExecuting = false;
        
        if (outputChannel) {
            outputCommandCompletion(outputChannel, exitCode);
        }
        
        const result = buildExecuteResult(stdout, stderr, exitCode, includePatterns, excludePatterns);
        resolve(result);
        sshClient.disconnect();
    });

    stream.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        
        if (outputChannel) {
            const cleanText = stripAnsiEscapeCodes(text);
            const lines = cleanText.split('\n');
            for (const line of lines) {
                processOutputLine(line, outputChannel, includePatterns, excludePatterns);
            }
        }
    });

    stream.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        
        if (outputChannel) {
            const cleanText = stripAnsiEscapeCodes(text);
            const lines = cleanText.split('\n');
            for (const line of lines) {
                processErrorLine(line, outputChannel, includePatterns, excludePatterns);
            }
        }
    });
}

export { filterCommandOutput, stripAnsiEscapeCodes } from '../utils/outputFilter';

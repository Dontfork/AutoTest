import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig } from '../config';
import { executeRemoteCommand, filterCommandOutput } from './sshClient';
import { CommandConfig, CommandVariables } from '../types';

export class CommandExecutor {
    private pluginChannel: vscode.OutputChannel;
    private testOutputChannel: vscode.OutputChannel;

    constructor() {
        this.pluginChannel = vscode.window.createOutputChannel('AutoTest');
        this.testOutputChannel = vscode.window.createOutputChannel('TestOutput');
    }

    replaceVariables(command: string, variables: CommandVariables): string {
        let result = command;
        
        result = result.replace(/{filePath}/g, variables.filePath);
        result = result.replace(/{fileName}/g, variables.fileName);
        result = result.replace(/{fileDir}/g, variables.fileDir);
        result = result.replace(/{localPath}/g, variables.localPath);
        result = result.replace(/{localDir}/g, variables.localDir);
        result = result.replace(/{localFileName}/g, variables.localFileName);
        result = result.replace(/{remoteDir}/g, variables.remoteDir);
        
        return result;
    }

    async execute(command: string, filterConfig?: Partial<CommandConfig>): Promise<string> {
        const config = getConfig();
        const filterPatterns = filterConfig?.filterPatterns ?? config.command.filterPatterns ?? [];
        const filterMode = filterConfig?.filterMode ?? config.command.filterMode ?? 'include';

        try {
            const result = await executeRemoteCommand(
                command, 
                this.testOutputChannel,
                { patterns: filterPatterns, mode: filterMode }
            );
            return result.filteredOutput;
        } catch (error: any) {
            this.pluginChannel.appendLine(`[执行错误] ${error.message}`);
            this.pluginChannel.show();
            throw error;
        }
    }

    async executeWithConfig(variables?: CommandVariables): Promise<string> {
        const config = getConfig();
        let command = config.command.executeCommand;
        
        if (variables) {
            command = this.replaceVariables(command, variables);
            this.pluginChannel.appendLine(`[变量替换] 原始命令: ${config.command.executeCommand}`);
            this.pluginChannel.appendLine(`[变量替换] 替换后: ${command}`);
        }
        
        return this.execute(command);
    }

    getPluginChannel(): vscode.OutputChannel {
        return this.pluginChannel;
    }

    getTestOutputChannel(): vscode.OutputChannel {
        return this.testOutputChannel;
    }

    showOutput(): void {
        this.pluginChannel.show();
    }

    clearOutput(): void {
        this.pluginChannel.clear();
        this.testOutputChannel.clear();
    }

    dispose(): void {
        this.pluginChannel.dispose();
        this.testOutputChannel.dispose();
    }
}

export function replaceCommandVariables(command: string, variables: CommandVariables): string {
    let result = command;
    
    result = result.replace(/{filePath}/g, variables.filePath);
    result = result.replace(/{fileName}/g, variables.fileName);
    result = result.replace(/{fileDir}/g, variables.fileDir);
    result = result.replace(/{localPath}/g, variables.localPath);
    result = result.replace(/{localDir}/g, variables.localDir);
    result = result.replace(/{localFileName}/g, variables.localFileName);
    result = result.replace(/{remoteDir}/g, variables.remoteDir);
    
    return result;
}

export function buildCommandVariables(
    localFilePath: string,
    remoteFilePath: string,
    remoteDir: string
): CommandVariables {
    const localDir = path.dirname(localFilePath);
    const localFileName = path.basename(localFilePath);
    const remoteFileDir = path.posix.dirname(remoteFilePath);
    
    return {
        filePath: remoteFilePath,
        fileName: path.posix.basename(remoteFilePath),
        fileDir: remoteFileDir,
        localPath: localFilePath,
        localDir: localDir,
        localFileName: localFileName,
        remoteDir: remoteDir
    };
}

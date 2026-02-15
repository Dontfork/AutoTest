import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig } from '../config';
import { executeRemoteCommand, filterCommandOutput } from './sshClient';
import { CommandConfig, CommandVariables } from '../types';

export class CommandExecutor {
    private terminalName = 'AutoTest';
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel(this.terminalName);
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
                this.outputChannel,
                { patterns: filterPatterns, mode: filterMode }
            );
            return result.filteredOutput;
        } catch (error: any) {
            this.outputChannel.appendLine(`[执行错误] ${error.message}`);
            this.outputChannel.show();
            throw error;
        }
    }

    async executeWithConfig(variables?: CommandVariables): Promise<string> {
        const config = getConfig();
        let command = config.command.executeCommand;
        
        if (variables) {
            command = this.replaceVariables(command, variables);
            this.outputChannel.appendLine(`[变量替换] 原始命令: ${config.command.executeCommand}`);
            this.outputChannel.appendLine(`[变量替换] 替换后: ${command}`);
        }
        
        return this.execute(command);
    }

    showOutput(): void {
        this.outputChannel.show();
    }

    clearOutput(): void {
        this.outputChannel.clear();
    }

    dispose(): void {
        this.outputChannel.dispose();
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

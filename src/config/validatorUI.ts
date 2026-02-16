import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigValidationResult } from './validator';
import { getOutputChannelManager } from '../utils/outputChannel';

export function showValidationMessages(result: ConfigValidationResult): void {
    if (result.errors.length > 0) {
        const errorMessage = `AutoTest 配置验证失败：\n${result.errors.join('\n')}`;
        vscode.window.showErrorMessage(errorMessage, '查看详情').then(selection => {
            if (selection === '查看详情') {
                const outputChannel = getOutputChannelManager().getAutoTestChannel();
                outputChannel.appendLine('');
                outputChannel.appendLine('配置验证结果');
                outputChannel.appendLine('─'.repeat(50));
                outputChannel.appendLine('错误:');
                result.errors.forEach((err, i) => outputChannel.appendLine(`  ${i + 1}. ${err}`));
                if (result.warnings.length > 0) {
                    outputChannel.appendLine('警告:');
                    result.warnings.forEach((warn, i) => outputChannel.appendLine(`  ${i + 1}. ${warn}`));
                }
                outputChannel.show();
            }
        });
    }

    if (result.warnings.length > 0 && result.errors.length === 0) {
        result.warnings.forEach(warning => {
            vscode.window.showWarningMessage(warning);
        });
    }
}

export function saveConfigWithDefaults(configPath: string, config: any, filledConfig: any): void {
    const content = JSON.stringify(filledConfig, null, 4);
    const existingContent = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '';
    
    if (content === existingContent) {
        return;
    }
    
    fs.writeFileSync(configPath, content, 'utf-8');
    vscode.window.showInformationMessage('AutoTest 配置文件已更新，补充了缺失的必填字段');
}

import * as vscode from 'vscode';
import { loadConfig, setupConfigWatcher, onConfigChanged, dispose as disposeConfig } from './config';
import { CommandExecutor, FileUploader, CommandRegistry } from './core';
import { ConnectionPool } from './core/connectionPool';
import { AIChat, SessionManager } from './ai';
import { LogTreeView, AIChatViewProvider, ChangesTreeView, QuickCommandsTreeView } from './views';

let commandExecutor: CommandExecutor;
let fileUploader: FileUploader;
let aiChat: AIChat;
let sessionManager: SessionManager;
let logTreeView: LogTreeView;
let changesTreeView: ChangesTreeView;
let quickCommandsTreeView: QuickCommandsTreeView;
let commandRegistry: CommandRegistry;

/**
 * RemoteTest 插件激活函数
 * 
 * 初始化所有核心组件和视图，注册命令和事件监听器
 */
export function activate(context: vscode.ExtensionContext): void {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    initializeConfig(workspacePath);
    
    const components = initializeComponents(context);
    ({ commandExecutor, fileUploader, aiChat, sessionManager, 
       logTreeView, changesTreeView, quickCommandsTreeView } = components);
    
    setupComponentListeners(components, context);
    
    commandRegistry = new CommandRegistry(
        context, fileUploader, logTreeView, changesTreeView, quickCommandsTreeView
    );
    const registeredCommands = commandRegistry.registerAllCommands();
    
    const aiChatViewProvider = new AIChatViewProvider(context, aiChat, sessionManager);
    const aiChatView = vscode.window.registerWebviewViewProvider(
        AIChatViewProvider.viewType, 
        aiChatViewProvider
    );
    
    context.subscriptions.push(...registeredCommands, aiChatView);
    
    logTreeView.start();
    vscode.window.showInformationMessage('RemoteTest 插件已启动');
}

/**
 * 初始化配置
 */
function initializeConfig(workspacePath?: string): void {
    if (workspacePath) {
        loadConfig(workspacePath);
    }
}

/**
 * 初始化所有核心组件
 */
function initializeComponents(context: vscode.ExtensionContext) {
    const commandExecutor = new CommandExecutor();
    const sessionManager = new SessionManager(context);
    const fileUploader = new FileUploader(commandExecutor);
    
    return {
        commandExecutor,
        fileUploader,
        sessionManager,
        aiChat: new AIChat(sessionManager),
        logTreeView: new LogTreeView(),
        changesTreeView: new ChangesTreeView(fileUploader),
        quickCommandsTreeView: new QuickCommandsTreeView()
    };
}

/**
 * 设置组件间的事件监听器
 */
function setupComponentListeners(components: any, context: vscode.ExtensionContext): void {
    const { fileUploader, logTreeView, changesTreeView, quickCommandsTreeView } = components;
    
    fileUploader.setOnTestCaseComplete(() => {
        logTreeView.refresh();
    });
    
    setupConfigWatcher(context);
    
    onConfigChanged(() => {
        logTreeView.refresh();
        changesTreeView.refresh();
        quickCommandsTreeView.refresh();
    });
}

/**
 * RemoteTest 插件停用函数
 * 
 * 清理所有资源，停止运行中的服务
 */
export function deactivate(): void {
    if (logTreeView) {
        logTreeView.stop();
    }
    if (commandExecutor) {
        commandExecutor.dispose();
    }
    if (sessionManager) {
        sessionManager.dispose();
    }
    if (commandRegistry) {
        commandRegistry.dispose();
    }
    ConnectionPool.getInstance().destroy();
    disposeConfig();
}


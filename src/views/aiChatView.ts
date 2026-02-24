import * as vscode from 'vscode';
import { marked } from 'marked';
import { AIChat } from '../ai';
import { SessionManager } from '../ai/sessionManager';
import { onConfigChanged, getConfig } from '../config';
import { MessageHandler, WebviewMessage } from './messageHandler';
import { getHtmlContent } from './chatTemplate';
import { enhanceMarkdown } from './syntaxHighlighter';

marked.setOptions({
    gfm: true,
    breaks: true
});

export class AIChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'RemoteTest-ai-view';
    private view: vscode.WebviewView | undefined;
    private messageHandler: MessageHandler;

    constructor(
        private context: vscode.ExtensionContext,
        private aiChat: AIChat,
        private sessionManager: SessionManager
    ) {
        this.messageHandler = new MessageHandler(
            context,
            aiChat,
            sessionManager,
            this.postMessage.bind(this)
        );

        onConfigChanged(() => {
            if (this.view) {
                this.sendAvailableModels();
                this.sendProjects();
            }
        });
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this.view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        
        webviewView.webview.html = getHtmlContent();

        webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            await this.messageHandler.handle(message);
        });

        this.sessionManager.onSessionsChange(() => {
            this.sendSessions();
        });
        
        this.initializeView();
    }

    private initializeView(): void {
        this.sendAvailableModels();
        this.sendSessions();
        this.sendCurrentSession();
        this.sendSystemPrompt();
        this.sendProjects();
        this.sendCurrentMode();
        this.sendSelectedProjects();
    }

    private sendCurrentMode(): void {
        const mode = this.messageHandler.getCurrentMode();
        this.postMessage('mode', mode);
    }

    private sendSelectedProjects(): void {
        const projects = this.messageHandler.getSelectedProjects();
        this.postMessage('selectedProjects', projects);
    }

    private postMessage(command: string, data?: unknown): void {
        this.view?.webview.postMessage({ command, data });
    }

    private sendSystemPrompt(): void {
        const prompt = this.sessionManager.getSystemPrompt();
        this.postMessage('systemPrompt', prompt);
    }

    private sendSessions(): void {
        const sessions = this.aiChat.getAllSessions();
        this.postMessage('sessions', sessions.map(s => ({
            id: s.id,
            title: s.title,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            messageCount: s.messages.length,
            mode: s.mode || 'ask'
        })));
    }

    private async sendCurrentSession(): Promise<void> {
        const session = this.aiChat.getCurrentSession();
        if (!session) {
            this.postMessage('currentSession', null);
            return;
        }

        const renderedMessages = await Promise.all(
            session.messages.map(async (m) => {
                if (m.role === 'assistant') {
                    const html = await marked(m.content);
                    return { ...m, renderedContent: enhanceMarkdown(html) };
                }
                return m;
            })
        );

        this.postMessage('currentSession', {
            id: session.id,
            title: session.title,
            messages: renderedMessages,
            mode: session.mode || 'ask',
            selectedProjects: session.selectedProjects || []
        });
        
        this.messageHandler.restoreState(
            session.mode || 'ask',
            session.selectedProjects || []
        );
    }

    private sendAvailableModels(): void {
        const models = this.aiChat.getAvailableModels();
        const currentModel = this.aiChat.getCurrentModel();
        this.postMessage('models', {
            models: models.map(m => ({ name: m.name })),
            currentModel: currentModel
        });
    }

    private sendProjects(): void {
        const config = getConfig();
        this.postMessage('projects', config.projects);
    }
}

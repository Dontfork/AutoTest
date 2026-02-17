import * as vscode from 'vscode';
import { marked } from 'marked';
import { AIChat } from '../ai';
import { SessionManager } from '../ai/sessionManager';
import { ChatSession, AIModelConfig } from '../types';
import { onConfigChanged } from '../config';

marked.setOptions({
    gfm: true,
    breaks: true
});

function highlightCode(code: string, lang: string): string {
    const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escaped = escapeHtml(code);
    
    if (!lang || lang === 'plaintext') {
        return escaped;
    }
    
    const patterns: { [key: string]: [RegExp, string][] } = {
        javascript: [
            [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof)\b/g, 'keyword'],
            [/\b(true|false|null|undefined|NaN|Infinity)\b/g, 'literal'],
            [/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\/\/.*$/gm, 'comment'],
            [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
            [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
            [/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, 'function'],
        ],
        typescript: [
            [/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|typeof|instanceof|interface|type|enum|implements|extends|public|private|protected|readonly|abstract|static)\b/g, 'keyword'],
            [/\b(true|false|null|undefined|NaN|Infinity)\b/g, 'literal'],
            [/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\/\/.*$/gm, 'comment'],
            [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
            [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
            [/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, 'function'],
        ],
        python: [
            [/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|raise|pass|break|continue|and|or|not|in|is|None|True|False)\b/g, 'keyword'],
            [/(['"]{3}[\s\S]*?['"]{3}|['"][^'"]*['"])/g, 'string'],
            [/#.*$/gm, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
            [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
            [/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 'function'],
        ],
        java: [
            [/\b(public|private|protected|class|interface|extends|implements|return|if|else|for|while|try|catch|finally|throw|throws|new|this|super|static|final|abstract|void|int|long|short|byte|float|double|boolean|char|null|true|false|import|package)\b/g, 'keyword'],
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\/\/.*$/gm, 'comment'],
            [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
            [/\b(\d+\.?\d*[fFdDlL]?)\b/g, 'number'],
            [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
            [/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 'function'],
        ],
        go: [
            [/\b(package|import|func|return|if|else|for|range|switch|case|default|break|continue|go|defer|chan|select|struct|interface|map|type|var|const)\b/g, 'keyword'],
            [/\b(true|false|nil)\b/g, 'literal'],
            [/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\/\/.*$/gm, 'comment'],
            [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
            [/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 'function'],
        ],
        rust: [
            [/\b(fn|let|mut|const|pub|mod|use|struct|enum|impl|trait|where|type|self|Self|if|else|match|for|while|loop|break|continue|return|move|ref|as|in|unsafe|extern|crate|static|dyn)\b/g, 'keyword'],
            [/\b(true|false|None|Some|Ok|Err)\b/g, 'literal'],
            [/(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\/\/.*$/gm, 'comment'],
            [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
            [/\b([A-Z][a-zA-Z0-9]*)\b/g, 'class'],
            [/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 'function'],
        ],
        sql: [
            [/\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|LIKE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NULL|DEFAULT|UNIQUE|CHECK|CONSTRAINT)\b/gi, 'keyword'],
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/--.*$/gm, 'comment'],
            [/\b(\d+\.?\d*)\b/g, 'number'],
        ],
        json: [
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1(?=\s*:)/g, 'attribute'],
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/\b(true|false|null)\b/g, 'literal'],
            [/\b(-?\d+\.?\d*)\b/g, 'number'],
        ],
        yaml: [
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/#.*$/gm, 'comment'],
            [/\b(true|false|null|yes|no|on|off)\b/gi, 'literal'],
            [/\b(-?\d+\.?\d*)\b/g, 'number'],
            [/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(?=\s*:)/gm, 'attribute'],
        ],
        bash: [
            [/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|local|export|source|alias|unset|readonly|declare|typeset)\b/g, 'keyword'],
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/#.*$/gm, 'comment'],
            [/\b(\d+)\b/g, 'number'],
            [/\$([a-zA-Z_][a-zA-Z0-9_]*|\{[^}]+\}|\([^)]+\))/g, 'variable'],
        ],
        shell: [
            [/\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|local|export|source|alias|unset|readonly|declare|typeset)\b/g, 'keyword'],
            [/(['"])(?:(?!\1)[^\\]|\\.)*?\1/g, 'string'],
            [/#.*$/gm, 'comment'],
            [/\b(\d+)\b/g, 'number'],
            [/\$([a-zA-Z_][a-zA-Z0-9_]*|\{[^}]+\}|\([^)]+\))/g, 'variable'],
        ],
    };
    
    const langPatterns = patterns[lang.toLowerCase()] || patterns.javascript;
    
    let result = escaped;
    const placeholders: { placeholder: string; html: string }[] = [];
    
    for (const [pattern, className] of langPatterns) {
        result = result.replace(pattern, (match) => {
            const placeholder = `__PLACEHOLDER_${placeholders.length}__`;
            placeholders.push({ placeholder, html: `<span class="hljs-${className}">${match}</span>` });
            return placeholder;
        });
    }
    
    for (const { placeholder, html } of placeholders) {
        result = result.replace(placeholder, html);
    }
    
    return result;
}

function enhanceMarkdown(html: string): string {
    html = html.replace(/<pre><code(?: class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
        const langDisplay = lang ? `<span class="code-lang">${lang}</span>` : '';
        const highlightedCode = highlightCode(code, lang);
        return `<pre><div class="code-header">${langDisplay}<button class="copy-btn" title="复制代码"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button></div><code>${highlightedCode}</code></pre>`;
    });
    
    html = html.replace(/<h([1-6])>/g, '<h$1 style="margin: 16px 0 8px 0; color: #e0e0e0; font-weight: 600;">');
    html = html.replace(/<ul>/g, '<ul style="margin: 8px 0; padding-left: 24px;">');
    html = html.replace(/<ol>/g, '<ol style="margin: 8px 0; padding-left: 24px;">');
    html = html.replace(/<li>/g, '<li style="margin: 4px 0; line-height: 1.6;">');
    html = html.replace(/<blockquote>/g, '<blockquote style="border-left: 3px solid #0e639c; padding: 8px 16px; margin: 12px 0; background: #252526; border-radius: 0 4px 4px 0;">');
    html = html.replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">');
    html = html.replace(/<tr>/g, '<tr style="border-bottom: 1px solid #3c3c3c;">');
    html = html.replace(/<th>/g, '<th style="padding: 8px 12px; text-align: left;">');
    html = html.replace(/<td>/g, '<td style="padding: 8px 12px;">');
    html = html.replace(/<p>/g, '<p style="margin: 8px 0; line-height: 1.7;">');
    html = html.replace(/<code>(?![^<]*<\/code><\/pre>)/g, '<code style="background: #2d2d2d; padding: 2px 6px; border-radius: 3px; font-family: Consolas, Monaco, monospace; font-size: 0.9em;">');
    html = html.replace(/<a /g, '<a style="color: #3794ff; text-decoration: none;" target="_blank" ');
    
    return html;
}

export class AIChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'autotest-ai-view';
    private aiChat: AIChat;
    private sessionManager: SessionManager;
    private view: vscode.WebviewView | undefined;
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri, aiChat: AIChat, sessionManager: SessionManager) {
        this.extensionUri = extensionUri;
        this.aiChat = aiChat;
        this.sessionManager = sessionManager;
        
        onConfigChanged(() => {
            if (this.view) {
                this.sendAvailableModels();
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
            localResourceRoots: [this.extensionUri]
        };
        
        webviewView.webview.html = this.getHtmlContent();

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    await this.handleSendMessage(message.data);
                    break;
                case 'clearChat':
                    this.aiChat.clearCurrentSession();
                    this.sendCurrentSession();
                    break;
                case 'newSession':
                    const currentSession = this.aiChat.getCurrentSession();
                    if (!currentSession || currentSession.messages.length > 0) {
                        this.aiChat.createNewSession();
                    }
                    this.sendSessions();
                    this.sendCurrentSession();
                    break;
                case 'switchSession':
                    this.aiChat.setCurrentSession(message.sessionId);
                    this.sendCurrentSession();
                    break;
                case 'deleteSession':
                    this.aiChat.deleteSession(message.sessionId);
                    this.sendSessions();
                    this.sendCurrentSession();
                    break;
                case 'getSessions':
                    this.sendSessions();
                    this.sendCurrentSession();
                    break;
                case 'switchModel':
                    this.aiChat.setModel(message.modelName);
                    this.sendCurrentModel();
                    break;
                case 'getModels':
                    this.sendAvailableModels();
                    break;
                case 'importPrompt':
                    this.handleImportPrompt();
                    break;
                case 'saveSystemPrompt':
                    this.sessionManager.saveSystemPrompt(message.prompt);
                    break;
                case 'getSystemPrompt':
                    this.sendSystemPrompt();
                    break;
            }
        });

        this.sessionManager.onSessionsChange(() => {
            this.sendSessions();
        });
        
        this.sendSystemPrompt();
    }

    private sendSystemPrompt(): void {
        const prompt = this.sessionManager.getSystemPrompt();
        this.view?.webview.postMessage({
            command: 'systemPrompt',
            data: prompt
        });
    }

    private sendSessions(): void {
        const sessions = this.aiChat.getAllSessions();
        this.view?.webview.postMessage({
            command: 'sessions',
            data: sessions.map(s => ({
                id: s.id,
                title: s.title,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                messageCount: s.messages.length
            }))
        });
    }

    private async sendCurrentSession(): Promise<void> {
        const session = this.aiChat.getCurrentSession();
        if (!session) {
            this.view?.webview.postMessage({
                command: 'currentSession',
                data: null
            });
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

        this.view?.webview.postMessage({
            command: 'currentSession',
            data: {
                id: session.id,
                title: session.title,
                messages: renderedMessages
            }
        });
    }

    private sendAvailableModels(): void {
        const models = this.aiChat.getAvailableModels();
        const currentModel = this.aiChat.getCurrentModel();
        this.view?.webview.postMessage({
            command: 'models',
            data: {
                models: models.map(m => ({ name: m.name })),
                currentModel: currentModel
            }
        });
    }

    private sendCurrentModel(): void {
        const currentModel = this.aiChat.getCurrentModel();
        this.view?.webview.postMessage({
            command: 'currentModel',
            data: currentModel
        });
    }

    private async handleImportPrompt(): Promise<void> {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Prompt Files': ['txt', 'md']
            },
            title: '选择 Prompt 文件'
        });

        if (uris && uris.length > 0) {
            try {
                const content = await vscode.workspace.fs.readFile(uris[0]);
                const text = Buffer.from(content).toString('utf-8');
                this.view?.webview.postMessage({
                    command: 'promptContent',
                    data: text
                });
            } catch (error: any) {
                vscode.window.showErrorMessage('读取文件失败: ' + error.message);
            }
        }
    }

    private async handleSendMessage(data: { message: string; systemPrompt?: string }): Promise<void> {
        try {
            let fullContent = '';
            
            const response = await this.aiChat.sendMessageStream(data.message, data.systemPrompt, async (chunk) => {
                fullContent += chunk;
                const htmlContent = enhanceMarkdown(await marked(fullContent));
                this.view?.webview.postMessage({
                    command: 'streamChunk',
                    data: htmlContent
                });
            });

            if (response.error) {
                this.view?.webview.postMessage({
                    command: 'streamError',
                    error: response.error
                });
            } else {
                const markdownContent = response.content || fullContent;
                const htmlContent = enhanceMarkdown(await marked(markdownContent));
                this.view?.webview.postMessage({
                    command: 'streamComplete',
                    data: htmlContent
                });
                this.sendSessions();
            }
        } catch (error: any) {
            const errorMsg = error?.message || String(error);
            this.view?.webview.postMessage({
                command: 'streamError',
                error: '处理消息时出错: ' + errorMsg
            });
        }
    }

    private getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1e1e1e; color: #cccccc; height: 100vh; display: flex; flex-direction: column; }
        .toolbar { padding: 4px 12px; border-bottom: 1px solid #3c3c3c; display: flex; gap: 8px; align-items: center; position: relative; justify-content: space-between; }
        .toolbar-left { display: flex; align-items: center; gap: 8px; }
        .toolbar-right { display: flex; align-items: center; gap: 8px; }
        .toolbar button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: transparent; color: #858585; border: none; cursor: pointer; transition: all 0.2s; }
        .toolbar button:hover { color: #cccccc; }
        .toolbar button svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 1.5; fill: none; }
        .model-select { background: transparent; color: #858585; border: none; border-bottom: 1px solid #3c3c3c; padding: 2px 0; font-size: 12px; cursor: pointer; min-width: 80px; appearance: none; -webkit-appearance: none; }
        .model-select:hover { color: #cccccc; border-bottom-color: #858585; }
        .model-select:focus { outline: none; border-bottom-color: #858585; }
        .model-select option { background: #1e1e1e; color: #cccccc; padding: 4px 8px; }
        .model-select option:checked, .model-select option:hover { background: #2d2d2d; color: #cccccc; }
        .messages { flex: 1; overflow-y: auto; padding: 16px; }
        .msg { margin-bottom: 16px; display: flex; }
        .msg.user { justify-content: flex-end; }
        .bubble { padding: 12px 16px; border-radius: 8px; max-width: 85%; line-height: 1.7; }
        .user .bubble { background: #2d2d2d; border: none; }
        .assistant .bubble { background: transparent; border: 1px solid #3c3c3c; }
        .error .bubble { background: transparent; border: 1px solid #5a1d1d; color: #f48771; }
        .bubble pre { background: #1e1e1e; border-radius: 8px; overflow: hidden; margin: 12px 0; border: 1px solid #3c3c3c; }
        .bubble pre code { display: block; padding: 12px 16px; overflow-x: auto; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.5; background: none; }
        .code-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #2d2d2d; border-bottom: 1px solid #3c3c3c; }
        .code-lang { font-size: 11px; color: #858585; font-family: 'Consolas', 'Monaco', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
        .copy-btn { background: transparent; color: #858585; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 11px; transition: all 0.2s; }
        .copy-btn:hover { color: #cccccc; background: #3c3c3c; }
        .copy-btn svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 1.5; fill: none; }
        .copy-btn.copied { color: #4ec9b0; }
        .bubble code { background: #2d2d2d; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9em; }
        .bubble a { color: #3794ff; }
        .bubble strong { color: #ffffff; font-weight: 600; }
        .bubble em { color: #d0d0d0; }
        .bubble hr { border: none; border-top: 1px solid #3c3c3c; margin: 16px 0; }
        .bubble img { max-width: 100%; border-radius: 4px; }
        .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-tag { color: #569cd6; }
        .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable, .hljs-type { color: #ce9178; }
        .hljs-comment, .hljs-deletion { color: #6a9955; }
        .hljs-number, .hljs-regexp, .hljs-addition { color: #b5cea8; }
        .hljs-function { color: #dcdcaa; }
        .hljs-variable, .hljs-params { color: #9cdcfe; }
        .hljs-class .hljs-title { color: #4ec9b0; }
        .hljs-symbol, .hljs-bullet { color: #d4d4d4; }
        .hljs-meta { color: #808080; }
        .hljs-link { color: #3794ff; text-decoration: underline; }
        .input-area { padding: 10px 12px; border-top: 1px solid #3c3c3c; background: transparent; overflow: hidden; }
        .input-wrap { display: flex; gap: 8px; align-items: flex-end; overflow: hidden; }
        textarea { flex: 1; padding: 4px 0 3px 0; background: transparent; color: #cccccc; border: none; border-bottom: 1px solid #3c3c3c; resize: none; font-family: inherit; font-size: 14px; line-height: 18px; height: 25px; -webkit-appearance: none; appearance: none; overflow: hidden; }
        textarea::-webkit-resizer { display: none; }
        textarea::-webkit-scrollbar { display: none; }
        textarea::resizer { display: none; }
        textarea:focus { outline: none; border-bottom-color: #858585; }
        button#sendBtn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: transparent; color: #858585; border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0; margin-bottom: -6px; }
        button#sendBtn:hover { color: #cccccc; }
        button#sendBtn:disabled { color: #3c3c3c; cursor: not-allowed; }
        button#sendBtn svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 1.5; fill: none; }
        .welcome { text-align: center; padding: 60px 20px; color: #858585; }
        .welcome-icon { width: 48px; height: 48px; margin: 0 auto 16px; stroke: #858585; stroke-width: 1; fill: none; }
        .welcome h2 { color: #cccccc; margin-bottom: 8px; font-weight: 400; }
        .history-panel { display: none; position: absolute; top: 100%; left: 12px; right: 12px; background: #1e1e1e; border: 1px solid #3c3c3c; border-radius: 4px; max-height: 300px; overflow-y: auto; z-index: 100; }
        .history-panel.show { display: block; }
        .history-item { padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #3c3c3c; display: flex; justify-content: space-between; align-items: center; }
        .history-item:last-child { border-bottom: none; }
        .history-item:hover { background: #2d2d2d; }
        .history-item.active { background: #2d2d2d; }
        .history-item .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .history-item .meta { font-size: 0.8em; color: #858585; margin-left: 8px; }
        .history-item .delete-btn { background: none; border: none; color: #858585; cursor: pointer; padding: 4px; margin-left: 8px; display: flex; align-items: center; }
        .history-item .delete-btn:hover { color: #f48771; }
        .history-item .delete-btn svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 1.5; fill: none; }
        .no-history { padding: 24px; text-align: center; color: #858585; }
        .prompt-area { border-bottom: 1px solid #3c3c3c; padding: 8px 12px; }
        .prompt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .prompt-label { font-size: 11px; color: #858585; }
        .prompt-actions { display: flex; gap: 8px; }
        .prompt-actions button { background: transparent; color: #858585; border: none; cursor: pointer; padding: 2px 6px; font-size: 11px; display: flex; align-items: center; gap: 4px; }
        .prompt-actions button:hover { color: #cccccc; }
        .prompt-actions button svg { width: 12px; height: 12px; stroke: currentColor; stroke-width: 1.5; fill: none; }
        #promptInput { width: 100%; min-height: 40px; max-height: 100px; padding: 4px 0; background: transparent; color: #cccccc; border: none; border-bottom: 1px solid #3c3c3c; resize: vertical; font-family: inherit; font-size: 12px; line-height: 1.5; }
        #promptInput:focus { outline: none; border-bottom-color: #858585; }
        #promptInput::placeholder { color: #5a5a5a; }
        .prompt-collapsed #promptInput { display: none; }
        .prompt-toggle { transform: rotate(180deg); transition: transform 0.2s; }
        .prompt-collapsed .prompt-toggle { transform: rotate(0deg); }
        .input-config { border-top: 1px solid #3c3c3c; padding: 8px 12px; background: #1e1e1e; }
        .config-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
        .config-row:last-child { margin-bottom: 0; }
        .config-label { font-size: 11px; color: #858585; min-width: 60px; }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-left">
        </div>
        <div class="toolbar-right">
            <button id="newBtn" title="新对话">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <button id="historyBtn" title="历史">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </button>
        </div>
        <div id="historyPanel" class="history-panel"></div>
    </div>
    <div id="messages" class="messages">
        <div class="welcome">
            <svg class="welcome-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></svg>
            <h2>AutoTest AI 助手</h2>
            <p>输入问题开始对话</p>
        </div>
    </div>
    <div class="input-config">
        <div class="config-row">
            <span class="config-label">模型</span>
            <select id="modelSelect" class="model-select" title="选择模型">
                <option value="">加载中...</option>
            </select>
        </div>
        <div id="promptArea" class="prompt-area" style="padding: 0; border: none;">
            <div class="prompt-header" style="margin-bottom: 4px;">
                <span class="prompt-label">提示词</span>
                <div class="prompt-actions">
                    <button id="importPromptBtn" title="导入文件">
                        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    </button>
                    <button id="clearPromptBtn" title="清空">
                        <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                    <button id="togglePromptBtn" class="prompt-toggle" title="折叠">
                        <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                </div>
            </div>
            <textarea id="promptInput" placeholder="输入系统提示词..."></textarea>
        </div>
    </div>
    <div class="input-area">
        <div class="input-wrap">
            <textarea id="input" placeholder="输入消息..." rows="2"></textarea>
            <button id="sendBtn" title="发送">
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const messages = document.getElementById('messages');
        const input = document.getElementById('input');
        const sendBtn = document.getElementById('sendBtn');
        const newBtn = document.getElementById('newBtn');
        const historyBtn = document.getElementById('historyBtn');
        const historyPanel = document.getElementById('historyPanel');
        const modelSelect = document.getElementById('modelSelect');
        const promptArea = document.getElementById('promptArea');
        const promptInput = document.getElementById('promptInput');
        const importPromptBtn = document.getElementById('importPromptBtn');
        const clearPromptBtn = document.getElementById('clearPromptBtn');
        const togglePromptBtn = document.getElementById('togglePromptBtn');
        let sessions = [];
        let currentSessionId = null;
        let availableModels = [];
        let currentModel = null;
        let systemPrompt = '';
        
        function escapeHtml(text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        
        function renderModels() {
            if (!availableModels || availableModels.length === 0) {
                modelSelect.innerHTML = '<option value="">无可用模型</option>';
                return;
            }
            modelSelect.innerHTML = availableModels.map(m => 
                '<option value="' + escapeHtml(m.name) + '"' + (m.name === currentModel ? ' selected' : '') + '>' + escapeHtml(m.name) + '</option>'
            ).join('');
        }
        
        function addMessage(role, content, isRendered = false) {
            const welcome = messages.querySelector('.welcome');
            if (welcome) welcome.remove();
            const div = document.createElement('div');
            div.className = 'msg ' + role;
            div.innerHTML = '<div class="bubble">' + content + '</div>';
            messages.appendChild(div);
            addCopyButtons(div);
            messages.scrollTop = messages.scrollHeight;
            return div;
        }
        
        function addCopyButtons(container) {
            const copyBtns = container.querySelectorAll('.copy-btn');
            copyBtns.forEach((btn) => {
                btn.onclick = function() {
                    const pre = btn.closest('pre');
                    const code = pre ? (pre.querySelector('code')?.textContent || '') : '';
                    navigator.clipboard.writeText(code).then(() => {
                        btn.classList.add('copied');
                        btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> 已复制';
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            btn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
                        }, 2000);
                    });
                };
            });
        }
        
        function renderMessages(msgs) {
            messages.innerHTML = '';
            if (!msgs || msgs.length === 0) {
                messages.innerHTML = '<div class="welcome"><h2>AutoTest AI 助手</h2><p>输入问题开始对话</p></div>';
                return;
            }
            msgs.forEach(m => {
                if (m.role === 'assistant' && m.renderedContent) {
                    addMessage(m.role, m.renderedContent, true);
                } else if (m.role === 'assistant') {
                    addMessage(m.role, m.content, false);
                } else {
                    addMessage(m.role, escapeHtml(m.content));
                }
            });
        }
        
        function renderHistory() {
            if (sessions.length === 0) {
                historyPanel.innerHTML = '<div class="no-history">暂无历史会话</div>';
                return;
            }
            historyPanel.innerHTML = sessions.map(s => 
                '<div class="history-item' + (s.id === currentSessionId ? ' active' : '') + '" data-id="' + s.id + '">' +
                '<span class="title">' + escapeHtml(s.title) + '</span>' +
                '<span class="meta">' + s.messageCount + '条</span>' +
                '<button class="delete-btn" data-id="' + s.id + '" title="删除"><svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>' +
                '</div>'
            ).join('');
        }
        
        function send() {
            const text = input.value.trim();
            if (!text) return;
            systemPrompt = promptInput.value.trim();
            vscode.postMessage({ command: 'saveSystemPrompt', prompt: systemPrompt });
            addMessage('user', escapeHtml(text));
            input.value = '';
            sendBtn.disabled = true;
            addMessage('assistant', '思考中...');
            vscode.postMessage({ command: 'sendMessage', data: { message: text, systemPrompt: systemPrompt } });
        }
        
        sendBtn.onclick = send;
        input.onkeydown = function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        };
        
        newBtn.onclick = function() {
            historyPanel.classList.remove('show');
            vscode.postMessage({ command: 'newSession' });
        };
        
        historyBtn.onclick = function() {
            historyPanel.classList.toggle('show');
        };
        
        modelSelect.onchange = function() {
            const selectedModel = modelSelect.value;
            if (selectedModel && selectedModel !== currentModel) {
                vscode.postMessage({ command: 'switchModel', modelName: selectedModel });
            }
        };
        
        importPromptBtn.onclick = function() {
            vscode.postMessage({ command: 'importPrompt' });
        };
        
        clearPromptBtn.onclick = function() {
            promptInput.value = '';
            systemPrompt = '';
            vscode.postMessage({ command: 'saveSystemPrompt', prompt: '' });
        };
        
        togglePromptBtn.onclick = function() {
            promptArea.classList.toggle('prompt-collapsed');
        };
        
        historyPanel.onclick = function(e) {
            const item = e.target.closest('.history-item');
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                vscode.postMessage({ command: 'deleteSession', sessionId: deleteBtn.dataset.id });
            } else if (item) {
                historyPanel.classList.remove('show');
                vscode.postMessage({ command: 'switchSession', sessionId: item.dataset.id });
            }
        };
        
        document.onclick = function(e) {
            if (!historyBtn.contains(e.target) && !historyPanel.contains(e.target)) {
                historyPanel.classList.remove('show');
            }
        };
        
        window.onmessage = function(e) {
            const m = e.data;
            if (m.command === 'streamChunk') {
                const lastMsg = messages.lastChild;
                if (lastMsg && lastMsg.classList.contains('assistant')) {
                    const bubble = lastMsg.querySelector('.bubble');
                    if (bubble && m.data) {
                        bubble.innerHTML = m.data;
                        messages.scrollTop = messages.scrollHeight;
                    }
                }
            } else if (m.command === 'streamComplete') {
                sendBtn.disabled = false;
                const lastMsg = messages.lastChild;
                if (lastMsg && lastMsg.classList.contains('assistant')) {
                    const bubble = lastMsg.querySelector('.bubble');
                    if (bubble && m.data) {
                        bubble.innerHTML = m.data;
                    }
                }
            } else if (m.command === 'streamError') {
                addMessage('error', m.error);
                sendBtn.disabled = false;
            } else if (m.command === 'sessions') {
                sessions = m.data || [];
                renderHistory();
            } else if (m.command === 'currentSession') {
                currentSessionId = m.data ? m.data.id : null;
                renderMessages(m.data ? m.data.messages : []);
                renderHistory();
            } else if (m.command === 'models') {
                availableModels = m.data.models || [];
                currentModel = m.data.currentModel;
                renderModels();
            } else if (m.command === 'currentModel') {
                currentModel = m.data;
                renderModels();
            } else if (m.command === 'promptContent') {
                promptInput.value = m.data;
                systemPrompt = m.data;
            } else if (m.command === 'systemPrompt') {
                promptInput.value = m.data || '';
                systemPrompt = m.data || '';
            }
        };
        
        vscode.postMessage({ command: 'getSessions' });
        vscode.postMessage({ command: 'getModels' });
        vscode.postMessage({ command: 'getSystemPrompt' });
        
        promptInput.oninput = function() {
            systemPrompt = promptInput.value.trim();
            vscode.postMessage({ command: 'saveSystemPrompt', prompt: systemPrompt });
        };
    </script>
</body>
</html>`;
    }
}

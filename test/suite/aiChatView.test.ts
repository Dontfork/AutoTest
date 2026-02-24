import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';

function getChatTemplateSource(): string {
    const viewPath = path.join(__dirname, '../../../src/views/chatTemplate.ts');
    return fs.readFileSync(viewPath, 'utf-8');
}

function getMessageHandlerSource(): string {
    const viewPath = path.join(__dirname, '../../../src/views/messageHandler.ts');
    return fs.readFileSync(viewPath, 'utf-8');
}

function getAIChatViewSource(): string {
    const viewPath = path.join(__dirname, '../../../src/views/aiChatView.ts');
    return fs.readFileSync(viewPath, 'utf-8');
}

describe('AIChatView WebView Template - WebView模板测试', () => {
    it('模板应包含基本HTML结构', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('<!DOCTYPE html>'));
        assert.ok(source.includes('<html'));
        assert.ok(source.includes('</html>'));
    });

    it('模板应包含CSP配置', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('Content-Security-Policy'));
        assert.ok(source.includes("script-src 'unsafe-inline'"));
    });

    it('模板应包含发送按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="sendBtn"'));
    });

    it('模板应包含输入框', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="input"'));
    });

    it('模板应包含新对话按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="newBtn"'));
    });

    it('模板应包含历史按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="historyBtn"'));
    });

    it('模板应包含历史面板', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="historyPanel"'));
        assert.ok(source.includes('history-panel'));
    });

    it('模板应包含acquireVsCodeApi调用', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('acquireVsCodeApi()'));
    });

    it('模板应包含消息发送逻辑', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('sendMessage'));
        assert.ok(source.includes('vscode.postMessage'));
    });

    it('模板应包含流式响应处理', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('streamChunk'));
        assert.ok(source.includes('streamComplete'));
        assert.ok(source.includes('streamError'));
    });

    it('send函数应存在', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function send()'));
    });

    it('应处理Enter键发送', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('onkeydown'));
        assert.ok(source.includes('Enter'));
        assert.ok(source.includes('preventDefault'));
    });

    it('模板应包含HTML转义函数', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function escapeHtml'));
    });

    it('streamChunk应直接使用innerHTML显示渲染后的内容', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'streamChunk')"));
        assert.ok(source.includes('bubble.innerHTML = m.data'));
    });

    it('streamComplete应使用innerHTML显示渲染后的内容', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'streamComplete')"));
    });

    it('应处理sessions消息', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'sessions')"));
    });

    it('应处理currentSession消息', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'currentSession')"));
    });

    it('应包含renderMessages函数', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function renderMessages'));
    });

    it('应包含renderHistory函数', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function renderHistory'));
    });

    it('历史按钮应有点击事件', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('historyBtn.onclick'));
    });

    it('应支持切换会话', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('switchSession'));
    });

    it('应支持删除会话', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('deleteSession'));
    });

    it('模板应包含模型选择下拉框', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="modelSelectBtn"'));
        assert.ok(source.includes('model-select'));
    });

    it('应处理models消息', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'models')"));
    });

    it('应处理currentModel消息', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'currentModel')"));
    });

    it('应包含renderModels函数', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function renderModels'));
    });

    it('模型选择按钮应有click事件', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("modelSelectBtn.addEventListener('click'"));
    });

    it('应支持切换模型', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('switchModel'));
    });
});

describe('AIChatView Markdown Rendering - Markdown渲染测试', () => {
    it('应导入marked库', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes("import { marked } from 'marked'"));
    });

    it('handleSendMessage应使用marked渲染Markdown', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes('await marked('));
    });

    it('streamChunk应发送渲染后的HTML实现动态渲染', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("m.command === 'streamChunk'"));
    });

    it('streamComplete应发送渲染后的HTML', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("m.command === 'streamComplete'"));
    });

    it('回调函数应为async以支持动态渲染', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes('async (chunk)'));
    });
});

describe('AIChatView Session Management - 会话管理测试', () => {
    it('应处理newSession命令', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("case 'newSession'"));
    });

    it('应处理switchSession命令', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("case 'switchSession'"));
    });

    it('应处理deleteSession命令', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("case 'deleteSession'"));
    });

    it('应处理getSessions命令', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("case 'getSessions'"));
    });

    it('应有sendSessions方法', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes('private sendSessions'));
    });

    it('应有sendCurrentSession方法', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes('sendCurrentSession'));
    });

    it('新建会话应检查是否存在空会话', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes('emptySession'));
    });

    it('新建会话逻辑应在存在空会话时切换到空会话', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("if (emptySession)"));
    });
});

describe('AIChatView System Prompt - 系统提示词测试', () => {
    it('模板应包含prompt区域', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="promptArea"'));
        assert.ok(source.includes('prompt-area'));
    });

    it('模板应包含prompt输入框', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="promptInput"'));
    });

    it('模板应包含导入prompt按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="importPromptBtn"'));
    });

    it('模板应包含清空prompt按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="clearPromptBtn"'));
    });

    it('模板应包含折叠prompt按钮', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('id="togglePromptBtn"'));
    });

    it('应处理importPrompt命令', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes("case 'importPrompt'"));
    });

    it('应有handleImportPrompt方法', () => {
        const source = getMessageHandlerSource();
        assert.ok(source.includes('handleImportPrompt'));
    });

    it('应处理promptContent消息', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes("if (m.command === 'promptContent')"));
    });

    it('发送消息时应包含systemPrompt', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('systemPrompt: systemPrompt'));
    });
});

describe('AIChatView Markdown Rendering - Markdown渲染增强测试', () => {
    it('sendCurrentSession应为async方法', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes('async sendCurrentSession'));
    });

    it('sendCurrentSession应渲染assistant消息', () => {
        const source = getAIChatViewSource();
        assert.ok(source.includes('renderedContent'));
        assert.ok(source.includes('await marked'));
    });

    it('应有addCopyButtons函数', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('function addCopyButtons'));
    });

    it('代码块应有复制按钮样式', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('.copy-btn'));
        assert.ok(source.includes('.code-header'));
    });

    it('复制按钮应使用clipboard API', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('navigator.clipboard.writeText'));
    });

    it('renderMessages应使用renderedContent', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('m.renderedContent'));
    });

    it('代码块背景色应不同于页面背景', () => {
        const source = getChatTemplateSource();
        assert.ok(source.includes('.bubble pre'));
        assert.ok(source.includes('background:'));
    });
});

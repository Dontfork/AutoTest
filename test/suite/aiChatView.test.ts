import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { describe, it } from 'mocha';

function getTemplate(): string {
    const viewPath = path.join(__dirname, '../../src/views/aiChatView.ts');
    const content = fs.readFileSync(viewPath, 'utf-8');
    const match = content.match(/getHtmlContent\(\)[\s\S]*?return\s*`([\s\S]*?)`;/);
    return match ? match[1] : '';
}

describe('AIChatView WebView Template - WebView模板测试', () => {
    it('模板应包含基本HTML结构', () => {
        const template = getTemplate();
        assert.ok(template.includes('<!DOCTYPE html>'));
        assert.ok(template.includes('<html'));
        assert.ok(template.includes('</html>'));
    });

    it('模板应包含CSP配置', () => {
        const template = getTemplate();
        assert.ok(template.includes('Content-Security-Policy'));
        assert.ok(template.includes("script-src 'unsafe-inline'"));
    });

    it('模板应包含发送按钮', () => {
        const template = getTemplate();
        assert.ok(template.includes('id="sendBtn"'));
    });

    it('模板应包含输入框', () => {
        const template = getTemplate();
        assert.ok(template.includes('id="input"'));
    });

    it('模板应包含新对话按钮', () => {
        const template = getTemplate();
        assert.ok(template.includes('id="newBtn"'));
    });

    it('模板应包含acquireVsCodeApi调用', () => {
        const template = getTemplate();
        assert.ok(template.includes('acquireVsCodeApi()'));
    });

    it('模板应包含消息发送逻辑', () => {
        const template = getTemplate();
        assert.ok(template.includes('sendMessage'));
        assert.ok(template.includes('vscode.postMessage'));
    });

    it('模板应包含流式响应处理', () => {
        const template = getTemplate();
        assert.ok(template.includes('streamChunk'));
        assert.ok(template.includes('streamComplete'));
        assert.ok(template.includes('streamError'));
    });

    it('send函数应存在', () => {
        const template = getTemplate();
        assert.ok(template.includes('function send()'));
    });

    it('应处理Enter键发送', () => {
        const template = getTemplate();
        assert.ok(template.includes('onkeydown'));
        assert.ok(template.includes('Enter'));
        assert.ok(template.includes('preventDefault'));
    });
});

import * as assert from 'assert';
import { describe, it } from 'mocha';
import { renderMarkdown } from '../../src/utils/markdown';

describe('Markdown Renderer Module - Markdown渲染模块测试', () => {
    describe('Basic Text - 基本文本', () => {
        it('普通文本应该被包装在p标签中', () => {
            const result = renderMarkdown('Hello World');
            assert.strictEqual(result, '<p>Hello World</p>');
        });

        it('空文本应该返回空p标签', () => {
            const result = renderMarkdown('');
            assert.strictEqual(result, '<p></p>');
        });

        it('HTML特殊字符应该被转义', () => {
            const result = renderMarkdown('<script>alert("xss")</script>');
            assert.ok(result.includes('&lt;script&gt;'));
            assert.ok(!result.includes('<script>'));
        });

        it('换行符应该正确处理', () => {
            const result = renderMarkdown('Line1\n\nLine2');
            assert.strictEqual(result, '<p>Line1</p><p>Line2</p>');
        });
    });

    describe('Headers - 标题', () => {
        it('一级标题', () => {
            const result = renderMarkdown('# Title');
            assert.strictEqual(result, '<h1>Title</h1>');
        });

        it('二级标题', () => {
            const result = renderMarkdown('## Title');
            assert.strictEqual(result, '<h2>Title</h2>');
        });

        it('三级标题', () => {
            const result = renderMarkdown('### Title');
            assert.strictEqual(result, '<h3>Title</h3>');
        });
    });

    describe('Emphasis - 强调', () => {
        it('加粗文本', () => {
            const result = renderMarkdown('**bold text**');
            assert.strictEqual(result, '<p><strong>bold text</strong></p>');
        });

        it('斜体文本', () => {
            const result = renderMarkdown('*italic text*');
            assert.strictEqual(result, '<p><em>italic text</em></p>');
        });

        it('混合加粗和斜体', () => {
            const result = renderMarkdown('**bold** and *italic*');
            assert.ok(result.includes('<strong>bold</strong>'));
            assert.ok(result.includes('<em>italic</em>'));
        });
    });

    describe('Code - 代码', () => {
        it('行内代码', () => {
            const result = renderMarkdown('Use `code` here');
            assert.strictEqual(result, '<p>Use <code>code</code> here</p>');
        });

        it('代码块', () => {
            const result = renderMarkdown('```\ncode here\n```');
            assert.ok(result.includes('<pre>'));
            assert.ok(result.includes('<code class="language-">'));
            assert.ok(result.includes('code here'));
        });

        it('带语言的代码块', () => {
            const result = renderMarkdown('```javascript\nconsole.log("hello");\n```');
            assert.ok(result.includes('language-javascript'));
            assert.ok(result.includes('console.log'));
        });
    });

    describe('Links - 链接', () => {
        it('链接', () => {
            const result = renderMarkdown('[Google](https://google.com)');
            assert.strictEqual(result, '<p><a href="https://google.com">Google</a></p>');
        });

        it('多个链接', () => {
            const result = renderMarkdown('[Link1](url1) and [Link2](url2)');
            assert.ok(result.includes('<a href="url1">Link1</a>'));
            assert.ok(result.includes('<a href="url2">Link2</a>'));
        });
    });

    describe('Lists - 列表', () => {
        it('无序列表', () => {
            const result = renderMarkdown('- Item 1\n- Item 2');
            assert.ok(result.includes('<ul>'));
            assert.ok(result.includes('<li>Item 1</li>'));
            assert.ok(result.includes('<li>Item 2</li>'));
        });

        it('星号列表', () => {
            const result = renderMarkdown('* Item A\n* Item B');
            assert.ok(result.includes('<ul>'));
            assert.ok(result.includes('<li>Item A</li>'));
        });
    });

    describe('Blockquote - 引用', () => {
        it('引用块', () => {
            const result = renderMarkdown('> This is a quote');
            assert.strictEqual(result, '<blockquote>This is a quote</blockquote>');
        });
    });

    describe('Horizontal Rule - 分割线', () => {
        it('分割线', () => {
            const result = renderMarkdown('---');
            assert.strictEqual(result, '<hr>');
        });
    });

    describe('Complex Cases - 复杂场景', () => {
        it('混合Markdown', () => {
            const result = renderMarkdown('# Title\n\n**bold** and *italic*\n\n- item');
            assert.ok(result.includes('<h1>Title</h1>'));
            assert.ok(result.includes('<strong>bold</strong>'));
            assert.ok(result.includes('<em>italic</em>'));
            assert.ok(result.includes('<li>item</li>'));
        });

        it('中文文本', () => {
            const result = renderMarkdown('你好，世界！');
            assert.strictEqual(result, '<p>你好，世界！</p>');
        });

        it('带换行的段落', () => {
            const result = renderMarkdown('第一段\n\n第二段\n\n第三段');
            assert.ok(result.includes('<p>第一段</p>'));
            assert.ok(result.includes('<p>第二段</p>'));
            assert.ok(result.includes('<p>第三段</p>'));
        });
    });
});

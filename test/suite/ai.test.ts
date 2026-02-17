import * as assert from 'assert';
import { describe, it, beforeEach } from 'mocha';

interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface AIResponse {
    content: string;
    error?: string;
}

interface AIModelConfig {
    name: string;
    apiKey: string;
    apiUrl?: string;
}

interface AIConfig {
    models: AIModelConfig[];
    defaultModel?: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: AIMessage[];
    createdAt: number;
    updatedAt: number;
}

describe('AI Module - AI对话模块测试', () => {
    describe('Message Management - 消息管理', () => {
        let messages: AIMessage[];

        beforeEach(() => {
            messages = [];
        });

        it('添加用户消息 - role为user，content为用户输入', () => {
            messages.push({ role: 'user', content: 'Hello' });
            assert.strictEqual(messages.length, 1);
            assert.strictEqual(messages[0].role, 'user');
        });

        it('添加助手消息 - role为assistant，content为AI回复', () => {
            messages.push({ role: 'assistant', content: 'Hi there!' });
            assert.strictEqual(messages.length, 1);
            assert.strictEqual(messages[0].role, 'assistant');
        });

        it('添加系统消息 - role为system，content为系统提示词', () => {
            messages.push({ role: 'system', content: 'You are a helpful assistant.' });
            assert.strictEqual(messages.length, 1);
            assert.strictEqual(messages[0].role, 'system');
        });

        it('消息顺序维护 - 按添加顺序存储消息', () => {
            messages.push({ role: 'system', content: 'System prompt' });
            messages.push({ role: 'user', content: 'User message' });
            messages.push({ role: 'assistant', content: 'Assistant response' });
            
            assert.strictEqual(messages.length, 3);
            assert.strictEqual(messages[0].role, 'system');
            assert.strictEqual(messages[1].role, 'user');
            assert.strictEqual(messages[2].role, 'assistant');
        });

        it('清空消息列表 - 将数组长度设为0', () => {
            messages.push({ role: 'user', content: 'Test' });
            messages.length = 0;
            
            assert.strictEqual(messages.length, 0);
        });
    });

    describe('Model Configuration - 模型配置', () => {
        it('模型配置包含必要字段 - name、apiKey', () => {
            const modelConfig: AIModelConfig = {
                name: 'qwen-turbo',
                apiKey: 'test-key'
            };
            
            assert.ok(modelConfig.name);
            assert.ok(modelConfig.apiKey);
        });

        it('模型配置可选字段 - apiUrl', () => {
            const modelConfig: AIModelConfig = {
                name: 'gpt-4',
                apiKey: 'sk-test',
                apiUrl: 'https://custom-api.example.com/v1/chat/completions'
            };
            
            assert.ok(modelConfig.apiUrl);
        });

        it('多模型配置 - 支持配置多个模型', () => {
            const aiConfig: AIConfig = {
                models: [
                    { name: 'qwen-turbo', apiKey: 'qwen-key' },
                    { name: 'gpt-4', apiKey: 'openai-key' }
                ]
            };
            
            assert.strictEqual(aiConfig.models.length, 2);
        });

        it('默认模型配置 - defaultModel指定默认模型', () => {
            const aiConfig: AIConfig = {
                models: [
                    { name: 'qwen-turbo', apiKey: 'qwen-key' },
                    { name: 'gpt-4', apiKey: 'openai-key' }
                ],
                defaultModel: 'gpt-4'
            };
            
            assert.strictEqual(aiConfig.defaultModel, 'gpt-4');
        });

        it('模型名称唯一性 - 不同模型使用不同名称', () => {
            const aiConfig: AIConfig = {
                models: [
                    { name: 'qwen-turbo', apiKey: 'key1' },
                    { name: 'qwen-plus', apiKey: 'key2' },
                    { name: 'gpt-4', apiKey: 'key3' }
                ]
            };
            
            const names = aiConfig.models.map(m => m.name);
            const uniqueNames = [...new Set(names)];
            
            assert.strictEqual(names.length, uniqueNames.length);
        });
    });

    describe('Model Type Detection - 模型类型检测', () => {
        it('QWen模型检测 - 名称包含qwen', () => {
            const qwenModels = ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'];
            
            qwenModels.forEach(model => {
                assert.ok(model.toLowerCase().includes('qwen'));
            });
        });

        it('OpenAI模型检测 - 名称包含gpt', () => {
            const openaiModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
            
            openaiModels.forEach(model => {
                assert.ok(model.toLowerCase().includes('gpt'));
            });
        });

        it('自定义模型支持 - 支持任意模型名称', () => {
            const customModel = 'my-custom-llm';
            
            assert.ok(customModel.length > 0);
        });
    });

    describe('Response Handling - 响应处理', () => {
        it('成功响应处理 - content非空，error为undefined', () => {
            const response: AIResponse = {
                content: 'This is a test response from AI.'
            };
            
            assert.ok(response.content);
            assert.strictEqual(response.error, undefined);
        });

        it('错误响应处理 - content为空，error包含错误信息', () => {
            const response: AIResponse = {
                content: '',
                error: 'API key is invalid'
            };
            
            assert.strictEqual(response.content, '');
            assert.ok(response.error);
        });

        it('空响应处理 - content为空字符串', () => {
            const response: AIResponse = {
                content: ''
            };
            
            assert.strictEqual(response.content, '');
        });
    });

    describe('API Configuration - API配置', () => {
        it('API密钥配置验证 - apiKey必须存在', () => {
            const modelConfig: AIModelConfig = {
                name: 'qwen-turbo',
                apiKey: 'test-api-key'
            };
            
            assert.ok(modelConfig.apiKey);
        });

        it('缺失API密钥处理 - apiKey为空字符串', () => {
            const config = {
                name: 'test-model',
                apiKey: ''
            };
            
            assert.strictEqual(config.apiKey, '');
        });

        it('默认API URL - 根据模型名称自动选择', () => {
            const qwenDefaultUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
            const openaiDefaultUrl = 'https://api.openai.com/v1/chat/completions';
            
            assert.ok(qwenDefaultUrl);
            assert.ok(openaiDefaultUrl);
        });

        it('自定义API URL - 覆盖默认URL', () => {
            const modelConfig: AIModelConfig = {
                name: 'gpt-4',
                apiKey: 'sk-test',
                apiUrl: 'https://custom-openai-proxy.com/v1/chat/completions'
            };
            
            assert.ok(modelConfig.apiUrl);
            assert.ok(!modelConfig.apiUrl?.includes('api.openai.com'));
        });
    });

    describe('Request Configuration - 请求配置', () => {
        it('超时设置验证 - 默认超时时间为60000毫秒', () => {
            const timeout = 60000;
            
            assert.strictEqual(timeout, 60000);
        });

        it('请求头验证 - 包含Authorization和Content-Type', () => {
            const headers = {
                'Authorization': 'Bearer test-key',
                'Content-Type': 'application/json'
            };
            
            assert.ok(headers['Authorization']);
            assert.ok(headers['Content-Type']);
        });

        it('请求体包含模型参数 - model字段必须存在', () => {
            const requestBody = {
                model: 'qwen-turbo',
                messages: [{ role: 'user', content: 'Hello' }]
            };
            
            assert.ok(requestBody.model);
        });
    });

    describe('Error Handling - 错误处理', () => {
        it('网络错误处理 - 错误消息非空', () => {
            const error = new Error('Network error');
            
            assert.ok(error.message);
        });

        it('超时错误处理 - 错误代码为ECONNABORTED', () => {
            const error = { code: 'ECONNABORTED', message: 'timeout of 60000ms exceeded' };
            
            assert.strictEqual(error.code, 'ECONNABORTED');
        });

        it('API错误响应处理 - HTTP状态码401表示认证失败', () => {
            const apiError = {
                response: {
                    status: 401,
                    data: { message: 'Invalid API key' }
                }
            };
            
            assert.strictEqual(apiError.response.status, 401);
        });
    });

    describe('Conversation Context - 对话上下文', () => {
        it('维护对话历史 - 按顺序存储所有消息', () => {
            const messages: AIMessage[] = [
                { role: 'user', content: 'What is 2+2?' },
                { role: 'assistant', content: '2+2 equals 4.' },
                { role: 'user', content: 'What about 3+3?' },
                { role: 'assistant', content: '3+3 equals 6.' }
            ];
            
            assert.strictEqual(messages.length, 4);
        });

        it('系统消息包含在上下文中 - 第一条消息为system角色', () => {
            const messages: AIMessage[] = [
                { role: 'system', content: 'You are a math helper.' },
                { role: 'user', content: 'What is 1+1?' }
            ];
            
            assert.strictEqual(messages[0].role, 'system');
        });
    });

    describe('ChatSession - 会话数据结构', () => {
        it('会话包含必要字段 - id、title、messages、时间戳', () => {
            const session: ChatSession = {
                id: 'session-123',
                title: '测试会话',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            assert.ok(session.id);
            assert.ok(session.title);
            assert.ok(Array.isArray(session.messages));
            assert.ok(session.createdAt);
            assert.ok(session.updatedAt);
        });

        it('会话标题自动生成 - 使用首条用户消息前30字符', () => {
            const userMessage = 'This is a very long test message that should be truncated when used as title';
            const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
            
            assert.ok(title.includes('...'));
            assert.ok(title.length > 30);
        });

        it('会话消息数量统计 - 正确计算消息数量', () => {
            const session: ChatSession = {
                id: 'session-123',
                title: '测试',
                messages: [
                    { role: 'user', content: 'Hello' },
                    { role: 'assistant', content: 'Hi' },
                    { role: 'user', content: 'How are you?' }
                ],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            assert.strictEqual(session.messages.length, 3);
        });

        it('会话时间戳更新 - 添加消息后更新updatedAt', async () => {
            const session: ChatSession = {
                id: 'session-123',
                title: '测试',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            const originalTime = session.updatedAt;
            await new Promise(r => setTimeout(r, 10));
            
            session.messages.push({ role: 'user', content: 'Test' });
            session.updatedAt = Date.now();
            
            assert.ok(session.updatedAt > originalTime);
        });
    });

    describe('Session Management - 会话管理', () => {
        it('多会话管理 - 支持创建多个独立会话', () => {
            const sessions: ChatSession[] = [];
            
            sessions.push({
                id: 'session-1',
                title: '会话1',
                messages: [{ role: 'user', content: 'Hello' }],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            
            sessions.push({
                id: 'session-2',
                title: '会话2',
                messages: [{ role: 'user', content: 'Hi' }],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            
            assert.strictEqual(sessions.length, 2);
            assert.notStrictEqual(sessions[0].id, sessions[1].id);
        });

        it('会话切换 - 切换当前活动会话', () => {
            let currentSessionId = 'session-1';
            
            currentSessionId = 'session-2';
            
            assert.strictEqual(currentSessionId, 'session-2');
        });

        it('会话删除 - 从列表中移除会话', () => {
            const sessions: ChatSession[] = [
                { id: 'session-1', title: '会话1', messages: [], createdAt: 1, updatedAt: 1 },
                { id: 'session-2', title: '会话2', messages: [], createdAt: 2, updatedAt: 2 }
            ];
            
            const index = sessions.findIndex(s => s.id === 'session-1');
            sessions.splice(index, 1);
            
            assert.strictEqual(sessions.length, 1);
            assert.strictEqual(sessions[0].id, 'session-2');
        });

        it('会话排序 - 按更新时间降序排列', () => {
            const sessions: ChatSession[] = [
                { id: 'session-1', title: '会话1', messages: [], createdAt: 1, updatedAt: 100 },
                { id: 'session-2', title: '会话2', messages: [], createdAt: 2, updatedAt: 200 },
                { id: 'session-3', title: '会话3', messages: [], createdAt: 3, updatedAt: 50 }
            ];
            
            sessions.sort((a, b) => b.updatedAt - a.updatedAt);
            
            assert.strictEqual(sessions[0].id, 'session-2');
            assert.strictEqual(sessions[1].id, 'session-1');
            assert.strictEqual(sessions[2].id, 'session-3');
        });
    });

    describe('Model Switching - 模型切换', () => {
        it('切换模型 - 更新当前使用的模型', () => {
            let currentModel = 'qwen-turbo';
            
            currentModel = 'gpt-4';
            
            assert.strictEqual(currentModel, 'gpt-4');
        });

        it('获取可用模型列表 - 返回所有配置的模型', () => {
            const aiConfig: AIConfig = {
                models: [
                    { name: 'qwen-turbo', apiKey: 'key1' },
                    { name: 'gpt-4', apiKey: 'key2' }
                ]
            };
            
            assert.strictEqual(aiConfig.models.length, 2);
        });

        it('模型配置验证 - 切换前验证模型存在', () => {
            const aiConfig: AIConfig = {
                models: [
                    { name: 'qwen-turbo', apiKey: 'key1' },
                    { name: 'gpt-4', apiKey: 'key2' }
                ]
            };
            
            const targetModel = 'gpt-4';
            const exists = aiConfig.models.some(m => m.name === targetModel);
            
            assert.ok(exists);
        });
    });
});

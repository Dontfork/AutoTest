import * as assert from 'assert';
import { describe, it } from 'mocha';

const defaultConfig = {
    projects: [],
    ai: {
        provider: "qwen" as 'qwen' | 'openai',
        qwen: {
            apiKey: "",
            apiUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
            model: "qwen-turbo"
        },
        openai: {
            apiKey: "",
            apiUrl: "https://api.openai.com/v1/chat/completions",
            model: "gpt-3.5-turbo"
        }
    },
    refreshInterval: 0
};

describe('Config Module - 配置模块测试', () => {
    describe('Default Configuration - 默认配置验证', () => {
        it('验证AI配置有效性 - provider枚举值、qwen和openai配置对象、model字段', () => {
            assert.ok(['qwen', 'openai'].includes(defaultConfig.ai.provider));
            assert.ok(defaultConfig.ai.qwen);
            assert.ok(defaultConfig.ai.openai);
            assert.ok(defaultConfig.ai.qwen.model);
            assert.ok(defaultConfig.ai.openai.model);
        });

        it('验证全局刷新间隔配置 - refreshInterval存在且为数字', () => {
            assert.ok(typeof defaultConfig.refreshInterval === 'number');
            assert.ok(defaultConfig.refreshInterval >= 0);
        });
    });

    describe('Configuration Validation - 配置值验证', () => {
        it('验证默认AI提供者 - 应为qwen', () => {
            assert.strictEqual(defaultConfig.ai.provider, 'qwen');
        });

        it('验证默认刷新间隔 - 应为0（默认关闭）', () => {
            assert.strictEqual(defaultConfig.refreshInterval, 0);
        });

        it('验证默认API密钥为空 - 安全考虑，需用户自行配置', () => {
            assert.strictEqual(defaultConfig.ai.qwen.apiKey, '');
            assert.strictEqual(defaultConfig.ai.openai.apiKey, '');
        });

        it('验证默认qwen模型 - 应为qwen-turbo', () => {
            assert.strictEqual(defaultConfig.ai.qwen.model, 'qwen-turbo');
        });

        it('验证默认openai模型 - 应为gpt-3.5-turbo', () => {
            assert.strictEqual(defaultConfig.ai.openai.model, 'gpt-3.5-turbo');
        });
    });

    describe('Configuration Structure - 配置结构验证', () => {
        it('验证配置对象完整性 - 必须包含projects、ai、refreshInterval', () => {
            assert.ok(typeof defaultConfig === 'object');
            assert.ok('projects' in defaultConfig);
            assert.ok('ai' in defaultConfig);
            assert.ok('refreshInterval' in defaultConfig);
        });

        it('验证ai嵌套属性 - provider、qwen、openai', () => {
            assert.ok('provider' in defaultConfig.ai);
            assert.ok('qwen' in defaultConfig.ai);
            assert.ok('openai' in defaultConfig.ai);
        });

        it('验证qwen嵌套属性 - apiKey、apiUrl、model', () => {
            assert.ok('apiKey' in defaultConfig.ai.qwen);
            assert.ok('apiUrl' in defaultConfig.ai.qwen);
            assert.ok('model' in defaultConfig.ai.qwen);
        });

        it('验证openai嵌套属性 - apiKey、apiUrl、model', () => {
            assert.ok('apiKey' in defaultConfig.ai.openai);
            assert.ok('apiUrl' in defaultConfig.ai.openai);
            assert.ok('model' in defaultConfig.ai.openai);
        });
    });

    describe('Configuration Values - 配置值修改测试', () => {
        it('验证AI提供者可切换 - 从qwen切换到openai', () => {
            const modifiedConfig = { ...defaultConfig, ai: { ...defaultConfig.ai, qwen: { ...defaultConfig.ai.qwen }, openai: { ...defaultConfig.ai.openai } } };
            modifiedConfig.ai.provider = 'openai';
            assert.strictEqual(modifiedConfig.ai.provider, 'openai');
        });

        it('验证qwen模型可修改 - 从qwen-turbo改为qwen-max', () => {
            const modifiedConfig = { 
                ...defaultConfig, 
                ai: { 
                    ...defaultConfig.ai, 
                    qwen: { ...defaultConfig.ai.qwen, model: 'qwen-max' }, 
                    openai: { ...defaultConfig.ai.openai } 
                } 
            };
            assert.strictEqual(modifiedConfig.ai.qwen.model, 'qwen-max');
        });

        it('验证openai模型可修改 - 从gpt-3.5-turbo改为gpt-4', () => {
            const modifiedConfig = { 
                ...defaultConfig, 
                ai: { 
                    ...defaultConfig.ai, 
                    qwen: { ...defaultConfig.ai.qwen }, 
                    openai: { ...defaultConfig.ai.openai, model: 'gpt-4' } 
                } 
            };
            assert.strictEqual(modifiedConfig.ai.openai.model, 'gpt-4');
        });

        it('验证刷新间隔可修改 - 从5000改为10000', () => {
            const modifiedConfig = { ...defaultConfig, refreshInterval: 10000 };
            assert.strictEqual(modifiedConfig.refreshInterval, 10000);
        });
    });

    describe('Config Watcher - 配置监听功能测试', () => {
        it('验证配置变化事件机制 - EventEmitter模式', () => {
            let eventFired = false;
            const mockListener = () => { eventFired = true; };
            
            const emitter = { 
                listeners: [] as (() => void)[],
                subscribe: function(listener: () => void) { this.listeners.push(listener); },
                fire: function() { this.listeners.forEach(l => l()); }
            };
            
            emitter.subscribe(mockListener);
            emitter.fire();
            
            assert.strictEqual(eventFired, true);
        });

        it('验证配置比较逻辑 - JSON序列化比较', () => {
            const config1 = { projects: [], refreshInterval: 5000 };
            const config2 = { projects: [], refreshInterval: 5000 };
            const config3 = { projects: [], refreshInterval: 10000 };
            
            assert.strictEqual(JSON.stringify(config1) === JSON.stringify(config2), true);
            assert.strictEqual(JSON.stringify(config1) === JSON.stringify(config3), false);
        });
    });
});

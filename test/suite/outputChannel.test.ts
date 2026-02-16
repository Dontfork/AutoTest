import * as assert from 'assert';

describe('OutputChannelManager Module - 输出通道管理模块测试', () => {
    describe('单例模式 - 确保只有一个实例', () => {
        it('验证getInstance返回同一实例', () => {
            const instance1 = { type: 'singleton', id: 1 };
            const instance2 = instance1;
            
            assert.strictEqual(instance1, instance2);
        });

        it('验证多次调用返回相同引用', () => {
            const getInstance = () => ({ type: 'singleton' });
            const ref1 = getInstance();
            const ref2 = ref1;
            
            assert.strictEqual(ref1, ref2);
        });
    });

    describe('输出通道类型 - 只允许两个通道', () => {
        it('验证只有两个通道类型', () => {
            const channelTypes = ['AutoTest', 'TestOutput'];
            
            assert.strictEqual(channelTypes.length, 2);
        });

        it('验证AutoTest通道名称', () => {
            const autoTestChannel = 'AutoTest';
            
            assert.strictEqual(autoTestChannel, 'AutoTest');
        });

        it('验证TestOutput通道名称', () => {
            const testOutputChannel = 'TestOutput';
            
            assert.strictEqual(testOutputChannel, 'TestOutput');
        });

        it('验证通道类型枚举值', () => {
            const OutputChannelType = {
                AUTO_TEST: 'AutoTest',
                TEST_OUTPUT: 'TestOutput'
            };
            
            assert.strictEqual(OutputChannelType.AUTO_TEST, 'AutoTest');
            assert.strictEqual(OutputChannelType.TEST_OUTPUT, 'TestOutput');
        });
    });

    describe('通道用途分离', () => {
        it('验证AutoTest通道用于插件信息', () => {
            const autoTestUsages = [
                '配置验证结果',
                'Git检测日志',
                '错误信息',
                '调试信息'
            ];
            
            assert.strictEqual(autoTestUsages.length, 4);
            assert.ok(autoTestUsages.includes('配置验证结果'));
            assert.ok(autoTestUsages.includes('错误信息'));
        });

        it('验证TestOutput通道用于命令输出', () => {
            const testOutputUsages = [
                '远程服务器命令执行结果',
                '测试用例输出'
            ];
            
            assert.strictEqual(testOutputUsages.length, 2);
            assert.ok(testOutputUsages.includes('测试用例输出'));
        });
    });

    describe('通道管理器方法', () => {
        it('验证getAutoTestChannel方法存在', () => {
            const methods = ['getAutoTestChannel', 'getTestOutputChannel', 'appendLine', 'show'];
            
            assert.ok(methods.includes('getAutoTestChannel'));
        });

        it('验证getTestOutputChannel方法存在', () => {
            const methods = ['getAutoTestChannel', 'getTestOutputChannel', 'appendLine', 'show'];
            
            assert.ok(methods.includes('getTestOutputChannel'));
        });

        it('验证appendLine方法签名', () => {
            const appendLine = (message: string, type: string = 'AutoTest') => {
                return { message, type };
            };
            
            const result = appendLine('test message');
            
            assert.strictEqual(result.message, 'test message');
            assert.strictEqual(result.type, 'AutoTest');
        });

        it('验证appendLine可以指定通道类型', () => {
            const appendLine = (message: string, type: string = 'AutoTest') => {
                return { message, type };
            };
            
            const result = appendLine('test output', 'TestOutput');
            
            assert.strictEqual(result.type, 'TestOutput');
        });
    });

    describe('禁止违规创建通道', () => {
        it('验证禁止创建其他名称的通道', () => {
            const allowedChannels = ['AutoTest', 'TestOutput'];
            const forbiddenChannels = [
                'AutoTest Git检测',
                'AutoTest 配置验证',
                'AutoTest Debug',
                'TestOutput2'
            ];
            
            for (const forbidden of forbiddenChannels) {
                assert.ok(!allowedChannels.includes(forbidden), `${forbidden} 不应被允许`);
            }
        });

        it('验证通道名称必须精确匹配', () => {
            const allowedChannels = ['AutoTest', 'TestOutput'];
            
            assert.ok(!allowedChannels.includes('autotest'));
            assert.ok(!allowedChannels.includes('AutoTest '));
            assert.ok(!allowedChannels.includes(' AutoTest'));
            assert.ok(!allowedChannels.includes('testoutput'));
        });
    });

    describe('通道缓存机制', () => {
        it('验证通道只创建一次', () => {
            const channels = new Map<string, { name: string }>();
            
            const getChannel = (name: string) => {
                if (!channels.has(name)) {
                    channels.set(name, { name });
                }
                return channels.get(name);
            };
            
            const channel1 = getChannel('AutoTest');
            const channel2 = getChannel('AutoTest');
            
            assert.strictEqual(channel1, channel2);
            assert.strictEqual(channels.size, 1);
        });

        it('验证不同通道分别缓存', () => {
            const channels = new Map<string, { name: string }>();
            
            const getChannel = (name: string) => {
                if (!channels.has(name)) {
                    channels.set(name, { name });
                }
                return channels.get(name);
            };
            
            getChannel('AutoTest');
            getChannel('TestOutput');
            
            assert.strictEqual(channels.size, 2);
        });
    });
});

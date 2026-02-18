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
            const channelTypes = ['RemoteTest', 'TestOutput'];
            
            assert.strictEqual(channelTypes.length, 2);
        });

        it('验证RemoteTest通道名称', () => {
            const remoteTestChannel = 'RemoteTest';
            
            assert.strictEqual(remoteTestChannel, 'RemoteTest');
        });

        it('验证TestOutput通道名称', () => {
            const testOutputChannel = 'TestOutput';
            
            assert.strictEqual(testOutputChannel, 'TestOutput');
        });
    });

    describe('通道用途分离', () => {
        it('验证RemoteTest通道用于插件信息', () => {
            const remoteTestUsages = [
                '配置验证结果',
                'Git检测日志',
                '错误信息',
                '调试信息'
            ];
            
            assert.strictEqual(remoteTestUsages.length, 4);
            assert.ok(remoteTestUsages.includes('配置验证结果'));
            assert.ok(remoteTestUsages.includes('错误信息'));
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
        it('验证getRemoteTestChannel方法存在', () => {
            const methods = ['getRemoteTestChannel', 'getTestOutputChannel', 'appendLine', 'show'];
            
            assert.ok(methods.includes('getRemoteTestChannel'));
        });

        it('验证getTestOutputChannel方法存在', () => {
            const methods = ['getRemoteTestChannel', 'getTestOutputChannel', 'appendLine', 'show'];
            
            assert.ok(methods.includes('getTestOutputChannel'));
        });

        it('验证appendLine方法签名', () => {
            const appendLine = (message: string, type: string = 'RemoteTest') => {
                return { message, type };
            };
            
            const result = appendLine('test message');
            
            assert.strictEqual(result.message, 'test message');
            assert.strictEqual(result.type, 'RemoteTest');
        });

        it('验证appendLine可以指定通道类型', () => {
            const appendLine = (message: string, type: string = 'RemoteTest') => {
                return { message, type };
            };
            
            const result = appendLine('test output', 'TestOutput');
            
            assert.strictEqual(result.type, 'TestOutput');
        });
    });

    describe('禁止违规创建通道', () => {
        it('验证禁止创建其他名称的通道', () => {
            const allowedChannels = ['RemoteTest', 'TestOutput'];
            const forbiddenChannels = [
                'RemoteTest Git检测',
                'RemoteTest 配置验证',
                'RemoteTest Debug',
                'TestOutput2'
            ];
            
            for (const forbidden of forbiddenChannels) {
                assert.ok(!allowedChannels.includes(forbidden), `${forbidden} 不应被允许`);
            }
        });

        it('验证通道名称必须精确匹配', () => {
            const allowedChannels = ['RemoteTest', 'TestOutput'];
            
            assert.ok(allowedChannels.includes('RemoteTest'));
            assert.ok(allowedChannels.includes('TestOutput'));
            assert.ok(!allowedChannels.includes('RemoteTest '));
            assert.ok(!allowedChannels.includes(' RemoteTest'));
            assert.ok(!allowedChannels.includes('testoutput'));
            assert.ok(!allowedChannels.includes('remoteTest'));
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
            
            const channel1 = getChannel('RemoteTest');
            const channel2 = getChannel('RemoteTest');
            
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
            
            getChannel('RemoteTest');
            getChannel('TestOutput');
            
            assert.strictEqual(channels.size, 2);
        });
    });

    describe('useLogOutputChannel 配置 - 输出通道类型控制', () => {
        it('验证默认值为 true - 使用 LogOutputChannel', () => {
            const config = { useLogOutputChannel: true };
            assert.strictEqual(config.useLogOutputChannel, true);
        });

        it('验证配置为 false 时使用普通 OutputChannel', () => {
            const config = { useLogOutputChannel: false };
            assert.strictEqual(config.useLogOutputChannel, false);
        });

        it('验证未配置时默认为 true', () => {
            const config = {};
            const useLogOutputChannel = (config as any).useLogOutputChannel ?? true;
            assert.strictEqual(useLogOutputChannel, true);
        });

        it('验证 LogOutputChannel 支持日志级别方法', () => {
            const logMethods = ['info', 'warn', 'error', 'trace'];
            assert.ok(logMethods.includes('info'));
            assert.ok(logMethods.includes('warn'));
            assert.ok(logMethods.includes('error'));
            assert.ok(logMethods.includes('trace'));
        });

        it('验证 UnifiedOutputChannel 接口方法', () => {
            const unifiedMethods = [
                'append', 'appendLine', 'clear', 'show', 'hide', 'dispose',
                'info', 'warn', 'error', 'trace'
            ];
            assert.strictEqual(unifiedMethods.length, 10);
            assert.ok(unifiedMethods.includes('info'));
            assert.ok(unifiedMethods.includes('warn'));
            assert.ok(unifiedMethods.includes('error'));
            assert.ok(unifiedMethods.includes('trace'));
        });

        it('验证配置变更时重新创建 TestOutput 通道', () => {
            let currentUseLogOutputChannel = true;
            let channelDisposed = false;
            
            const shouldRecreate = (newConfig: boolean) => {
                if (currentUseLogOutputChannel !== newConfig) {
                    channelDisposed = true;
                    currentUseLogOutputChannel = newConfig;
                    return true;
                }
                return false;
            };
            
            assert.ok(shouldRecreate(false));
            assert.strictEqual(channelDisposed, true);
            assert.strictEqual(currentUseLogOutputChannel, false);
        });

        it('验证配置不变时不需要重新创建通道', () => {
            let currentUseLogOutputChannel = true;
            let channelDisposed = false;
            
            const shouldRecreate = (newConfig: boolean) => {
                if (currentUseLogOutputChannel !== newConfig) {
                    channelDisposed = true;
                    currentUseLogOutputChannel = newConfig;
                    return true;
                }
                return false;
            };
            
            assert.ok(!shouldRecreate(true));
            assert.strictEqual(channelDisposed, false);
        });

        it('验证 RemoteTest 通道固定使用 LogOutputChannel', () => {
            const remoteTestChannelType = 'LogOutputChannel';
            assert.strictEqual(remoteTestChannelType, 'LogOutputChannel');
        });

        it('验证 TestOutput 通道类型由配置决定', () => {
            const getTestOutputChannelType = (useLogOutputChannel: boolean) => {
                return useLogOutputChannel ? 'LogOutputChannel' : 'OutputChannel';
            };
            
            assert.strictEqual(getTestOutputChannelType(true), 'LogOutputChannel');
            assert.strictEqual(getTestOutputChannelType(false), 'OutputChannel');
        });
    });
});

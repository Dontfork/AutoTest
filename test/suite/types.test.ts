import * as assert from 'assert';
import { describe, it } from 'mocha';
import * as path from 'path';
import {
    MockServerConfig,
    MockCommandConfig,
    MockAIConfig,
    MockProjectConfig,
    MockRemoteTestConfig,
    MockAIMessage,
    MockAIResponse,
    MockLogFile,
    MockLogsConfig,
    MockLogDirectoryConfig,
    createMockServerConfig,
    createMockProjectConfig,
    createMockAIConfig,
    createMockRemoteTestConfig,
    createMockAIMessage,
    createMockChatSession,
    createMockLogFile
} from '../helpers';

interface CommandVariables {
    filePath: string;
    fileName: string;
    fileDir: string;
    localPath: string;
    localDir: string;
    localFileName: string;
    remoteDir: string;
}

describe('Types Module - 类型定义模块测试', () => {
    describe('ServerConfig - 服务器配置接口', () => {
        it('验证ServerConfig接口包含所有必需属性 - SSH/SCP配置', () => {
            const config = createMockServerConfig({
                host: '192.168.1.100',
                username: 'root',
                remoteDirectory: '/tmp/RemoteTest'
            });
            
            assert.strictEqual(config.host, '192.168.1.100');
            assert.strictEqual(config.port, 22);
            assert.strictEqual(config.username, 'root');
            assert.strictEqual(config.remoteDirectory, '/tmp/RemoteTest');
        });

        it('验证SSH密码认证配置 - 使用password进行认证', () => {
            const config = createMockServerConfig({
                password: 'mypassword',
                privateKeyPath: ''
            });
            
            assert.strictEqual(config.password, 'mypassword');
            assert.strictEqual(config.privateKeyPath, '');
        });

        it('验证SSH密钥认证配置 - 使用privateKeyPath进行认证', () => {
            const config = createMockServerConfig({
                password: '',
                privateKeyPath: '/home/user/.ssh/id_rsa'
            });
            
            assert.strictEqual(config.privateKeyPath, '/home/user/.ssh/id_rsa');
            assert.strictEqual(config.password, '');
        });

        it('验证SSH端口配置 - 支持非标准SSH端口', () => {
            const config = createMockServerConfig({ port: 2222 });
            assert.strictEqual(config.port, 2222);
        });

        it('验证本地工程路径配置 - localProjectPath用于路径映射', () => {
            const config = createMockServerConfig({
                localProjectPath: 'D:\\Projects\\Test',
                remoteDirectory: '/home/user/test'
            });
            
            assert.strictEqual(config.localProjectPath, 'D:\\Projects\\Test');
        });

        it('验证ServerConfig不包含logDirectory和downloadPath - 已移至logs配置', () => {
            const config = createMockServerConfig();
            
            assert.strictEqual(Object.keys(config).includes('logDirectory'), false);
            assert.strictEqual(Object.keys(config).includes('downloadPath'), false);
        });
    });

    describe('路径映射逻辑 - 本地到远程路径转换', () => {
        it('验证相对路径计算 - 本地文件映射到远程对应路径', () => {
            const localProjectPath = 'D:\\Projects\\Test';
            const remoteDirectory = '/home/user/test';
            const localFilePath = 'D:\\Projects\\Test\\src\\utils\\helper.js';
            
            const relativePath = path.relative(localProjectPath, localFilePath);
            const posixRelativePath = relativePath.split(path.sep).join(path.posix.sep);
            const remotePath = path.posix.join(remoteDirectory, posixRelativePath);
            
            assert.strictEqual(remotePath, '/home/user/test/src/utils/helper.js');
        });

        it('验证深层目录路径映射 - 多层嵌套目录', () => {
            const localProjectPath = '/home/user/project';
            const remoteDirectory = '/opt/RemoteTest';
            const localFilePath = '/home/user/project/tests/unit/services/auth.test.js';
            
            const relativePath = path.relative(localProjectPath, localFilePath);
            const posixRelativePath = relativePath.split(path.sep).join(path.posix.sep);
            const remotePath = path.posix.join(remoteDirectory, posixRelativePath);
            
            assert.strictEqual(remotePath, '/opt/RemoteTest/tests/unit/services/auth.test.js');
        });

        it('验证根目录文件映射 - 文件在工程根目录', () => {
            const localProjectPath = '/home/user/project';
            const remoteDirectory = '/opt/RemoteTest';
            const localFilePath = '/home/user/project/package.json';
            
            const relativePath = path.relative(localProjectPath, localFilePath);
            const posixRelativePath = relativePath.split(path.sep).join(path.posix.sep);
            const remotePath = path.posix.join(remoteDirectory, posixRelativePath);
            
            assert.strictEqual(remotePath, '/opt/RemoteTest/package.json');
        });

        it('验证路径分隔符转换 - Windows路径转POSIX路径', () => {
            const windowsPath = 'src\\utils\\helper.js';
            const posixPath = windowsPath.split(path.sep).join(path.posix.sep);
            
            assert.strictEqual(posixPath, 'src/utils/helper.js');
        });
    });

    describe('CommandConfig - 命令配置接口', () => {
        it('验证includePatterns过滤模式 - 只保留匹配的输出行', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test',
                includePatterns: ['error', 'failed', 'FAILED'],
                excludePatterns: []
            };
            
            assert.strictEqual(config.includePatterns?.length, 3);
            assert.strictEqual(config.excludePatterns?.length, 0);
        });

        it('验证excludePatterns过滤模式 - 排除匹配的输出行', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test',
                includePatterns: [],
                excludePatterns: ['debug', 'trace']
            };
            
            assert.strictEqual(config.excludePatterns?.length, 2);
            assert.strictEqual(config.includePatterns?.length, 0);
        });

        it('验证远程命令配置 - 通过SSH执行的命令', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'cd /tmp/RemoteTest && npm test',
                includePatterns: ['error'],
                excludePatterns: []
            };
            
            assert.ok(config.executeCommand.includes('/tmp/RemoteTest'));
        });

        it('验证带变量的命令配置 - 支持文件路径变量替换', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'pytest {filePath} -v',
                includePatterns: ['PASSED', 'FAILED'],
                excludePatterns: []
            };
            
            assert.ok(config.executeCommand.includes('{filePath}'));
            assert.ok(config.includePatterns?.includes('PASSED'));
        });

        it('验证同时使用include和exclude过滤', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test',
                includePatterns: ['error', 'fail'],
                excludePatterns: ['traceback', 'File "']
            };
            
            assert.strictEqual(config.includePatterns?.length, 2);
            assert.strictEqual(config.excludePatterns?.length, 2);
        });

        it('验证clearOutputBeforeRun配置 - 执行前清空输出', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test',
                clearOutputBeforeRun: true
            };
            
            assert.strictEqual(config.clearOutputBeforeRun, true);
        });

        it('验证clearOutputBeforeRun默认值 - 未配置时为undefined', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test'
            };
            
            assert.strictEqual(config.clearOutputBeforeRun, undefined);
        });

        it('验证clearOutputBeforeRun为false - 保留历史输出', () => {
            const config: MockCommandConfig = {
                name: '测试命令',
                executeCommand: 'npm test',
                clearOutputBeforeRun: false
            };
            
            assert.strictEqual(config.clearOutputBeforeRun, false);
        });

        it('验证完整命令配置 - 包含所有可选字段', () => {
            const config: MockCommandConfig = {
                name: '运行测试',
                executeCommand: 'pytest {filePath} -v',
                includePatterns: ['ERROR', 'FAILED', 'PASSED'],
                excludePatterns: ['traceback'],
                runnable: true,
                clearOutputBeforeRun: true
            };
            
            assert.strictEqual(config.name, '运行测试');
            assert.strictEqual(config.runnable, true);
            assert.strictEqual(config.clearOutputBeforeRun, true);
            assert.strictEqual(config.includePatterns?.length, 3);
            assert.strictEqual(config.excludePatterns?.length, 1);
        });
    });

    describe('CommandVariables - 命令变量接口', () => {
        it('验证CommandVariables接口包含所有变量 - 文件路径相关变量', () => {
            const variables: CommandVariables = {
                filePath: '/tmp/RemoteTest/tests/test_example.py',
                fileName: 'test_example.py',
                fileDir: '/tmp/RemoteTest/tests',
                localPath: 'D:\\project\\tests\\test_example.py',
                localDir: 'D:\\project\\tests',
                localFileName: 'test_example.py',
                remoteDir: '/tmp/RemoteTest'
            };
            
            assert.strictEqual(variables.filePath, '/tmp/RemoteTest/tests/test_example.py');
            assert.strictEqual(variables.fileName, 'test_example.py');
            assert.strictEqual(variables.fileDir, '/tmp/RemoteTest/tests');
        });

        it('验证远程路径变量 - filePath为远程文件完整路径', () => {
            const variables: CommandVariables = {
                filePath: '/home/user/project/src/main.py',
                fileName: 'main.py',
                fileDir: '/home/user/project/src',
                localPath: 'C:\\dev\\project\\src\\main.py',
                localDir: 'C:\\dev\\project\\src',
                localFileName: 'main.py',
                remoteDir: '/home/user/project'
            };
            
            assert.ok(variables.filePath.startsWith('/'));
            assert.ok(variables.filePath.endsWith('.py'));
        });

        it('验证本地路径变量 - localPath为本地文件完整路径', () => {
            const variables: CommandVariables = {
                filePath: '/tmp/test.py',
                fileName: 'test.py',
                fileDir: '/tmp',
                localPath: 'D:\\workspace\\test.py',
                localDir: 'D:\\workspace',
                localFileName: 'test.py',
                remoteDir: '/tmp'
            };
            
            assert.ok(variables.localPath.includes('test.py'));
            assert.strictEqual(variables.localDir, 'D:\\workspace');
        });

        it('验证远程工程目录变量 - remoteDir为配置的远程目录', () => {
            const variables: CommandVariables = {
                filePath: '/opt/RemoteTest/tests/api/test_user.py',
                fileName: 'test_user.py',
                fileDir: '/opt/RemoteTest/tests/api',
                localPath: '/home/dev/project/tests/api/test_user.py',
                localDir: '/home/dev/project/tests/api',
                localFileName: 'test_user.py',
                remoteDir: '/opt/RemoteTest'
            };
            
            assert.strictEqual(variables.remoteDir, '/opt/RemoteTest');
        });
    });

    describe('AIConfig - AI配置接口', () => {
        it('验证qwen提供者配置 - 使用通义千问API和qwen-turbo模型', () => {
            const config = createMockAIConfig({ provider: 'qwen' });
            
            assert.strictEqual(config.provider, 'qwen');
            assert.ok(config.qwen?.apiKey);
            assert.strictEqual(config.qwen?.model, 'qwen-turbo');
        });

        it('验证openai提供者配置 - 使用OpenAI API和gpt-3.5-turbo模型', () => {
            const config = createMockAIConfig({
                provider: 'openai',
                openai: {
                    apiKey: 'sk-test',
                    apiUrl: 'https://api.openai.com/v1/chat/completions',
                    model: 'gpt-4'
                }
            });
            
            assert.strictEqual(config.provider, 'openai');
            assert.ok(config.openai?.apiKey);
            assert.strictEqual(config.openai?.model, 'gpt-4');
        });

        it('验证qwen模型可配置 - 支持qwen-turbo、qwen-plus、qwen-max等模型', () => {
            const qwenModels = ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'];
            const config = createMockAIConfig({
                qwen: {
                    apiKey: 'test-key',
                    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                    model: 'qwen-max'
                }
            });
            
            assert.ok(qwenModels.includes(config.qwen!.model));
            assert.strictEqual(config.qwen!.model, 'qwen-max');
        });

        it('验证openai模型可配置 - 支持gpt-3.5-turbo、gpt-4等模型', () => {
            const openaiModels = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-32k'];
            const config = createMockAIConfig({
                provider: 'openai',
                openai: {
                    apiKey: 'sk-test',
                    apiUrl: 'https://api.openai.com/v1/chat/completions',
                    model: 'gpt-4'
                }
            });
            
            assert.ok(openaiModels.includes(config.openai!.model));
            assert.strictEqual(config.openai!.model, 'gpt-4');
        });
    });

    describe('LogsConfig - 日志配置接口', () => {
        it('验证日志目录列表配置 - 支持多个监控目录', () => {
            const config: MockLogsConfig = {
                directories: [
                    { name: '应用日志', path: '/var/logs' },
                    { name: '测试日志', path: '/var/log/RemoteTest' }
                ],
                downloadPath: './downloads'
            };
            
            assert.strictEqual(config.directories.length, 2);
            assert.strictEqual(config.directories[0].name, '应用日志');
            assert.strictEqual(config.directories[1].path, '/var/log/RemoteTest');
        });

        it('验证日志下载路径配置 - 本地保存路径', () => {
            const config: MockLogsConfig = {
                directories: [{ name: '日志', path: '/var/logs' }],
                downloadPath: './logs'
            };
            
            assert.strictEqual(config.downloadPath, './logs');
        });

        it('验证LogDirectoryConfig结构 - 包含name和path', () => {
            const dirConfig: MockLogDirectoryConfig = {
                name: '系统日志',
                path: '/var/log/system'
            };
            
            assert.strictEqual(dirConfig.name, '系统日志');
            assert.strictEqual(dirConfig.path, '/var/log/system');
        });
    });

    describe('LogFile - 日志文件接口', () => {
        it('验证日志文件对象 - 包含名称、路径、大小、修改时间、是否目录', () => {
            const logFile = createMockLogFile({
                name: 'app.log',
                path: '/var/logs/app.log',
                size: 1024
            });
            
            assert.strictEqual(logFile.name, 'app.log');
            assert.strictEqual(logFile.path, '/var/logs/app.log');
            assert.strictEqual(logFile.size, 1024);
            assert.strictEqual(logFile.isDirectory, false);
            assert.ok(logFile.modifiedTime instanceof Date);
        });

        it('验证日志目录对象 - isDirectory为true', () => {
            const logDir = createMockLogFile({
                name: 'subdir',
                path: '/var/logs/subdir',
                size: 4096,
                isDirectory: true
            });
            
            assert.strictEqual(logDir.isDirectory, true);
            assert.strictEqual(logDir.name, 'subdir');
        });
    });

    describe('RemoteTestConfig - 完整配置接口', () => {
        it('验证完整配置结构 - 包含projects、ai、logs三个子配置', () => {
            const config = createMockRemoteTestConfig({
                projects: [{
                    name: '测试项目',
                    localPath: 'D:\\Projects\\Test',
                    enabled: true,
                    server: createMockServerConfig({
                        host: '192.168.1.100',
                        remoteDirectory: '/tmp/RemoteTest'
                    }),
                    commands: [{
                        name: '测试命令',
                        executeCommand: 'npm test',
                        includePatterns: [],
                        excludePatterns: []
                    }],
                    logs: {
                        directories: [{ name: '日志', path: '/var/logs' }],
                        downloadPath: './downloads'
                    }
                }],
                refreshInterval: 5000
            });
            
            assert.ok(config.projects);
            assert.ok(config.ai);
            assert.strictEqual(config.projects.length, 1);
            assert.strictEqual(config.refreshInterval, 5000);
        });

        it('验证多项目配置 - 支持多个独立项目', () => {
            const config = createMockRemoteTestConfig({
                projects: [
                    {
                        name: '项目A',
                        localPath: 'D:\\ProjectA',
                        enabled: true,
                        server: createMockServerConfig({
                            host: '192.168.1.100',
                            remoteDirectory: '/tmp/projectA'
                        }),
                        commands: [{
                            name: '测试命令',
                            executeCommand: 'pytest {filePath}',
                            includePatterns: ['error', 'failed'],
                            excludePatterns: []
                        }],
                        logs: {
                            directories: [],
                            downloadPath: './downloads'
                        }
                    },
                    {
                        name: '项目B',
                        localPath: 'D:\\ProjectB',
                        enabled: true,
                        server: createMockServerConfig({
                            host: '192.168.1.200',
                            privateKeyPath: '/home/test/.ssh/id_rsa',
                            password: '',
                            remoteDirectory: '/tmp/projectB'
                        }),
                        commands: [{
                            name: '测试命令',
                            executeCommand: 'npm test',
                            includePatterns: [],
                            excludePatterns: ['debug']
                        }],
                        logs: {
                            directories: [],
                            downloadPath: './downloads'
                        }
                    }
                ]
            });
            
            assert.strictEqual(config.projects.length, 2);
            assert.strictEqual(config.projects[0].name, '项目A');
            assert.strictEqual(config.projects[1].name, '项目B');
        });

        it('验证SSH/SCP完整配置 - 使用密钥认证', () => {
            const config = createMockRemoteTestConfig({
                projects: [{
                    name: '部署项目',
                    localPath: '/home/deploy/project',
                    enabled: true,
                    server: createMockServerConfig({
                        host: '192.168.1.200',
                        username: 'deploy',
                        password: '',
                        privateKeyPath: '/home/deploy/.ssh/id_rsa',
                        remoteDirectory: '/opt/RemoteTest'
                    }),
                    commands: [{
                        name: '测试命令',
                        executeCommand: 'cd /opt/RemoteTest && ./run_tests.sh',
                        includePatterns: ['error', 'fail'],
                        excludePatterns: []
                    }],
                    logs: {
                        directories: [
                            { name: '应用日志', path: '/var/log/RemoteTest' },
                            { name: '系统日志', path: '/var/log/system' }
                        ],
                        downloadPath: './logs'
                    }
                }],
                ai: createMockAIConfig({
                    provider: 'openai',
                    openai: { apiKey: 'sk-test', apiUrl: '', model: 'gpt-4' }
                }),
                refreshInterval: 10000
            });
            
            assert.strictEqual(config.projects[0].server.privateKeyPath, '/home/deploy/.ssh/id_rsa');
            assert.strictEqual(config.projects[0].server.remoteDirectory, '/opt/RemoteTest');
            assert.strictEqual(config.projects[0].logs?.directories.length, 2);
            assert.strictEqual(config.ai.provider, 'openai');
            assert.strictEqual(config.refreshInterval, 10000);
        });
    });

    describe('AIMessage - AI消息接口', () => {
        it('验证用户消息创建 - role为user', () => {
            const message = createMockAIMessage({
                role: 'user',
                content: 'Hello, AI!'
            });
            
            assert.strictEqual(message.role, 'user');
            assert.strictEqual(message.content, 'Hello, AI!');
        });

        it('验证助手消息创建 - role为assistant', () => {
            const message = createMockAIMessage({
                role: 'assistant',
                content: 'Hello! How can I help you?'
            });
            
            assert.strictEqual(message.role, 'assistant');
        });

        it('验证系统消息创建 - role为system', () => {
            const message = createMockAIMessage({
                role: 'system',
                content: 'You are a helpful assistant.'
            });
            
            assert.strictEqual(message.role, 'system');
        });
    });

    describe('AIResponse - AI响应接口', () => {
        it('验证成功响应 - 包含content，无error', () => {
            const response: MockAIResponse = {
                content: 'This is the AI response'
            };
            
            assert.strictEqual(response.content, 'This is the AI response');
            assert.strictEqual(response.error, undefined);
        });

        it('验证错误响应 - 包含error信息', () => {
            const response: MockAIResponse = {
                content: '',
                error: 'API request failed'
            };
            
            assert.strictEqual(response.content, '');
            assert.strictEqual(response.error, 'API request failed');
        });
    });

    describe('ProjectConfig 可选配置 - localPath 和 remoteDirectory 可选', () => {
        it('验证 localPath 可选 - 仅执行快捷命令的工程', () => {
            const project: MockProjectConfig = {
                name: '仅命令工程',
                server: createMockServerConfig(),
                commands: [{
                    name: '检查状态',
                    executeCommand: 'systemctl status nginx'
                }]
            };
            
            assert.strictEqual(project.localPath, undefined);
        });

        it('验证完整配置工程 - 包含 localPath 和 remoteDirectory', () => {
            const project = createMockProjectConfig({
                name: '完整工程',
                localPath: 'D:\\Projects\\Test',
                server: createMockServerConfig({
                    remoteDirectory: '/home/test/project'
                }),
                commands: [{
                    name: '运行测试',
                    executeCommand: 'pytest {filePath}'
                }]
            });
            
            assert.strictEqual(project.localPath, 'D:\\Projects\\Test');
            assert.strictEqual(project.server.remoteDirectory, '/home/test/project');
        });

        it('验证 logs 配置可选', () => {
            const project = createMockProjectConfig({
                name: '无日志工程',
                localPath: 'D:\\Projects\\Test',
                server: createMockServerConfig({
                    remoteDirectory: '/home/test'
                }),
                commands: []
            });
            
            assert.strictEqual(project.logs, undefined);
        });

        it('验证 commands 可选 - 仅日志监控工程', () => {
            const project: MockProjectConfig = {
                name: '仅日志监控工程',
                server: createMockServerConfig(),
                logs: {
                    directories: [{ name: '应用日志', path: '/var/log/app' }],
                    downloadPath: 'D:\\downloads'
                }
            };
            
            assert.strictEqual(project.commands, undefined);
            assert.strictEqual(project.localPath, undefined);
            assert.ok(project.logs);
        });
    });

    describe('快捷命令变量检查 - 根据配置过滤命令', () => {
        it('验证无变量命令可在任何工程执行', () => {
            const command = 'ls -la';
            const localPathVariables = ['filePath', 'fileName', 'fileDir', 'localPath', 'localDir', 'localFileName'];
            const remoteDirVariables = ['remoteDir'];
            
            const variablePattern = /\{(\w+)\}/g;
            const matches = command.match(variablePattern);
            const hasLocalPathVar = matches?.some(m => localPathVariables.includes(m.slice(1, -1))) ?? false;
            const hasRemoteDirVar = matches?.some(m => remoteDirVariables.includes(m.slice(1, -1))) ?? false;
            
            assert.strictEqual(hasLocalPathVar, false);
            assert.strictEqual(hasRemoteDirVar, false);
        });

        it('验证包含 filePath 变量的命令需要 localPath', () => {
            const command = 'pytest {filePath}';
            const localPathVariables = ['filePath', 'fileName', 'fileDir', 'localPath', 'localDir', 'localFileName'];
            
            const variablePattern = /\{(\w+)\}/g;
            const matches = command.match(variablePattern);
            const variables = matches?.map(m => m.slice(1, -1)) ?? [];
            const hasLocalPathVar = variables.some(v => localPathVariables.includes(v));
            
            assert.strictEqual(hasLocalPathVar, true);
            assert.ok(variables.includes('filePath'));
        });

        it('验证包含 remoteDir 变量的命令需要 remoteDirectory', () => {
            const command = 'cd {remoteDir} && ls';
            const remoteDirVariables = ['remoteDir'];
            
            const variablePattern = /\{(\w+)\}/g;
            const matches = command.match(variablePattern);
            const variables = matches?.map(m => m.slice(1, -1)) ?? [];
            const hasRemoteDirVar = variables.some(v => remoteDirVariables.includes(v));
            
            assert.strictEqual(hasRemoteDirVar, true);
            assert.ok(variables.includes('remoteDir'));
        });

        it('验证提取命令中的所有变量', () => {
            const command = 'cd {remoteDir} && pytest {filePath} -v';
            const variablePattern = /\{(\w+)\}/g;
            const matches = command.match(variablePattern);
            const variables = matches?.map(m => m.slice(1, -1)) ?? [];
            
            assert.strictEqual(variables.length, 2);
            assert.ok(variables.includes('remoteDir'));
            assert.ok(variables.includes('filePath'));
        });
    });
});

describe('Agent Types - Agent 类型定义测试', () => {
    describe('AgentMode - Agent 模式类型', () => {
        it('验证 AgentMode 包含 ask 模式', () => {
            const mode: import('../../src/types').AgentMode = 'ask';
            assert.strictEqual(mode, 'ask');
        });

        it('验证 AgentMode 包含 plan 模式', () => {
            const mode: import('../../src/types').AgentMode = 'plan';
            assert.strictEqual(mode, 'plan');
        });

        it('验证 AgentMode 包含 react 模式', () => {
            const mode: import('../../src/types').AgentMode = 'react';
            assert.strictEqual(mode, 'react');
        });
    });

    describe('ToolRisk - 工具风险等级', () => {
        it('验证 safe 风险等级', () => {
            const risk: import('../../src/types').ToolRisk = 'safe';
            assert.strictEqual(risk, 'safe');
        });

        it('验证 moderate 风险等级', () => {
            const risk: import('../../src/types').ToolRisk = 'moderate';
            assert.strictEqual(risk, 'moderate');
        });

        it('验证 dangerous 风险等级', () => {
            const risk: import('../../src/types').ToolRisk = 'dangerous';
            assert.strictEqual(risk, 'dangerous');
        });
    });

    describe('ToolCategory - 工具分类', () => {
        it('验证所有工具分类', () => {
            const categories: import('../../src/types').ToolCategory[] = [
                'file', 'code', 'command', 'log', 'git', 'upload', 'config', 'custom'
            ];
            assert.strictEqual(categories.length, 8);
        });
    });

    describe('ToolParameter - 工具参数', () => {
        it('验证必填参数定义', () => {
            const param: import('../../src/types').ToolParameter = {
                name: 'filePath',
                type: 'string',
                description: '文件路径',
                required: true
            };
            assert.strictEqual(param.required, true);
            assert.strictEqual(param.type, 'string');
        });

        it('验证带默认值的参数', () => {
            const param: import('../../src/types').ToolParameter = {
                name: 'lines',
                type: 'number',
                description: '读取行数',
                required: false,
                default: 100
            };
            assert.strictEqual(param.default, 100);
        });

        it('验证带枚举值的参数', () => {
            const param: import('../../src/types').ToolParameter = {
                name: 'mode',
                type: 'string',
                description: '读取模式',
                required: true,
                enum: ['head', 'tail', 'all']
            };
            assert.strictEqual(param.enum?.length, 3);
        });

        it('验证带范围限制的参数', () => {
            const param: import('../../src/types').ToolParameter = {
                name: 'timeout',
                type: 'number',
                description: '超时时间',
                required: false,
                min: 1000,
                max: 60000
            };
            assert.strictEqual(param.min, 1000);
            assert.strictEqual(param.max, 60000);
        });
    });

    describe('ToolResult - 工具执行结果', () => {
        it('验证成功结果', () => {
            const result: import('../../src/types').ToolResult = {
                success: true,
                data: { content: 'file content' }
            };
            assert.strictEqual(result.success, true);
            assert.ok(result.data);
        });

        it('验证失败结果', () => {
            const result: import('../../src/types').ToolResult = {
                success: false,
                error: 'File not found'
            };
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error, 'File not found');
        });
    });

    describe('PlanStep - 计划步骤', () => {
        it('验证计划步骤结构', () => {
            const step: import('../../src/types').PlanStep = {
                id: 'step-1',
                description: '读取配置文件',
                tool: 'readFile',
                parameters: { path: '/etc/config.json' },
                status: 'pending',
                risk: 'safe'
            };
            assert.strictEqual(step.id, 'step-1');
            assert.strictEqual(step.status, 'pending');
            assert.strictEqual(step.risk, 'safe');
        });

        it('验证带依赖的步骤', () => {
            const step: import('../../src/types').PlanStep = {
                id: 'step-2',
                description: '解析配置',
                tool: 'parseConfig',
                parameters: {},
                status: 'pending',
                dependencies: ['step-1'],
                risk: 'safe'
            };
            assert.ok(step.dependencies);
            assert.strictEqual(step.dependencies.length, 1);
        });
    });

    describe('Plan - 执行计划', () => {
        it('验证计划结构', () => {
            const plan: import('../../src/types').Plan = {
                id: 'plan-1',
                title: '部署计划',
                description: '部署应用到测试环境',
                steps: [],
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                projectId: 'project-1'
            };
            assert.strictEqual(plan.status, 'draft');
            assert.ok(Array.isArray(plan.steps));
        });
    });

    describe('SessionMemory - 会话记忆', () => {
        it('验证会话记忆结构', () => {
            const memory: import('../../src/types').SessionMemory = {
                sessionId: 'session-1',
                messages: [],
                toolCalls: [],
                context: {},
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            assert.strictEqual(memory.sessionId, 'session-1');
            assert.ok(Array.isArray(memory.messages));
            assert.ok(Array.isArray(memory.toolCalls));
        });
    });

    describe('CommandContext - 命令上下文', () => {
        it('验证命令上下文结构', () => {
            const ctx: import('../../src/types').CommandContext = {
                timestamp: '2024-01-20T10:30:45.123Z',
                project: 'TestA',
                commandName: 'runTests',
                executeCommand: 'pytest tests/',
                exitCode: 1,
                duration: 5230,
                outputSummary: {
                    totalLines: 156,
                    errorLines: 3,
                    warningLines: 5,
                    lastLines: ['FAILED test_user.py']
                },
                hasError: true,
                errorType: 'test_failure'
            };
            assert.strictEqual(ctx.exitCode, 1);
            assert.strictEqual(ctx.hasError, true);
            assert.strictEqual(ctx.outputSummary.totalLines, 156);
        });
    });

    describe('AgentConfig - Agent 配置', () => {
        it('验证默认 Agent 配置', () => {
            const config: import('../../src/types').AgentConfig = {
                enabled: true,
                defaultMode: 'plan',
                autoApproveSafeTools: true,
                maxToolCallsPerConversation: 20,
                toolTimeout: 60,
                enableThinkingDisplay: true,
                rememberProjectSelection: true,
                multiProjectEnabled: true,
                debug: {
                    mode: 'off',
                    outputDir: '~/.remotetest/debug',
                    logLevel: 'INFO',
                    includePrompts: true,
                    includeToolCalls: true
                },
                outputStorage: {
                    enabled: true,
                    maxFileSize: 5242880,
                    maxDaysToKeep: 7,
                    maxRecordsPerCommand: 50
                },
                aiSummary: {
                    enabled: true,
                    threshold: { lines: 1000, size: 102400 },
                    model: 'gpt-3.5-turbo',
                    maxTokens: 500,
                    timeout: 10000,
                    cacheEnabled: true,
                    commandTypes: ['test', 'build']
                }
            };
            assert.strictEqual(config.enabled, true);
            assert.strictEqual(config.defaultMode, 'plan');
            assert.strictEqual(config.debug.mode, 'off');
        });
    });

    describe('CustomToolConfig - 自定义工具配置', () => {
        it('验证命令类型自定义工具', () => {
            const tool: import('../../src/types').CustomToolConfig = {
                name: 'checkService',
                description: '检查服务状态',
                type: 'command',
                config: {
                    command: 'systemctl status myservice',
                    timeout: 10000
                },
                risk: 'safe',
                category: 'custom',
                parameters: []
            };
            assert.strictEqual(tool.type, 'command');
            assert.strictEqual(tool.config.command, 'systemctl status myservice');
        });

        it('验证带约束的自定义工具', () => {
            const tool: import('../../src/types').CustomToolConfig = {
                name: 'deployService',
                description: '部署服务',
                type: 'command',
                config: {
                    command: 'deploy.sh',
                    timeout: 300000
                },
                risk: 'dangerous',
                category: 'custom',
                parameters: [],
                constraints: {
                    requiresProject: true,
                    maxRetries: 1,
                    allowedProjects: ['production']
                }
            };
            assert.strictEqual(tool.risk, 'dangerous');
            assert.ok(tool.constraints);
            assert.strictEqual(tool.constraints.allowedProjects?.length, 1);
        });
    });

    describe('PromptVariables - Prompt 变量', () => {
        it('验证基础 Prompt 变量', () => {
            const vars: import('../../src/types').PromptVariables = {
                currentDate: '2024-01-20',
                currentTime: '10:30:00',
                userName: 'testuser',
                workspacePath: '/home/user/workspace',
                selectedProjects: [],
                selectedProjectsCount: 0
            };
            assert.strictEqual(vars.currentDate, '2024-01-20');
            assert.strictEqual(vars.selectedProjectsCount, 0);
        });
    });
});

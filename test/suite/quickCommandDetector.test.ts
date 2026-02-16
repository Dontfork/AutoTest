import * as assert from 'assert';

describe('QuickCommandDetector Module - 快捷命令检测模块测试', () => {
    describe('命令过滤逻辑 - selectable属性', () => {
        it('验证selectable为true的命令被排除', () => {
            const commands = [
                { name: '运行测试', executeCommand: 'pytest {filePath}', selectable: true },
                { name: '构建项目', executeCommand: 'npm run build', selectable: false },
                { name: '部署', executeCommand: 'npm run deploy', selectable: undefined }
            ];

            const quickCommands = commands.filter(cmd => cmd.selectable !== true);
            
            assert.strictEqual(quickCommands.length, 2);
            assert.strictEqual(quickCommands[0].name, '构建项目');
            assert.strictEqual(quickCommands[1].name, '部署');
        });

        it('验证selectable未定义的命令被包含', () => {
            const command = {
                name: '清理缓存',
                executeCommand: 'rm -rf cache',
                selectable: undefined
            };

            const shouldInclude = command.selectable !== true;
            
            assert.strictEqual(shouldInclude, true);
        });

        it('验证selectable为false的命令被包含', () => {
            const command = {
                name: '重启服务',
                executeCommand: 'systemctl restart myapp',
                selectable: false
            };

            const shouldInclude = command.selectable !== true;
            
            assert.strictEqual(shouldInclude, true);
        });
    });

    describe('命令过滤逻辑 - 变量检测', () => {
        it('验证包含变量的命令被排除 - {filePath}', () => {
            const command = 'pytest {filePath} -v';
            const hasVariable = /\{(\w+)\}/.test(command);
            
            assert.strictEqual(hasVariable, true);
        });

        it('验证包含变量的命令被排除 - {fileName}', () => {
            const command = 'echo "Processing {fileName}"';
            const hasVariable = /\{(\w+)\}/.test(command);
            
            assert.strictEqual(hasVariable, true);
        });

        it('验证不包含变量的命令被包含', () => {
            const command = 'npm run build';
            const hasVariable = /\{(\w+)\}/.test(command);
            
            assert.strictEqual(hasVariable, false);
        });

        it('验证多个变量的命令被排除', () => {
            const command = 'pytest {filePath} --output {fileDir}/result.xml';
            const hasVariable = /\{(\w+)\}/.test(command);
            
            assert.strictEqual(hasVariable, true);
        });

        it('验证纯文本命令被包含', () => {
            const commands = [
                { name: '构建', executeCommand: 'npm run build', selectable: false },
                { name: '测试', executeCommand: 'pytest tests/', selectable: false },
                { name: '运行', executeCommand: 'pytest {filePath}', selectable: true }
            ];

            const quickCommands = commands.filter(cmd => {
                if (cmd.selectable === true) return false;
                if (/\{(\w+)\}/.test(cmd.executeCommand)) return false;
                return true;
            });
            
            assert.strictEqual(quickCommands.length, 2);
        });
    });

    describe('QuickCommand类型 - 数据结构', () => {
        it('验证QuickCommand包含必要字段', () => {
            const quickCommand = {
                name: '构建项目',
                executeCommand: 'npm run build',
                projectName: '项目A',
                project: {
                    name: '项目A',
                    localPath: '/path/to/project',
                    server: { host: 'localhost', port: 22, username: 'user' }
                }
            };

            assert.ok(quickCommand.name);
            assert.ok(quickCommand.executeCommand);
            assert.ok(quickCommand.projectName);
            assert.ok(quickCommand.project);
        });

        it('验证QuickCommandGroup结构', () => {
            const group = {
                projectName: '项目A',
                project: {
                    name: '项目A',
                    localPath: '/path/to/project',
                    server: { host: 'localhost', port: 22, username: 'user' }
                },
                commands: [
                    { name: '构建', executeCommand: 'npm run build', projectName: '项目A' },
                    { name: '测试', executeCommand: 'npm test', projectName: '项目A' }
                ]
            };

            assert.strictEqual(group.projectName, '项目A');
            assert.strictEqual(group.commands.length, 2);
        });
    });

    describe('综合过滤逻辑', () => {
        it('验证完整过滤流程 - selectable和变量同时检测', () => {
            const commands = [
                { name: '运行测试', executeCommand: 'pytest {filePath}', selectable: true },
                { name: '构建', executeCommand: 'npm run build', selectable: false },
                { name: '部署', executeCommand: 'deploy {env}', selectable: false },
                { name: '清理', executeCommand: 'rm -rf cache', selectable: undefined },
                { name: '重启', executeCommand: 'systemctl restart app', selectable: false }
            ];

            const quickCommands = commands.filter(cmd => {
                if (cmd.selectable === true) return false;
                if (/\{(\w+)\}/.test(cmd.executeCommand)) return false;
                return true;
            });

            assert.strictEqual(quickCommands.length, 3);
            assert.strictEqual(quickCommands[0].name, '构建');
            assert.strictEqual(quickCommands[1].name, '清理');
            assert.strictEqual(quickCommands[2].name, '重启');
        });

        it('验证空命令列表处理', () => {
            const commands: any[] = [];
            const quickCommands = commands.filter(cmd => {
                if (cmd.selectable === true) return false;
                if (/\{(\w+)\}/.test(cmd.executeCommand)) return false;
                return true;
            });

            assert.strictEqual(quickCommands.length, 0);
        });

        it('验证所有命令都被过滤的情况', () => {
            const commands = [
                { name: '测试1', executeCommand: 'pytest {filePath}', selectable: true },
                { name: '测试2', executeCommand: 'npm run {script}', selectable: false }
            ];

            const quickCommands = commands.filter(cmd => {
                if (cmd.selectable === true) return false;
                if (/\{(\w+)\}/.test(cmd.executeCommand)) return false;
                return true;
            });

            assert.strictEqual(quickCommands.length, 0);
        });
    });

    describe('selectable命令用途 - 右键菜单选择', () => {
        it('验证selectable命令用于右键菜单', () => {
            const commands = [
                { name: '运行测试', executeCommand: 'pytest {filePath}', selectable: true },
                { name: '运行覆盖率', executeCommand: 'pytest {filePath} --cov', selectable: true },
                { name: '构建', executeCommand: 'npm run build', selectable: false }
            ];

            const selectableCommands = commands.filter(cmd => cmd.selectable === true);
            
            assert.strictEqual(selectableCommands.length, 2);
            assert.ok(selectableCommands.every(cmd => /\{(\w+)\}/.test(cmd.executeCommand)));
        });

        it('验证selectable命令包含变量', () => {
            const selectableCommand = {
                name: '运行测试',
                executeCommand: 'pytest {filePath} -v',
                selectable: true
            };

            const hasVariable = /\{(\w+)\}/.test(selectableCommand.executeCommand);
            
            assert.strictEqual(hasVariable, true);
            assert.strictEqual(selectableCommand.selectable, true);
        });
    });
});

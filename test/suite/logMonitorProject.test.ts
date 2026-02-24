import * as assert from 'assert';
import { describe, it } from 'mocha';
import {
    MockServerConfig,
    MockCommandConfig,
    MockProjectConfig,
    MockLogDirectoryConfig,
    MockLogsConfig,
    createMockServerConfig,
    createMockProjectConfig
} from '../helpers';

interface ProjectConfigWithLogs extends MockProjectConfig {
    logs: MockLogsConfig;
}

interface CommandConfigWithFilter {
    name: string;
    executeCommand: string;
    filterPatterns: string[];
    filterMode: 'include' | 'exclude';
}

function getEnabledProjects(projects: ProjectConfigWithLogs[]): ProjectConfigWithLogs[] {
    return projects.filter(p => p.enabled !== false);
}

function getProjectForDirectory(dir: MockLogDirectoryConfig, projects: ProjectConfigWithLogs[]): ProjectConfigWithLogs | null {
    for (const project of projects) {
        if (project.logs?.directories) {
            const found = project.logs.directories.find(d => d.path === dir.path);
            if (found) {
                return project;
            }
        }
    }
    return null;
}

describe('Log Monitor Directory Project Association - 日志目录项目关联测试', () => {
    const projects: ProjectConfigWithLogs[] = [
        {
            name: '项目A',
            localPath: 'D:\\projectA',
            enabled: true,
            server: createMockServerConfig({
                host: '192.168.1.100',
                username: 'root',
                remoteDirectory: '/tmp/projectA'
            }),
            commands: [{ name: '测试', executeCommand: 'pytest', includePatterns: [], excludePatterns: [] }],
            logs: {
                directories: [
                    { name: '应用日志', path: '/var/log/projectA/app' },
                    { name: '测试日志', path: '/var/log/projectA/test' }
                ],
                downloadPath: 'D:\\downloads\\projectA'
            }
        },
        {
            name: '项目B',
            localPath: 'D:\\projectB',
            enabled: true,
            server: createMockServerConfig({
                host: '192.168.1.200',
                username: 'test',
                remoteDirectory: '/tmp/projectB'
            }),
            commands: [{ name: '测试', executeCommand: 'python', includePatterns: [], excludePatterns: [] }],
            logs: {
                directories: [
                    { name: '应用日志', path: '/var/log/projectB/app' }
                ],
                downloadPath: 'D:\\downloads\\projectB'
            }
        }
    ];

    describe('Directory Project Association - 目录项目关联', () => {
        it('验证日志目录通过路径关联项目', () => {
            const dir: MockLogDirectoryConfig = {
                name: '应用日志',
                path: '/var/log/projectA/app'
            };
            
            const project = getProjectForDirectory(dir, projects);
            
            assert.ok(project);
            assert.strictEqual(project?.name, '项目A');
            assert.strictEqual(project?.server.host, '192.168.1.100');
        });

        it('验证不存在的目录返回null', () => {
            const dir: MockLogDirectoryConfig = {
                name: '公共日志',
                path: '/var/log/common'
            };
            
            const project = getProjectForDirectory(dir, projects);
            
            assert.strictEqual(project, null);
        });

        it('验证projectName不匹配时返回null', () => {
            const dir: MockLogDirectoryConfig = {
                name: '未知日志',
                path: '/var/log/unknown'
            };
            
            const project = getProjectForDirectory(dir, projects);
            
            assert.strictEqual(project, null);
        });

        it('验证多个日志目录关联不同项目', () => {
            const projectALog = { name: '项目A日志', path: '/var/log/projectA/app' };
            const projectBLog = { name: '项目B日志', path: '/var/log/projectB/app' };
            const commonLog = { name: '公共日志', path: '/var/log/common' };
            
            const projectA = getProjectForDirectory(projectALog, projects);
            const projectB = getProjectForDirectory(projectBLog, projects);
            const common = getProjectForDirectory(commonLog, projects);
            
            assert.strictEqual(projectA?.name, '项目A');
            assert.strictEqual(projectB?.name, '项目B');
            assert.strictEqual(common, null);
        });
    });

    describe('Server Config Resolution - 服务器配置解析', () => {
        it('验证关联项目后使用正确的服务器配置', () => {
            const dir: MockLogDirectoryConfig = {
                name: '应用日志',
                path: '/var/log/projectA/app'
            };
            
            const project = getProjectForDirectory(dir, projects);
            
            assert.strictEqual(project?.server.host, '192.168.1.100');
            assert.strictEqual(project?.server.username, 'root');
        });

        it('验证不同项目使用不同服务器', () => {
            const dirA: MockLogDirectoryConfig = {
                name: '项目A日志',
                path: '/var/log/projectA/app'
            };
            const dirB: MockLogDirectoryConfig = {
                name: '项目B日志',
                path: '/var/log/projectB/app'
            };
            
            const projectA = getProjectForDirectory(dirA, projects);
            const projectB = getProjectForDirectory(dirB, projects);
            
            assert.notStrictEqual(projectA?.server.host, projectB?.server.host);
            assert.strictEqual(projectA?.server.host, '192.168.1.100');
            assert.strictEqual(projectB?.server.host, '192.168.1.200');
        });
    });

    describe('Download Path Resolution - 下载路径解析', () => {
        it('验证使用项目级下载路径', () => {
            const dir: MockLogDirectoryConfig = {
                name: '项目A日志',
                path: '/var/log/projectA/app'
            };
            
            const project = getProjectForDirectory(dir, projects);
            
            assert.strictEqual(project?.logs?.downloadPath, 'D:\\downloads\\projectA');
        });

        it('验证不同项目使用不同下载路径', () => {
            const dirA: MockLogDirectoryConfig = {
                name: '项目A日志',
                path: '/var/log/projectA/app'
            };
            const dirB: MockLogDirectoryConfig = {
                name: '项目B日志',
                path: '/var/log/projectB/app'
            };
            
            const projectA = getProjectForDirectory(dirA, projects);
            const projectB = getProjectForDirectory(dirB, projects);
            
            assert.strictEqual(projectA?.logs?.downloadPath, 'D:\\downloads\\projectA');
            assert.strictEqual(projectB?.logs?.downloadPath, 'D:\\downloads\\projectB');
        });
    });

    describe('Enabled Projects - 启用项目', () => {
        it('验证获取启用的项目列表', () => {
            const enabled = getEnabledProjects(projects);
            
            assert.strictEqual(enabled.length, 2);
            assert.strictEqual(enabled[0].name, '项目A');
            assert.strictEqual(enabled[1].name, '项目B');
        });

        it('验证禁用项目不在列表中', () => {
            const allProjects: ProjectConfigWithLogs[] = [
                ...projects,
                {
                    name: '禁用项目',
                    localPath: 'D:\\disabled',
                    enabled: false,
                    server: createMockServerConfig({
                        host: '192.168.1.300',
                        username: 'disabled',
                        remoteDirectory: '/tmp/disabled'
                    }),
                    commands: [],
                    logs: {
                        directories: [],
                        downloadPath: ''
                    }
                }
            ];
            
            const enabled = getEnabledProjects(allProjects);
            
            assert.strictEqual(enabled.length, 2);
            assert.ok(!enabled.find(p => p.name === '禁用项目'));
        });

        it('验证禁用项目的日志目录无法关联', () => {
            const allProjects: ProjectConfigWithLogs[] = [
                ...projects,
                {
                    name: '禁用项目',
                    localPath: 'D:\\disabled',
                    enabled: false,
                    server: createMockServerConfig({
                        host: '192.168.1.300',
                        username: 'disabled',
                        remoteDirectory: '/tmp/disabled'
                    }),
                    commands: [],
                    logs: {
                        directories: [{ name: '禁用项目日志', path: '/var/log/disabled' }],
                        downloadPath: 'D:\\downloads\\disabled'
                    }
                }
            ];
            
            const dir: MockLogDirectoryConfig = {
                name: '禁用项目日志',
                path: '/var/log/disabled'
            };
            
            const enabled = getEnabledProjects(allProjects);
            const project = getProjectForDirectory(dir, enabled);
            
            assert.strictEqual(project, null);
        });
    });
});

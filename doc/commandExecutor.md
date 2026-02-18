# 命令执行模块 (CommandExecutor Module)

## 1. 模块概述

命令执行模块负责通过 SSH 在远程服务器上执行命令，捕获输出并进行过滤和着色处理。模块支持命令变量替换，允许在命令中使用文件路径等变量，实现灵活的测试执行配置。模块使用 VSCode 的 OutputChannel 显示执行过程，支持正则表达式过滤输出内容，并支持颜色渲染。

## 2. 设计方案

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                   CommandExecutor Module                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              replaceVariables()                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ 原始命令  │→│ 变量替换  │→│ 替换后命令        │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   execute()                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ SSH连接   │→│ 执行命令  │→│ 过滤+着色输出     │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OutputChannel (TestOutput)              │    │
│  │  [变量替换] 原始命令: pytest {filePath}               │    │
│  │  [变量替换] 替换后: pytest /tmp/test.py               │    │
│  │  [SSH连接] root@192.168.1.100:22                     │    │
│  │  ─────────────────────────────────────────           │    │
│  │  ... 彩色输出内容 ...                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OutputFilter Module                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │    │
│  │  │ 过滤输出  │→│ 应用颜色  │→│ 格式化结果        │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 执行流程

```
用户触发命令
    │
    ▼
匹配项目配置 (matchProject)
    │
    ├── 获取项目服务器配置
    ├── 获取项目命令配置
    │
    ▼
构建命令变量 (buildCommandVariables)
    │
    ├── filePath: 远程文件完整路径
    ├── fileName: 远程文件名
    ├── fileDir: 远程文件所在目录
    ├── localPath: 本地文件完整路径
    ├── localDir: 本地文件所在目录
    ├── localFileName: 本地文件名
    └── remoteDir: 远程工程目录
    │
    ▼
变量替换 (replaceCommandVariables)
    │
    ├── 替换 {filePath}
    ├── 替换 {fileName}
    ├── 替换 {fileDir}
    ├── 替换 {localPath}
    ├── 替换 {localDir}
    ├── 替换 {localFileName}
    └── 替换 {remoteDir}
    │
    ▼
executeRemoteCommand(command, outputChannel, serverConfig, commandConfig)
    │
    ├── 获取 SSH 配置
    │
    ├── 建立 SSH 连接
    │
    ├── 执行替换后的命令
    │
    ├── 捕获 stdout/stderr
    │
    ├── 过滤输出 (includePatterns/excludePatterns)
    │
    ├── 应用颜色规则 (colorRules)
    │
    ▼
返回过滤后的输出
```

### 2.3 SSH 连接机制

```
SSH 连接建立
    │
    ├── 检查 privateKeyPath 配置
    │   ├── 存在 → 读取私钥文件
    │   │          └── 使用私钥认证
    │   └── 不存在 → 使用 password 认证
    │
    ├── 建立 SSH 连接
    │
    ├── 创建 Shell 会话
    │
    └── 执行命令
```

### 2.4 过滤与着色机制

```
原始输出
    │
    ▼
按行分割
    │
    ▼
遍历每一行
    │
    ├── 应用 includePatterns (只保留匹配的行)
    │
    ├── 应用 excludePatterns (排除匹配的行)
    │
    ├── 应用 colorRules (为匹配的行添加颜色)
    │
    ▼
合并处理后的行
```

## 3. 类型定义

### 3.1 命令配置接口

```typescript
interface CommandConfig {
    name: string;                      // 命令名称
    executeCommand: string;            // 要执行的命令（支持变量）
    includePatterns?: string[];        // 包含匹配模式
    excludePatterns?: string[];        // 排除匹配模式
    colorRules?: OutputColorRule[];    // 颜色规则（可选）
}

interface OutputColorRule {
    pattern: string;                   // 匹配模式
    color: 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';
}
```

### 3.2 命令变量接口

```typescript
interface CommandVariables {
    filePath: string;       // 远程文件完整路径
    fileName: string;       // 远程文件名
    fileDir: string;        // 远程文件所在目录
    localPath: string;      // 本地文件完整路径
    localDir: string;       // 本地文件所在目录
    localFileName: string;  // 本地文件名
    remoteDir: string;      // 远程工程目录
}
```

### 3.3 支持的变量

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{filePath}` | 远程文件完整路径 | `/tmp/RemoteTest/tests/test_example.py` |
| `{fileName}` | 远程文件名 | `test_example.py` |
| `{fileDir}` | 远程文件所在目录 | `/tmp/RemoteTest/tests` |
| `{localPath}` | 本地文件完整路径 | `D:\project\tests\test_example.py` |
| `{localDir}` | 本地文件所在目录 | `D:\project\tests` |
| `{localFileName}` | 本地文件名 | `test_example.py` |
| `{remoteDir}` | 远程工程目录 | `/tmp/RemoteTest` |

### 3.4 过滤模式说明

| 模式 | 行为 | 使用场景 |
|------|------|----------|
| includePatterns | 只保留匹配正则的行 | 只查看错误和失败信息 |
| excludePatterns | 排除匹配正则的行 | 过滤掉调试信息 |

### 3.5 默认过滤配置

默认配置保留包含错误和失败信息的输出行：

```json
{
    "includePatterns": ["error", "failed", "FAILED", "Error", "ERROR"]
}
```

**说明**：
- 默认使用 `includePatterns`，只显示包含错误或失败的行
- 支持正则表达式匹配（不区分大小写）
- 如果正则表达式无效，会降级为字符串包含匹配

### 3.6 内置颜色规则

插件内置了常用颜色规则，无需手动配置：

| 模式 | 颜色 | 说明 |
|------|------|------|
| `ERROR|FAILED|FAIL|Exception|Traceback` | 红色 | 错误信息 |
| `PASSED|SUCCESS|OK|✓|✔` | 绿色 | 成功信息 |
| `WARNING|WARN|⚠` | 黄色 | 警告信息 |
| `INFO|info|ℹ` | 蓝色 | 信息提示 |

## 4. 功能实现

### 4.1 类结构

```typescript
export class SSHClient {
    private client: Client | null = null;
    private connected: boolean = false;
    private serverConfig: ServerConfig | null = null;

    constructor(serverConfig?: ServerConfig);
    
    async connect(): Promise<Client>;
    async disconnect(): Promise<void>;
    isConnected(): boolean;
    getClient(): Client | null;
}

// 导出函数
export async function executeRemoteCommand(
    command: string,
    outputChannel?: vscode.OutputChannel,
    serverConfig?: ServerConfig,
    commandConfig?: Partial<CommandConfig>
): Promise<{ stdout: string; stderr: string; code: number; filteredOutput: string }>;

export function replaceCommandVariables(command: string, variables: CommandVariables): string;
export function buildCommandVariables(localFilePath: string, remoteFilePath: string, remoteDir: string): CommandVariables;
```

### 4.2 变量替换方法

#### replaceCommandVariables(command: string, variables: CommandVariables): string

替换命令中的变量。

**参数**：
- `command`: 包含变量的命令字符串
- `variables`: 变量对象

**返回值**：
- `string`: 替换后的命令

**实现逻辑**：
```typescript
export function replaceCommandVariables(command: string, variables: CommandVariables): string {
    let result = command;
    
    result = result.replace(/{filePath}/g, variables.filePath);
    result = result.replace(/{fileName}/g, variables.fileName);
    result = result.replace(/{fileDir}/g, variables.fileDir);
    result = result.replace(/{localPath}/g, variables.localPath);
    result = result.replace(/{localDir}/g, variables.localDir);
    result = result.replace(/{localFileName}/g, variables.localFileName);
    result = result.replace(/{remoteDir}/g, variables.remoteDir);
    
    return result;
}
```

#### buildCommandVariables(localFilePath: string, remoteFilePath: string, remoteDir: string): CommandVariables

构建命令变量对象。

**参数**：
- `localFilePath`: 本地文件路径
- `remoteFilePath`: 远程文件路径
- `remoteDir`: 远程工程目录

**返回值**：
- `CommandVariables`: 变量对象

### 4.3 核心方法

#### executeRemoteCommand(command: string, outputChannel?: vscode.OutputChannel, serverConfig?: ServerConfig, commandConfig?: Partial<CommandConfig>): Promise<...>

执行指定命令并返回过滤后的输出。

**参数**：
- `command`: 要执行的命令字符串
- `outputChannel`: 可选的输出通道（默认使用 TestOutput）
- `serverConfig`: 服务器配置（用于多项目环境）
- `commandConfig`: 命令配置（包含过滤和颜色规则）

**返回值**：
- `Promise<{ stdout: string; stderr: string; code: number; filteredOutput: string }>`: 执行结果

**实现逻辑**：
```typescript
export async function executeRemoteCommand(
    command: string,
    outputChannel?: vscode.OutputChannel,
    serverConfig?: ServerConfig,
    commandConfig?: Partial<CommandConfig>
): Promise<{ stdout: string; stderr: string; code: number; filteredOutput: string }> {
    const sshClient = new SSHClient(serverConfig);
    
    try {
        const client = await sshClient.connect();
        
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            
            client.on('close', (code: number) => {
                const filteredOutput = filterCommandOutput(
                    stdout + stderr,
                    commandConfig?.includePatterns,
                    commandConfig?.excludePatterns
                );
                
                const coloredOutput = applyColorRules(
                    filteredOutput,
                    getColorRules(commandConfig?.colorRules)
                );
                
                if (outputChannel) {
                    outputChannel.appendLine(coloredOutput);
                }
                
                resolve({ stdout, stderr, code: code || 0, filteredOutput: coloredOutput });
            });
            
            client.exec(command, (err, stream) => {
                if (err) {
                    reject(new Error(`命令执行失败: ${err.message}`));
                    return;
                }
                
                stream.on('data', (data: Buffer) => {
                    stdout += data.toString();
                });
                
                stream.stderr.on('data', (data: Buffer) => {
                    stderr += data.toString();
                });
            });
        });
    } finally {
        await sshClient.disconnect();
    }
}
```

### 4.4 输出过滤模块

#### filterCommandOutput(output: string, includePatterns?: string[], excludePatterns?: string[]): string

过滤输出内容。

**参数**：
- `output`: 原始输出字符串
- `includePatterns`: 包含匹配模式
- `excludePatterns`: 排除匹配模式

**返回值**：
- `string`: 过滤后的输出

#### applyColorRules(output: string, rules: OutputColorRule[]): string

应用颜色规则到输出。

**参数**：
- `output`: 输出字符串
- `rules`: 颜色规则数组

**返回值**：
- `string`: 带颜色代码的输出

#### getColorRules(customRules?: OutputColorRule[]): OutputColorRule[]

获取颜色规则（合并内置规则和自定义规则）。

**参数**：
- `customRules`: 自定义颜色规则

**返回值**：
- `OutputColorRule[]`: 合并后的颜色规则

## 5. 使用示例

### 5.1 基本使用

```typescript
import { executeRemoteCommand } from './core/sshClient';

// 执行简单命令
const result = await executeRemoteCommand('npm test');
console.log('Filtered output:', result.filteredOutput);
```

### 5.2 使用变量替换执行测试

```typescript
import { executeRemoteCommand, buildCommandVariables, replaceCommandVariables } from './core/sshClient';
import { matchProject } from './config';

// 匹配项目配置
const localFilePath = 'D:\\projectA\\tests\\test_example.py';
const matchResult = matchProject(localFilePath);

if (matchResult) {
    const project = matchResult.project;
    const command = matchResult.command || project.commands[0];
    
    // 计算远程文件路径
    const relativePath = path.relative(project.localPath, localFilePath);
    const remoteFilePath = path.posix.join(project.server.remoteDirectory, relativePath.replace(/\\/g, '/'));
    
    // 构建变量
    const variables = buildCommandVariables(
        localFilePath,
        remoteFilePath,
        project.server.remoteDirectory
    );
    
    // 替换变量
    const finalCommand = replaceCommandVariables(command.executeCommand, variables);
    
    // 执行命令
    const result = await executeRemoteCommand(
        finalCommand,
        undefined,
        project.server,
        command
    );
}
```

### 5.3 多命令选择

当项目配置了多个命令时，弹出选择框让用户选择：

```typescript
import { matchProject } from './config';
import * as vscode from 'vscode';

const matchResult = matchProject(localFilePath);

if (matchResult && matchResult.project.commands.length > 1) {
    // 多个命令，让用户选择
    const selected = await vscode.window.showQuickPick(
        matchResult.project.commands.map(cmd => ({
            label: cmd.name,
            description: cmd.executeCommand,
            command: cmd
        })),
        { placeHolder: '选择要执行的命令' }
    );
    
    if (selected) {
        // 执行选中的命令
        await executeCommand(selected.command, matchResult.project);
    }
} else if (matchResult && matchResult.project.commands.length === 1) {
    // 单个命令，直接执行
    await executeCommand(matchResult.project.commands[0], matchResult.project);
}
```

### 5.4 配置文件示例

```json
{
    "projects": [
        {
            "name": "项目A",
            "localPath": "D:\\projectA",
            "server": {
                "host": "192.168.1.100",
                "port": 22,
                "username": "root",
                "password": "",
                "remoteDirectory": "/tmp/projectA"
            },
            "commands": [
                {
                    "name": "运行测试",
                    "executeCommand": "pytest {filePath} -v",
                    "includePatterns": ["PASSED", "FAILED", "ERROR"]
                },
                {
                    "name": "运行覆盖率",
                    "executeCommand": "pytest {filePath} --cov",
                    "includePatterns": ["error", "failed", "%"]
                }
            ]
        }
    ]
}
```

### 5.5 常用命令配置示例

**Python pytest**:
```json
{
    "name": "运行测试",
    "executeCommand": "cd {remoteDir} && pytest {filePath} -v",
    "includePatterns": ["PASSED", "FAILED", "ERROR"]
}
```

**JavaScript Jest**:
```json
{
    "name": "运行测试",
    "executeCommand": "cd {remoteDir} && npx jest {filePath} --coverage=false",
    "includePatterns": ["PASS", "FAIL", "✓", "✕"]
}
```

**Java Maven**:
```json
{
    "name": "运行测试",
    "executeCommand": "cd {remoteDir} && mvn test -Dtest={fileName}",
    "includePatterns": ["Tests run:", "FAILURE", "ERROR"]
}
```

**Go test**:
```json
{
    "name": "运行测试",
    "executeCommand": "cd {fileDir} && go test -v",
    "includePatterns": ["PASS", "FAIL", "=== RUN"]
}
```

### 5.6 使用自定义过滤配置

```typescript
// 只显示包含 error 或 fail 的行
const result = await executeRemoteCommand(
    'npm run build',
    undefined,
    serverConfig,
    {
        includePatterns: ['error', 'fail', 'FAILED']
    }
);
```

### 5.7 排除调试信息

```typescript
// 排除包含 [debug] 的行
const result = await executeRemoteCommand(
    'npm run dev',
    undefined,
    serverConfig,
    {
        excludePatterns: ['\\[debug\\]', '\\[trace\\]']
    }
);
```

## 6. OutputChannel 输出格式

```
[变量替换] 原始命令: pytest {filePath} -v
[变量替换] 替换后: pytest /tmp/RemoteTest/tests/test_example.py -v
[SSH连接] root@192.168.1.100:22
──────────────────────────────────────────────────
============================= test session starts ==============================
collected 3 items

test_example.py::test_add PASSED          (绿色)
test_example.py::test_subtract PASSED     (绿色)
test_example.py::test_multiply FAILED     (红色)

============================= 2 passed, 1 failed in 0.05s ======================
──────────────────────────────────────────────────
[执行完成] 退出码: 0
```

## 7. 输出通道管理

插件使用两个独立的输出通道：

| 通道名称 | 用途 |
|----------|------|
| RemoteTest | 插件自身的日志输出 |
| TestOutput | 测试用例执行输出 |

```typescript
// 获取输出通道
const autoTestChannel = vscode.window.createOutputChannel('RemoteTest');
const testOutputChannel = vscode.window.createOutputChannel('TestOutput');

// 执行命令时使用 TestOutput 通道
await executeRemoteCommand(command, testOutputChannel, serverConfig, commandConfig);
```

## 8. 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| 命令不存在 | 进程返回非零退出码，输出错误信息 |
| 正则表达式无效 | 忽略该正则，继续处理其他正则 |
| SSH 连接失败 | 显示错误消息，记录日志 |
| 服务器配置缺失 | 抛出异常，显示提示 |
| 认证失败 | 显示错误消息，检查密钥/密码配置 |

## 9. 性能考虑

- 使用 SSH 连接池减少连接开销
- 实时输出到 OutputChannel，避免内存堆积
- 正则匹配使用不区分大小写模式 (`'i'` 标志)
- 变量替换使用全局替换 (`/g` 标志)
- 命令执行完成后自动断开 SSH 连接

## 10. 测试覆盖

命令执行模块测试覆盖以下场景：

- 变量替换功能测试
  - 单变量替换
  - 多变量替换
  - 重复变量替换
  - 无变量命令处理
- 构建命令变量测试
  - 路径提取
  - 目录层级处理
- 输出过滤功能测试
- includePatterns/excludePatterns 测试
- 正则表达式匹配测试
- 颜色规则应用测试
- 多项目配置测试

详见测试文件：`test/suite/commandExecutor.test.ts`、`test/suite/multiProject.test.ts`

# 命令执行模块 (CommandExecutor Module)

## 1. 模块概述

命令执行模块负责通过 SSH 在远程服务器上执行命令，捕获输出并进行过滤处理。模块支持命令变量替换，允许在命令中使用文件路径等变量，实现灵活的测试执行配置。

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
│  │  │ SSH连接   │→│ 执行命令  │→│ 过滤输出          │   │    │
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
    ▼
变量替换 (replaceCommandVariables)
    │
    ▼
executeRemoteCommand(command, outputChannel, serverConfig, commandConfig)
    │
    ├── 建立 SSH 连接
    ├── 执行命令
    ├── 捕获 stdout/stderr
    ├── 过滤输出 (includePatterns/excludePatterns)
    │
    ▼
返回执行结果
```

### 2.3 SSH 连接机制

```
SSH 连接建立
    │
    ├── 检查 privateKeyPath 配置
    │   ├── 存在 → 使用私钥认证
    │   └── 不存在 → 使用 password 认证
    │
    ├── 建立 SSH 连接
    │
    └── 执行命令
```

## 3. 类型定义

### 3.1 命令配置接口

```typescript
interface CommandConfig {
    name: string;                      // 命令名称
    executeCommand: string;            // 要执行的命令（支持变量）
    runnable?: boolean;                // 是否可执行
    selectable?: boolean;              // 是否为可选命令
    includePatterns?: string[];        // 包含匹配模式
    excludePatterns?: string[];        // 排除匹配模式
    clearOutputBeforeRun?: boolean;    // 执行前清空输出
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

### 3.4 过滤模式

| 模式 | 行为 | 使用场景 |
|------|------|----------|
| includePatterns | 只保留匹配正则的行 | 只查看错误和失败信息 |
| excludePatterns | 排除匹配正则的行 | 过滤掉调试信息 |

## 4. 功能实现

### 4.1 核心方法

#### executeRemoteCommand(command, outputChannel?, serverConfig?, commandConfig?)

执行指定命令并返回过滤后的输出。

**参数**：
- `command`: 要执行的命令字符串
- `outputChannel`: 可选的输出通道
- `serverConfig`: 服务器配置
- `commandConfig`: 命令配置（包含过滤规则）

**返回值**：
- `Promise<{ stdout: string; stderr: string; code: number; filteredOutput: string }>`

#### replaceCommandVariables(command: string, variables: CommandVariables): string

替换命令中的变量。

#### buildCommandVariables(localFilePath, remoteFilePath, remoteDir): CommandVariables

构建命令变量对象。

### 4.2 输出过滤

#### filterCommandOutput(output, includePatterns?, excludePatterns?): string

过滤输出内容。

- 先应用 includePatterns（只保留匹配的行）
- 再应用 excludePatterns（排除匹配的行）
- 支持正则表达式匹配

## 5. 使用示例

### 5.1 基本使用

```typescript
import { executeRemoteCommand } from './core/sshClient';

const result = await executeRemoteCommand('npm test');
console.log('Filtered output:', result.filteredOutput);
```

### 5.2 配置文件示例

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
                    "includePatterns": ["PASSED", "FAILED", "ERROR"],
                    "clearOutputBeforeRun": true
                }
            ]
        }
    ]
}
```

### 5.3 常用命令配置

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
    "executeCommand": "cd {remoteDir} && npx jest {filePath}",
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

## 6. 输出通道管理

| 通道名称 | 用途 |
|----------|------|
| RemoteTest | 插件自身的日志输出 |
| TestOutput | 测试用例执行输出 |

可通过 `useLogOutputChannel` 配置控制 TestOutput 使用 LogOutputChannel 还是普通 OutputChannel。

## 7. 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| 命令不存在 | 返回非零退出码 |
| 正则表达式无效 | 降级为字符串匹配 |
| SSH 连接失败 | 显示错误消息 |
| 认证失败 | 检查密钥/密码配置 |

## 8. 测试覆盖

详见：`test/suite/commandExecutor.test.ts`

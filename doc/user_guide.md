# RemoteTest 用户指南

本文档介绍 RemoteTest 插件的配置和使用方法。

## 目录

- [快速开始](#快速开始)
- [配置文件](#配置文件)
- [功能说明](#功能说明)
- [常见问题](#常见问题)

## 快速开始

### 1. 创建配置文件

在项目根目录创建 `.vscode/RemoteTest-config.json` 文件：

```json
{
  "projects": [
    {
      "name": "我的项目",
      "localPath": "D:\\myproject",
      "server": {
        "host": "192.168.1.100",
        "port": 22,
        "username": "root",
        "password": "your-password"
      },
      "remoteDirectory": "/home/user/myproject",
      "commands": [
        {
          "name": "运行测试",
          "executeCommand": "pytest {filePath} -v"
        }
      ]
    }
  ]
}
```

### 2. 基本使用

| 操作 | 入口 |
|------|------|
| 运行用例 | 右键文件 → RemoteTest: 运行 |
| 上传文件 | 右键文件 → RemoteTest: 上传文件 |
| 同步文件 | 右键文件 → RemoteTest: 同步文件 |
| 快捷命令 | 资源管理器 → 快捷命令面板 |
| 修改监控 | 资源管理器 → 修改监控面板 |
| 日志监控 | 资源管理器 → 日志监控面板 |
| AI 对话 | 活动栏 → RemoteTest AI 图标 |

## 配置文件

### 完整配置示例

```json
{
  "projects": [
    {
      "name": "项目A",
      "localPath": "D:\\projectA",
      "enabled": true,
      "server": {
        "host": "192.168.1.100",
        "port": 22,
        "username": "root",
        "password": "",
        "privateKeyPath": "C:\\Users\\user\\.ssh\\id_rsa",
        "remoteDirectory": "/tmp/projectA"
      },
      "commands": [
        {
          "name": "运行测试",
          "executeCommand": "pytest {filePath} -v",
          "runnable": true,
          "clearOutputBeforeRun": true,
          "includePatterns": ["ERROR", "FAILED", "PASSED"]
        },
        {
          "name": "构建项目",
          "executeCommand": "npm run build",
          "runnable": false
        }
      ],
      "logs": {
        "directories": [
          { "name": "应用日志", "path": "/var/log/projectA" }
        ],
        "downloadPath": "D:\\downloads\\projectA"
      }
    }
  ],
  "ai": {
    "models": [
      {
        "name": "qwen-turbo",
        "provider": "qwen",
        "apiKey": "your-qwen-api-key"
      },
      {
        "name": "gpt-4",
        "provider": "openai",
        "apiKey": "your-openai-api-key"
      },
      {
        "name": "local-llm",
        "provider": "openai",
        "apiUrl": "http://localhost:8000/v1/chat/completions"
      }
    ],
    "defaultModel": "qwen-turbo",
    "proxy": "proxy.company.com:8080"
  },
  "refreshInterval": 0,
  "useLogOutputChannel": true
}
```

### 项目配置 (ProjectConfig)

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | ✓ | 项目名称 |
| `localPath` | ✗ | 本地工程路径（绝对路径） |
| `enabled` | ✗ | 是否启用，默认 true |
| `server` | ✓ | 服务器连接配置 |
| `commands` | ✗ | 命令配置数组 |
| `logs` | ✗ | 日志监控配置 |

### 服务器配置 (ServerConfig)

| 字段 | 必填 | 说明 |
|------|------|------|
| `host` | ✓ | 服务器 IP 地址 |
| `port` | ✓ | SSH 端口，默认 22 |
| `username` | ✓ | SSH 用户名 |
| `password` | ✗ | SSH 密码（密码认证） |
| `privateKeyPath` | ✗ | SSH 私钥路径（密钥认证，优先于密码） |
| `remoteDirectory` | ✗ | 远程工作目录（绝对路径） |

### 命令配置 (CommandConfig)

| 字段 | 说明 |
|------|------|
| `name` | 命令名称 |
| `executeCommand` | 执行命令（支持变量替换） |
| `runnable` | 是否在"运行用例"中显示，默认 false |
| `clearOutputBeforeRun` | 执行前是否清空输出，默认 true |
| `includePatterns` | 包含匹配模式（正则表达式） |
| `excludePatterns` | 排除匹配模式（正则表达式） |

### 命令变量

| 变量 | 说明 | 配置要求 |
|------|------|----------|
| `{filePath}` | 远程文件完整路径 | 需要 localPath + remoteDirectory |
| `{fileName}` | 远程文件名 | 需要 localPath + remoteDirectory |
| `{fileDir}` | 远程文件所在目录 | 需要 localPath + remoteDirectory |
| `{localPath}` | 本地文件完整路径 | 需要 localPath |
| `{localDir}` | 本地文件所在目录 | 需要 localPath |
| `{localFileName}` | 本地文件名 | 需要 localPath |
| `{remoteDir}` | 远程工程目录 | 需要 remoteDirectory |

### AI 配置

| 字段 | 说明 |
|------|------|
| `models` | 模型配置列表 |
| `models[].name` | 模型名称 |
| `models[].provider` | 提供商类型：`qwen` 或 `openai` |
| `models[].apiKey` | API 密钥（可选） |
| `models[].apiUrl` | 自定义 API 地址（可选） |
| `defaultModel` | 默认模型名称 |
| `proxy` | 全局代理，格式 `host:port` |

**provider 说明**：
- `qwen`：通义千问 API 格式
- `openai`：OpenAI API 格式（兼容大多数本地模型如 Ollama、vLLM）

### 全局配置

| 字段 | 说明 |
|------|------|
| `refreshInterval` | 日志刷新间隔（毫秒），0 表示禁用自动刷新 |
| `useLogOutputChannel` | 输出通道类型，true 带时间戳，false 无时间戳 |
| `textFileExtensions` | 额外的文本文件扩展名列表 |

## 功能说明

### 运行用例

将文件上传到远程服务器并执行配置的测试命令。

1. 右键点击文件或目录
2. 选择 **RemoteTest: 运行**
3. 如有多个命令，选择要执行的命令
4. 查看输出面板中的执行结果

### 上传文件

仅上传文件到远程服务器，不执行命令。

1. 右键点击文件或目录
2. 选择 **RemoteTest: 上传文件**

### 同步文件

从远程服务器下载文件或目录到本地。

1. 右键点击文件或目录
2. 选择 **RemoteTest: 同步文件**

### 快捷命令

快速执行预定义命令，无需选择文件。

1. 在资源管理器中找到 **快捷命令** 面板
2. 展开项目节点
3. 点击命令右侧的执行按钮

**显示规则**：
- 仅显示不包含变量的命令
- `runnable` 配置不影响快捷命令显示

### 修改监控

基于 Git 检测项目变更，一键上传所有修改文件。

1. 在资源管理器中找到 **修改监控** 面板
2. 查看变更文件列表
3. 点击项目节点的上传按钮

**变更类型**：
- 🟢 新增文件
- 🟡 修改文件
- 🔴 删除文件
- 🔵 重命名文件

### 日志监控

查看和下载远程服务器日志。

1. 在资源管理器中找到 **日志监控** 面板
2. 展开日志目录
3. 点击日志文件下载到本地

### AI 对话

与 AI 助手进行对话交流。

1. 点击左侧活动栏的 RemoteTest AI 图标
2. 在输入框中输入消息
3. AI 响应实时流式显示

**功能特性**：
- 流式输出
- Markdown 渲染
- 会话历史管理
- 多模型支持

## 常见问题

### Q: 路径配置有什么要求？

**A**: 所有路径必须使用绝对路径：
- `localPath`: `D:\projectA`
- `privateKeyPath`: `C:\Users\user\.ssh\id_rsa`
- `remoteDirectory`: `/tmp/projectA`
- `logs.directories[].path`: `/var/log/myapp`
- `logs.downloadPath`: `D:\downloads`

### Q: 如何配置 SSH 密钥认证？

**A**: 配置 `privateKeyPath` 字段，优先级高于密码认证：

```json
{
  "server": {
    "host": "192.168.1.100",
    "username": "root",
    "privateKeyPath": "C:\\Users\\user\\.ssh\\id_rsa"
  }
}
```

### Q: 如何使用本地部署的模型？

**A**: 配置 `apiUrl` 并设置 `provider` 为 `openai`：

```json
{
  "ai": {
    "models": [
      {
        "name": "local-model",
        "provider": "openai",
        "apiUrl": "http://localhost:8000/v1/chat/completions"
      }
    ]
  }
}
```

### Q: 为什么快捷命令不显示？

**A**: 快捷命令仅显示不包含变量的命令。如果命令包含 `{filePath}` 等变量，需要在"运行用例"功能中使用。

### Q: 如何过滤命令输出？

**A**: 使用 `includePatterns` 和 `excludePatterns`：

```json
{
  "commands": [
    {
      "name": "运行测试",
      "executeCommand": "pytest {filePath} -v",
      "includePatterns": ["ERROR", "FAILED", "PASSED"],
      "excludePatterns": ["traceback"]
    }
  ]
}
```

### Q: 功能可用性说明

| 功能 | localPath | remoteDirectory | commands | logs |
|------|-----------|-----------------|----------|------|
| 快捷命令（无变量） | - | - | ✓ | - |
| 快捷命令（本地变量） | ✓ | - | ✓ | - |
| 快捷命令（远程变量） | - | ✓ | ✓ | - |
| 文件上传 | ✓ | ✓ | - | - |
| Git 变更监控 | ✓ | - | - | - |
| 日志监控 | - | - | - | ✓ |
| 运行用例 | ✓ | ✓ | ✓ | - |

> ✓ 表示必需，- 表示不依赖

# AutoTest 插件功能文档

## 1. 功能概览

AutoTest 插件提供以下核心功能：

| 功能 | 描述 | 入口 |
|------|------|------|
| AI 对话 | 与 AI 助手进行对话交流，支持流式输出和会话管理 | 活动栏 AutoTest AI 图标 |
| 修改监控 | 基于 Git 检测项目变更，一键上传所有修改文件 | 资源管理器 - 修改监控 |
| 日志监控 | 查看和下载服务器日志 | 资源管理器 - 日志监控 |
| 运行 | 上传文件并执行测试命令 | 右键菜单 |
| 上传文件 | 仅上传文件，不执行命令 | 右键菜单 |
| 同步文件 | 从远程服务器下载文件/目录到本地 | 右键菜单 |

## 2. 多工程多环境支持

### 2.1 功能说明

AutoTest 支持多工程多环境配置，每个工程可以配置：
- 独立的服务器信息（IP、端口、用户名、认证方式）
- 独立的远程工作目录
- 独立的命令配置（支持多个命令）

### 2.2 自动路径匹配

当用户执行上传或运行用例操作时，插件会根据本地文件路径自动匹配对应的工程配置：

1. 遍历所有启用的工程配置
2. 检查本地文件路径是否以工程的 `localPath` 开头
3. 选择最长匹配的工程（处理嵌套路径情况）

### 2.3 路径冲突检测

如果检测到工程路径存在包含关系（如 `D:\project` 和 `D:\project\sub`），插件会：
- 自动禁用范围较小的工程
- 显示警告消息提醒用户

### 2.4 命令选择

当工程配置了多个命令时：
- 单个命令：直接执行
- 多个命令：弹出选择框让用户选择

## 3. AI 对话功能

### 3.1 功能说明

AI 对话功能允许用户与 AI 助手进行自然语言交互，支持：
- **流式输出**: AI 响应实时显示，无需等待完整响应
- **Markdown 渲染**: 支持 Markdown 语法渲染（标题、加粗、斜体、代码块、链接、列表等）
- **会话管理**: 支持创建新会话、切换历史会话
- **持久化存储**: 会话自动保存，重启后可恢复

### 3.2 使用方法

1. 点击 VSCode 左侧活动栏的 AutoTest AI 图标
2. 在输入框中输入消息
3. 按 Enter 或点击发送按钮
4. AI 响应会实时流式显示

### 3.3 会话管理

| 操作 | 说明 |
|------|------|
| 点击"新建对话"按钮 | 创建新的空白会话 |
| 点击会话列表项 | 切换到对应的历史会话 |
| 会话自动保存 | 每次对话后自动持久化存储 |

### 3.4 配置要求

在 `.vscode/autotest-config.json` 中配置 AI 服务：

```json
{
  "ai": {
    "provider": "qwen",
    "qwen": {
      "apiKey": "your-qwen-api-key",
      "apiUrl": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      "model": "qwen-turbo"
    },
    "openai": {
      "apiKey": "your-openai-api-key",
      "apiUrl": "https://api.openai.com/v1/chat/completions",
      "model": "gpt-3.5-turbo"
    }
  }
}
```

### 3.5 支持的 AI 提供商和模型

#### QWen (通义千问)

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| qwen-turbo | 快速响应模型 | 日常对话、快速问答 |
| qwen-plus | 增强模型 | 复杂任务、代码生成 |
| qwen-max | 最强模型 | 高质量输出、复杂推理 |
| qwen-max-longcontext | 长上下文模型 | 长文档处理 |

#### OpenAI

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| gpt-3.5-turbo | 快速响应模型 | 日常对话、快速问答 |
| gpt-3.5-turbo-16k | 长上下文模型 | 中等长度文档 |
| gpt-4 | 高级模型 | 复杂推理、代码生成 |
| gpt-4-32k | 超长上下文模型 | 长文档处理 |
| gpt-4-turbo | 最新模型 | 最新功能支持 |

### 3.6 Markdown 渲染支持

AI 响应支持以下 Markdown 语法：

| 语法 | 示例 |
|------|------|
| 标题 | `# 一级标题` `## 二级标题` `### 三级标题` |
| 加粗 | `**加粗文本**` |
| 斜体 | `*斜体文本*` |
| 代码块 | ` ```语言\n代码\n``` ` |
| 行内代码 | `` `代码` `` |
| 链接 | `[链接文本](URL)` |
| 列表 | `- 列表项` 或 `* 列表项` |
| 引用 | `> 引用内容` |
| 分割线 | `---` |

## 4. 日志监控功能

### 4.1 功能说明

日志监控功能允许用户查看远程服务器上的日志文件列表，并下载到本地进行分析。支持多目录监控、子目录浏览，以及通过配置自动关联项目环境。

### 4.2 项目关联（多工程环境）

当日志目录配置了 `projectName` 字段时，插件会自动关联到对应项目，使用该项目的服务器配置进行日志获取和下载：

1. **自动关联**：在日志目录配置中指定 `projectName`，自动使用对应项目的服务器
2. **独立下载路径**：关联项目的日志会下载到项目配置的 `downloadPath`
3. **灵活配置**：不同日志目录可以关联不同项目，实现多环境日志统一管理

### 4.3 使用方法

1. 打开 VSCode 资源管理器
2. 找到"日志监控"面板（位于文件、大纲、时间线下方）
3. 展开配置的日志目录（关联项目的目录会显示项目名称）
4. 点击日志文件进行下载

### 4.4 配置要求

> **⚠️ 路径配置说明**：所有目录路径必须使用绝对路径
> - `directories[].path`: 远程服务器绝对路径，如 `/var/log/myapp`
> - `downloadPath`: 本地绝对路径，如 `D:\downloads`

#### 项目级别日志配置

日志配置现在位于每个项目内部，每个项目可以有独立的日志目录和下载路径：

```json
{
  "projects": [
    {
      "name": "项目A",
      "localPath": "D:\\projectA",
      "server": { "host": "192.168.1.100", ... },
      "commands": [...],
      "logs": {
        "directories": [
          { "name": "应用日志", "path": "/var/log/projectA/app" },
          { "name": "测试日志", "path": "/var/log/projectA/test" }
        ],
        "downloadPath": "D:\\downloads\\projectA"
      }
    },
    {
      "name": "项目B",
      "localPath": "D:\\projectB",
      "server": { "host": "192.168.1.200", ... },
      "commands": [...],
      "logs": {
        "directories": [
          { "name": "应用日志", "path": "/var/log/projectB/app" }
        ],
        "downloadPath": "D:\\downloads\\projectB"
      }
    }
  ],
  "refreshInterval": 5000
}
```

#### 配置说明

| 字段 | 说明 |
|------|------|
| `logs.directories[].name` | 日志目录显示名称 |
| `logs.directories[].path` | 远程服务器上的日志目录路径 |
| `logs.downloadPath` | 日志下载保存路径（本地绝对路径） |
| `refreshInterval` | 全局自动刷新间隔（毫秒），设为 0 禁用自动刷新，与项目独立 |

### 4.5 日志列表显示

```
日志监控                    [↻] [🔄] [⚙️]
├── 项目A - 应用日志
│   ├── app.log        1.2 MB | 2024/1/15 10:30:00
│   └── error.log      256 KB | 2024/1/15 09:15:00
├── 项目A - 测试日志
│   └── test.log       512 KB | 2024/1/15 11:00:00
├── 项目B - 应用日志
│   └── app.log        800 KB | 2024/1/15 10:00:00
└── 项目B - 测试日志
    └── system.log     2.1 MB | 2024/1/15 12:00:00
```

### 4.6 操作说明

| 操作 | 说明 |
|------|------|
| 点击刷新按钮 (↻) | 重新获取日志列表 |
| 点击刷新配置按钮 (🔄) | 重新加载配置文件 |
| 点击打开配置按钮 (⚙️) | 打开配置文件编辑 |
| 点击日志文件 | 下载到本地（自动使用项目配置的下载路径） |

### 4.7 自动刷新配置

日志刷新采用简化机制：

1. **全局刷新**：通过 `refreshInterval` 配置控制，与项目独立
   - 设置为正数时，按指定间隔自动刷新所有项目的日志列表
   - 设置为 0 时，禁用自动刷新，仅支持手动刷新

2. **命令触发刷新**：执行用例完成后会自动刷新对应项目的日志列表

## 5. 修改监控

### 5.1 功能说明

修改监控功能基于 Git 检测项目中的变更文件，支持一键上传所有修改文件，大大提高开发效率。

### 5.2 功能特性

- **以项目为单位监控**：每个项目独立检测其 `localPath` 下的 Git 变更
- **自动过滤非Git项目**：未使用 Git 管理的项目不会显示在监控列表中
- **仅监控文件变更**：自动过滤目录变更，只显示文件级别的变更
- **中文文件名支持**：正确显示中文文件名，无乱码
- **自动检测变更**：基于 `git status` 自动检测新增、修改、删除、重命名的文件
- **按项目分组**：变更文件按项目自动分组显示
- **扁平化显示**：变更文件直接显示完整相对路径（如 `src/utils/helper.ts`），不展示目录层级结构
- **项目级别上传**：点击项目节点的上传按钮，仅上传该项目的变更文件
- **删除确认**：检测到删除文件时，弹窗确认是否同步删除远程文件
- **单文件操作**：支持单独上传某个变更文件或打开文件查看

### 5.3 使用方法

1. 在资源管理器中找到 **修改监控** 面板（位于日志监控上方）
2. 展开 **修改监控** 查看当前所有变更文件
3. 点击工具栏的 **上传按钮** (☁️) 一键上传所有变更
4. 如有删除的文件，系统会弹窗确认是否同步删除远程文件

### 5.4 变更类型说明

| 图标 | 类型 | 说明 | 操作 |
|------|------|------|------|
| 🟢 + | 新增 | 新创建的文件 | 可上传 |
| 🟡 ✎ | 修改 | 已修改的文件 | 可上传 |
| 🔴 🗑 | 删除 | 已删除的文件 | 需确认后删除远程 |
| 🔵 → | 重命名 | 重命名的文件 | 可上传 |

### 5.5 项目级别监控说明

修改监控以项目为单位进行检测：

1. **独立检测**：每个项目在其 `localPath` 目录下独立执行 `git status`
2. **Git仓库过滤**：只有使用 Git 管理的项目才会显示变更
3. **空项目隐藏**：没有变更的项目不会显示在列表中

### 5.6 显示格式

```
修改监控                    [↻]
├── 项目A (3 个变更)           [☁️]
│   ├── src/core/main.ts          修改
│   ├── src/utils/helper.ts       新增
│   └── test/main.test.ts         修改
└── 项目B (2 个变更)           [☁️]
    ├── README.md                 修改
    └── config.json               新增
```

> **说明**：
> - 变更文件直接显示相对于项目 `localPath` 的路径，不展示目录层级结构
> - 每个项目节点右侧有上传按钮（☁️），点击仅上传该项目的变更

### 5.7 项目级别上传

**重要**：上传操作是针对单个项目的，不会影响其他项目。

1. **上传项目变更**：点击项目节点右侧的上传按钮（☁️）
2. **上传单个文件**：右键点击变更文件，选择"上传此文件"
3. **删除确认**：仅针对当前项目的删除文件进行确认

### 5.8 删除文件处理流程

当检测到删除的文件时：

1. 弹出确认对话框，显示当前项目的删除文件列表
2. 用户选择：
   - **是，同步删除**：上传其他变更文件，并删除远程对应的文件
   - **否，仅上传修改的文件**：仅上传新增和修改的文件，保留远程已删除的文件
   - **取消**：取消本次操作

### 5.9 工具栏操作

| 按钮 | 功能 |
|------|------|
| ↻ 刷新 | 重新检测所有项目的 Git 变更 |

### 5.10 项目节点操作

| 按钮/菜单 | 功能 |
|------|------|
| ☁️ 上传 | 上传此项目的所有变更文件 |

### 5.11 文件节点操作

| 菜单 | 功能 |
|------|------|
| 上传此文件 | 仅上传选中的变更文件 |
| 打开文件 | 在编辑器中打开该文件 |

## 6. 快捷命令

### 6.1 功能说明

快捷命令模块提供快速执行预定义命令的能力，无需选择文件即可执行。

### 6.2 功能特性

- **按项目分组**：命令按项目分组显示
- **智能过滤**：自动过滤以下命令：
  - `selectable: true` 的命令（用于右键菜单选择）
  - 包含变量的命令（如 `{filePath}`）
- **一键执行**：点击命令即可在远程服务器执行

### 6.3 命令配置说明

命令配置新增 `selectable` 属性：

```json
{
  "commands": [
    {
      "name": "构建项目",
      "executeCommand": "npm run build",
      "selectable": false
    },
    {
      "name": "运行测试",
      "executeCommand": "pytest {filePath} -v",
      "selectable": true
    }
  ]
}
```

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name | string | 必填 | 命令名称 |
| executeCommand | string | 必填 | 要执行的命令 |
| selectable | boolean | false | 是否为可选命令（用于右键菜单） |

### 6.4 命令显示规则

| 条件 | 快捷命令面板 | 右键菜单 |
|------|-------------|----------|
| `selectable: false` 或未设置 + 无变量 | ✓ 显示 | ✗ 不显示 |
| `selectable: true` + 有变量 | ✗ 不显示 | ✓ 显示（选择文件后） |
| 有变量 + `selectable: false` | ✗ 不显示 | ✗ 不显示 |

### 6.5 使用方法

1. 在资源管理器中找到 **快捷命令** 面板（位于修改监控上方）
2. 展开项目节点查看可用命令
3. 点击命令右侧的执行按钮（▶️）或双击命令执行

### 6.6 显示格式

```
快捷命令                    [↻]
├── 项目A (2 个命令)
│   ├── 构建项目              ▶️
│   └── 部署服务              ▶️
└── 项目B (1 个命令)
    └── 运行测试              ▶️
```

### 6.7 工具栏操作

| 按钮 | 功能 |
|------|------|
| ↻ 刷新 | 重新加载所有项目的快捷命令 |

## 7. 文件上传与用例运行

### 7.1 功能概览

AutoTest 提供三种文件操作方式：

| 功能 | 描述 | 入口 |
|------|------|------|
| 运行 | 上传文件/目录并执行测试命令 | 右键菜单 |
| 上传文件 | 仅上传文件/目录，不执行命令 | 右键菜单 |
| 同步文件 | 从远程服务器下载文件/目录到本地 | 右键菜单 |

### 6.2 运行

#### 6.2.1 功能说明

将文件上传到远程服务器，并自动执行配置的测试命令。支持单文件和目录操作。

#### 6.2.2 使用方法

1. 在资源管理器中右键点击文件或目录
2. 选择 **AutoTest: 运行**
3. 如果工程配置了多个命令，选择要执行的命令
4. 等待上传和命令执行完成
5. 输出显示在 "TestOutput" OutputChannel

#### 6.2.3 文件操作

- **单文件**：上传该文件并执行命令
- **目录**：遍历目录下所有文件（排除隐藏目录和 `node_modules`），逐个上传并执行命令

### 6.3 上传文件

#### 6.3.1 功能说明

仅上传文件到远程服务器，不执行任何命令。适用于需要先上传多个文件后再手动执行的场景。

#### 6.3.2 使用方法

1. 在资源管理器中右键点击文件或目录
2. 选择 **AutoTest: 上传文件**
3. 等待上传完成

### 6.4 同步文件

#### 6.4.1 功能说明

从远程服务器下载文件或目录到本地。根据本地路径自动匹配对应的项目配置，使用项目的服务器信息进行下载。

#### 6.4.2 使用方法

1. 在资源管理器中右键点击文件或目录
2. 选择 **AutoTest: 同步文件**
3. 等待下载完成

#### 6.4.3 文件操作

- **单文件**：从远程服务器下载该文件到本地
- **目录**：递归下载整个目录（包括所有子目录和文件）

#### 6.4.4 路径映射

同步功能使用与上传相同的路径映射逻辑：
- 本地路径 `D:\project\tests\test.py` 
- 映射到远程路径 `/tmp/autotest/tests/test.py`
- 同步时从远程路径下载到本地路径

### 6.5 多工程配置示例

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
        "privateKeyPath": "",
        "remoteDirectory": "/tmp/projectA"
      },
      "commands": [
        {
          "name": "运行测试",
          "executeCommand": "pytest {filePath} -v",
          "includePatterns": ["ERROR", "FAILED", "PASSED"],
          "excludePatterns": [],
          "colorRules": [
            { "pattern": "ERROR|FAILED|FAIL", "color": "red" },
            { "pattern": "PASSED|SUCCESS", "color": "green" },
            { "pattern": "WARNING|WARN", "color": "yellow" }
          ]
        },
        {
          "name": "运行覆盖率",
          "executeCommand": "pytest {filePath} --cov",
          "includePatterns": ["ERROR", "FAILED", "%"],
          "excludePatterns": []
        }
      ]
    },
    {
      "name": "项目B",
      "localPath": "D:\\projectB",
      "enabled": true,
      "server": {
        "host": "192.168.1.200",
        "port": 22,
        "username": "test",
        "password": "",
        "privateKeyPath": "C:\\Users\\test\\.ssh\\id_rsa",
        "remoteDirectory": "/home/test/projectB"
      },
      "commands": [
        {
          "name": "执行用例",
          "executeCommand": "python {filePath}",
          "includePatterns": ["error", "failed", "OK"],
          "excludePatterns": ["traceback", "File"]
        }
      ]
    }
  ],
  "ai": {
    "provider": "qwen",
    "qwen": {
      "apiKey": "your-qwen-api-key",
      "apiUrl": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      "model": "qwen-turbo"
    },
    "openai": {
      "apiKey": "your-openai-api-key",
      "apiUrl": "https://api.openai.com/v1/chat/completions",
      "model": "gpt-3.5-turbo"
    }
  },
  "logs": {
    "directories": [
      { "name": "应用日志", "path": "/var/log/myapp" },
      { "name": "测试日志", "path": "/var/log/autotest" }
    ],
    "downloadPath": "D:\\downloads",
    "refreshInterval": 5000
  }
}
```

### 6.6 命令变量

执行命令支持以下变量替换：

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `{filePath}` | 远程文件完整路径 | `/tmp/autotest/tests/test_example.py` |
| `{fileName}` | 远程文件名 | `test_example.py` |
| `{fileDir}` | 远程文件所在目录 | `/tmp/autotest/tests` |
| `{localPath}` | 本地文件完整路径 | `D:\project\tests\test_example.py` |
| `{localDir}` | 本地文件所在目录 | `D:\project\tests` |
| `{localFileName}` | 本地文件名 | `test_example.py` |
| `{remoteDir}` | 远程工程目录 | `/tmp/autotest` |

### 6.7 输出过滤与颜色渲染

命令执行支持输出过滤和颜色渲染功能。

#### 6.7.1 过滤配置

| 配置项 | 说明 |
|--------|------|
| `includePatterns` | 只显示匹配这些模式的行（数组为空时显示所有行） |
| `excludePatterns` | 排除匹配这些模式的行 |

过滤使用正则表达式匹配，大小写不敏感。

#### 6.7.2 颜色渲染

| 配置项 | 说明 |
|--------|------|
| `colorRules` | 颜色规则数组，定义匹配模式和对应颜色 |

**支持的颜色**：
- `red` - 红色（错误、失败）
- `green` - 绿色（成功、通过）
- `yellow` - 黄色（警告）
- `blue` - 蓝色
- `cyan` - 青色（调试信息）
- `magenta` - 品红色
- `white` - 白色
- `gray` - 灰色

**颜色规则示例**：
```json
{
  "colorRules": [
    { "pattern": "ERROR|FAILED|error|fail", "color": "red" },
    { "pattern": "PASSED|SUCCESS|ok", "color": "green" },
    { "pattern": "WARNING|WARN|warn", "color": "yellow" },
    { "pattern": "DEBUG|debug", "color": "cyan" }
  ]
}
```

#### 6.7.3 默认颜色规则

如果不配置 `colorRules`，系统使用以下默认规则：

| 模式 | 颜色 |
|------|------|
| `[info]`, `[INFO]`, `INFO` | 绿色 |
| `[error]`, `[ERROR]`, `ERROR`, `error`, `Error` | 红色 |
| `[warn]`, `[WARNING]`, `WARN`, `WARNING` | 黄色 |
| `[debug]`, `[DEBUG]`, `DEBUG` | 青色 |
| `[fail]`, `[FAIL]`, `FAILED`, `failed`, `Fail` | 红色 |
| `[success]`, `[SUCCESS]`, `PASSED`, `passed`, `Success` | 绿色 |

### 6.8 常用测试框架配置

**Python pytest**:
```json
{
  "name": "运行测试",
  "executeCommand": "cd {remoteDir} && pytest {filePath} -v",
  "includePatterns": ["ERROR", "FAILED", "PASSED", "test_"],
  "excludePatterns": [],
  "colorRules": [
    { "pattern": "ERROR|FAILED|FAIL", "color": "red" },
    { "pattern": "PASSED", "color": "green" }
  ]
}
```

**JavaScript Jest**:
```json
{
  "name": "运行测试",
  "executeCommand": "cd {remoteDir} && npx jest {filePath} --coverage=false",
  "includePatterns": ["PASS", "FAIL", "✓", "✕"],
  "excludePatterns": [],
  "colorRules": [
    { "pattern": "FAIL|✕", "color": "red" },
    { "pattern": "PASS|✓", "color": "green" }
  ]
}
```

**Java Maven**:
```json
{
  "name": "运行测试",
  "executeCommand": "cd {remoteDir} && mvn test -Dtest={fileName}",
  "filterPatterns": ["Tests run:", "FAILURE", "ERROR"],
  "filterMode": "include"
}
```

## 6. 输出通道

插件使用两个独立的输出通道：

| 通道名称 | 用途 |
|----------|------|
| AutoTest | 插件自身日志、调试信息 |
| TestOutput | 用例执行时的命令输出 |

## 7. 配置文件说明

### 7.1 配置文件位置

```
{workspace}/.vscode/autotest-config.json
```

或

```
{workspace}/autotest-config.json
```

### 7.2 配置动态刷新

插件支持配置文件的动态刷新，无需重启插件：

**自动刷新**：
- 修改配置文件后，插件会自动检测并刷新配置
- 刷新成功后会显示提示消息

**手动刷新**：
- 在日志监控视图工具栏点击刷新配置按钮 (🔄)
- 或使用命令面板执行 `AutoTest: 刷新配置`

**打开配置文件**：
- 在日志监控视图工具栏点击打开配置按钮 (⚙️)
- 或使用命令面板执行 `AutoTest: 打开配置文件`

### 7.3 完整配置示例

```json
{
  "projects": [
    {
      "name": "项目名称",
      "localPath": "D:\\project",
      "enabled": true,
      "server": {
        "host": "192.168.1.100",
        "port": 22,
        "username": "root",
        "password": "",
        "privateKeyPath": "",
        "remoteDirectory": "/tmp/autotest"
      },
      "commands": [
        {
          "name": "运行测试",
          "executeCommand": "pytest {filePath} -v",
          "includePatterns": ["ERROR", "FAILED", "Exception"],
          "excludePatterns": []
        }
      ],
      "logs": {
        "directories": [
          { "name": "应用日志", "path": "/var/log/myapp" },
          { "name": "测试日志", "path": "/var/log/autotest" }
        ],
        "downloadPath": "D:\\downloads",
        "refreshInterval": 5000
      }
    }
  ],
  "ai": {
    "provider": "qwen",
    "qwen": {
      "apiKey": "your-qwen-api-key",
      "apiUrl": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      "model": "qwen-turbo"
    },
    "openai": {
      "apiKey": "your-openai-api-key",
      "apiUrl": "https://api.openai.com/v1/chat/completions",
      "model": "gpt-3.5-turbo"
    }
  }
}
```

### 7.4 配置项说明

#### projects 配置（多工程）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 工程名称 |
| localPath | string | 本地工程路径，**必须使用绝对路径**，用于路径匹配 |
| enabled | boolean | 是否启用该工程 |
| server | object | 服务器配置 |
| commands | array | 命令配置数组 |
| logs | object | 日志配置（项目级别） |

#### server 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| host | string | 服务器地址 |
| port | number | SSH 端口 |
| username | string | 用户名 |
| password | string | 密码（密码认证） |
| privateKeyPath | string | 私钥路径（密钥认证，优先于密码） |
| remoteDirectory | string | 远程工作目录 |

#### commands 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 命令名称，用于选择框显示 |
| executeCommand | string | 要执行的命令（支持变量） |
| filterPatterns | string[] | 过滤正则表达式数组 |
| filterMode | string | 过滤模式: include/exclude |

#### ai 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| provider | string | AI 提供商: qwen/openai |
| qwen.apiKey | string | QWen API Key |
| qwen.apiUrl | string | QWen API URL |
| qwen.model | string | QWen 模型名称 (默认: qwen-turbo) |
| openai.apiKey | string | OpenAI API Key |
| openai.apiUrl | string | OpenAI API URL |
| openai.model | string | OpenAI 模型名称 (默认: gpt-3.5-turbo) |

#### logs 配置

| 字段 | 类型 | 说明 |
|------|------|------|
| directories | array | 监控目录列表 |
| directories[].name | string | 目录显示名称 |
| directories[].path | string | 远程目录路径 |
| downloadPath | string | 本地下载路径，**必须使用绝对路径** |
| refreshInterval | number | 刷新间隔(毫秒)，0 表示禁用自动刷新 |

### 7.5 向后兼容

插件支持旧版配置格式自动转换：

```json
{
  "server": { ... },
  "command": { ... },
  "ai": { ... },
  "logs": { ... }
}
```

旧版配置会被自动转换为多工程格式。

## 8. 快捷键

| 操作 | 快捷键 |
|------|--------|
| 打开命令面板 | Ctrl+Shift+P |
| 发送消息 | Enter |

## 9. 故障排除

### 9.1 AI 对话无响应

- 检查 API Key 是否配置
- 检查模型名称是否正确
- 检查网络连接
- 查看 AutoTest 输出通道中的错误信息

### 9.2 日志列表为空

- 检查服务器连接配置
- 检查日志目录是否存在
- 检查 SSH 连接是否正常

### 9.3 文件上传失败

- 检查 remoteDirectory 配置是否正确
- 检查服务器是否运行
- 检查 SSH 认证配置（密码或私钥）

### 9.4 命令执行失败

- 检查 executeCommand 配置是否正确
- 检查命令变量是否正确使用
- 查看 TestOutput 输出通道中的错误信息

### 9.5 路径匹配失败

- 检查工程的 localPath 是否正确配置
- 确保 localPath 使用绝对路径
- 检查工程是否被启用
- 检查是否存在路径冲突导致工程被禁用

## 10. 未来规划

### 10.1 Agent 模式

计划支持 AI Agent 模式，允许 AI 自动执行任务：
- 自动分析日志
- 自动执行测试
- 自动生成报告

### 10.2 更多 AI 提供商

计划支持更多 AI 服务：
- Claude
- 本地模型
- 自定义 API

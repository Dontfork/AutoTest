# RemoteTest

一款 VSCode 插件，简化测试工作流程，提供文件上传、命令执行、日志监控和 AI 对话功能。

## 功能特性

- **多工程多环境**: 独立的服务器、命令和日志配置
- **文件上传/同步**: 右键菜单操作，支持单文件和目录
- **快捷命令**: 快速执行预定义命令
- **修改监控**: 基于 Git 检测变更，一键上传
- **日志监控**: 实时查看和下载远程日志
- **AI 对话**: 多模型支持，流式输出，Markdown 渲染

## 快速开始

### 安装

```bash
npm install
npm run webpack-dev
```

### 调试

按 F5 启动调试，在新窗口中测试插件。

### 打包

```bash
npm run package
vsce package
```

## 配置

在项目根目录创建 `.vscode/RemoteTest-config.json`：

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
        { "name": "运行测试", "executeCommand": "pytest {filePath} -v" }
      ],
      "logs": {
        "directories": [
          { "name": "应用日志", "path": "/var/log/myapp" }
        ],
        "downloadPath": "D:\\downloads"
      }
    }
  ],
  "ai": {
    "models": [
      { "name": "qwen-turbo", "provider": "qwen", "apiKey": "your-api-key" }
    ],
    "defaultModel": "qwen-turbo"
  }
}
```

## 使用

| 操作 | 入口 |
|------|------|
| 运行用例 | 右键文件 → RemoteTest: 运行 |
| 上传文件 | 右键文件 → RemoteTest: 上传文件 |
| 同步文件 | 右键文件 → RemoteTest: 同步文件 |
| 快捷命令 | 资源管理器 → 快捷命令面板 |
| 修改监控 | 资源管理器 → 修改监控面板 |
| 日志监控 | 资源管理器 → 日志监控面板 |
| AI 对话 | 活动栏 → RemoteTest AI 图标 |

## 文档

- [用户指南](./doc/user_guide.md) - 配置和使用说明
- [设计文档](./doc/design.md) - 系统架构和详细配置

## 目录结构

```
src/
├── ai/           # AI 对话模块
├── config/       # 配置管理
├── core/         # 核心功能（SSH/SCP/命令执行）
├── types/        # 类型定义
├── utils/        # 工具函数
└── views/        # UI 视图
```

## 测试

```bash
npm test
```

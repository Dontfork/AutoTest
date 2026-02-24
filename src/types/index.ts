/**
 * SSH 服务器配置
 */
export interface ServerConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath: string;
    remoteDirectory?: string;
}

/**
 * 命令配置
 */
export interface CommandConfig {
    name: string;
    executeCommand: string;
    includePatterns?: string[];
    excludePatterns?: string[];
    runnable?: boolean;
    clearOutputBeforeRun?: boolean;
}

/**
 * 命令执行时可用的变量
 */
export interface CommandVariables {
    filePath: string;
    fileName: string;
    fileDir: string;
    localPath: string;
    localDir: string;
    localFileName: string;
    remoteDir: string;
}

/**
 * AI 提供商类型
 */
export type AIProviderType = 'qwen' | 'openai';

/**
 * AI 模型配置
 */
export interface AIModelConfig {
    name: string;
    provider?: AIProviderType;
    apiKey?: string;
    apiUrl?: string;
}

/**
 * AI 服务配置
 */
export interface AIConfig {
    models: AIModelConfig[];
    defaultModel?: string;
    proxy?: string;
}

/**
 * 日志目录配置
 */
export interface LogDirectoryConfig {
    name: string;
    path: string;
}

/**
 * 项目日志配置
 */
export interface ProjectLogsConfig {
    directories: LogDirectoryConfig[];
    downloadPath: string;
}

/**
 * 项目配置
 */
export interface ProjectConfig {
    name: string;
    localPath?: string;
    enabled?: boolean;
    server: ServerConfig;
    commands?: CommandConfig[];
    logs?: ProjectLogsConfig;
}

/**
 * RemoteTest 完整配置
 */
export interface RemoteTestConfig {
    projects: ProjectConfig[];
    ai: AIConfig;
    refreshInterval?: number;
    textFileExtensions?: string[];
    clearOutputBeforeRun?: boolean;
    useLogOutputChannel?: boolean;
}

export interface LegacyServerConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    privateKeyPath: string;
    localProjectPath: string;
    remoteDirectory: string;
}

export interface LegacyCommandConfig {
    executeCommand: string;
    filterPatterns: string[];
    filterMode: 'include' | 'exclude';
    includePatterns?: string[];
    excludePatterns?: string[];
}

export interface LegacyLogsConfig {
    directories: LogDirectoryConfig[];
    downloadPath: string;
    refreshInterval: number;
}

export interface LegacyRemoteTestConfig {
    server?: LegacyServerConfig;
    command?: LegacyCommandConfig;
    ai?: AIConfig;
    logs?: LegacyLogsConfig;
    projects?: ProjectConfig[];
}

/**
 * AI 对话消息
 */
export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * AI 响应结果
 */
export interface AIResponse {
    content: string;
    error?: string;
}

/**
 * 聊天会话
 */
export interface ChatSession {
    id: string;
    title: string;
    messages: AIMessage[];
    createdAt: number;
    updatedAt: number;
    mode: AgentMode;
    selectedProjects?: string[];
    plan?: Plan;
    toolCalls?: ToolCallRecord[];
    status?: 'active' | 'completed' | 'failed';
}

export interface LogFile {
    name: string;
    path: string;
    size: number;
    modifiedTime: Date;
    isDirectory: boolean;
}

export interface ProjectMatchResult {
    project: ProjectConfig;
    command?: CommandConfig;
}

export type GitChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'moved';

export interface GitChange {
    path: string;
    relativePath: string;
    displayPath: string;
    type: GitChangeType;
    project: ProjectConfig;
    oldRelativePath?: string;
    oldPath?: string;
}

export interface GitChangeGroup {
    projectName: string;
    project: ProjectConfig;
    changes: GitChange[];
}

export interface QuickCommand {
    name: string;
    executeCommand: string;
    projectName: string;
    project: ProjectConfig;
    clearOutputBeforeRun?: boolean;
}

export interface QuickCommandGroup {
    projectName: string;
    project: ProjectConfig;
    commands: QuickCommand[];
}

/**
 * Agent 工作模式
 * - ask: 只读问答模式，不执行任何操作
 * - plan: 计划审核模式，需要用户确认后执行
 * - react: 自主执行模式，自动决策并执行
 */
export type AgentMode = 'ask' | 'plan' | 'react';

/**
 * 工具风险等级
 */
export type ToolRisk = 'safe' | 'moderate' | 'dangerous';

/**
 * 工具分类
 */
export type ToolCategory = 'file' | 'code' | 'command' | 'log' | 'git' | 'upload' | 'config' | 'custom';

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
    enum?: string[];
    min?: number;
    max?: number;
}

export interface Tool {
    name: string;
    description: string;
    category: ToolCategory;
    risk: ToolRisk;
    parameters: ToolParameter[];
    modes: AgentMode[];
    execute: (params: Record<string, unknown>, context: ToolExecutionContext) => Promise<ToolResult>;
}

export interface ToolExecutionContext {
    project: ProjectConfig;
    sessionId: string;
    workingDirectory?: string;
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
}

export type PlanStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface PlanStep {
    id: string;
    description: string;
    tool: string;
    parameters: Record<string, unknown>;
    status: PlanStepStatus;
    result?: ToolResult;
    dependencies?: string[];
    risk: ToolRisk;
}

export type PlanStatus = 'draft' | 'pending_approval' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface Plan {
    id: string;
    title: string;
    description: string;
    steps: PlanStep[];
    status: PlanStatus;
    createdAt: number;
    updatedAt: number;
    projectId: string;
}

export interface SessionMemory {
    sessionId: string;
    messages: AIMessage[];
    toolCalls: ToolCallRecord[];
    context: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

export interface ToolCallRecord {
    id: string;
    tool: string;
    parameters: Record<string, unknown>;
    result: ToolResult;
    timestamp: number;
    approved: boolean;
}

export interface ToolCallRequest {
    tool: string;
    parameters: Record<string, unknown>;
}

export interface ParsedToolCall {
    found: boolean;
    toolCalls: ToolCallRequest[];
    textContent: string;
    error?: string;
}

export interface PlanRequest {
    title: string;
    description: string;
    steps: Array<{
        description: string;
        tool: string;
        parameters: Record<string, unknown>;
        risk: ToolRisk;
    }>;
}

export interface ParsedPlan {
    found: boolean;
    plan?: PlanRequest;
    textContent: string;
    error?: string;
}

export interface ProjectMemory {
    projectName: string;
    gitCache?: GitStatusCache;
    commandHistory: CommandHistoryEntry[];
    knownErrors: KnownError[];
    lastAccessed: number;
}

export interface GitStatusCache {
    branch: string;
    changedFiles: number;
    stagedFiles: number;
    ahead: number;
    behind: number;
    lastUpdated: number;
}

export interface CommandHistoryEntry {
    commandName: string;
    executeCommand: string;
    exitCode: number;
    timestamp: number;
    outputSummary?: OutputSummary;
}

export interface OutputSummary {
    totalLines: number;
    errorLines: number;
    warningLines: number;
    lastLines: string[];
    errorPatterns?: string[];
    keyFindings?: string[];
}

export interface KnownError {
    pattern: string;
    description: string;
    solution?: string;
    occurrences: number;
    lastSeen: number;
}

export interface UserMemory {
    preferences: UserPreferences;
    trustedTools: string[];
    usageStats: UsageStatistics;
}

export interface UserPreferences {
    defaultMode: AgentMode;
    autoApproveSafeTools: boolean;
    enableThinkingDisplay: boolean;
    preferredModel?: string;
}

export interface UsageStatistics {
    totalConversations: number;
    totalToolCalls: number;
    toolUsageCount: Record<string, number>;
    modeUsageCount: Record<AgentMode, number>;
}

export interface RecentContext {
    lastCommand?: CommandContext;
    lastUpload?: UploadContext;
    gitStatus?: GitStatusContext;
    recentLogs?: LogViewContext[];
    recentOperations?: OperationRecord[];
}

export interface CommandContext {
    timestamp: string;
    project: string;
    commandName: string;
    executeCommand: string;
    exitCode: number;
    duration: number;
    outputSummary: OutputSummary;
    hasError: boolean;
    errorType?: string;
}

export interface UploadContext {
    timestamp: string;
    files: string[];
    project: string;
}

export interface GitStatusContext {
    timestamp: string;
    project: string;
    branch: string;
    changedFiles: number;
    stagedFiles: number;
    ahead: number;
    behind: number;
}

export interface LogViewContext {
    path: string;
    viewedAt: string;
    linesViewed: number;
}

export interface OperationRecord {
    type: 'command' | 'upload' | 'download' | 'log_view' | 'git';
    timestamp: string;
    project: string;
    summary: string;
    success: boolean;
}

export type DebugMode = 'off' | 'basic' | 'verbose' | 'trace';

export interface DebugConfig {
    mode: DebugMode;
    outputDir: string;
    logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
    includePrompts: boolean;
    includeToolCalls: boolean;
}

export interface OutputStorageConfig {
    enabled: boolean;
    maxFileSize: number;
    maxDaysToKeep: number;
    maxRecordsPerCommand: number;
}

export interface AISummaryConfig {
    enabled: boolean;
    threshold: {
        lines: number;
        size: number;
    };
    model: string;
    maxTokens: number;
    timeout: number;
    cacheEnabled: boolean;
    commandTypes: string[];
}

export interface AgentConfig {
    enabled: boolean;
    defaultMode: AgentMode;
    autoApproveSafeTools: boolean;
    maxToolCallsPerConversation: number;
    toolTimeout: number;
    enableThinkingDisplay: boolean;
    rememberProjectSelection: boolean;
    defaultProjects?: string[];
    multiProjectEnabled: boolean;
    debug: DebugConfig;
    outputStorage: OutputStorageConfig;
    aiSummary: AISummaryConfig;
}

export interface CustomToolConfig {
    name: string;
    description: string;
    type: 'command' | 'script';
    config: {
        command?: string;
        script?: string;
        timeout?: number;
    };
    risk: ToolRisk;
    category: ToolCategory;
    parameters: ToolParameter[];
    outputFormat?: {
        successPattern?: string;
        extractFields?: string[];
    };
    constraints?: {
        requiresProject?: boolean;
        maxRetries?: number;
        allowedProjects?: string[];
    };
}

export interface AgentState {
    mode: AgentMode;
    sessionId: string;
    selectedProjects: ProjectConfig[];
    currentPlan?: Plan;
    isExecuting: boolean;
    lastError?: string;
}

export interface PromptVariables {
    currentDate: string;
    currentTime: string;
    userName: string;
    workspacePath: string;
    selectedProjects: ProjectConfig[];
    selectedProjectsCount: number;
    selectedProjectsJson?: string;
    availableTools?: string;
    toolsDescription?: string;
    recentCommands?: CommandHistoryEntry[];
    gitStatus?: GitStatusCache;
    recentContext?: RecentContext;
    lastCommand?: CommandContext;
    lastCommandStatus?: 'success' | 'failed';
    lastCommandOutput?: string;
    lastUpload?: UploadContext;
    recentOperations?: OperationRecord[];
    sessionMemory?: SessionMemory;
    toolCallHistory?: ToolCallRecord[];
    lastToolResult?: ToolResult;
    errorContext?: Record<string, unknown>;
    loopCount?: number;
    maxLoops?: number;
    predefinedCommands?: CommandConfig[];
    gitChanges?: GitChange[];
    recentErrors?: KnownError[];
    projectMemory?: ProjectMemory;
    planTemplates?: PlanTemplate[];
}

export interface PlanTemplateTrigger {
    keywords: string[];
    patterns: string[];
}

export interface PlanTemplate {
    id: string;
    name: string;
    description: string;
    triggers: PlanTemplateTrigger;
    steps: Omit<PlanStep, 'id' | 'status' | 'result'>[];
}

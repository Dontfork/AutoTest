export { AIChatViewProvider } from './aiChatView';
export { MessageHandler } from './messageHandler';
export type { WebviewMessage, SendMessageData, MessageSender } from './messageHandler';
export { getHtmlContent, getStyles, getHtmlStructure, getScript } from './chatTemplate';
export { highlightCode, enhanceMarkdown, registerLanguage, getSupportedLanguages } from './syntaxHighlighter';
export type { SyntaxPattern, LanguagePatterns } from './syntaxHighlighter';
export { ChatStateManager, chatStateManager } from './chatState';
export type { ChatSessionInfo, ModelInfo, ProjectInfo, ChatState, StateChangeListener } from './chatState';

export { LogTreeView, LogTreeItem } from './logTreeView';
export { ChangesTreeView, ChangeTreeItem } from './changesTreeView';
export { QuickCommandsTreeView, QuickCommandItem } from './quickCommandsTreeView';

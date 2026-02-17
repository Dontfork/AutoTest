import * as vscode from 'vscode';

export enum OutputChannelType {
    AUTO_TEST = 'AutoTest',
    TEST_OUTPUT = 'TestOutput'
}

export class OutputChannelManager {
    private static instance: OutputChannelManager;
    private channels: Map<OutputChannelType, vscode.LogOutputChannel>;
    private terminal: vscode.Terminal | null = null;

    private constructor() {
        this.channels = new Map();
    }

    static getInstance(): OutputChannelManager {
        if (!OutputChannelManager.instance) {
            OutputChannelManager.instance = new OutputChannelManager();
        }
        return OutputChannelManager.instance;
    }

    getChannel(type: OutputChannelType): vscode.LogOutputChannel {
        if (!this.channels.has(type)) {
            const channel = vscode.window.createOutputChannel(type, { log: true });
            this.channels.set(type, channel);
        }
        return this.channels.get(type)!;
    }

    getAutoTestChannel(): vscode.LogOutputChannel {
        return this.getChannel(OutputChannelType.AUTO_TEST);
    }

    getTestOutputChannel(): vscode.LogOutputChannel {
        return this.getChannel(OutputChannelType.TEST_OUTPUT);
    }

    getTerminal(): vscode.Terminal {
        if (!this.terminal || this.terminal.exitStatus !== undefined) {
            this.terminal = vscode.window.createTerminal({
                name: 'AutoTest Output',
                iconPath: new vscode.ThemeIcon('terminal')
            });
        }
        return this.terminal;
    }

    showTerminal(): void {
        this.getTerminal().show();
    }

    sendToTerminal(command: string): void {
        const terminal = this.getTerminal();
        terminal.show();
        terminal.sendText(command, true);
    }

    appendLine(message: string, type: OutputChannelType = OutputChannelType.AUTO_TEST): void {
        this.getChannel(type).appendLine(message);
    }

    append(message: string, type: OutputChannelType = OutputChannelType.AUTO_TEST): void {
        this.getChannel(type).append(message);
    }

    show(type: OutputChannelType = OutputChannelType.AUTO_TEST): void {
        this.getChannel(type).show();
    }

    clear(type: OutputChannelType = OutputChannelType.AUTO_TEST): void {
        this.getChannel(type).clear();
    }

    info(message: string, type: OutputChannelType = OutputChannelType.TEST_OUTPUT): void {
        this.getChannel(type).info(message);
    }

    warn(message: string, type: OutputChannelType = OutputChannelType.TEST_OUTPUT): void {
        this.getChannel(type).warn(message);
    }

    error(message: string, type: OutputChannelType = OutputChannelType.TEST_OUTPUT): void {
        this.getChannel(type).error(message);
    }

    dispose(): void {
        for (const channel of this.channels.values()) {
            channel.dispose();
        }
        this.channels.clear();
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
    }
}

export function getOutputChannelManager(): OutputChannelManager {
    return OutputChannelManager.getInstance();
}

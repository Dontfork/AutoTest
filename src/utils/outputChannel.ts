import * as vscode from 'vscode';

export enum OutputChannelType {
    AUTO_TEST = 'AutoTest',
    TEST_OUTPUT = 'TestOutput'
}

export class OutputChannelManager {
    private static instance: OutputChannelManager;
    private logChannel: vscode.LogOutputChannel | null = null;
    private outputChannel: vscode.OutputChannel | null = null;
    private terminal: vscode.Terminal | null = null;

    private constructor() {}

    static getInstance(): OutputChannelManager {
        if (!OutputChannelManager.instance) {
            OutputChannelManager.instance = new OutputChannelManager();
        }
        return OutputChannelManager.instance;
    }

    getAutoTestChannel(): vscode.LogOutputChannel {
        if (!this.logChannel) {
            this.logChannel = vscode.window.createOutputChannel('AutoTest', { log: true });
        }
        return this.logChannel;
    }

    getTestOutputChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('TestOutput');
        }
        return this.outputChannel;
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

    dispose(): void {
        if (this.logChannel) {
            this.logChannel.dispose();
            this.logChannel = null;
        }
        if (this.outputChannel) {
            this.outputChannel.dispose();
            this.outputChannel = null;
        }
        if (this.terminal) {
            this.terminal.dispose();
            this.terminal = null;
        }
    }
}

export function getOutputChannelManager(): OutputChannelManager {
    return OutputChannelManager.getInstance();
}

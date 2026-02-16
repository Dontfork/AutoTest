import * as vscode from 'vscode';

export enum OutputChannelType {
    AUTO_TEST = 'AutoTest',
    TEST_OUTPUT = 'TestOutput'
}

export class OutputChannelManager {
    private static instance: OutputChannelManager;
    private channels: Map<OutputChannelType, vscode.OutputChannel>;

    private constructor() {
        this.channels = new Map();
    }

    static getInstance(): OutputChannelManager {
        if (!OutputChannelManager.instance) {
            OutputChannelManager.instance = new OutputChannelManager();
        }
        return OutputChannelManager.instance;
    }

    getChannel(type: OutputChannelType): vscode.OutputChannel {
        if (!this.channels.has(type)) {
            const channel = vscode.window.createOutputChannel(type);
            this.channels.set(type, channel);
        }
        return this.channels.get(type)!;
    }

    getAutoTestChannel(): vscode.OutputChannel {
        return this.getChannel(OutputChannelType.AUTO_TEST);
    }

    getTestOutputChannel(): vscode.OutputChannel {
        return this.getChannel(OutputChannelType.TEST_OUTPUT);
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

    dispose(): void {
        for (const channel of this.channels.values()) {
            channel.dispose();
        }
        this.channels.clear();
    }
}

export function getOutputChannelManager(): OutputChannelManager {
    return OutputChannelManager.getInstance();
}

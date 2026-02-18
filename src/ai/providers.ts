import axios from 'axios';
import { AIMessage, AIResponse, AIModelConfig, AIProviderType } from '../types';

export interface AIProvider {
    send(messages: AIMessage[]): Promise<AIResponse>;
    sendStream(messages: AIMessage[], onChunk: (chunk: string) => void): Promise<AIResponse>;
}

interface ProviderConfig {
    defaultApiUrl: string;
    buildRequestBody: (model: string, messages: AIMessage[], stream?: boolean) => any;
    parseContent: (data: any) => string;
    parseStreamContent: (data: any) => string;
    extraHeaders?: Record<string, string>;
    streamExtraHeaders?: Record<string, string>;
}

const QWEN_CONFIG: ProviderConfig = {
    defaultApiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    extraHeaders: { 'Accept': 'application/json' },
    streamExtraHeaders: { 'X-DashScope-SSE': 'enable' },
    buildRequestBody: (model, messages, stream) => ({
        model,
        input: { messages: messages.map(m => ({ role: m.role, content: m.content })) },
        parameters: { 
            result_format: 'message',
            ...(stream && { incremental_output: true })
        }
    }),
    parseContent: (data) => String(data?.output?.choices?.[0]?.message?.content ?? ''),
    parseStreamContent: (data) => data?.output?.choices?.[0]?.message?.content || ''
};

const OPENAI_CONFIG: ProviderConfig = {
    defaultApiUrl: 'https://api.openai.com/v1/chat/completions',
    buildRequestBody: (model, messages, stream) => ({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        ...(stream && { stream: true })
    }),
    parseContent: (data) => data?.choices?.[0]?.message?.content || '',
    parseStreamContent: (data) => data?.choices?.[0]?.delta?.content || ''
};

const PROVIDER_CONFIGS: Record<AIProviderType, ProviderConfig> = {
    qwen: QWEN_CONFIG,
    openai: OPENAI_CONFIG
};

function detectProvider(modelName: string): AIProviderType {
    const name = modelName.toLowerCase();
    if (name.includes('qwen')) return 'qwen';
    return 'openai';
}

export function isQwenModel(modelName: string): boolean {
    return modelName.toLowerCase().includes('qwen');
}

export function isOpenAIModel(modelName: string): boolean {
    return modelName.toLowerCase().includes('gpt');
}

export class AIProviderImpl implements AIProvider {
    private config: AIModelConfig;
    private globalProxy?: string;
    private providerConfig: ProviderConfig;

    constructor(config: AIModelConfig, globalProxy?: string) {
        this.config = config;
        this.globalProxy = globalProxy;
        const providerType = config.provider || detectProvider(config.name);
        this.providerConfig = PROVIDER_CONFIGS[providerType];
    }

    private getAxiosConfig(stream?: boolean): any {
        const axiosConfig: any = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                ...this.providerConfig.extraHeaders,
                ...(stream && { 'Accept': 'text/event-stream', ...this.providerConfig.streamExtraHeaders })
            },
            timeout: stream ? 120000 : 60000
        };

        if (this.globalProxy) {
            const [host, port] = this.globalProxy.split(':');
            axiosConfig.proxy = { host, port: parseInt(port || '8080', 10) };
        }

        return axiosConfig;
    }

    async send(messages: AIMessage[]): Promise<AIResponse> {
        const apiUrl = this.config.apiUrl || this.providerConfig.defaultApiUrl;
        const requestBody = this.providerConfig.buildRequestBody(this.config.name, messages);

        try {
            const response = await axios.post(apiUrl, requestBody, this.getAxiosConfig());
            const content = this.providerConfig.parseContent(response.data);
            return { content: content || 'AI 未返回有效响应' };
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 
                            error.response?.data?.error?.message || 
                            error.message || '请求失败';
            return { content: '', error: errorMsg };
        }
    }

    async sendStream(messages: AIMessage[], onChunk: (chunk: string) => void): Promise<AIResponse> {
        try {
            return await this.doStream(messages, onChunk);
        } catch {
            const response = await this.send(messages);
            if (response.content && !response.error) {
                onChunk(response.content);
            }
            return response;
        }
    }

    private async doStream(messages: AIMessage[], onChunk: (chunk: string) => void): Promise<AIResponse> {
        const apiUrl = this.config.apiUrl || this.providerConfig.defaultApiUrl;
        const requestBody = this.providerConfig.buildRequestBody(this.config.name, messages, true);
        const axiosConfig = {
            ...this.getAxiosConfig(true),
            method: 'POST',
            url: apiUrl,
            data: requestBody,
            responseType: 'stream'
        };

        const response = await axios(axiosConfig);

        return new Promise((resolve, reject) => {
            let fullContent = '';
            let buffer = '';
            let hasData = false;

            response.data.on('data', (chunk: Buffer) => {
                hasData = true;
                buffer += chunk.toString('utf-8');
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data:')) continue;
                    const data = line.slice(5).trim();
                    if (data === '[DONE]') continue;
                    
                    try {
                        const json = JSON.parse(data);
                        const content = this.providerConfig.parseStreamContent(json);
                        if (content) {
                            fullContent += content;
                            onChunk(content);
                        }
                    } catch {}
                }
            });

            response.data.on('end', () => {
                if (fullContent || hasData) {
                    resolve({ content: fullContent || 'AI 未返回有效响应' });
                } else {
                    reject(new Error('流式响应无数据'));
                }
            });

            response.data.on('error', reject);
        });
    }
}

export function createProvider(config: AIModelConfig, globalProxy?: string): AIProvider {
    return new AIProviderImpl(config, globalProxy);
}

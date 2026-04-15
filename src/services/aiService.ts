import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIProvider = 'anthropic' | 'deepseek' | 'qwen' | 'kimi' | 'minimax';

export interface AIModel {
  id: string;
  label: string;
  provider: AIProvider;
}

export const AI_PROVIDERS: Record<AIProvider, {
  label: string;
  baseURL?: string;
  helpURL: string;
  keyPlaceholder: string;
  models: AIModel[];
}> = {
  anthropic: {
    label: 'Anthropic Claude',
    helpURL: 'https://console.anthropic.com',
    keyPlaceholder: 'sk-ant-api03-...',
    models: [
      { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5（快速）', provider: 'anthropic' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6（均衡）', provider: 'anthropic' },
    ],
  },
  deepseek: {
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    helpURL: 'https://platform.deepseek.com',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat（推荐）', provider: 'deepseek' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner（推理）', provider: 'deepseek' },
    ],
  },
  qwen: {
    label: '通义千问 Qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    helpURL: 'https://bailian.console.aliyun.com',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'qwen-plus', label: 'Qwen Plus（均衡）', provider: 'qwen' },
      { id: 'qwen-turbo', label: 'Qwen Turbo（快速）', provider: 'qwen' },
      { id: 'qwen-max', label: 'Qwen Max（强力）', provider: 'qwen' },
    ],
  },
  kimi: {
    label: 'Kimi 月之暗面',
    baseURL: 'https://api.moonshot.cn/v1',
    helpURL: 'https://platform.moonshot.cn',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'moonshot-v1-8k', label: 'Moonshot 8K（标准）', provider: 'kimi' },
      { id: 'moonshot-v1-32k', label: 'Moonshot 32K（长文）', provider: 'kimi' },
    ],
  },
  minimax: {
    label: 'MiniMax',
    baseURL: 'https://api.minimaxi.com/v1',
    helpURL: 'https://platform.minimaxi.com',
    keyPlaceholder: 'eyJhbGci...',
    models: [
      { id: 'MiniMax-M2.7', label: 'MiniMax M2.7（最强）', provider: 'minimax' },
      { id: 'MiniMax-M2.7-highspeed', label: 'MiniMax M2.7 高速版', provider: 'minimax' },
      { id: 'MiniMax-M2.5', label: 'MiniMax M2.5（均衡）', provider: 'minimax' },
      { id: 'MiniMax-M2.5-highspeed', label: 'MiniMax M2.5 高速版', provider: 'minimax' },
      { id: 'MiniMax-M2.1', label: 'MiniMax M2.1（轻量）', provider: 'minimax' },
    ],
  },
};

export interface AIConfig {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
}

export function loadAIConfig(): AIConfig {
  const provider = (localStorage.getItem('vpp_ai_provider') as AIProvider | null) ?? 'anthropic';
  const modelId = localStorage.getItem('vpp_ai_model') ?? 'claude-haiku-4-5-20251001';
  // 向下兼容旧 key
  const apiKey =
    localStorage.getItem('vpp_ai_key') ??
    localStorage.getItem('vpp_claude_key') ??
    '';
  return { provider, modelId, apiKey };
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem('vpp_ai_provider', config.provider);
  localStorage.setItem('vpp_ai_model', config.modelId);
  if (config.apiKey) {
    localStorage.setItem('vpp_ai_key', config.apiKey);
  } else {
    localStorage.removeItem('vpp_ai_key');
  }
  // 保持旧 key 同步（其他代码可能仍读取）
  if (config.provider === 'anthropic') {
    if (config.apiKey) localStorage.setItem('vpp_claude_key', config.apiKey);
    else localStorage.removeItem('vpp_claude_key');
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 统一流式 AI 调用，返回 AsyncGenerator<string>（文本增量）
 * 支持 Anthropic 和 OpenAI 兼容接口（DeepSeek、通义千问、Kimi）
 */
export async function* streamAI(
  config: AIConfig,
  system: string,
  messages: ChatMessage[],
  maxTokens = 1024,
): AsyncGenerator<string> {
  const { provider, modelId, apiKey } = config;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const stream = client.messages.stream({
      model: modelId,
      max_tokens: maxTokens,
      system,
      messages,
    });
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
    return;
  }

  // OpenAI 兼容接口
  const providerConf = AI_PROVIDERS[provider];
  const client = new OpenAI({
    apiKey,
    baseURL: providerConf.baseURL,
    dangerouslyAllowBrowser: true,
    timeout: 60_000,
    maxRetries: 1,
  });
  try {
    const stream = await client.chat.completions.create({
      model: modelId,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Connection error') || msg.includes('fetch')) {
      throw new Error(
        `无法连接到 ${providerConf.label} API (${providerConf.baseURL})。` +
        `请检查：1) API Key 是否正确  2) 网络是否可访问该地址  3) 模型ID "${modelId}" 是否有效`,
      );
    }
    throw err;
  }
}

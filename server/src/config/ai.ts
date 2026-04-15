import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export type AIProvider = 'anthropic' | 'deepseek' | 'qwen' | 'kimi' | 'minimax';

export interface AIServerConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
  maxTokens: number;
}

export function getAIConfig(): AIServerConfig {
  return {
    provider: (process.env.AI_PROVIDER as AIProvider) || 'minimax',
    model: process.env.AI_MODEL || 'MiniMax-M2',
    apiKey: process.env.AI_API_KEY || '',
    baseURL: process.env.AI_BASE_URL,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
  };
}

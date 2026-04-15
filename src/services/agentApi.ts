import api from './api';
import { loadAIConfig, streamAI } from './aiService';
import type { ChatMessage } from './aiService';

let _backendAvailable: boolean | null = null;

/** Check if backend is available (cached per session) */
export async function isBackendAvailable(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(2000) });
    _backendAvailable = true;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

/** Reset backend availability check (e.g., on login) */
export function resetBackendCheck(): void {
  _backendAvailable = null;
}

/**
 * Stream chat with agent — tries backend SSE first, falls back to direct LLM
 */
export async function* streamAgentChat(
  agentKey: string,
  messages: ChatMessage[],
  systemPrompt: string,
): AsyncGenerator<string> {
  const backendOk = await isBackendAvailable();

  if (backendOk) {
    const token = localStorage.getItem('vpp_token');
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ agentKey, messages, systemPrompt }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.delta) yield parsed.delta;
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
    return;
  }

  // Fallback: direct LLM call
  const config = loadAIConfig();
  if (!config.apiKey) {
    throw new Error('请先配置 AI API Key（后端未连接，需在知识库页面配置）');
  }
  for await (const chunk of streamAI(config, systemPrompt, messages, 2048)) {
    yield chunk;
  }
}

/**
 * Call agent action — structured JSON response from LLM
 */
export async function callAgentAction<T = unknown>(
  agentKey: string,
  action: string,
  params: Record<string, unknown>,
): Promise<{ success: boolean; data?: T; error?: string }> {
  const backendOk = await isBackendAvailable();
  if (!backendOk) {
    return { success: false, error: 'Backend not available' };
  }

  try {
    const res = await api.post<{ success: boolean; data?: T; error?: string }>(
      '/agent/action',
      { agentKey, action, params },
    );
    return res.data;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Action failed';
    return { success: false, error: errMsg };
  }
}

/**
 * Chat history persistence
 */
export async function loadChatHistory(agentKey: string): Promise<ChatMessage[]> {
  const backendOk = await isBackendAvailable();

  if (backendOk) {
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(`/agent/chat-history/${agentKey}`);
      return res.data.messages || [];
    } catch {
      // fallback to localStorage
    }
  }

  const stored = localStorage.getItem(`vpp_chat_${agentKey}`);
  return stored ? JSON.parse(stored) : [];
}

export async function saveChatHistory(agentKey: string, messages: ChatMessage[]): Promise<void> {
  // Always save to localStorage as backup
  localStorage.setItem(`vpp_chat_${agentKey}`, JSON.stringify(messages));

  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      await api.post(`/agent/chat-history/${agentKey}`, { messages });
    } catch {
      // localStorage already saved as backup
    }
  }
}

export async function clearChatHistory(agentKey: string): Promise<void> {
  localStorage.removeItem(`vpp_chat_${agentKey}`);

  const backendOk = await isBackendAvailable();
  if (backendOk) {
    try {
      await api.delete(`/agent/chat-history/${agentKey}`);
    } catch {
      // ignore
    }
  }
}

/**
 * File upload
 */
export async function uploadAgentFile(
  agentKey: string,
  file: File,
): Promise<{
  success: boolean;
  dataId?: string;
  fileName?: string;
  rowCount?: number;
  columns?: string[];
  preview?: Record<string, unknown>[];
  error?: string;
}> {
  const backendOk = await isBackendAvailable();
  if (!backendOk) {
    return { success: false, error: '文件上传需要后端服务支持' };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('agentKey', agentKey);

  try {
    const res = await api.post('/agent/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Upload failed';
    return { success: false, error: errMsg };
  }
}

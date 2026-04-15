import { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined } from '@ant-design/icons';
import { streamAgentChat, loadChatHistory, saveChatHistory, clearChatHistory } from '../../services/agentApi';
import type { ChatMessage } from '../../services/aiService';
import { useTheme } from '../../context/ThemeContext';

const { TextArea } = Input;

interface Props {
  agentKey: string;
  agentName: string;
  systemPrompt: string;
  suggestions?: string[];
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

export default function AgentChatPanel({ agentKey, agentName, systemPrompt, suggestions = [] }: Props) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory(agentKey).then(history => {
      if (history.length > 0) {
        setMessages(history.map((m, i) => ({
          id: `restored-${i}`,
          role: m.role,
          text: m.content,
          streaming: false,
        })));
      }
    });
  }, [agentKey]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: DisplayMessage = { id: Date.now().toString(), role: 'user', text: text.trim() };
    const assistantMsg: DisplayMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const history: ChatMessage[] = [
      ...messages.map(m => ({ role: m.role, content: m.text })),
      { role: 'user' as const, content: text.trim() },
    ];

    try {
      let accumulated = '';
      for await (const chunk of streamAgentChat(agentKey, history, systemPrompt)) {
        accumulated += chunk;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, text: accumulated } : m)
        );
      }
      setMessages(prev => {
        const finalMessages = prev.map(m =>
          m.id === assistantMsg.id ? { ...m, streaming: false } : m
        );
        // Save chat history after streaming completes
        const chatMessages = finalMessages
          .filter(m => !m.streaming)
          .map(m => ({ role: m.role, content: m.text }));
        saveChatHistory(agentKey, chatMessages);
        return finalMessages;
      });
    } catch (err) {
      setMessages(prev =>
        prev.map(m => m.id === assistantMsg.id
          ? { ...m, text: `调用失败：${err instanceof Error ? err.message : '未知错误'}`, streaming: false }
          : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: colors.bgElevated, borderRadius: 8, border: `1px solid ${colors.primaryBorder}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${colors.primaryBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined style={{ color: colors.primary }} />
          <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 13 }}>{agentName}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<ClearOutlined />}
          onClick={() => { setMessages([]); clearChatHistory(agentKey); }}
          style={{ color: colors.textMuted }}
        >
          清空
        </Button>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{
        flex: 1, overflowY: 'auto', padding: 16, minHeight: 300,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RobotOutlined style={{ fontSize: 36, color: colors.textMuted, marginBottom: 12 }} />
            <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
              向 {agentName} 提问，获取专业分析和建议
            </div>
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {suggestions.map((s, i) => (
                  <Tag
                    key={i}
                    style={{ cursor: 'pointer', fontSize: 12 }}
                    color={colors.primary}
                    onClick={() => send(s)}
                  >
                    {s}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', gap: 8, marginBottom: 16,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? colors.primary : `${colors.primary}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: msg.role === 'user' ? '#fff' : colors.primary, fontSize: 14,
            }}>
              {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </div>
            <div style={{
              maxWidth: '80%', padding: '8px 12px', borderRadius: 8,
              background: msg.role === 'user' ? colors.primary : colors.bgCard,
              color: msg.role === 'user' ? '#fff' : colors.textPrimary,
              fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
              {msg.streaming && <Spin size="small" style={{ marginLeft: 8 }} />}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${colors.primaryBorder}` }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={e => {
              if (!e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={`向${agentName}提问...`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              flex: 1, background: colors.bgCard, borderColor: colors.primaryBorder,
              color: colors.textPrimary, resize: 'none',
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => send(input)}
            loading={loading}
            style={{ alignSelf: 'flex-end' }}
          />
        </div>
      </div>
    </div>
  );
}

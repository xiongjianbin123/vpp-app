import { useState, useEffect, useRef } from 'react';
import {
  Card, Row, Col, Tag, List, Modal, Upload, Button, Badge, Input,
  Statistic, message, Tooltip, Spin,
} from 'antd';
import {
  FileTextOutlined, FilePdfOutlined, FileWordOutlined,
  DeleteOutlined, InboxOutlined, SendOutlined,
  ReloadOutlined, RobotOutlined, UserOutlined, KeyOutlined,
  CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,
  BookOutlined, WechatOutlined, SettingOutlined,
} from '@ant-design/icons';
import { streamAI, loadAIConfig, AI_PROVIDERS } from '../../services/aiService';
import type { AIConfig } from '../../services/aiService';
import AIModelSelector from '../../components/AIModelSelector';
import { getNews } from '../../services/newsService';
import { getWechatBiz, setWechatBiz } from '../../services/wechatNewsService';
import type { NewsItem } from '../../mock/data';
import { generateMockExcerpt, generateMockTags } from '../../mock/data';
import { useTheme } from '../../context/ThemeContext';

const { Dragger } = Upload;
const { TextArea } = Input;

// ─── Types ───────────────────────────────────────────────────────────────────

interface KnowledgeDoc {
  id: string;
  name: string;
  type: 'PDF' | 'Word' | 'TXT' | '其他';
  size: string;
  uploadedAt: string;
  status: 'indexing' | 'indexed' | 'failed';
  excerpt: string;
  tags: string[];
}

interface QAMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  ts: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<NewsItem['category'], string> = {
  '现货市场': '#00d4ff',
  '政策法规': '#ffb800',
  '储能动态': '#00ff88',
  '需求响应': '#a78bfa',
  '价格行情': '#38bdf8',
};

const SUGGESTED_QUESTIONS = [
  '今天有哪些重要的电力市场新闻？',
  '广东现货市场最新价格行情如何？',
  '知识库中有哪些关于合规管理的文档？',
  '储能电站参与调频市场的K值要求是什么？',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(name: string): KnowledgeDoc['type'] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'doc' || ext === 'docx') return 'Word';
  if (ext === 'txt') return 'TXT';
  return '其他';
}


function loadDocs(): KnowledgeDoc[] {
  try {
    return JSON.parse(localStorage.getItem('vpp_knowledge_docs') ?? '[]');
  } catch {
    return [];
  }
}

function saveDocs(docs: KnowledgeDoc[]) {
  localStorage.setItem('vpp_knowledge_docs', JSON.stringify(docs));
}


// ─── RAG System Prompt ────────────────────────────────────────────────────────

function buildSystemPrompt(docs: KnowledgeDoc[], news: NewsItem[]): string {
  const indexed = docs.filter(d => d.status === 'indexed');
  const docSection = indexed.length > 0
    ? indexed.map(d =>
        `### 文档: ${d.name}\n标签: ${d.tags.join(', ')}\n摘要: ${d.excerpt}`
      ).join('\n\n')
    : '（知识库暂无已索引文档）';

  const newsSection = news.map(n =>
    `- [${n.category}] ${n.title}（${n.source}, ${n.date}）: ${n.summary}`
  ).join('\n');

  return `你是广州汇图能源科技（Huitone）虚拟电厂知识库智能问答助手，专注于电力交易、储能管理、VPP运营领域。

## 知识库文档（${indexed.length} 份）
${docSection}

## 今日电力市场资讯（${news.length} 条）
${newsSection}

## 回答规范
- 使用简体中文，专业简洁，重点数据加粗
- 引用知识库文档时使用：[来源: 文档名]
- 引用今日资讯时使用：[资讯: 新闻标题]
- 若知识库无相关内容，如实说明并建议上传相关文档
- 不要编造文档或新闻中不存在的信息`;
}

// Mock response when no API key
function buildMockResponse(q: string, docs: KnowledgeDoc[], news: NewsItem[]): string {
  const ql = q.toLowerCase();
  const indexed = docs.filter(d => d.status === 'indexed');

  if (ql.includes('新闻') || ql.includes('资讯') || ql.includes('今天') || ql.includes('今日')) {
    const top3 = news.slice(0, 3);
    return `今日电力市场重要资讯摘要：\n\n${top3.map((n, i) =>
      `**${i + 1}. ${n.title}**\n[资讯: ${n.title}]\n${n.summary.substring(0, 100)}...\n来源：${n.source}（${n.date}）`
    ).join('\n\n')}\n\n共有 **${news.length}** 条今日资讯，可在左侧面板查看全部内容。`;
  }

  if (ql.includes('价格') || ql.includes('行情') || ql.includes('现货')) {
    const priceNews = news.filter(n => n.category === '现货市场' || n.category === '价格行情');
    if (priceNews.length > 0) {
      return `关于电力现货市场价格的最新资讯：\n\n**${priceNews[0].title}**\n[资讯: ${priceNews[0].title}]\n${priceNews[0].summary}\n\n来源：${priceNews[0].source}（${priceNews[0].date}）`;
    }
  }

  if (ql.includes('文档') || ql.includes('上传') || ql.includes('知识库')) {
    if (indexed.length === 0) {
      return '知识库暂无已索引文档。请在中间面板上传 PDF、Word 或 TXT 格式的内部资料，系统将自动索引后即可进行智能问答。';
    }
    return `知识库当前已索引 **${indexed.length}** 份文档：\n\n${indexed.map(d =>
      `- **${d.name}**（${d.type}，${d.size}）\n  标签：${d.tags.join('、')}`
    ).join('\n')}\n\n可直接提问文档内容，系统将引用相关文档段落回答。`;
  }

  if (ql.includes('k值') || ql.includes('调频') || ql.includes('agc')) {
    return `关于K值与调频市场的相关政策资讯：\n\n[资讯: 能源局明确AGC直控响应时间标准：毫秒级要求写入行业规范]\n\n**K值（综合评分指标）** 是调频辅助服务市场的核心结算参数，由三部分组成：\n- **调节速率评分**（权重40%）：响应速度达标情况\n- **调节精度评分**（权重40%）：实际出力与指令偏差\n- **调节里程评分**（权重20%）：累计调节量完成情况\n\n监管新规要求：**K值 < 0.85** 将被暂停调频资格，AGC响应时延须 ≤ 500ms。`;
  }

  if (ql.includes('合规') || ql.includes('等保') || ql.includes('备案')) {
    return `关于VPP合规要求的最新政策动态：\n\n[资讯: 广东发布VPP聚合商备案管理办法，明确等保三级合规要求]\n\n广东省最新备案要求摘要：\n- 须取得**信息安全等级保护三级认证**\n- 数据传输须采用 **TLS 1.3** 以上加密协议\n- 系统可用率须达到 **99.9%** 以上\n- 现有聚合商须在 **2027年7月1日** 前完成整改\n\n建议上传合规手册文档以获取更详细的内部操作指引。`;
  }

  return `您好！我是汇图能源VPP知识库助手。\n\n当前知识库状态：\n- 已索引文档：**${indexed.length}** 份\n- 今日市场资讯：**${news.length}** 条\n\n您可以询问：\n- 今日电力市场新闻动态\n- 已上传文档的具体内容\n- 电力交易政策法规咨询\n- K值、AGC、现货市场等专业问题\n\n如需接入真实 Claude AI 以获得更准确的回答，请点击右上角 🔑 配置 API Key。`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const { colors: c } = useTheme();

  const cardStyle: React.CSSProperties = {
    background: c.bgCard,
    border: `1px solid ${c.primaryBorderLight}`,
    borderRadius: 12,
    height: '100%',
  };

  const typeIcon = (type: KnowledgeDoc['type']) => {
    if (type === 'PDF') return <FilePdfOutlined style={{ color: '#ff6b6b', fontSize: 16 }} />;
    if (type === 'Word') return <FileWordOutlined style={{ color: c.primary, fontSize: 16 }} />;
    return <FileTextOutlined style={{ color: c.textSecondary, fontSize: 16 }} />;
  };
  // News
  const [news, setNews] = useState<NewsItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('zh-CN'));
  const [bizModalOpen, setBizModalOpen] = useState(false);
  const [bizInput, setBizInput] = useState('');

  const refreshNews = () => {
    getNews().then(data => { setNews(data); setLastRefresh(new Date().toLocaleTimeString('zh-CN')); }).catch(() => {});
  };

  useEffect(() => {
    refreshNews();
  }, []);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Documents
  const [docs, setDocs] = useState<KnowledgeDoc[]>(loadDocs);
  const [uploading, setUploading] = useState(false);

  // QA
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig());
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // QA counter
  const [qaCount, setQaCount] = useState(0);

  // Auto-refresh news every minute
  useEffect(() => {
    const timer = setInterval(refreshNews, 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Document Upload ──────────────────────────────────────────────────────────

  const handleUpload = (file: File) => {
    setUploading(true);
    const newDoc: KnowledgeDoc = {
      id: Date.now().toString(),
      name: file.name,
      type: detectType(file.name),
      size: formatSize(file.size),
      uploadedAt: new Date().toLocaleString('zh-CN'),
      status: 'indexing',
      excerpt: generateMockExcerpt(file.name),
      tags: generateMockTags(file.name),
    };
    const updated = [newDoc, ...docs];
    setDocs(updated);
    saveDocs(updated);
    setUploading(false);

    setTimeout(() => {
      setDocs(prev => {
        const next = prev.map(d => d.id === newDoc.id ? { ...d, status: 'indexed' as const } : d);
        saveDocs(next);
        return next;
      });
      message.success(`${file.name} 索引完成，可开始问答`);
    }, 2000 + Math.random() * 1000);

    return false; // prevent antd default upload
  };

  const handleDeleteDoc = (id: string) => {
    const next = docs.filter(d => d.id !== id);
    setDocs(next);
    saveDocs(next);
  };

  // ── QA Send ──────────────────────────────────────────────────────────────────

  const sendMessage = async (text: string) => {
    if (!text.trim() || thinking) return;
    setInput('');
    setThinking(true);
    setQaCount(prev => prev + 1);

    const userMsg: QAMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      ts: new Date().toLocaleTimeString('zh-CN'),
    };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: QAMessage = {
      id: assistantId,
      role: 'assistant',
      text: '',
      streaming: true,
      ts: new Date().toLocaleTimeString('zh-CN'),
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    if (aiConfig.apiKey) {
      const historyMessages = messages
        .filter(m => !m.streaming)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.text }));
      historyMessages.push({ role: 'user', content: text.trim() });

      try {
        let fullText = '';
        for await (const chunk of streamAI(aiConfig, buildSystemPrompt(docs, news), historyMessages)) {
          fullText += chunk;
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, text: fullText } : m
          ));
        }
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        ));
      } catch (err) {
        const errText = err instanceof Error ? err.message : '请求失败';
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, text: `⚠️ API 请求失败：${errText}`, streaming: false } : m
        ));
      } finally {
        setThinking(false);
      }
      return;
    } else {
      // Mock fallback
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      const mockText = buildMockResponse(text, docs, news);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, text: mockText, streaming: false } : m
      ));
      setThinking(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────────

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\[来源:[^\]]+\]|\[资讯:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: c.primary }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('[来源:')) {
        return <Tag key={i} color="blue" style={{ fontSize: 11, margin: '0 2px' }}>{part.slice(1, -1)}</Tag>;
      }
      if (part.startsWith('[资讯:')) {
        return <Tag key={i} color="cyan" style={{ fontSize: 11, margin: '0 2px' }}>{part.slice(1, -1)}</Tag>;
      }
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>{line}{j < part.split('\n').length - 1 && <br />}</span>
      ));
    });
  };

  const indexedCount = docs.filter(d => d.status === 'indexed').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI Bar */}
      <Row gutter={16}>
        {[
          { label: '已索引文档', value: indexedCount, suffix: '份', color: c.primary },
          { label: '今日市场资讯', value: news.length, suffix: '条', color: '#00ff88' },
          { label: '累计问答次数', value: qaCount, suffix: '次', color: '#a78bfa' },
          { label: '知识库状态', value: '正常运行', suffix: '', color: '#00ff88' },
        ].map((kpi, i) => (
          <Col span={6} key={i}>
            <Card style={{ ...cardStyle, height: 'auto' }}>
              <Statistic
                title={<span style={{ color: c.textDim, fontSize: 12 }}>{kpi.label}</span>}
                value={kpi.value}
                suffix={<span style={{ fontSize: 14, color: c.textMuted }}>{kpi.suffix}</span>}
                valueStyle={{ color: kpi.color, fontSize: 24, fontFamily: 'monospace' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main 3-column */}
      <Row gutter={16} style={{ flex: 1 }}>
        {/* ── Left: News ── */}
        <Col span={8}>
          <Card
            style={cardStyle}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>今日市场资讯</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: c.textDim, fontSize: 11 }}>更新: {lastRefresh}</span>
                  <Tooltip title="手动刷新">
                    <ReloadOutlined
                      style={{ color: c.textDim, cursor: 'pointer', fontSize: 13 }}
                      onClick={refreshNews}
                    />
                  </Tooltip>
                  <Tooltip title={getWechatBiz() ? `公众号已配置: ${getWechatBiz().slice(0, 8)}…` : '配置微信公众号 biz ID'}>
                    <SettingOutlined
                      style={{ color: getWechatBiz() ? '#07c160' : c.textDim, cursor: 'pointer', fontSize: 13 }}
                      onClick={() => { setBizInput(getWechatBiz()); setBizModalOpen(true); }}
                    />
                  </Tooltip>
                </div>
              </div>
            }
          >
            <div style={{ maxHeight: 580, overflowY: 'auto' }}>
              <List
                dataSource={news}
                renderItem={item => (
                  <List.Item
                    style={{
                      padding: '10px 0',
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedNews(item)}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Tag style={{
                          background: `${CATEGORY_COLORS[item.category]}18`,
                          border: `1px solid ${CATEGORY_COLORS[item.category]}44`,
                          color: CATEGORY_COLORS[item.category],
                          fontSize: 10,
                          padding: '0 6px',
                          margin: 0,
                        }}>
                          {item.category}
                        </Tag>
                        <span style={{ color: c.textDim, fontSize: 10 }}>{item.date}</span>
                      </div>
                      <div style={{ color: c.textPrimary, fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: c.textPrimary, textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            {item.title}
                          </a>
                        ) : item.title}
                      </div>
                      <div style={{ color: c.textDim, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {item.source === '虚拟电厂公众号' && (
                          <WechatOutlined style={{ color: '#07c160', fontSize: 12 }} />
                        )}
                        {item.source}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* ── Middle: Documents ── */}
        <Col span={8}>
          <Card
            style={cardStyle}
            title={<span style={{ color: c.primary }}>内部文档库</span>}
          >
            <Spin spinning={uploading}>
              <Dragger
                accept=".pdf,.doc,.docx,.txt"
                beforeUpload={handleUpload}
                fileList={[]}
                showUploadList={false}
                style={{
                  background: c.primaryMuted,
                  border: `1px dashed ${c.primaryBorder}`,
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 24, color: c.primary, marginBottom: 8 }}>
                  <InboxOutlined />
                </p>
                <p style={{ color: c.textSecondary, fontSize: 13, marginBottom: 4 }}>拖拽文件到此处，或点击上传</p>
                <p style={{ color: c.textDim, fontSize: 11 }}>支持 PDF、Word、TXT 格式</p>
              </Dragger>
            </Spin>

            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', color: c.textDim, fontSize: 12, padding: '20px 0' }}>
                暂无文档，上传后可进行智能问答
              </div>
            ) : (
              <div style={{ maxHeight: 430, overflowY: 'auto' }}>
                {docs.map(doc => (
                  <div key={doc.id} style={{
                    padding: '10px 12px',
                    background: c.bgSider,
                    borderRadius: 8,
                    marginBottom: 8,
                    border: `1px solid ${c.borderSubtle}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
                        {typeIcon(doc.type)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: c.textPrimary, fontSize: 12, fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {doc.name}
                          </div>
                          <div style={{ color: c.textDim, fontSize: 11, marginTop: 2 }}>
                            {doc.size} · {doc.uploadedAt}
                          </div>
                          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {doc.tags.map(t => (
                              <Tag key={t} style={{ fontSize: 10, padding: '0 4px', margin: 0, background: c.primaryMuted, border: `1px solid ${c.primaryBorderLight}`, color: c.textSecondary }}>{t}</Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                        {doc.status === 'indexing' && (
                          <Badge status="processing" text={<span style={{ color: '#ffb800', fontSize: 11 }}>索引中</span>} />
                        )}
                        {doc.status === 'indexed' && (
                          <CheckCircleOutlined style={{ color: '#00ff88', fontSize: 14 }} />
                        )}
                        {doc.status === 'failed' && (
                          <CloseCircleOutlined style={{ color: '#ff4d4d', fontSize: 14 }} />
                        )}
                        <DeleteOutlined
                          style={{ color: c.textDim, cursor: 'pointer', fontSize: 13 }}
                          onClick={() => handleDeleteDoc(doc.id)}
                        />
                      </div>
                    </div>
                    {doc.status === 'indexing' && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <SyncOutlined spin style={{ color: '#ffb800', fontSize: 12 }} />
                        <span style={{ color: c.textDim, fontSize: 11 }}>正在向量化文档内容...</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* ── Right: QA ── */}
        <Col span={8}>
          <Card
            style={cardStyle}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>
                  <BookOutlined style={{ marginRight: 6 }} />
                  智能问答
                </span>
                <Tooltip title={aiConfig.apiKey ? `${AI_PROVIDERS[aiConfig.provider].label} · ${aiConfig.modelId}` : '配置 AI 模型以使用真实 AI'}>
                  <Button
                    size="small"
                    icon={<KeyOutlined />}
                    onClick={() => setKeyModalOpen(true)}
                    style={{
                      background: aiConfig.apiKey ? `${c.success}1a` : c.primaryMuted,
                      border: `1px solid ${aiConfig.apiKey ? `${c.success}4d` : c.primaryBorder}`,
                      color: aiConfig.apiKey ? c.success : c.primary,
                    }}
                  >
                    {aiConfig.apiKey ? 'AI已激活' : '配置模型'}
                  </Button>
                </Tooltip>
              </div>
            }
          >
            {/* Message Area */}
            <div style={{ height: 360, overflowY: 'auto', marginBottom: 12, paddingRight: 4 }}>
              {messages.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center' }}>
                  <RobotOutlined style={{ fontSize: 32, color: c.primaryMuted, marginBottom: 8 }} />
                  <div style={{ color: c.textDim, fontSize: 12 }}>基于知识库文档和今日资讯回答您的问题</div>
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <div
                        key={i}
                        onClick={() => sendMessage(q)}
                        style={{
                          background: c.primaryMuted,
                          border: `1px solid ${c.primaryBorderLight}`,
                          borderRadius: 8,
                          padding: '8px 12px',
                          cursor: 'pointer',
                          color: c.textSecondary,
                          fontSize: 12,
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'user' ? c.primaryBorderLight : 'rgba(167,139,250,0.15)',
                    border: `1px solid ${msg.role === 'user' ? c.primaryBorder : 'rgba(167,139,250,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>
                    {msg.role === 'user'
                      ? <UserOutlined style={{ color: c.primary }} />
                      : <RobotOutlined style={{ color: '#a78bfa' }} />
                    }
                  </div>
                  <div style={{
                    maxWidth: '85%',
                    background: msg.role === 'user' ? c.primaryMuted : c.bgSider,
                    border: `1px solid ${msg.role === 'user' ? c.primaryBorder : c.borderSubtle}`,
                    borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    padding: '10px 12px',
                  }}>
                    <div style={{ color: c.textPrimary, fontSize: 12, lineHeight: 1.6 }}>
                      {msg.streaming && msg.text === ''
                        ? <SyncOutlined spin style={{ color: '#a78bfa' }} />
                        : renderMessageText(msg.text)
                      }
                    </div>
                    <div style={{ color: c.textDim, fontSize: 10, marginTop: 4, textAlign: 'right' }}>{msg.ts}</div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <TextArea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="输入问题，回车发送（Shift+Enter 换行）"
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={thinking}
                style={{
                  background: c.bgSider,
                  border: `1px solid ${c.primaryBorder}`,
                  color: c.textPrimary,
                  fontSize: 12,
                  borderRadius: 8,
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || thinking}
                loading={thinking}
                style={{ flexShrink: 0, borderRadius: 8, height: 'auto' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* News Detail Modal */}
      <Modal
        open={!!selectedNews}
        onCancel={() => setSelectedNews(null)}
        footer={null}
        title={
          <div>
            {selectedNews && (
              <Tag style={{
                background: `${CATEGORY_COLORS[selectedNews.category]}18`,
                border: `1px solid ${CATEGORY_COLORS[selectedNews.category]}44`,
                color: CATEGORY_COLORS[selectedNews.category],
                fontSize: 11,
                marginBottom: 8,
              }}>
                {selectedNews.category}
              </Tag>
            )}
            <div style={{ color: c.textPrimary, fontSize: 14, lineHeight: 1.5 }}>
              {selectedNews?.title}
            </div>
          </div>
        }
        styles={{ body: { background: c.bgSider }, header: { background: c.bgSider } }}
        width={560}
      >
        {selectedNews && (
          <div>
            <div style={{ color: c.textDim, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {selectedNews.source === '虚拟电厂公众号' && (
                <WechatOutlined style={{ color: '#07c160', fontSize: 12 }} />
              )}
              {selectedNews.source} · {selectedNews.date}
            </div>
            <div style={{ color: c.textSecondary, fontSize: 13, lineHeight: 1.8 }}>
              {selectedNews.summary}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selectedNews.tags.map(t => (
                <Tag key={t} style={{ fontSize: 11, background: c.primaryMuted, border: `1px solid ${c.primaryBorderLight}`, color: c.textSecondary }}>{t}</Tag>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setSelectedNews(null);
                  sendMessage(`请详细介绍一下这条新闻：${selectedNews.title}`);
                }}
              >
                向AI提问此新闻
              </Button>
              {selectedNews.url && (
                <Button
                  size="small"
                  icon={<WechatOutlined style={{ color: '#07c160' }} />}
                  href={selectedNews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看原文
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* WeChat biz config modal */}
      <Modal
        open={bizModalOpen}
        onCancel={() => setBizModalOpen(false)}
        title={<span><WechatOutlined style={{ color: '#07c160', marginRight: 8 }} />配置微信公众号</span>}
        styles={{ body: { background: c.bgSider }, header: { background: c.bgSider } }}
        footer={[
          <Button key="clear" danger size="small" onClick={() => { setWechatBiz(''); setBizInput(''); setBizModalOpen(false); refreshNews(); }}>
            清除
          </Button>,
          <Button key="cancel" size="small" onClick={() => setBizModalOpen(false)}>取消</Button>,
          <Button key="save" type="primary" size="small" onClick={() => { setWechatBiz(bizInput); setBizModalOpen(false); refreshNews(); message.success('biz ID 已保存，正在刷新资讯…'); }}>
            保存并刷新
          </Button>,
        ]}
        width={480}
      >
        <div style={{ color: c.textSecondary, fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
          填入"虚拟电厂"公众号的 <code>__biz</code> 参数，系统将通过 RSSHub 自动拉取当日最新 2 条文章。
          <br />
          <span style={{ color: c.textDim, fontSize: 12 }}>
            获取方式：在电脑微信中打开该公众号任意文章 → 右键"用浏览器打开" → 复制 URL 中 <code>__biz=</code> 之后 <code>&amp;</code> 之前的值。
          </span>
        </div>
        <Input
          value={bizInput}
          onChange={e => setBizInput(e.target.value)}
          placeholder="例如: MzU3NjcwNDk2OQ=="
          style={{ background: c.bgSider, border: `1px solid ${c.primaryBorder}`, color: c.textPrimary }}
        />
      </Modal>

      <AIModelSelector
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        config={aiConfig}
        onChange={setAiConfig}
      />
    </div>
  );
}

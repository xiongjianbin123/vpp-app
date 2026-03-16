import { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Tag, Tooltip } from 'antd';
import {
  SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined,
  SettingOutlined, CheckCircleOutlined, ApiOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { streamAI, loadAIConfig, AI_PROVIDERS } from '../../services/aiService';
import type { AIConfig } from '../../services/aiService';
import AIModelSelector from '../AIModelSelector';
import { mockDevices, mockTasks } from '../../mock/data';

// ─── 常见问题 ─────────────────────────────────────────────────────
export const SUGGESTED_QUESTIONS = [
  '当前各储能站点的SOC状态如何？',
  '电网储能项目整体运行情况？',
  '今日有哪些设备告警？',
  '当前能源结构出力分布？',
  '正在执行的调度任务有哪些？',
  '本月收益情况如何？',
  '哪些设备当前离线或维护？',
  '各类型设备在线率统计？',
  '电网侧储能总可调容量是多少？',
  '当前系统整体运行状态？',
];

// ─── 类型 ─────────────────────────────────────────────────────────
type ChartBlock =
  | { kind: 'bar'; data: object[]; bars: { key: string; color: string }[]; unit?: string }
  | { kind: 'pie'; data: { name: string; value: number; color: string }[] }
  | { kind: 'kpi'; items: { label: string; value: string; color: string; sub?: string }[] }
  | { kind: 'table'; head: string[]; rows: (string | number)[][] };

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  charts?: ChartBlock[];
  streaming?: boolean;
  source?: 'ai' | 'mock';
  ts: Date;
}

// ─── VPP 系统提示词 ───────────────────────────────────────────────
function buildSystemPrompt(): string {
  const onlineDevices = mockDevices.filter(d => d.status === '在线');
  const alertDevices = mockDevices.filter(d => d.status === '告警');
  const gridStorage = mockDevices.filter(d => d.type === '电网储能');
  const storageWithSoc = mockDevices.filter(d => d.soc !== undefined);

  const deviceSummary = mockDevices.map(d =>
    `  - ${d.id} ${d.name}（${d.type}）状态:${d.status} 容量:${d.capacity}MW 当前功率:${d.currentPower}MW${d.soc !== undefined ? ` SOC:${d.soc}%` : ''} 位置:${d.location}`
  ).join('\n');

  const gridStorageSummary = gridStorage.map(d =>
    `  - ${d.station}（${d.id}）：${d.capacity}MW/${d.energyCapacity}MWh SOC:${d.soc}% 当前:${d.currentPower}MW 公司:${d.company}`
  ).join('\n');

  const taskSummary = mockTasks.map(t =>
    `  - ${t.id} ${t.name} 类型:${t.type} 状态:${t.status} 目标:${t.targetPower}MW 进度:${t.progress}% 收益:¥${(t.reward / 10000).toFixed(1)}万`
  ).join('\n');

  return `你是广州汇图能源科技（Huitone）虚拟电厂（VPP）平台的智能运营助手。
你帮助运营人员通过自然语言查询平台数据、分析运行状态、辅助调度决策。

## 平台实时数据（当前时刻）

### 设备总览
- 总设备数：${mockDevices.length} 台，在线：${onlineDevices.length} 台，告警：${alertDevices.length} 台
- 总装机容量：${mockDevices.reduce((a, d) => a + d.capacity, 0)} MW
- 当前总出力：${onlineDevices.reduce((a, d) => a + d.currentPower, 0).toFixed(1)} MW

### 各设备状态
${deviceSummary}

### 电网侧独立储能项目（${gridStorage.length} 个，全部在线）
${gridStorageSummary}
- 总规模：${gridStorage.reduce((a, d) => a + d.capacity, 0)} MW / ${gridStorage.reduce((a, d) => a + (d.energyCapacity ?? 0), 0)} MWh
- 当前总放电：${gridStorage.reduce((a, d) => a + d.currentPower, 0).toFixed(1)} MW
- 平均SOC：${Math.round(storageWithSoc.reduce((a, d) => a + (d.soc ?? 0), 0) / storageWithSoc.length)}%

### 需求响应任务
${taskSummary}

### 收益数据
- 年度累计收益：¥387.2万
- 本月收益：¥249万（调峰¥135万 / 调频¥72万 / 辅助服务¥42万）
- 已结算：¥41.1万，结算中：¥10.8万，待结算：¥6.3万

### 电网参数
- 当前频率：50.03 Hz（正常范围 50±0.2Hz）
- 母线电压：220.8 V

## 回答规范
- 使用**简体中文**回答，专业简洁
- 关键数字用 **加粗** 标注
- 使用项目符号列表组织信息
- 数值单位要标注（MW、MWh、%、万元等）
- 如有异常情况，给出简短处置建议
- 不要编造平台数据之外的信息`;
}

// ─── Mock 响应引擎（快捷问题用） ──────────────────────────────────
const gridStorage = mockDevices.filter(d => d.type === '电网储能');
const storageDevices = mockDevices.filter(d => d.type === '储能系统' || d.type === '电网储能');
const onlineDevices = mockDevices.filter(d => d.status === '在线');
const alertDevices = mockDevices.filter(d => d.status === '告警');
const offlineDevices = mockDevices.filter(d => d.status !== '在线');

function buildMockResponse(q: string): { text: string; charts?: ChartBlock[] } {
  const lq = q.toLowerCase();

  if (/soc|荷电|储能状态/.test(lq)) {
    const socData = storageDevices.filter(d => d.soc !== undefined).map(d => ({
      name: d.station ?? d.name, SOC: d.soc!,
    }));
    const avg = Math.round(socData.reduce((a, b) => a + b.SOC, 0) / socData.length);
    return {
      text: `当前共 **${storageDevices.length}** 个储能站点在线，平均 SOC **${avg}%**。\n\n` +
        socData.map(d => `• ${d.name}：**${d.SOC}%**${d.SOC < 40 ? '（⚠️ 偏低，建议充电）' : d.SOC > 80 ? '（电量充足）' : ''}`).join('\n'),
      charts: [{ kind: 'bar', data: socData, bars: [{ key: 'SOC', color: '#00d4ff' }], unit: '%' }],
    };
  }

  if (/电网储能|独立储能|各站/.test(lq)) {
    const cap = gridStorage.reduce((a, d) => a + d.capacity, 0);
    const ene = gridStorage.reduce((a, d) => a + (d.energyCapacity ?? 0), 0);
    const pwr = gridStorage.reduce((a, d) => a + d.currentPower, 0);
    return {
      text: `电网侧独立储能 **${gridStorage.length}** 个项目，全部**在线运营**。\n\n• 总功率：**${cap} MW** / 总容量：**${ene} MWh**\n• 当前放电：**${pwr.toFixed(1)} MW**（利用率 ${Math.round(pwr / cap * 100)}%）`,
      charts: [{
        kind: 'table',
        head: ['站点', '规模', '当前功率', 'SOC', '公司'],
        rows: gridStorage.map(d => [d.station ?? d.name, `${d.capacity}MW/${d.energyCapacity}MWh`, `${d.currentPower}MW`, `${d.soc}%`, d.company?.replace(/有限公司|有限$/, '') ?? '-']),
      }],
    };
  }

  if (/告警|异常|故障/.test(lq)) {
    return {
      text: alertDevices.length === 0 ? '当前系统无告警，所有设备运行正常。' :
        `当前 **${alertDevices.length}** 台设备告警：\n\n` +
        alertDevices.map(d => `• **${d.name}**（${d.location}）— ${d.type}`).join('\n') +
        '\n\n建议优先检查通信链路和设备本体状态。',
      charts: [{
        kind: 'kpi', items: [
          { label: '告警', value: String(alertDevices.length), color: '#ff4d4d', sub: '台' },
          { label: '离线', value: String(offlineDevices.filter(d => d.status === '离线').length), color: '#4a5568', sub: '台' },
          { label: '维护', value: String(offlineDevices.filter(d => d.status === '维护').length), color: '#ffb800', sub: '台' },
          { label: '在线', value: String(onlineDevices.length), color: '#00ff88', sub: '台' },
        ],
      }],
    };
  }

  if (/能源结构|出力|发电分布/.test(lq)) {
    const pie = [
      { name: '光伏', value: 38.5, color: '#ffb800' },
      { name: '储能放电', value: 23.7, color: '#00d4ff' },
      { name: '风电', value: 22.1, color: '#00ff88' },
      { name: '柔性负荷', value: 44.2, color: '#a78bfa' },
    ];
    const total = pie.reduce((a, b) => a + b.value, 0);
    return {
      text: `当前总出力 **${total.toFixed(1)} MW**：\n\n` +
        pie.map(d => `• ${d.name}：**${d.value} MW**（${Math.round(d.value / total * 100)}%）`).join('\n'),
      charts: [{ kind: 'pie', data: pie }],
    };
  }

  if (/调度|任务|需求响应/.test(lq)) {
    return {
      text: `调度任务共 **5** 个：执行中 **1**，待响应 **2**，已完成 **2**。\n\n📌 **执行中**：高峰调峰任务-01（T001），目标 50MW，进度 65%，预计收益 ¥12.5万\n\n⏳ **待响应**：频率调节任务-A（14:00）、应急调频任务-B（16:00）\n\n✅ 今日完成累计收益：**¥15.4万**`,
      charts: [{
        kind: 'kpi', items: [
          { label: '执行中', value: '1', color: '#00d4ff', sub: '个' },
          { label: '待响应', value: '2', color: '#ffb800', sub: '个' },
          { label: '已完成', value: '2', color: '#00ff88', sub: '个' },
          { label: '日收益', value: '¥37.1万', color: '#00ff88' },
        ],
      }],
    };
  }

  if (/收益|结算|收入/.test(lq)) {
    const bar = [
      { name: '1月', 调峰: 98, 调频: 52, 辅助服务: 31 },
      { name: '2月', 调峰: 112, 调频: 61, 辅助服务: 28 },
      { name: '3月', 调峰: 135, 调频: 72, 辅助服务: 42 },
    ];
    return {
      text: `年度累计收益 **¥387.2万**，同比增长 **18.3%**。\n\n• 本月：**¥249万**（调峰¥135万 / 调频¥72万 / 辅助¥42万）\n• 已结算：¥41.1万 · 结算中：¥10.8万 · 待结算：¥6.3万\n• 3月环比增长 **20.5%**`,
      charts: [{ kind: 'bar', data: bar, bars: [{ key: '调峰', color: '#00d4ff' }, { key: '调频', color: '#00ff88' }, { key: '辅助服务', color: '#ffb800' }], unit: '千元' }],
    };
  }

  if (/离线|维护|不可用|停机/.test(lq)) {
    const unavail = mockDevices.filter(d => d.status !== '在线');
    return {
      text: `当前 **${unavail.length}** 台设备不在线：\n\n` +
        unavail.map(d => `• **${d.name}**（${d.status}）— ${d.location}，额定 ${d.capacity}MW`).join('\n'),
    };
  }

  if (/在线率|统计|分类|各类型/.test(lq)) {
    const types = ['光伏电站', '储能系统', '电网储能', '风电', '充电桩', '工业负荷'];
    const stat = types.map(t => {
      const all = mockDevices.filter(d => d.type === t);
      const on = all.filter(d => d.status === '在线');
      return { name: t.replace('电站', '').replace('系统', ''), total: all.length, online: on.length, rate: all.length > 0 ? Math.round(on.length / all.length * 100) : 0 };
    }).filter(d => d.total > 0);
    return {
      text: `整体在线率 **${Math.round(onlineDevices.length / mockDevices.length * 100)}%**（${onlineDevices.length}/${mockDevices.length} 台）：\n\n` +
        stat.map(d => `• ${d.name}：${d.online}/${d.total} 台（**${d.rate}%**）`).join('\n'),
      charts: [{ kind: 'bar', data: stat.map(d => ({ name: d.name, 在线率: d.rate })), bars: [{ key: '在线率', color: '#00d4ff' }], unit: '%' }],
    };
  }

  if (/可调容量|装机|总容量|容量/.test(lq)) {
    const gsCap = gridStorage.reduce((a, d) => a + d.capacity, 0);
    const total = 75 + gsCap + 35 + 50 + 83;
    return {
      text: `总可调容量 **${total} MW**：\n\n• 电网储能：**${gsCap} MW**（${Math.round(gsCap / total * 100)}%）\n• 柔性负荷：**83 MW** · 光伏：**75 MW** · 风电：**50 MW** · 用户储能：**35 MW**`,
      charts: [{ kind: 'pie', data: [{ name: '电网储能', value: gsCap, color: '#38bdf8' }, { name: '柔性负荷', value: 83, color: '#a78bfa' }, { name: '光伏', value: 75, color: '#ffb800' }, { name: '风电', value: 50, color: '#00ff88' }, { name: '用户储能', value: 35, color: '#00d4ff' }] }],
    };
  }

  return {
    text: `当前 VPP 平台运行正常 ✅\n\n• 总出力：**${onlineDevices.reduce((a, d) => a + d.currentPower, 0).toFixed(1)} MW** / ${mockDevices.reduce((a, d) => a + d.capacity, 0)} MW\n• 在线设备：**${onlineDevices.length}** 台，告警 **${alertDevices.length}** 台\n• 今日发电量：**1842.6 MWh**，碳减排 **921.3 tCO₂**\n• 电网频率：**50.03 Hz**（正常）\n\n⚠️ 充电桩群-CBD 通信中断，请及时处理。`,
    charts: [{
      kind: 'kpi', items: [
        { label: '当前出力', value: `${onlineDevices.reduce((a, d) => a + d.currentPower, 0).toFixed(0)}MW`, color: '#00d4ff' },
        { label: '在线设备', value: `${onlineDevices.length}台`, color: '#00ff88' },
        { label: '今日电量', value: '1842.6MWh', color: '#ffb800' },
        { label: '频率', value: '50.03Hz', color: '#00ff88' },
      ],
    }],
  };
}

// ─── 图表渲染 ─────────────────────────────────────────────────────
const COLORS = ['#00d4ff', '#00ff88', '#ffb800', '#a78bfa', '#38bdf8', '#fb923c'];

function ChartRenderer({ block }: { block: ChartBlock }) {
  const wrap: React.CSSProperties = {
    background: '#0a0e1a', borderRadius: 10,
    padding: '12px 8px 4px', marginTop: 10,
    border: '1px solid rgba(0,212,255,0.12)',
  };

  if (block.kind === 'kpi') return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {block.items.map(item => (
        <div key={item.label} style={{ background: '#0a0e1a', border: `1px solid ${item.color}30`, borderRadius: 8, padding: '8px 14px', flex: '1 1 90px', minWidth: 80 }}>
          <div style={{ color: '#4a6080', fontSize: 11 }}>{item.label}</div>
          <div style={{ color: item.color, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
          {item.sub && <div style={{ color: '#4a6080', fontSize: 10 }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );

  if (block.kind === 'bar') return (
    <div style={wrap}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={block.data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#4a6080" tick={{ fontSize: 11 }} />
          <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit={block.unit ? ` ${block.unit}` : ''} />
          <RTooltip contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 6, fontSize: 12 }} formatter={(v) => [`${v}${block.unit ?? ''}`, '']} />
          {block.bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {block.bars.map(b => <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  if (block.kind === 'pie') return (
    <div style={wrap}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={block.data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={{ stroke: '#4a6080' }}>
            {block.data.map((entry, i) => <Cell key={i} fill={entry.color ?? COLORS[i % COLORS.length]} />)}
          </Pie>
          <RTooltip contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 6, fontSize: 12 }} formatter={(v) => [`${v} MW`, '']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  if (block.kind === 'table') return (
    <div style={{ ...wrap, padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>{block.head.map(h => <th key={h} style={{ padding: '8px 10px', background: 'rgba(0,212,255,0.08)', color: '#00d4ff', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid rgba(0,212,255,0.15)', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: '7px 10px', color: ci === 0 ? '#00d4ff' : '#aab4c8', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return null;
}

// ─── Markdown 粗体 + 换行渲染 ─────────────────────────────────────
function RenderText({ text }: { text: string }) {
  return (
    <div style={{ lineHeight: 1.75 }}>
      {text.split('\n').map((line, i) => (
        <div key={i} style={{ marginBottom: line === '' ? 4 : 0 }}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} style={{ color: '#fff', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────
interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
}

const INIT_MSG: AIMessage = {
  id: 'init', role: 'assistant', source: 'mock',
  text: '您好！我是 **VPP 智能运营助手** 🤖\n\n配置 Claude API Key 后，我将使用真实 AI 理解并回答您的问题；未配置时使用内置知识库快速响应。\n\n请从下方选择常见问题，或直接输入您的问题：',
  ts: new Date(),
};

export default function AIAssistant({ open, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([INIT_MSG]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => loadAIConfig());
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasKey = aiConfig.apiKey.length > 10;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // 快捷问题 → Mock 即时响应
  const sendMock = (question: string) => {
    if (thinking) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', text: question, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);
    setTimeout(() => {
      const resp = buildMockResponse(question);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', source: 'mock', text: resp.text, charts: resp.charts, ts: new Date() }]);
      setThinking(false);
    }, 400 + Math.random() * 300);
  };

  // 自由输入 → Claude API 流式响应 / 降级 Mock
  const sendAI = async (question: string) => {
    if (thinking) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', text: question, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    if (!hasKey) {
      // 无 Key → Mock
      setTimeout(() => {
        const resp = buildMockResponse(question);
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', source: 'mock', text: resp.text, charts: resp.charts, ts: new Date() }]);
        setThinking(false);
      }, 500);
      return;
    }

    // 有 Key → 真实 AI 流式
    const msgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: msgId, role: 'assistant', source: 'ai', text: '', streaming: true, ts: new Date() }]);
    setThinking(false);

    try {
      let fullText = '';
      for await (const chunk of streamAI(aiConfig, buildSystemPrompt(), [{ role: 'user', content: question }])) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: `❌ 请求失败：${errMsg}\n\n请检查 API Key 是否有效，或网络是否正常。`, streaming: false } : m
      ));
    }
  };

  return (
    <>
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,rgba(0,212,255,0.3),rgba(0,255,136,0.2))', border: '1px solid rgba(0,212,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RobotOutlined style={{ color: '#00d4ff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ color: '#00d4ff', fontWeight: 700, fontSize: 15 }}>智能问数</div>
                <div style={{ color: '#4a6080', fontSize: 11, fontWeight: 400 }}>VPP AI 运营助手</div>
              </div>
            </div>
            <Tooltip title={hasKey ? `${AI_PROVIDERS[aiConfig.provider].label} · ${aiConfig.modelId}` : '点击配置 AI 模型和 API Key'}>
              <Button
                size="small"
                icon={hasKey ? <CheckCircleOutlined /> : <ApiOutlined />}
                onClick={() => setKeyModalOpen(true)}
                style={{
                  background: hasKey ? 'rgba(0,255,136,0.1)' : 'rgba(255,184,0,0.1)',
                  border: `1px solid ${hasKey ? '#00ff88' : '#ffb800'}`,
                  color: hasKey ? '#00ff88' : '#ffb800',
                  fontSize: 12, borderRadius: 6,
                }}
              >
                {hasKey ? 'AI 已接入' : '配置模型'}
              </Button>
            </Tooltip>
          </div>
        }
        open={open}
        onClose={onClose}
        width={490}
        styles={{
          body: { background: '#0d1526', padding: 0, display: 'flex', flexDirection: 'column' },
          header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.12)' },
          wrapper: { boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' },
        }}
      >
        {/* 消息区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, marginBottom: 16, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: msg.role === 'user' ? 'rgba(0,212,255,0.15)' : 'linear-gradient(135deg,rgba(0,212,255,0.25),rgba(0,255,136,0.15))', border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {msg.role === 'user' ? <UserOutlined style={{ color: '#00d4ff', fontSize: 13 }} /> : <RobotOutlined style={{ color: '#00d4ff', fontSize: 13 }} />}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: '86%' }}>
                <div style={{ background: msg.role === 'user' ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '10px 14px', color: '#d1d9e6', fontSize: 13 }}>
                  <RenderText text={msg.text || (msg.streaming ? '▍' : '')} />
                  {msg.charts?.map((b, i) => <ChartRenderer key={i} block={b} />)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && msg.source === 'ai' && (
                    <span style={{ color: '#00ff88', fontSize: 10, background: 'rgba(0,255,136,0.08)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(0,255,136,0.2)' }}>Claude AI</span>
                  )}
                  {msg.role === 'assistant' && msg.source === 'mock' && (
                    <span style={{ color: '#4a6080', fontSize: 10, background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>知识库</span>
                  )}
                  <span style={{ color: '#2d3748', fontSize: 10 }}>{msg.ts.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}

          {thinking && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(0,212,255,0.25),rgba(0,255,136,0.15))', border: '1px solid rgba(0,212,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RobotOutlined style={{ color: '#00d4ff', fontSize: 13 }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 12px 12px 12px', padding: '12px 16px', color: '#4a6080', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <LoadingOutlined style={{ color: '#00d4ff' }} />
                <span>正在分析数据...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 常见问题 */}
        <div style={{ padding: '10px 16px 6px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8 }}>
            常见运营问题
            <span style={{ marginLeft: 6, color: '#2d3748' }}>（点击即时回答）</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTED_QUESTIONS.map(q => (
              <Tag key={q} style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)', color: '#aab4c8', fontSize: 11, cursor: 'pointer', borderRadius: 6, padding: '2px 8px', margin: 0 }}
                onClick={() => sendMock(q)}>
                {q}
              </Tag>
            ))}
          </div>
        </div>

        {/* 输入框 */}
        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d1526' }}>
          {!hasKey && (
            <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SettingOutlined />
              <span>配置 AI 模型后，输入框将启用真实 AI 对话</span>
              <span style={{ color: '#00d4ff', cursor: 'pointer' }} onClick={() => setKeyModalOpen(true)}>立即配置 →</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onPressEnter={() => { if (input.trim()) sendAI(input.trim()); }}
              placeholder={hasKey ? '用自然语言提问，Claude AI 将实时回答...' : '配置 API Key 后可自由提问（当前使用知识库模式）'}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0', borderRadius: 8, fontSize: 13 }}
              disabled={thinking}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => { if (input.trim()) sendAI(input.trim()); }}
              disabled={!input.trim() || thinking}
              style={{ background: '#00d4ff', border: 'none', color: '#0a0e1a', borderRadius: 8, fontWeight: 600 }}
            />
          </div>
          {hasKey && (
            <div style={{ color: '#4a6080', fontSize: 10, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircleOutlined style={{ color: '#00ff88' }} />
              <span>已接入 {AI_PROVIDERS[aiConfig.provider].label} · 流式输出 · {aiConfig.modelId}</span>
            </div>
          )}
        </div>
      </Drawer>

      <AIModelSelector
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        config={aiConfig}
        onChange={setAiConfig}
      />
    </>
  );
}

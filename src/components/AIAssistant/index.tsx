import { useState, useRef, useEffect } from 'react';
import { Drawer, Input, Button, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { mockDevices } from '../../mock/data';

// ─── 问题建议清单 ───────────────────────────────────────────────
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

// ─── 消息类型定义 ────────────────────────────────────────────────
type ChartBlock =
  | { kind: 'bar'; data: object[]; bars: { key: string; color: string }[]; unit?: string }
  | { kind: 'pie'; data: { name: string; value: number; color: string }[] }
  | { kind: 'radial'; data: { name: string; value: number; fill: string }[] }
  | { kind: 'kpi'; items: { label: string; value: string; color: string; sub?: string }[] }
  | { kind: 'table'; head: string[]; rows: (string | number)[][] };

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  charts?: ChartBlock[];
  ts: Date;
}

// ─── 响应引擎 ────────────────────────────────────────────────────
const storageDevices = mockDevices.filter(d => d.type === '储能系统' || d.type === '电网储能');
const gridStorage = mockDevices.filter(d => d.type === '电网储能');
const onlineDevices = mockDevices.filter(d => d.status === '在线');
const alertDevices = mockDevices.filter(d => d.status === '告警');
const offlineDevices = mockDevices.filter(d => d.status === '离线' || d.status === '维护');

function buildResponse(q: string): { text: string; charts?: ChartBlock[] } {
  const lq = q.toLowerCase();

  // SOC / 荷电 / 储能状态
  if (/soc|荷电|充电|电量|储能状态/.test(lq)) {
    const socData = storageDevices
      .filter(d => d.soc !== undefined)
      .map(d => ({
        name: d.station ?? d.name,
        SOC: d.soc!,
        fill: d.soc! > 70 ? '#00ff88' : d.soc! > 40 ? '#00d4ff' : '#ffb800',
      }));
    const avgSoc = Math.round(socData.reduce((a, b) => a + b.SOC, 0) / socData.length);
    return {
      text: `当前共 **${storageDevices.length}** 个储能站点在线，平均 SOC 为 **${avgSoc}%**。\n\n` +
        socData.map(d => `• ${d.name}：${d.SOC}%${d.SOC < 40 ? '（⚠️ 偏低，建议安排充电）' : d.SOC > 80 ? '（电量充足）' : ''}`).join('\n'),
      charts: [{
        kind: 'bar',
        data: socData.map(d => ({ name: d.name, SOC: d.SOC })),
        bars: [{ key: 'SOC', color: '#00d4ff' }],
        unit: '%',
      }],
    };
  }

  // 电网储能 / 独立储能 / 各站点
  if (/电网储能|独立储能|电网侧|站点运行|各站/.test(lq)) {
    const totalCapacity = gridStorage.reduce((a, d) => a + d.capacity, 0);
    const totalEnergy = gridStorage.reduce((a, d) => a + (d.energyCapacity ?? 0), 0);
    const totalPower = gridStorage.reduce((a, d) => a + d.currentPower, 0);
    return {
      text: `电网侧独立储能共 **${gridStorage.length}** 个项目，全部处于**在线运营**状态。\n\n` +
        `• 总额定功率：**${totalCapacity} MW**\n` +
        `• 总储能容量：**${totalEnergy} MWh**\n` +
        `• 当前总放电功率：**${totalPower.toFixed(1)} MW**\n` +
        `• 综合利用率：**${Math.round(totalPower / totalCapacity * 100)}%**`,
      charts: [
        {
          kind: 'table',
          head: ['站点', '规模', '当前功率', 'SOC', '公司'],
          rows: gridStorage.map(d => [
            d.station ?? d.name,
            `${d.capacity}MW/${d.energyCapacity}MWh`,
            `${d.currentPower}MW`,
            `${d.soc}%`,
            d.company?.replace('有限公司', '').replace('有限', '') ?? '-',
          ]),
        },
      ],
    };
  }

  // 告警 / 异常 / 故障
  if (/告警|异常|故障|报警|问题/.test(lq)) {
    if (alertDevices.length === 0) {
      return { text: '当前系统无告警，所有设备运行正常。' };
    }
    return {
      text: `当前有 **${alertDevices.length}** 台设备处于告警状态，请及时处理：\n\n` +
        alertDevices.map(d => `• **${d.name}**（${d.location}）—— ${d.type}，已停止出力`).join('\n') +
        `\n\n建议优先检查通信链路和设备本体状态。`,
      charts: [{
        kind: 'kpi',
        items: [
          { label: '告警设备', value: String(alertDevices.length), color: '#ff4d4d', sub: '台' },
          { label: '离线设备', value: String(offlineDevices.filter(d => d.status === '离线').length), color: '#4a5568', sub: '台' },
          { label: '维护设备', value: String(offlineDevices.filter(d => d.status === '维护').length), color: '#ffb800', sub: '台' },
          { label: '正常在线', value: String(onlineDevices.length), color: '#00ff88', sub: '台' },
        ],
      }],
    };
  }

  // 能源结构 / 出力 / 发电分布
  if (/能源结构|出力|发电分布|能源占比|结构/.test(lq)) {
    const pieData = [
      { name: '光伏', value: 38.5, color: '#ffb800' },
      { name: '储能放电', value: 23.7, color: '#00d4ff' },
      { name: '风电', value: 22.1, color: '#00ff88' },
      { name: '柔性负荷', value: 44.2, color: '#a78bfa' },
    ];
    const total = pieData.reduce((a, b) => a + b.value, 0);
    return {
      text: `当前总出力 **${total.toFixed(1)} MW**，各类型能源出力占比如下：\n\n` +
        pieData.map(d => `• ${d.name}：${d.value} MW（${Math.round(d.value / total * 100)}%）`).join('\n') +
        `\n\n光伏和柔性负荷为主力出力来源，储能系统辅助调峰，整体运行结构均衡。`,
      charts: [{ kind: 'pie', data: pieData }],
    };
  }

  // 调度任务 / 需求响应
  if (/调度|任务|需求响应|响应任务|执行中/.test(lq)) {
    return {
      text: `当前调度任务共 **5** 个，执行中 **1** 个，待响应 **2** 个，已完成 **2** 个。\n\n` +
        `📌 **执行中任务：** 高峰调峰任务-01（T001），目标 50MW，当前出力 42.3MW，进度 65%，预计收益 ¥12.5万\n\n` +
        `⏳ **待响应任务：** 频率调节任务-A（14:00-16:00）、应急调频任务-B（16:00-18:00）\n\n` +
        `✅ 今日已完成任务共计收益：**¥15.4万**`,
      charts: [{
        kind: 'kpi',
        items: [
          { label: '执行中', value: '1', color: '#00d4ff', sub: '个任务' },
          { label: '待响应', value: '2', color: '#ffb800', sub: '个任务' },
          { label: '今日完成', value: '2', color: '#00ff88', sub: '个任务' },
          { label: '累计收益', value: '¥37.1万', color: '#00ff88', sub: '本日' },
        ],
      }],
    };
  }

  // 收益 / 结算 / 收入
  if (/收益|结算|收入|盈利|收款/.test(lq)) {
    const monthlyKpi = [
      { name: '1月', 调峰: 98, 调频: 52, 辅助: 31 },
      { name: '2月', 调峰: 112, 调频: 61, 辅助: 28 },
      { name: '3月', 调峰: 135, 调频: 72, 辅助: 42 },
    ].map(d => ({ ...d, total: d.调峰 + d.调频 + d.辅助 }));
    return {
      text: `截至本月，年度累计收益 **¥387.2万**，较去年同期增长 **18.3%**。\n\n` +
        `• 本月收益：**¥249万**（调峰 ¥135万 / 调频 ¥72万 / 辅助服务 ¥42万）\n` +
        `• 已结算：**¥411,000**\n` +
        `• 结算中：**¥108,000**\n` +
        `• 待结算：**¥63,000**\n\n` +
        `收益呈稳定上升趋势，3月环比增长 **20.5%**。`,
      charts: [{
        kind: 'bar',
        data: monthlyKpi.map(d => ({ name: d.name, 调峰: d.调峰, 调频: d.调频, 辅助服务: d.辅助 })),
        bars: [
          { key: '调峰', color: '#00d4ff' },
          { key: '调频', color: '#00ff88' },
          { key: '辅助服务', color: '#ffb800' },
        ],
        unit: '千元',
      }],
    };
  }

  // 离线 / 维护 / 不可用
  if (/离线|维护|不可用|停机|停运/.test(lq)) {
    const unavailable = mockDevices.filter(d => d.status !== '在线');
    return {
      text: `当前共 **${unavailable.length}** 台设备不在线：\n\n` +
        unavailable.map(d =>
          `• **${d.name}**（${d.status}）—— ${d.location}，额定 ${d.capacity}MW`
        ).join('\n') +
        `\n\n建议尽快恢复"${alertDevices[0]?.name ?? '告警设备'}"，以免影响调峰能力。`,
    };
  }

  // 在线率 / 统计 / 分类
  if (/在线率|统计|分类|各类型|各型/.test(lq)) {
    const types = ['光伏电站', '储能系统', '电网储能', '风电', '充电桩', '工业负荷'];
    const statData = types.map(t => {
      const all = mockDevices.filter(d => d.type === t);
      const on = all.filter(d => d.status === '在线');
      return { name: t.replace('电站', '').replace('系统', '').replace('工业', '工业\n'), total: all.length, online: on.length, rate: all.length > 0 ? Math.round(on.length / all.length * 100) : 0 };
    }).filter(d => d.total > 0);
    return {
      text: `设备在线率汇总（共 ${mockDevices.length} 台设备）：\n\n` +
        statData.map(d => `• ${d.name}：${d.online}/${d.total} 台在线（在线率 **${d.rate}%**）`).join('\n') +
        `\n\n整体在线率 **${Math.round(onlineDevices.length / mockDevices.length * 100)}%**，电网储能项目在线率 **100%**。`,
      charts: [{
        kind: 'bar',
        data: statData.map(d => ({ name: d.name, 在线率: d.rate })),
        bars: [{ key: '在线率', color: '#00d4ff' }],
        unit: '%',
      }],
    };
  }

  // 可调容量 / 容量 / 总装机
  if (/可调容量|装机|总容量|容量|储能容量/.test(lq)) {
    const gsCapacity = gridStorage.reduce((a, d) => a + d.capacity, 0);
    const gsEnergy = gridStorage.reduce((a, d) => a + (d.energyCapacity ?? 0), 0);
    const pieData = [
      { name: '光伏', value: 75, color: '#ffb800' },
      { name: '电网储能', value: gsCapacity, color: '#38bdf8' },
      { name: '储能系统', value: 35, color: '#00d4ff' },
      { name: '风电', value: 50, color: '#00ff88' },
      { name: '柔性负荷', value: 83, color: '#a78bfa' },
    ];
    const total = 75 + gsCapacity + 35 + 50 + 83;
    return {
      text: `平台聚合资源总可调容量 **${total} MW**，其中：\n\n` +
        `• 电网侧独立储能：**${gsCapacity} MW / ${gsEnergy} MWh**（${gridStorage.length}个项目）\n` +
        `• 光伏：**75 MW**\n• 用户侧储能：**35 MW**\n• 风电：**50 MW**\n• 柔性负荷：**83 MW**\n\n` +
        `电网储能占总容量的 **${Math.round(gsCapacity / total * 100)}%**，是平台最核心的调节资源。`,
      charts: [{ kind: 'pie', data: pieData }],
    };
  }

  // 整体 / 系统状态 / 运行状态 / 综合
  if (/整体|系统状态|运行状态|综合|总体|概况|平台|今天|今日.*状态/.test(lq)) {
    const totalCapacity = mockDevices.reduce((a, d) => a + d.capacity, 0);
    const totalPower = onlineDevices.reduce((a, d) => a + d.currentPower, 0);
    return {
      text: `**VPP 平台当前整体运行状态良好** ✅\n\n` +
        `• 总装机容量：**${totalCapacity} MW**\n` +
        `• 当前出力：**${totalPower.toFixed(1)} MW**（利用率 ${Math.round(totalPower / totalCapacity * 100)}%）\n` +
        `• 设备总数：**${mockDevices.length} 台**，在线 ${onlineDevices.length} 台，告警 ${alertDevices.length} 台\n` +
        `• 电网频率：**50.03 Hz**（正常范围 50±0.2Hz）\n` +
        `• 今日发电量：**1842.6 MWh**\n` +
        `• 碳减排：**921.3 tCO₂**\n\n` +
        `⚠️ 注意：充电桩群-CBD 存在通信中断告警，请及时处理。`,
      charts: [{
        kind: 'kpi',
        items: [
          { label: '总出力', value: `${totalPower.toFixed(0)}MW`, color: '#00d4ff', sub: `/ ${totalCapacity}MW` },
          { label: '在线设备', value: String(onlineDevices.length), color: '#00ff88', sub: `/ ${mockDevices.length}台` },
          { label: '今日电量', value: '1842.6', color: '#ffb800', sub: 'MWh' },
          { label: '频率偏差', value: '+0.03', color: '#00ff88', sub: 'Hz' },
        ],
      }],
    };
  }

  // 默认回答
  return {
    text: `您好！我是 VPP 智能运营助手。我可以帮您查询：\n\n` +
      `📊 **实时数据**：设备状态、出力数据、SOC状态、频率电压\n` +
      `⚡ **调度运营**：需求响应任务、调峰调频情况\n` +
      `💰 **收益结算**：月度收益、补贴明细、结算状态\n` +
      `🔋 **储能管理**：电网储能项目、各站点运行情况\n\n` +
      `您可以直接用自然语言提问，例如："各储能站SOC多少？" 或 "本月收益怎么样？"`,
  };
}

// ─── 子组件：图表渲染 ────────────────────────────────────────────
const CHART_COLORS = ['#00d4ff', '#00ff88', '#ffb800', '#a78bfa', '#38bdf8', '#fb923c'];

function ChartRenderer({ block }: { block: ChartBlock }) {
  const cardStyle: React.CSSProperties = {
    background: '#0a0e1a',
    borderRadius: 10,
    padding: '12px 8px 4px',
    marginTop: 10,
    border: '1px solid rgba(0,212,255,0.12)',
  };

  if (block.kind === 'kpi') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {block.items.map(item => (
          <div key={item.label} style={{
            background: '#0a0e1a', border: `1px solid ${item.color}30`,
            borderRadius: 8, padding: '8px 14px', flex: '1 1 100px', minWidth: 90,
          }}>
            <div style={{ color: '#4a6080', fontSize: 11 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
            {item.sub && <div style={{ color: '#4a6080', fontSize: 10 }}>{item.sub}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (block.kind === 'bar') {
    return (
      <div style={cardStyle}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={block.data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#4a6080" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit={block.unit ? ` ${block.unit}` : ''} />
            <Tooltip
              contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 6, fontSize: 12 }}
              formatter={(v) => [`${v}${block.unit ?? ''}`, '']}
            />
            {block.bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {block.bars.map(b => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (block.kind === 'pie') {
    return (
      <div style={cardStyle}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={block.data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: '#4a6080' }}
            >
              {block.data.map((entry, i) => (
                <Cell key={i} fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 6, fontSize: 12 }}
              formatter={(v) => [`${v} MW`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (block.kind === 'radial') {
    return (
      <div style={cardStyle}>
        <ResponsiveContainer width="100%" height={180}>
          <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={90} data={block.data}>
            <RadialBar dataKey="value" label={{ position: 'insideStart', fill: '#aab4c8', fontSize: 10 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 6, fontSize: 12 }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (block.kind === 'table') {
    return (
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {block.head.map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', background: 'rgba(0,212,255,0.08)',
                    color: '#00d4ff', fontWeight: 600, textAlign: 'left',
                    borderBottom: '1px solid rgba(0,212,255,0.15)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '7px 10px', color: ci === 0 ? '#00d4ff' : '#aab4c8',
                      borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap',
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

// ─── 文本渲染（支持 **加粗** 和换行）───────────────────────────
function RenderText({ text }: { text: string }) {
  return (
    <div style={{ lineHeight: 1.7 }}>
      {text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i} style={{ marginBottom: line === '' ? 6 : 0 }}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} style={{ color: '#fff', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                : <span key={j}>{part}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────
interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
}

export default function AIAssistant({ open, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      text: '您好！我是 **VPP 智能运营助手** 🤖\n\n我可以通过自然语言帮您查询设备状态、调度任务、收益数据、储能SOC等各类运营信息，并以图表形式直观呈现。\n\n请从下方选择常见问题，或直接输入您的问题：',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;

    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: q,
      ts: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const delay = 600 + Math.random() * 600;
    setTimeout(() => {
      const resp = buildResponse(q);
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: resp.text,
        charts: resp.charts,
        ts: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, delay);
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,255,136,0.2))',
            border: '1px solid rgba(0,212,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RobotOutlined style={{ color: '#00d4ff', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ color: '#00d4ff', fontWeight: 700, fontSize: 15 }}>智能问数</div>
            <div style={{ color: '#4a6080', fontSize: 11, fontWeight: 400 }}>VPP AI 运营助手</div>
          </div>
        </div>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{
        body: { background: '#0d1526', padding: 0, display: 'flex', flexDirection: 'column' },
        header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.12)' },
        wrapper: { boxShadow: '-4px 0 24px rgba(0,0,0,0.5)' },
      }}
    >
      {/* 消息区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 8, marginBottom: 16, alignItems: 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: msg.role === 'user'
                ? 'rgba(0,212,255,0.15)'
                : 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,255,136,0.15))',
              border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user'
                ? <UserOutlined style={{ color: '#00d4ff', fontSize: 13 }} />
                : <RobotOutlined style={{ color: '#00d4ff', fontSize: 13 }} />
              }
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '85%' }}>
              <div style={{
                background: msg.role === 'user'
                  ? 'rgba(0,212,255,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                padding: '10px 14px',
                color: '#d1d9e6',
                fontSize: 13,
              }}>
                <RenderText text={msg.text} />
                {msg.charts?.map((block, i) => (
                  <ChartRenderer key={i} block={block} />
                ))}
              </div>
              <div style={{
                color: '#2d3748', fontSize: 10, marginTop: 3,
                textAlign: msg.role === 'user' ? 'right' : 'left',
              }}>
                {msg.ts.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* 思考动画 */}
        {thinking && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,255,136,0.15))',
              border: '1px solid rgba(0,212,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <RobotOutlined style={{ color: '#00d4ff', fontSize: 13 }} />
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '4px 12px 12px 12px',
              padding: '12px 16px',
              color: '#4a6080', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <LoadingOutlined style={{ color: '#00d4ff' }} />
              <span>正在分析数据...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 常见问题 */}
      <div style={{
        padding: '10px 16px 6px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8 }}>常见运营问题</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUGGESTED_QUESTIONS.map(q => (
            <Tag
              key={q}
              style={{
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.2)',
                color: '#aab4c8', fontSize: 11,
                cursor: 'pointer', borderRadius: 6,
                padding: '2px 8px', margin: 0,
                transition: 'all 0.2s',
              }}
              onClick={() => send(q)}
            >
              {q}
            </Tag>
          ))}
        </div>
      </div>

      {/* 输入框 */}
      <div style={{
        padding: '10px 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: '#0d1526',
        display: 'flex', gap: 8,
      }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={() => send(input)}
          placeholder="输入问题，例如：各储能站SOC状态？"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(0,212,255,0.2)',
            color: '#e2e8f0', borderRadius: 8,
            fontSize: 13,
          }}
          disabled={thinking}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => send(input)}
          disabled={!input.trim() || thinking}
          style={{
            background: '#00d4ff', border: 'none',
            color: '#0a0e1a', borderRadius: 8,
            fontWeight: 600,
          }}
        />
      </div>
    </Drawer>
  );
}

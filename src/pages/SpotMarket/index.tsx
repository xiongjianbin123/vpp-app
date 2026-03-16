import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Slider, InputNumber, Select, Tag, Table, Tabs,
  Statistic, Alert, Radio,
} from 'antd';
import { useTheme } from '../../context/ThemeContext';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import {
  ThunderboltOutlined, RiseOutlined, FallOutlined,
  CalculatorOutlined, BulbOutlined,
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';

const { Option } = Select;

// ─── 分时电价生成 ─────────────────────────────────────────────────
type PeriodType = '谷' | '平' | '峰' | '尖峰';
interface PricePoint {
  hour: string;
  price: number;
  period: PeriodType;
  forecast: number;
  load: number;
}

const PERIOD_CONFIG: Record<PeriodType, { color: string; bg: string; label: string }> = {
  谷: { color: '#00ff88', bg: 'rgba(0,255,136,0.08)', label: '谷段' },
  平: { color: '#aab4c8', bg: 'rgba(170,180,200,0.06)', label: '平段' },
  峰: { color: '#ffb800', bg: 'rgba(255,184,0,0.08)', label: '峰段' },
  尖峰: { color: '#ff4d4d', bg: 'rgba(255,77,77,0.08)', label: '尖峰' },
};

function getPeriod(hour: number): PeriodType {
  if (hour >= 0 && hour < 7) return '谷';
  if (hour >= 7 && hour < 9) return '平';
  if (hour >= 9 && hour < 11) return '峰';
  if (hour >= 11 && hour < 14) return '平';
  if (hour >= 14 && hour < 17) return '尖峰';
  if (hour >= 17 && hour < 19) return '峰';
  if (hour >= 19 && hour < 21) return '尖峰';
  if (hour >= 21 && hour < 23) return '平';
  return '谷';
}

const BASE_PRICES: Record<PeriodType, number> = { 谷: 0.183, 平: 0.542, 峰: 0.962, 尖峰: 1.248 };

function generate24hPrices(): PricePoint[] {
  return Array.from({ length: 24 }, (_, h) => {
    const period = getPeriod(h);
    const base = BASE_PRICES[period];
    const noise = (Math.random() - 0.5) * 0.04;
    const forecastNoise = (Math.random() - 0.5) * 0.06;
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      price: parseFloat((base + noise).toFixed(4)),
      period,
      forecast: parseFloat((base + noise + forecastNoise).toFixed(4)),
      load: Math.round(600 + (period === '尖峰' ? 300 : period === '峰' ? 200 : period === '谷' ? -150 : 50) + Math.random() * 80),
    };
  });
}

// ─── 套利策略生成 ─────────────────────────────────────────────────
interface StrategyWindow {
  type: 'charge' | 'discharge';
  start: number;
  end: number;
  price: number;
  label: string;
}

function calcStrategy(prices: PricePoint[]): StrategyWindow[] {
  const windows: StrategyWindow[] = [
    { type: 'charge', start: 1, end: 6, price: prices[2]?.price ?? 0.183, label: '充电（深谷）' },
    { type: 'discharge', start: 14, end: 17, price: prices[15]?.price ?? 1.248, label: '放电（尖峰）' },
    { type: 'discharge', start: 19, end: 21, price: prices[20]?.price ?? 1.248, label: '放电（尖峰）' },
    { type: 'charge', start: 23, end: 24, price: prices[23]?.price ?? 0.183, label: '充电（夜谷）' },
  ];
  return windows;
}

// ─── 历史回测数据 ─────────────────────────────────────────────────
interface BacktestRow {
  key: string;
  date: string;
  strategy: string;
  chargeEnergy: number;
  dischargeEnergy: number;
  buyCost: number;
  sellRevenue: number;
  profit: number;
  roi: number;
}

const backtestData: BacktestRow[] = [
  { key: '1', date: '2026-03-15', strategy: '双充双放', chargeEnergy: 600, dischargeEnergy: 570, buyCost: 109800, sellRevenue: 698760, profit: 588960, roi: 5.37 },
  { key: '2', date: '2026-03-14', strategy: '单充双放', chargeEnergy: 400, dischargeEnergy: 380, buyCost: 73200, sellRevenue: 463520, profit: 390320, roi: 5.33 },
  { key: '3', date: '2026-03-13', strategy: '双充双放', chargeEnergy: 600, dischargeEnergy: 568, buyCost: 109800, sellRevenue: 686656, profit: 576856, roi: 5.25 },
  { key: '4', date: '2026-03-12', strategy: '双充双放', chargeEnergy: 600, dischargeEnergy: 572, buyCost: 109800, sellRevenue: 701440, profit: 591640, roi: 5.39 },
  { key: '5', date: '2026-03-11', strategy: '单充单放', chargeEnergy: 300, dischargeEnergy: 286, buyCost: 54900, sellRevenue: 345472, profit: 290572, roi: 5.29 },
  { key: '6', date: '2026-03-10', strategy: '双充双放', chargeEnergy: 600, dischargeEnergy: 565, buyCost: 109800, sellRevenue: 675280, profit: 565480, roi: 5.15 },
  { key: '7', date: '2026-03-09', strategy: '单充双放', chargeEnergy: 400, dischargeEnergy: 378, buyCost: 73200, sellRevenue: 455664, profit: 382464, roi: 5.22 },
];

// ─── 主页面 ──────────────────────────────────────────────────────
export default function SpotMarket() {
  const { colors: c } = useTheme();
  const [prices, setPrices] = useState<PricePoint[]>(generate24hPrices());
  const [capacity, setCapacity] = useState(150);
  const [efficiency, setEfficiency] = useState(92);
  const [strategy, setStrategy] = useState<'double' | 'single' | 'auto'>('auto');
  const [activeTab, setActiveTab] = useState('strategy');
  const [simResult, setSimResult] = useState<{ revenue: number; cost: number; profit: number; arbitrage: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setPrices(prev => prev.map((p) => ({
        ...p,
        price: parseFloat((p.price + (Math.random() - 0.5) * 0.008).toFixed(4)),
      })));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const strategyWindows = calcStrategy(prices);
  const valleyAvg = parseFloat((prices.filter(p => p.period === '谷').reduce((a, b) => a + b.price, 0) / 7).toFixed(4));
  const peakAvg = parseFloat((prices.filter(p => p.period === '尖峰').reduce((a, b) => a + b.price, 0) / 4).toFixed(4));
  const arbitrageSpread = parseFloat((peakAvg - valleyAvg).toFixed(4));

  // 模拟计算
  const runSimulation = () => {
    const chargeHours = strategy === 'double' ? 7 : strategy === 'single' ? 3.5 : 6;
    const eff = efficiency / 100;

    const chargeEnergy = capacity * chargeHours;
    const dischargeEnergy = chargeEnergy * eff;
    const buyCost = chargeEnergy * valleyAvg * 10000;
    const sellRevenue = dischargeEnergy * peakAvg * 10000;
    const profit = sellRevenue - buyCost;
    const arb = parseFloat((peakAvg - valleyAvg).toFixed(4));

    setSimResult({
      revenue: Math.round(sellRevenue),
      cost: Math.round(buyCost),
      profit: Math.round(profit),
      arbitrage: arb,
    });
  };

  // 价格分布图数据
  const priceDistData = Object.entries(BASE_PRICES).map(([period, price]) => ({
    period,
    价格: price,
    小时数: { 谷: 9, 平: 7, 峰: 4, 尖峰: 4 }[period as PeriodType],
    color: PERIOD_CONFIG[period as PeriodType].color,
  }));

  // 月度套利收益预测
  const monthlyForecast = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    套利收益: Math.round((arbitrageSpread * capacity * 5 * 30 * (0.85 + Math.random() * 0.2)) / 10) * 10,
    目标收益: Math.round(capacity * 5 * 30 * 0.18 * 1000),
  }));

  const backtestColumns: ColumnType<BacktestRow>[] = [
    { title: '日期', dataIndex: 'date', render: (v: string) => <span style={{ color: c.textMuted, fontSize: 12 }}>{v}</span> },
    {
      title: '策略', dataIndex: 'strategy',
      render: (v: string) => <Tag style={{ color: c.primary, borderColor: c.primary, background: c.primaryMuted }}>{v}</Tag>,
    },
    { title: '充电量', dataIndex: 'chargeEnergy', render: (v: number) => <span style={{ color: c.textSecondary }}>{v} MWh</span> },
    { title: '放电量', dataIndex: 'dischargeEnergy', render: (v: number) => <span style={{ color: c.textSecondary }}>{v} MWh</span> },
    { title: '购电成本', dataIndex: 'buyCost', render: (v: number) => <span style={{ color: '#ff6b6b' }}>¥{(v / 10000).toFixed(1)}万</span> },
    { title: '售电收入', dataIndex: 'sellRevenue', render: (v: number) => <span style={{ color: c.success }}>¥{(v / 10000).toFixed(1)}万</span> },
    { title: '套利利润', dataIndex: 'profit', render: (v: number) => <span style={{ color: c.success, fontWeight: 700 }}>¥{(v / 10000).toFixed(1)}万</span> },
    { title: '峰谷价差', dataIndex: 'roi', render: (v: number) => <span style={{ color: c.warning }}>{v}x</span> },
  ];

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };

  return (
    <div>
      {/* 页头 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>现货市场交易策略</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            广东现货电力市场 · 实时电价监测 · 峰谷套利策略决策 · 数据每5秒更新
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: '6px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.success, boxShadow: `0 0 6px ${c.success}`, animation: 'pulse 2s infinite' }} />
            <span style={{ color: c.success, fontSize: 12 }}>市场开放</span>
          </div>
          <Tag color="processing" style={{ borderRadius: 6 }}>广东电力交易中心</Tag>
        </div>
      </div>

      {/* KPI 顶部 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: '当前谷段电价', value: `¥${valleyAvg}`, sub: '元/kWh', color: c.success, icon: <FallOutlined /> },
          { label: '当前峰段电价', value: `¥${peakAvg}`, sub: '元/kWh', color: c.danger, icon: <RiseOutlined /> },
          { label: '峰谷价差', value: `¥${arbitrageSpread}`, sub: '元/kWh 套利空间', color: c.warning, icon: <ThunderboltOutlined /> },
          { label: '当前负荷', value: `${prices[new Date().getHours()]?.load ?? 820}`, sub: 'MW · 广东南网', color: c.primary, icon: <ThunderboltOutlined /> },
          { label: '今日预计套利', value: `¥${Math.round(arbitrageSpread * capacity * 5 * 0.92 / 10) / 10}万`, sub: `${capacity}MW储能`, color: c.success, icon: <CalculatorOutlined /> },
        ].map(item => (
          <Col key={item.label} flex="1" style={{ minWidth: 150 }}>
            <Card style={cardStyle} styles={{ body: { padding: '14px 16px' } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: c.textMuted, fontSize: 11, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ color: item.color, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ color: c.textDim, fontSize: 11, marginTop: 4 }}>{item.sub}</div>
                </div>
                <div style={{ color: item.color, fontSize: 20, opacity: 0.4 }}>{item.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 0 }}
        items={[
          { key: 'strategy', label: '策略决策' },
          { key: 'simulate', label: '模拟计算' },
          { key: 'forecast', label: '价格预测' },
          { key: 'backtest', label: '历史回测' },
        ]}
        tabBarStyle={{ borderBottom: `1px solid ${c.primaryBorderLight}`, marginBottom: 16 }}
      />

      {/* ── TAB 1: 策略决策 ───────────────────────────────────────── */}
      {activeTab === 'strategy' && (
        <Row gutter={[16, 16]}>
          {/* 24h 价格曲线 */}
          <Col xs={24} lg={16}>
            <Card
              title={<span style={{ color: c.primary }}>24小时现货电价曲线（实时）</span>}
              style={cardStyle}
              styles={{ header: headStyle }}
              extra={
                <div style={{ display: 'flex', gap: 12 }}>
                  {Object.entries(PERIOD_CONFIG).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color }} />
                      <span style={{ color: c.textMuted, fontSize: 11 }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={prices} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffb800" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.primary} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  {/* 充电区间着色 */}
                  <ReferenceArea x1="01:00" x2="06:00" fill="rgba(0,255,136,0.06)" label={{ value: '充电窗口', fill: c.success, fontSize: 10, position: 'top' }} />
                  <ReferenceArea x1="14:00" x2="17:00" fill="rgba(255,77,77,0.06)" label={{ value: '放电窗口', fill: c.danger, fontSize: 10, position: 'top' }} />
                  <ReferenceArea x1="19:00" x2="21:00" fill="rgba(255,77,77,0.06)" />
                  {/* 平衡线 */}
                  <ReferenceLine y={0.542} stroke="rgba(170,180,200,0.3)" strokeDasharray="4 4" label={{ value: '平段基准', fill: c.textMuted, fontSize: 10 }} />
                  <XAxis dataKey="hour" stroke={c.textDim} tick={{ fontSize: 11 }} interval={2} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `¥${v}`} domain={[0.1, 1.4]} />
                  <Tooltip
                    contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v, name) => [`¥${v} 元/kWh`, name]}
                    labelFormatter={(l) => {
                      const p = prices.find(x => x.hour === l);
                      return `${l}  ${p ? PERIOD_CONFIG[p.period].label : ''}`;
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="price" name="实时电价" stroke="#ffb800" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="forecast" name="预测电价" stroke={c.primary} fill="url(#forecastGrad)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 今日策略推荐 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BulbOutlined style={{ color: '#ffb800' }} />
                  <span style={{ color: c.primary }}>今日策略推荐</span>
                </div>
              }
              style={cardStyle}
              styles={{ header: headStyle }}
            >
              <Alert
                message={`推荐策略：双充双放峰谷套利`}
                description={`峰谷价差 ¥${arbitrageSpread}/kWh，套利空间良好，建议全额执行`}
                type="success"
                showIcon
                style={{ marginBottom: 16, fontSize: 12 }}
              />

              {strategyWindows.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', marginBottom: 8, borderRadius: 8,
                  background: w.type === 'charge' ? 'rgba(0,255,136,0.06)' : 'rgba(255,77,77,0.06)',
                  border: `1px solid ${w.type === 'charge' ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,77,0.2)'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: w.type === 'charge' ? 'rgba(0,255,136,0.15)' : 'rgba(255,77,77,0.15)',
                    fontSize: 18,
                  }}>
                    {w.type === 'charge' ? '⬇' : '⬆'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: w.type === 'charge' ? '#00ff88' : '#ff4d4d', fontSize: 13, fontWeight: 600 }}>{w.label}</div>
                    <div style={{ color: c.textMuted, fontSize: 11 }}>{String(w.start).padStart(2, '0')}:00 — {String(w.end).padStart(2, '0')}:00</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: c.textPrimary, fontSize: 13, fontWeight: 600 }}>¥{w.price}</div>
                    <div style={{ color: c.textDim, fontSize: 11 }}>元/kWh</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '10px 12px', background: c.bgPage, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: c.textMuted, fontSize: 12 }}>预计日套利收益</span>
                  <span style={{ color: '#00ff88', fontWeight: 700, fontSize: 16 }}>
                    ¥{Math.round(arbitrageSpread * capacity * 5 * 0.92 / 10) / 10}万
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: c.textMuted, fontSize: 12 }}>月度预期</span>
                  <span style={{ color: '#ffb800', fontWeight: 600, fontSize: 13 }}>
                    ¥{Math.round(arbitrageSpread * capacity * 5 * 0.92 * 25 / 10) / 10}万
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          {/* 分时段价格分布 */}
          <Col xs={24} md={12}>
            <Card title={<span style={{ color: c.primary }}>分时段电价分布</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceDistData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="period" stroke={c.textDim} tick={{ fontSize: 12 }} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `¥${v}`} />
                  <Tooltip
                    contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`¥${v} 元/kWh`, '基准电价']}
                  />
                  <Bar dataKey="价格" radius={[6, 6, 0, 0]}>
                    {priceDistData.map((entry, i) => (
                      <rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 负荷曲线 */}
          <Col xs={24} md={12}>
            <Card title={<span style={{ color: c.primary }}>实时系统负荷曲线</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={prices} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="hour" stroke={c.textDim} tick={{ fontSize: 11 }} interval={3} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit=" MW" />
                  <Tooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={750} stroke="rgba(255,184,0,0.4)" strokeDasharray="4 4" label={{ value: '峰值预警', fill: '#ffb800', fontSize: 10 }} />
                  <Line type="monotone" dataKey="load" name="系统负荷" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── TAB 2: 模拟计算 ───────────────────────────────────────── */}
      {activeTab === 'simulate' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: c.primary }}><CalculatorOutlined /> 套利策略模拟计算器</span>}
              style={cardStyle} styles={{ header: headStyle }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ color: c.textSecondary, fontSize: 13, marginBottom: 8 }}>储能规模（MW）</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Slider min={10} max={300} value={capacity} onChange={setCapacity} style={{ flex: 1 }}
                      marks={{ 50: '50', 100: '100', 150: '150', 200: '200', 300: '300' }} />
                    <InputNumber min={10} max={300} value={capacity} onChange={v => setCapacity(v ?? 150)}
                      style={{ width: 80 }} addonAfter="MW" />
                  </div>
                </div>

                <div>
                  <div style={{ color: c.textSecondary, fontSize: 13, marginBottom: 8 }}>充放电效率（%）</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Slider min={80} max={98} value={efficiency} onChange={setEfficiency} style={{ flex: 1 }}
                      marks={{ 80: '80%', 90: '90%', 95: '95%', 98: '98%' }} />
                    <InputNumber min={80} max={98} value={efficiency} onChange={v => setEfficiency(v ?? 92)}
                      style={{ width: 80 }} addonAfter="%" />
                  </div>
                </div>

                <div>
                  <div style={{ color: c.textSecondary, fontSize: 13, marginBottom: 8 }}>充放策略</div>
                  <Radio.Group value={strategy} onChange={e => setStrategy(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { value: 'auto', label: '智能优化（推荐）', desc: '根据实时电价自动优化充放时段' },
                      { value: 'double', label: '双充双放', desc: '谷段充电 × 2，峰段放电 × 2，最大套利' },
                      { value: 'single', label: '单充单放', desc: '一次充放循环，适合容量受限场景' },
                    ].map(opt => (
                      <div key={opt.value} onClick={() => setStrategy(opt.value as typeof strategy)}
                        style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${strategy === opt.value ? c.primary : c.borderSubtle}`, background: strategy === opt.value ? c.primaryMuted : 'transparent' }}>
                        <div style={{ color: strategy === opt.value ? c.primary : c.textPrimary, fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                        <div style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </Radio.Group>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: '谷段买入价', value: `¥${valleyAvg}/kWh` },
                    { label: '峰段卖出价', value: `¥${peakAvg}/kWh` },
                    { label: '价差套利空间', value: `¥${arbitrageSpread}/kWh` },
                    { label: '充放效率损耗', value: `${100 - efficiency}%` },
                  ].map(item => (
                    <div key={item.label} style={{ background: c.bgPage, borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ color: c.textDim, fontSize: 11 }}>{item.label}</div>
                      <div style={{ color: c.textPrimary, fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <Button
                  type="primary" size="large" block
                  icon={<CalculatorOutlined />}
                  onClick={runSimulation}
                  style={{ background: c.primary, border: 'none', color: c.bgPage, fontWeight: 700, borderRadius: 8, height: 44 }}
                >
                  运行模拟计算
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            {simResult ? (
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Alert
                    message={`模拟完成 · ${strategy === 'auto' ? '智能优化策略' : strategy === 'double' ? '双充双放策略' : '单充单放策略'} · ${capacity}MW 储能 · 效率 ${efficiency}%`}
                    type="success" showIcon
                  />
                </Col>
                {[
                  { label: '售电收入', value: `¥${(simResult.revenue / 10000).toFixed(1)}万`, color: '#00ff88', desc: '按峰段电价计算' },
                  { label: '购电成本', value: `¥${(simResult.cost / 10000).toFixed(1)}万`, color: '#ff4d4d', desc: '按谷段电价计算' },
                  { label: '套利利润', value: `¥${(simResult.profit / 10000).toFixed(1)}万`, color: '#ffb800', desc: '单日净收益' },
                  { label: '月度预期', value: `¥${(simResult.profit * 25 / 10000).toFixed(0)}万`, color: c.primary, desc: '按25个交易日' },
                  { label: '年度预期', value: `¥${(simResult.profit * 300 / 10000 / 10000).toFixed(2)}亿`, color: '#a78bfa', desc: '按300个交易日' },
                  { label: '吨碳减排', value: `${Math.round(capacity * 5 * 0.92 * 0.785)}吨`, color: '#00ff88', desc: '日均碳减排量' },
                ].map(item => (
                  <Col span={8} key={item.label}>
                    <Card style={{ ...cardStyle, border: `1px solid ${item.color}25` }} styles={{ body: { padding: '14px 16px' } }}>
                      <Statistic
                        title={<span style={{ color: c.textMuted, fontSize: 11 }}>{item.label}</span>}
                        value={item.value}
                        valueStyle={{ color: item.color, fontSize: 18, fontWeight: 700 }}
                      />
                      <div style={{ color: c.textDim, fontSize: 11, marginTop: 4 }}>{item.desc}</div>
                    </Card>
                  </Col>
                ))}

                {/* 敏感性分析 */}
                <Col span={24}>
                  <Card title={<span style={{ color: c.primary }}>价差敏感性分析</span>} style={cardStyle} styles={{ header: headStyle }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2].map(spread => ({
                          价差: `¥${spread}`,
                          日利润: Math.round(spread * capacity * 5 * (efficiency / 100) * 10000 / 10000 * 10) / 10,
                        }))}
                        margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                        <XAxis dataKey="价差" stroke={c.textDim} tick={{ fontSize: 11 }} />
                        <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="万" />
                        <Tooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [`¥${v}万`, '日利润']} />
                        <ReferenceLine x={`¥${Math.round(simResult.arbitrage * 10) / 10}`} stroke="#ffb800" strokeDasharray="4 4" label={{ value: '当前价差', fill: '#ffb800', fontSize: 10 }} />
                        <Bar dataKey="日利润" fill={c.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Card style={{ ...cardStyle, height: '100%', minHeight: 400 }} styles={{ body: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 } }}>
                <div style={{ fontSize: 48, opacity: 0.2 }}>📊</div>
                <div style={{ color: c.textDim, fontSize: 14, textAlign: 'center' }}>
                  配置左侧参数后点击<br />「运行模拟计算」查看套利分析结果
                </div>
              </Card>
            )}
          </Col>
        </Row>
      )}

      {/* ── TAB 3: 价格预测 ───────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message="价格预测基于历史数据、天气预报、节假日安排、市场供需等多维度因素综合建模"
              type="info" showIcon style={{ marginBottom: 16 }}
            />
          </Col>
          <Col xs={24} lg={16}>
            <Card title={<span style={{ color: c.primary }}>明日24小时电价预测（置信区间）</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={prices.map((p) => {
                    const base = BASE_PRICES[p.period];
                    const upper = parseFloat((base * (1 + 0.08 + Math.random() * 0.04)).toFixed(4));
                    const lower = parseFloat((base * (1 - 0.06 - Math.random() * 0.03)).toFixed(4));
                    return { hour: p.hour, 预测中位: parseFloat((base + (Math.random() - 0.5) * 0.05).toFixed(4)), 上界: upper, 下界: lower };
                  })}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={c.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="hour" stroke={c.textDim} tick={{ fontSize: 11 }} interval={2} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `¥${v}`} domain={[0.1, 1.4]} />
                  <Tooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`¥${v} 元/kWh`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="上界" stroke="transparent" fill="url(#bandGrad)" name="预测上界" />
                  <Area type="monotone" dataKey="下界" stroke="transparent" fill={c.bgPage} name="预测下界" />
                  <Line type="monotone" dataKey="预测中位" stroke={c.primary} strokeWidth={2.5} dot={false} name="预测中位价" />
                  <Line type="monotone" dataKey="上界" stroke={c.primaryMuted} strokeWidth={1} strokeDasharray="3 3" dot={false} name="90%置信上界" />
                  <Line type="monotone" dataKey="下界" stroke={c.primaryMuted} strokeWidth={1} strokeDasharray="3 3" dot={false} name="90%置信下界" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={<span style={{ color: c.primary }}>关键时段预测</span>} style={cardStyle} styles={{ header: headStyle }}>
              {[
                { period: '深谷段（01-06时）', price: '¥0.173-0.195', trend: '↓', color: '#00ff88', action: '建议充电', risk: '低' },
                { period: '早峰（09-11时）', price: '¥0.918-0.998', trend: '↑', color: '#ffb800', action: '建议放电', risk: '低' },
                { period: '午后尖峰（14-17时）', price: '¥1.198-1.312', trend: '↑↑', color: '#ff4d4d', action: '满额放电', risk: '低' },
                { period: '晚高峰（19-21时）', price: '¥1.156-1.289', trend: '↑', color: '#ff4d4d', action: '建议放电', risk: '中' },
                { period: '夜间谷段（23-07时）', price: '¥0.178-0.192', trend: '↓', color: '#00ff88', action: '充电备用', risk: '低' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < 4 ? `1px solid ${c.borderSubtle}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: c.textSecondary, fontSize: 12 }}>{item.period}</div>
                      <div style={{ color: item.color, fontSize: 14, fontWeight: 600, marginTop: 2 }}>{item.price}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Tag style={{ color: item.color, borderColor: item.color, background: `${item.color}12`, marginBottom: 4 }}>{item.action}</Tag>
                      <div style={{ color: c.textDim, fontSize: 11 }}>风险：{item.risk}</div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </Col>

          <Col span={24}>
            <Card title={<span style={{ color: c.primary }}>月度收益预测（2026年）</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyForecast} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="month" stroke={c.textDim} tick={{ fontSize: 11 }} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`¥${(Number(v) / 10000).toFixed(1)}万`, '']} />
                  <Legend />
                  <Bar dataKey="套利收益" fill={c.primary} radius={[4, 4, 0, 0]} name="预测套利收益" />
                  <Bar dataKey="目标收益" fill="rgba(255,184,0,0.3)" radius={[4, 4, 0, 0]} name="目标收益" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── TAB 4: 历史回测 ───────────────────────────────────────── */}
      {activeTab === 'backtest' && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {[
                { label: '回测周期', value: '近7天', color: c.primary },
                { label: '累计套利收益', value: `¥${(backtestData.reduce((a, b) => a + b.profit, 0) / 10000).toFixed(1)}万`, color: '#00ff88' },
                { label: '平均日收益', value: `¥${(backtestData.reduce((a, b) => a + b.profit, 0) / 7 / 10000).toFixed(1)}万`, color: '#ffb800' },
                { label: '策略胜率', value: '100%', color: '#00ff88' },
                { label: '累计充电量', value: `${backtestData.reduce((a, b) => a + b.chargeEnergy, 0)} MWh`, color: c.textSecondary },
              ].map(item => (
                <Col key={item.label} flex="1">
                  <Card style={cardStyle} styles={{ body: { padding: '12px 16px' } }}>
                    <div style={{ color: c.textMuted, fontSize: 11 }}>{item.label}</div>
                    <div style={{ color: item.color, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{item.value}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>

          <Col span={24}>
            <Card
              title={<span style={{ color: c.primary }}>历史套利交易记录</span>}
              style={cardStyle} styles={{ header: headStyle }}
              extra={
                <Select defaultValue="7d" style={{ width: 100 }}>
                  <Option value="7d">近7天</Option>
                  <Option value="30d">近30天</Option>
                  <Option value="90d">近90天</Option>
                </Select>
              }
            >
              <Table
                dataSource={backtestData}
                columns={backtestColumns}
                rowKey="key"
                pagination={false}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <span style={{ color: c.textMuted }}>合计</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <span style={{ color: c.textSecondary }}>{backtestData.reduce((a, b) => a + b.chargeEnergy, 0)} MWh</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <span style={{ color: c.textSecondary }}>{backtestData.reduce((a, b) => a + b.dischargeEnergy, 0)} MWh</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <span style={{ color: '#ff6b6b' }}>¥{(backtestData.reduce((a, b) => a + b.buyCost, 0) / 10000).toFixed(1)}万</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5}>
                        <span style={{ color: '#00ff88' }}>¥{(backtestData.reduce((a, b) => a + b.sellRevenue, 0) / 10000).toFixed(1)}万</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={6}>
                        <span style={{ color: '#00ff88', fontWeight: 700 }}>¥{(backtestData.reduce((a, b) => a + b.profit, 0) / 10000).toFixed(1)}万</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={7} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title={<span style={{ color: c.primary }}>每日套利收益走势</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={[...backtestData].reverse().map(d => ({ date: d.date.slice(5), 套利利润: Math.round(d.profit / 10000 * 10) / 10, 购电成本: Math.round(d.buyCost / 10000 * 10) / 10 }))}
                  margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="date" stroke={c.textDim} tick={{ fontSize: 11 }} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="万" />
                  <Tooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`¥${v}万`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="套利利润" stroke="#00ff88" fill="url(#profitGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="购电成本" stroke="#ff6b6b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

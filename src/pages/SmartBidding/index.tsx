import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Table, Button, Tag, Tabs, Progress, Alert,
  Select, Switch, InputNumber,
} from 'antd';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import {
  ThunderboltOutlined, DownloadOutlined, FireOutlined,
} from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;

// ─── 常量 ─────────────────────────────────────────────────────────
// 广东调频市场参数
const AGC_CAPACITY_PRICE = 12.5;   // 元/MW·h（容量补偿）
const AGC_MILEAGE_PRICE = 0.018;   // 元/MWh（里程补偿）
const K_VALUE = 0.91;              // 当前K值

// ─── 96点申报数据生成 ─────────────────────────────────────────────
type BidMode = '报量不报价' | '报量报价';
type Market = 'AGC' | '现货' | '备用';

interface BidPoint {
  key: string;
  period: string;
  time: string;
  pricePred: number;
  declaredMW: number;
  bidPrice: number | null;
  market: Market;
  expectedRevenue: number;
}

function getPeriodLabel(h: number): string {
  if (h >= 0 && h < 7) return '谷';
  if (h >= 9 && h < 11) return '峰';
  if (h >= 14 && h < 17) return '尖峰';
  if (h >= 19 && h < 21) return '尖峰';
  return '平';
}

function getPricePred(h: number): number {
  const base: Record<string, number> = { 谷: 0.183, 峰: 0.962, 尖峰: 1.248, 平: 0.542 };
  const b = base[getPeriodLabel(h)] ?? 0.542;
  return parseFloat((b + (Math.random() - 0.5) * 0.04).toFixed(4));
}

function getOptimalMarket(pricePred: number, kv: number): Market {
  // 调频收益（元/MW·h）= 容量补偿 + 里程补偿 * 每小时调频里程（约40MW）
  const agcRevPerMWh = AGC_CAPACITY_PRICE + AGC_MILEAGE_PRICE * 40 * kv;
  // 现货套利（元/kWh）= 峰谷差 × 效率
  const spotSpread = pricePred - 0.183;
  const spotRevPerMWh = spotSpread * 1000 * 0.92; // 转换单位 × 效率
  if (pricePred < 0.35) return 'AGC';  // 谷段充电
  if (spotRevPerMWh > agcRevPerMWh * 1.2) return '现货';
  if (spotRevPerMWh > agcRevPerMWh) return '现货';
  return 'AGC';
}

function generate96Points(capacity: number, kv: number): BidPoint[] {
  return Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const period = getPeriodLabel(h);
    const pricePred = getPricePred(h);
    const market = getOptimalMarket(pricePred, kv);
    const declaredMW = market === 'AGC' ? capacity : pricePred > 0.9 ? capacity : pricePred > 0.5 ? capacity * 0.6 : 0;
    const bidPrice = market === '现货' && pricePred > 0.5 ? parseFloat((pricePred * 0.95).toFixed(4)) : null;
    const agcRevPerQ = (AGC_CAPACITY_PRICE + AGC_MILEAGE_PRICE * 40 * kv) * 0.25 * declaredMW / 1000;
    const spotRevPerQ = bidPrice ? bidPrice * declaredMW * 0.25 : 0;
    const expectedRevenue = parseFloat(((market === 'AGC' ? agcRevPerQ : spotRevPerQ)).toFixed(2));
    return { key: String(i), period, time, pricePred, declaredMW: Math.round(declaredMW), bidPrice, market, expectedRevenue };
  });
}

// ─── 多市场寻优历史数据 ───────────────────────────────────────────
function generateOptHistory() {
  return Array.from({ length: 24 }, (_, h) => {
    const agcMW = 80 + Math.random() * 40;
    const spotMW = 150 - agcMW;
    const agcRev = agcMW * (AGC_CAPACITY_PRICE + AGC_MILEAGE_PRICE * 40 * K_VALUE) / 1000;
    const pricePred = getPricePred(h);
    const spotRev = spotMW * (pricePred - 0.183) * 0.92;
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      AGC: parseFloat(agcMW.toFixed(0)),
      现货: parseFloat(spotMW.toFixed(0)),
      AGC收益: parseFloat(agcRev.toFixed(2)),
      现货收益: parseFloat(spotRev.toFixed(2)),
      综合收益: parseFloat((agcRev + spotRev).toFixed(2)),
    };
  });
}

// ─── K值历史 ──────────────────────────────────────────────────────
const kHistory = Array.from({ length: 30 }, (_, i) => ({
  day: `03/${String(i + 1).padStart(2, '0')}`,
  K值: parseFloat((0.86 + Math.random() * 0.1).toFixed(4)),
  排名: Math.floor(3 + Math.random() * 8),
  调频里程: Math.round(800 + Math.random() * 400),
  调频收益: Math.round(12000 + Math.random() * 8000),
}));

// ─── 主组件 ──────────────────────────────────────────────────────
export default function SmartBidding() {
  const { colors: c } = useTheme();
  const [activeTab, setActiveTab] = useState('optimize');
  const [capacity, setCapacity] = useState(150);
  const [bidMode, setBidMode] = useState<BidMode>('报量报价');
  const [bidPoints, setBidPoints] = useState<BidPoint[]>(() => generate96Points(150, K_VALUE));
  const [optHistory] = useState(generateOptHistory());
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [currentKv] = useState(K_VALUE);

  useEffect(() => {
    setBidPoints(generate96Points(capacity, currentKv));
    setSubmitted(false);
  }, [capacity, bidMode, currentKv]);

  const totalRevenue = bidPoints.reduce((a, b) => a + b.expectedRevenue, 0);
  const agcPoints = bidPoints.filter(b => b.market === 'AGC');
  const spotPoints = bidPoints.filter(b => b.market === '现货');
  const agcRevenue = agcPoints.reduce((a, b) => a + b.expectedRevenue, 0);
  const spotRevenue = spotPoints.reduce((a, b) => a + b.expectedRevenue, 0);

  // 今日多市场分配结果
  const todayAgcMW = Math.round(optHistory.reduce((a, b) => a + b.AGC, 0) / 24);
  const todaySpotMW = Math.round(optHistory.reduce((a, b) => a + b.现货, 0) / 24);

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };

  const mktColors: Record<Market, string> = { AGC: '#00d4ff', 现货: '#ffb800', 备用: '#a78bfa' };

  const bidColumns: ColumnType<BidPoint>[] = [
    {
      title: '时间', dataIndex: 'time', width: 70,
      render: (v: string) => <span style={{ color: c.textMuted, fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '时段', dataIndex: 'period', width: 55,
      render: (v: string) => {
        const periodColors: Record<string, string> = { 谷: '#00ff88', 峰: '#ffb800', 尖峰: '#ff4d4d', 平: '#aab4c8' };
        return <Tag style={{ color: periodColors[v], borderColor: periodColors[v], background: `${periodColors[v]}15`, fontSize: 11, padding: '0 4px', margin: 0 }}>{v}</Tag>;
      },
    },
    {
      title: '预测电价', dataIndex: 'pricePred', width: 90,
      render: (v: number) => <span style={{ color: v > 1 ? '#ff4d4d' : v > 0.5 ? '#ffb800' : '#00ff88', fontSize: 12 }}>¥{v}</span>,
    },
    {
      title: '推荐市场', dataIndex: 'market', width: 80,
      render: (v: Market) => <Tag style={{ color: mktColors[v], borderColor: mktColors[v], background: `${mktColors[v]}15`, fontSize: 11, padding: '0 5px', margin: 0 }}>{v}</Tag>,
    },
    {
      title: '申报量(MW)', dataIndex: 'declaredMW', width: 90,
      render: (v: number) => <span style={{ color: c.textPrimary, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: '报价(元/kWh)', dataIndex: 'bidPrice', width: 110,
      render: (v: number | null) => v ? <span style={{ color: '#ffb800' }}>¥{v}</span> : <span style={{ color: c.textDim }}>市场出清</span>,
    },
    {
      title: '预期收益(元)', dataIndex: 'expectedRevenue', width: 110,
      render: (v: number) => <span style={{ color: '#00ff88', fontWeight: 600 }}>¥{v.toFixed(0)}</span>,
    },
  ];

  return (
    <div>
      {/* 页头 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>智能申报与收益寻优</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            多市场收益最大化 · 报量报价自动生成 · 广东现货 + 二次调频 · K值 {currentKv}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: c.textMuted, fontSize: 12 }}>智能寻优</span>
            <Switch checked={autoOptimize} onChange={setAutoOptimize} style={{ background: autoOptimize ? c.primary : undefined }} />
          </div>
          <Tag color={currentKv >= 0.9 ? 'success' : 'warning'} style={{ borderRadius: 6, fontSize: 12 }}>
            K值 {currentKv} {currentKv >= 0.9 ? '(优秀)' : '(良好)'}
          </Tag>
        </div>
      </div>

      {/* KPI 顶部 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: '明日预期总收益', value: `¥${(totalRevenue / 10000).toFixed(2)}万`, color: '#00ff88', sub: '96点合计' },
          { label: 'AGC调频收益', value: `¥${(agcRevenue / 10000).toFixed(2)}万`, color: '#00d4ff', sub: `${agcPoints.length}个时段` },
          { label: '现货套利收益', value: `¥${(spotRevenue / 10000).toFixed(2)}万`, color: '#ffb800', sub: `${spotPoints.length}个时段` },
          { label: '调频分配容量', value: `${todayAgcMW} MW`, color: '#00d4ff', sub: `占比 ${Math.round(todayAgcMW / capacity * 100)}%` },
          { label: '现货分配容量', value: `${todaySpotMW} MW`, color: '#ffb800', sub: `占比 ${Math.round(todaySpotMW / capacity * 100)}%` },
        ].map(item => (
          <Col key={item.label} flex="1" style={{ minWidth: 140 }}>
            <Card style={cardStyle} styles={{ body: { padding: '12px 16px' } }}>
              <div style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: item.color, fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</div>
              <div style={{ color: c.textDim, fontSize: 11, marginTop: 4 }}>{item.sub}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab} onChange={setActiveTab}
        tabBarStyle={{ borderBottom: `1px solid ${c.primaryBorderLight}`, marginBottom: 16 }}
        items={[
          { key: 'optimize', label: '多市场收益寻优' },
          { key: 'bidding', label: '96点申报计划' },
          { key: 'kvalue', label: 'K值与调频管理' },
        ]}
      />

      {/* ── TAB 1: 多市场收益寻优 ─────────────────────────────────── */}
      {activeTab === 'optimize' && (
        <Row gutter={[16, 16]}>
          {/* 寻优决策说明 */}
          <Col span={24}>
            <Alert
              message={
                <span>
                  <FireOutlined style={{ color: '#ffb800', marginRight: 6 }} />
                  <strong>今日寻优策略：</strong>
                  00:00-07:00 全量参与AGC调频（谷段无套利空间）；
                  09:00-11:00 切换现货放电（峰段价差¥0.78/kWh优于调频）；
                  14:00-17:00 全量现货尖峰放电（价差¥1.06/kWh，远优于调频）；
                  其余时段维持AGC作为基础收益。
                </span>
              }
              type="info" showIcon={false}
              style={{ background: c.primaryMuted, border: `1px solid ${c.primaryBorder}` }}
            />
          </Col>

          {/* 24h容量分配图 */}
          <Col xs={24} lg={16}>
            <Card title={<span style={{ color: c.primary }}>24小时市场容量分配（MW）</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={optHistory} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="hour" stroke={c.textDim} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="MW" domain={[0, capacity + 20]} />
                  <RTooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }}
                    formatter={(v, n) => [`${v} MW`, n === 'AGC' ? 'AGC调频' : '现货套利']} />
                  <Legend />
                  <ReferenceLine y={capacity} stroke="rgba(255,184,0,0.3)" strokeDasharray="4 4" label={{ value: '额定容量', fill: '#ffb800', fontSize: 10 }} />
                  <Bar dataKey="AGC" fill={c.primary} stackId="a" name="AGC调频" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="现货" fill="#ffb800" stackId="a" name="现货套利" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 收益对比 */}
          <Col xs={24} lg={8}>
            <Card title={<span style={{ color: c.primary }}>调频 vs 现货收益对比</span>} style={cardStyle} styles={{ header: headStyle }}>
              {[
                {
                  label: 'AGC调频（全量）', rev: agcRevenue, color: '#00d4ff', desc: '100% 容量全投AGC',
                  items: ['稳定收益，不依赖电价', '容量补偿+里程补偿', '受K值排名影响'],
                },
                {
                  label: '现货套利（全量）', rev: spotRevenue * 1.4, color: '#ffb800', desc: '100% 容量投现货',
                  items: ['高风险高收益', '依赖峰谷价差', '受市场出清价影响'],
                },
                {
                  label: '智能寻优（推荐）', rev: totalRevenue, color: '#00ff88', desc: '动态分配，最优解',
                  items: ['实时决策分配', '两市场协同套利', '预期综合收益最高'],
                  recommended: true,
                },
              ].map((opt, i) => (
                <div key={i} style={{
                  padding: '12px 14px', marginBottom: 8, borderRadius: 8,
                  background: opt.recommended ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${opt.recommended ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <span style={{ color: opt.color, fontWeight: 700, fontSize: 13 }}>{opt.label}</span>
                      {opt.recommended && <Tag color="success" style={{ marginLeft: 6, fontSize: 10 }}>推荐</Tag>}
                    </div>
                    <span style={{ color: opt.color, fontWeight: 700, fontSize: 15 }}>¥{(opt.rev / 10000).toFixed(2)}万</span>
                  </div>
                  {opt.items.map((item, j) => (
                    <div key={j} style={{ color: c.textDim, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: opt.color, fontSize: 8 }}>▸</span> {item}
                    </div>
                  ))}
                </div>
              ))}
            </Card>
          </Col>

          {/* 24h综合收益趋势 */}
          <Col span={24}>
            <Card title={<span style={{ color: c.primary }}>24小时分时段收益拆解（元）</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={optHistory} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spotGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ffb800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="hour" stroke={c.textDim} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="元" />
                  <RTooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`¥${v}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="AGC收益" stroke={c.primary} fill="url(#agcGrad)" strokeWidth={1.5} name="调频收益" />
                  <Area type="monotone" dataKey="现货收益" stroke="#ffb800" fill="url(#spotGrad)" strokeWidth={1.5} name="现货收益" />
                  <Line type="monotone" dataKey="综合收益" stroke="#00ff88" strokeWidth={2.5} dot={false} name="综合收益" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* ── TAB 2: 96点申报计划 ───────────────────────────────────── */}
      {activeTab === 'bidding' && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card style={cardStyle} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>申报容量（MW）</div>
                  <InputNumber min={10} max={200} value={capacity} onChange={v => setCapacity(v ?? 150)}
                    style={{ width: 120 }} addonAfter="MW" />
                </div>
                <div>
                  <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 6 }}>申报模式</div>
                  <Select value={bidMode} onChange={setBidMode} style={{ width: 140 }}>
                    <Option value="报量报价">报量报价</Option>
                    <Option value="报量不报价">报量不报价</Option>
                  </Select>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {submitted ? (
                    <Alert message="申报计划已提交至交易中心" type="success" showIcon style={{ padding: '4px 12px' }} />
                  ) : (
                    <>
                      <Button icon={<DownloadOutlined />}
                        style={{ background: c.bgCard, border: `1px solid ${c.primaryBorder}`, color: c.primary }}
                        onClick={() => {
                          const csv = ['时间,时段,预测电价,推荐市场,申报量(MW),报价(元/kWh),预期收益(元)',
                            ...bidPoints.map(b => `${b.time},${b.period},${b.pricePred},${b.market},${b.declaredMW},${b.bidPrice ?? '市场出清'},${b.expectedRevenue}`)
                          ].join('\n');
                          const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.download = `申报计划_${new Date().toISOString().slice(0, 10)}.csv`;
                          a.click(); URL.revokeObjectURL(url);
                        }}>
                        导出申报表
                      </Button>
                      <Button type="primary" icon={<ThunderboltOutlined />}
                        style={{ background: c.primary, border: 'none', color: c.bgPage, fontWeight: 700 }}
                        onClick={() => setSubmitted(true)}>
                        提交申报
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                {[
                  { label: '合计申报量', value: `${Math.round(bidPoints.reduce((a, b) => a + b.declaredMW, 0) / 96)} MW均值` },
                  { label: 'AGC时段', value: `${agcPoints.length} 个（${Math.round(agcPoints.length / 96 * 100)}%）` },
                  { label: '现货时段', value: `${spotPoints.length} 个（${Math.round(spotPoints.length / 96 * 100)}%）` },
                  { label: '明日预期收益', value: `¥${(totalRevenue / 10000).toFixed(2)}万` },
                ].map(item => (
                  <div key={item.label} style={{ fontSize: 12 }}>
                    <span style={{ color: c.textDim }}>{item.label}：</span>
                    <span style={{ color: c.primary, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card
              title={<span style={{ color: c.primary }}>次日96点申报计划表（15分钟粒度）</span>}
              style={cardStyle} styles={{ header: headStyle }}
              extra={<span style={{ color: c.textDim, fontSize: 12 }}>共96个申报时段 · 模式：{bidMode}</span>}
            >
              <Table
                dataSource={bidPoints}
                columns={bidColumns}
                rowKey="key"
                pagination={{ pageSize: 16, showTotal: t => `共 ${t} 个时段`, showSizeChanger: false }}
                size="small"
                rowClassName={(r) => r.market === '现货' ? 'spot-row' : ''}
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}><span style={{ color: c.textMuted }}>合计</span></Table.Summary.Cell>
                      <Table.Summary.Cell index={4}><span style={{ color: c.textPrimary, fontWeight: 600 }}>{Math.round(bidPoints.reduce((a, b) => a + b.declaredMW, 0) / 96)} MW</span></Table.Summary.Cell>
                      <Table.Summary.Cell index={5} />
                      <Table.Summary.Cell index={6}><span style={{ color: '#00ff88', fontWeight: 700 }}>¥{totalRevenue.toFixed(0)}</span></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* ── TAB 3: K值与调频管理 ──────────────────────────────────── */}
      {activeTab === 'kvalue' && (
        <Row gutter={[16, 16]}>
          {/* K值实时 */}
          <Col xs={24} md={8}>
            <Card title={<span style={{ color: c.primary }}>K值实时状态</span>} style={cardStyle} styles={{ header: headStyle }}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: currentKv >= 0.9 ? '#00ff88' : '#ffb800', lineHeight: 1 }}>
                  {currentKv}
                </div>
                <div style={{ color: c.textMuted, fontSize: 13, marginTop: 8 }}>综合K值</div>
                <Tag color={currentKv >= 0.9 ? 'success' : 'warning'} style={{ marginTop: 10, fontSize: 13, padding: '2px 16px' }}>
                  {currentKv >= 0.9 ? '优秀等级 · 指令优先分配' : '良好等级'}
                </Tag>
              </div>
              <div style={{ marginTop: 16 }}>
                {[
                  { label: '响应速度得分', value: 0.94, color: '#00ff88' },
                  { label: '响应精度得分', value: 0.89, color: '#00d4ff' },
                  { label: '调频里程得分', value: 0.92, color: '#ffb800' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: c.textMuted, fontSize: 12 }}>{item.label}</span>
                      <span style={{ color: item.color, fontWeight: 600, fontSize: 12 }}>{item.value}</span>
                    </div>
                    <Progress percent={item.value * 100} showInfo={false} strokeColor={item.color} trailColor={c.bgElevated} size="small" />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '10px 12px', background: c.bgPage, borderRadius: 8 }}>
                <div style={{ color: c.textDim, fontSize: 12, marginBottom: 4 }}>当前调频市场排名</div>
                <div style={{ color: '#00ff88', fontSize: 24, fontWeight: 700 }}>
                  第 <span style={{ fontSize: 36 }}>4</span> 名
                  <span style={{ color: c.textDim, fontSize: 12, marginLeft: 8 }}>/ 广东23家参与方</span>
                </div>
                <div style={{ color: c.textDim, fontSize: 11, marginTop: 4 }}>排名前5可获得额外10%指令分配</div>
              </div>
            </Card>
          </Col>

          {/* K值雷达 */}
          <Col xs={24} md={8}>
            <Card title={<span style={{ color: c.primary }}>K值能力雷达图</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[
                  { subject: '响应速度', A: 94, fullMark: 100 },
                  { subject: '响应精度', A: 89, fullMark: 100 },
                  { subject: '调频里程', A: 92, fullMark: 100 },
                  { subject: 'SOH健康度', A: 87, fullMark: 100 },
                  { subject: '可用容量', A: 95, fullMark: 100 },
                  { subject: '合规性', A: 100, fullMark: 100 },
                ]}>
                  <PolarGrid stroke={c.primaryBorderLight} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: c.textMuted, fontSize: 12 }} />
                  <Radar name="当前K值" dataKey="A" stroke={c.primary} fill={c.primary} fillOpacity={0.2} />
                  <RTooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 本月调频收益 */}
          <Col xs={24} md={8}>
            <Card title={<span style={{ color: c.primary }}>本月调频收益与里程</span>} style={cardStyle} styles={{ header: headStyle }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                {[
                  { label: '本月调频收益', value: `¥${(kHistory.slice(-16).reduce((a, b) => a + b.调频收益, 0) / 10000).toFixed(1)}万`, color: '#00d4ff' },
                  { label: '本月调频里程', value: `${kHistory.slice(-16).reduce((a, b) => a + b.调频里程, 0).toLocaleString()} MWh`, color: '#ffb800' },
                  { label: '平均K值', value: (kHistory.slice(-16).reduce((a, b) => a + b.K值, 0) / 16).toFixed(4), color: '#00ff88' },
                  { label: '日均调频指令', value: '约 840 次', color: '#aab4c8' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
                    <span style={{ color: c.textMuted, fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 15 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,77,77,0.06)', borderRadius: 8, border: '1px solid rgba(255,77,77,0.2)' }}>
                <div style={{ color: '#ff4d4d', fontSize: 12, marginBottom: 4 }}>⚠ SOH影响预警</div>
                <div style={{ color: '#aab4c8', fontSize: 12 }}>
                  富山站 E001 电池衰减导致实际可用容量约 <strong style={{ color: '#ffb800' }}>143MW</strong>（标称150MW），已自动核减申报量，防止欠量考核。
                </div>
              </div>
            </Card>
          </Col>

          {/* K值历史趋势 */}
          <Col span={24}>
            <Card title={<span style={{ color: c.primary }}>近30日K值历史趋势</span>} style={cardStyle} styles={{ header: headStyle }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={kHistory} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                  <XAxis dataKey="day" stroke={c.textDim} tick={{ fontSize: 10 }} interval={4} />
                  <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} domain={[0.8, 1.0]} tickFormatter={v => v.toFixed(2)} />
                  <RTooltip contentStyle={{ background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <ReferenceLine y={0.9} stroke="rgba(0,255,136,0.4)" strokeDasharray="4 4" label={{ value: '优秀线 0.9', fill: '#00ff88', fontSize: 10 }} />
                  <ReferenceLine y={0.85} stroke="rgba(255,184,0,0.4)" strokeDasharray="4 4" label={{ value: '合格线 0.85', fill: '#ffb800', fontSize: 10 }} />
                  <Line type="monotone" dataKey="K值" stroke={c.primary} strokeWidth={2.5} dot={{ fill: c.primary, r: 3 }} activeDot={{ r: 5 }} name="综合K值" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

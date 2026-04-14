import { Row, Col, Card, Table, Tag, Timeline, Statistic, Button } from 'antd';
import { LinkOutlined, RiseOutlined, FallOutlined, SwapOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';

const agent = agents.find(a => a.key === 'market-intelligence')!;

const priceData = [
  { month: '2025-10', 广东: 0.78, 山东: 0.92, 山西: 0.65 },
  { month: '2025-12', 广东: 0.82, 山东: 0.95, 山西: 0.68 },
  { month: '2026-01', 广东: 0.80, 山东: 0.98, 山西: 0.66 },
  { month: '2026-02', 广东: 0.85, 山东: 1.02, 山西: 0.70 },
  { month: '2026-03', 广东: 0.83, 山东: 0.99, 山西: 0.72 },
  { month: '2026-04', 广东: 0.81, 山东: 1.01, 山西: 0.69 },
];

interface PolicyUpdate {
  date: string;
  title: string;
  impact: 'positive' | 'neutral' | 'negative';
  summary: string;
}

const policyUpdates: PolicyUpdate[] = [
  { date: '2026-04-12', title: '广东VPP参与现货市场门槛调整', impact: 'positive', summary: '单个交易单元调节能力门槛从2MW降至1MW' },
  { date: '2026-04-08', title: '山东储能容量补偿标准公示', impact: 'positive', summary: '独立储能容量电价参照煤电标准，约180元/kW·年' },
  { date: '2026-04-02', title: '浙江峰谷电价调整', impact: 'negative', summary: '峰谷价差缩小0.05元/kWh，影响储能套利收益' },
  { date: '2026-03-28', title: '全国碳市场扩围至铝冶炼', impact: 'positive', summary: '铝冶炼纳入碳交易，信发/兆丰客户碳资产价值提升' },
  { date: '2026-03-20', title: '发改委发布第二批零碳园区申报通知', impact: 'positive', summary: '预计6-8月完成材料报送，10-12月公布名单' },
];

const impactConfig = {
  positive: { color: '#00ff88', icon: <RiseOutlined />, text: '利好' },
  neutral: { color: '#ffb800', icon: <SwapOutlined />, text: '中性' },
  negative: { color: '#ff4d4f', icon: <FallOutlined />, text: '利空' },
};

interface CompetitorMove {
  key: string;
  player: string;
  category: string;
  action: string;
  date: string;
  threat: number;
}

const competitorMoves: CompetitorMove[] = [
  { key: '1', player: '南网综能', category: '电网系', action: '广东VPP聚合用户突破500个', date: '2026-04-10', threat: 5 },
  { key: '2', player: '阳光电源', category: '设备系', action: '发布工商业储能全栈解决方案', date: '2026-04-05', threat: 3 },
  { key: '3', player: '特来电', category: '充电系', action: '充电桩VPP聚合容量达200MW', date: '2026-04-01', threat: 3 },
  { key: '4', player: '弘正储能', category: '独立聚合商', action: '完成A轮融资2亿元', date: '2026-03-25', threat: 2 },
];

export default function MarketIntelligenceTab() {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const competitorColumns = [
    { title: '玩家', dataIndex: 'player', key: 'player', render: (v: string) => <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{v}</span> },
    { title: '类别', dataIndex: 'category', key: 'category', render: (v: string) => <Tag color={colors.primary}>{v}</Tag> },
    { title: '动态', dataIndex: 'action', key: 'action', render: (v: string) => <span style={{ color: colors.textSecondary }}>{v}</span> },
    { title: '时间', dataIndex: 'date', key: 'date' },
    { title: '威胁', dataIndex: 'threat', key: 'threat', render: (v: number) => '★'.repeat(v) + '☆'.repeat(5 - v) },
  ];

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        {/* Key Metrics */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>广东峰谷价差</span>} value={0.81} suffix="元/kWh" valueStyle={{ color: '#00ff88', fontSize: 18 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>山东峰谷价差</span>} value={1.01} suffix="元/kWh" valueStyle={{ color: '#00ff88', fontSize: 18 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>碳交易价格</span>} value={80} suffix="元/t" valueStyle={{ color: colors.primary, fontSize: 18 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>本周政策更新</span>} value={3} suffix="条" valueStyle={{ color: '#ffb800', fontSize: 18 }} />
            </Card>
          </Col>
        </Row>

        {/* Price Trends */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>各省峰谷价差趋势</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.primaryBorder} />
              <XAxis dataKey="month" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="广东" stroke="#00ff88" strokeWidth={2} />
              <Line type="monotone" dataKey="山东" stroke="#00d4ff" strokeWidth={2} />
              <Line type="monotone" dataKey="山西" stroke="#ffb800" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Policy Updates */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>政策动态</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Timeline
            items={policyUpdates.map(p => {
              const ic = impactConfig[p.impact];
              return {
                dot: ic.icon,
                color: ic.color,
                children: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13 }}>{p.title}</span>
                      <Tag color={ic.color}>{ic.text}</Tag>
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: 12, margin: '4px 0' }}>{p.summary}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11 }}>{p.date}</div>
                  </div>
                ),
              };
            })}
          />
        </Card>

        {/* Competitor Intelligence */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>竞品动态</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Table columns={competitorColumns} dataSource={competitorMoves} size="small" pagination={false} />
        </Card>

        <Button icon={<LinkOutlined />} onClick={() => navigate('/spot-market')} style={{ color: colors.primary }}>
          前往现货交易 &rarr;
        </Button>
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '广东最新峰谷电价政策变化',
            '碳交易扩围对铝冶炼客户的影响',
            '南网综能VPP业务对我们的威胁',
          ]}
        />
      </Col>
    </Row>
  );
}

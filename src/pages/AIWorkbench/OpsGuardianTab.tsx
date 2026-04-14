import { Row, Col, Card, Table, Tag, Progress, Badge, Statistic } from 'antd';
import { LinkOutlined, WarningOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';
import { mockDevices } from '../../mock/data';
import type { Device } from '../../mock/data';
import { Button } from 'antd';

const agent = agents.find(a => a.key === 'ops-guardian')!;

// SOH trend data (mock)
const sohTrend = [
  { month: '2025-10', 富山站: 98.2, 聚龙站: 97.8, 化龙站: 96.5 },
  { month: '2025-12', 富山站: 97.5, 聚龙站: 97.1, 化龙站: 95.2 },
  { month: '2026-02', 富山站: 96.8, 聚龙站: 96.4, 化龙站: 93.8 },
  { month: '2026-04', 富山站: 96.1, 聚龙站: 95.7, 化龙站: 92.1 },
  { month: '2026-06', 富山站: 95.5, 聚龙站: 95.0, 化龙站: 90.5 },
  { month: '2026-08', 富山站: 94.9, 聚龙站: 94.3, 化龙站: 88.8 },
  { month: '2026-10', 富山站: 94.3, 聚龙站: 93.6, 化龙站: 87.2 },
  { month: '2026-12', 富山站: 93.7, 聚龙站: 93.0, 化龙站: 85.5 },
];

interface WorkOrder {
  key: string;
  device: string;
  type: string;
  priority: 'urgent' | 'important' | 'normal';
  description: string;
  assignee: string;
  eta: string;
}

const mockWorkOrders: WorkOrder[] = [
  { key: '1', device: '化龙站储能', type: 'SOH异常', priority: 'important', description: '#B03电芯组SOH降至92.1%，衰减速率偏高', assignee: '林伟权', eta: '24h内' },
  { key: '2', device: '充电桩群-CBD', type: '通信中断', priority: 'urgent', description: '通信中断超30分钟，需现场排查', assignee: '待指派', eta: '立即' },
  { key: '3', device: '富山站储能', type: '定期巡检', priority: 'normal', description: '月度巡检：冷却系统、端子紧固、外观检查', assignee: '林伟权', eta: '下次巡检' },
];

const priorityConfig = {
  urgent: { color: '#ff4d4f', text: '紧急' },
  important: { color: '#ffb800', text: '重要' },
  normal: { color: '#00ff88', text: '一般' },
};

export default function OpsGuardianTab() {
  const { colors } = useTheme();
  const navigate = useNavigate();

  // Filter storage devices from mock data
  const storageDevices = mockDevices.filter((d: Device) =>
    d.type === '电网储能' || d.type === '储能系统'
  ).slice(0, 7);

  const statusColors: Record<string, string> = {
    '在线': '#00ff88', '离线': '#4a5568', '维护': '#ffb800', '告警': '#ff4d4f', '在建': '#1890ff',
  };

  const deviceColumns = [
    { title: '设备', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{v}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Badge color={statusColors[v]} text={<span style={{ color: colors.textSecondary }}>{v}</span>} /> },
    { title: 'SOC', dataIndex: 'soc', key: 'soc', render: (v: number | undefined) => v !== undefined ? <Progress percent={v} size="small" strokeColor={v > 20 ? '#00ff88' : '#ff4d4f'} /> : '—' },
    { title: 'SOH', dataIndex: 'soh', key: 'soh', render: (v: number | undefined) => v !== undefined ? (
      <span style={{ color: v >= 90 ? '#00ff88' : v >= 85 ? '#ffb800' : '#ff4d4f', fontWeight: 600 }}>{v}%</span>
    ) : '—' },
    { title: '温度', dataIndex: 'temperature', key: 'temperature', render: (v: number | undefined) => v !== undefined ? (
      <span style={{ color: v <= 40 ? colors.textSecondary : '#ff4d4f' }}>{v}°C</span>
    ) : '—' },
  ];

  const orderColumns = [
    { title: '设备', dataIndex: 'device', key: 'device' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={colors.primary}>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (v: keyof typeof priorityConfig) => {
      const pc = priorityConfig[v];
      return <Tag color={pc.color}>{pc.text}</Tag>;
    }},
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => <span style={{ color: colors.textSecondary, fontSize: 12 }}>{v}</span> },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee' },
    { title: '预计处理', dataIndex: 'eta', key: 'eta' },
  ];

  const onlineCount = storageDevices.filter((d: Device) => d.status === '在线').length;
  const alertCount = storageDevices.filter((d: Device) => d.status === '告警').length;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        {/* Summary */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>在线设备</span>} value={onlineCount} suffix={`/ ${storageDevices.length}`} valueStyle={{ color: '#00ff88' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>告警设备</span>} value={alertCount} valueStyle={{ color: alertCount > 0 ? '#ff4d4f' : '#00ff88' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>平均可用率</span>} value={96.8} suffix="%" valueStyle={{ color: colors.primary }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ background: colors.bgCard, borderColor: colors.primaryBorder, textAlign: 'center' }}>
              <Statistic title={<span style={{ color: colors.textMuted }}>待处理工单</span>} value={mockWorkOrders.length} valueStyle={{ color: '#ffb800' }} />
            </Card>
          </Col>
        </Row>

        {/* Device Status */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>储能设备状态</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Table columns={deviceColumns} dataSource={storageDevices.map((d: Device) => ({ ...d, key: d.id }))} size="small" pagination={false} />
        </Card>

        {/* SOH Trend */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>SOH衰减趋势预测</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
          extra={<Tag color="#ffb800"><WarningOutlined /> 化龙站预计2027年Q3触达85%更换阈值</Tag>}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sohTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.primaryBorder} />
              <XAxis dataKey="month" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <YAxis domain={[80, 100]} tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="富山站" stroke="#00ff88" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="聚龙站" stroke="#00d4ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="化龙站" stroke="#ff4d4f" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Work Orders */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>智能工单</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Table columns={orderColumns} dataSource={mockWorkOrders} size="small" pagination={false} />
        </Card>

        <Button icon={<LinkOutlined />} onClick={() => navigate('/devices')} style={{ color: colors.primary }}>
          前往设备资产 &rarr;
        </Button>
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '化龙站SOH衰减速率是否正常？',
            '充电桩群-CBD通信中断如何排查',
            '预测性维护能减少多少非计划停机',
          ]}
        />
      </Col>
    </Row>
  );
}

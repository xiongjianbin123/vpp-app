import { useState } from 'react';
import { Row, Col, Card, Form, InputNumber, Select, Button, Statistic, Table, Tag } from 'antd';
import { CalculatorOutlined, LinkOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';

const agent = agents.find(a => a.key === 'revenue-calculator')!;

interface ScenarioResult {
  key: string;
  scenario: string;
  annualRevenue: number;
  enabled: boolean;
  note: string;
}

const mockScenarios: ScenarioResult[] = [
  { key: '1', scenario: '峰谷套利', annualRevenue: 87.6, enabled: true, note: '价差0.73元/kWh，日充放1.5次' },
  { key: '2', scenario: '需求响应', annualRevenue: 12.0, enabled: true, note: '年响应20次，200元/kW·次' },
  { key: '3', scenario: '容量电价', annualRevenue: 0, enabled: false, note: '工商业储能不适用（仅独立储能）' },
  { key: '4', scenario: '碳交易', annualRevenue: 3.2, enabled: true, note: '碳价80元/t，减排400tCO2' },
];

const monteCarloData = [
  { range: 'P10（悲观）', irr: 6.2, npv: 45, payback: 8.1 },
  { range: 'P50（中性）', irr: 10.8, npv: 128, payback: 5.6 },
  { range: 'P90（乐观）', irr: 15.4, npv: 215, payback: 4.2 },
];

const chartData = [
  { year: '第1年', 收入: 102.8, 成本: 185 },
  { year: '第2年', 收入: 100.9, 成本: 15 },
  { year: '第3年', 收入: 99.1, 成本: 15 },
  { year: '第4年', 收入: 97.3, 成本: 18 },
  { year: '第5年', 收入: 95.5, 成本: 15 },
  { year: '第6年', 收入: 93.8, 成本: 22 },
  { year: '第7年', 收入: 92.1, 成本: 15 },
  { year: '第8年', 收入: 90.4, 成本: 15 },
  { year: '第9年', 收入: 88.8, 成本: 15 },
  { year: '第10年', 收入: 87.2, 成本: 18 },
];

export default function RevenueCalculatorTab() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [calculated, setCalculated] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCalculate = () => {
    setLoading(true);
    setTimeout(() => {
      setCalculated(true);
      setLoading(false);
    }, 1500);
  };

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        {/* Parameter Input */}
        <Card
          title={<span style={{ color: colors.textPrimary }}>项目参数</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>储能功率 (MW)</span>}>
                  <InputNumber defaultValue={2} min={0.1} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>储能容量 (MWh)</span>}>
                  <InputNumber defaultValue={4} min={0.2} step={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>所在省份</span>}>
                  <Select defaultValue="广东" options={[
                    { label: '广东', value: '广东' }, { label: '山东', value: '山东' },
                    { label: '山西', value: '山西' }, { label: '浙江', value: '浙江' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>项目类型</span>}>
                  <Select defaultValue="工商业储能" options={[
                    { label: '工商业储能', value: '工商业储能' },
                    { label: '独立储能(>50MW)', value: '独立储能' },
                    { label: '用户侧储能(<1MW)', value: '用户侧储能' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>EMC合同期 (年)</span>}>
                  <InputNumber defaultValue={10} min={3} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>Monte Carlo模拟次数</span>}>
                  <InputNumber defaultValue={10000} min={1000} step={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<CalculatorOutlined />} onClick={onCalculate} loading={loading}>
              运行收益测算
            </Button>
          </Form>
        </Card>

        {calculated && (
          <>
            {/* Monte Carlo Results */}
            <Card
              title={<span style={{ color: colors.textPrimary }}>Monte Carlo模拟结果（10,000次）</span>}
              size="small"
              style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
            >
              <Row gutter={16} style={{ marginBottom: 16 }}>
                {monteCarloData.map(row => (
                  <Col key={row.range} span={8}>
                    <Card size="small" style={{ background: colors.bgElevated, borderColor: colors.primaryBorder, textAlign: 'center' }}>
                      <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>{row.range}</div>
                      <Statistic
                        title={<span style={{ color: colors.textSecondary, fontSize: 11 }}>IRR</span>}
                        value={row.irr}
                        suffix="%"
                        valueStyle={{ color: row.irr >= 10 ? '#00ff88' : row.irr >= 7 ? '#ffb800' : '#ff4d4f', fontSize: 22 }}
                      />
                      <div style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                        NPV: {row.npv}万 | 回本: {row.payback}年
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Tag color="#ff4d4f" style={{ marginBottom: 8 }}>
                <ThunderboltOutlined /> 政策纠偏：容量电价仅适用于电网侧独立储能，工商业储能不享受
              </Tag>

              <Table
                columns={[
                  { title: '收益场景', dataIndex: 'scenario', key: 'scenario' },
                  { title: '年收益(万元)', dataIndex: 'annualRevenue', key: 'annualRevenue',
                    render: (v: number, r: ScenarioResult) => <span style={{ color: r.enabled ? '#00ff88' : colors.textMuted }}>{v || '—'}</span> },
                  { title: '状态', dataIndex: 'enabled', key: 'enabled',
                    render: (v: boolean) => v ? <Tag color="#00ff88">已计入</Tag> : <Tag color="#ff4d4f">不适用</Tag> },
                  { title: '说明', dataIndex: 'note', key: 'note', render: (v: string) => <span style={{ color: colors.textSecondary, fontSize: 12 }}>{v}</span> },
                ]}
                dataSource={mockScenarios}
                size="small"
                pagination={false}
              />
            </Card>

            {/* Revenue Chart */}
            <Card
              title={<span style={{ color: colors.textPrimary }}>10年收入 vs 成本</span>}
              size="small"
              style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.primaryBorder} />
                  <XAxis dataKey="year" tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="收入" fill="#00ff88" />
                  <Bar dataKey="成本" fill="#ff4d4f" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Button icon={<LinkOutlined />} onClick={() => navigate('/investment')} style={{ color: colors.primary }}>
              前往投资测算 &rarr;
            </Button>
          </>
        )}
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '广东2MW/4MWh工商业储能的预期IRR',
            '山东五段式电价下储能收益如何',
            '峰谷价差缩小20%对回本期的影响',
          ]}
        />
      </Col>
    </Row>
  );
}

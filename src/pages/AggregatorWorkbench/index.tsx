import { useState } from 'react';
import { Row, Col, Card, Table, Tag, Tabs, Steps, Button, Progress, Statistic, message } from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, DollarOutlined, EnvironmentOutlined,
  UserAddOutlined, LinkOutlined, RocketOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import type { ColumnType } from 'antd/es/table';
import GuangdongMap from '../../components/GuangdongMap';

// ─── 资源池数据 ─────────────────────────────────────────────────────────
interface ResourceUser {
  key: string;
  name: string;
  type: string;
  capacity: number;
  status: '已接入' | '测试中' | '待签约' | '已离线' | '在建';
  city: string;
  joinDate: string;
  monthlyRevenue: number;
}

const resourceUsers: ResourceUser[] = [
  { key: '1', name: '富山站储能', type: '电网储能', capacity: 150, status: '已接入', city: '广州番禺', joinDate: '2025-06-15', monthlyRevenue: 48.5 },
  { key: '2', name: '聚龙站储能', type: '电网储能', capacity: 150, status: '已接入', city: '广州番禺', joinDate: '2025-07-20', monthlyRevenue: 42.3 },
  { key: '3', name: '厚德站储能', type: '电网储能', capacity: 100, status: '已接入', city: '广州海珠', joinDate: '2025-04-10', monthlyRevenue: 32.1 },
  { key: '4', name: '化龙站储能', type: '电网储能', capacity: 100, status: '已接入', city: '广州番禺', joinDate: '2025-05-18', monthlyRevenue: 35.8 },
  { key: '5', name: '科城站储能', type: '电网储能', capacity: 200, status: '已接入', city: '广州黄埔', joinDate: '2025-09-01', monthlyRevenue: 62.4 },
  { key: '6', name: '鱼飞站储能', type: '电网储能', capacity: 150, status: '已接入', city: '广州南沙', joinDate: '2025-08-12', monthlyRevenue: 45.2 },
  { key: '7', name: '象山站储能', type: '电网储能', capacity: 200, status: '已接入', city: '深圳宝安', joinDate: '2025-10-05', monthlyRevenue: 56.8 },
  { key: '8', name: '工业负荷-钢厂', type: '工业负荷', capacity: 40, status: '已接入', city: '河北唐山', joinDate: '2025-03-01', monthlyRevenue: 8.2 },
  { key: '9', name: '光伏电站-北区', type: '光伏电站', capacity: 50, status: '已接入', city: '北京朝阳', joinDate: '2024-12-01', monthlyRevenue: 12.5 },
  { key: '10', name: '顶盛物业储能', type: '储能系统', capacity: 0.65, status: '在建', city: '中山', joinDate: '2026-03-01', monthlyRevenue: 0 },
  { key: '15', name: '蔚蓝服饰储能', type: '储能系统', capacity: 0.783, status: '在建', city: '湛江', joinDate: '2026-03-15', monthlyRevenue: 0 },
  { key: '16', name: '弘国五金储能', type: '储能系统', capacity: 2.61, status: '在建', city: '惠州', joinDate: '2026-02-20', monthlyRevenue: 0 },
  { key: '11', name: '充电桩群-园区', type: '充电桩', capacity: 3, status: '测试中', city: '北京昌平', joinDate: '2026-02-01', monthlyRevenue: 0 },
  { key: '12', name: '工业负荷-化工', type: '工业负荷', capacity: 35, status: '已接入', city: '天津东丽', joinDate: '2025-06-01', monthlyRevenue: 6.5 },
  { key: '13', name: '充电桩群-CBD', type: '充电桩', capacity: 5, status: '已离线', city: '北京西城', joinDate: '2025-01-10', monthlyRevenue: 0 },
  { key: '14', name: '顺德光伏园', type: '光伏电站', capacity: 60, status: '待签约', city: '佛山顺德', joinDate: '', monthlyRevenue: 0 },
  { key: '15', name: '松山湖高科', type: '工业负荷', capacity: 25, status: '待签约', city: '东莞', joinDate: '', monthlyRevenue: 0 },
];

const statusColors: Record<string, string> = {
  '已接入': '#00ff88', '测试中': '#00d4ff', '待签约': '#ffb800', '已离线': '#4a5568', '在建': '#1890ff',
};

const typeColorMap: Record<string, string> = {
  '电网储能': '#38bdf8', '储能系统': '#00d4ff', '光伏电站': '#ffb800', '充电桩': '#a78bfa', '工业负荷': '#fb923c',
};

// ─── 收益分配数据 ─────────────────────────────────────────────────────────
interface RevenueRow {
  key: string;
  name: string;
  totalRevenue: number;
  platformFee: number;
  userShare: number;
  status: '已结算' | '待结算';
  period: string;
}

const revenueData: RevenueRow[] = [
  { key: '1', name: '富山站储能', totalRevenue: 48.5, platformFee: 7.28, userShare: 41.22, status: '已结算', period: '2026年3月' },
  { key: '2', name: '聚龙站储能', totalRevenue: 42.3, platformFee: 6.35, userShare: 35.95, status: '已结算', period: '2026年3月' },
  { key: '3', name: '科城站储能', totalRevenue: 62.4, platformFee: 9.36, userShare: 53.04, status: '待结算', period: '2026年3月' },
  { key: '4', name: '厚德站储能', totalRevenue: 32.1, platformFee: 4.82, userShare: 27.28, status: '已结算', period: '2026年3月' },
  { key: '5', name: '化龙站储能', totalRevenue: 35.8, platformFee: 5.37, userShare: 30.43, status: '已结算', period: '2026年3月' },
  { key: '6', name: '鱼飞站储能', totalRevenue: 45.2, platformFee: 6.78, userShare: 38.42, status: '待结算', period: '2026年3月' },
  { key: '7', name: '象山站储能', totalRevenue: 56.8, platformFee: 8.52, userShare: 48.28, status: '已结算', period: '2026年3月' },
  { key: '8', name: '工业负荷-钢厂', totalRevenue: 8.2, platformFee: 1.23, userShare: 6.97, status: '已结算', period: '2026年3月' },
];

// 月度收益趋势
const monthlyTrend = [
  { month: '10月', 平台收益: 28, 用户分成: 186 },
  { month: '11月', 平台收益: 35, 用户分成: 228 },
  { month: '12月', 平台收益: 42, 用户分成: 275 },
  { month: '1月', 平台收益: 38, 用户分成: 248 },
  { month: '2月', 平台收益: 45, 用户分成: 295 },
  { month: '3月', 平台收益: 52, 用户分成: 338 },
];

function exportSettlement(data: RevenueRow[]) {
  const headers = ['用户名称', '期间', '总收益(万元)', '平台服务费(万元)', '用户分成(万元)', '状态'];
  const rows = data.map(d => [d.name, d.period, d.totalRevenue, d.platformFee, d.userShare, d.status]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VPP收益结算单_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('结算单已导出');
}

export default function AggregatorWorkbench() {
  const { colors: c } = useTheme();
  const [activeTab, setActiveTab] = useState('pool');

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };
  const tooltipStyle = { background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8 };

  const totalCapacity = resourceUsers.filter(u => u.status === '已接入').reduce((s, u) => s + u.capacity, 0);
  const totalMonthlyRevenue = resourceUsers.reduce((s, u) => s + u.monthlyRevenue, 0);

  // 资源池表格列
  const poolColumns: ColumnType<ResourceUser>[] = [
    {
      title: '用户名称', dataIndex: 'name',
      render: (v: string, r: ResourceUser) => <span style={{ color: typeColorMap[r.type] || c.textPrimary, fontWeight: 600, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '类型', dataIndex: 'type',
      render: (v: string) => <Tag style={{ color: typeColorMap[v], borderColor: typeColorMap[v], background: `${typeColorMap[v]}15`, fontSize: 10 }}>{v}</Tag>,
      filters: [...new Set(resourceUsers.map(u => u.type))].map(t => ({ text: t, value: t })),
      onFilter: (v, r) => r.type === v,
    },
    {
      title: '容量', dataIndex: 'capacity',
      sorter: (a, b) => a.capacity - b.capacity,
      render: (v: number) => <span style={{ color: c.textSecondary, fontSize: 12 }}>{v} MW</span>,
    },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[v], display: 'inline-block' }} />
          <span style={{ color: statusColors[v], fontSize: 11 }}>{v}</span>
        </span>
      ),
      filters: Object.keys(statusColors).map(s => ({ text: s, value: s })),
      onFilter: (v, r) => r.status === v,
    },
    {
      title: '城市', dataIndex: 'city',
      render: (v: string) => <span style={{ color: c.textDim, fontSize: 11 }}>{v}</span>,
    },
    {
      title: '月收益', dataIndex: 'monthlyRevenue',
      sorter: (a, b) => a.monthlyRevenue - b.monthlyRevenue,
      render: (v: number) => v > 0
        ? <span style={{ color: c.success, fontWeight: 600, fontSize: 12 }}>¥{v}万</span>
        : <span style={{ color: c.textDim, fontSize: 12 }}>—</span>,
    },
  ];

  // 收益分配表格列
  const revenueColumns: ColumnType<RevenueRow>[] = [
    { title: '用户', dataIndex: 'name', render: (v: string) => <span style={{ color: c.textPrimary, fontWeight: 500, fontSize: 12 }}>{v}</span> },
    { title: '期间', dataIndex: 'period', render: (v: string) => <span style={{ color: c.textDim, fontSize: 11 }}>{v}</span> },
    { title: '总收益(万元)', dataIndex: 'totalRevenue', sorter: (a, b) => a.totalRevenue - b.totalRevenue, render: (v: number) => <span style={{ color: c.primary, fontWeight: 600 }}>¥{v}</span> },
    { title: '平台服务费(15%)', dataIndex: 'platformFee', render: (v: number) => <span style={{ color: c.textSecondary }}>¥{v}</span> },
    { title: '用户分成(85%)', dataIndex: 'userShare', render: (v: number) => <span style={{ color: c.success, fontWeight: 600 }}>¥{v}</span> },
    { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === '已结算' ? 'success' : 'warning'}>{v}</Tag> },
  ];

  // 接入向导步骤
  const onboardingSteps = [
    { title: '意向洽谈', desc: '用户表达接入意向，平台评估资源适配性', count: 2, color: '#a78bfa' },
    { title: '技术测试', desc: '接入设备调试、通信协议对接、能力验证', count: 1, color: '#00d4ff' },
    { title: '合同签约', desc: '签署聚合服务协议，约定分成比例', count: 2, color: '#ffb800' },
    { title: '系统接入', desc: '设备注册、通信链路建立、数据采集', count: 0, color: '#00ff88' },
    { title: '正式上线', desc: '开始参与市场交易，产生实际收益', count: 10, color: '#00ff88' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>聚合商工作台</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            资源池 {resourceUsers.length} 户 · 总容量 {totalCapacity} MW · 月收益 ¥{totalMonthlyRevenue.toFixed(1)}万
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '资源池规模', value: resourceUsers.length, unit: '户', color: c.primary, icon: <TeamOutlined /> },
          { title: '已接入容量', value: totalCapacity, unit: 'MW', color: '#38bdf8', icon: <LinkOutlined /> },
          { title: '本月总收益', value: totalMonthlyRevenue.toFixed(1), unit: '万元', color: c.success, icon: <DollarOutlined /> },
          { title: '平台分成', value: (totalMonthlyRevenue * 0.15).toFixed(1), unit: '万元', color: '#ffb800', icon: <DollarOutlined /> },
          { title: '待签约', value: resourceUsers.filter(u => u.status === '待签约').length, unit: '户', color: c.warning, icon: <UserAddOutlined /> },
          { title: '用户续约率', value: '94.2', unit: '%', color: c.success, icon: <CheckCircleOutlined /> },
        ].map(item => (
          <Col key={item.title} xs={12} md={4}>
            <Card style={{ ...cardStyle, border: `1px solid ${item.color}25` }} styles={{ body: { padding: '14px 16px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: item.color, fontSize: 16 }}>{item.icon}</span>
                <span style={{ color: c.textMuted, fontSize: 11 }}>{item.title}</span>
              </div>
              <div style={{ color: item.color, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                {item.value}
                <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, opacity: 0.8 }}>{item.unit}</span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pool',
            label: <span><TeamOutlined /> 资源池</span>,
            children: (
              <Card style={cardStyle} styles={{ header: headerStyle }}>
                <Table
                  dataSource={resourceUsers}
                  columns={poolColumns}
                  rowKey="key"
                  pagination={{ pageSize: 10, showTotal: t => `共 ${t} 户` }}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><span style={{ color: c.textMuted }}>合计</span></Table.Summary.Cell>
                        <Table.Summary.Cell index={2}><span style={{ color: c.primary, fontWeight: 700 }}>{resourceUsers.reduce((s, u) => s + u.capacity, 0)} MW</span></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} colSpan={2} />
                        <Table.Summary.Cell index={5}><span style={{ color: c.success, fontWeight: 700 }}>¥{totalMonthlyRevenue.toFixed(1)}万</span></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>
            ),
          },
          {
            key: 'onboard',
            label: <span><RocketOutlined /> 接入向导</span>,
            children: (
              <Card style={cardStyle}>
                <div style={{ marginBottom: 24 }}>
                  <Steps
                    current={-1}
                    items={onboardingSteps.map(s => ({
                      title: <span style={{ color: s.color, fontSize: 13 }}>{s.title}</span>,
                      description: <span style={{ color: c.textDim, fontSize: 11 }}>{s.desc}</span>,
                      icon: s.count > 0 ? (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: `${s.color}20`, border: `2px solid ${s.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: s.color, fontSize: 12, fontWeight: 700,
                        }}>{s.count}</div>
                      ) : undefined,
                    }))}
                  />
                </div>
                <Row gutter={[16, 16]}>
                  {onboardingSteps.map((step, i) => (
                    <Col xs={24} md={Math.floor(24 / onboardingSteps.length) || 4} key={i}>
                      <Card style={{ background: c.bgElevated, border: `1px solid ${step.color}25`, borderRadius: 8 }} styles={{ body: { padding: 14 } }}>
                        <div style={{ color: step.color, fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{step.count}</div>
                        <div style={{ color: c.textSecondary, fontSize: 12 }}>{step.title}</div>
                        <div style={{ color: c.textDim, fontSize: 10, marginTop: 4 }}>{step.desc}</div>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* 待处理事项 */}
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ color: c.primary, fontSize: 14, marginBottom: 12 }}>待处理事项</h4>
                  {[
                    { name: '顺德光伏园', action: '签署聚合服务协议', stage: '待签约', color: '#ffb800' },
                    { name: '松山湖高科', action: '签署聚合服务协议', stage: '待签约', color: '#ffb800' },
                    { name: '充电桩群-园区', action: '完成通信协议对接测试', stage: '测试中', color: '#00d4ff' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px', marginBottom: 8,
                      background: c.bgElevated, borderRadius: 8,
                      border: `1px solid ${item.color}25`,
                    }}>
                      <div>
                        <span style={{ color: c.textPrimary, fontSize: 13, fontWeight: 500 }}>{item.name}</span>
                        <span style={{ color: c.textDim, fontSize: 11, marginLeft: 8 }}>{item.action}</span>
                      </div>
                      <Tag style={{ color: item.color, borderColor: item.color, background: `${item.color}15` }}>{item.stage}</Tag>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
          {
            key: 'revenue',
            label: <span><DollarOutlined /> 收益分配</span>,
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} lg={14}>
                    <Card title={<span style={{ color: c.primary }}>月度收益趋势</span>} style={cardStyle} styles={{ header: headerStyle }}>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                          <XAxis dataKey="month" stroke={c.textDim} tick={{ fontSize: 11 }} />
                          <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="万" />
                          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`¥${v}万`, '']} />
                          <Legend />
                          <Bar dataKey="用户分成" fill="#00ff88" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="平台收益" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card title={<span style={{ color: c.primary }}>分成模型</span>} style={cardStyle} styles={{ header: headerStyle }}>
                      <div style={{ padding: '10px 0' }}>
                        {[
                          { label: '用户分成比例', value: '85%', color: c.success },
                          { label: '平台服务费', value: '15%', color: c.primary },
                          { label: '结算周期', value: '月度', color: c.textSecondary },
                          { label: '最低保底', value: '¥0.5万/MW/月', color: c.warning },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.borderSubtle}` }}>
                            <span style={{ color: c.textMuted, fontSize: 13 }}>{item.label}</span>
                            <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Statistic
                          title={<span style={{ color: c.textDim, fontSize: 11 }}>本月平台净收益</span>}
                          value={(totalMonthlyRevenue * 0.15).toFixed(1)}
                          prefix="¥"
                          suffix="万元"
                          valueStyle={{ color: c.primary, fontSize: 28 }}
                        />
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: c.primary }}>结算明细</span>
                      <Button icon={<DownloadOutlined />} size="small"
                        style={{ background: c.bgElevated, border: `1px solid ${c.primaryBorder}`, color: c.primary }}
                        onClick={() => exportSettlement(revenueData)}>
                        导出结算单
                      </Button>
                    </div>
                  }
                  style={cardStyle} styles={{ header: headerStyle }}
                >
                  <Table
                    dataSource={revenueData}
                    columns={revenueColumns}
                    rowKey="key"
                    pagination={false}
                    summary={() => (
                      <Table.Summary>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}><span style={{ color: c.textMuted }}>合计</span></Table.Summary.Cell>
                          <Table.Summary.Cell index={2}><span style={{ color: c.primary, fontWeight: 700 }}>¥{revenueData.reduce((s, r) => s + r.totalRevenue, 0).toFixed(1)}</span></Table.Summary.Cell>
                          <Table.Summary.Cell index={3}><span style={{ color: c.textSecondary }}>¥{revenueData.reduce((s, r) => s + r.platformFee, 0).toFixed(2)}</span></Table.Summary.Cell>
                          <Table.Summary.Cell index={4}><span style={{ color: c.success, fontWeight: 700 }}>¥{revenueData.reduce((s, r) => s + r.userShare, 0).toFixed(2)}</span></Table.Summary.Cell>
                          <Table.Summary.Cell index={5} />
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'recruit',
            label: <span><EnvironmentOutlined /> 招募地图</span>,
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title={<span style={{ color: c.primary }}>广东省潜在用户分布</span>} style={cardStyle} styles={{ header: headerStyle }}>
                    <GuangdongMap style={{ height: 340 }} />
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card title={<span style={{ color: c.primary }}>招募统计</span>} style={cardStyle} styles={{ header: headerStyle }}>
                    <Row gutter={[12, 16]}>
                      {[
                        { label: '潜在用户', value: 342, unit: '户', color: c.primary },
                        { label: '已接触', value: 86, unit: '户', color: '#ffb800' },
                        { label: '转化中', value: 23, unit: '户', color: '#00d4ff' },
                        { label: '本月新签', value: 5, unit: '户', color: c.success },
                      ].map(item => (
                        <Col span={12} key={item.label}>
                          <div style={{ textAlign: 'center', padding: 16, background: c.bgElevated, borderRadius: 8, border: `1px solid ${item.color}20` }}>
                            <div style={{ color: item.color, fontSize: 28, fontWeight: 700 }}>{item.value}</div>
                            <div style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>{item.label}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ color: c.primary, fontSize: 13, marginBottom: 10 }}>重点城市招募进度</h4>
                      {[
                        { city: '广州', total: 120, converted: 45, color: '#38bdf8' },
                        { city: '深圳', total: 85, converted: 18, color: '#00d4ff' },
                        { city: '佛山', total: 45, converted: 12, color: '#ffb800' },
                        { city: '东莞', total: 52, converted: 8, color: '#00ff88' },
                        { city: '珠海', total: 40, converted: 3, color: '#a78bfa' },
                      ].map(item => (
                        <div key={item.city} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: c.textSecondary, fontSize: 12 }}>{item.city}</span>
                            <span style={{ color: c.textDim, fontSize: 11 }}>{item.converted}/{item.total} 户</span>
                          </div>
                          <Progress
                            percent={Math.round((item.converted / item.total) * 100)}
                            strokeColor={item.color}
                            trailColor={c.bgElevated}
                            size="small"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
}

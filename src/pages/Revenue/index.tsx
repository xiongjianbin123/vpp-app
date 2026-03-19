import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Statistic, Tag, DatePicker, message } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { getMonthlyRevenue } from '../../services/revenueService';
import { useTheme } from '../../context/ThemeContext';
import type { ColumnType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;


interface SubsidyItem {
  key: string;
  date: string;
  type: string;
  power: number;
  duration: number;
  unitPrice: number;
  amount: number;
  status: string;
}

const allSubsidyData: SubsidyItem[] = [
  { key: '1', date: '2026-03-13', type: '调峰补贴', power: 50, duration: 3, unitPrice: 800, amount: 120000, status: '已结算' },
  { key: '2', date: '2026-03-13', type: '调频补贴', power: 30, duration: 2, unitPrice: 1200, amount: 72000, status: '已结算' },
  { key: '3', date: '2026-03-12', type: '辅助服务', power: 40, duration: 4, unitPrice: 600, amount: 96000, status: '已结算' },
  { key: '4', date: '2026-03-12', type: '调峰补贴', power: 45, duration: 3, unitPrice: 800, amount: 108000, status: '结算中' },
  { key: '5', date: '2026-03-11', type: '备用容量', power: 20, duration: 8, unitPrice: 400, amount: 64000, status: '已结算' },
  { key: '6', date: '2026-03-11', type: '调频补贴', power: 25, duration: 2, unitPrice: 1200, amount: 60000, status: '已结算' },
  { key: '7', date: '2026-03-10', type: '辅助服务', power: 35, duration: 3, unitPrice: 600, amount: 63000, status: '待结算' },
  { key: '8', date: '2026-03-10', type: '调峰补贴', power: 60, duration: 2, unitPrice: 800, amount: 96000, status: '已结算' },
  { key: '9', date: '2026-03-09', type: '调峰补贴', power: 55, duration: 4, unitPrice: 800, amount: 176000, status: '已结算' },
  { key: '10', date: '2026-03-09', type: '调频补贴', power: 28, duration: 2, unitPrice: 1200, amount: 67200, status: '已结算' },
  { key: '11', date: '2026-03-08', type: '辅助服务', power: 42, duration: 3, unitPrice: 600, amount: 75600, status: '已结算' },
  { key: '12', date: '2026-03-07', type: '备用容量', power: 18, duration: 6, unitPrice: 400, amount: 43200, status: '已结算' },
];

const typeColorMap: Record<string, string> = {
  '调峰补贴': '#00d4ff', '调频补贴': '#00ff88', '辅助服务': '#ffb800', '备用容量': '#a78bfa',
};

const statusColorMap: Record<string, string> = {
  '已结算': 'success', '结算中': 'processing', '待结算': 'warning',
};

function exportCsv(data: SubsidyItem[]) {
  const headers = ['日期', '补贴类型', '响应功率(MW)', '持续时长(h)', '单价(元/MWh)', '结算金额(元)', '状态'];
  const rows = data.map(d => [d.date, d.type, d.power, d.duration, d.unitPrice, d.amount, d.status]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VPP收益报表_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('报表已导出');
}

export default function Revenue() {
  const { colors: c } = useTheme();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; 调峰收益: number; 调频收益: number; 辅助服务: number; 总收益: number }>>([]);

  useEffect(() => {
    getMonthlyRevenue().then(records => {
      setMonthlyData(records.map(r => ({
        month: r.month,
        调峰收益: r.peakRevenue,
        调频收益: r.freqRevenue,
        辅助服务: r.auxRevenue,
        总收益: r.totalRevenue,
      })));
    }).catch(() => {});
  }, []);

  const subsidyData = dateRange && dateRange[0] && dateRange[1]
    ? allSubsidyData.filter(d => {
        const date = new Date(d.date);
        return date >= dateRange[0]!.toDate() && date <= dateRange[1]!.toDate();
      })
    : allSubsidyData;

  const totalRevenue = monthlyData.reduce((a, b) => a + b['总收益'], 0);
  const settled = subsidyData.filter(s => s.status === '已结算').reduce((a, b) => a + b.amount, 0);
  const settling = subsidyData.filter(s => s.status === '结算中').reduce((a, b) => a + b.amount, 0);
  const pending = subsidyData.filter(s => s.status === '待结算').reduce((a, b) => a + b.amount, 0);

  const trendData = Object.entries(
    allSubsidyData.reduce((acc, d) => {
      acc[d.date] = (acc[d.date] || 0) + d.amount;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: date.slice(5), 日收益: amount }));

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };
  const tooltipStyle = { background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8 };

  const subsidyColumns: ColumnType<SubsidyItem>[] = [
    {
      title: '日期',
      dataIndex: 'date',
      render: (v: string) => <span style={{ color: c.textMuted, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '补贴类型',
      dataIndex: 'type',
      render: (v: string) => (
        <Tag style={{ color: typeColorMap[v], borderColor: typeColorMap[v], background: `${typeColorMap[v]}15` }}>{v}</Tag>
      ),
    },
    {
      title: '响应功率',
      dataIndex: 'power',
      render: (v: number) => <span style={{ color: c.textSecondary }}>{v} MW</span>,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      render: (v: number) => <span style={{ color: c.textSecondary }}>{v} h</span>,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      render: (v: number) => <span style={{ color: c.textSecondary }}>¥{v}/MWh</span>,
    },
    {
      title: '结算金额',
      dataIndex: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => <span style={{ color: c.success, fontWeight: 600 }}>¥{(v / 10000).toFixed(2)}万</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => <Tag color={statusColorMap[v]}>{v}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>收益结算</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            年度累计收益 ¥{(totalRevenue / 10000).toFixed(1)}万
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <RangePicker
            style={{ background: c.bgCard, border: `1px solid ${c.primaryBorder}` }}
            placeholder={['开始日期', '结束日期']}
            onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
            suffixIcon={<FilterOutlined style={{ color: c.textDim }} />}
          />
          <Button
            icon={<DownloadOutlined />}
            style={{ background: c.bgCard, border: `1px solid ${c.primaryBorder}`, color: c.primary }}
            onClick={() => exportCsv(subsidyData)}
          >
            导出报表
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '本月收益', value: monthlyData[2]['总收益'], color: c.primary },
          { title: '已结算金额', value: settled, color: c.success },
          { title: '结算中金额', value: settling, color: c.warning },
          { title: '待结算金额', value: pending, color: c.textSecondary },
        ].map(item => (
          <Col key={item.title} xs={12} md={6}>
            <Card
              style={{ background: c.bgCard, border: `1px solid ${item.color}25`, borderRadius: 12 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Statistic
                title={<span style={{ color: c.textMuted, fontSize: 12 }}>{item.title}</span>}
                value={item.value}
                prefix={<span style={{ color: item.color }}>¥</span>}
                valueStyle={{ color: item.color, fontSize: 22, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ color: c.primary }}>月度收益统计（2026年）</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                <XAxis dataKey="month" stroke={c.textDim} tick={{ fontSize: 12 }} />
                <YAxis stroke={c.textDim} tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`¥${(Number(v) / 10000).toFixed(1)}万`, '']}
                />
                <Legend />
                <Bar dataKey="调峰收益" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="调频收益" fill="#00ff88" radius={[4, 4, 0, 0]} />
                <Bar dataKey="辅助服务" fill="#ffb800" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ color: c.primary }}>近期日收益趋势</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                <XAxis dataKey="date" stroke={c.textDim} tick={{ fontSize: 11 }} />
                <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`¥${(Number(v) / 10000).toFixed(2)}万`, '日收益']}
                />
                <Line type="monotone" dataKey="日收益" stroke={c.primary} strokeWidth={2} dot={{ fill: c.primary, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: c.primary }}>补贴结算明细</span>
            {dateRange && (
              <Tag color="processing" style={{ cursor: 'pointer' }} onClick={() => setDateRange(null)}>
                已筛选 {subsidyData.length} 条 · 点击清除
              </Tag>
            )}
          </div>
        }
        style={cardStyle}
        styles={{ header: headerStyle }}
      >
        <Table
          dataSource={subsidyData}
          columns={subsidyColumns}
          rowKey="key"
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <span style={{ color: c.textMuted }}>合计</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <span style={{ color: c.success, fontWeight: 700 }}>
                    ¥{(subsidyData.reduce((a, b) => a + b.amount, 0) / 10000).toFixed(2)}万
                  </span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
}

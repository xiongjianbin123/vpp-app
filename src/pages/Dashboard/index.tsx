import { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, List, Tag, Button, Segmented, Table } from 'antd';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { getDashboard } from '../../services/dashboardService';
import {
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, CheckCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import AIAssistant, { SUGGESTED_QUESTIONS } from '../../components/AIAssistant';
import { useTheme } from '../../context/ThemeContext';
import { useDemoView, demoViewOptions } from '../../context/DemoContext';
import type { DemoView } from '../../context/DemoContext';
import GuangdongMap from '../../components/GuangdongMap';
import ChinaMap from '../../components/ChinaMap';
import type { ColumnType } from 'antd/es/table';

const COLORS = ['#38bdf8', '#00d4ff', '#ffb800', '#00ff88', '#a78bfa'];

const TYPE_LABEL_MAP: Record<string, string> = {
  '电网储能': '电网侧储能',
  '储能系统': '工商业储能',
  '光伏电站': '光伏',
  '风电': '风电',
  '充电桩': '柔性负荷',
  '工业负荷': '柔性负荷',
};

const alerts = [
  { id: 1, level: 'error', msg: '充电桩群-CBD 通信中断', time: '10:32', active: true },
  { id: 2, level: 'warning', msg: '储能系统-南区 SOC 低于 20%', time: '09:58', active: true },
  { id: 3, level: 'warning', msg: '电网频率波动：50.18Hz（超出±0.1Hz）', time: '09:14', active: true },
  { id: 4, level: 'success', msg: '调峰任务 T001 调度指令已下发', time: '08:45', active: false },
  { id: 5, level: 'success', msg: '风电场-北区恢复并网，功率 22.1MW', time: '08:10', active: false },
];

const alertConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  error: { color: '#ff4d4d', icon: <WarningOutlined style={{ color: '#ff4d4d' }} /> },
  warning: { color: '#ffb800', icon: <WarningOutlined style={{ color: '#ffb800' }} /> },
  success: { color: '#00ff88', icon: <CheckCircleOutlined style={{ color: '#00ff88' }} /> },
};

interface KpiCard {
  title: string;
  value: number | string;
  unit: string;
  color: string;
  trend: number;
  dynamic?: boolean;
}

function generateFreqData() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: i,
    频率: parseFloat((50 + (Math.random() - 0.5) * 0.2).toFixed(3)),
    电压: parseFloat((220 + (Math.random() - 0.5) * 5).toFixed(1)),
  }));
}

// 设备资产汇总数据（用户指定的所有设备）
interface DeviceAssetRow {
  key: string;
  name: string;
  type: string;
  capacity: string;
  status: string;
  location: string;
  currentPower: number;
}

const deviceAssets: DeviceAssetRow[] = [
  { key: 'E001', name: '富山站储能', type: '电网储能', capacity: '150MW/300MWh', status: '在线', location: '广州番禺', currentPower: 86.4 },
  { key: 'E002', name: '聚龙站储能', type: '电网储能', capacity: '150MW/300MWh', status: '在线', location: '广州番禺', currentPower: 72.0 },
  { key: 'E003', name: '厚德站储能', type: '电网储能', capacity: '100MW/200MWh', status: '在线', location: '广州海珠', currentPower: 48.5 },
  { key: 'E004', name: '化龙站储能', type: '电网储能', capacity: '100MW/200MWh', status: '在线', location: '广州番禺', currentPower: 61.2 },
  { key: 'E005', name: '科城站储能', type: '电网储能', capacity: '200MW/400MWh', status: '在线', location: '广州黄埔', currentPower: 118.6 },
  { key: 'E006', name: '鱼飞站储能', type: '电网储能', capacity: '150MW/300MWh', status: '在线', location: '广州南沙', currentPower: 94.3 },
  { key: 'E007', name: '象山站储能', type: '电网储能', capacity: '200MW/400MWh', status: '在线', location: '深圳宝安', currentPower: 112.0 },
  { key: 'D004', name: '充电桩群-CBD', type: '充电桩', capacity: '5MW', status: '告警', location: '北京西城', currentPower: 0 },
  { key: 'D005', name: '工业负荷-钢厂', type: '工业负荷', capacity: '40MW', status: '在线', location: '河北唐山', currentPower: 32.0 },
  { key: 'D006', name: '光伏电站-南区', type: '光伏电站', capacity: '25MW', status: '维护', location: '北京大兴', currentPower: 0 },
  { key: 'D007', name: '储能系统-B', type: '储能系统', capacity: '15MW/30MWh', status: '在线', location: '天津滨海', currentPower: 8.5 },
  { key: 'D008', name: '风电场-西区', type: '风电', capacity: '20MW', status: '离线', location: '张家口', currentPower: 0 },
  { key: 'D009', name: '充电桩群-园区', type: '充电桩', capacity: '3MW', status: '在线', location: '北京昌平', currentPower: 1.8 },
  { key: 'D010', name: '工业负荷-化工', type: '工业负荷', capacity: '35MW', status: '在线', location: '天津东丽', currentPower: 28.5 },
];

const typeColorMap: Record<string, string> = {
  '电网储能': '#38bdf8', '储能系统': '#00d4ff', '光伏电站': '#ffb800',
  '风电': '#00ff88', '充电桩': '#a78bfa', '工业负荷': '#fb923c',
};

const statusDotMap: Record<string, string> = {
  '在线': '#00ff88', '离线': '#4a5568', '维护': '#ffb800', '告警': '#ff4d4d',
};

// KPI presets per demo view
const viewKpiPresets: Record<DemoView, KpiCard[]> = {
  overview: [
    { title: '聚合容量', value: 350, unit: 'MW', color: '#00d4ff', trend: 0 },
    { title: '接入用户', value: 187, unit: '户', color: '#00ff88', trend: 12 },
    { title: '今日响应收益', value: 43.8, unit: '万元', color: '#ffb800', trend: 8.2, dynamic: true },
    { title: '年度累计收益', value: 4380, unit: '万元', color: '#00d4ff', trend: 15.3 },
    { title: '响应合格率', value: '91.7', unit: '%', color: '#00ff88', trend: 0 },
    { title: '在线率', value: '96.3', unit: '%', color: '#00ff88', trend: 0 },
  ],
  dispatch: [
    { title: '可控容量', value: 320, unit: 'MW', color: '#00d4ff', trend: 0 },
    { title: '待命资源', value: 165, unit: '个', color: '#00ff88', trend: 3 },
    { title: '今日响应', value: 3, unit: '次', color: '#ffb800', trend: 0 },
    { title: '完成率', value: '91.7', unit: '%', color: '#00ff88', trend: 2.1 },
    { title: '平均延迟', value: 18, unit: '秒', color: '#00d4ff', trend: -3 },
    { title: '系统在线率', value: '99.7', unit: '%', color: '#00ff88', trend: 0 },
  ],
  investment: [
    { title: '年化 IRR', value: '12.3', unit: '%', color: '#00ff88', trend: 0 },
    { title: '资产总规模', value: 8.5, unit: '亿元', color: '#00d4ff', trend: 0 },
    { title: '年度总收益', value: 4380, unit: '万元', color: '#ffb800', trend: 15.3 },
    { title: '多市场收益占比', value: '68', unit: '%', color: '#00d4ff', trend: 0 },
    { title: 'NPV', value: 2.1, unit: '亿元', color: '#00ff88', trend: 0 },
    { title: '资产利用率', value: '78', unit: '%', color: '#ffb800', trend: 5.2 },
  ],
  aggregator: [
    { title: '资源池', value: 187, unit: '户', color: '#00d4ff', trend: 0 },
    { title: '活跃用户', value: 156, unit: '户', color: '#00ff88', trend: 8 },
    { title: '本月分成', value: 128, unit: '万元', color: '#ffb800', trend: 12.5, dynamic: true },
    { title: '新签约', value: 12, unit: '户', color: '#00d4ff', trend: 4 },
    { title: '累计分成', value: 1580, unit: '万元', color: '#00ff88', trend: 0 },
    { title: '用户续约率', value: '94', unit: '%', color: '#00ff88', trend: 0 },
  ],
  enduser: [
    { title: '本月节省', value: 8.2, unit: '万元', color: '#00ff88', trend: 15.3, dynamic: true },
    { title: '累计收益', value: 52, unit: '万元', color: '#00d4ff', trend: 0 },
    { title: '回收进度', value: '67', unit: '%', color: '#ffb800', trend: 0 },
    { title: '参与响应', value: 18, unit: '次', color: '#00d4ff', trend: 3 },
    { title: '设备在线率', value: '100', unit: '%', color: '#00ff88', trend: 0 },
    { title: '合同剩余', value: 28, unit: '月', color: '#ffb800', trend: 0 },
  ],
};

export default function Dashboard() {
  const { colors: c } = useTheme();
  const { currentView, setCurrentView } = useDemoView();
  const [powerData, setPowerData] = useState<Array<Record<string, string | number>>>([]);
  const [freqData, setFreqData] = useState(generateFreqData());
  const [currentPower, setCurrentPower] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [energyPie, setEnergyPie] = useState<Array<{ name: string; value: number }>>([]);
  const [deviceStatus, setDeviceStatus] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    getDashboard().then(data => {
      setPowerData(data.powerData);
      setCurrentPower(data.totalCurrentPower);
      setTotalCapacity(data.totalCapacity);
      setOnlineCount(data.onlineCount);
      const pieMap: Record<string, number> = {};
      Object.entries(data.energyPie).forEach(([type, value]) => {
        const label = TYPE_LABEL_MAP[type] ?? type;
        pieMap[label] = (pieMap[label] ?? 0) + (value as number);
      });
      setEnergyPie(Object.entries(pieMap).map(([name, value]) => ({ name, value: Math.round(value) })));
      const statusColors: Record<string, string> = { '在线': '#00ff88', '维护': '#ffb800', '告警': '#ff4d4d', '离线': '#4a5568' };
      setDeviceStatus(Object.entries(data.statusCount).map(([name, value]) => ({
        name, value: value as number, color: statusColors[name] ?? '#888',
      })));
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPower(prev => Math.round((prev + (Math.random() - 0.5) * 3) * 10) / 10);
      setFreqData(generateFreqData());
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // overview 视角使用后端真实数据（设备资产信息），其他视角使用演示预设
  const kpiCards: KpiCard[] = currentView === 'overview'
    ? [
        { title: '总装机容量', value: totalCapacity, unit: 'MW', color: c.primary, trend: 0 },
        { title: '在线设备', value: onlineCount, unit: '台', color: c.success, trend: -1 },
        { title: '当前出力功率', value: currentPower, unit: 'MW', color: c.primary, trend: 2.3, dynamic: true },
        { title: '今日发电量', value: 7842.6, unit: 'MWh', color: c.warning, trend: 5.7 },
        { title: '碳减排量', value: 3921.3, unit: 'tCO₂', color: c.success, trend: 5.7 },
      ]
    : viewKpiPresets[currentView];

  const activeAlerts = alerts.filter(a => a.active);
  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { borderBottom: `1px solid ${c.primaryBorderLight}`, background: 'transparent' };
  const tooltipStyle = { background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8 };

  // 设备资产表格列
  const assetColumns: ColumnType<DeviceAssetRow>[] = [
    {
      title: '设备名称', dataIndex: 'name', width: 130,
      render: (v: string, r: DeviceAssetRow) => (
        <span style={{ color: typeColorMap[r.type] || c.textPrimary, fontWeight: 600, fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: '类型', dataIndex: 'type', width: 80,
      render: (v: string) => (
        <Tag style={{ color: typeColorMap[v], borderColor: typeColorMap[v], background: `${typeColorMap[v]}15`, fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: '容量', dataIndex: 'capacity', width: 120,
      render: (v: string) => <span style={{ color: c.textSecondary, fontSize: 11 }}>{v}</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 70,
      render: (v: string) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDotMap[v], display: 'inline-block', boxShadow: `0 0 4px ${statusDotMap[v]}` }} />
          <span style={{ color: statusDotMap[v], fontSize: 11 }}>{v}</span>
        </span>
      ),
    },
    {
      title: '当前功率', dataIndex: 'currentPower', width: 80,
      render: (v: number) => <span style={{ color: v > 0 ? c.primary : c.textDim, fontSize: 11, fontFamily: 'monospace' }}>{v > 0 ? `${v}MW` : '—'}</span>,
    },
    {
      title: '位置', dataIndex: 'location', width: 80,
      render: (v: string) => <span style={{ color: c.textDim, fontSize: 11 }}>{v}</span>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>
            实时监控大屏
          </h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            数据每3秒自动刷新 · 最后更新：{lastUpdate.toLocaleTimeString('zh-CN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Segmented
            options={demoViewOptions}
            value={currentView}
            onChange={v => setCurrentView(v as DemoView)}
            style={{ background: c.bgElevated }}
          />
          {activeAlerts.length > 0 && (
            <Alert
              message={`当前 ${activeAlerts.length} 条未处理告警`}
              type="warning"
              showIcon
              style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)', borderRadius: 8 }}
            />
          )}
          <Button
            icon={<RobotOutlined />}
            onClick={() => setAiOpen(true)}
            style={{
              background: `linear-gradient(135deg, ${c.primaryMuted}, rgba(0,255,136,0.06))`,
              border: `1px solid ${c.primaryBorder}`,
              color: c.primary, borderRadius: 8, fontWeight: 600,
            }}
          >
            智能问数
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpiCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} md={8} lg={4} xl={4} style={{ flex: 1, minWidth: 160 }}>
            <Card style={cardStyle} styles={{ body: { padding: '16px' } }}>
              <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>{card.title}</div>
              <div style={{ color: card.color, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                {card.value}
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4, opacity: 0.8 }}>{card.unit}</span>
              </div>
              {card.trend !== 0 && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {card.trend > 0
                    ? <ArrowUpOutlined style={{ color: '#00ff88', fontSize: 11 }} />
                    : <ArrowDownOutlined style={{ color: '#ff4d4d', fontSize: 11 }} />
                  }
                  <span style={{ color: card.trend > 0 ? '#00ff88' : '#ff4d4d', fontSize: 11 }}>
                    {Math.abs(card.trend)}{card.unit === '台' ? '台' : '%'} 较昨日
                  </span>
                </div>
              )}
              {card.trend === 0 && (
                <div style={{ marginTop: 6, color: c.textDim, fontSize: 11 }}>总额定容量</div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 24h Power Curve */}
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ color: c.primary }}>24小时发电功率曲线</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={powerData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb800" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ffb800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                <XAxis dataKey="time" stroke={c.textDim} tick={{ fontSize: 11 }} />
                <YAxis stroke={c.textDim} tick={{ fontSize: 11 }} unit="MW" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.primary }} />
                <Legend />
                <ReferenceArea x1="14:00" x2="16:00" fill="#ff4d4f" fillOpacity={0.08} label={{ value: '午间调峰', position: 'insideTop', fill: '#ff4d4f', fontSize: 10 }} />
                <ReferenceArea x1="18:00" x2="20:00" fill="#ff4d4f" fillOpacity={0.08} label={{ value: '晚峰调峰', position: 'insideTop', fill: '#ff4d4f', fontSize: 10 }} />
                <Area type="monotone" dataKey="总功率" stroke="#00d4ff" fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="光伏" stroke="#ffb800" fill="url(#colorSolar)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="风电" stroke="#00ff88" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Guangdong Map */}
        <Col xs={24} lg={7}>
          <Card
            title={<span style={{ color: c.primary }}>广东省资源分布</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <GuangdongMap style={{ height: 220 }} />
          </Card>
        </Col>

        {/* Energy Pie */}
        <Col xs={24} lg={7}>
          <Card
            title={<span style={{ color: c.primary }}>能源结构</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={energyPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  isAnimationActive={false}
                  label={({ percent }: { percent?: number }) =>
                    percent && percent > 0.03 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {energyPie.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} MW`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 8px 8px' }}>
              {energyPie.map((item, index) => {
                const total = energyPie.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[index], flexShrink: 0 }} />
                      <span style={{ color: c.textSecondary, fontSize: 12 }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ color: COLORS[index], fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                      <span style={{ color: c.textDim, fontSize: 11 }}>{item.value} MW</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* 全国储能资产地图 */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ color: c.primary }}>全国储能资产分布地图</span>}
            style={cardStyle}
            styles={{ header: headerStyle }}
          >
            <ChinaMap style={{ height: 300 }} />
          </Card>
        </Col>

        {/* 设备资产列表 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>设备资产总览</span>
                <span style={{ color: c.textDim, fontSize: 11, fontWeight: 400 }}>
                  共 {deviceAssets.length} 台 · 在线 {deviceAssets.filter(d => d.status === '在线').length} 台 ·
                  总容量 {deviceAssets.reduce((s, d) => s + (parseFloat(d.capacity) || 0), 0).toFixed(0)}MW+
                </span>
              </div>
            }
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: '0 0 4px' } }}
          >
            <Table
              dataSource={deviceAssets}
              columns={assetColumns}
              size="small"
              pagination={false}
              scroll={{ y: 260 }}
              rowKey="key"
            />
          </Card>
        </Col>

        {/* Alert List */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>系统告警</span>
                <Tag color={activeAlerts.length > 0 ? 'error' : 'success'} style={{ margin: 0 }}>
                  {activeAlerts.length > 0 ? `${activeAlerts.length} 条待处理` : '无告警'}
                </Tag>
              </div>
            }
            style={cardStyle}
            styles={{ header: headerStyle, body: { padding: '0 0 4px' } }}
          >
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item style={{
                  padding: '10px 16px',
                  borderBottom: `1px solid ${c.borderSubtle}`,
                  background: item.active ? `${alertConfig[item.level].color}10` : 'transparent',
                }}>
                  <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{alertConfig[item.level].icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: item.active ? c.textPrimary : c.textMuted,
                        fontSize: 12, lineHeight: 1.4, wordBreak: 'break-all',
                      }}>{item.msg}</div>
                      <div style={{ color: c.textDim, fontSize: 11, marginTop: 2 }}>{item.time}</div>
                    </div>
                    {item.active && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: alertConfig[item.level].color,
                        flexShrink: 0, marginTop: 4,
                        animation: 'pulse 2s infinite',
                      }} />
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* AI 智能问数入口卡片 */}
        <Col xs={24} md={16}>
          <Card
            style={{
              background: `linear-gradient(135deg, ${c.primaryMuted}, rgba(0,255,136,0.04))`,
              border: `1px solid ${c.primaryBorder}`,
              borderRadius: 12, cursor: 'pointer',
            }}
            styles={{ body: { padding: '16px 20px' } }}
            onClick={() => setAiOpen(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `linear-gradient(135deg, ${c.primaryBorder}, rgba(0,255,136,0.15))`,
                  border: `1px solid ${c.primaryBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RobotOutlined style={{ color: c.primary, fontSize: 22 }} />
                </div>
                <div>
                  <div style={{ color: c.primary, fontSize: 15, fontWeight: 700 }}>AI 智能问数</div>
                  <div style={{ color: c.textDim, fontSize: 12, marginTop: 2 }}>
                    用自然语言查询任意运营数据，支持图表可视化
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED_QUESTIONS.slice(0, 3).map(q => (
                  <div key={q} style={{
                    background: c.primaryMuted, border: `1px solid ${c.primaryBorderLight}`,
                    borderRadius: 6, padding: '3px 10px', color: c.textMuted, fontSize: 11,
                  }}>
                    {q}
                  </div>
                ))}
                <div style={{ color: c.textDim, fontSize: 11, textAlign: 'right' }}>点击展开 →</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Device Status + Grid Freq */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={<span style={{ color: c.primary }}>电网频率实时监测</span>}
                style={cardStyle}
                styles={{ header: headerStyle }}
                extra={
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ color: c.primary, fontSize: 12 }}>
                      {freqData[freqData.length - 1]?.频率} Hz
                    </span>
                    <span style={{ color: '#00ff88', fontSize: 12 }}>
                      {freqData[freqData.length - 1]?.电压} V
                    </span>
                  </div>
                }
              >
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={freqData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.borderSubtle} />
                    <XAxis dataKey="t" hide />
                    <YAxis yAxisId="freq" domain={[49.8, 50.2]} stroke={c.primary} tick={{ fontSize: 11 }} unit="Hz" />
                    <YAxis yAxisId="volt" orientation="right" domain={[210, 230]} stroke="#00ff88" tick={{ fontSize: 11 }} unit="V" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Line yAxisId="freq" type="monotone" dataKey="频率" stroke={c.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="volt" type="monotone" dataKey="电压" stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={<span style={{ color: c.primary }}>设备状态分布</span>}
                style={cardStyle}
                styles={{ header: headerStyle }}
              >
                <Row gutter={[16, 0]}>
                  {deviceStatus.map(s => (
                    <Col span={8} key={s.name}>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ color: s.color, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ color: c.textSecondary, fontSize: 12, marginTop: 4 }}>{s.name}</div>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: s.color, margin: '6px auto 0',
                          boxShadow: `0 0 8px ${s.color}`,
                        }} />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

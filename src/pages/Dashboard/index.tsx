import { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, List, Tag } from 'antd';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { generate24hData } from '../../mock/data';
import {
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, CheckCircleOutlined,
} from '@ant-design/icons';

const COLORS = ['#00d4ff', '#00ff88', '#ffb800', '#ff6b6b'];

const energyPie = [
  { name: '光伏', value: 38.5 },
  { name: '储能', value: 23.7 },
  { name: '风电', value: 22.1 },
  { name: '柔性负荷', value: 44.2 },
];

const deviceStatus = [
  { name: '在线', value: 7, color: '#00ff88' },
  { name: '离线', value: 2, color: '#4a5568' },
  { name: '告警', value: 1, color: '#ff4d4d' },
];

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

export default function Dashboard() {
  const [powerData] = useState(generate24hData());
  const [freqData, setFreqData] = useState(generateFreqData());
  const [currentPower, setCurrentPower] = useState(128.5);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPower(prev => Math.round((prev + (Math.random() - 0.5) * 3) * 10) / 10);
      setFreqData(generateFreqData());
      setLastUpdate(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const kpiCards: KpiCard[] = [
    { title: '总装机容量', value: 243, unit: 'MW', color: '#00d4ff', trend: 0 },
    { title: '在线设备', value: 7, unit: '台', color: '#00ff88', trend: -1 },
    { title: '当前发电功率', value: currentPower, unit: 'MW', color: '#00d4ff', trend: 2.3, dynamic: true },
    { title: '今日发电量', value: 1842.6, unit: 'MWh', color: '#ffb800', trend: 5.7 },
    { title: '碳减排量', value: 921.3, unit: 'tCO₂', color: '#00ff88', trend: 5.7 },
  ];

  const activeAlerts = alerts.filter(a => a.active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
            实时监控大屏
          </h2>
          <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
            数据每3秒自动刷新 · 最后更新：{lastUpdate.toLocaleTimeString('zh-CN')}
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Alert
            message={`当前 ${activeAlerts.length} 条未处理告警`}
            type="warning"
            showIcon
            style={{ background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)', color: '#ffb800', borderRadius: 8 }}
          />
        )}
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {kpiCards.map((card) => (
          <Col key={card.title} xs={24} sm={12} md={8} lg={4} xl={4} style={{ flex: 1, minWidth: 160 }}>
            <Card
              style={{
                background: '#111827',
                border: `1px solid rgba(0, 212, 255, 0.2)`,
                borderRadius: 12,
              }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>{card.title}</div>
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
                <div style={{ marginTop: 6, color: '#4a6080', fontSize: 11 }}>总额定容量</div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 24h Power Curve */}
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ color: '#00d4ff' }}>24小时发电功率曲线</span>}
            style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
            styles={{ header: { borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' } }}
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#4a6080" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit="MW" />
                <Tooltip
                  contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 8 }}
                  labelStyle={{ color: '#00d4ff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="总功率" stroke="#00d4ff" fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="光伏" stroke="#ffb800" fill="url(#colorSolar)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="风电" stroke="#00ff88" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Energy Pie */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ color: '#00d4ff' }}>能源结构</span>}
            style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
            styles={{ header: { borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' } }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={energyPie}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#4a6080' }}
                >
                  {energyPie.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 8 }}
                  formatter={(v) => [`${v} MW`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Alert List */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#00d4ff' }}>系统告警</span>
                <Tag color={activeAlerts.length > 0 ? 'error' : 'success'} style={{ margin: 0 }}>
                  {activeAlerts.length > 0 ? `${activeAlerts.length} 条待处理` : '无告警'}
                </Tag>
              </div>
            }
            style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
            styles={{ header: { borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' }, body: { padding: '0 0 4px' } }}
          >
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: item.active ? `${alertConfig[item.level].color}06` : 'transparent',
                }}>
                  <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{alertConfig[item.level].icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: item.active ? '#e2e8f0' : '#6b7280',
                        fontSize: 12,
                        lineHeight: 1.4,
                        wordBreak: 'break-all',
                      }}>{item.msg}</div>
                      <div style={{ color: '#4a6080', fontSize: 11, marginTop: 2 }}>{item.time}</div>
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

        {/* Device Status + Grid Freq */}
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                title={<span style={{ color: '#00d4ff' }}>电网频率实时监测</span>}
                style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
                styles={{ header: { borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' } }}
                extra={
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ color: '#00d4ff', fontSize: 12 }}>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="t" hide />
                    <YAxis
                      yAxisId="freq"
                      domain={[49.8, 50.2]}
                      stroke="#00d4ff"
                      tick={{ fontSize: 11 }}
                      unit="Hz"
                    />
                    <YAxis
                      yAxisId="volt"
                      orientation="right"
                      domain={[210, 230]}
                      stroke="#00ff88"
                      tick={{ fontSize: 11 }}
                      unit="V"
                    />
                    <Tooltip
                      contentStyle={{ background: '#1a2540', border: '1px solid #00d4ff', borderRadius: 8 }}
                    />
                    <Legend />
                    <Line yAxisId="freq" type="monotone" dataKey="频率" stroke="#00d4ff" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="volt" type="monotone" dataKey="电压" stroke="#00ff88" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>

            <Col span={24}>
              <Card
                title={<span style={{ color: '#00d4ff' }}>设备状态分布</span>}
                style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
                styles={{ header: { borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' } }}
              >
                <Row gutter={[16, 0]}>
                  {deviceStatus.map(s => (
                    <Col span={8} key={s.name}>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ color: s.color, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ color: '#aab4c8', fontSize: 12, marginTop: 4 }}>{s.name}</div>
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
    </div>
  );
}

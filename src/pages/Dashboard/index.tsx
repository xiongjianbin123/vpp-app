import { useEffect, useState } from 'react';
import { Row, Col, Card } from 'antd';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { generate24hData } from '../../mock/data';

const COLORS = ['#00d4ff', '#00ff88', '#ffb800', '#ff6b6b'];

const kpiCards = [
  { title: '总装机容量', value: 243, unit: 'MW', color: '#00d4ff', icon: '⚡' },
  { title: '在线设备', value: 7, unit: '台', color: '#00ff88', icon: '🟢' },
  { title: '当前发电功率', value: 128.5, unit: 'MW', color: '#00d4ff', icon: '📈' },
  { title: '今日发电量', value: 1842.6, unit: 'MWh', color: '#ffb800', icon: '☀️' },
  { title: '碳减排量', value: 921.3, unit: 'tCO₂', color: '#00ff88', icon: '🌱' },
];

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

function generateFreqData() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: i,
    频率: (50 + (Math.random() - 0.5) * 0.2).toFixed(3),
    电压: (220 + (Math.random() - 0.5) * 5).toFixed(1),
  }));
}

export default function Dashboard() {
  const [powerData] = useState(generate24hData());
  const [freqData, setFreqData] = useState(generateFreqData());
  const [currentPower, setCurrentPower] = useState(128.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPower(prev => Math.round((prev + (Math.random() - 0.5) * 3) * 10) / 10);
      setFreqData(generateFreqData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
          ⚡ 实时监控大屏
        </h2>
        <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
          数据每3秒自动刷新 · 最后更新：{new Date().toLocaleTimeString('zh-CN')}
        </p>
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
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{card.icon}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>{card.title}</span>
              </div>
              <div style={{ color: card.color, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                {card.title === '当前发电功率' ? currentPower : card.value}
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 4, opacity: 0.8 }}>{card.unit}</span>
              </div>
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
            headStyle={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' }}
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
            headStyle={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' }}
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
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
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

        {/* Device Status Pie */}
        <Col xs={24} md={8}>
          <Card
            title={<span style={{ color: '#00d4ff' }}>设备状态分布</span>}
            style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
            headStyle={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
              {deviceStatus.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: s.color,
                    boxShadow: `0 0 8px ${s.color}`
                  }} />
                  <span style={{ color: '#aab4c8', flex: 1 }}>{s.name}</span>
                  <span style={{ color: s.color, fontWeight: 700, fontSize: 18 }}>{s.value}</span>
                  <span style={{ color: '#4a6080', fontSize: 12 }}>台</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 16, padding: '12px 16px', background: '#0a0e1a',
              borderRadius: 8, border: '1px solid rgba(255,77,77,0.3)'
            }}>
              <div style={{ color: '#ff4d4d', fontSize: 12, marginBottom: 4 }}>⚠ 告警提示</div>
              <div style={{ color: '#aab4c8', fontSize: 12 }}>充电桩群-CBD 通信中断，请及时处理</div>
            </div>
          </Card>
        </Col>

        {/* Grid Frequency */}
        <Col xs={24} md={16}>
          <Card
            title={<span style={{ color: '#00d4ff' }}>电网频率实时监测</span>}
            style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
            headStyle={{ borderBottom: '1px solid rgba(0,212,255,0.15)', background: 'transparent' }}
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
      </Row>
    </div>
  );
}

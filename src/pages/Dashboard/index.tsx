import { useEffect, useState } from 'react';
import { Row, Col, Card, Alert, List, Tag, Button } from 'antd';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getDashboard } from '../../services/dashboardService';
import {
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, CheckCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import AIAssistant, { SUGGESTED_QUESTIONS } from '../../components/AIAssistant';
import { useTheme } from '../../context/ThemeContext';

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

export default function Dashboard() {
  const { colors: c } = useTheme();
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
      // 合并类型标签并去重求和
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

  const kpiCards: KpiCard[] = [
    { title: '总装机容量', value: totalCapacity, unit: 'MW', color: c.primary, trend: 0 },
    { title: '在线设备', value: onlineCount, unit: '台', color: c.success, trend: -1 },
    { title: '当前出力功率', value: currentPower, unit: 'MW', color: c.primary, trend: 2.3, dynamic: true },
    { title: '今日发电量', value: 7842.6, unit: 'MWh', color: c.warning, trend: 5.7 },
    { title: '碳减排量', value: 3921.3, unit: 'tCO₂', color: c.success, trend: 5.7 },
  ];

  const activeAlerts = alerts.filter(a => a.active);
  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { borderBottom: `1px solid ${c.primaryBorderLight}`, background: 'transparent' };
  const tooltipStyle = { background: c.bgElevated, border: `1px solid ${c.primary}`, borderRadius: 8 };

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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
        <Col xs={24} lg={16}>
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

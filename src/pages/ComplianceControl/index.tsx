import { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Badge, Tag, Progress, Table, Timeline, Statistic, Alert } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, SyncOutlined,
  SafetyCertificateOutlined, ThunderboltOutlined, ApiOutlined,
  ClockCircleOutlined, WarningOutlined, LockOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// ─── API 接入状态 ───────────────────────────────────────────────────────────
interface ApiEndpoint {
  id: string;
  name: string;
  system: string;
  url: string;
  status: 'connected' | 'error' | 'syncing';
  latency: number; // ms
  lastSync: string;
  uptime: number; // %
  todayCalls: number;
  errorRate: number; // %
}

const initialApis: ApiEndpoint[] = [
  {
    id: 'api-1', name: '广东电力交易中心 API', system: '现货市场申报',
    url: 'https://gdex.csg.cn/api/v2', status: 'connected',
    latency: 142, lastSync: '刚刚', uptime: 99.8, todayCalls: 1284, errorRate: 0.2,
  },
  {
    id: 'api-2', name: '负荷管理中心 API', system: 'AGC直控指令',
    url: 'https://lmc.gd.sgcc.com.cn/agc', status: 'connected',
    latency: 38, lastSync: '2秒前', uptime: 99.97, todayCalls: 86400, errorRate: 0.0,
  },
  {
    id: 'api-3', name: '发改委监管上报 API', system: '合规数据上报',
    url: 'https://ndrc.gd.gov.cn/vpp/report', status: 'connected',
    latency: 315, lastSync: '5分钟前', uptime: 98.6, todayCalls: 48, errorRate: 1.4,
  },
  {
    id: 'api-4', name: '电网调度 EMS 接口', system: 'EMS系统穿透',
    url: 'https://ems.gd.sgcc.com.cn/rtu', status: 'syncing',
    latency: 0, lastSync: '正在重连...', uptime: 96.2, todayCalls: 43200, errorRate: 3.8,
  },
];

// ─── AGC 指令日志 ────────────────────────────────────────────────────────────
interface AgcCommand {
  id: string;
  time: string;
  type: '调增' | '调减' | '维持';
  targetMW: number;
  actualMW: number;
  responseMs: number;
  status: 'success' | 'timeout' | 'partial';
}

function generateAgcLogs(count = 20): AgcCommand[] {
  const types: AgcCommand['type'][] = ['调增', '调减', '维持'];
  const statuses: AgcCommand['status'][] = ['success', 'success', 'success', 'success', 'timeout', 'partial'];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const target = Math.round((80 + Math.random() * 70) * 10) / 10;
    const deviation = (Math.random() - 0.5) * 4;
    const actual = Math.round((target + deviation) * 10) / 10;
    const responseMs = Math.round(180 + Math.random() * 160);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const t = new Date(now - i * 15000);
    return {
      id: `AGC-${String(count - i).padStart(4, '0')}`,
      time: t.toLocaleTimeString('zh-CN'),
      type,
      targetMW: target,
      actualMW: actual,
      responseMs,
      status,
    };
  });
}

// ─── 响应时延趋势 ─────────────────────────────────────────────────────────────
function generateLatencyTrend() {
  return Array.from({ length: 60 }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
    latency: Math.round(200 + Math.random() * 120),
    threshold: 500,
  }));
}

// ─── 等保合规清单 ─────────────────────────────────────────────────────────────
interface ComplianceItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  detail: string;
  lastCheck: string;
}

const complianceList: ComplianceItem[] = [
  { id: 'c1', category: '身份认证', item: '多因素认证（MFA）', status: 'pass', detail: '已启用 TOTP + 短信双因素认证', lastCheck: '2026-03-15' },
  { id: 'c2', category: '身份认证', item: 'API 调用身份鉴权', status: 'pass', detail: 'OAuth2.0 + JWT，有效期 1 小时', lastCheck: '2026-03-15' },
  { id: 'c3', category: '传输安全', item: '全链路 TLS 加密', status: 'pass', detail: 'TLS 1.3，禁用 SSLv3/TLSv1.0', lastCheck: '2026-03-15' },
  { id: 'c4', category: '传输安全', item: '数据包完整性校验', status: 'pass', detail: 'HMAC-SHA256 签名验证', lastCheck: '2026-03-14' },
  { id: 'c5', category: '访问控制', item: 'RBAC 权限模型', status: 'pass', detail: '已实现角色级别权限隔离', lastCheck: '2026-03-15' },
  { id: 'c6', category: '访问控制', item: 'IP 白名单管控', status: 'warning', detail: '待更新：新增 3 台服务器 IP 尚未加白', lastCheck: '2026-03-14' },
  { id: 'c7', category: '数据安全', item: '敏感数据脱敏', status: 'pass', detail: '设备序列号、账号信息已脱敏处理', lastCheck: '2026-03-13' },
  { id: 'c8', category: '数据安全', item: '数据备份与恢复', status: 'pass', detail: '每日凌晨 2:00 全量备份，RTO < 4h', lastCheck: '2026-03-16' },
  { id: 'c9', category: '审计日志', item: '操作审计日志完整性', status: 'pass', detail: '全量记录，保留 180 天', lastCheck: '2026-03-16' },
  { id: 'c10', category: '审计日志', item: '安全事件实时告警', status: 'pass', detail: '已接入 SIEM，异常登录 30 秒内推送', lastCheck: '2026-03-15' },
  { id: 'c11', category: '漏洞管理', item: '高危漏洞修复（CVSS≥7.0）', status: 'pass', detail: '上周发现 2 个高危漏洞，已全部修复', lastCheck: '2026-03-12' },
  { id: 'c12', category: '漏洞管理', item: '渗透测试', status: 'warning', detail: '上次测试：2025-12，建议于 Q2 重新测试', lastCheck: '2025-12-20' },
  { id: 'c13', category: '物理安全', item: '机房门禁管控', status: 'pass', detail: '人脸识别 + 刷卡双重认证', lastCheck: '2026-03-10' },
  { id: 'c14', category: '物理安全', item: '视频监控覆盖', status: 'pass', detail: '机房 24h 录像，保存 90 天', lastCheck: '2026-03-10' },
  { id: 'c15', category: '合规报告', item: '月度合规报告提交', status: 'fail', detail: '2月报告尚未提交，截止日期 2026-03-20', lastCheck: '—' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: 12,
};

const sectionTitle = (title: string, icon: React.ReactNode) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ color: '#00d4ff', fontSize: 16 }}>{icon}</span>
    <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{title}</span>
  </div>
);

const statusBadge = (status: ApiEndpoint['status']) => {
  if (status === 'connected') return <Badge status="success" text={<span style={{ color: '#00ff88', fontSize: 12 }}>已连接</span>} />;
  if (status === 'error') return <Badge status="error" text={<span style={{ color: '#ff4d4d', fontSize: 12 }}>连接失败</span>} />;
  return <Badge status="processing" text={<span style={{ color: '#ffb800', fontSize: 12 }}>重连中</span>} />;
};

export default function ComplianceControl() {
  const [apis, setApis] = useState<ApiEndpoint[]>(initialApis);
  const [agcLogs, setAgcLogs] = useState<AgcCommand[]>(generateAgcLogs());
  const [latencyTrend] = useState(generateLatencyTrend());
  const [liveLatency, setLiveLatency] = useState(238);
  const [cmdCount, setCmdCount] = useState(86400);
  const logRef = useRef<HTMLDivElement>(null);

  // Simulate live AGC commands arriving
  useEffect(() => {
    const timer = setInterval(() => {
      const types: AgcCommand['type'][] = ['调增', '调减', '维持'];
      const statuses: AgcCommand['status'][] = ['success', 'success', 'success', 'timeout'];
      const newCmd: AgcCommand = {
        id: `AGC-${String(cmdCount + 1).padStart(4, '0')}`,
        time: new Date().toLocaleTimeString('zh-CN'),
        type: types[Math.floor(Math.random() * types.length)],
        targetMW: Math.round((80 + Math.random() * 70) * 10) / 10,
        actualMW: 0,
        responseMs: Math.round(180 + Math.random() * 160),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
      newCmd.actualMW = Math.round((newCmd.targetMW + (Math.random() - 0.5) * 3) * 10) / 10;
      setAgcLogs(prev => [newCmd, ...prev.slice(0, 49)]);
      setCmdCount(c => c + 1);
      setLiveLatency(Math.round(180 + Math.random() * 160));
      // Occasionally flip EMS to syncing
      setApis(prev => prev.map(a =>
        a.id === 'api-4' ? { ...a, latency: Math.round(20 + Math.random() * 60) } : a
      ));
    }, 3000);
    return () => clearInterval(timer);
  }, [cmdCount]);

  // Compliance summary
  const passCount = complianceList.filter(c => c.status === 'pass').length;
  const warnCount = complianceList.filter(c => c.status === 'warning').length;
  const failCount = complianceList.filter(c => c.status === 'fail').length;
  const complianceScore = Math.round((passCount / complianceList.length) * 100);

  const agcColumns = [
    { title: '指令ID', dataIndex: 'id', width: 100, render: (v: string) => <span style={{ color: '#00d4ff', fontSize: 12, fontFamily: 'monospace' }}>{v}</span> },
    { title: '时间', dataIndex: 'time', width: 90, render: (v: string) => <span style={{ color: '#aab4c8', fontSize: 12 }}>{v}</span> },
    {
      title: '指令类型', dataIndex: 'type', width: 80,
      render: (v: AgcCommand['type']) => {
        const colors = { '调增': '#00ff88', '调减': '#ff6b6b', '维持': '#aab4c8' };
        return <Tag style={{ background: 'transparent', border: `1px solid ${colors[v]}`, color: colors[v], fontSize: 11 }}>{v}</Tag>;
      },
    },
    { title: '目标(MW)', dataIndex: 'targetMW', width: 90, render: (v: number) => <span style={{ color: '#e2e8f0', fontSize: 12 }}>{v}</span> },
    {
      title: '实际(MW)', dataIndex: 'actualMW', width: 90,
      render: (v: number, r: AgcCommand) => {
        const diff = Math.abs(v - r.targetMW);
        const color = diff < 2 ? '#00ff88' : diff < 5 ? '#ffb800' : '#ff4d4d';
        return <span style={{ color, fontSize: 12 }}>{v}</span>;
      },
    },
    {
      title: '响应时延', dataIndex: 'responseMs', width: 90,
      render: (v: number) => {
        const color = v < 300 ? '#00ff88' : v < 450 ? '#ffb800' : '#ff4d4d';
        return <span style={{ color, fontSize: 12, fontFamily: 'monospace' }}>{v}ms</span>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: AgcCommand['status']) => {
        if (v === 'success') return <Tag color="success" style={{ fontSize: 11 }}>成功</Tag>;
        if (v === 'timeout') return <Tag color="error" style={{ fontSize: 11 }}>超时</Tag>;
        return <Tag color="warning" style={{ fontSize: 11 }}>部分响应</Tag>;
      },
    },
  ];

  const complianceColumns = [
    { title: '类别', dataIndex: 'category', width: 90, render: (v: string) => <span style={{ color: '#aab4c8', fontSize: 12 }}>{v}</span> },
    { title: '检查项', dataIndex: 'item', render: (v: string) => <span style={{ color: '#e2e8f0', fontSize: 13 }}>{v}</span> },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: ComplianceItem['status']) => {
        if (v === 'pass') return <CheckCircleOutlined style={{ color: '#00ff88', fontSize: 16 }} />;
        if (v === 'fail') return <CloseCircleOutlined style={{ color: '#ff4d4d', fontSize: 16 }} />;
        return <WarningOutlined style={{ color: '#ffb800', fontSize: 16 }} />;
      },
    },
    { title: '说明', dataIndex: 'detail', render: (v: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span> },
    { title: '最近检查', dataIndex: 'lastCheck', width: 100, render: (v: string) => <span style={{ color: '#4a6080', fontSize: 11 }}>{v}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header KPIs ─────────────────────────────────────────────────── */}
      <Row gutter={16}>
        {[
          { label: 'API 接入状态', value: `${apis.filter(a => a.status === 'connected').length}/${apis.length}`, unit: '在线', color: '#00ff88', icon: <ApiOutlined /> },
          { label: 'AGC 响应时延', value: liveLatency, unit: 'ms', color: liveLatency < 300 ? '#00ff88' : '#ffb800', icon: <ThunderboltOutlined /> },
          { label: '今日指令总量', value: cmdCount.toLocaleString(), unit: '条', color: '#00d4ff', icon: <ClockCircleOutlined /> },
          { label: '等保合规得分', value: `${complianceScore}`, unit: '分', color: complianceScore >= 90 ? '#00ff88' : '#ffb800', icon: <SafetyCertificateOutlined /> },
        ].map((kpi, i) => (
          <Col span={6} key={i}>
            <Card style={{ ...cardStyle, borderColor: `${kpi.color}22` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#4a6080', fontSize: 12, marginBottom: 8 }}>{kpi.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ color: kpi.color, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>{kpi.value}</span>
                    <span style={{ color: '#4a6080', fontSize: 12 }}>{kpi.unit}</span>
                  </div>
                </div>
                <div style={{ color: kpi.color, fontSize: 24, opacity: 0.6 }}>{kpi.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── API 接入状态 ─────────────────────────────────────────────────── */}
      <Card style={cardStyle} title={sectionTitle('API 接入状态', <ApiOutlined />)}>
        <Row gutter={16}>
          {apis.map(api => (
            <Col span={6} key={api.id}>
              <div style={{
                background: '#0d1526', borderRadius: 10, padding: 16,
                border: `1px solid ${api.status === 'error' ? 'rgba(255,77,77,0.3)' : api.status === 'syncing' ? 'rgba(255,184,0,0.3)' : 'rgba(0,255,136,0.15)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  {statusBadge(api.status)}
                  {api.status === 'syncing' && <SyncOutlined spin style={{ color: '#ffb800' }} />}
                </div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{api.name}</div>
                <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 10 }}>{api.system}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4a6080', fontSize: 11 }}>响应延迟</span>
                    <span style={{ color: api.status === 'syncing' ? '#ffb800' : '#00ff88', fontSize: 11, fontFamily: 'monospace' }}>
                      {api.status === 'syncing' ? '—' : `${api.latency}ms`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4a6080', fontSize: 11 }}>今日调用</span>
                    <span style={{ color: '#aab4c8', fontSize: 11 }}>{api.todayCalls.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4a6080', fontSize: 11 }}>可用率</span>
                    <span style={{ color: api.uptime >= 99 ? '#00ff88' : api.uptime >= 97 ? '#ffb800' : '#ff4d4d', fontSize: 11 }}>{api.uptime}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4a6080', fontSize: 11 }}>最后同步</span>
                    <span style={{ color: '#4a6080', fontSize: 11 }}>{api.lastSync}</span>
                  </div>
                </div>
                <Progress
                  percent={api.uptime}
                  showInfo={false}
                  strokeColor={api.uptime >= 99 ? '#00ff88' : '#ffb800'}
                  trailColor="rgba(255,255,255,0.05)"
                  size="small"
                  style={{ marginTop: 10 }}
                />
              </div>
            </Col>
          ))}
        </Row>

        {/* API 调用时序缩略图 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ color: '#4a6080', fontSize: 12, marginBottom: 8 }}>AGC 接口响应时延（最近 30 分钟）</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={latencyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fill: '#4a6080', fontSize: 10 }} interval={9} />
              <YAxis tick={{ fill: '#4a6080', fontSize: 10 }} domain={[0, 600]} />
              <Tooltip
                contentStyle={{ background: '#1a2540', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6 }}
                labelStyle={{ color: '#aab4c8', fontSize: 11 }}
                itemStyle={{ color: '#00d4ff', fontSize: 11 }}
                formatter={(v) => [`${v}ms`, '时延']}
              />
              <ReferenceLine y={500} stroke="#ff4d4d" strokeDasharray="4 4" label={{ value: '阈值500ms', fill: '#ff4d4d', fontSize: 10 }} />
              <Line type="monotone" dataKey="latency" stroke="#00d4ff" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── AGC 直控监控 ─────────────────────────────────────────────────── */}
      <Card style={cardStyle} title={sectionTitle('AGC 直控监控', <ThunderboltOutlined />)}>
        <Row gutter={16}>
          <Col span={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ color: '#4a6080', fontSize: 12 }}>实时指令流（每15秒一条，自动刷新）</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge status="success" text={<span style={{ color: '#00ff88', fontSize: 12 }}>EMS穿透 已激活</span>} />
                <span style={{ color: 'rgba(0,212,255,0.3)' }}>|</span>
                <Badge status="processing" color="#00d4ff" text={<span style={{ color: '#00d4ff', fontSize: 12 }}>实时接收中</span>} />
              </div>
            </div>
            <div ref={logRef} style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Table
                dataSource={agcLogs}
                columns={agcColumns}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ fontSize: 12 }}
                rowClassName={(r) => r.status !== 'success' ? 'agc-warn-row' : ''}
                scroll={{ y: 280 }}
              />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 响应质量统计 */}
              <div style={{ background: '#0d1526', borderRadius: 10, padding: 16, border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ color: '#aab4c8', fontSize: 12, marginBottom: 12 }}>今日响应质量</div>
                {[
                  { label: '成功率', value: 96.2, color: '#00ff88' },
                  { label: '超时率', value: 2.4, color: '#ffb800' },
                  { label: '部分响应率', value: 1.4, color: '#ff6b6b' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: 12, fontWeight: 600 }}>{item.value}%</span>
                    </div>
                    <Progress percent={item.value} showInfo={false} strokeColor={item.color} trailColor="rgba(255,255,255,0.05)" size="small" />
                  </div>
                ))}
              </div>

              {/* EMS 穿透状态 */}
              <div style={{ background: '#0d1526', borderRadius: 10, padding: 16, border: '1px solid rgba(0,212,255,0.1)' }}>
                <div style={{ color: '#aab4c8', fontSize: 12, marginBottom: 12 }}>EMS 穿透通道</div>
                <Timeline
                  items={[
                    { color: '#00ff88', children: <span style={{ color: '#e2e8f0', fontSize: 12 }}>调度中心 → VPP平台 <Tag color="success" style={{ fontSize: 10, marginLeft: 4 }}>激活</Tag></span> },
                    { color: '#00ff88', children: <span style={{ color: '#e2e8f0', fontSize: 12 }}>VPP平台 → EMS系统 <Tag color="success" style={{ fontSize: 10, marginLeft: 4 }}>穿透</Tag></span> },
                    { color: '#00ff88', children: <span style={{ color: '#e2e8f0', fontSize: 12 }}>EMS → 储能PCS <Tag color="success" style={{ fontSize: 10, marginLeft: 4 }}>下发</Tag></span> },
                    { color: '#ffb800', children: <span style={{ color: '#aab4c8', fontSize: 12 }}>PCS → 电池组 <Tag color="warning" style={{ fontSize: 10, marginLeft: 4 }}>部分</Tag></span> },
                  ]}
                />
              </div>

              {/* 响应时延 Gauge */}
              <div style={{ background: '#0d1526', borderRadius: 10, padding: 16, border: '1px solid rgba(0,212,255,0.1)', textAlign: 'center' }}>
                <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 8 }}>当前响应时延</div>
                <Statistic
                  value={liveLatency}
                  suffix="ms"
                  valueStyle={{ color: liveLatency < 300 ? '#00ff88' : '#ffb800', fontSize: 36, fontFamily: 'monospace' }}
                />
                <div style={{ color: '#4a6080', fontSize: 11, marginTop: 4 }}>阈值要求：≤500ms</div>
                <Progress
                  percent={Math.min(100, Math.round(liveLatency / 5))}
                  showInfo={false}
                  strokeColor={liveLatency < 300 ? '#00ff88' : liveLatency < 450 ? '#ffb800' : '#ff4d4d'}
                  trailColor="rgba(255,255,255,0.05)"
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── 等保合规检查清单 ──────────────────────────────────────────────── */}
      <Card style={cardStyle} title={sectionTitle('等保合规检查清单', <SafetyCertificateOutlined />)}>
        {failCount > 0 && (
          <Alert
            type="error"
            showIcon
            message={`发现 ${failCount} 项不合规项目，请尽快处理`}
            style={{ marginBottom: 12, background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)' }}
          />
        )}
        {warnCount > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`${warnCount} 项存在警告，建议关注`}
            style={{ marginBottom: 12, background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.3)' }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          {[
            { label: '通过', count: passCount, color: '#00ff88', bg: 'rgba(0,255,136,0.08)' },
            { label: '警告', count: warnCount, color: '#ffb800', bg: 'rgba(255,184,0,0.08)' },
            { label: '不通过', count: failCount, color: '#ff4d4d', bg: 'rgba(255,77,77,0.08)' },
            { label: '合规得分', count: `${complianceScore}分`, color: complianceScore >= 90 ? '#00ff88' : '#ffb800', bg: 'rgba(0,212,255,0.06)' },
          ].map((s, i) => (
            <Col span={6} key={i}>
              <div style={{ background: s.bg, borderRadius: 8, padding: '12px 16px', border: `1px solid ${s.color}22`, textAlign: 'center' }}>
                <div style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.count}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>

        <Table
          dataSource={complianceList}
          columns={complianceColumns}
          rowKey="id"
          pagination={false}
          size="small"
          rowClassName={(r) => r.status === 'fail' ? 'compliance-fail-row' : r.status === 'warning' ? 'compliance-warn-row' : ''}
        />

        <div style={{ marginTop: 16, padding: '10px 16px', background: 'rgba(0,212,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <LockOutlined style={{ color: '#00d4ff' }} />
          <span style={{ color: '#4a6080', fontSize: 12 }}>
            等级保护三级认证状态：<span style={{ color: '#00ff88' }}>有效</span>（有效期至 2027-06-30）&nbsp;·&nbsp;
            下次全面检查：2026-06-15
          </span>
        </div>
      </Card>
    </div>
  );
}

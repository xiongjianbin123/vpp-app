import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Button, Progress, Modal, Form, Input, Select,
  DatePicker, InputNumber, Badge, Drawer, Descriptions, Timeline, message, Steps, Statistic } from 'antd';
import { PlusOutlined, ThunderboltOutlined, StopOutlined, InfoCircleOutlined,
  SendOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import * as taskService from '../../services/taskService';
import type { DemandResponseTask } from '../../mock/data';
import type { ColumnType } from 'antd/es/table';
import { useTheme } from '../../context/ThemeContext';

const { Option } = Select;

const statusConfig: Record<string, { color: string; badge: string }> = {
  '待响应': { color: '#ffb800', badge: 'default' },
  '执行中': { color: '#00d4ff', badge: 'processing' },
  '已完成': { color: '#00ff88', badge: 'success' },
  '已取消': { color: '#ff4d4d', badge: 'error' },
};

const typeColors: Record<string, string> = {
  '调峰': '#00d4ff',
  '调频': '#00ff88',
  '备用': '#ffb800',
};

const poolResources = [
  { type: '光伏', capacity: 75, color: '#ffb800', assigned: 42 },
  { type: '储能', capacity: 35, color: '#00d4ff', assigned: 28 },
  { type: '风电', capacity: 50, color: '#00ff88', assigned: 35 },
  { type: '柔性负荷', capacity: 83, color: '#a78bfa', assigned: 60 },
];

// 模拟调度指令下达流程
interface DispatchCommand {
  id: string;
  type: '调峰' | '调频' | '备用';
  targetPower: number;
  startTime: string;
  endTime: string;
  status: 'composing' | 'decomposing' | 'dispatched' | 'executing' | 'completed';
  resources: { name: string; power: number; status: '已接收' | '执行中' | '已完成' | '未响应'; delay: number }[];
}

const mockCommands: DispatchCommand[] = [
  {
    id: 'CMD-001',
    type: '调峰',
    targetPower: 80,
    startTime: '14:00',
    endTime: '16:00',
    status: 'executing',
    resources: [
      { name: '富山站储能', power: 25, status: '执行中', delay: 8 },
      { name: '聚龙站储能', power: 20, status: '执行中', delay: 12 },
      { name: '科城站储能', power: 15, status: '已接收', delay: 5 },
      { name: '工业负荷-钢厂', power: 10, status: '执行中', delay: 18 },
      { name: '光伏电站-北区', power: 10, status: '已完成', delay: 3 },
    ],
  },
  {
    id: 'CMD-002',
    type: '调频',
    targetPower: 30,
    startTime: '18:00',
    endTime: '20:00',
    status: 'dispatched',
    resources: [
      { name: '厚德站储能', power: 12, status: '已接收', delay: 6 },
      { name: '化龙站储能', power: 10, status: '已接收', delay: 9 },
      { name: '弘国五金储能', power: 2.6, status: '未响应', delay: 0 },
    ],
  },
];

// 完成率数据
const completionData = {
  target: 80,
  actual: 73.4,
  rate: 91.7,
};

const resourceStatusColors: Record<string, string> = {
  '已接收': '#ffb800',
  '执行中': '#00d4ff',
  '已完成': '#00ff88',
  '未响应': '#ff4d4d',
};

export default function DemandResponse() {
  const { colors: c } = useTheme();
  const [tasks, setTasks] = useState<DemandResponseTask[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<DemandResponseTask | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchStep, setDispatchStep] = useState(0);
  const [selectedCommand, setSelectedCommand] = useState<DispatchCommand | null>(null);
  const [form] = Form.useForm();
  const [dispatchForm] = Form.useForm();

  useEffect(() => {
    taskService.getTasks().then(setTasks).catch(() => {});
  }, []);

  const executing = tasks.filter(t => t.status === '执行中');
  const pending = tasks.filter(t => t.status === '待响应');
  const completed = tasks.filter(t => t.status === '已完成');

  const handleCancelTask = (task: DemandResponseTask) => {
    Modal.confirm({
      title: '确认取消任务？',
      content: `任务：${task.name}，取消后将无法恢复`,
      okText: '取消任务',
      cancelText: '返回',
      okButtonProps: { style: { background: c.danger, border: 'none', color: '#fff' } },
      onOk: () => {
        taskService.updateTask(task.id, { ...task, status: '已取消' })
          .then(updated => setTasks(prev => prev.map(t => t.id === updated.id ? updated : t)));
        message.success(`任务 ${task.name} 已取消`);
        if (detailTask?.id === task.id) setDetailTask(null);
      },
    });
  };

  const handleDispatchSubmit = () => {
    if (dispatchStep < 3) {
      setDispatchStep(prev => prev + 1);
      if (dispatchStep === 1) {
        message.loading('正在自动分解调度指令...', 1.5);
        setTimeout(() => {
          message.success('指令分解完成，已匹配 5 个资源');
          setDispatchStep(2);
        }, 1500);
        return;
      }
      if (dispatchStep === 2) {
        message.loading('正在下达调度指令...', 1);
        setTimeout(() => {
          message.success('调度指令已成功下达！');
          setDispatchStep(3);
        }, 1000);
        return;
      }
    } else {
      setDispatchModalOpen(false);
      setDispatchStep(0);
      dispatchForm.resetFields();
    }
  };

  const columns: ColumnType<DemandResponseTask>[] = [
    {
      title: '任务ID', dataIndex: 'id', width: 80,
      render: (v: string) => <span style={{ color: c.primary, fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '任务名称', dataIndex: 'name',
      render: (v: string) => <span style={{ color: c.textPrimary }}>{v}</span>,
    },
    {
      title: '类型', dataIndex: 'type',
      render: (v: string) => (
        <Tag style={{ color: typeColors[v], borderColor: typeColors[v], background: `${typeColors[v]}15` }}>{v}</Tag>
      ),
    },
    {
      title: '状态', dataIndex: 'status',
      render: (v: string) => (
        <Badge status={statusConfig[v].badge as any} text={<span style={{ color: statusConfig[v].color }}>{v}</span>} />
      ),
    },
    {
      title: '目标功率', dataIndex: 'targetPower',
      render: (v: number) => <span style={{ color: c.textSecondary }}>{v} MW</span>,
    },
    {
      title: '执行进度', dataIndex: 'progress',
      render: (v: number, record: DemandResponseTask) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={v} size="small"
            strokeColor={v === 100 ? c.success : c.primary}
            trailColor={c.bgElevated}
            format={p => <span style={{ color: c.textSecondary, fontSize: 11 }}>{p}%</span>}
          />
          {record.status === '执行中' && (
            <div style={{ color: c.primary, fontSize: 11, marginTop: 2 }}>
              {record.currentPower} / {record.targetPower} MW
            </div>
          )}
        </div>
      ),
    },
    {
      title: '时间', dataIndex: 'startTime',
      render: (v: string, r: DemandResponseTask) => <span style={{ color: c.textMuted, fontSize: 11 }}>{v} ~ {r.endTime}</span>,
    },
    {
      title: '收益', dataIndex: 'reward',
      render: (v: number) => <span style={{ color: c.success, fontWeight: 600 }}>¥{(v / 10000).toFixed(1)}万</span>,
    },
    {
      title: '操作', width: 100,
      render: (_: unknown, record: DemandResponseTask) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<InfoCircleOutlined />}
            style={{ color: c.primary, padding: '0 4px' }}
            onClick={() => setDetailTask(record)} />
          {(record.status === '待响应' || record.status === '执行中') && (
            <Button type="link" size="small" icon={<StopOutlined />}
              style={{ color: c.danger, padding: '0 4px' }}
              onClick={() => handleCancelTask(record)} />
          )}
        </div>
      ),
    },
  ];

  const handleCreateTask = (values: Record<string, unknown>) => {
    const payload = {
      name: values.name as string,
      type: values.type as DemandResponseTask['type'],
      targetPower: values.targetPower as number,
      currentPower: 0,
      startTime: (values.startTime as { format: (f: string) => string }).format('YYYY-MM-DD HH:mm'),
      endTime: (values.endTime as { format: (f: string) => string }).format('YYYY-MM-DD HH:mm'),
      reward: Math.round((values.targetPower as number) * 2000),
    };
    taskService.createTask(payload).then(created => {
      setTasks(prev => [created, ...prev]);
      setModalOpen(false);
      form.resetFields();
      message.success('任务已创建，等待调度确认');
    }).catch(() => message.error('创建失败'));
  };

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };

  // 完成率圆环数据
  const completionPieData = [
    { name: '已完成', value: completionData.rate },
    { name: '未完成', value: 100 - completionData.rate },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>调度中心</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            执行中 {executing.length} · 待响应 {pending.length} · 今日完成 {completed.length} · 全闭环可观可测可控
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<SendOutlined />}
            onClick={() => setDispatchModalOpen(true)}
            style={{ background: `${c.primary}1a`, border: `1px solid ${c.primary}`, color: c.primary, fontWeight: 600 }}
          >
            下达调度指令
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{ background: c.primary, border: 'none', color: c.bgPage, fontWeight: 600 }}
          >
            发起调度任务
          </Button>
        </div>
      </div>

      {/* Summary KPI + 完成率圆环 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: '执行中任务', value: executing.length, color: c.primary, icon: '▶' },
          { label: '待响应任务', value: pending.length, color: c.warning, icon: '⏳' },
          { label: '今日完成', value: completed.length, color: c.success, icon: '✓' },
          {
            label: '累计收益',
            value: '¥' + (tasks.filter(t => t.status !== '已取消').reduce((a, b) => a + b.reward, 0) / 10000).toFixed(1) + '万',
            color: c.success, icon: '💰',
          },
        ].map(item => (
          <Col key={item.label} xs={12} md={5}>
            <Card style={{ ...cardStyle, border: `1px solid ${item.color}25` }} styles={{ body: { padding: '16px' } }}>
              <div style={{ color: item.color, fontSize: 26, fontWeight: 700 }}>{item.icon} {item.value}</div>
              <div style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{item.label}</div>
            </Card>
          </Col>
        ))}
        {/* 完成率圆环 */}
        <Col xs={24} md={4}>
          <Card style={cardStyle} styles={{ body: { padding: '8px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' } }}>
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionPieData}
                    cx="50%" cy="50%"
                    innerRadius={28} outerRadius={40}
                    startAngle={90} endAngle={-270}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    <Cell fill={c.success} />
                    <Cell fill={c.bgElevated} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}>
                <div style={{ color: c.success, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{completionData.rate}%</div>
              </div>
            </div>
            <div style={{ color: c.textMuted, fontSize: 11, marginTop: 4 }}>响应完成率</div>
            <div style={{ color: c.textDim, fontSize: 10 }}>{completionData.actual}/{completionData.target} MW</div>
          </Card>
        </Col>
      </Row>

      {/* 调度指令追踪 + 资源池 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* 调度指令实时追踪 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>调度指令实时追踪</span>
                <Tag color="processing">{mockCommands.length} 条指令执行中</Tag>
              </div>
            }
            style={cardStyle} styles={{ header: headerStyle }}
          >
            {mockCommands.map(cmd => (
              <div key={cmd.id} style={{
                padding: '12px 16px', marginBottom: 12,
                background: c.bgElevated, borderRadius: 8,
                border: `1px solid ${c.primaryBorderLight}`,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedCommand(cmd)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag style={{ color: typeColors[cmd.type], borderColor: typeColors[cmd.type], background: `${typeColors[cmd.type]}15` }}>{cmd.type}</Tag>
                    <span style={{ color: c.textPrimary, fontWeight: 600, fontSize: 13 }}>{cmd.id}</span>
                    <span style={{ color: c.textDim, fontSize: 11 }}>{cmd.startTime} ~ {cmd.endTime}</span>
                  </div>
                  <span style={{ color: c.primary, fontSize: 13, fontWeight: 600 }}>{cmd.targetPower} MW</span>
                </div>
                {/* 资源响应进度条 */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cmd.resources.map((r, i) => (
                    <div key={i} style={{
                      flex: '1 1 auto', minWidth: 120, padding: '6px 10px',
                      background: `${resourceStatusColors[r.status]}08`,
                      border: `1px solid ${resourceStatusColors[r.status]}30`,
                      borderRadius: 6,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ color: c.textSecondary, fontSize: 11 }}>{r.name}</span>
                        <span style={{ color: resourceStatusColors[r.status], fontSize: 10 }}>{r.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>{r.power}MW</span>
                        <span style={{ color: c.textDim, fontSize: 10 }}>延迟{r.delay}s</span>
                      </div>
                      <Progress
                        percent={r.status === '已完成' ? 100 : r.status === '执行中' ? 65 : r.status === '已接收' ? 30 : 0}
                        size="small" showInfo={false}
                        strokeColor={resourceStatusColors[r.status]}
                        trailColor={c.bgCard}
                        style={{ marginTop: 2 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Resource Pool */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: c.primary }}>聚合资源池</span>
                <span style={{ color: c.textDim, fontSize: 11, fontWeight: 400 }}>
                  总 <span style={{ color: c.primary, fontWeight: 700 }}>{poolResources.reduce((a, b) => a + b.capacity, 0)} MW</span>
                </span>
              </div>
            }
            style={cardStyle} styles={{ header: headerStyle }}
          >
            {poolResources.map(r => (
              <div key={r.type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: c.textSecondary, fontSize: 12 }}>{r.type}</span>
                  <div>
                    <span style={{ color: r.color, fontWeight: 600, fontSize: 12 }}>{r.assigned}</span>
                    <span style={{ color: c.textDim, fontSize: 11 }}> / {r.capacity} MW</span>
                  </div>
                </div>
                <Progress
                  percent={Math.round((r.assigned / r.capacity) * 100)}
                  strokeColor={r.color}
                  trailColor={c.bgElevated}
                  size="small"
                  format={p => <span style={{ color: c.textDim, fontSize: 10 }}>{p}%已调</span>}
                />
              </div>
            ))}

            {/* 资源状态汇总 */}
            <div style={{ marginTop: 16, padding: '10px 0', borderTop: `1px solid ${c.primaryBorderLight}` }}>
              <div style={{ color: c.textMuted, fontSize: 11, marginBottom: 8 }}>资源响应状态汇总</div>
              <Row gutter={8}>
                {[
                  { label: '已接收', count: 3, color: '#ffb800' },
                  { label: '执行中', count: 4, color: '#00d4ff' },
                  { label: '已完成', count: 1, color: '#00ff88' },
                  { label: '未响应', count: 1, color: '#ff4d4d' },
                ].map(s => (
                  <Col span={6} key={s.label}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.count}</div>
                      <div style={{ color: c.textDim, fontSize: 10 }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Task Table */}
      <Card
        title={<span style={{ color: c.primary }}>响应任务列表</span>}
        style={cardStyle} styles={{ header: headerStyle }}
      >
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onDoubleClick: () => setDetailTask(record),
          })}
        />
      </Card>

      {/* 调度指令下达 Modal */}
      <Modal
        title={<span style={{ color: c.primary }}><SendOutlined /> 下达调度指令</span>}
        open={dispatchModalOpen}
        onCancel={() => { setDispatchModalOpen(false); setDispatchStep(0); dispatchForm.resetFields(); }}
        onOk={handleDispatchSubmit}
        okText={dispatchStep === 3 ? '完成' : dispatchStep === 2 ? '确认下达' : '下一步'}
        width={600}
        okButtonProps={{ style: { background: dispatchStep === 2 ? c.success : c.primary, border: 'none', color: '#fff' } }}
      >
        <Steps
          current={dispatchStep}
          size="small"
          style={{ marginBottom: 20, marginTop: 12 }}
          items={[
            { title: '选择品种', icon: <ThunderboltOutlined /> },
            { title: '设定参数', icon: <ClockCircleOutlined /> },
            { title: '确认下达', icon: <SendOutlined /> },
            { title: '完成', icon: <CheckCircleOutlined /> },
          ]}
        />

        {dispatchStep === 0 && (
          <Form form={dispatchForm} layout="vertical">
            <Form.Item name="type" label={<span style={{ color: c.textSecondary }}>调度品种</span>} rules={[{ required: true }]}>
              <Select placeholder="选择调度品种" size="large">
                <Option value="调峰">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4ff' }} />
                    调峰 — 削峰填谷，电价补贴 0.8-1.2元/kWh
                  </div>
                </Option>
                <Option value="调频">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88' }} />
                    调频 — AGC频率调节，里程补贴 12-15元/MW
                  </div>
                </Option>
                <Option value="备用">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffb800' }} />
                    备用 — 旋转备用容量，容量补贴 400元/MW·日
                  </div>
                </Option>
              </Select>
            </Form.Item>
          </Form>
        )}

        {dispatchStep === 1 && (
          <Form form={dispatchForm} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="power" label={<span style={{ color: c.textSecondary }}>调度量 (MW)</span>} initialValue={80}>
                  <InputNumber min={1} max={350} style={{ width: '100%' }} size="large" addonAfter="MW" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="duration" label={<span style={{ color: c.textSecondary }}>持续时长</span>} initialValue={2}>
                  <InputNumber min={0.5} max={12} step={0.5} style={{ width: '100%' }} size="large" addonAfter="小时" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="startTime" label={<span style={{ color: c.textSecondary }}>开始时间</span>}>
                  <DatePicker showTime style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="endTime" label={<span style={{ color: c.textSecondary }}>结束时间</span>}>
                  <DatePicker showTime style={{ width: '100%' }} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {dispatchStep === 2 && (
          <div>
            <div style={{ background: c.bgElevated, borderRadius: 8, padding: 16, marginBottom: 16, border: `1px solid ${c.primaryBorderLight}` }}>
              <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>系统自动分解方案</div>
              <Row gutter={16}>
                <Col span={8}><Statistic title={<span style={{ color: c.textDim, fontSize: 11 }}>目标功率</span>} value={80} suffix="MW" valueStyle={{ color: c.primary, fontSize: 20 }} /></Col>
                <Col span={8}><Statistic title={<span style={{ color: c.textDim, fontSize: 11 }}>匹配资源</span>} value={5} suffix="个" valueStyle={{ color: c.success, fontSize: 20 }} /></Col>
                <Col span={8}><Statistic title={<span style={{ color: c.textDim, fontSize: 11 }}>预估收益</span>} value={12.8} suffix="万元" valueStyle={{ color: '#ffb800', fontSize: 20 }} /></Col>
              </Row>
            </div>
            <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>资源分配明细：</div>
            {mockCommands[0].resources.map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                background: i % 2 === 0 ? c.bgElevated : 'transparent', borderRadius: 4,
              }}>
                <span style={{ color: c.textSecondary, fontSize: 12 }}>{r.name}</span>
                <span style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>{r.power} MW</span>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: 10, background: 'rgba(255,184,0,0.06)',
              border: '1px solid rgba(255,184,0,0.2)', borderRadius: 6,
            }}>
              <ExclamationCircleOutlined style={{ color: c.warning, marginRight: 6 }} />
              <span style={{ color: c.textSecondary, fontSize: 12 }}>确认下达后，调度指令将通过 IEC61850/MODBUS 协议下发至各终端</span>
            </div>
          </div>
        )}

        {dispatchStep === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined style={{ color: c.success, fontSize: 48, marginBottom: 16 }} />
            <div style={{ color: c.success, fontSize: 18, fontWeight: 700 }}>调度指令已下达</div>
            <div style={{ color: c.textDim, fontSize: 12, marginTop: 8 }}>
              指令编号 CMD-003 · 目标 80MW · 5个资源已接收指令
            </div>
            <div style={{ color: c.textDim, fontSize: 11, marginTop: 4 }}>
              端到端响应延迟 &lt; 30秒 · 可在调度追踪面板实时监控
            </div>
          </div>
        )}
      </Modal>

      {/* 调度指令详情 Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: c.primary }}>指令详情</span>
            {selectedCommand && <Tag color="processing">{selectedCommand.id}</Tag>}
          </div>
        }
        open={!!selectedCommand}
        onClose={() => setSelectedCommand(null)}
        width={440}
        styles={{
          body: { background: c.bgSider },
          header: { background: c.bgSider, borderBottom: `1px solid ${c.primaryBorderLight}` },
        }}
      >
        {selectedCommand && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ ...cardStyle }} styles={{ body: { padding: 16 } }}>
              <Descriptions column={1} size="small" styles={{ label: { color: c.textDim }, content: { color: c.textPrimary } }}>
                <Descriptions.Item label="指令编号">{selectedCommand.id}</Descriptions.Item>
                <Descriptions.Item label="调度类型">
                  <Tag style={{ color: typeColors[selectedCommand.type], borderColor: typeColors[selectedCommand.type], background: `${typeColors[selectedCommand.type]}15` }}>
                    {selectedCommand.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="目标功率">{selectedCommand.targetPower} MW</Descriptions.Item>
                <Descriptions.Item label="执行时段">{selectedCommand.startTime} ~ {selectedCommand.endTime}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<span style={{ color: c.primary, fontSize: 13 }}>资源响应追踪</span>}
              style={cardStyle} styles={{ header: { ...headerStyle }, body: { padding: 12 } }}>
              {selectedCommand.resources.map((r, i) => (
                <div key={i} style={{
                  padding: '10px 12px', marginBottom: 8,
                  background: c.bgElevated, borderRadius: 6,
                  border: `1px solid ${resourceStatusColors[r.status]}25`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: c.textPrimary, fontSize: 12, fontWeight: 500 }}>{r.name}</span>
                    <Tag style={{ color: resourceStatusColors[r.status], borderColor: resourceStatusColors[r.status], background: `${resourceStatusColors[r.status]}15`, fontSize: 10 }}>
                      {r.status}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: c.primary, fontSize: 12 }}>{r.power} MW</span>
                    <span style={{ color: c.textDim, fontSize: 10 }}>响应延迟 {r.delay}s</span>
                  </div>
                  <Progress
                    percent={r.status === '已完成' ? 100 : r.status === '执行中' ? 65 : r.status === '已接收' ? 30 : 0}
                    size="small" showInfo={false}
                    strokeColor={resourceStatusColors[r.status]}
                    trailColor={c.bgCard}
                    style={{ marginTop: 4 }}
                  />
                </div>
              ))}
            </Card>

            <Card title={<span style={{ color: c.primary, fontSize: 13 }}>执行时间线</span>}
              style={cardStyle} styles={{ header: { ...headerStyle }, body: { padding: 16 } }}>
              <Timeline items={[
                { color: c.success, children: <span style={{ color: c.textSecondary, fontSize: 12 }}>指令创建 · 13:58:22</span> },
                { color: c.success, children: <span style={{ color: c.textSecondary, fontSize: 12 }}>指令分解完成 · 13:58:24 (2s)</span> },
                { color: c.primary, children: <span style={{ color: c.textSecondary, fontSize: 12 }}>指令下达 · 13:58:25 (3s)</span> },
                { color: c.warning, children: <span style={{ color: c.textSecondary, fontSize: 12 }}>资源接收确认 · 5/5 已确认</span> },
                { color: '#00d4ff', children: <span style={{ color: c.primary, fontSize: 12 }}>执行中... 当前 73.4/80 MW</span> },
              ]} />
            </Card>
          </div>
        )}
      </Drawer>

      {/* Task Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: c.primary }}>任务详情</span>
            {detailTask && (
              <Tag style={{ color: statusConfig[detailTask.status].color, borderColor: statusConfig[detailTask.status].color, background: `${statusConfig[detailTask.status].color}15` }}>
                {detailTask.status}
              </Tag>
            )}
          </div>
        }
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        width={420}
        styles={{
          body: { background: c.bgSider },
          header: { background: c.bgSider, borderBottom: `1px solid ${c.primaryBorderLight}` },
        }}
      >
        {detailTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={cardStyle} styles={{ body: { padding: 16 } }}>
              <Descriptions column={1} size="small" styles={{ label: { color: c.textDim }, content: { color: c.textPrimary } }}>
                <Descriptions.Item label="任务ID">{detailTask.id}</Descriptions.Item>
                <Descriptions.Item label="任务名称">{detailTask.name}</Descriptions.Item>
                <Descriptions.Item label="响应类型">
                  <Tag style={{ color: typeColors[detailTask.type], borderColor: typeColors[detailTask.type], background: `${typeColors[detailTask.type]}15` }}>
                    {detailTask.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="目标功率">{detailTask.targetPower} MW</Descriptions.Item>
                <Descriptions.Item label="当前功率">{detailTask.currentPower} MW</Descriptions.Item>
                <Descriptions.Item label="开始时间">{detailTask.startTime}</Descriptions.Item>
                <Descriptions.Item label="结束时间">{detailTask.endTime}</Descriptions.Item>
                <Descriptions.Item label="预计收益">
                  <span style={{ color: c.success, fontWeight: 600 }}>¥{(detailTask.reward / 10000).toFixed(1)}万</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<span style={{ color: c.primary, fontSize: 13 }}>执行进度</span>}
              style={cardStyle} styles={{ header: { ...headerStyle }, body: { padding: 16 } }}>
              <Progress percent={detailTask.progress} strokeColor={detailTask.progress === 100 ? c.success : c.primary} trailColor={c.bgElevated} />
              <div style={{ color: c.textDim, fontSize: 12, marginTop: 8 }}>{detailTask.currentPower} MW / {detailTask.targetPower} MW</div>
            </Card>

            <Card title={<span style={{ color: c.primary, fontSize: 13 }}>任务时间线</span>}
              style={cardStyle} styles={{ header: { ...headerStyle }, body: { padding: 16 } }}>
              <Timeline items={[
                { color: c.success, children: <span style={{ color: c.textSecondary, fontSize: 12 }}>任务创建 · {detailTask.startTime}</span> },
                { color: detailTask.status !== '待响应' ? c.primary : '#4a5568', children: <span style={{ color: detailTask.status !== '待响应' ? c.textSecondary : '#4a5568', fontSize: 12 }}>调度指令下发</span> },
                { color: detailTask.status === '执行中' ? c.warning : detailTask.status === '已完成' ? c.success : '#4a5568',
                  children: <span style={{ color: detailTask.status === '执行中' || detailTask.status === '已完成' ? c.textSecondary : '#4a5568', fontSize: 12 }}>
                    {detailTask.status === '执行中' ? '执行中...' : detailTask.status === '已完成' ? '执行完成' : '等待执行'}
                  </span>,
                },
                { color: detailTask.status === '已完成' ? c.success : '#4a5568',
                  children: <span style={{ color: detailTask.status === '已完成' ? c.textSecondary : '#4a5568', fontSize: 12 }}>
                    {detailTask.status === '已完成' ? `结算完成 · 收益 ¥${(detailTask.reward / 10000).toFixed(1)}万` : `预计结束 · ${detailTask.endTime}`}
                  </span>,
                },
              ]} />
            </Card>

            {(detailTask.status === '待响应' || detailTask.status === '执行中') && (
              <Button block icon={<StopOutlined />}
                style={{ background: `${c.danger}1a`, border: `1px solid ${c.danger}`, color: c.danger }}
                onClick={() => handleCancelTask(detailTask)}>
                取消任务
              </Button>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Task Modal */}
      <Modal
        title={<span style={{ color: c.primary }}><ThunderboltOutlined /> 发起调度任务</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="提交任务"
        okButtonProps={{ style: { background: c.primary, border: 'none', color: c.bgPage } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={<span style={{ color: c.textSecondary }}>任务名称</span>} rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" style={{ background: c.bgPage, border: `1px solid ${c.primaryBorder}`, color: c.textPrimary }} />
          </Form.Item>
          <Form.Item name="type" label={<span style={{ color: c.textSecondary }}>响应类型</span>} rules={[{ required: true }]}>
            <Select placeholder="选择响应类型">
              <Option value="调峰">调峰 — 削峰填谷</Option>
              <Option value="调频">调频 — 频率调节</Option>
              <Option value="备用">备用 — 旋转备用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="targetPower" label={<span style={{ color: c.textSecondary }}>目标功率 (MW)</span>} rules={[{ required: true }]}>
            <InputNumber min={1} max={350} style={{ width: '100%', background: c.bgPage, border: `1px solid ${c.primaryBorder}`, color: c.textPrimary }} addonAfter={<span style={{ color: c.textDim }}>MW</span>} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label={<span style={{ color: c.textSecondary }}>开始时间</span>} rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label={<span style={{ color: c.textSecondary }}>结束时间</span>} rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

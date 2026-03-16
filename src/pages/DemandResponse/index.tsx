import { useState } from 'react';
import { Row, Col, Card, Table, Tag, Button, Progress, Modal, Form, Input, Select,
  DatePicker, InputNumber, Badge, Drawer, Descriptions, Timeline, message } from 'antd';
import { PlusOutlined, ThunderboltOutlined, StopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { mockTasks } from '../../mock/data';
import type { DemandResponseTask } from '../../mock/data';
import type { ColumnType } from 'antd/es/table';

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
  { type: '光伏', capacity: 75, color: '#ffb800' },
  { type: '储能', capacity: 35, color: '#00d4ff' },
  { type: '风电', capacity: 50, color: '#00ff88' },
  { type: '柔性负荷', capacity: 83, color: '#a78bfa' },
];

export default function DemandResponse() {
  const [tasks, setTasks] = useState<DemandResponseTask[]>(mockTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<DemandResponseTask | null>(null);
  const [form] = Form.useForm();

  const executing = tasks.filter(t => t.status === '执行中');
  const pending = tasks.filter(t => t.status === '待响应');
  const completed = tasks.filter(t => t.status === '已完成');

  const handleCancelTask = (task: DemandResponseTask) => {
    Modal.confirm({
      title: '确认取消任务？',
      content: `任务：${task.name}，取消后将无法恢复`,
      okText: '取消任务',
      cancelText: '返回',
      okButtonProps: { style: { background: '#ff4d4d', border: 'none', color: '#fff' } },
      onOk: () => {
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: '已取消' as const } : t
        ));
        message.success(`任务 ${task.name} 已取消`);
        if (detailTask?.id === task.id) setDetailTask(null);
      },
    });
  };

  const columns: ColumnType<DemandResponseTask>[] = [
    {
      title: '任务ID',
      dataIndex: 'id',
      width: 80,
      render: (v: string) => <span style={{ color: '#00d4ff', fontFamily: 'monospace', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '任务名称',
      dataIndex: 'name',
      render: (v: string) => <span style={{ color: '#e2e8f0' }}>{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => (
        <Tag style={{ color: typeColors[v], borderColor: typeColors[v], background: `${typeColors[v]}15` }}>{v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Badge status={statusConfig[v].badge as any} text={<span style={{ color: statusConfig[v].color }}>{v}</span>} />
      ),
    },
    {
      title: '目标功率',
      dataIndex: 'targetPower',
      render: (v: number) => <span style={{ color: '#aab4c8' }}>{v} MW</span>,
    },
    {
      title: '执行进度',
      dataIndex: 'progress',
      render: (v: number, record: DemandResponseTask) => (
        <div style={{ width: 120 }}>
          <Progress
            percent={v}
            size="small"
            strokeColor={v === 100 ? '#00ff88' : '#00d4ff'}
            trailColor="#1a2540"
            format={p => <span style={{ color: '#aab4c8', fontSize: 11 }}>{p}%</span>}
          />
          {record.status === '执行中' && (
            <div style={{ color: '#00d4ff', fontSize: 11, marginTop: 2 }}>
              {record.currentPower} / {record.targetPower} MW
            </div>
          )}
        </div>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      render: (v: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      render: (v: string) => <span style={{ color: '#6b7280', fontSize: 12 }}>{v}</span>,
    },
    {
      title: '预计收益',
      dataIndex: 'reward',
      render: (v: number) => <span style={{ color: '#00ff88', fontWeight: 600 }}>¥{(v / 10000).toFixed(1)}万</span>,
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: DemandResponseTask) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            style={{ color: '#00d4ff', padding: '0 4px' }}
            onClick={() => setDetailTask(record)}
          />
          {(record.status === '待响应' || record.status === '执行中') && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              style={{ color: '#ff4d4d', padding: '0 4px' }}
              onClick={() => handleCancelTask(record)}
            />
          )}
        </div>
      ),
    },
  ];

  const handleCreateTask = (values: Record<string, unknown>) => {
    const newTask: DemandResponseTask = {
      id: `T${String(tasks.length + 1).padStart(3, '0')}`,
      name: values.name as string,
      type: values.type as DemandResponseTask['type'],
      status: '待响应',
      targetPower: values.targetPower as number,
      currentPower: 0,
      startTime: (values.startTime as { format: (f: string) => string }).format('YYYY-MM-DD HH:mm'),
      endTime: (values.endTime as { format: (f: string) => string }).format('YYYY-MM-DD HH:mm'),
      progress: 0,
      reward: Math.round((values.targetPower as number) * 2000),
    };
    setTasks([newTask, ...tasks]);
    setModalOpen(false);
    form.resetFields();
    message.success('任务已创建，等待调度确认');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>
            需求响应管理
          </h2>
          <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
            执行中 {executing.length} · 待响应 {pending.length} · 今日完成 {completed.length}
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          style={{ background: '#00d4ff', border: 'none', color: '#0a0e1a', fontWeight: 600 }}
        >
          发起调度任务
        </Button>
      </div>

      {/* Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: '执行中任务', value: executing.length, color: '#00d4ff', icon: '▶' },
          { label: '待响应任务', value: pending.length, color: '#ffb800', icon: '⏳' },
          { label: '今日完成', value: completed.length, color: '#00ff88', icon: '✓' },
          {
            label: '累计收益',
            value: '¥' + (tasks.filter(t => t.status !== '已取消').reduce((a, b) => a + b.reward, 0) / 10000).toFixed(1) + '万',
            color: '#00ff88',
            icon: '💰',
          },
        ].map(item => (
          <Col key={item.label} xs={12} md={6}>
            <Card
              style={{ background: '#111827', border: `1px solid ${item.color}25`, borderRadius: 12 }}
              styles={{ body: { padding: '16px' } }}
            >
              <div style={{ color: item.color, fontSize: 26, fontWeight: 700 }}>
                {item.icon} {item.value}
              </div>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{item.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Resource Pool */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#00d4ff' }}>聚合资源池</span>
            <span style={{ color: '#4a6080', fontSize: 12, fontWeight: 400 }}>
              总可调容量：<span style={{ color: '#00d4ff', fontWeight: 700 }}>{poolResources.reduce((a, b) => a + b.capacity, 0)} MW</span>
            </span>
          </div>
        }
        style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, marginBottom: 20 }}
        styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.15)' } }}
      >
        <Row gutter={[24, 16]}>
          {poolResources.map(r => (
            <Col key={r.type} xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#aab4c8', fontSize: 13 }}>{r.type}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.capacity} MW</span>
                </div>
                <Progress
                  percent={Math.round((r.capacity / 243) * 100)}
                  strokeColor={r.color}
                  trailColor="#1a2540"
                  showInfo={false}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Task Table */}
      <Card
        title={<span style={{ color: '#00d4ff' }}>响应任务列表</span>}
        style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12 }}
        styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.15)' } }}
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

      {/* Task Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#00d4ff' }}>任务详情</span>
            {detailTask && (
              <Tag
                style={{
                  color: statusConfig[detailTask.status].color,
                  borderColor: statusConfig[detailTask.status].color,
                  background: `${statusConfig[detailTask.status].color}15`,
                }}
              >
                {detailTask.status}
              </Tag>
            )}
          </div>
        }
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        width={420}
        styles={{
          body: { background: '#0d1526' },
          header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.15)' },
        }}
      >
        {detailTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }} styles={{ body: { padding: 16 } }}>
              <Descriptions column={1} size="small" styles={{ label: { color: '#4a6080' }, content: { color: '#e2e8f0' } }}>
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
                  <span style={{ color: '#00ff88', fontWeight: 600 }}>¥{(detailTask.reward / 10000).toFixed(1)}万</span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title={<span style={{ color: '#00d4ff', fontSize: 13 }}>执行进度</span>}
              style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
              styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.1)' }, body: { padding: 16 } }}
            >
              <Progress
                percent={detailTask.progress}
                strokeColor={detailTask.progress === 100 ? '#00ff88' : '#00d4ff'}
                trailColor="#1a2540"
              />
              <div style={{ color: '#4a6080', fontSize: 12, marginTop: 8 }}>
                {detailTask.currentPower} MW / {detailTask.targetPower} MW
              </div>
            </Card>

            <Card
              title={<span style={{ color: '#00d4ff', fontSize: 13 }}>任务时间线</span>}
              style={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)' }}
              styles={{ header: { background: 'transparent', borderBottom: '1px solid rgba(0,212,255,0.1)' }, body: { padding: 16 } }}
            >
              <Timeline
                items={[
                  { color: '#00ff88', children: <span style={{ color: '#aab4c8', fontSize: 12 }}>任务创建 · {detailTask.startTime}</span> },
                  {
                    color: detailTask.status !== '待响应' ? '#00d4ff' : '#4a5568',
                    children: <span style={{ color: detailTask.status !== '待响应' ? '#aab4c8' : '#4a5568', fontSize: 12 }}>
                      调度指令下发
                    </span>,
                  },
                  {
                    color: detailTask.status === '执行中' ? '#ffb800' : detailTask.status === '已完成' ? '#00ff88' : '#4a5568',
                    children: <span style={{ color: detailTask.status === '执行中' || detailTask.status === '已完成' ? '#aab4c8' : '#4a5568', fontSize: 12 }}>
                      {detailTask.status === '执行中' ? '执行中...' : detailTask.status === '已完成' ? '执行完成' : '等待执行'}
                    </span>,
                  },
                  {
                    color: detailTask.status === '已完成' ? '#00ff88' : '#4a5568',
                    children: <span style={{ color: detailTask.status === '已完成' ? '#aab4c8' : '#4a5568', fontSize: 12 }}>
                      {detailTask.status === '已完成' ? `结算完成 · 收益 ¥${(detailTask.reward / 10000).toFixed(1)}万` : `预计结束 · ${detailTask.endTime}`}
                    </span>,
                  },
                ]}
              />
            </Card>

            {(detailTask.status === '待响应' || detailTask.status === '执行中') && (
              <Button
                block
                icon={<StopOutlined />}
                style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid #ff4d4d', color: '#ff4d4d' }}
                onClick={() => handleCancelTask(detailTask)}
              >
                取消任务
              </Button>
            )}
          </div>
        )}
      </Drawer>

      {/* Create Task Modal */}
      <Modal
        title={<span style={{ color: '#00d4ff' }}><ThunderboltOutlined /> 发起调度任务</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="提交任务"
        okButtonProps={{ style: { background: '#00d4ff', border: 'none', color: '#0a0e1a' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTask} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={<span style={{ color: '#aab4c8' }}>任务名称</span>} rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" style={{ background: '#0a0e1a', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0' }} />
          </Form.Item>
          <Form.Item name="type" label={<span style={{ color: '#aab4c8' }}>响应类型</span>} rules={[{ required: true }]}>
            <Select placeholder="选择响应类型">
              <Option value="调峰">调峰 — 削峰填谷</Option>
              <Option value="调频">调频 — 频率调节</Option>
              <Option value="备用">备用 — 旋转备用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="targetPower" label={<span style={{ color: '#aab4c8' }}>目标功率 (MW)</span>} rules={[{ required: true }]}>
            <InputNumber
              min={1} max={243}
              style={{ width: '100%', background: '#0a0e1a', border: '1px solid rgba(0,212,255,0.2)', color: '#e2e8f0' }}
              addonAfter={<span style={{ color: '#4a6080' }}>MW</span>}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label={<span style={{ color: '#aab4c8' }}>开始时间</span>} rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label={<span style={{ color: '#aab4c8' }}>结束时间</span>} rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

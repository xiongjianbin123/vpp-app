import { useState } from 'react';
import { Row, Col, Card, Table, Button, Statistic, Tag, Input, Select, Modal, Form, message, Avatar, Timeline } from 'antd';
import {
  SearchOutlined, PlusOutlined, CustomerServiceOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import type { ColumnType } from 'antd/es/table';

interface Ticket {
  key: string;
  ticketNo: string;
  title: string;
  customer: string;
  type: string;
  priority: string;
  assignee: string;
  createTime: string;
  updateTime: string;
  status: string;
  description: string;
}

const initialTickets: Ticket[] = [
  { key: '1',  ticketNo: 'CS-2026-0315-001', title: '充电桩通信中断，无法远程调度',     customer: '广州南沙科技园',  type: '设备故障',  priority: '紧急', assignee: '林伟权', createTime: '2026-03-15 09:12', updateTime: '2026-03-15 10:30', status: '处理中', description: '客户反馈园区内3号充电桩群自昨晚起通信中断，VPP平台无法下发调度指令，影响早间调峰任务执行。' },
  { key: '2',  ticketNo: 'CS-2026-0314-003', title: '3月收益结算数据与自算不符',       customer: '美的集团顺德基地', type: '账单问题',  priority: '高',  assignee: '梁梓柔', createTime: '2026-03-14 14:05', updateTime: '2026-03-15 09:00', status: '待处理', description: '客户核对3月上旬调频补贴结算金额，与自行计算数据相差约1.2万元，要求提供计量明细及补贴公式说明。' },
  { key: '3',  ticketNo: 'CS-2026-0313-002', title: '申请新增200kW储能设备接入',      customer: '顺丰速运广东仓储', type: '业务咨询',  priority: '中',  assignee: '杜陈傲', createTime: '2026-03-13 10:00', updateTime: '2026-03-14 16:00', status: '处理中', description: '客户新采购200kW/400kWh液冷储能系统，计划接入VPP平台参与需求响应，询问接入流程、检测标准及预期收益。' },
  { key: '4',  ticketNo: 'CS-2026-0312-001', title: 'AGC调度响应延迟超标告警',        customer: '南方电网调度中心',  type: '性能问题',  priority: '紧急', assignee: '林伟权', createTime: '2026-03-12 08:45', updateTime: '2026-03-12 11:30', status: '已解决', description: 'AGC直控通道响应延迟达到380ms，超过200ms标准上限，已紧急排查通信链路并完成优化，延迟恢复至120ms以内。' },
  { key: '5',  ticketNo: 'CS-2026-0311-002', title: '现货市场报价策略咨询',          customer: '东莞某制造集团',  type: '业务咨询',  priority: '低',  assignee: '梁梓柔', createTime: '2026-03-11 15:20', updateTime: '2026-03-12 10:00', status: '已解决', description: '客户对现货市场中长期策略有疑问，要求业务经理安排专题讲解，已完成线上培训并发送电价策略报告。' },
  { key: '6',  ticketNo: 'CS-2026-0310-003', title: '平台登录账号权限异常',          customer: '佛山陶瓷产业园',  type: '系统问题',  priority: '中',  assignee: '刘海',  createTime: '2026-03-10 11:00', updateTime: '2026-03-10 14:00', status: '已解决', description: '客户账号无法访问收益结算模块，经排查为权限配置错误，已重置账号权限并通知客户验证。' },
  { key: '7',  ticketNo: 'CS-2026-0315-004', title: '希望获取历史调度数据报告',       customer: '广州花都某物流园', type: '数据请求',  priority: '低',  assignee: '梁梓柔', createTime: '2026-03-15 11:30', updateTime: '2026-03-15 11:30', status: '待处理', description: '客户请求导出2025年全年调度记录及收益报表，用于内部年度决策分析。' },
  { key: '8',  ticketNo: 'CS-2026-0309-001', title: '需求响应补贴政策变更咨询',       customer: '中山某医药集团',  type: '业务咨询',  priority: '中',  assignee: '杜陈傲', createTime: '2026-03-09 09:00', updateTime: '2026-03-10 09:00', status: '已解决', description: '客户询问2026年广东需求响应新政策对其合同收益的影响，已安排交易经理出具专项分析报告。' },
];

const typeColorMap: Record<string, string> = {
  '设备故障': '#ff6b6b', '账单问题': '#ffb800', '业务咨询': '#00d4ff',
  '性能问题': '#ff6b6b', '系统问题': '#a78bfa', '数据请求': '#00ff88',
};

const priorityMap: Record<string, string> = {
  '紧急': 'error', '高': 'warning', '中': 'processing', '低': 'default',
};

const statusMap: Record<string, { tag: string; icon: React.ReactNode }> = {
  '待处理': { tag: 'default',    icon: <ClockCircleOutlined /> },
  '处理中': { tag: 'processing', icon: <SyncOutlined spin /> },
  '已解决': { tag: 'success',    icon: <CheckCircleOutlined /> },
};

const ticketTimelines: Record<string, Array<{ time: string; actor: string; action: string; color: string }>> = {
  '1': [
    { time: '2026-03-15 09:12', actor: '系统', action: '工单创建', color: 'gray' },
    { time: '2026-03-15 09:20', actor: '林伟权', action: '接单，远程诊断通信模块', color: 'blue' },
    { time: '2026-03-15 10:30', actor: '林伟权', action: '排查发现通信板卡故障，联系供应商备件', color: 'orange' },
  ],
  '4': [
    { time: '2026-03-12 08:45', actor: '系统', action: '监控告警触发，自动创建工单', color: 'red' },
    { time: '2026-03-12 08:50', actor: '林伟权', action: '接单，排查通信链路', color: 'blue' },
    { time: '2026-03-12 10:15', actor: '林伟权', action: '发现BGP路由抖动，调整QoS参数', color: 'orange' },
    { time: '2026-03-12 11:30', actor: '林伟权', action: '延迟恢复正常（118ms），工单关闭', color: 'green' },
  ],
};

export default function CustomerService() {
  const { colors: c } = useTheme();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [form] = Form.useForm();

  const filtered = tickets.filter(t => {
    const matchSearch = t.title.includes(search) || t.customer.includes(search) || t.ticketNo.includes(search);
    const matchStatus = statusFilter === '全部' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total    = tickets.length;
  const pending  = tickets.filter(t => t.status === '待处理').length;
  const handling = tickets.filter(t => t.status === '处理中').length;
  const resolved = tickets.filter(t => t.status === '已解决').length;

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };

  const handleCreateTicket = (values: { title: string; customer: string; type: string; priority: string; description: string }) => {
    const newTicket: Ticket = {
      key: String(tickets.length + 1),
      ticketNo: `CS-2026-${new Date().toISOString().slice(5, 10).replace('-', '')}-00${tickets.length + 1}`,
      ...values,
      assignee: '待分配',
      createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      updateTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      status: '待处理',
    };
    setTickets(prev => [newTicket, ...prev]);
    setNewTicketOpen(false);
    form.resetFields();
    message.success('工单已创建');
  };

  const columns: ColumnType<Ticket>[] = [
    {
      title: '工单号',
      dataIndex: 'ticketNo',
      render: (v: string) => <span style={{ color: c.textMuted, fontSize: 11, fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '问题标题',
      dataIndex: 'title',
      render: (v: string) => <span style={{ color: c.textPrimary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '客户',
      dataIndex: 'customer',
      render: (v: string) => <span style={{ color: c.textSecondary }}>{v}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => (
        <Tag style={{ color: typeColorMap[v], borderColor: typeColorMap[v], background: `${typeColorMap[v]}15` }}>{v}</Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (v: string) => <Tag color={priorityMap[v]}>{v}</Tag>,
    },
    {
      title: '处理人',
      dataIndex: 'assignee',
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar size={20} style={{ background: c.primaryMuted, color: c.primary, fontSize: 10 }}>
            {v[0]}
          </Avatar>
          <span style={{ color: c.textSecondary, fontSize: 12 }}>{v}</span>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      render: (v: string) => <span style={{ color: c.textMuted, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={statusMap[v]?.tag} icon={statusMap[v]?.icon}>{v}</Tag>
      ),
    },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          size="small"
          icon={<CustomerServiceOutlined />}
          style={{ color: c.primary, borderColor: c.primaryBorder, background: 'transparent' }}
          onClick={() => setSelectedTicket(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const timeline = selectedTicket ? (ticketTimelines[selectedTicket.key] ?? []) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>客户服务中心</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            解决率 {total > 0 ? ((resolved / total) * 100).toFixed(0) : 0}% · 共 {total} 个工单
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setNewTicketOpen(true)}
        >
          新建工单
        </Button>
      </div>

      {/* KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '工单总数', value: total,    color: c.primary },
          { title: '待处理',  value: pending,  color: c.textSecondary },
          { title: '处理中',  value: handling, color: c.warning },
          { title: '已解决',  value: resolved, color: c.success },
        ].map(item => (
          <Col key={item.title} xs={12} md={6}>
            <Card
              style={{ background: c.bgCard, border: `1px solid ${item.color}25`, borderRadius: 12 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Statistic
                title={<span style={{ color: c.textMuted, fontSize: 12 }}>{item.title}</span>}
                value={item.value}
                valueStyle={{ color: item.color, fontSize: 22, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: c.primary }}>工单列表</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 100 }}
                options={['全部', '待处理', '处理中', '已解决'].map(v => ({ value: v, label: v }))}
              />
              <Input
                prefix={<SearchOutlined style={{ color: c.textDim }} />}
                placeholder="搜索工单 / 客户"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 220, background: c.bgPage, border: `1px solid ${c.primaryBorder}` }}
                allowClear
              />
            </div>
          </div>
        }
        style={cardStyle}
        styles={{ header: headerStyle }}
      >
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 8, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CustomerServiceOutlined style={{ color: c.primary }} />
            <span style={{ color: c.primary }}>工单详情</span>
          </div>
        }
        open={!!selectedTicket}
        onCancel={() => setSelectedTicket(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedTicket(null)}>关闭</Button>,
          selectedTicket?.status === '处理中' && (
            <Button
              key="resolve"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setTickets(prev => prev.map(t =>
                  t.key === selectedTicket.key ? { ...t, status: '已解决', updateTime: new Date().toLocaleString('zh-CN') } : t
                ));
                message.success('工单已标记为已解决');
                setSelectedTicket(null);
              }}
            >
              标记已解决
            </Button>
          ),
        ]}
        width={640}
        styles={{ body: { background: c.bgSider }, header: { background: c.bgSider } }}
      >
        {selectedTicket && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <Tag style={{ color: typeColorMap[selectedTicket.type], borderColor: typeColorMap[selectedTicket.type], background: `${typeColorMap[selectedTicket.type]}15` }}>
                  {selectedTicket.type}
                </Tag>
                <Tag color={priorityMap[selectedTicket.priority]}>{selectedTicket.priority}</Tag>
                <Tag color={statusMap[selectedTicket.status]?.tag} icon={statusMap[selectedTicket.status]?.icon}>
                  {selectedTicket.status}
                </Tag>
              </div>
              <div style={{ color: c.textPrimary, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{selectedTicket.title}</div>
              <div style={{ color: c.textSecondary, fontSize: 12, marginBottom: 4 }}>
                客户：{selectedTicket.customer} · 处理人：{selectedTicket.assignee}
              </div>
              <div style={{ color: c.textDim, fontSize: 11 }}>
                创建：{selectedTicket.createTime} · 更新：{selectedTicket.updateTime}
              </div>
            </div>

            <div style={{ background: c.bgCard, borderRadius: 8, padding: '12px 16px', marginBottom: 16, border: `1px solid ${c.primaryBorderLight}` }}>
              <div style={{ color: c.textMuted, fontSize: 11, marginBottom: 6 }}>问题描述</div>
              <div style={{ color: c.textSecondary, fontSize: 13, lineHeight: 1.6 }}>{selectedTicket.description}</div>
            </div>

            {timeline.length > 0 && (
              <div>
                <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 10 }}>处理进度</div>
                <Timeline
                  items={timeline.map(t => ({
                    dot: t.color === 'green'
                      ? <CheckCircleOutlined style={{ color: c.success }} />
                      : t.color === 'red'
                      ? <CustomerServiceOutlined style={{ color: c.danger }} />
                      : <ClockCircleOutlined style={{ color: c.primary }} />,
                    children: (
                      <div>
                        <div style={{ color: c.textPrimary, fontSize: 13 }}>
                          <span style={{ color: c.primary, fontWeight: 600 }}>{t.actor}</span>
                          {' · '}{t.action}
                        </div>
                        <div style={{ color: c.textDim, fontSize: 11 }}>{t.time}</div>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal
        title={<span style={{ color: c.primary }}>新建工单</span>}
        open={newTicketOpen}
        onCancel={() => { setNewTicketOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="创建工单"
        styles={{ body: { background: c.bgSider }, header: { background: c.bgSider } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTicket} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="问题标题" rules={[{ required: true, message: '请输入问题标题' }]}>
            <Input placeholder="请简要描述问题" />
          </Form.Item>
          <Form.Item name="customer" label="客户/机构" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="客户或机构名称" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="问题类型" rules={[{ required: true }]}>
                <Select options={['设备故障', '账单问题', '业务咨询', '性能问题', '系统问题', '数据请求'].map(v => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select options={['紧急', '高', '中', '低'].map(v => ({ value: v, label: v }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请描述具体问题' }]}>
            <Input.TextArea rows={4} placeholder="详细描述问题现象、影响范围等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

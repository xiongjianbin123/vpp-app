import { useState } from 'react';
import { Row, Col, Card, Table, Button, Statistic, Tag, Input, Modal, Descriptions, Timeline, message } from 'antd';
import {
  SearchOutlined, DownloadOutlined, FileProtectOutlined,
  CheckCircleOutlined, ClockCircleOutlined, EditOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import type { ColumnType } from 'antd/es/table';

interface Contract {
  key: string;
  contractNo: string;
  name: string;
  customer: string;
  type: string;
  signDate: string;
  expireDate: string;
  amount: number;
  status: string;
}

const contracts: Contract[] = [
  { key: '1',  contractNo: 'HT-2026-0301', name: '园区储能聚合服务协议',   customer: '广州南沙科技园',  type: '聚合服务', signDate: '2026-03-01', expireDate: '2027-03-01', amount: 1200000, status: '已签署' },
  { key: '2',  contractNo: 'HT-2026-0302', name: '调频辅助服务框架合同',   customer: '南方电网广东分公司', type: '辅助服务', signDate: '2026-03-05', expireDate: '2027-03-05', amount: 3500000, status: '已签署' },
  { key: '3',  contractNo: 'HT-2026-0303', name: '充电桩群调度管理协议',   customer: '顺丰速运广东仓储', type: '需求响应', signDate: '', expireDate: '2027-02-28', amount: 680000,  status: '待签署' },
  { key: '4',  contractNo: 'HT-2026-0304', name: '工业负荷响应补贴协议',   customer: '美的集团顺德基地', type: '需求响应', signDate: '', expireDate: '2027-06-30', amount: 920000,  status: '审核中' },
  { key: '5',  contractNo: 'HT-2026-0305', name: '现货市场代理交易合同',   customer: '东莞某制造集团',  type: '代理交易', signDate: '2026-02-20', expireDate: '2026-12-31', amount: 2100000, status: '已签署' },
  { key: '6',  contractNo: 'HT-2025-1201', name: '2025年调峰补贴结算合同', customer: '广东电力交易中心',  type: '辅助服务', signDate: '2025-12-01', expireDate: '2026-01-31', amount: 4800000, status: '已过期' },
  { key: '7',  contractNo: 'HT-2026-0306', name: '屋顶光伏聚合接入协议',   customer: '广州花都某物流园', type: '聚合服务', signDate: '', expireDate: '2027-03-15', amount: 450000,  status: '待签署' },
  { key: '8',  contractNo: 'HT-2026-0307', name: 'AGC直控服务协议',       customer: '南方电网调度中心',  type: 'AGC直控',  signDate: '2026-03-10', expireDate: '2028-03-10', amount: 6200000, status: '已签署' },
  { key: '9',  contractNo: 'HT-2026-0308', name: '电力用户代理售电合同',   customer: '佛山陶瓷产业园',  type: '代理交易', signDate: '', expireDate: '2027-01-01', amount: 1560000, status: '审核中' },
  { key: '10', contractNo: 'HT-2025-1101', name: '储能租赁运营服务合同',   customer: '中山某医药集团',  type: '储能租赁', signDate: '2025-11-01', expireDate: '2026-02-28', amount: 750000,  status: '已过期' },
];

const typeColorMap: Record<string, string> = {
  '聚合服务': '#00d4ff', '辅助服务': '#00ff88', '需求响应': '#ffb800',
  '代理交易': '#a78bfa', 'AGC直控': '#ff6b6b', '储能租赁': '#4ecdc4',
};

const statusMap: Record<string, { color: string; tag: string }> = {
  '已签署': { color: 'success',    tag: 'success' },
  '待签署': { color: 'warning',    tag: 'warning' },
  '审核中': { color: 'processing', tag: 'processing' },
  '已过期': { color: 'error',      tag: 'error' },
};

const contractTimeline: Record<string, Array<{ time: string; event: string; color: string }>> = {
  '1': [
    { time: '2026-02-20', event: '合同起草完成', color: 'gray' },
    { time: '2026-02-25', event: '法务审核通过', color: 'blue' },
    { time: '2026-03-01', event: '双方电子签署完成', color: 'green' },
    { time: '2026-03-01', event: '合同生效', color: 'green' },
  ],
  '3': [
    { time: '2026-03-08', event: '合同起草完成', color: 'gray' },
    { time: '2026-03-12', event: '发送客户审阅', color: 'blue' },
    { time: '2026-03-15', event: '等待客户签署', color: 'orange' },
  ],
};

export default function ContractSigning() {
  const { colors: c } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const filtered = contracts.filter(ct =>
    ct.name.includes(search) || ct.customer.includes(search) || ct.contractNo.includes(search)
  );

  const total     = contracts.length;
  const signed    = contracts.filter(c => c.status === '已签署').length;
  const pending   = contracts.filter(c => c.status === '待签署').length;
  const reviewing = contracts.filter(c => c.status === '审核中').length;
  const totalAmt  = contracts.filter(c => c.status === '已签署').reduce((a, b) => a + b.amount, 0);

  const cardStyle = { background: c.bgCard, border: `1px solid ${c.primaryBorderLight}`, borderRadius: 12 };
  const headerStyle = { background: 'transparent', borderBottom: `1px solid ${c.primaryBorderLight}` };

  const columns: ColumnType<Contract>[] = [
    {
      title: '合同编号',
      dataIndex: 'contractNo',
      render: (v: string) => <span style={{ color: c.textMuted, fontSize: 12, fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '合同名称',
      dataIndex: 'name',
      render: (v: string) => <span style={{ color: c.textPrimary, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: '客户/机构',
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
      title: '合同金额',
      dataIndex: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (v: number) => <span style={{ color: c.success, fontWeight: 600 }}>¥{(v / 10000).toFixed(0)}万</span>,
    },
    {
      title: '到期日',
      dataIndex: 'expireDate',
      render: (v: string) => <span style={{ color: c.textMuted, fontSize: 12 }}>{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => <Tag color={statusMap[v]?.tag}>{v}</Tag>,
    },
    {
      title: '操作',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{ color: c.primary, borderColor: c.primaryBorder, background: 'transparent' }}
            onClick={() => setSelectedContract(record)}
          >
            详情
          </Button>
          {record.status === '待签署' && (
            <Button
              size="small"
              icon={<EditOutlined />}
              type="primary"
              onClick={() => message.success(`已发起电子签署：${record.name}`)}
            >
              发起签署
            </Button>
          )}
        </div>
      ),
    },
  ];

  const timeline = selectedContract ? (contractTimeline[selectedContract.key] ?? []) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: c.primary, margin: 0, fontSize: 20, letterSpacing: 1 }}>合同签署管理</h2>
          <p style={{ color: c.textDim, margin: '4px 0 0', fontSize: 12 }}>
            已签署合同金额 ¥{(totalAmt / 10000).toFixed(0)}万
          </p>
        </div>
        <Button
          icon={<DownloadOutlined />}
          style={{ background: c.bgCard, border: `1px solid ${c.primaryBorder}`, color: c.primary }}
          onClick={() => message.success('合同台账已导出')}
        >
          导出台账
        </Button>
      </div>

      {/* KPI */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: '合同总数',   value: total,     suffix: '份', color: c.primary },
          { title: '已签署',    value: signed,    suffix: '份', color: c.success },
          { title: '待签署',    value: pending,   suffix: '份', color: c.warning },
          { title: '审核中',    value: reviewing, suffix: '份', color: '#a78bfa' },
        ].map(item => (
          <Col key={item.title} xs={12} md={6}>
            <Card
              style={{ background: c.bgCard, border: `1px solid ${item.color}25`, borderRadius: 12 }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Statistic
                title={<span style={{ color: c.textMuted, fontSize: 12 }}>{item.title}</span>}
                value={item.value}
                suffix={<span style={{ fontSize: 14, color: c.textMuted }}>{item.suffix}</span>}
                valueStyle={{ color: item.color, fontSize: 22, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: c.primary }}>合同列表</span>
            <Input
              prefix={<SearchOutlined style={{ color: c.textDim }} />}
              placeholder="搜索合同名称 / 客户 / 编号"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260, background: c.bgPage, border: `1px solid ${c.primaryBorder}` }}
              allowClear
            />
          </div>
        }
        style={cardStyle}
        styles={{ header: headerStyle }}
      >
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 8, showTotal: t => `共 ${t} 份` }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileProtectOutlined style={{ color: c.primary }} />
            <span style={{ color: c.primary }}>合同详情</span>
          </div>
        }
        open={!!selectedContract}
        onCancel={() => setSelectedContract(null)}
        footer={
          selectedContract?.status === '待签署'
            ? [
                <Button key="cancel" onClick={() => setSelectedContract(null)}>关闭</Button>,
                <Button
                  key="sign"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    message.success(`已发起电子签署：${selectedContract?.name}`);
                    setSelectedContract(null);
                  }}
                >
                  发起电子签署
                </Button>,
              ]
            : [<Button key="close" onClick={() => setSelectedContract(null)}>关闭</Button>]
        }
        width={640}
        styles={{ body: { background: c.bgSider }, header: { background: c.bgSider } }}
      >
        {selectedContract && (
          <div>
            <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="合同编号">{selectedContract.contractNo}</Descriptions.Item>
              <Descriptions.Item label="合同名称">{selectedContract.name}</Descriptions.Item>
              <Descriptions.Item label="客户/机构">{selectedContract.customer}</Descriptions.Item>
              <Descriptions.Item label="合同类型">{selectedContract.type}</Descriptions.Item>
              <Descriptions.Item label="合同金额">
                <span style={{ color: c.success, fontWeight: 600 }}>¥{(selectedContract.amount / 10000).toFixed(0)}万</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedContract.status]?.tag}>{selectedContract.status}</Tag>
              </Descriptions.Item>
              {selectedContract.signDate && (
                <Descriptions.Item label="签署日期">{selectedContract.signDate}</Descriptions.Item>
              )}
              <Descriptions.Item label="到期日期">{selectedContract.expireDate}</Descriptions.Item>
            </Descriptions>

            {timeline.length > 0 && (
              <div>
                <div style={{ color: c.textMuted, fontSize: 12, marginBottom: 10 }}>合同进度</div>
                <Timeline
                  items={timeline.map(t => ({
                    dot: t.color === 'green'
                      ? <CheckCircleOutlined style={{ color: c.success }} />
                      : <ClockCircleOutlined style={{ color: c.primary }} />,
                    children: (
                      <div>
                        <div style={{ color: c.textPrimary, fontSize: 13 }}>{t.event}</div>
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
    </div>
  );
}

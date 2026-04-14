import { useState } from 'react';
import { Row, Col, Card, Form, Select, Button, Steps, Table, Tag, Alert } from 'antd';
import { FileProtectOutlined, LinkOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';

const agent = agents.find(a => a.key === 'contract-generator')!;

interface RiskItem {
  key: string;
  category: string;
  item: string;
  status: 'pass' | 'warning' | 'missing';
  suggestion: string;
}

const mockRiskReview: RiskItem[] = [
  { key: '1', category: '财务', item: '保底收益条款', status: 'pass', suggestion: '已设置年化收益不低于6%的保底条款' },
  { key: '2', category: '财务', item: '付款担保', status: 'warning', suggestion: '建议增加银行保函或母公司担保条款' },
  { key: '3', category: '财务', item: '通胀调整机制', status: 'missing', suggestion: '缺少CPI联动调整条款，建议每3年调整一次' },
  { key: '4', category: '运营', item: '基线确认方法', status: 'pass', suggestion: '采用IPMVP标准，安装前后各7天连续监测' },
  { key: '5', category: '运营', item: '计量争议解决', status: 'pass', suggestion: '约定第三方检测机构仲裁' },
  { key: '6', category: '法律', item: '提前终止条件', status: 'warning', suggestion: '终止条件不对等，建议增加投资方提前终止权' },
  { key: '7', category: '法律', item: '资产移交条款', status: 'pass', suggestion: '合同期满后设备无偿移交客户' },
  { key: '8', category: '政策', item: '政策变化应对', status: 'warning', suggestion: '建议增加电价政策重大变化时的重新谈判机制' },
];

const statusConfig = {
  pass: { color: '#00ff88', text: '通过', icon: <CheckCircleOutlined /> },
  warning: { color: '#ffb800', text: '建议修改', icon: <WarningOutlined /> },
  missing: { color: '#ff4d4f', text: '缺失', icon: <WarningOutlined /> },
};

export default function ContractGeneratorTab() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const onGenerate = () => {
    setLoading(true);
    setStep(0);
    const interval = setInterval(() => {
      setStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          setGenerated(true);
          setLoading(false);
          return 3;
        }
        return prev + 1;
      });
    }, 600);
  };

  const columns = [
    { title: '类别', dataIndex: 'category', key: 'category', render: (v: string) => <Tag color={colors.primary}>{v}</Tag> },
    { title: '审查项', dataIndex: 'item', key: 'item', render: (v: string) => <span style={{ color: colors.textPrimary }}>{v}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: keyof typeof statusConfig) => {
      const sc = statusConfig[v];
      return <Tag icon={sc.icon} color={sc.color}>{sc.text}</Tag>;
    }},
    { title: '建议', dataIndex: 'suggestion', key: 'suggestion', render: (v: string) => <span style={{ color: colors.textSecondary, fontSize: 12 }}>{v}</span> },
  ];

  const passCount = mockRiskReview.filter(r => r.status === 'pass').length;
  const warnCount = mockRiskReview.filter(r => r.status === 'warning').length;
  const missCount = mockRiskReview.filter(r => r.status === 'missing').length;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        <Card
          title={<span style={{ color: colors.textPrimary }}>合同生成参数</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>合同类型</span>}>
                  <Select defaultValue="storage_ci" options={[
                    { label: '工商业储能EMC（标准）', value: 'storage_ci' },
                    { label: '大型独立储能EMC', value: 'storage_large' },
                    { label: '用户侧储能EMC', value: 'storage_user' },
                    { label: '无功补偿EMC（XQ-XP-B）', value: 'reactive' },
                    { label: '变频器改造EMC', value: 'vfd' },
                    { label: '零碳园区综合服务', value: 'zero_carbon' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>客户名称</span>}>
                  <Select defaultValue="兆丰铝电" options={[
                    { label: '信发集团（山西）', value: '信发集团' },
                    { label: '兆丰铝电', value: '兆丰铝电' },
                    { label: '台山宝丰钢铁', value: '台山宝丰' },
                    { label: '广前燃气电厂', value: '广前' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>收益分成比例</span>}>
                  <Select defaultValue="40/60" options={[
                    { label: '投资方40% / 客户60%', value: '40/60' },
                    { label: '投资方30% / 客户70%', value: '30/70' },
                    { label: '投资方50% / 客户50%', value: '50/50' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<FileProtectOutlined />} onClick={onGenerate} loading={loading}>
              生成合同 + AI风险审查
            </Button>
          </Form>

          {loading && (
            <Steps
              current={step}
              size="small"
              style={{ marginTop: 16 }}
              items={[
                { title: '模板匹配' },
                { title: '参数填充' },
                { title: 'AI风险审查' },
                { title: '完成' },
              ]}
            />
          )}
        </Card>

        {generated && (
          <>
            <Alert
              type={missCount > 0 ? 'error' : warnCount > 0 ? 'warning' : 'success'}
              message={`AI风险审查完成：${passCount}项通过，${warnCount}项建议修改，${missCount}项缺失`}
              style={{ marginBottom: 16 }}
              showIcon
            />

            <Card
              title={<span style={{ color: colors.textPrimary }}>合同风险审查报告</span>}
              size="small"
              style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
            >
              <Table columns={columns} dataSource={mockRiskReview} size="small" pagination={false} />
            </Card>

            <Button icon={<LinkOutlined />} onClick={() => navigate('/contract')} style={{ color: colors.primary }}>
              前往合同签署 &rarr;
            </Button>
          </>
        )}
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '工商业储能EMC合同的核心条款有哪些',
            '如何设计收益分成的保底条款',
            '合同中政策变化风险如何规避',
          ]}
        />
      </Col>
    </Row>
  );
}

import { useState } from 'react';
import { Row, Col, Card, Form, InputNumber, Select, Button, Table, Tag, Descriptions } from 'antd';
import { BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';
import { callAgentAction } from '../../services/agentApi';
import FileUpload from '../../components/FileUpload';

const agent = agents.find(a => a.key === 'finance-matcher')!;

interface FinancePlan {
  key: string;
  type: string;
  institution: string;
  rate: string;
  term: string;
  amount: string;
  enhancement: string;
  score: number;
  recommended: boolean;
}

const mockPlans: FinancePlan[] = [
  { key: '1', type: '绿色信贷', institution: '兴业银行', rate: 'LPR-30bp (≈3.55%)', term: '10年', amount: '800万', enhancement: 'EMC收益权质押 + 设备抵押', score: 95, recommended: true },
  { key: '2', type: '融资租赁', institution: '远东宏信', rate: '6.5%/年', term: '8年', amount: '700万', enhancement: '售后回租，设备所有权在租赁方', score: 82, recommended: false },
  { key: '3', type: '碳减排支持工具', institution: '国开行', rate: '1.75%（央行再贷款）', term: '5年', amount: '480万（60%本金）', enhancement: '碳减排量核算报告', score: 78, recommended: false },
];

export default function FinanceMatcherTab() {
  const { colors } = useTheme();
  const [plans, setPlans] = useState<FinancePlan[]>([]);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadDataId, setUploadDataId] = useState<string | null>(null);

  // Controlled form state
  const [investAmount, setInvestAmount] = useState(800);
  const [projectType, setProjectType] = useState('工商业储能');
  const [creditRating, setCreditRating] = useState('AA');
  const [contractYears, setContractYears] = useState(10);
  const [carbonReduction, setCarbonReduction] = useState(400);

  const onMatch = async () => {
    setLoading(true);
    try {
      const result = await callAgentAction<{ plans: FinancePlan[] }>(
        'finance-matcher', 'match',
        { investAmount, projectType, creditRating, contractYears, carbonReduction, dataId: uploadDataId }
      );
      if (result.success && result.data?.plans) {
        setPlans(result.data.plans);
      } else {
        setPlans(mockPlans); // fallback to mock
      }
    } catch {
      setPlans(mockPlans);
    } finally {
      setMatched(true);
      setLoading(false);
    }
  };

  const columns = [
    { title: '融资类型', dataIndex: 'type', key: 'type', render: (v: string, r: FinancePlan) => (
      <span style={{ color: colors.textPrimary, fontWeight: 500 }}>
        {v} {r.recommended && <Tag color="#00ff88">推荐</Tag>}
      </span>
    )},
    { title: '金融机构', dataIndex: 'institution', key: 'institution' },
    { title: '利率/费率', dataIndex: 'rate', key: 'rate', render: (v: string) => <span style={{ color: '#00ff88' }}>{v}</span> },
    { title: '期限', dataIndex: 'term', key: 'term' },
    { title: '可融金额', dataIndex: 'amount', key: 'amount' },
    { title: '增信措施', dataIndex: 'enhancement', key: 'enhancement', render: (v: string) => <span style={{ color: colors.textSecondary, fontSize: 12 }}>{v}</span> },
    { title: '综合评分', dataIndex: 'score', key: 'score', render: (v: number) => <span style={{ color: colors.primary, fontWeight: 600 }}>{v}</span> },
  ];

  const bestPlan = plans.find(p => p.recommended) || plans[0];

  return (
    <Row gutter={16}>
      <Col xs={24} lg={14}>
        <Card
          title={<span style={{ color: colors.textPrimary }}>项目融资参数</span>}
          size="small"
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
        >
          <FileUpload
            agentKey="finance-matcher"
            onUploadComplete={(dataId) => setUploadDataId(dataId)}
          />
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>项目投资额 (万元)</span>}>
                  <InputNumber value={investAmount} onChange={v => setInvestAmount(v ?? 800)} min={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>项目类型</span>}>
                  <Select value={projectType} onChange={setProjectType} options={[
                    { label: '工商业储能', value: '工商业储能' },
                    { label: '大型独立储能', value: '大型独立储能' },
                    { label: '节能改造', value: '节能改造' },
                    { label: '零碳园区', value: '零碳园区' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>客户信用评级</span>}>
                  <Select value={creditRating} onChange={setCreditRating} options={[
                    { label: 'AAA', value: 'AAA' }, { label: 'AA+', value: 'AA+' },
                    { label: 'AA', value: 'AA' }, { label: 'A', value: 'A' },
                    { label: 'BBB', value: 'BBB' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>EMC合同期 (年)</span>}>
                  <InputNumber value={contractYears} onChange={v => setContractYears(v ?? 10)} min={3} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label={<span style={{ color: colors.textSecondary }}>年碳减排量 (tCO2)</span>}>
                  <InputNumber value={carbonReduction} onChange={v => setCarbonReduction(v ?? 400)} min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Button type="primary" icon={<BankOutlined />} onClick={onMatch} loading={loading}>
              匹配融资方案
            </Button>
          </Form>
        </Card>

        {matched && (
          <>
            <Card
              title={<span style={{ color: colors.textPrimary }}>融资方案推荐（按综合成本排序）</span>}
              size="small"
              style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
            >
              <Table columns={columns} dataSource={plans} size="small" pagination={false} />
            </Card>

            {bestPlan && (
              <Card
                title={<span style={{ color: colors.textPrimary }}><CheckCircleOutlined style={{ color: '#00ff88' }} /> 最优方案详情</span>}
                size="small"
                style={{ background: colors.bgCard, borderColor: colors.primaryBorder }}
              >
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="融资类型">{bestPlan.type}</Descriptions.Item>
                  <Descriptions.Item label="推荐机构">{bestPlan.institution}</Descriptions.Item>
                  <Descriptions.Item label="年利率">{bestPlan.rate}</Descriptions.Item>
                  <Descriptions.Item label="贷款期限">{bestPlan.term}</Descriptions.Item>
                  <Descriptions.Item label="可融金额">{bestPlan.amount}</Descriptions.Item>
                  <Descriptions.Item label="还款方式">等额本息</Descriptions.Item>
                  <Descriptions.Item label="增信措施" span={2}>
                    {bestPlan.enhancement}
                  </Descriptions.Item>
                  <Descriptions.Item label="适用政策" span={2}>
                    符合央行碳减排支持工具条件（利率1.75%，支持60%本金）
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentKey={agent.key}
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '800万工商业储能项目最优融资方案',
            '如何申请央行碳减排支持工具',
            '多项目打包融资的条件和流程',
          ]}
        />
      </Col>
    </Row>
  );
}

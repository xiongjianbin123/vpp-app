import { useState } from 'react';
import { Row, Col, Card, Form, Select, Button, Table, Tag } from 'antd';
import { SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import AgentChatPanel from './AgentChatPanel';
import { agents } from './agentMockData';
import { callAgentAction } from '../../services/agentApi';
import FileUpload from '../../components/FileUpload';

const agent = agents.find(a => a.key === 'customer-profiler')!;

const industries = ['钢铁', '氧化铝', '污水处理', '油田', '水泥', '化工', '数据中心', '纺织'];
const provinces = ['广东', '山西', '山东', '河南', '内蒙古', '浙江', '江苏', '河北'];

interface CustomerResult {
  key: string;
  name: string;
  industry: string;
  province: string;
  estimatedPower: string;
  savingPotential: string;
  grade: 'A' | 'B' | 'C';
  score: number;
}

const mockResults: CustomerResult[] = [
  { key: '1', name: '信发集团（山西）', industry: '氧化铝', province: '山西', estimatedPower: '2.4亿kWh/年', savingPotential: '1,200-1,800万元/年', grade: 'A', score: 92 },
  { key: '2', name: '兆丰铝电', industry: '氧化铝', province: '山西', estimatedPower: '8,000万kWh/年', savingPotential: '400-600万元/年', grade: 'A', score: 87 },
  { key: '3', name: '台山宝丰钢铁', industry: '钢铁', province: '广东', estimatedPower: '6,500万kWh/年', savingPotential: '300-500万元/年', grade: 'B', score: 74 },
  { key: '4', name: '某化工集团（河南）', industry: '化工', province: '河南', estimatedPower: '1.2亿kWh/年', savingPotential: '600-900万元/年', grade: 'B', score: 71 },
];

const gradeColors: Record<string, string> = { A: '#00ff88', B: '#ffb800', C: '#ff4d4f' };

export default function CustomerProfilerTab() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['氧化铝', '钢铁']);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['山西', '广东']);
  const [uploadDataId, setUploadDataId] = useState<string | null>(null);

  const onSearch = async () => {
    setSearching(true);
    try {
      const result = await callAgentAction<{ customers: CustomerResult[] }>(
        'customer-profiler', 'search',
        { industries: selectedIndustries, provinces: selectedProvinces, dataId: uploadDataId }
      );
      if (result.success && result.data?.customers) {
        setResults(result.data.customers);
      } else {
        setResults(mockResults); // fallback to mock
      }
    } catch {
      setResults(mockResults);
    } finally {
      setSearching(false);
    }
  };

  const columns = [
    { title: '企业名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ color: colors.textPrimary, fontWeight: 500 }}>{v}</span> },
    { title: '行业', dataIndex: 'industry', key: 'industry', render: (v: string) => <Tag color={colors.primary}>{v}</Tag> },
    { title: '省份', dataIndex: 'province', key: 'province' },
    { title: '预估年用电量', dataIndex: 'estimatedPower', key: 'estimatedPower' },
    { title: '节能潜力', dataIndex: 'savingPotential', key: 'savingPotential', render: (v: string) => <span style={{ color: '#00ff88' }}>{v}</span> },
    { title: '评分', dataIndex: 'score', key: 'score', sorter: (a: CustomerResult, b: CustomerResult) => a.score - b.score, render: (v: number) => <span style={{ color: colors.primary, fontWeight: 600 }}>{v}</span> },
    { title: '评级', dataIndex: 'grade', key: 'grade', render: (v: string) => <Tag color={gradeColors[v]}>{v}级</Tag> },
  ];

  return (
    <Row gutter={16} style={{ height: '100%' }}>
      <Col xs={24} lg={14}>
        <Card
          title={<span style={{ color: colors.textPrimary }}>客户筛选</span>}
          style={{ background: colors.bgCard, borderColor: colors.primaryBorder, marginBottom: 16 }}
          size="small"
        >
          <FileUpload
            agentKey="customer-profiler"
            onUploadComplete={(dataId) => setUploadDataId(dataId)}
          />
          <Form layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <Form.Item label={<span style={{ color: colors.textSecondary }}>目标行业</span>}>
              <Select
                mode="multiple"
                placeholder="选择行业"
                style={{ minWidth: 200 }}
                options={industries.map(i => ({ label: i, value: i }))}
                value={selectedIndustries}
                onChange={setSelectedIndustries}
              />
            </Form.Item>
            <Form.Item label={<span style={{ color: colors.textSecondary }}>目标省份</span>}>
              <Select
                mode="multiple"
                placeholder="选择省份"
                style={{ minWidth: 200 }}
                options={provinces.map(p => ({ label: p, value: p }))}
                value={selectedProvinces}
                onChange={setSelectedProvinces}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={searching}>
                筛选客户
              </Button>
            </Form.Item>
          </Form>

          <Table
            columns={columns}
            dataSource={results}
            size="small"
            pagination={false}
            style={{ color: colors.textPrimary }}
          />
        </Card>

        <Button
          icon={<LinkOutlined />}
          onClick={() => navigate('/customer-service')}
          style={{ color: colors.primary }}
        >
          前往客户服务中心 &rarr;
        </Button>
      </Col>

      <Col xs={24} lg={10}>
        <AgentChatPanel
          agentKey={agent.key}
          agentName={agent.name}
          systemPrompt={agent.systemPrompt}
          suggestions={[
            '分析山西省氧化铝行业的高价值客户',
            '信发集团的节能改造潜力如何？',
            '广东地区钢铁企业储能EMC前景',
          ]}
        />
      </Col>
    </Row>
  );
}

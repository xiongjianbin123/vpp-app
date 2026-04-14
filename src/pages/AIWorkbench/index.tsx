import { Tabs } from 'antd';
import {
  DashboardOutlined, TeamOutlined, CalculatorOutlined, BankOutlined,
  FileProtectOutlined, AlertOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import AgentDashboard from './AgentDashboard';
import CustomerProfilerTab from './CustomerProfilerTab';
import RevenueCalculatorTab from './RevenueCalculatorTab';
import FinanceMatcherTab from './FinanceMatcherTab';
import ContractGeneratorTab from './ContractGeneratorTab';
import OpsGuardianTab from './OpsGuardianTab';
import MarketIntelligenceTab from './MarketIntelligenceTab';

export default function AIWorkbench() {
  const { colors } = useTheme();

  const items = [
    {
      key: 'dashboard',
      label: <span><DashboardOutlined /> Agent总览</span>,
      children: <AgentDashboard />,
    },
    {
      key: 'customer',
      label: <span><TeamOutlined /> 客户画像</span>,
      children: <CustomerProfilerTab />,
    },
    {
      key: 'revenue',
      label: <span><CalculatorOutlined /> 收益测算</span>,
      children: <RevenueCalculatorTab />,
    },
    {
      key: 'finance',
      label: <span><BankOutlined /> 融资匹配</span>,
      children: <FinanceMatcherTab />,
    },
    {
      key: 'contract',
      label: <span><FileProtectOutlined /> 合同生成</span>,
      children: <ContractGeneratorTab />,
    },
    {
      key: 'ops',
      label: <span><AlertOutlined /> 运维告警</span>,
      children: <OpsGuardianTab />,
    },
    {
      key: 'market',
      label: <span><GlobalOutlined /> 市场情报</span>,
      children: <MarketIntelligenceTab />,
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Tabs
        items={items}
        destroyInactiveTabPane
        size="large"
        tabBarStyle={{
          marginBottom: 20,
          color: colors.textSecondary,
        }}
      />
    </div>
  );
}

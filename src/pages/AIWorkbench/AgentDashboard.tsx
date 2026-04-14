import { Row, Col, Card, Tag, Steps, Timeline, Badge, Statistic } from 'antd';
import {
  TeamOutlined, CalculatorOutlined, BankOutlined, FileProtectOutlined,
  AlertOutlined, GlobalOutlined, CheckCircleOutlined, SyncOutlined,
  WarningOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { agents, workflows, recentActivities } from './agentMockData';
import type { AgentInfo } from './agentMockData';

const iconMap: Record<string, React.ReactNode> = {
  TeamOutlined: <TeamOutlined />,
  CalculatorOutlined: <CalculatorOutlined />,
  BankOutlined: <BankOutlined />,
  FileProtectOutlined: <FileProtectOutlined />,
  AlertOutlined: <AlertOutlined />,
  GlobalOutlined: <GlobalOutlined />,
};

const statusConfig = {
  online: { color: '#00ff88', text: '运行中', icon: <SyncOutlined spin /> },
  idle: { color: '#ffb800', text: '空闲', icon: <ClockCircleOutlined /> },
  offline: { color: '#4a5568', text: '离线', icon: <ClockCircleOutlined /> },
};

function AgentCard({ agent, colors }: { agent: AgentInfo; colors: ReturnType<typeof useTheme>['colors'] }) {
  const st = statusConfig[agent.status];
  return (
    <Card
      size="small"
      style={{ background: colors.bgCard, borderColor: colors.primaryBorder, height: '100%' }}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: `${colors.primary}20`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: colors.primary,
        }}>
          {iconMap[agent.icon]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
          <Badge color={st.color} text={<span style={{ color: colors.textSecondary, fontSize: 12 }}>{st.text}</span>} />
        </div>
      </div>
      <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
        {agent.description}
      </div>
      <Row gutter={8}>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: colors.textMuted, fontSize: 11 }}>今日任务</span>}
            value={agent.todayTasks}
            valueStyle={{ color: colors.primary, fontSize: 18 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={{ color: colors.textMuted, fontSize: 11 }}>成功率</span>}
            value={agent.successRate}
            suffix="%"
            valueStyle={{ color: '#00ff88', fontSize: 18 }}
          />
        </Col>
        <Col span={8}>
          <div style={{ color: colors.textMuted, fontSize: 11, marginBottom: 4 }}>上次运行</div>
          <div style={{ color: colors.textSecondary, fontSize: 12 }}>{agent.lastRun}</div>
        </Col>
      </Row>
    </Card>
  );
}

export default function AgentDashboard() {
  const { colors } = useTheme();

  const activityStatusIcon: Record<string, React.ReactNode> = {
    success: <CheckCircleOutlined style={{ color: '#00ff88' }} />,
    running: <SyncOutlined spin style={{ color: colors.primary }} />,
    warning: <WarningOutlined style={{ color: '#ffb800' }} />,
  };

  return (
    <div>
      {/* Agent Status Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {agents.map(agent => (
          <Col key={agent.key} xs={24} sm={12} lg={8}>
            <AgentCard agent={agent} colors={colors} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Workflows */}
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ color: colors.textPrimary }}>Agent协作工作流</span>}
            style={{ background: colors.bgCard, borderColor: colors.primaryBorder }}
          >
            {Object.entries(workflows).map(([key, wf]) => (
              <div key={key} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Tag color={colors.primary}>{wf.name}</Tag>
                  <span style={{ color: colors.textSecondary, fontSize: 12 }}>{wf.description}</span>
                </div>
                <Steps
                  size="small"
                  current={-1}
                  items={wf.steps.map(step => ({
                    title: <span style={{ color: colors.textPrimary, fontSize: 12 }}>{step.title}</span>,
                    description: <span style={{ color: colors.textMuted, fontSize: 11 }}>{step.description}</span>,
                  }))}
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ color: colors.textPrimary }}>近期活动</span>}
            style={{ background: colors.bgCard, borderColor: colors.primaryBorder }}
          >
            <Timeline
              items={recentActivities.map(act => ({
                dot: activityStatusIcon[act.status],
                children: (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Tag color={colors.primary} style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
                        {act.agent}
                      </Tag>
                      <span style={{ color: colors.textPrimary, fontSize: 13 }}>{act.action}</span>
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: 12 }}>{act.target}</div>
                    <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{act.time}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

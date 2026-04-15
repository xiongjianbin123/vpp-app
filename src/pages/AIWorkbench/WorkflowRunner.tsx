import { useState } from 'react';
import { Steps, Button, Card, Tag, Typography, Space, Alert } from 'antd';
import { PlayCircleOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, ForwardOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { runWorkflow } from '../../services/workflowEngine';
import type { WorkflowStep, WorkflowStepResult } from '../../services/workflowEngine';

const { Text } = Typography;

interface WorkflowRunnerProps {
  title: string;
  description: string;
  steps: WorkflowStep[];
  initialParams?: Record<string, unknown>;
}

export default function WorkflowRunner({ title, description, steps, initialParams = {} }: WorkflowRunnerProps) {
  const { colors: c } = useTheme();
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [results, setResults] = useState<WorkflowStepResult[]>([]);

  const handleStart = async () => {
    setRunning(true);
    setCurrentStep(0);
    setResults([]);

    const stepResults: WorkflowStepResult[] = [];

    for await (const result of runWorkflow(steps, initialParams)) {
      if (result.status === 'running') {
        setCurrentStep(stepResults.length);
      } else {
        stepResults.push(result);
        setResults([...stepResults]);
        if (result.status === 'done' || result.status === 'skipped') {
          setCurrentStep(stepResults.length);
        }
      }
    }

    setRunning(false);
  };

  const getStepStatus = (index: number): 'wait' | 'process' | 'finish' | 'error' => {
    const result = results[index];
    if (!result) {
      if (index === currentStep && running) return 'process';
      return 'wait';
    }
    if (result.status === 'done') return 'finish';
    if (result.status === 'error') return 'error';
    if (result.status === 'skipped') return 'finish';
    return 'wait';
  };

  const getStepIcon = (index: number) => {
    const result = results[index];
    if (!result && index === currentStep && running) return <LoadingOutlined />;
    if (result?.status === 'done') return <CheckCircleOutlined style={{ color: '#00ff88' }} />;
    if (result?.status === 'error') return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    if (result?.status === 'skipped') return <ForwardOutlined style={{ color: '#ffb800' }} />;
    return undefined;
  };

  return (
    <Card
      size="small"
      style={{ background: c.bgCard, border: `1px solid ${c.primaryBorder}`, marginBottom: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Text strong style={{ color: c.textPrimary, fontSize: 14 }}>{title}</Text>
          <div style={{ color: c.textDim, fontSize: 11, marginTop: 2 }}>{description}</div>
        </div>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={running}
          onClick={handleStart}
          disabled={running}
          size="small"
          style={{ background: 'linear-gradient(90deg, #0066cc, #00d4ff)', border: 'none' }}
        >
          {running ? '运行中...' : '启动工作流'}
        </Button>
      </div>

      <Steps
        direction="vertical"
        size="small"
        current={currentStep}
        items={steps.map((step, i) => ({
          title: <span style={{ color: c.textPrimary, fontSize: 12 }}>{step.title}</span>,
          description: (
            <Space direction="vertical" size={2}>
              <span style={{ color: c.textDim, fontSize: 11 }}>{step.description}</span>
              {results[i]?.status === 'error' && (
                <Alert message={results[i].error} type="error" showIcon style={{ fontSize: 11, padding: '2px 8px' }} />
              )}
              {results[i]?.status === 'done' && (
                <Tag color="green" style={{ fontSize: 10 }}>完成</Tag>
              )}
              {results[i]?.status === 'skipped' && (
                <Tag color="orange" style={{ fontSize: 10 }}>需人工操作</Tag>
              )}
            </Space>
          ),
          status: getStepStatus(i),
          icon: getStepIcon(i),
        }))}
      />
    </Card>
  );
}

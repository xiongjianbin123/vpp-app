import { useState } from 'react';
import { Modal, Select, Input, Alert, Button } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { AI_PROVIDERS, saveAIConfig } from '../../services/aiService';
import type { AIConfig, AIProvider } from '../../services/aiService';

interface AIModelSelectorProps {
  open: boolean;
  onClose: () => void;
  config: AIConfig;
  onChange: (config: AIConfig) => void;
}

export default function AIModelSelector({ open, onClose, config, onChange }: AIModelSelectorProps) {
  const [draft, setDraft] = useState<AIConfig>(config);

  const handleOk = () => {
    saveAIConfig(draft);
    onChange(draft);
    onClose();
  };

  const handleProviderChange = (provider: AIProvider) => {
    const firstModel = AI_PROVIDERS[provider].models[0].id;
    setDraft({ provider, modelId: firstModel, apiKey: '' });
  };

  const provConf = AI_PROVIDERS[draft.provider];

  return (
    <Modal
      title={<span style={{ color: '#00d4ff' }}><KeyOutlined /> 配置 AI 模型</span>}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ style: { background: '#00d4ff', border: 'none', color: '#0a0e1a' } }}
      styles={{ body: { background: '#1a2540' }, header: { background: '#1a2540' } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <Alert
          message="API Key 仅保存在本地浏览器（localStorage），不会上传到任何服务器"
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />

        {/* Provider */}
        <div>
          <div style={{ color: '#aab4c8', fontSize: 12, marginBottom: 6 }}>选择服务商</div>
          <Select
            value={draft.provider}
            onChange={handleProviderChange}
            style={{ width: '100%' }}
            options={Object.entries(AI_PROVIDERS).map(([key, val]) => ({
              value: key,
              label: val.label,
            }))}
          />
        </div>

        {/* Model */}
        <div>
          <div style={{ color: '#aab4c8', fontSize: 12, marginBottom: 6 }}>选择模型</div>
          <Select
            value={draft.modelId}
            onChange={modelId => setDraft(d => ({ ...d, modelId }))}
            style={{ width: '100%' }}
            options={provConf.models.map(m => ({ value: m.id, label: m.label }))}
          />
        </div>

        {/* API Key */}
        <div>
          <div style={{ color: '#aab4c8', fontSize: 12, marginBottom: 6 }}>API Key</div>
          <Input.Password
            value={draft.apiKey}
            onChange={e => setDraft(d => ({ ...d, apiKey: e.target.value }))}
            placeholder={provConf.keyPlaceholder}
            style={{
              background: '#0d1526',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#e2e8f0',
              fontFamily: 'monospace',
            }}
          />
          <div style={{ color: '#4a6080', fontSize: 11, marginTop: 6 }}>
            前往{' '}
            <a
              href={provConf.helpURL}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#00d4ff' }}
            >
              {provConf.helpURL.replace('https://', '')}
            </a>{' '}
            获取 API Key
          </div>
        </div>

        {draft.apiKey && (
          <Button
            size="small"
            danger
            style={{ alignSelf: 'flex-start' }}
            onClick={() => setDraft(d => ({ ...d, apiKey: '' }))}
          >
            清除 Key
          </Button>
        )}
      </div>
    </Modal>
  );
}

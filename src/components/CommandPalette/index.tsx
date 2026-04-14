import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Tag, Spin } from 'antd';
import {
  SearchOutlined, ThunderboltOutlined, RocketOutlined,
  LineChartOutlined, DollarOutlined, BulbOutlined,
  DeploymentUnitOutlined, InfoCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { COMMANDS, CATEGORY_LABELS } from '../../services/commandRegistry';
import type { Command, CommandCategory } from '../../services/commandRegistry';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Stage = 'search' | 'form' | 'executing' | 'result';

const CATEGORY_ICONS: Record<CommandCategory, React.ReactNode> = {
  device: <DeploymentUnitOutlined />,
  task: <ThunderboltOutlined />,
  market: <LineChartOutlined />,
  revenue: <DollarOutlined />,
  theme: <BulbOutlined />,
  deploy: <RocketOutlined />,
  info: <InfoCircleOutlined />,
};

export default function CommandPalette({ open, onClose }: Props) {
  const { colors: c } = useTheme();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage>('search');
  const [selected, setSelected] = useState<Command | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [result, setResult] = useState<{ success: boolean; data: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery('');
      setStage('search');
      setSelected(null);
      setFormValues({});
      setResult(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = COMMANDS.filter(cmd => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      CATEGORY_LABELS[cmd.category].includes(q)
    );
  });

  const executeCommand = useCallback(async (cmd: Command, values: Record<string, string | number>) => {
    setStage('executing');
    setError(null);
    try {
      let url = cmd.endpoint;
      const opts: RequestInit = { method: cmd.method };

      if (cmd.method === 'GET') {
        const params = new URLSearchParams();
        Object.entries(values).forEach(([k, v]) => {
          if (v !== '' && v !== undefined && v !== null) params.append(k, String(v));
        });
        const qs = params.toString();
        if (qs) url += '?' + qs;
      } else {
        // POST — filter empty optional params
        const body: Record<string, unknown> = {};
        Object.entries(values).forEach(([k, v]) => {
          if (v !== '' && v !== undefined) body[k] = v;
        });
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(body);
      }

      const res = await fetch(url, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setResult(json);
      setStage('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStage('result');
    }
  }, []);

  const selectCommand = useCallback((cmd: Command) => {
    setSelected(cmd);
    // Initialize form with defaults
    const defaults: Record<string, string | number> = {};
    cmd.params?.forEach(p => {
      defaults[p.key] = p.default ?? '';
    });
    setFormValues(defaults);
    if (!cmd.params || cmd.params.length === 0) {
      setStage('executing');
      executeCommand(cmd, {});
    } else {
      setStage('form');
    }
  }, [executeCommand]);

  const handleExecute = () => {
    if (selected) executeCommand(selected, formValues);
  };

  const handleBack = () => {
    setStage('search');
    setSelected(null);
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (stage === 'search') onClose();
      else handleBack();
    }
    if (e.key === 'Enter' && stage === 'form') handleExecute();
    if (e.key === 'Enter' && stage === 'result') handleBack();
  };

  // ── Result renderer ─────────────────────────────────────────────────
  const renderResult = () => {
    if (error) {
      return (
        <div style={{ padding: '16px', background: `${c.danger}15`, borderRadius: 8, border: `1px solid ${c.danger}40` }}>
          <div style={{ color: c.danger, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CloseCircleOutlined /> 执行失败
          </div>
          <div style={{ color: c.textSecondary, fontSize: 13 }}>{error}</div>
        </div>
      );
    }
    if (!result) return null;
    const data = (result as { success: boolean; data: unknown }).data;
    const success = (result as { success: boolean }).success;

    return (
      <div style={{ padding: '16px', background: success ? `${c.success}10` : `${c.danger}15`, borderRadius: 8, border: `1px solid ${success ? c.success : c.danger}40` }}>
        <div style={{ color: success ? c.success : c.danger, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          {success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {success ? '执行成功' : '执行失败'}
        </div>
        {renderDataSummary(data, selected)}
      </div>
    );
  };

  const renderDataSummary = (data: unknown, cmd: Command | null) => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return renderArraySummary(data);
    }
    if (typeof data === 'object' && data !== null) {
      return renderObjectSummary(data as Record<string, unknown>, cmd);
    }
    return <span style={{ color: c.textPrimary, fontSize: 13 }}>{String(data)}</span>;
  };

  const renderArraySummary = (arr: unknown[]) => {
    if (arr.length === 0) return <span style={{ color: c.textDim, fontSize: 13 }}>无数据</span>;
    const sample = arr[0] as Record<string, unknown>;
    const keys = Object.keys(sample).slice(0, 5);
    return (
      <div>
        <div style={{ color: c.textDim, fontSize: 12, marginBottom: 8 }}>共 {arr.length} 条记录（显示前 5 条）</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {keys.map(k => (
                  <th key={k} style={{ padding: '4px 8px', textAlign: 'left', color: c.textDim, borderBottom: `1px solid ${c.borderSubtle}` }}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arr.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {keys.map(k => (
                    <td key={k} style={{ padding: '4px 8px', color: c.textPrimary, borderBottom: `1px solid ${c.borderSubtle}40` }}>
                      {String((row as Record<string, unknown>)[k] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderObjectSummary = (obj: Record<string, unknown>, cmd: Command | null) => {
    // Special rendering for deploy result
    if (cmd?.id === 'deploy' && obj.git) {
      const git = obj.git as Record<string, { success?: boolean }>;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['build', 'add', 'commit', 'push'].map(step => {
            const stepData = step === 'build' ? obj.build : git[step];
            const ok = Boolean((stepData as Record<string, unknown>)?.success);
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ color: ok ? c.success : c.danger }}>{ok ? '✅' : '❌'}</span>
                <span style={{ color: c.textPrimary }}>{step === 'build' ? 'npm run build' : `git ${step}`}</span>
              </div>
            );
          })}
          {!!obj.commit_message && (
            <div style={{ marginTop: 8, fontSize: 12, color: c.textDim }}>
              提交信息: {String(obj.commit_message)}
            </div>
          )}
          {!!obj.error && (
            <div style={{ color: c.danger, fontSize: 12 }}>{String(obj.error)}</div>
          )}
        </div>
      );
    }

    // Generic key-value rendering
    const entries = Object.entries(obj).filter(([k]) => !['committed_files', 'git', 'build'].includes(k));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ color: c.textDim, fontSize: 11, flexShrink: 0 }}>{k}</span>
            <span style={{ color: c.textPrimary, fontSize: 13, fontWeight: 500 }}>{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      centered
      styles={{
        container: {
          background: c.bgElevated,
          border: `1px solid ${c.primaryBorder}`,
          borderRadius: 12,
          padding: 0,
          boxShadow: `0 24px 64px rgba(0,0,0,0.6)`,
          overflow: 'hidden',
        },
        mask: { backdropFilter: 'blur(4px)' },
      }}
      keyboard={false}
    >
      <div onKeyDown={handleKeyDown}>
        {/* Search Input */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${c.primaryBorderLight}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <SearchOutlined style={{ color: c.textDim, fontSize: 16 }} />
          <input
            ref={inputRef}
            value={stage === 'search' ? query : (selected?.name ?? '')}
            onChange={e => { if (stage === 'search') setQuery(e.target.value); }}
            placeholder="搜索命令... (Esc 关闭)"
            readOnly={stage !== 'search'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: stage === 'search' ? c.textPrimary : c.primary,
              fontSize: 15,
              fontWeight: stage === 'search' ? 400 : 600,
            }}
          />
          {stage !== 'search' && (
            <span
              onClick={handleBack}
              style={{ color: c.textDim, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}
            >
              ← 返回
            </span>
          )}
          <Tag style={{ background: c.primaryMuted, border: `1px solid ${c.primaryBorder}`, color: c.textDim, fontSize: 11, marginRight: 0 }}>
            Ctrl+K
          </Tag>
        </div>

        {/* Command List */}
        {stage === 'search' && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: c.textDim, fontSize: 13 }}>
                没有匹配的命令
              </div>
            ) : (
              filtered.map(cmd => (
                <div
                  key={cmd.id}
                  onClick={() => selectCommand(cmd)}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = c.primaryMuted; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <span style={{ color: cmd.critical ? c.danger : cmd.dangerous ? c.warning : c.primary, fontSize: 16 }}>
                    {CATEGORY_ICONS[cmd.category]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: cmd.critical ? c.danger : cmd.dangerous ? c.warning : c.textPrimary, fontSize: 14, fontWeight: 500 }}>
                        {cmd.name}
                      </span>
                      {cmd.critical && <WarningOutlined style={{ color: c.danger, fontSize: 12 }} />}
                    </div>
                    <div style={{ color: c.textDim, fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cmd.description}
                    </div>
                  </div>
                  <Tag style={{
                    background: 'transparent',
                    border: `1px solid ${c.borderSubtle}`,
                    color: c.textDim,
                    fontSize: 10,
                    flexShrink: 0,
                  }}>
                    {CATEGORY_LABELS[cmd.category]}
                  </Tag>
                </div>
              ))
            )}
          </div>
        )}

        {/* Parameter Form */}
        {stage === 'form' && selected?.params && (
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ color: c.textSecondary, fontSize: 12, marginBottom: 14 }}>{selected.description}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selected.params.map(p => (
                <div key={p.key}>
                  <div style={{ color: c.textDim, fontSize: 12, marginBottom: 4 }}>
                    {p.label}{p.required && <span style={{ color: c.danger }}> *</span>}
                  </div>
                  {p.type === 'select' ? (
                    <select
                      value={String(formValues[p.key] ?? '')}
                      onChange={e => setFormValues(v => ({ ...v, [p.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: c.bgCard,
                        border: `1px solid ${c.primaryBorder}`,
                        borderRadius: 6,
                        color: c.textPrimary,
                        fontSize: 13,
                        outline: 'none',
                      }}
                    >
                      {p.options?.map(o => (
                        <option key={o} value={o} style={{ background: c.bgCard }}>
                          {o === '' ? '（不过滤）' : o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : 'text'}
                      value={String(formValues[p.key] ?? '')}
                      onChange={e => setFormValues(v => ({
                        ...v,
                        [p.key]: p.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                      }))}
                      placeholder={p.placeholder}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: c.bgCard,
                        border: `1px solid ${c.primaryBorder}`,
                        borderRadius: 6,
                        color: c.textPrimary,
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executing spinner */}
        {stage === 'executing' && (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: c.primary }} />} />
            <div style={{ color: c.textDim, fontSize: 13, marginTop: 12 }}>正在执行: {selected?.name}</div>
          </div>
        )}

        {/* Result */}
        {stage === 'result' && (
          <div style={{ padding: '16px' }}>
            {renderResult()}
          </div>
        )}

        {/* Footer */}
        {(stage === 'form' || stage === 'result') && (
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${c.primaryBorderLight}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}>
            <button
              onClick={handleBack}
              style={{
                padding: '6px 16px',
                background: 'transparent',
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 6,
                color: c.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              返回
            </button>
            {stage === 'form' && (
              <button
                onClick={handleExecute}
                style={{
                  padding: '6px 20px',
                  background: selected?.critical ? c.danger : selected?.dangerous ? c.warning : c.primary,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ⚡ 执行
              </button>
            )}
          </div>
        )}

        {/* Keyboard hints */}
        {stage === 'search' && (
          <div style={{
            padding: '8px 16px',
            borderTop: `1px solid ${c.borderSubtle}`,
            display: 'flex',
            gap: 16,
          }}>
            {[['↵', '执行'], ['Esc', '关闭']].map(([key, label]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag style={{ background: c.bgCard, border: `1px solid ${c.borderSubtle}`, color: c.textDim, fontSize: 10, margin: 0 }}>{key}</Tag>
                <span style={{ color: c.textDim, fontSize: 11 }}>{label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

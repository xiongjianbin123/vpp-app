import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import huitoneLogo from '/Huitone-logo.png';

export default function Login() {
  const { colors: c } = useTheme();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFinish = async ({ username, password }: { username: string; password: string }) => {
    setLoading(true);
    setError(false);
    const ok = await login(username, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError(true);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bgPage,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      transition: 'background 0.25s',
    }}>
      <div style={{
        width: 400,
        background: c.bgSider,
        border: `1px solid ${c.primaryBorder}`,
        borderRadius: 16,
        padding: '40px 40px 32px',
        boxShadow: `0 0 40px ${c.primaryMuted}`,
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={huitoneLogo} alt="Huitone" style={{ height: 40, marginBottom: 16 }} />
          <div style={{ color: c.textPrimary, fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
            虚拟电厂管理平台（演示版）
          </div>
          <div style={{ color: c.textDim, fontSize: 12 }}>Virtual Power Plant · Huitone Energy</div>
        </div>

        {/* Form */}
        <Form onFinish={handleFinish} autoComplete="off" layout="vertical">
          {error && (
            <Alert
              type="error"
              message="用户名或密码错误，请重试"
              style={{ marginBottom: 16, background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: 8 }}
              closable
              onClose={() => setError(false)}
            />
          )}
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined style={{ color: c.textDim }} />}
              placeholder="用户名"
              size="large"
              style={{
                background: c.bgCard,
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: c.textDim }} />}
              placeholder="密码"
              size="large"
              style={{
                background: c.bgCard,
                border: `1px solid ${c.primaryBorder}`,
                borderRadius: 8,
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                background: 'linear-gradient(90deg, #0066cc, #00d4ff)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              登 录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20, color: c.textDim, fontSize: 11, opacity: 0.6 }}>
          VPP v2.1.0 · © 2026 Huitone Energy
        </div>
      </div>
    </div>
  );
}

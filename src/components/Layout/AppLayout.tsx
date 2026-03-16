import { useState } from 'react';
import { Layout, Menu, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  DollarOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '监控大屏' },
  { key: '/devices', icon: <ApartmentOutlined />, label: '设备资产' },
  { key: '/demand-response', icon: <ThunderboltOutlined />, label: '需求响应' },
  { key: '/revenue', icon: <DollarOutlined />, label: '收益结算' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0e1a' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#0d1526',
          borderRight: '1px solid rgba(0, 212, 255, 0.15)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
        }}>
          <img
            src="/Huitone-logo.png"
            alt="Huitone Logo"
            style={{
              height: collapsed ? 32 : 40,
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            marginTop: 8,
          }}
        />
      </Sider>

      <Layout style={{ background: '#0a0e1a' }}>
        <Header style={{
          background: '#0d1526',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 64,
        }}>
          <div style={{ color: '#00d4ff', fontSize: 13, opacity: 0.7 }}>
            {new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ color: '#00d4ff', fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <UserOutlined style={{ color: '#00d4ff' }} />
              <span style={{ color: '#aab4c8', fontSize: 13 }}>运营管理员</span>
            </div>
          </div>
        </Header>

        <Content style={{ margin: 0, padding: 24, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

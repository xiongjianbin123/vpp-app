import { useState } from 'react';
import { Layout, Menu, Badge, Drawer, Avatar, Dropdown, List } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, ThunderboltOutlined, ApartmentOutlined, DollarOutlined,
  BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined, IdcardOutlined,
  CheckCircleOutlined, WarningOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import huitoneLogo from '/Huitone-logo.png';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '监控大屏' },
  { key: '/devices', icon: <ApartmentOutlined />, label: '设备资产' },
  { key: '/demand-response', icon: <ThunderboltOutlined />, label: '需求响应' },
  { key: '/revenue', icon: <DollarOutlined />, label: '收益结算' },
];

const pageNames: Record<string, string> = {
  '/': '实时监控大屏',
  '/devices': '设备资产管理',
  '/demand-response': '需求响应管理',
  '/revenue': '收益结算',
};

interface Notice {
  id: number;
  type: 'warning' | 'info' | 'success';
  title: string;
  time: string;
  read: boolean;
}

const initialNotices: Notice[] = [
  { id: 1, type: 'warning', title: '充电桩群-CBD 通信中断，请及时处理', time: '10分钟前', read: false },
  { id: 2, type: 'info', title: '调峰任务 T001 正在执行，当前进度 68%', time: '25分钟前', read: false },
  { id: 3, type: 'warning', title: '储能系统-南区 SOC 低于 20%，建议充电', time: '40分钟前', read: false },
  { id: 4, type: 'success', title: '调频任务 T003 已完成，收益 ¥8.6万', time: '1小时前', read: true },
  { id: 5, type: 'info', title: '电网频率波动告警：50.18Hz（阈值±0.1Hz）', time: '2小时前', read: true },
  { id: 6, type: 'success', title: '3月13日补贴结算完成，到账 ¥19.2万', time: '昨天', read: true },
];

const noticeIconMap = {
  warning: <WarningOutlined style={{ color: '#ffb800', fontSize: 16 }} />,
  info: <InfoCircleOutlined style={{ color: '#00d4ff', fontSize: 16 }} />,
  success: <CheckCircleOutlined style={{ color: '#00ff88', fontSize: 16 }} />,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notices.filter(n => !n.read).length;

  const markAllRead = () => setNotices(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) =>
    setNotices(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const userMenuItems = [
    {
      key: 'profile',
      icon: <IdcardOutlined style={{ color: '#00d4ff' }} />,
      label: <span style={{ color: '#e2e8f0' }}>个人信息</span>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: '#aab4c8' }} />,
      label: <span style={{ color: '#e2e8f0' }}>系统设置</span>,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#ff4d4d' }} />,
      label: <span style={{ color: '#ff4d4d' }}>退出登录</span>,
    },
  ];

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
            src={huitoneLogo}
            alt="Huitone Logo"
            style={{ height: collapsed ? 28 : 38, maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 'none', marginTop: 8 }}
        />

        {/* System Status Footer */}
        {!collapsed && (
          <div style={{
            position: 'absolute', bottom: 48, left: 0, right: 0,
            padding: '10px 16px',
            borderTop: '1px solid rgba(0,212,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#00ff88', boxShadow: '0 0 6px #00ff88',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ color: '#4a6080', fontSize: 11 }}>系统运行正常</span>
            </div>
            <div style={{ color: '#2d3748', fontSize: 10, marginTop: 2 }}>VPP v2.1.0 · Huitone</div>
          </div>
        )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#4a6080', fontSize: 12 }}>
              {new Date().toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            <span style={{ color: 'rgba(0,212,255,0.3)', fontSize: 12 }}>|</span>
            <span style={{ color: '#00d4ff', fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>
              {pageNames[location.pathname] || '虚拟电厂平台'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Badge count={unreadCount} size="small" offset={[2, -2]}>
              <BellOutlined
                style={{ color: '#00d4ff', fontSize: 18, cursor: 'pointer' }}
                onClick={() => setNoticeOpen(true)}
              />
            </Badge>

            <Dropdown
              menu={{
                items: userMenuItems,
                style: {
                  background: '#1a2540',
                  border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 8,
                  minWidth: 160,
                },
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size={30}
                  icon={<UserOutlined />}
                  style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)' }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>运营管理员</div>
                  <div style={{ color: '#4a6080', fontSize: 11 }}>admin@huitone.com</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 0, padding: 24, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>

      {/* Notification Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#00d4ff', fontSize: 15 }}>
              消息通知
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" style={{ marginLeft: 8 }} />
              )}
            </span>
            <span
              style={{ color: '#4a6080', fontSize: 12, cursor: 'pointer', userSelect: 'none' }}
              onClick={markAllRead}
            >
              全部已读
            </span>
          </div>
        }
        open={noticeOpen}
        onClose={() => setNoticeOpen(false)}
        width={380}
        styles={{
          body: { background: '#0d1526', padding: 0 },
          header: { background: '#0d1526', borderBottom: '1px solid rgba(0,212,255,0.12)' },
        }}
      >
        <List
          dataSource={notices}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '14px 20px',
                background: item.read ? 'transparent' : 'rgba(0,212,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => markRead(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ marginTop: 2 }}>
                    {noticeIconMap[item.type]}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: item.read ? '#6b7280' : '#e2e8f0', fontSize: 13, lineHeight: 1.4 }}>
                      {item.title}
                    </span>
                    {!item.read && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#00d4ff', flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                }
                description={
                  <span style={{ color: '#4a6080', fontSize: 11 }}>{item.time}</span>
                }
              />
            </List.Item>
          )}
        />
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
          <span style={{ color: '#4a6080', fontSize: 12 }}>仅显示最近 7 天消息</span>
        </div>
      </Drawer>
    </Layout>
  );
}

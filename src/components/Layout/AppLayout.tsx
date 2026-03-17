import { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Drawer, Avatar, Dropdown, List, Tooltip } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, ThunderboltOutlined, ApartmentOutlined, DollarOutlined,
  BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined, IdcardOutlined,
  CheckCircleOutlined, WarningOutlined, InfoCircleOutlined, LineChartOutlined,
  RocketOutlined, SafetyCertificateOutlined, BookOutlined, CalculatorOutlined,
  BulbOutlined, BulbFilled, MacCommandOutlined,
} from '@ant-design/icons';
import huitoneLogo from '/Huitone-logo.png';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { roles } from '../../mock/users';
import CommandPalette from '../CommandPalette';

const { Sider, Header, Content } = Layout;

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '监控大屏' },
  { key: '/devices', icon: <ApartmentOutlined />, label: '设备资产' },
  { key: '/demand-response', icon: <ThunderboltOutlined />, label: '需求响应' },
  { key: '/spot-market', icon: <LineChartOutlined />, label: '现货交易' },
  { key: '/smart-bidding', icon: <RocketOutlined />, label: '智能申报' },
  { key: '/compliance-control', icon: <SafetyCertificateOutlined />, label: 'AGC合规' },
  { key: '/revenue', icon: <DollarOutlined />, label: '收益结算' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/investment', icon: <CalculatorOutlined />, label: '投资测算' },
];

const pageNames: Record<string, string> = {
  '/': '实时监控大屏',
  '/devices': '设备资产管理',
  '/demand-response': '需求响应管理',
  '/spot-market': '现货市场交易策略',
  '/smart-bidding': '智能申报与收益寻优',
  '/compliance-control': '合规接入与AGC直控监控',
  '/revenue': '收益结算',
  '/knowledge': '知识库与智能问答',
  '/investment': '储能投资测算',
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, canAccess } = useAuth();
  const { mode, tone, colors: c, toggleTheme, toggleTone } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const menuItems = allMenuItems.filter(item => canAccess(item.key));
  const unreadCount = notices.filter(n => !n.read).length;

  const markAllRead = () => setNotices(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) =>
    setNotices(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const noticeIconMap = {
    warning: <WarningOutlined style={{ color: c.warning, fontSize: 16 }} />,
    info: <InfoCircleOutlined style={{ color: c.primary, fontSize: 16 }} />,
    success: <CheckCircleOutlined style={{ color: c.success, fontSize: 16 }} />,
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <IdcardOutlined style={{ color: c.primary }} />,
      label: <span style={{ color: c.textPrimary }}>个人信息</span>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined style={{ color: c.textSecondary }} />,
      label: <span style={{ color: c.textPrimary }}>系统设置</span>,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: c.danger }} />,
      label: <span style={{ color: c.danger }}>退出登录</span>,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const roleLabel = user ? roles[user.roleKey].label : '';

  return (
    <Layout style={{ minHeight: '100vh', background: c.bgPage, transition: 'background 0.25s' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: c.bgSider,
          borderRight: `1px solid ${c.primaryBorderLight}`,
          transition: 'background 0.25s',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: collapsed ? 0 : '0 16px',
          borderBottom: `1px solid ${c.primaryBorderLight}`,
        }}>
          <img
            src={huitoneLogo}
            alt="Huitone Logo"
            style={{ height: collapsed ? 28 : 38, maxWidth: '100%', objectFit: 'contain' }}
          />
        </div>

        <Menu
          theme={mode === 'dark' ? 'dark' : 'light'}
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
            borderTop: `1px solid ${c.primaryMuted}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: c.success, boxShadow: `0 0 6px ${c.success}`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ color: c.textDim, fontSize: 11 }}>系统运行正常</span>
            </div>
            <div style={{ color: c.textDim, fontSize: 10, marginTop: 2, opacity: 0.6 }}>VPP v2.1.0 · Huitone</div>
          </div>
        )}
      </Sider>

      <Layout style={{ background: c.bgPage, transition: 'background 0.25s' }}>
        <Header style={{
          background: c.bgSider,
          borderBottom: `1px solid ${c.primaryBorderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 64,
          transition: 'background 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: c.textDim, fontSize: 12 }}>
              {new Date().toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            <span style={{ color: c.primaryBorder, fontSize: 12 }}>|</span>
            <span style={{ color: c.primary, fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>
              {pageNames[location.pathname] || '虚拟电厂平台'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Command Palette Button */}
            <Tooltip title="命令面板 (Ctrl+K)">
              <div
                onClick={() => setPaletteOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 13,
                  border: `1px solid ${c.primaryBorder}`, background: c.primaryMuted,
                  cursor: 'pointer', fontSize: 11, color: c.primary, fontWeight: 600,
                  letterSpacing: 0.5, userSelect: 'none',
                }}
              >
                <MacCommandOutlined style={{ fontSize: 12 }} />
                命令面板
              </div>
            </Tooltip>

            {/* Tone Toggle */}
            <Tooltip title={tone === 'blue' ? '切换能源绿色调' : '切换科技蓝色调'}>
              <div
                onClick={toggleTone}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 13,
                  border: `1px solid ${c.primaryBorder}`,
                  background: c.primaryMuted,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontSize: 11,
                  color: c.primary,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  userSelect: 'none',
                }}
              >
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: tone === 'blue' ? '#00d4ff' : '#00e676',
                  boxShadow: `0 0 6px ${tone === 'blue' ? '#00d4ff' : '#00e676'}`,
                  transition: 'all 0.3s',
                }} />
                {tone === 'blue' ? '科技蓝' : '能源绿'}
              </div>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={mode === 'dark' ? '切换亮色模式' : '切换暗色模式'}>
              <div
                onClick={toggleTheme}
                style={{
                  width: 52,
                  height: 26,
                  borderRadius: 13,
                  background: mode === 'dark' ? 'rgba(0,212,255,0.15)' : 'rgba(22,119,255,0.12)',
                  border: `1px solid ${c.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 4px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: c.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: mode === 'light' ? 'translateX(26px)' : 'translateX(0)',
                  transition: 'transform 0.3s',
                  fontSize: 10,
                  color: mode === 'dark' ? '#0a0e1a' : '#ffffff',
                }}>
                  {mode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
                </div>
              </div>
            </Tooltip>

            <Badge count={unreadCount} size="small" offset={[2, -2]}>
              <BellOutlined
                style={{ color: c.primary, fontSize: 18, cursor: 'pointer' }}
                onClick={() => setNoticeOpen(true)}
              />
            </Badge>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
                style: {
                  background: c.bgElevated,
                  border: `1px solid ${c.primaryBorder}`,
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
                  style={{ background: c.primaryMuted, border: `1px solid ${c.primaryBorder}` }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ color: c.textPrimary, fontSize: 13, fontWeight: 500 }}>{user?.name ?? '未登录'}</div>
                  <div style={{ color: c.textDim, fontSize: 11 }}>{roleLabel}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: 0, padding: 24, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Notification Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: c.primary, fontSize: 15 }}>
              消息通知
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" style={{ marginLeft: 8 }} />
              )}
            </span>
            <span
              style={{ color: c.textDim, fontSize: 12, cursor: 'pointer', userSelect: 'none' }}
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
          body: { background: c.bgSider, padding: 0 },
          header: { background: c.bgSider, borderBottom: `1px solid ${c.primaryBorderLight}` },
        }}
      >
        <List
          dataSource={notices}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '14px 20px',
                background: item.read ? 'transparent' : c.primaryMuted,
                borderBottom: `1px solid ${c.borderSubtle}`,
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
                    <span style={{ color: item.read ? c.textMuted : c.textPrimary, fontSize: 13, lineHeight: 1.4 }}>
                      {item.title}
                    </span>
                    {!item.read && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: c.primary, flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </div>
                }
                description={
                  <span style={{ color: c.textDim, fontSize: 11 }}>{item.time}</span>
                }
              />
            </List.Item>
          )}
        />
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${c.borderSubtle}`, textAlign: 'center' }}>
          <span style={{ color: c.textDim, fontSize: 12 }}>仅显示最近 7 天消息</span>
        </div>
      </Drawer>
    </Layout>
  );
}

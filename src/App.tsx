import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DemoProvider } from './context/DemoContext';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DemandResponse from './pages/DemandResponse';
import Revenue from './pages/Revenue';
import SpotMarket from './pages/SpotMarket';
import SmartBidding from './pages/SmartBidding';
import ComplianceControl from './pages/ComplianceControl';
import KnowledgeBase from './pages/KnowledgeBase';
import InvestmentCalculator from './pages/InvestmentCalculator';
import ContractSigning from './pages/ContractSigning';
import CustomerService from './pages/CustomerService';
import AggregatorWorkbench from './pages/AggregatorWorkbench';
import AIWorkbench from './pages/AIWorkbench';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';

// Redirect to /login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Redirect to / if role lacks access to this route
function ProtectedRoute({ children, path }: { children: React.ReactNode; path: string }) {
  const { canAccess } = useAuth();
  if (!canAccess(path)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ThemedApp() {
  const { mode, tone, colors } = useTheme();

  const p = colors.primary;
  const antdTheme = mode === 'dark'
    ? {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: p,
          colorBgBase: colors.bgPage,
          colorBgContainer: colors.bgCard,
          colorBgElevated: colors.bgElevated,
          colorBorder: colors.primaryBorder,
          colorText: colors.textPrimary,
          colorTextSecondary: colors.textSecondary,
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Table: { headerBg: colors.bgSider, rowHoverBg: colors.bgElevated, borderColor: colors.primaryBorderLight },
          Menu: {
            itemSelectedBg: colors.primaryMuted,
            itemSelectedColor: p,
            itemHoverBg: `${p}08`,
          },
          Select: { optionSelectedBg: colors.primaryMuted },
        },
      }
    : {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: p,
          colorBgBase: colors.bgPage,
          colorBgContainer: colors.bgCard,
          colorBgElevated: colors.bgElevated,
          colorBorder: colors.primaryBorder,
          colorText: colors.textPrimary,
          colorTextSecondary: colors.textSecondary,
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        components: {
          Table: { headerBg: colors.bgElevated, rowHoverBg: `${p}10`, borderColor: colors.primaryBorderLight },
          Menu: {
            itemSelectedBg: colors.primaryMuted,
            itemSelectedColor: p,
            itemHoverBg: `${p}08`,
          },
          Select: { optionSelectedBg: colors.primaryMuted },
        },
      };

  void tone; // tone is consumed by ThemeContext; antd theme derives from colors

  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <HashRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* Protected — all inside AppLayout */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/devices" element={
                      <ProtectedRoute path="/devices"><Devices /></ProtectedRoute>
                    } />
                    <Route path="/demand-response" element={
                      <ProtectedRoute path="/demand-response"><DemandResponse /></ProtectedRoute>
                    } />
                    <Route path="/spot-market" element={
                      <ProtectedRoute path="/spot-market"><SpotMarket /></ProtectedRoute>
                    } />
                    <Route path="/smart-bidding" element={
                      <ProtectedRoute path="/smart-bidding"><SmartBidding /></ProtectedRoute>
                    } />
                    <Route path="/compliance-control" element={
                      <ProtectedRoute path="/compliance-control"><ComplianceControl /></ProtectedRoute>
                    } />
                    <Route path="/revenue" element={
                      <ProtectedRoute path="/revenue"><Revenue /></ProtectedRoute>
                    } />
                    <Route path="/knowledge" element={
                      <ProtectedRoute path="/knowledge"><KnowledgeBase /></ProtectedRoute>
                    } />
                    <Route path="/investment" element={
                      <ProtectedRoute path="/investment"><InvestmentCalculator /></ProtectedRoute>
                    } />
                    <Route path="/contract" element={
                      <ProtectedRoute path="/contract"><ContractSigning /></ProtectedRoute>
                    } />
                    <Route path="/customer-service" element={
                      <ProtectedRoute path="/customer-service"><CustomerService /></ProtectedRoute>
                    } />
                    <Route path="/aggregator" element={<AggregatorWorkbench />} />
                    <Route path="/ai-workbench" element={
                      <ProtectedRoute path="/ai-workbench"><AIWorkbench /></ProtectedRoute>
                    } />
                  </Routes>
                </AppLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </HashRouter>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <ThemedApp />
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

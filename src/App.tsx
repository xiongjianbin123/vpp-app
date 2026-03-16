import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import Login from './pages/Login';

const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#00d4ff',
    colorBgBase: '#0a0e1a',
    colorBgContainer: '#111827',
    colorBgElevated: '#1a2540',
    colorBorder: 'rgba(0, 212, 255, 0.2)',
    colorText: '#e2e8f0',
    colorTextSecondary: '#aab4c8',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Table: {
      headerBg: '#0d1526',
      rowHoverBg: '#1a2540',
      borderColor: 'rgba(0, 212, 255, 0.1)',
    },
    Menu: {
      itemSelectedBg: 'rgba(0, 212, 255, 0.1)',
      itemSelectedColor: '#00d4ff',
      itemHoverBg: 'rgba(0, 212, 255, 0.05)',
    },
    Select: {
      optionSelectedBg: 'rgba(0, 212, 255, 0.1)',
    },
  },
};

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

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider theme={darkTheme} locale={zhCN}>
        <HashRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

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
                    </Routes>
                  </AppLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </HashRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}

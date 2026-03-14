import { HashRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DemandResponse from './pages/DemandResponse';
import Revenue from './pages/Revenue';

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

export default function App() {
  return (
    <ConfigProvider theme={darkTheme} locale={zhCN}>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/demand-response" element={<DemandResponse />} />
            <Route path="/revenue" element={<Revenue />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ConfigProvider>
  );
}

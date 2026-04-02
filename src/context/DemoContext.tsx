import { createContext, useContext, useState } from 'react';

export type DemoView = 'overview' | 'dispatch' | 'investment' | 'aggregator' | 'enduser';
export type CustomerType = 'all' | 'grid' | 'investor' | 'aggregator' | 'enduser';

interface DemoContextType {
  currentView: DemoView;
  setCurrentView: (view: DemoView) => void;
  viewLabel: string;
  highlightRoute: string | null;
  customerType: CustomerType;
  setCustomerType: (type: CustomerType) => void;
  customerLabel: string;
}

const viewLabels: Record<DemoView, string> = {
  overview: '全局总览',
  dispatch: '电网调度',
  investment: '投资管理',
  aggregator: '聚合商',
  enduser: '用户侧',
};

const customerLabels: Record<CustomerType, string> = {
  all: '全部功能',
  grid: '广州供电局（调度侧）',
  investor: '投资控股公司',
  aggregator: '聚合商/售电公司',
  enduser: '工业园区/大用户',
};

// 视角 → 导航高亮路由映射
export const viewRouteMap: Record<DemoView, string | null> = {
  overview: null,
  dispatch: '/demand-response',
  investment: '/investment',
  aggregator: '/aggregator',
  enduser: '/customer-service',
};

// 客户类型 → 允许的导航路由（null 表示全部）
export const customerRouteFilter: Record<CustomerType, string[] | null> = {
  all: null,
  grid: ['/', '/devices', '/demand-response', '/compliance-control', '/knowledge'],
  investor: ['/', '/devices', '/spot-market', '/smart-bidding', '/investment', '/revenue', '/knowledge'],
  aggregator: ['/', '/devices', '/aggregator', '/revenue', '/customer-service', '/knowledge'],
  enduser: ['/', '/customer-service', '/investment', '/knowledge'],
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<DemoView>('overview');
  const [customerType, setCustomerType] = useState<CustomerType>('all');
  return (
    <DemoContext.Provider value={{
      currentView,
      setCurrentView,
      viewLabel: viewLabels[currentView],
      highlightRoute: viewRouteMap[currentView],
      customerType,
      setCustomerType,
      customerLabel: customerLabels[customerType],
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoView() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemoView must be used within DemoProvider');
  return context;
}

export const demoViewOptions = Object.entries(viewLabels).map(([value, label]) => ({ value, label }));
export const customerTypeOptions = Object.entries(customerLabels).map(([value, label]) => ({ value, label }));

import { createContext, useContext, useState } from 'react';

export type DemoView = 'overview' | 'dispatch' | 'investment' | 'aggregator' | 'enduser';

interface DemoContextType {
  currentView: DemoView;
  setCurrentView: (view: DemoView) => void;
  viewLabel: string;
  highlightRoute: string | null; // 联动导航高亮路由
}

const viewLabels: Record<DemoView, string> = {
  overview: '全局总览',
  dispatch: '电网调度',
  investment: '投资管理',
  aggregator: '聚合商',
  enduser: '用户侧',
};

// 视角 → 导航高亮路由映射
export const viewRouteMap: Record<DemoView, string | null> = {
  overview: null,
  dispatch: '/demand-response',
  investment: '/investment',
  aggregator: '/aggregator',
  enduser: '/customer-service',
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<DemoView>('overview');
  return (
    <DemoContext.Provider value={{
      currentView,
      setCurrentView,
      viewLabel: viewLabels[currentView],
      highlightRoute: viewRouteMap[currentView],
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

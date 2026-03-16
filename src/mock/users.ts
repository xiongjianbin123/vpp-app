export type RoleKey =
  | 'sales_gm'
  | 'sales_manager'
  | 'trading_director'
  | 'trading_manager'
  | 'ops_manager';

export interface Role {
  key: RoleKey;
  label: string;
  allowedRoutes: string[];
}

export interface MockUser {
  username: string;
  password: string;
  name: string;
  email: string;
  roleKey: RoleKey;
}

export const roles: Record<RoleKey, Role> = {
  sales_gm: {
    key: 'sales_gm',
    label: '售电总经理',
    allowedRoutes: ['/', '/devices', '/demand-response', '/spot-market', '/smart-bidding', '/compliance-control', '/revenue', '/knowledge'],
  },
  sales_manager: {
    key: 'sales_manager',
    label: '售电销售经理',
    allowedRoutes: ['/', '/devices', '/revenue', '/knowledge'],
  },
  trading_director: {
    key: 'trading_director',
    label: '电力交易总监',
    allowedRoutes: ['/', '/devices', '/demand-response', '/spot-market', '/smart-bidding', '/revenue', '/knowledge'],
  },
  trading_manager: {
    key: 'trading_manager',
    label: '电力交易经理',
    allowedRoutes: ['/', '/spot-market', '/smart-bidding', '/knowledge'],
  },
  ops_manager: {
    key: 'ops_manager',
    label: '运维经理',
    allowedRoutes: ['/', '/devices', '/demand-response', '/compliance-control', '/knowledge'],
  },
};

export const mockUsers: MockUser[] = [
  { username: 'admin',   password: 'admin123',  name: '张建国', email: 'zhang@huitone.com', roleKey: 'sales_gm' },
  { username: 'sales',   password: 'sales123',  name: '李晓梅', email: 'li@huitone.com',    roleKey: 'sales_manager' },
  { username: 'trading', password: 'trade123',  name: '王志远', email: 'wang@huitone.com',  roleKey: 'trading_director' },
  { username: 'trader',  password: 'trader123', name: '陈慧敏', email: 'chen@huitone.com',  roleKey: 'trading_manager' },
  { username: 'ops',     password: 'ops123',    name: '刘建华', email: 'liu@huitone.com',   roleKey: 'ops_manager' },
];

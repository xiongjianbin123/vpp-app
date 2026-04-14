export type RoleKey =
  | 'sales_gm'
  | 'sales_manager'
  | 'trading_director'
  | 'trading_manager'
  | 'ops_manager'
  | 'internal_admin';

export interface Role {
  key: RoleKey;
  label: string;
  allowedRoutes: string[];
}

export const roles: Record<RoleKey, Role> = {
  sales_gm: {
    key: 'sales_gm',
    label: '售电总经理',
    allowedRoutes: ['/', '/devices', '/demand-response', '/spot-market', '/smart-bidding', '/compliance-control', '/revenue', '/knowledge', '/investment', '/contract', '/customer-service'],
  },
  sales_manager: {
    key: 'sales_manager',
    label: '售电销售经理',
    allowedRoutes: ['/', '/devices', '/revenue', '/knowledge', '/investment', '/contract', '/customer-service'],
  },
  trading_director: {
    key: 'trading_director',
    label: '电力交易总监',
    allowedRoutes: ['/', '/devices', '/demand-response', '/spot-market', '/smart-bidding', '/revenue', '/knowledge', '/investment', '/contract'],
  },
  trading_manager: {
    key: 'trading_manager',
    label: '电力交易经理',
    allowedRoutes: ['/', '/spot-market', '/smart-bidding', '/knowledge', '/investment'],
  },
  ops_manager: {
    key: 'ops_manager',
    label: '运维经理',
    allowedRoutes: ['/', '/devices', '/demand-response', '/compliance-control', '/knowledge', '/investment', '/customer-service'],
  },
  internal_admin: {
    key: 'internal_admin',
    label: '内部管理员',
    allowedRoutes: ['/', '/devices', '/demand-response', '/spot-market', '/smart-bidding', '/compliance-control', '/revenue', '/knowledge', '/investment', '/contract', '/customer-service', '/ai-workbench'],
  },
};

export function getRoleOrDefault(key: string): Role {
  return roles[key as RoleKey] ?? roles['sales_manager'];
}

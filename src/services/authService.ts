import { mockUsers, roles } from '../mock/users';

export interface UserInfo {
  username: string;
  name: string;
  email: string;
  roleKey: string;
  roleLabel: string;
  allowedRoutes: string[];
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const found = mockUsers.find(u => u.username === username && u.password === password);
  if (!found) throw new Error('用户名或密码错误');
  const role = roles[found.roleKey];
  const user: UserInfo = {
    username: found.username,
    name: found.name,
    email: found.email,
    roleKey: found.roleKey,
    roleLabel: role.label,
    allowedRoutes: role.allowedRoutes,
  };
  return { token: `mock-token-${username}`, user };
}

export async function getMe(): Promise<UserInfo> {
  const stored = localStorage.getItem('vpp_auth_user');
  if (!stored) throw new Error('未登录');
  return JSON.parse(stored) as UserInfo;
}

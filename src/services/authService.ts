import api from './api';

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
  const res = await api.post<{ success: boolean; data: LoginResponse; message: string }>(
    '/auth/login',
    { username, password }
  );
  if (!res.data.success) throw new Error(res.data.message || '登录失败');
  return res.data.data;
}

export async function getMe(): Promise<UserInfo> {
  const res = await api.get<{ success: boolean; data: UserInfo }>('/auth/me');
  return res.data.data;
}

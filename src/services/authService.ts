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
  const res = await api.post<LoginResponse>('/auth/login', { username, password });
  return res.data;
}

export async function getMe(): Promise<UserInfo> {
  const res = await api.get<UserInfo>('/auth/me');
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/** URL to start GitHub OAuth flow — opens server-side redirect */
export function getGitHubOAuthUrl(): string {
  return '/api/auth/github';
}

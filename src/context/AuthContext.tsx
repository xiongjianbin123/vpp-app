import { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';
import type { UserInfo } from '../services/authService';
import { mockUsers, roles } from '../mock/users';

export type { UserInfo as AuthUser };

interface AuthContextValue {
  user: UserInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string, user: UserInfo) => void;
  logout: () => void;
  canAccess: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
  loginWithToken: () => {},
  logout: () => {},
  canAccess: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    try {
      const stored = localStorage.getItem('vpp_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { token, user: userInfo } = await authService.login(username, password);
      localStorage.setItem('vpp_token', token);
      localStorage.setItem('vpp_auth_user', JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch {
      // 后端不可用时使用mock用户数据登录
      const found = mockUsers.find(u => u.username === username && u.password === password);
      if (!found) return false;
      const role = roles[found.roleKey];
      const userInfo: UserInfo = {
        username: found.username,
        name: found.name,
        email: found.email,
        roleKey: found.roleKey,
        roleLabel: role.label,
        allowedRoutes: role.allowedRoutes,
      };
      localStorage.setItem('vpp_token', 'mock_token_' + found.username);
      localStorage.setItem('vpp_auth_user', JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    }
  };

  const loginWithToken = (token: string, userInfo: UserInfo) => {
    localStorage.setItem('vpp_token', token);
    localStorage.setItem('vpp_auth_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem('vpp_token');
    localStorage.removeItem('vpp_auth_user');
    setUser(null);
  };

  const canAccess = (route: string): boolean => {
    if (!user) return false;
    if (route === '/aggregator') return true; // 聚合商工作台对所有角色开放
    return user.allowedRoutes.includes(route);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

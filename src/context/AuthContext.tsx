import { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';
import type { UserInfo } from '../services/authService';

export type { UserInfo as AuthUser };

interface AuthContextValue {
  user: UserInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  canAccess: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => false,
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
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('vpp_token');
    localStorage.removeItem('vpp_auth_user');
    setUser(null);
  };

  const canAccess = (route: string): boolean => {
    if (!user) return false;
    return user.allowedRoutes.includes(route);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

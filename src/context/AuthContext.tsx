import { createContext, useContext, useState } from 'react';
import { mockUsers, roles } from '../mock/users';
import type { RoleKey } from '../mock/users';

export interface AuthUser {
  username: string;
  name: string;
  email: string;
  roleKey: RoleKey;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  canAccess: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => false,
  logout: () => {},
  canAccess: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('vpp_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (username: string, password: string): boolean => {
    const found = mockUsers.find(u => u.username === username && u.password === password);
    if (!found) return false;
    const authUser: AuthUser = {
      username: found.username,
      name: found.name,
      email: found.email,
      roleKey: found.roleKey,
    };
    localStorage.setItem('vpp_auth_user', JSON.stringify(authUser));
    setUser(authUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('vpp_auth_user');
    setUser(null);
  };

  const canAccess = (route: string): boolean => {
    if (!user) return false;
    return roles[user.roleKey].allowedRoutes.includes(route);
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

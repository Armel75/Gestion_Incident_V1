import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, registerAuthFailureHandler } from '../../../services/api';
import { User } from '../../../types';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type MeUser = {
  id: number | string;
  username: string;
  role?: string;
  roles?: Array<string | { id?: number; name: string }>;
  isActive?: boolean;
  siteId?: number | null;
  site?: { id: number; name: string } | null;
  createdAt?: string;
  permissions?: string[];
};

const normalizeAuthUser = (me: MeUser): User => {
  const normalizedRoles =
    Array.isArray(me.roles) && me.roles.length > 0
      ? me.roles.map((role, index) =>
          typeof role === 'string'
            ? { id: index, name: role }
            : { id: role.id ?? index, name: role.name }
        )
      : me.role
        ? [{ id: 0, name: me.role }]
        : [];

  return {
    id: Number(me.id),
    username: me.username,
    isActive: me.isActive ?? true,
    permissions: me.permissions,
    roles: normalizedRoles,
    siteId: me.siteId ?? null,
    site: me.site ?? null,
    createdAt: me.createdAt ?? new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    registerAuthFailureHandler(() => {
      setUser(null);

      if (window.location.pathname !== '/incident/login') {
        window.location.replace('/incident/login');
      }
    });

    let isMounted = true;

    const loadMe = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken && !refreshToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const me = (await api.me()) as MeUser;
        if (isMounted) {
          setUser(normalizeAuthUser(me));
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMe();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = () => {
    void api.logout().finally(() => {
      setUser(null);
    });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

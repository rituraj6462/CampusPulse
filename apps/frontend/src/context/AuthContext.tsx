import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserWithInterests, LoginUserInput, RegisterUserInput, Role, NotificationItem } from '@campuspulse/shared';

interface AuthContextType {
  user: UserWithInterests | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginUserInput) => Promise<void>;
  register: (input: RegisterUserInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithInterests | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get<{ success: boolean; data: UserWithInterests }>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('campuspulse-token');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get<{ success: boolean; data: NotificationItem[] }>('/notifications');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  const login = async (input: LoginUserInput) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: UserWithInterests; token: string } }>(
        '/auth/login',
        input
      );
      if (res.success) {
        localStorage.setItem('campuspulse-token', res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterUserInput) => {
    setIsLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { user: UserWithInterests; token: string } }>(
        '/auth/register',
        input
      );
      if (res.success) {
        localStorage.setItem('campuspulse-token', res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('campuspulse-token');
    setUser(null);
    setNotifications([]);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        notifications,
        unreadCount,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
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

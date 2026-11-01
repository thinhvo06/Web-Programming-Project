import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { INITIAL_USER } from '../services/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('noteapp_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    return INITIAL_USER;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('noteapp_token') || 'mock-token-session';
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('noteapp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('noteapp_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('noteapp_token', token);
    } else {
      localStorage.removeItem('noteapp_token');
    }
  }, [token]);

  // Tiêu chí 1: Đăng ký tài khoản (tự động đăng nhập sau khi đăng ký thành công)
  const register = async ({ email, displayName, password }) => {
    setIsLoading(true);
    try {
      const data = await api.register({ email, displayName, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Tiêu chí 3: Đăng nhập
  const login = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Tiêu chí 3: Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('noteapp_user');
    localStorage.removeItem('noteapp_token');
  };

  // Tiêu chí 2: Kích hoạt tài khoản
  const activateAccount = async () => {
    setIsLoading(true);
    try {
      await api.activateAccount('sample-token');
      setUser((prev) => (prev ? { ...prev, isActivated: true } : null));
    } finally {
      setIsLoading(false);
    }
  };

  // Tiêu chí 6: Cập nhật thông tin cá nhân và avatar
  const updateProfile = async ({ displayName, avatar, avatarFile }) => {
    if (!user) return;
    const res = await api.updateProfile(user.id, { displayName, avatar, avatarFile });
    const newName = res?.user?.display_name || displayName;
    const newAvatar = res?.user?.avatar_url || avatar || user.avatar;
    const updated = { ...user, displayName: newName, avatar: newAvatar };
    setUser(updated);
    localStorage.setItem('noteapp_user', JSON.stringify(updated));
    return res;
  };

  // Tiêu chí 7: Đổi mật khẩu
  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return;
    return await api.changePassword(user.id, { currentPassword, newPassword });
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
        activateAccount,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

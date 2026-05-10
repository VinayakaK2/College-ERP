import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authApi.getMe()
        .then((res) => {
          if (res.success) setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    return res.data;
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const res = await authApi.verifyOtp(email, otp);
    if (res.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const parentLogin = useCallback(async (studentId, phone) => {
    const res = await authApi.parentLogin(studentId, phone);
    return res.data;
  }, []);

  const parentVerifyOtp = useCallback(async (studentId, phone, otp) => {
    const res = await authApi.parentVerifyOtp(studentId, phone, otp);
    if (res.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    authApi.logout().catch(() => {});
  }, []);

  const value = {
    user,
    loading,
    login,
    verifyOtp,
    parentLogin,
    parentVerifyOtp,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER',
    isParent: user?.role === 'PARENT' || user?.isParent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

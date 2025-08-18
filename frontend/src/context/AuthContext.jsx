// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 쿠키 기반 인증 상태 확인
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.checkAuth();
      setAuthenticated(response.data.authenticated);
    } catch (error) {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginId, password) => {
    try {
      const credentials = { loginId, password };
      const response = await authAPI.login(credentials);
      
      // 로그인 성공 시 쿠키가 자동으로 설정됨
      setAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: typeof error.response?.data === 'string' 
          ? error.response.data 
          : error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (registerData) => {
    try {
      const response = await userAPI.register(registerData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: typeof error.response?.data === 'string' 
          ? error.response.data 
          : error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await authAPI.verifyCode(email, code);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: typeof error.response?.data === 'string' 
          ? error.response.data 
          : error.response?.data?.error || 'Verification failed' 
      };
    }
  };

  const checkEmail = async (email) => {
    try {
      const response = await authAPI.checkEmail(email);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: typeof error.response?.data === 'string' 
          ? error.response.data 
          : error.response?.data?.error || 'Check failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 프론트엔드에서는 로그아웃 처리
      setAuthenticated(false);
    }
  };

  const isAuthenticated = () => {
    return authenticated;
  };

  const value = {
    authenticated,
    login,
    register,
    verifyEmail,
    checkEmail,
    logout,
    isAuthenticated,
    loading,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
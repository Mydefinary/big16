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
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const attemptTokenRefresh = async (refreshTokenValue) => {
    try {
      const response = await authAPI.refreshToken(refreshTokenValue);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    
    if (savedToken) {
      // 토큰 유효성 간단 검증
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp > now) {
          setToken(savedToken);
        } else {
          // 토큰이 만료된 경우 자동으로 갱신 시도
          if (savedRefreshToken) {
            attemptTokenRefresh(savedRefreshToken);
          } else {
            localStorage.removeItem('accessToken');
          }
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
      }
    }
    
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    try {
      const credentials = { loginId, password };
      const response = await authAPI.login(credentials);
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      setToken(accessToken);
      setRefreshToken(newRefreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

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
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    token,
    refreshToken,
    login,
    register,
    verifyEmail,
    checkEmail,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
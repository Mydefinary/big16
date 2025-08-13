// frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

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

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    
    setLoading(false);
  }, []);

  const login = async (loginId, password) => {
    try {
      const response = await authAPI.login(loginId, password);
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
      const response = await authAPI.register(registerData);
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
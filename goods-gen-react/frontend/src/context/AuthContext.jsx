import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
      // 토큰 유효성 간단 검증
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp > now) {
          setToken(savedToken);
        } else {
          localStorage.removeItem('accessToken');
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

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    token,
    refreshToken,
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
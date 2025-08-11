import React, { createContext, useState, useContext, useEffect } from 'react';

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

  // 토큰 유효성 검사 함수
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    // 앱 시작시 localStorage에서 토큰 확인
    const savedToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    
    // 토큰이 있고 유효한 경우에만 상태에 설정
    if (savedToken && isTokenValid(savedToken)) {
      setToken(savedToken);
      if (savedRefreshToken) {
        setRefreshToken(savedRefreshToken);
      }
    } else {
      // 유효하지 않은 토큰은 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    setLoading(false);
  }, []);

  const login = (accessToken, refreshTokenValue) => {
    // 새 토큰의 유효성 검사
    if (!isTokenValid(accessToken)) {
      console.error('Trying to login with invalid token');
      return false;
    }

    setToken(accessToken);
    setRefreshToken(refreshTokenValue);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshTokenValue);
    return true;
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // 토큰 업데이트 함수 (리프레시 시 사용)
  const updateTokens = (newAccessToken, newRefreshToken) => {
    if (!isTokenValid(newAccessToken)) {
      console.error('Trying to update with invalid token');
      logout();
      return false;
    }

    setToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    return true;
  };

  const isAuthenticated = () => {
    return token && isTokenValid(token);
  };

  const value = {
    token,
    refreshToken,
    login,
    logout,
    updateTokens,
    isAuthenticated,
    isTokenValid,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
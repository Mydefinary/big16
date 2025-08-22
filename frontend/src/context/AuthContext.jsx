// /src/context/AuthContext.jsx

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // 🎯 쿠키 기반 인증 체크 함수
  const checkAuthentication = async () => {
    try {
      console.log('🔍 인증 상태 확인 중...');
      
      // 서버의 /auths/me API 호출 (쿠키의 accessToken으로 인증)
      const response = await authAPI.me();
      
      setIsLoggedIn(true);
      setUserInfo(response.data);
      
      return true;
    } catch (error) {
      console.log('❌ 인증 확인 실패:', error.response?.status);
      setIsLoggedIn(false);
      setUserInfo(null);
      
      return false;
    }
  };

  // 🎯 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthentication();
      setLoading(false);
    };

    initializeAuth();

    // 🎯 커스텀 이벤트 리스너 등록 (토큰 갱신/만료 시 사용)
    const handleTokenRefreshed = () => {
      console.log('🔄 토큰 갱신됨 - 인증 상태 재확인');
      checkAuthentication();
    };

    const handleAuthRequired = () => {
      console.log('🚪 로그인 필요 - 로그아웃 처리');
      setIsLoggedIn(false);
      setUserInfo(null);
    };

    window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('authRequired', handleAuthRequired);

    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('authRequired', handleAuthRequired);
    };
  }, []);

  // 🎯 로그인 함수 (쿠키는 서버에서 자동 설정됨)
  const login = async (credentials) => {
    try {
      console.log('🔐 로그인 시도...');
      
      const response = await authAPI.login(credentials);
      
      console.log('✅ 로그인 성공:', response.data);
      
      // 쿠키는 서버에서 자동으로 설정되므로 인증 상태만 업데이트
      setIsLoggedIn(true);
      
      // 사용자 정보 새로 가져오기
      await checkAuthentication();
      
      return true;
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      setIsLoggedIn(false);
      setUserInfo(null);
      throw error;
    }
  };

  // 🎯 로그아웃 함수
  const logout = async () => {
    try {
      console.log('🚪 로그아웃 시도...');
      
      await authAPI.logout();
      
      console.log('✅ 로그아웃 성공');
    } catch (error) {
      console.error('❌ 로그아웃 API 오류 (쿠키는 제거됨):', error);
    } finally {
      // API 성공/실패와 관계없이 로컬 상태는 초기화
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };

  // 🎯 인증 상태 확인 함수 (단순한 boolean 반환)
  const isAuthenticated = () => {
    return isLoggedIn;
  };

  // 🎯 사용자 정보 새로고침
  const refreshUserInfo = async () => {
    if (isLoggedIn) {
      await checkAuthentication();
    }
  };

  const value = {
    // 상태
    isLoggedIn,
    loading,
    userInfo,
    
    // 함수들
    login,
    logout,
    isAuthenticated,
    checkAuthentication,
    refreshUserInfo,
    
    // 레거시 지원 (기존 코드와의 호환성)
    token: isLoggedIn ? 'cookie-based' : null,
    refreshToken: isLoggedIn ? 'cookie-based' : null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
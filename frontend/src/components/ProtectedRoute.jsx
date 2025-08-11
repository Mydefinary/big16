// /src/components/ProtectedRoute.jsx

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, checkAuthentication } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const performAuthCheck = async () => {
      // AuthContext 로딩이 완료될 때까지 대기
      if (loading) {
        return;
      }

      console.log('🔒 ProtectedRoute: 인증 확인 시작');

      // 이미 인증된 경우
      if (isAuthenticated()) {
        console.log('✅ ProtectedRoute: 이미 인증됨');
        setIsChecking(false);
        return;
      }

      console.log('🔄 ProtectedRoute: 쿠키 기반 인증 재확인 시도');
      
      // 쿠키 기반 인증 재확인 시도
      const authResult = await checkAuthentication();
      
      if (authResult) {
        console.log('✅ ProtectedRoute: 쿠키 인증 성공');
      } else {
        console.log('❌ ProtectedRoute: 인증 실패 - 로그인 페이지로 리다이렉트');
      }
      
      setIsChecking(false);
    };

    performAuthCheck();
  }, [loading, isAuthenticated, checkAuthentication]);

  // AuthContext가 아직 로딩 중이거나 인증 확인 중인 경우
  if (loading || isChecking) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        로딩 중...
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated()) {
    console.log('🚫 ProtectedRoute: 미인증 사용자 - 로그인 페이지로 리다이렉트');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증된 경우 컴포넌트 렌더링
  console.log('🎯 ProtectedRoute: 인증 완료 - 컴포넌트 렌더링');
  return children;
};

export default ProtectedRoute;
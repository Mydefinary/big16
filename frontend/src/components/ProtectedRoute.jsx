import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, refreshAccessToken } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      // AuthContext 로딩이 완료될 때까지 대기
      if (loading) {
        return;
      }

      // 인증되지 않은 경우 토큰 갱신 시도
      if (!isAuthenticated()) {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('Attempting to refresh token in ProtectedRoute');
          const refreshSuccess = await refreshAccessToken();
          
          if (!refreshSuccess) {
            console.log('Token refresh failed, redirecting to login');
          }
        }
      }
      
      setIsChecking(false);
    };

    checkAuthentication();
  }, [loading, isAuthenticated, refreshAccessToken]);

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
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증된 경우 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;
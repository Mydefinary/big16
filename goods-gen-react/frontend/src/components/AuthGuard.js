// /src/components/AuthGuard.js
import React, { useEffect, useState } from 'react';

const AuthGuard = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // 쿠키에서 값 읽는 함수
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  useEffect(() => {
    const checkAuth = () => {
      // 쿠키에서 accessToken 확인
      const accessToken = getCookie('accessToken');
      
      if (!accessToken) {
        // 토큰이 없으면 본서버 로그인 페이지로 리다이렉트
        console.log('❌ 인증 토큰이 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/login';
        return;
      }

      console.log('✅ 인증 토큰 확인됨');
      setIsAuthorized(true);
      setLoading(false);
    };

    checkAuth();
  }, []);

  // 로딩 화면
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '10px' 
          }}>
            🔐 인증 확인 중...
          </div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // 인증 실패 화면 (실제로는 리다이렉트되므로 보이지 않을 것)
  if (!isAuthorized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px' }}>
            🔒 로그인이 필요합니다
          </div>
        </div>
      </div>
    );
  }

  // 인증 성공 - 헤더와 함께 자식 컴포넌트 렌더링
  return (
    <div>
      {/* 본서버의 Header를 iframe으로 포함 (같은 도메인이므로 쿠키 자동 공유) */}
      <iframe 
        src="/api/header-component"
        width="100%" 
        height="80" 
        frameBorder="0"
        style={{ 
          border: 'none', 
          display: 'block',
          backgroundColor: '#fff'
        }}
        title="Navigation Header"
      />
      
      {/* 자식 컴포넌트 (기존 웹툰 대시보드) */}
      {children}
    </div>
  );
};

export default AuthGuard;
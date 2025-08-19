import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, token, refreshToken, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 로컬 스토리지 정리 및 로그인 페이지로 이동
      logout();
      window.location.href = `${window.location.origin}/login`;
      alert('로그아웃이 완료되었습니다.');
    } catch (error) {
      console.error('Logout error:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // JWT 토큰과 함께 외부 서비스로 이동하는 함수
  const handleServiceNavigation = (servicePath) => {
    // 임시로 JWT 체크 비활성화 - 직접 서비스 접근 허용
    window.location.href = `${window.location.origin}${servicePath}`;
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* 로고/서비스명 */}
        <div className="header-logo">
          <button onClick={() => handleServiceNavigation('/')} className="logo-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 700, color: '#22c55e', textDecoration: 'none', transition: 'color 0.2s ease'}}>
            ToonConnect
          </button>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <button
                onClick={() => handleServiceNavigation('/ppl-gen')}
                className="nav-link nav-button"
              >
                작품 질의하기
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => handleServiceNavigation('/webtoon-hl')}
                className="nav-link nav-button"
              >
                하이라이트 제작
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => handleServiceNavigation('/webtoon-dashboard')}
                className="nav-link nav-button"
              >
                웹툰 상세 분석
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => handleServiceNavigation('/goods-gen')}
                className="nav-link nav-button active"
              >
                광고 초안 생성
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={() => handleServiceNavigation('/board')}
                className="nav-link nav-button"
              >
                광고 파트너십 문의
              </button>
            </li>
          </ul>
        </nav>

        {/* 우측 버튼들 */}
        <div className="header-actions">
          <a href={`${window.location.origin}/register`} className="header-btn signup-btn">
            Sign Up
          </a>
          <a href={`${window.location.origin}/login`} className="header-btn signin-btn">
            Sign In
          </a>
          <a href={`${window.location.origin}/faq`} className="header-btn faq-btn">
            FAQ
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
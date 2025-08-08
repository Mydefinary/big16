import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // 현재 경로가 활성 상태인지 확인하는 함수
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/login' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* 로고/서비스명 */}
        <div className="header-logo">
          <Link to="/" className="logo-link">
            ToonConnect
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to="/question" 
                className={`nav-link ${isActive('/question') ? 'active' : ''}`}
              >
                작품 질의하기
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/characters" 
                className={`nav-link ${isActive('/characters') ? 'active' : ''}`}
              >
                하이라이트 제작
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/gallery" 
                className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}
              >
                웹툰 상세 분석
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/community" 
                className={`nav-link ${isActive('/community') ? 'active' : ''}`}
              >
                광고 초안 생성
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                to="/board" 
                className={`nav-link ${isActive('/board') ? 'active' : ''}`}
              >
                광고 파트너십 문의
              </Link>
            </li>
          </ul>
        </nav>

        {/* 우측 버튼들 */}
        <div className="header-actions">
          {!isAuthenticated() ? (
            <>
              <Link to="/register" className="header-btn signup-btn">
                Sign Up
              </Link>
              <Link to="/login" className="header-btn signin-btn">
                Sign In
              </Link>
              <Link to="/faq" className="header-btn faq-btn">
                FAQ
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="header-btn dashboard-btn">
                Dashboard
              </Link>
              <Link to="/faq" className="header-btn faq-btn">
                FAQ
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

/* Header CSS를 App.css에 추가해주세요 */
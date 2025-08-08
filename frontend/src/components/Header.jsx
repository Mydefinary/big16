import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Header = () => {
  const { isAuthenticated, token, refreshToken, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 서버에 로그아웃 요청
      await authAPI.logout(refreshToken);
      toast.success('로그아웃이 완료되었습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 처리 중 오류가 발생했습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      // 로컬 스토리지 정리 및 로그인 페이지로 이동
      logout();
      navigate('/login');
      setLoading(false);
    }
  };

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
              <Link to="/mypage" className="header-btn mypage-btn">
                MyPage
              </Link>
              <button
                onClick={handleLogout}
                className="header-btn logout-btn"
                disabled={loading}
              >
                {loading ? '로그아웃 중...' : 'Logout'}
              </button>
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
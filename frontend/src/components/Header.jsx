// /src/components/Header.jsx

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Header = () => {
  const { isAuthenticated, logout, userInfo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      console.log('🚪 로그아웃 시도 중...');
      
      // 🎯 AuthContext의 logout 함수 호출 (쿠키 기반)
      await logout();
      
      console.log('✅ 로그아웃 완료');
      
      toast.success('로그아웃이 완료되었습니다.', {
        position: "top-right",
        autoClose: 3000,
      });

      // 로그인 페이지로 이동
      navigate('/login');
      
    } catch (error) {
      console.error('❌ 로그아웃 오류:', error);
      
      // 오류가 발생해도 사용자에게는 성공으로 처리
      // (쿠키는 서버에서 제거되었을 가능성이 높음)
      toast.success('로그아웃이 완료되었습니다.', {
        position: "top-right",
        autoClose: 3000,
      });
      
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const goToChatBot = () => {
      // 외부 이동이 아니라 내부 라우팅으로 변경
      navigate('/chat-bot');
      
      console.log('🤖 AI 챗봇 페이지로 이동 (내부 임베딩)');
    };

  // 웹툰 대시보드로 이동하는 함수 (같은 탭에서 이동)
  const goToWebtoonDashboard = () => {
    // 외부 이동이 아니라 내부 라우팅으로 변경
    navigate('/webtoon-dashboard');
    
    console.log('🎯 웹툰 대시보드 페이지로 이동 (내부 임베딩)');
  };

  const goToWebtoonHighlightCreate = () => {
    // 외부 이동이 아니라 내부 라우팅으로 변경
    navigate('/webtoon-highlight-creator');
    
    console.log('🎨 웹툰 하이라이트 제작 페이지로 이동 (내부 임베딩)');
  };

  // PPL 생성기로 이동하는 함수
  const goToPPLGenerator = () => {
    navigate('/webtoon-ppl-generator');
    
    console.log('🎬 PPL 생성기 페이지로 이동 (내부 임베딩)');
  };

  // 굿즈 생성기로 이동하는 함수
  const goToGoodsGenerator = () => {
    navigate('/webtoon-goods-generator');
    
    console.log('🛍️ 굿즈 생성기 페이지로 이동 (내부 임베딩)');
  };

  const goToNoticeBoard = () => {
    navigate('/notice-board');
    
    console.log('📝 자유게시판 페이지로 이동 (내부 임베딩)');
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
              <button
                onClick={goToChatBot}
                className={`nav-link chat-bot-link ${isActive('/question') ? 'active' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                🤖 AI 챗봇
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={goToWebtoonHighlightCreate}
                className={`nav-link highlight-creator-link ${isActive('webtoon-highlight-creator') ? 'active' : ''}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                🎨 하이라이트 제작
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={goToPPLGenerator}
                className={`nav-link ppl-generator-link ${isActive('webtoon-ppl-generator') ? 'active' : ''}`}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                🎬 광고 생성기
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={goToGoodsGenerator}
                className={`nav-link goods-generator-link ${isActive('/webtoon-goods-generator') ? 'active' : ''}`}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                🛍️ 굿즈 생성기
              </button>
            </li>
            {/* 🆕 웹툰 대시보드 링크 추가 */}
            <li className="nav-item">
              <button
                onClick={goToWebtoonDashboard}
                className={`nav-link webtoon-dashboard-link ${isActive('/webtoon-dashboard') ? 'active' : ''}`}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                📊 웹툰 대시보드
              </button>
            </li>
            <li className="nav-item">
              <button
                onClick={goToNoticeBoard}
                className={`nav-link notice-board-link ${isActive('/notice-board') ? 'active' : ''}`}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  color: 'inherit',
                  textDecoration: 'none',
                  padding: 0,
                  font: 'inherit'
                }}
              >
                📝 자유게시판
              </button>
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
                메인화면
              </Link>
              <Link to="/mypage" className="header-btn mypage-btn">
                MyPage
                {/* 사용자 정보가 있으면 표시
                {userInfo?.userId && (
                  <span className="user-indicator">
                    ({userInfo.userId})
                  </span>
                )} */}
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
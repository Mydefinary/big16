import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 로그인한 유저 정보 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await authAPI.me(); // 서버에서 쿠키 인증 후 유저 정보 반환
        setUserInfo(res.data);
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.', {
          position: "top-right",
          autoClose: 5000,
        });
        logout();
        navigate('/login');
      }
    };
    fetchUserInfo();
  }, [logout, navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout(); // 서버에서 쿠키 삭제
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
      logout();
      navigate('/login');
      setLoading(false);
    }
  };

  // 서비스 이동 함수들
  const goToChatBot = () => {
    navigate('/chat-bot');
    toast.info('AI 챗봇으로 이동합니다', { autoClose: 2000 });
  };

  const goToHighlightCreator = () => {
    navigate('/webtoon-highlight-creator');
    toast.info('하이라이트 제작으로 이동합니다', { autoClose: 2000 });
  };

  const goToPPLGenerator = () => {
    navigate('/webtoon-ppl-generator');
    toast.info('광고 생성기로 이동합니다', { autoClose: 2000 });
  };

  const goToGoodsGenerator = () => {
    navigate('/webtoon-goods-generator');
    toast.info('굿즈 생성기로 이동합니다', { autoClose: 2000 });
  };

  const goToWebtoonDashboard = () => {
    navigate('/webtoon-dashboard');
    toast.info('웹툰 대시보드로 이동합니다', { autoClose: 2000 });
  };

  const goToNoticeBoard = () => {
    navigate('/notice-board');
    toast.info('자유게시판으로 이동합니다', { autoClose: 2000 });
  };

  if (!userInfo) {
    return (
      <div className="loading">
        <div className="loading-spinner">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-main-container">
      {/* 웰컴 섹션 */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-icon">🎉</div>
          <h1 className="welcome-title">환영합니다!</h1>
          <p className="welcome-message">
            <span className="username">{userInfo.username}</span>님, ToonConnect에 오신 것을 환영합니다!
          </p>
          <div className="user-badge">
            <span className="badge-icon">👤</span>
            <span className="badge-text">{userInfo.userId}</span>
          </div>
        </div>
      </div>

      {/* 서비스 그리드 */}
      <div className="services-section">
        <h2 className="services-title">🚀 서비스 이용하기</h2>
        <p className="services-subtitle">원하는 서비스를 선택해보세요</p>
        
        <div className="services-grid">
          {/* AI 챗봇 */}
          <div className="service-card" onClick={goToChatBot}>
            <div className="service-icon">🤖</div>
            <h3 className="service-title">AI 챗봇</h3>
            <p className="service-description">
              AI 기술을 활용한 스마트 챗봇 시스템으로 궁금한 것들을 물어보세요
            </p>
            <div className="service-status available">이용 가능</div>
          </div>

          {/* 하이라이트 제작 */}
          <div className="service-card" onClick={goToHighlightCreator}>
            <div className="service-icon">🎨</div>
            <h3 className="service-title">하이라이트 제작</h3>
            <p className="service-description">
              웹툰의 하이라이트 장면을 AI로 자동 생성하고 편집할 수 있습니다
            </p>
            <div className="service-status available">이용 가능</div>
          </div>

          {/* 광고 생성기 */}
          <div className="service-card" onClick={goToPPLGenerator}>
            <div className="service-icon">🎬</div>
            <h3 className="service-title">광고 생성기</h3>
            <p className="service-description">
              창의적인 광고 소재를 자동으로 생성하는 고급 기능입니다
            </p>
            <div className="service-status available">이용 가능</div>
          </div>

          {/* 굿즈 생성기 */}
          <div className="service-card" onClick={goToGoodsGenerator}>
            <div className="service-icon">🛍️</div>
            <h3 className="service-title">굿즈 생성기</h3>
            <p className="service-description">
              웹툰 캐릭터를 활용한 다양한 굿즈 디자인을 생성합니다
            </p>
            <div className="service-status available">이용 가능</div>
          </div>

          {/* 웹툰 대시보드 */}
          <div className="service-card" onClick={goToWebtoonDashboard}>
            <div className="service-icon">📊</div>
            <h3 className="service-title">웹툰 대시보드</h3>
            <p className="service-description">
              웹툰 관련 데이터와 분석 정보를 한눈에 확인할 수 있습니다
            </p>
            <div className="service-status available">이용 가능</div>
          </div>

          {/* 자유게시판 */}
          <div className="service-card" onClick={goToNoticeBoard}>
            <div className="service-icon">📝</div>
            <h3 className="service-title">자유게시판</h3>
            <p className="service-description">
              다른 사용자들과 자유롭게 소통하고 정보를 공유해보세요
            </p>
            <div className="service-status available">이용 가능</div>
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="quick-actions-section">
        <h3 className="quick-actions-title">⚡ 빠른 액션</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn mypage"
            onClick={() => navigate('/mypage')}
          >
            <span className="quick-icon">👤</span>
            <span>마이페이지</span>
          </button>
          <button 
            className="quick-action-btn faq"
            onClick={() => navigate('/faq')}
          >
            <span className="quick-icon">❓</span>
            <span>FAQ</span>
          </button>
          <button 
            className="quick-action-btn logout"
            onClick={handleLogout}
            disabled={loading}
          >
            <span className="quick-icon">🚪</span>
            <span>{loading ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      </div>

      {/* 사용자 정보 */}
      <div className="user-info-section">
        <h3>📋 계정 정보</h3>
        <div className="user-info-grid">
          <div className="info-item">
            <span className="info-label">이메일</span>
            <span className="info-value">{userInfo.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">가입일</span>
            <span className="info-value">
              {new Date(userInfo.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Dashboard;
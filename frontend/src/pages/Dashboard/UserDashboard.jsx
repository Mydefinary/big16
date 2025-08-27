import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { maskEmail, maskName, maskUserId } from '../../services/maskingUtils';

const UserDashboard = ({ userInfo }) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authAPI.logout();
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

  const toggleInfoVisibility = () => {
    setShowFullInfo(!showFullInfo);
    toast.info(showFullInfo ? '정보가 마스킹되었습니다' : '정보가 표시되었습니다', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // 일반 사용자 서비스 이동 함수
  const goToChatBot = () => {
    navigate('/chat-bot');
    toast.info('AI 챗봇으로 이동합니다', { autoClose: 2000 });
  };

  const goToWebtoonDashboard = () => {
    navigate('/webtoon-dashboard');
    toast.info('웹툰 대시보드로 이동합니다', { autoClose: 2000 });
  };

  const goToNoticeBoard = () => {
    navigate('/notice-board');
    toast.info('자유게시판으로 이동합니다', { autoClose: 2000 });
  };

  return (
    <div className="dashboard-main-container">
      {/* 웰컴 섹션 */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-icon">🎉</div>
          <h1 className="welcome-title">환영합니다!</h1>
          <p className="welcome-message">
            <span className="username">
              {showFullInfo ? userInfo.nickName : maskName(userInfo.nickName)}
            </span>님, ToonConnect에 오신 것을 환영합니다!
          </p>
          <div className="user-badge">
            <span className="badge-icon">👤</span>
            <span className="badge-text">
              유저번호 : {showFullInfo ? userInfo.userId : maskUserId(userInfo.userId)}
            </span>
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
            className="quick-action-btn privacy"
            onClick={toggleInfoVisibility}
          >
            <span className="quick-icon">{showFullInfo ? '🙈' : '👁️'}</span>
            <span>{showFullInfo ? '정보 숨기기' : '정보 보기'}</span>
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
            <span className="info-value">
              {showFullInfo ? userInfo.email : maskEmail(userInfo.email)}
            </span>
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

export default UserDashboard;
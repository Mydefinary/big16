import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoonPage = ({ pageName, description }) => {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          🚧
        </div>
        
        <h1 className="coming-soon-title">
          {pageName}
        </h1>
        
        <div className="coming-soon-message">
          <h2>⏳ 곧 출시 예정입니다!</h2>
          <p className="main-message">
            현재 개발 중인 <strong>{pageName}</strong> 기능을 준비하고 있습니다.
          </p>
          
          {description && (
            <div className="page-description">
              <h3>📝 기능 소개</h3>
              <p>{description}</p>
            </div>
          )}
          
          <div className="progress-info">
            <h3>🎯 개발 진행 상황</h3>
            <div className="progress-items">
              <div className="progress-item">
                <span className="progress-status completed">✅</span>
                <span>기획 및 설계 완료</span>
              </div>
              <div className="progress-item">
                <span className="progress-status in-progress">🔄</span>
                <span>핵심 기능 개발 중</span>
              </div>
              <div className="progress-item">
                <span className="progress-status pending">⏳</span>
                <span>베타 테스트 예정</span>
              </div>
              <div className="progress-item">
                <span className="progress-status pending">📋</span>
                <span>정식 서비스 런칭</span>
              </div>
            </div>
          </div>
          
          <div className="release-info">
            <h3>🗓️ 예상 출시일</h3>
            <p className="release-date">2024년 2분기 예정</p>
            <p className="release-note">
              개발 진행 상황에 따라 일정이 변경될 수 있습니다.
            </p>
          </div>
        </div>

        <div className="coming-soon-actions">
          <button 
            onClick={() => navigate('/dashboard')}
            className="action-button primary large"
          >
            📊 대시보드로 돌아가기
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="action-button secondary large"
          >
            🏠 홈으로 이동
          </button>
        </div>

        <div className="notification-section">
          <h4>📢 출시 알림 받기</h4>
          <p>새로운 기능이 출시되면 알림을 받으시겠습니까?</p>
          <button className="notification-btn">
            🔔 출시 알림 신청
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
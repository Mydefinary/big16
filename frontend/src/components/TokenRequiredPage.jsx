import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ComingSoonPage from './ComingSoonPage';

const TokenRequiredPage = ({ pageName, description }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // 로그인한 사용자에게는 ComingSoonPage 표시
  if (isAuthenticated()) {
    return <ComingSoonPage pageName={pageName} description={description} />;
  }

  return (
    <div className="token-required-container">
      <div className="token-required-content">
        <div className="token-required-icon">
          🔐
        </div>
        
        <h1 className="token-required-title">
          {pageName}
        </h1>
        
        <div className="token-required-message">
          <h2>🚫 접근 권한이 필요합니다</h2>
          <p className="main-message">
            이 페이지를 사용하기 위해서는 <strong>로그인</strong>이 필요합니다.
          </p>
          
          {description && (
            <div className="page-description">
              <h3>📝 {pageName} 소개</h3>
              <p>{description}</p>
            </div>
          )}
          
          <div className="feature-info">
            <h3>✨ 로그인 후 이용 가능한 기능</h3>
            <ul>
              <li>🎨 개인 맞춤형 콘텐츠 제작</li>
              <li>💾 작업 내용 자동 저장</li>
              <li>📊 상세한 분석 및 리포트</li>
              <li>🔄 클라우드 동기화</li>
              <li>🎯 고급 설정 옵션</li>
            </ul>
          </div>
        </div>

        <div className="token-required-actions">
          {!isAuthenticated() ? (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="action-button primary large"
              >
                🔑 로그인하기
              </button>
              
              <button 
                onClick={() => navigate('/register')}
                className="action-button secondary large"
              >
                👤 회원가입
              </button>
            </>
          ) : (
            <button 
              onClick={() => navigate('/dashboard')}
              className="action-button primary large"
            >
              📊 대시보드로 이동
            </button>
          )}
        </div>

        <div className="help-section">
          <p className="help-text">
            계정이 없으신가요? <button onClick={() => navigate('/register')} className="link-text">회원가입</button>은 무료입니다!
          </p>
          <p className="help-text">
            문제가 있으신가요? <button onClick={() => navigate('/faq')} className="link-text">FAQ</button>를 확인해보세요.
          </p>
        </div>
      </div>

      <div className="token-info-box">
        <h4>🔐 보안 안내</h4>
        <div className="security-features">
          <div className="security-item">
            <span className="security-icon">🛡️</span>
            <span>JWT 토큰 기반 안전한 인증</span>
          </div>
          <div className="security-item">
            <span className="security-icon">🔄</span>
            <span>자동 토큰 갱신으로 끊김없는 서비스</span>
          </div>
          <div className="security-item">
            <span className="security-icon">⏰</span>
            <span>세션 타임아웃으로 보안 강화</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenRequiredPage;
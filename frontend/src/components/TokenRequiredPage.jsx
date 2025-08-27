import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ComingSoonPage from './ComingSoonPage';
import { toast } from 'react-toastify';

const TokenRequiredPage = ({ pageName, description, DetailComponent, allowedRoles = ['operator', 'admin'] }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 사용자 정보 가져오기 (Dashboard와 동일한 방식)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.me();
        setUserInfo(res.data);
      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [isAuthenticated, logout, navigate]);

  // 로딩 중
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated() || !userInfo) {
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
                <li>🤖 AI 챗봇</li>
                <li>🎨 하이라이트 제작</li>
                <li>🎬 광고 생성기</li>
                <li>🛍️ 굿즈 생성기</li>
                <li>📊 웹툰 대시보드</li>
                <li>📝 자유게시판</li>
              </ul>
            </div>
          </div>

          <div className="token-required-actions">
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
  }

  // user나 operator인데 회사 등록이 안되어 있으면 회사 등록 안내 화면
  if ((userInfo.role === 'user' || userInfo.role === 'operator') && !userInfo.isCompanyRegistered) {
    return (
      <div className="token-required-container">
        <div className="token-required-content">
          <div className="token-required-icon">
            🏢
          </div>
          
          <h1 className="token-required-title">
            {pageName}
          </h1>
          
          <div className="token-required-message">
            <h2>🏢 회사 등록이 필요합니다</h2>
            <p className="main-message">
              이 페이지를 사용하기 위해서는 먼저 <strong>회사 등록</strong>이 완료되어야 합니다.
            </p>
            
            <div className="user-info" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>👤 사용자 정보</h3>
              <p><strong>이름:</strong> {userInfo.nickName}</p>
              <p><strong>권한:</strong> <span className={`role-badge ${userInfo.role}`}>
                {userInfo.role === 'user' ? '👤 일반 사용자' : '⚙️ 운영자'}
              </span></p>
            </div>
            
            {description && (
              <div className="page-description">
                <h3>📝 {pageName} 소개</h3>
                <p>{description}</p>
              </div>
            )}
            
            <div className="registration-info" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>ℹ️ 회사 등록 안내</h3>
              <ul style={{ textAlign: 'left', marginBottom: '15px' }}>
                <li>📝 회사 정보를 입력하여 등록 요청</li>
                <li>✅ 승인 후 모든 서비스 이용 가능</li>
              </ul>
            </div>
          </div>

          <div className="token-required-actions">
            <button
              onClick={() => navigate('/dashboard')}
              className="action-button primary large"
            >
              🏢 회사 등록하러 가기
            </button>
          </div>

          <div className="help-section">
            <p className="help-text">
              회사 등록에 문제가 있으신가요? <button onClick={() => navigate('/faq')} className="link-text">FAQ</button>를 확인해보세요.
            </p>
          </div>
        </div>

        <div className="token-info-box">
          <h4>🏢 등록 절차</h4>
          <div className="registration-steps">
            <div className="step-item" style={{ marginBottom: '10px' }}>
              <span className="step-number">1</span>
              <span>회사 정보 입력</span>
            </div>
            <div className="step-item" style={{ marginBottom: '10px' }}>
              <span className="step-number">2</span>
              <span>관리자 검토</span>
            </div>
            <div className="step-item" style={{ marginBottom: '10px' }}>
              <span className="step-number">3</span>
              <span>승인 및 서비스 이용</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 권한 체크
  const hasPermission = allowedRoles.includes(userInfo.role);

  // 권한이 없는 경우
  if (!hasPermission) {
    return (
      <div className="token-required-container">
        <div className="token-required-content">
          <div className="token-required-icon">
            ⛔
          </div>
          
          <h1 className="token-required-title">
            {pageName}
          </h1>
          
          <div className="token-required-message">
            <h2>🚫 접근 권한이 부족합니다</h2>
            <p className="main-message">
              이 페이지에 접근하기 위해서는 <strong>{allowedRoles.join(', ')} 권한</strong>이 필요합니다.
            </p>
            
            <div className="role-info" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>👤 현재 권한: <span className="current-role user">{userInfo.role}</span></h3>
              <h3>🔑 필요 권한: <span className="required-roles">{allowedRoles.join(', ')}</span></h3>
            </div>
            
            {description && (
              <div className="page-description">
                <h3>📝 {pageName} 소개</h3>
                <p>{description}</p>
              </div>
            )}
            
            <div className="permission-info" style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>ℹ️ 권한 안내</h3>
              <p style={{ marginBottom: '10px' }}>이 기능은 {allowedRoles.join(' 또는 ')} 권한이 필요한 페이지입니다.</p>
              <p>권한 승급이 필요하시다면 시스템 관리자에게 문의해주세요.</p>
            </div>
          </div>

          <div className="token-required-actions">
            <button
              onClick={() => navigate('/dashboard')}
              className="action-button primary large"
            >
              📊 대시보드로 돌아가기
            </button>
          </div>
        </div>

        <div className="token-info-box">
          <h4>👥 권한 체계</h4>
          <div className="role-hierarchy">
            <div className="role-item" style={{ marginBottom: '10px' }}>
              <span className="role-badge admin">👑 관리자</span>
              <span>시스템 전체 관리 권한</span>
            </div>
            <div className="role-item" style={{ marginBottom: '10px' }}>
              <span className="role-badge operator">⚙️ 운영자</span>
              <span>콘텐츠 및 사용자 관리</span>
            </div>
            <div className="role-item" style={{ marginBottom: '10px' }}>
              <span className="role-badge user">👤 일반 사용자</span>
              <span>기본 서비스 이용</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 권한이 있는 경우 - 페이지 접근 허용
  if (DetailComponent) {
    return <DetailComponent />;
  }
  return <ComingSoonPage pageName={pageName} description={description} />;
};

export default TokenRequiredPage;
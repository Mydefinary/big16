import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { maskEmail, maskName, maskUserId } from '../../services/maskingUtils';

const AdminDashboard = ({ userInfo }) => {
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

  // 관리자 기능 함수들
  const goToUserManagement = () => {
    navigate('/admin/users');
    toast.info('사용자 관리로 이동합니다', { autoClose: 2000 });
  };

  const goToContentManagement = () => {
    navigate('/admin/content');
    toast.info('콘텐츠 관리로 이동합니다', { autoClose: 2000 });
  };

  const goToSystemSettings = () => {
    navigate('/admin/settings');
    toast.info('시스템 설정으로 이동합니다', { autoClose: 2000 });
  };

  const goToAnalytics = () => {
    navigate('/admin/analytics');
    toast.info('분석 도구로 이동합니다', { autoClose: 2000 });
  };

  return (
    <div className="dashboard-main-container">
      {/* 관리자 웰컴 섹션 */}
      <div className="admin-welcome-section">
        <div className="admin-welcome-content">
          <div className="admin-welcome-icon">👨‍💼</div>
          <h1 className="admin-welcome-title">관리자 대시보드</h1>
          <p className="admin-welcome-message">
            <span className="username">
              {showFullInfo ? userInfo.nickName : maskName(userInfo.nickName)}
            </span> 관리자님, ToonConnect 관리 시스템에 오신 것을 환영합니다!
          </p>
          <div className="admin-badge">
            <span className="badge-icon">🔐</span>
            <span className="badge-text">Administrator</span>
          </div>
        </div>
      </div>

      {/* 관리 도구 섹션 */}
      <div className="admin-tools-section">
        <h2 className="admin-tools-title">🛠️ 관리 도구</h2>
        <p className="admin-tools-subtitle">시스템 관리 및 모니터링 도구를 이용하세요</p>
        
        <div className="admin-tools-grid">
          {/* 사용자 관리 */}
          <div className="admin-tool-card" onClick={goToUserManagement}>
            <div className="admin-tool-icon">👥</div>
            <h3 className="admin-tool-title">사용자 관리</h3>
            <p className="admin-tool-description">
              회원 정보 조회, 권한 설정, 계정 상태 관리를 할 수 있습니다
            </p>
            <div className="admin-tool-status">관리 도구</div>
          </div>

          {/* 콘텐츠 관리 */}
          <div className="admin-tool-card" onClick={goToContentManagement}>
            <div className="admin-tool-icon">📝</div>
            <h3 className="admin-tool-title">콘텐츠 관리</h3>
            <p className="admin-tool-description">
              웹툰, 게시물, 댓글 등 모든 콘텐츠를 관리하고 모더레이션합니다
            </p>
            <div className="admin-tool-status">관리 도구</div>
          </div>

          {/* 시스템 설정 */}
          <div className="admin-tool-card" onClick={goToSystemSettings}>
            <div className="admin-tool-icon">⚙️</div>
            <h3 className="admin-tool-title">시스템 설정</h3>
            <p className="admin-tool-description">
              서버 설정, 보안 정책, API 키 관리 등 시스템 전반을 설정합니다
            </p>
            <div className="admin-tool-status">관리 도구</div>
          </div>

          {/* 분석 및 통계 */}
          <div className="admin-tool-card" onClick={goToAnalytics}>
            <div className="admin-tool-icon">📊</div>
            <h3 className="admin-tool-title">분석 및 통계</h3>
            <p className="admin-tool-description">
              사용자 활동, 서비스 이용률, 성능 지표 등을 분석합니다
            </p>
            <div className="admin-tool-status">분석 도구</div>
          </div>
        </div>
      </div>

      {/* 시스템 상태 */}
      <div className="system-status-section">
        <h3 className="system-status-title">📡 시스템 상태</h3>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-indicator active"></div>
            <span className="status-label">서버 상태</span>
            <span className="status-value">정상</span>
          </div>
          <div className="status-item">
            <div className="status-indicator active"></div>
            <span className="status-label">데이터베이스</span>
            <span className="status-value">정상</span>
          </div>
          <div className="status-item">
            <div className="status-indicator active"></div>
            <span className="status-label">AI 서비스</span>
            <span className="status-value">정상</span>
          </div>
          <div className="status-item">
            <div className="status-indicator warning"></div>
            <span className="status-label">스토리지</span>
            <span className="status-value">주의</span>
          </div>
        </div>
      </div>

      {/* 관리자 빠른 액션 */}
      <div className="admin-quick-actions-section">
        <h3 className="admin-quick-actions-title">⚡ 빠른 액션</h3>
        <div className="admin-quick-actions-grid">
          <button 
            className="admin-quick-action-btn backup"
            onClick={() => toast.info('백업이 시작되었습니다', { autoClose: 2000 })}
          >
            <span className="quick-icon">💾</span>
            <span>데이터 백업</span>
          </button>
          <button 
            className="admin-quick-action-btn logs"
            onClick={() => navigate('/admin/logs')}
          >
            <span className="quick-icon">📋</span>
            <span>시스템 로그</span>
          </button>
          <button 
            className="admin-quick-action-btn privacy"
            onClick={toggleInfoVisibility}
          >
            <span className="quick-icon">{showFullInfo ? '🙈' : '👁️'}</span>
            <span>{showFullInfo ? '정보 숨기기' : '정보 보기'}</span>
          </button>
          <button 
            className="admin-quick-action-btn logout"
            onClick={handleLogout}
            disabled={loading}
          >
            <span className="quick-icon">🚪</span>
            <span>{loading ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      </div>

      {/* 관리자 정보 */}
      <div className="admin-info-section">
        <h3>👨‍💼 관리자 정보</h3>
        <div className="admin-info-grid">
          <div className="info-item">
            <span className="info-label">관리자 ID</span>
            <span className="info-value">
              {showFullInfo ? userInfo.userId : maskUserId(userInfo.userId)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">이메일</span>
            <span className="info-value">
              {showFullInfo ? userInfo.email : maskEmail(userInfo.email)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">권한 레벨</span>
            <span className="info-value">최고 관리자</span>
          </div>
          <div className="info-item">
            <span className="info-label">마지막 로그인</span>
            <span className="info-value">
              {new Date().toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AdminDashboard;
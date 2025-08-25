import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { useSecurity } from '../components/SecurityProvider';

// 마스킹 함수들을 컴포넌트 외부에 정의
const maskEmail = (email) => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
};

const maskName = (name) => {
  if (!name) return '';
  if (name.length <= 1) return name;
  if (name.length === 2) {
    return name[0] + '*';
  }
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
};

const maskUserId = (userId) => {
  if (!userId) return '';
  const userIdStr = userId.toString();
  if (userIdStr.length <= 3) {
    return '*'.repeat(userIdStr.length);
  }
  return userIdStr.substring(0, 2) + '*'.repeat(userIdStr.length - 2);
};

const Dashboard = () => {
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const navigate = useNavigate();
  const { securePrint } = useSecurity();
  
  // 로그인한 유저 정보 불러오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await authAPI.me();
        securePrint('사용자 정보 로드 완료:', res.data);
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

  // 일반 사용자 서비스 이동 함수들
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

  if (!userInfo) {
    return (
      <div className="loading">
        <div className="loading-spinner">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  // 관리자 대시보드 렌더링
  if (userInfo.role === 'admin') {
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
  }

  // 일반 사용자 대시보드 렌더링
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

export default Dashboard;
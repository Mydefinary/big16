import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import { maskEmail, maskName, maskUserId } from '../../services/maskingUtils';

const AdminDashboard = ({ userInfo }) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' 또는 'user-management'
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  const roleLabels = {
    user: "광고주",
    operator: "운영자",
    admin: "관리자",
  };


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

  // 사용자 관리 화면으로 전환
  const goToUserManagement = async () => {
    setCurrentView('user-management');
    setLoadingUsers(true);
    try {
      const response = await authAPI.getUsers();
      setAllUsers(response.data);
      toast.info('사용자 관리 화면으로 전환되었습니다', { autoClose: 2000 });
    } catch (error) {
      console.error('사용자 목록 불러오기 실패:', error);
      toast.error('사용자 목록을 불러오는데 실패했습니다.', { autoClose: 3000 });
    } finally {
      setLoadingUsers(false);
    }
  };

  // 대시보드로 돌아가기
  const goBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // 권한 변경 모달 열기
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  // 권한 변경 모달 닫기
  const closeRoleModal = () => {
    setSelectedUser(null);
    setSelectedRole('');
    setShowRoleModal(false);
  };

  // 권한 변경 확인
  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      await authAPI.changeUserRole(selectedUser.userId, selectedRole);
      toast.success('사용자 권한이 변경되었습니다.', { autoClose: 3000 });
      
      // 화면 즉시 업데이트를 위해 setAllUsers를 먼저 호출
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.userId === selectedUser.userId 
            ? { ...user, role: selectedRole }
            : user
        )
      );
      
      closeRoleModal();
      
      // 서버에서 최신 데이터도 가져오기 (백그라운드에서)
      try {
        const response = await authAPI.getUsers();
        setAllUsers(response.data);
      } catch (error) {
        console.error('사용자 목록 새로고침 실패:', error);
        // 이미 로컬 상태는 업데이트했으므로 에러 토스트는 표시하지 않음
      }
      
    } catch (error) {
      console.error('권한 변경 실패:', error);
      toast.error('권한 변경에 실패했습니다.', { autoClose: 3000 });
    }
  };

  // 사용자 관리 화면 렌더링
  const renderUserManagement = () => (
    <div className="user-management-container">
      <div className="user-management-header">
        <button 
          className="back-button"
          onClick={goBackToDashboard}
        >
          ← 대시보드로 돌아가기
        </button>
        <h2>사용자 관리</h2>
      </div>

      {loadingUsers ? (
        <div className="loading">
          <div className="loading-spinner">사용자 목록을 불러오는 중...</div>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th></th>
                <th>이메일</th>
                <th>닉네임</th>
                <th>회사</th>
                <th>권한</th>
                <th>가입일</th>
                <th>권한 변경</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user, index) => (
                <tr key={user.userId}>
                  <td>{index+1}</td>
                  <td>{showFullInfo ? user.email : maskEmail(user.email)}</td>
                  <td>{showFullInfo ? user.nickname : maskName(user.nickname)}</td>
                  <td>{user.company || '미 지정'}</td>
                  <td>{roleLabels[user.role] || user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>
                    <button 
                      className="action-btn role-change"
                      onClick={() => openRoleModal(user)}
                    >
                      권한 변경
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // 기본 대시보드 화면 렌더링
  const renderDashboard = () => (
    <>
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
        </div>
      </div>

      {/* 관리자 빠른 액션 */}
      <div className="admin-quick-actions-section">
        <h3 className="admin-quick-actions-title">⚡ 빠른 액션</h3>
        <div className="admin-quick-actions-grid">
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
    </>
  );

  return (
    <div className="dashboard-main-container">
      {currentView === 'dashboard' ? renderDashboard() : renderUserManagement()}
      
      {/* 권한 변경 모달 */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={closeRoleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>권한 변경</h3>
            <p>
              사용자 <strong>{selectedUser?.nickname}</strong>의 권한을 변경하시겠습니까?
            </p>
            
            <div className="role-options">
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={selectedRole === 'user'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                <span>광고주 (user)</span>
              </label>
              
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="operator"
                  checked={selectedRole === 'operator'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                <span>운영자 (operator)</span>
              </label>
              
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                <span>관리자 (admin)</span>
              </label>
            </div>
            
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={closeRoleModal}>
                취소
              </button>
              <button className="confirm-btn" onClick={confirmRoleChange}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  );
};

export default AdminDashboard;
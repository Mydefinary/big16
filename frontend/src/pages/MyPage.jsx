import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI, userAPI } from '../services/api';

const MyPage = () => {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 비밀번호 변경 관련 상태
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    // 인증 상태 디버깅
    console.log('🔍 MyPage - Auth Status:', {
      isAuthenticated: isAuthenticated(),
      hasToken: !!token,
      tokenInStorage: !!localStorage.getItem('accessToken')
    });
    
    if (!isAuthenticated()) {
      console.log('❌ Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate, token]);

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordChangeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (!passwordChangeData.currentPassword || !passwordChangeData.newPassword) {
      toast.error('현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      toast.error('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (passwordChangeData.newPassword.length < 8) {
      toast.error('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting password change...');
      
      await authAPI.changePassword(
        passwordChangeData.currentPassword,
        passwordChangeData.newPassword
      );
      
      console.log('✅ Password change successful');
      toast.success('비밀번호가 성공적으로 변경되었습니다!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // 폼 초기화 및 숨기기
      setPasswordChangeData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      
    } catch (error) {
      console.error('❌ Password change error:', error);
      const errorMessage = error.response?.data || error.message || '비밀번호 변경 중 오류가 발생했습니다.';
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordChangeData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordForm(false);
  };

  const handleAccountDelete = async () => {
    console.log('🗑️ Account deletion initiated');
    console.log('🔍 Current auth state:', {
      isAuthenticated: isAuthenticated(),
      hasToken: !!localStorage.getItem('accessToken'),
      tokenValid: !!localStorage.getItem('accessToken') // 간단한 체크
    });

    const confirmed = window.confirm(
      '정말로 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.\n\n계속하려면 "확인"을 클릭하세요.'
    );
    
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      '마지막 확인입니다.\n계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.\n정말 진행하시겠습니까?'
    );
    
    if (!doubleConfirmed) return;

    try {
      setLoading(true);
      console.log('🔄 Sending account deletion request...');
      
      const response = await userAPI.deactivate();
      console.log('✅ Account deletion response:', response.data);
      
      toast.success('계정이 성공적으로 삭제되었습니다.', {
        position: "top-center",
        autoClose: 5000,
      });
      
      // 로그아웃 처리
      console.log('🔄 Logging out after account deletion...');
      await logout();
      navigate('/');
      
    } catch (error) {
      console.error('❌ Account deletion error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message
      });
      
      let errorMessage = '계정 삭제 중 오류가 발생했습니다.';
      
      if (error.response?.status === 401) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해 주세요.';
        // 인증 오류 시 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.data) {
        errorMessage = error.response.data;
      }
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">처리 중...</div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <div className="mypage-header">
        <h1>⚙️ 계정 설정</h1>
        <p>계정 보안 설정을 관리하세요.</p>
        {/* 디버깅용 정보 표시 */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          인증상태: {isAuthenticated() ? '✅' : '❌'} | 
          토큰: {localStorage.getItem('accessToken') ? '있음' : '없음'}
        </div>
      </div>

      <div className="mypage-content">
        <div className="settings-section">
          <div className="settings-group">
            <h3>🔒 보안 설정</h3>
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">비밀번호 변경</div>
                <div className="setting-description">계정의 비밀번호를 변경합니다</div>
              </div>
              <button 
                className="setting-btn primary"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                disabled={loading}
              >
                {showPasswordForm ? '취소' : '변경하기'}
              </button>
            </div>

            {showPasswordForm && (
              <div className="password-change-form">
                <div className="form-group">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordChangeData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="현재 비밀번호를 입력하세요"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordChangeData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordChangeData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="save-btn"
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    💾 비밀번호 변경
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={handleCancelPasswordChange}
                    disabled={loading}
                  >
                    ❌ 취소
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="settings-group danger">
            <h3>⚠️ 위험 영역</h3>
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">계정 삭제</div>
                <div className="setting-description">계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</div>
              </div>
              <button 
                className="setting-btn danger"
                onClick={handleAccountDelete}
                disabled={loading}
              >
                계정 삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
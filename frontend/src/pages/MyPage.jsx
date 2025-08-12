import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authAPI, userAPI } from '../services/api';

const MyPage = () => {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 비밀번호 변경 관련 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // 계정 삭제 모달 관련 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: 첫 번째 확인, 2: 최종 확인

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

  // 비밀번호 변경 입력 핸들러 (실시간 검증)
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    // 입력값 업데이트
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // 입력 수정 시 해당 필드 에러 삭제
    setPasswordErrors(prev => {
      const copy = { ...prev };
      if (copy[name]) {
        delete copy[name];
      }
      return copy;
    });

    // 새 비밀번호 / 비밀번호 확인 일치 검증
    if (name === 'newPassword' || name === 'confirmPassword') {
      const newPassword = name === 'newPassword' ? value : passwordData.newPassword;
      const confirmPassword = name === 'confirmPassword' ? value : passwordData.confirmPassword;

      setPasswordErrors(prev => {
        const copy = { ...prev };
        
        // 새 비밀번호 유효성 검사
        if (name === 'newPassword' && value) {
          if (value.length < 8) {
            copy.newPassword = '비밀번호는 8자리 이상이어야 합니다.';
          } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
            copy.newPassword = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
          } else {
            delete copy.newPassword;
          }
        }
        
        // 비밀번호 확인 일치 검사
        if (confirmPassword && newPassword !== confirmPassword) {
          copy.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
        } else if (newPassword && confirmPassword && newPassword === confirmPassword) {
          delete copy.confirmPassword;
        }
        
        return copy;
      });
    }
  };

  // 비밀번호 변경 검증 함수
  const validatePasswordChange = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력하세요.';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력하세요.';
    } else {
      if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = '비밀번호는 8자리 이상이어야 합니다.';
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordData.newPassword)) {
        newErrors.newPassword = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
      }
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력하세요.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
    }

    // 현재 비밀번호와 새 비밀번호가 같은지 확인
    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = '현재 비밀번호와 새 비밀번호가 같습니다.';
    }

    // 유효성 검사 실패 시 toast로 에러 표시
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError, {
        position: "top-right",
        autoClose: 3000,
      });
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 비밀번호 변경 제출
  const handlePasswordSubmit = async () => {
    if (!validatePasswordChange()) return;

    try {
      setLoading(true);
      console.log('🔄 Starting password change...');
      
      await authAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      console.log('✅ Password change successful');
      toast.success('비밀번호가 성공적으로 변경되었습니다!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // 폼 초기화 및 숨기기
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
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

  // 비밀번호 변경 취소
  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswordForm(false);
  };

  // 계정 삭제 모달 열기
  const handleAccountDelete = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
  };

  // 첫 번째 확인
  const handleFirstConfirm = () => {
    setDeleteStep(2);
  };

  // 최종 계정 삭제 처리
  const handleFinalDelete = async () => {
    try {
      setLoading(true);
      console.log('🔄 Sending account deletion request...');
      
      const response = await userAPI.deactivate();
      console.log('✅ Account deletion response:', response.data);
      
      toast.success('계정이 성공적으로 삭제되었습니다.', {
        position: "top-center",
        autoClose: 5000,
      });
      
      // 모달 닫기
      setShowDeleteModal(false);
      setDeleteStep(1);
      
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

  // 커스텀 삭제 확인 모달 컴포넌트
  const DeleteConfirmModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="modal-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowDeleteModal(false);
          setDeleteStep(1);
        }
      }}>
        <div className="modal-container">
          <div className="modal-header">
            <div className="modal-icon danger">⚠️</div>
            <div className="modal-title">
              {deleteStep === 1 ? '계정 삭제 확인' : '최종 확인'}
            </div>
            <div className="modal-subtitle">
              {deleteStep === 1 ? '정말로 계정을 삭제하시겠습니까?' : '마지막 경고입니다'}
            </div>
          </div>
          
          <div className="modal-content">
            {deleteStep === 1 ? (
              <>
                <div className="modal-message primary">
                  계정을 삭제하면 다음 데이터들이 영구적으로 삭제됩니다:
                </div>
                <div className="modal-message warning">
                  <ul className="warning-list">
                    <li>모든 개인 정보 및 설정</li>
                    <li>저장된 모든 데이터</li>
                    <li>계정 활동 기록</li>
                    <li>복구 불가능한 영구 삭제</li>
                  </ul>
                </div>
                <div className="modal-message">
                  이 작업은 <strong>되돌릴 수 없습니다</strong>. 정말 진행하시겠습니까?
                </div>
              </>
            ) : (
              <>
                <div className="modal-message primary">
                  🚨 최종 경고 🚨
                </div>
                <div className="modal-message warning">
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며, 
                  <strong> 절대 복구할 수 없습니다</strong>.
                </div>
                <div className="modal-message">
                  정말로 계속 진행하시겠습니까?
                </div>
              </>
            )}
            
            <div className="modal-actions">
              <button 
                className="modal-btn cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteStep(1);
                }}
                disabled={loading}
              >
                취소
              </button>
              <button 
                className={`modal-btn danger ${loading ? 'loading' : ''}`}
                onClick={deleteStep === 1 ? handleFirstConfirm : handleFinalDelete}
                disabled={loading}
              >
                {loading ? '' : (deleteStep === 1 ? '계속 진행' : '영구 삭제')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !showDeleteModal && !showPasswordForm) {
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
          인증상태: {isAuthenticated() ? '✅' : '❌'}
        </div>
      </div>

      <div className="mypage-content">
        <div className="settings-section">
          <div className="settings-group">
            <h3>🔒 보안 설정</h3>
            
            {/* 비밀번호 변경 섹션 */}
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">비밀번호 변경</div>
                <div className="setting-description">계정의 비밀번호를 변경합니다</div>
              </div>
              <div className="setting-button-area">
                {!showPasswordForm && (
                  <button 
                    className="setting-btn primary"
                    onClick={() => setShowPasswordForm(true)}
                    disabled={loading}
                  >
                    변경하기
                  </button>
                )}
              </div>
            </div>

            {/* 비밀번호 변경 폼 */}
            {showPasswordForm && (
              <div className="password-change-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">현재 비밀번호</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="현재 비밀번호를 입력하세요"
                    disabled={loading}
                    required
                  />
                  {passwordErrors.currentPassword && (
                    <div className="field-error">{passwordErrors.currentPassword}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    새 비밀번호
                    <div className="help-icon-container">
                      <span className="help-icon">?</span>
                      <div className="tooltip tooltip-right">
                        <div className="tooltip-content">
                          <strong>비밀번호 요구사항:</strong>
                          <ul>
                            <li>8자리 이상</li>
                            <li>영문 포함</li>
                            <li>숫자 포함</li>
                            <li>특수문자 포함 (@$!%*?&)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="영문, 숫자, 특수문자 포함 8자리 이상"
                    disabled={loading}
                    required
                    minLength="8"
                  />
                  {passwordErrors.newPassword && (
                    <div className="field-error">{passwordErrors.newPassword}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    disabled={loading}
                    required
                  />
                  {passwordErrors.confirmPassword && (
                    <div className="field-error">{passwordErrors.confirmPassword}</div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    className="save-btn"
                    onClick={handlePasswordSubmit}
                    disabled={loading || Object.values(passwordErrors).some(e => e)}
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

          {/* 계정 삭제 섹션 */}
          <div className="settings-group danger">
            <h3>⚠️ 위험 영역</h3>
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">계정 삭제</div>
                <div className="setting-description">계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</div>
              </div>
              <div className="setting-button-area">
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

      {/* 커스텀 삭제 확인 모달 */}
      <DeleteConfirmModal />
      
      {/* ToastContainer 추가 */}
      <ToastContainer />
    </div>
  );
};

export default MyPage;
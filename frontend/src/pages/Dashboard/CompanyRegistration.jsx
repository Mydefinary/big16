import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authAPI } from '../../services/api';
import { maskName } from '../../services/maskingUtils'; // ✅ 마스킹 유틸 추가
import './CompanyRegistration.css';

const CompanyRegistration = ({ userInfo, setUserInfo }) => {
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false); // ✅ 마스킹 상태 추가

  const handleCompanyRegister = async () => {
    if (!companyName.trim()) {
      toast.error('회사명을 입력해주세요.');
      return;
    }

    if (companyName.trim().length < 2) {
      toast.error('회사명은 2글자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await authAPI.registerCompany({
        companyName: companyName.trim()
      });
      
      // 성공 모달 표시
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('회사 등록 실패:', error);
      toast.error('회사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ 정보 표시/숨기기 토글 함수 추가
  const toggleInfoVisibility = () => {
    setShowFullInfo(!showFullInfo);
    toast.info(showFullInfo ? '정보가 마스킹되었습니다' : '정보가 표시되었습니다', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // 모달에서 확인 버튼 클릭 시
  const handleModalConfirm = () => {
    setShowSuccessModal(false);
    setUserInfo(prev => ({
      ...prev,
      isCompanyRegistered: true
    }));
  };

  return (
    <div className="company-registration-container">
      <div className="company-registration-header">
        <div className="registration-welcome-content">
          <div className="registration-welcome-icon">🏢</div>
          <h1 className="registration-welcome-title">회사 등록</h1>
          <p className="registration-welcome-message">
            안녕하세요, <span className="username">
              {/* ✅ 마스킹 적용 */}
              {showFullInfo ? userInfo.nickName : maskName(userInfo.nickName)}
            </span>님!
          </p>
          <p className="registration-description">
            서비스를 이용하시려면 먼저 회사 정보를 등록해주세요.
          </p>
          <div className="user-badge">
            <span className="badge-icon">👤</span>
            <span>{userInfo.role === 'user' ? '일반 사용자' : '운영자'}</span>
          </div>
          {/* ✅ 정보 보기/숨기기 버튼 추가 */}
          <button 
            className="privacy-toggle-btn"
            onClick={toggleInfoVisibility}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: '#f0f8ff',
              border: '1px solid #007bff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <span>{showFullInfo ? '🙈' : '👁️'}</span>
            <span style={{ marginLeft: '8px' }}>
              {showFullInfo ? '정보 숨기기' : '정보 보기'}
            </span>
          </button>
        </div>
      </div>

      <div className="registration-form-section">
        <div className="registration-form-container">
          <h2 className="form-title">회사 정보 입력</h2>
          <p className="form-subtitle">등록하실 회사의 정보를 입력해주세요</p>
          
          <div className="registration-form">
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                <span className="label-icon">🏢</span>
                회사명
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="회사명을 입력하세요"
                className="form-input"
                maxLength={100}
                disabled={isSubmitting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCompanyRegister();
                  }
                }}
              />
              <div className="input-helper">
                최소 2글자 이상 입력해주세요 ({companyName.length}/100)
              </div>
            </div>

            <button 
              onClick={handleCompanyRegister}
              className="register-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  등록 중...
                </>
              ) : (
                <>
                  <span className="btn-icon">✅</span>
                  회사 등록하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="registration-info-section">
        <h3 className="info-title">등록 안내</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card-icon">📝</div>
            <div className="info-card-title">회사 등록 절차</div>
            <div className="info-card-description">
              입력하신 회사 정보는 관리자 검토 후 승인됩니다
            </div>
          </div>
        </div>
      </div>
      
      <ToastContainer />
      
      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="modal-icon">🎉</div>
            <h2 className="modal-title">등록 완료!</h2>
            <p className="modal-message">
              <strong>{companyName}</strong> 등록이 성공적으로 완료되었습니다.
            </p>
            <p className="modal-sub-message">
              승인 전까지 일부 서비스를 이용하실 수 있습니다.
            </p>
            <button 
              className="modal-confirm-btn"
              onClick={handleModalConfirm}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyRegistration;
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import './CompanyRegistration.css';

const CompanyRegistration = ({ userInfo, setUserInfo }) => {
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      toast.success('회사 등록 요청이 완료되었습니다.');
      
      // 사용자 정보 업데이트
      setUserInfo(prev => ({
        ...prev,
        isCompanyRegistered: true
      }));
      
    } catch (error) {
      console.error('회사 등록 실패:', error);
      toast.error('회사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="company-registration-container">
      <div className="company-registration-header">
        <div className="registration-welcome-content">
          <div className="registration-welcome-icon">🏢</div>
          <h1 className="registration-welcome-title">회사 등록</h1>
          <p className="registration-welcome-message">
            안녕하세요, <span className="username">{userInfo.nickName}</span>님!
          </p>
          <p className="registration-description">
            서비스를 이용하시려면 먼저 회사 정보를 등록해주세요.
          </p>
          <div className="user-badge">
            <span className="badge-icon">👤</span>
            <span>{userInfo.role === 'user' ? '일반 사용자' : '운영자'}</span>
          </div>
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
              disabled={isSubmitting || !companyName.trim()}
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
          <div className="info-card">
            <div className="info-card-icon">⏱️</div>
            <div className="info-card-title">처리 시간</div>
            <div className="info-card-description">
              일반적으로 1-2 영업일 내에 승인 처리됩니다
            </div>
          </div>
          <div className="info-card">
            <div className="info-card-icon">🔔</div>
            <div className="info-card-title">알림 서비스</div>
            <div className="info-card-description">
              승인 완료 시 등록하신 이메일로 알림을 보내드립니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
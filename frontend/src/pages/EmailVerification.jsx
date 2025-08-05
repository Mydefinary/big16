import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const EmailVerification = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // 이전 페이지에서 전달받은 데이터
  const { email, purpose, message } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!code.trim()) {
      setError('인증코드를 입력하세요.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.verifyCode(email, code);
      setSuccess(true);
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err.response?.data;
      if (typeof errorMessage === 'string') {
        setError(errorMessage);
      } else {
        setError('인증에 실패했습니다. 코드를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // 코드 재발송 로직 (필요시 구현)
    alert('코드 재발송 기능은 현재 준비 중입니다.');
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form success">
          <h2>✅ 이메일 인증 완료!</h2>
          <p>이메일 인증이 성공적으로 완료되었습니다.</p>
          <p>3초 후 로그인 페이지로 이동합니다...</p>
          <button 
            onClick={() => navigate('/login')} 
            className="auth-button primary"
          >
            바로 로그인하기
          </button>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="auth-container">
        <div className="auth-form error">
          <h2>잘못된 접근</h2>
          <p>이메일 정보가 없습니다.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="auth-button primary"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>이메일 인증</h2>
        
        {message && <div className="info-message">{message}</div>}
        
        <div className="email-info">
          <p><strong>{email}</strong>로 인증코드를 발송했습니다.</p>
          <p>메일함을 확인하여 6자리 인증코드를 입력해주세요.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">인증코드 (6자리)</label>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="000000"
              maxLength="6"
              pattern="[0-9]{6}"
              className="code-input"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading || code.length !== 6}
          >
            {loading ? '인증 중...' : '인증하기'}
          </button>
        </form>

        <div className="auth-links">
          <button 
            type="button" 
            onClick={handleResendCode}
            className="link-button"
            disabled={loading}
          >
            인증코드 재발송
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="link-button"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
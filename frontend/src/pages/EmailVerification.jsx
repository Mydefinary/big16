import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmailVerification = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60); // 페이지 진입시 60초 쿨다운 시작
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // 이전 페이지에서 전달받은 데이터
  const { email, purpose, message } = location.state || {};

  // 쿨다운 시간을 분:초 형태로 포맷팅하는 함수
  const formatCooldown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!code.trim()) {
      toast.error('인증코드를 입력하세요.', {
        position: "top-right",
        autoClose: 3000,
      });
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
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || '인증에 실패했습니다. 코드를 확인해주세요.';
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // 쿨다운 중일 때 클릭하면 남은 시간 알려주기
    if (resendCooldown > 0) {
      toast.warning(`인증코드가 이미 발송되었습니다. ${formatCooldown(resendCooldown)} 후에 재발송 가능합니다.`, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }
    
    setResendLoading(true);

    try {
      // 백엔드 API 호출 - email만 전송
      const response = await authAPI.resendCode(email);
      
      toast.success('인증코드가 재발송되었습니다. 메일함을 확인해주세요.', {
        position: "top-center",
        autoClose: 5000,
      });
      
      setResendCooldown(60); // 60초 쿨다운
      setCode(''); // 기존 입력한 코드 초기화
    } catch (err) {
      console.error('Resend code error:', err);
      
      let errorMessage = '코드 재발송에 실패했습니다. 잠시 후 다시 시도해주세요.';
      
      // 백엔드에서 반환하는 에러 메시지 처리
      if (err.response?.status === 429) {
        errorMessage = '잠시 후 다시 시도해주세요. (1분 후 재발송 가능)';
      } else if (err.response?.status === 404) {
        errorMessage = '이메일을 찾을 수 없습니다.';
      } else if (err.response?.status === 500) {
        errorMessage = '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.';
      } else if (typeof err.response?.data === 'string') {
        errorMessage = err.response.data;
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setResendLoading(false);
    }
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
        <ToastContainer />
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
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>이메일 인증</h2>
        
        {message && (
          <div className="info-message">
            {message}
          </div>
        )}
        
        <div className="email-info">
          <p><strong>{email}</strong>로 인증코드를 발송했습니다.</p>
          <p>메일함을 확인하여 6자리 인증코드를 입력해주세요.</p>
          <p>3분동안 미인증 시 계정이 만료됩니다</p>
          {resendCooldown > 0 && (
            <p className="cooldown-info">
              인증코드 재발송 가능 시간: {formatCooldown(resendCooldown)} 
            </p>
          )}
        </div>
        
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
            className={`link-button ${resendCooldown > 0 ? 'disabled' : ''}`}
            disabled={loading || resendLoading}
          >
            {resendLoading 
              ? '발송 중...' 
              : resendCooldown > 0 
                ? `재발송 (${formatCooldown(resendCooldown)})`
                : '인증코드 재발송'
            }
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

      <ToastContainer />
    </div>
  );
};

export default EmailVerification;
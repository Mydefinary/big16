import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';

const FindPassword = () => {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 코드 입력, 3: 새 비밀번호 설정
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  // 1단계: 이메일 확인 및 인증코드 발송
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 이메일 존재 확인 (비밀번호 재설정용 이벤트 발송)
      await userAPI.checkEmail(email);
      setStep(2);
    } catch (err) {
      console.error('Email check error:', err);
      setError(err.response?.data || '이메일을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 인증코드 확인
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 인증코드 확인
      await authAPI.verifyCode(email, code);
      setStep(3);
    } catch (err) {
      console.error('Code verification error:', err);
      setError(err.response?.data || '인증코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 새 비밀번호 설정
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 비밀번호 재설정
      await authAPI.resetPassword(email, password);
      setSuccess(true);
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h2>비밀번호 찾기</h2>
      <p>가입시 사용한 이메일을 입력해주세요.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleEmailSubmit}>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="이메일을 입력하세요"
          />
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading}
        >
          {loading ? '확인 중...' : '인증메일 발송'}
        </button>
      </form>
    </>
  );

  const renderStep2 = () => (
    <>
      <h2>인증코드 입력</h2>
      <div className="email-info">
        <p><strong>{email}</strong>로 인증코드를 발송했습니다.</p>
        <p>메일함을 확인하여 6자리 인증코드를 입력해주세요.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleCodeSubmit}>
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
          onClick={() => setStep(1)}
          className="link-button"
        >
          이메일 다시 입력
        </button>
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <h2>새 비밀번호 설정</h2>
      <p>새로 사용할 비밀번호를 입력해주세요.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handlePasswordSubmit}>
        <div className="form-group">
          <label htmlFor="password">새 비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="새 비밀번호를 입력하세요"
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="비밀번호를 다시 입력하세요"
            minLength="6"
          />
          {confirmPassword && password !== confirmPassword && (
            <div className="field-error">비밀번호가 일치하지 않습니다.</div>
          )}
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading || !password || !confirmPassword || password !== confirmPassword}
        >
          {loading ? '설정 중...' : '비밀번호 재설정'}
        </button>
      </form>
    </>
  );

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form success">
          <h2>✅ 비밀번호 재설정 완료!</h2>
          <p>비밀번호가 성공적으로 재설정되었습니다.</p>
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

  return (
    <div className="auth-container">
      <div className="auth-form">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        
        <div className="auth-links">
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

export default FindPassword;
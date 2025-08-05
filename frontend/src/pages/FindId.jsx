import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';

const FindId = () => {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 코드 입력, 3: 아이디 표시
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [foundId, setFoundId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // 1단계: 이메일 확인 및 인증코드 발송
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 이메일 존재 확인
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
      
      // 인증 성공 후 아이디 조회
      const response = await userAPI.findId(email);
      setFoundId(response.data);
      setStep(3);
    } catch (err) {
      console.error('Code verification error:', err);
      setError(err.response?.data || '인증코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <h2>아이디 찾기</h2>
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
      <h2>아이디 찾기 완료</h2>
      <div className="success-message">
        <p>회원님의 아이디는 다음과 같습니다.</p>
        <div className="found-id">
          <strong>{foundId}</strong>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/login')} 
        className="auth-button primary"
      >
        로그인하기
      </button>
      
      <div className="auth-links">
        <button 
          type="button" 
          onClick={() => navigate('/find-password')}
          className="link-button"
        >
          비밀번호 찾기
        </button>
      </div>
    </>
  );

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

export default FindId;
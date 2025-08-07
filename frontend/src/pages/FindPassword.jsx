import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FindPassword = () => {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 코드 입력, 3: 새 비밀번호 설정
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({}); // 에러 상태 추가
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // 비밀번호 필드 변경 핸들러 (회원가입과 동일한 로직)
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    // 입력값 업데이트
    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }

    // 입력 수정 시 해당 필드 에러 삭제
    setErrors(prev => {
      const copy = { ...prev };
      if (copy[name]) {
        delete copy[name];
      }
      return copy;
    });

    // 비밀번호 / 비밀번호 확인 일치 검증
    if (name === 'password' || name === 'confirmPassword') {
      const newPassword = name === 'password' ? value : password;
      const newConfirmPassword = name === 'confirmPassword' ? value : confirmPassword;

      setErrors(prev => {
        const copy = { ...prev };
        
        // 비밀번호 유효성 검사
        if (name === 'password' && value) {
          if (value.length < 8) {
            copy.password = '비밀번호는 8자리 이상이어야 합니다.';
          } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
            copy.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
          } else {
            delete copy.password;
          }
        }
        
        // 비밀번호 확인 일치 검사
        if (newConfirmPassword && newPassword !== newConfirmPassword) {
          copy.confirmPassword = '비밀번호가 일치하지 않습니다.';
        } else if (newPassword && newConfirmPassword && newPassword === newConfirmPassword) {
          delete copy.confirmPassword;
        }
        
        return copy;
      });
    }
  };

  // 3단계 비밀번호 유효성 검사 (회원가입과 동일한 로직)
  const validatePassword = () => {
    const newErrors = {};

    if (!password) newErrors.password = '비밀번호를 입력하세요.';
    if (!confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력하세요.';

    // 비밀번호 유효성 검사
    if (password) {
      if (password.length < 8) {
        newErrors.password = '비밀번호는 8자리 이상이어야 합니다.';
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
        newErrors.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
      }
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // 유효성 검사 실패 시 toast로 에러 표시
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError, {
        position: "top-right",
        autoClose: 3000,
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 1단계: 이메일 확인 및 인증코드 발송
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 이메일 존재 확인 (비밀번호 재설정용 이벤트 발송)
      await userAPI.checkEmail(email);
      setStep(2);
      
      toast.success('인증코드가 발송되었습니다. 메일함을 확인해주세요.', {
        position: "top-center",
        autoClose: 5000,
      });
    } catch (err) {
      console.error('Email check error:', err);
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || '이메일을 찾을 수 없습니다.';
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 인증코드 확인
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 인증코드 확인 요청 및 응답 받기
      const response = await authAPI.verifyCode(email, code);

      // 커스텀 헤더에서 토큰 꺼내기
      const emailToken = response.headers['x-email-token'];
      if (emailToken) {
        localStorage.setItem('emailToken', emailToken);
      }

      setStep(3);
      
      toast.success('인증이 완료되었습니다!', {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Code verification error:', err);
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || '인증코드가 올바르지 않습니다.';
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 새 비밀번호 설정
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return; // 회원가입과 동일한 검증 로직 사용

    setLoading(true);

    try {
      const emailToken = localStorage.getItem('emailToken');
      if (!emailToken) {
        toast.error('이메일 인증 토큰이 없습니다. 다시 인증해주세요.', {
          position: "top-right",
          autoClose: 5000,
        });
        setLoading(false);
        return;
      }
      
      await authAPI.resetPassword(password, emailToken);
      setSuccess(true);
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || '비밀번호 재설정에 실패했습니다.';
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setCode('');
    toast.info('이메일을 다시 입력해주세요.', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const renderStep1 = () => (
    <>
      <h2>비밀번호 재설정</h2>
      <p>가입시 사용한 이메일을 입력해주세요.</p>
      
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
          onClick={handleBackToEmail}
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
      
      <form onSubmit={handlePasswordSubmit}>
        <div className="form-group">
          <label htmlFor="password">
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
            id="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            required
            placeholder="영문, 숫자, 특수문자 포함 8자리 이상"
            minLength="8"
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handlePasswordChange}
            required
            placeholder="비밀번호를 다시 입력하세요"
          />
          {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
        </div>

        <button 
          type="submit" 
          className="auth-button primary"
          disabled={loading || Object.values(errors).some(e => e)}
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
        <ToastContainer />
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

      <ToastContainer />
    </div>
  );
};

export default FindPassword;
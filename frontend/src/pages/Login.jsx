// /src/pages/Login.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSecurity } from '../components/SecurityProvider';


const Login = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { recordLoginAttempt, securityState, sanitizeInput } = useSecurity();


  // 로그인 후 리다이렉트할 경로 결정
  const from = location.state?.from?.pathname || '/dashboard';

  // 로그인 차단 체크
  useEffect(() => {
    if (securityState.loginAttempts >= 3) {
      const blockStartTime = localStorage.getItem('loginBlockStartTime');
      const now = Date.now();
      
      if (!blockStartTime) {
        // 새로운 차단 시작
        localStorage.setItem('loginBlockStartTime', now.toString());
        setLoginBlocked(true);
        setBlockTimeLeft(30);
      } else {
        // 기존 차단 시간 계산
        const elapsed = Math.floor((now - parseInt(blockStartTime)) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        
        if (remaining > 0) {
          setLoginBlocked(true);
          setBlockTimeLeft(remaining);
        } else {
          // 차단 해제
          localStorage.removeItem('loginBlockStartTime');
          recordLoginAttempt(true); // 카운트 리셋
          setLoginBlocked(false);
          return;
        }
      }
      
      const timer = setInterval(() => {
        setBlockTimeLeft(prev => {
          if (prev <= 1) {
            setLoginBlocked(false);
            localStorage.removeItem('loginBlockStartTime');
            recordLoginAttempt(true); // 카운트 리셋
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [securityState.loginAttempts]);


  const handleChange = (e) => {
    const value = e.target.value;
    
    // XSS 패턴 감지만 하고 입력은 그대로 저장
    const dangerousPatterns = /<script|javascript:|on\w+=/i;
    if (dangerousPatterns.test(value)) {
      console.warn('[보안 경고] 의심스러운 입력 감지:', value);
      toast.warn('보안상 위험한 문자가 감지되었습니다.');
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loginBlocked) {
      return;
    }
    
    // 제출 전 입력값 정제
    const sanitizedData = {
      loginId: sanitizeInput(formData.loginId),
      password: sanitizeInput(formData.password)
    };
    
    // XSS 시도 감지 시 로그인 차단
    if (formData.loginId !== sanitizedData.loginId || formData.password !== sanitizedData.password) {
      console.warn('[보안 경고] XSS 시도 감지됨 - 로그인 차단');
      console.log('원본 데이터:', formData);
      console.log('정제된 데이터:', sanitizedData);
      
      toast.error('보안상 위험한 입력이 감지되어 로그인이 차단되었습니다.', {
        position: "top-right",
        autoClose: 5000,
        pauseOnHover: true,
        draggable: true,
      });
      
      // 로그인 시도 실패로 기록
      recordLoginAttempt(false);
      return; // 여기서 함수 종료 - 로그인 시도 안함
    }
    
    setLoading(true);

    try {
      console.log('🔐 로그인 요청:', sanitizedData.loginId);
      
      // 🎯 AuthContext의 login 함수 호출
      await login(sanitizedData);
      
      console.log('✅ 로그인 성공 - 리다이렉트:', from);
      recordLoginAttempt(true);
      
      toast.success('로그인에 성공했습니다!', {
        position: "top-right",
        autoClose: 2000,
        pauseOnHover: true,
        draggable: true,
      });

      navigate(from, { replace: true });
      
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
      
      recordLoginAttempt(false);
      const attempts = securityState.loginAttempts + 1;
      console.log(`로그인 실패 (${attempts}/3)`);
      
      let message = '로그인에 실패했습니다.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          message = err.response.data;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        }
      } else if (err.message) {
        message = err.message;
      }

      toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // 버튼 비활성화 조건
  const isButtonDisabled = loading || loginBlocked;

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>로그인</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginId">아이디</label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              required
              placeholder="아이디를 입력하세요"
              disabled={loading || loginBlocked}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="비밀번호를 입력하세요"
              disabled={loading || loginBlocked}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={isButtonDisabled}
          >
            {loginBlocked 
              ? `로그인 차단 (${blockTimeLeft}초)` 
              : loading ? '로그인 중...' : '로그인'
            }
          </button>
        </form>

        <div className="auth-links">
          <Link to="/find-id" className="link">아이디 찾기</Link>
          <Link to="/find-password" className="link">비밀번호 찾기</Link>
          <Link to="/register" className="link">회원가입</Link>
        </div>

        {/* 로그인 시도 횟수 표시 */}
        {securityState.loginAttempts > 0 && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#856404',
            textAlign: 'center'
          }}>
            로그인 실패 횟수: {securityState.loginAttempts}/3
            {securityState.loginAttempts >= 3 && (
              <div style={{ marginTop: '5px', color: '#dc3545', fontWeight: 'bold' }}>
                3번 실패로 30초간 로그인이 차단됩니다.
              </div>
            )}
          </div>
        )}

        {/* 리다이렉트 정보 표시 (개발 중에만) */}
        {process.env.NODE_ENV === 'development' && from !== '/dashboard' && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            로그인 후 {from} 페이지로 이동됩니다.
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
// /src/pages/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 후 리다이렉트할 경로 결정
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 로그인 요청:', formData.loginId);
      
      // 🎯 AuthContext의 login 함수 호출 (쿠키 기반)
      await login(formData);
      
      console.log('✅ 로그인 성공 - 리다이렉트:', from);
      
      toast.success('로그인에 성공했습니다!', {
        position: "top-right",
        autoClose: 2000,
        pauseOnHover: true,
        draggable: true,
      });

      // 이전 페이지 또는 대시보드로 이동
      navigate(from, { replace: true });
      
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
      
      // 에러 메시지 처리
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/find-id" className="link">아이디 찾기</Link>
          <Link to="/find-password" className="link">비밀번호 찾기</Link>
          <Link to="/register" className="link">회원가입</Link>
        </div>

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
// frontend/src/pages/Login.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [loginId, setLoginId] = useState(''); // email 대신 loginId 사용
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginId.trim() || !password.trim()) {
      toast.error('아이디와 비밀번호를 입력해주세요.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(loginId, password);
      
      if (result.success) {
        toast.success('로그인 성공!', {
          position: "top-center",
          autoClose: 2000,
        });
        navigate('/dashboard');
      } else {
        toast.error(result.error, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error('로그인 중 오류가 발생했습니다.', {
        position: "top-right",
        autoClose: 5000,
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
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
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
          <Link to="/register" className="link-button">
            회원가입
          </Link>
          <Link to="/find-id" className="link-button">
            아이디 찾기
          </Link>
          <Link to="/find-password" className="link-button">
            비밀번호 찾기
          </Link>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
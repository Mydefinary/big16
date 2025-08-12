import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
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
      const response = await authAPI.login(formData);
      const { accessToken, refreshToken } = response.data;
      
      login(accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      // const message = err.response?.data?.message || '로그인에 실패했습니다.';
      const message =typeof err.response?.data === 'string' 
      ? err.response.data 
      : err.response?.data?.message || '로그인에 실패했습니다.'
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
      </div>

      {/* ToastContainer는 최상단에 한 번만 넣으면 됩니다 */}
      <ToastContainer />
    </div>
  );
};

export default Login;

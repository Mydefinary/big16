import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // 실시간 비밀번호 확인 검증
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      const password = e.target.name === 'password' ? e.target.value : formData.password;
      const confirmPassword = e.target.name === 'confirmPassword' ? e.target.value : formData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginId) newErrors.loginId = '아이디를 입력하세요.';
    if (!formData.email) newErrors.email = '이메일을 입력하세요.';
    if (!formData.nickname) newErrors.nickname = '이름을 입력하세요.';
    if (!formData.password) newErrors.password = '비밀번호를 입력하세요.';
    if (!formData.confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력하세요.';
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력하세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      await userAPI.register({
        loginId: formData.loginId,
        email: formData.email,
        nickname: formData.nickname,
        password: formData.password
      });
      
      // 회원가입 성공 시 이메일 인증 페이지로 이동
      navigate('/email-verification', { 
        state: { 
          email: formData.email,
          purpose: 'SIGN_UP_VERIFICATION',
          message: '회원가입이 완료되었습니다. 이메일로 발송된 인증코드를 입력해주세요.'
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data;
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('로그인 아이디')) {
          setErrors({ loginId: errorMessage });
        } else if (errorMessage.includes('이메일')) {
          setErrors({ email: errorMessage });
        } else {
          setErrors({ general: errorMessage });
        }
      } else {
        setErrors({ general: '회원가입에 실패했습니다.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>회원가입</h2>
        
        {errors.general && <div className="error-message">{errors.general}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginId">로그인 아이디</label>
            <input
              type="text"
              id="loginId"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              required
              placeholder="로그인 아이디를 입력하세요"
            />
            {errors.loginId && <div className="field-error">{errors.loginId}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="이메일을 입력하세요"
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="nickname">이름</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              placeholder="이름을 입력하세요"
            />
            {errors.nickname && <div className="field-error">{errors.nickname}</div>}
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
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="비밀번호를 다시 입력하세요"
            />
            {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading || Object.keys(errors).some(key => errors[key])}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

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

export default Register;
// Register.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const { name, value } = e.target;

    // 입력값 업데이트
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
      const password = name === 'password' ? value : formData.password;
      const confirmPassword = name === 'confirmPassword' ? value : formData.confirmPassword;

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
        if (confirmPassword && password !== confirmPassword) {
          copy.confirmPassword = '비밀번호가 일치하지 않습니다.';
        } else if (password && confirmPassword && password === confirmPassword) {
          delete copy.confirmPassword;
        }
        
        return copy;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginId) newErrors.loginId = '아이디를 입력하세요.';
    if (!formData.email) newErrors.email = '이메일을 입력하세요.';
    if (!formData.nickname) newErrors.nickname = '이름을 입력하세요.';
    if (!formData.password) newErrors.password = '비밀번호를 입력하세요.';
    if (!formData.confirmPassword) newErrors.confirmPassword = '비밀번호 확인을 입력하세요.';

    // 비밀번호 유효성 검사
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = '비밀번호는 8자리 이상이어야 합니다.';
      } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
        newErrors.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
      }
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력하세요.';
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

      toast.success('회원가입이 완료되었습니다!', {
        position: "top-center",
        autoClose: 3000,
      });

      // 회원가입 성공 후 이메일 인증 페이지로 이동
      navigate('/email-verification', {
        state: {
          email: formData.email,
          purpose: 'SIGN_UP_VERIFICATION',
          message: '회원가입이 완료되었습니다. 이메일로 발송된 인증코드를 입력해주세요.'
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || '회원가입에 실패했습니다.';

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });

      // 특정 필드 에러인 경우 해당 필드에 에러 표시 (선택적)
      if (typeof err.response?.data === 'string') {
        if (err.response.data.includes('로그인 아이디')) {
          setErrors({ loginId: err.response.data });
        } else if (err.response.data.includes('이메일')) {
          setErrors({ email: err.response.data });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>회원가입</h2>

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
            <label htmlFor="password">
              비밀번호
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
              value={formData.password}
              onChange={handleChange}
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
            disabled={loading || Object.values(errors).some(e => e)}
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

      <ToastContainer />
    </div>
  );
};

export default Register;
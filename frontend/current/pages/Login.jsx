// src/pages/Login.js
import React, { useState, useMemo } from "react";
import {api} from '@api/api'; // axios 인스턴스 (baseURL 등 설정된 상태)
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '@style/Login.css';
import { Link } from "react-router-dom";
import Stars from "@components/Stars";

// Register.jsx의 handleSubmit 함수에서
try {
  const response = await userAPI.register({
    loginId: formData.loginId,
    email: formData.email,
    nickname: formData.nickname,
    password: formData.password
  });

  // response.data가 문자열인 경우 처리
  const message = typeof response.data === 'string' 
    ? response.data 
    : response.data.message || '회원가입이 완료되었습니다!';

  toast.success(message, {
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
  // 에러 처리는 기존과 동일
}

  return (
    <div className="login-wrapper">
      <Stars />
      <header className="header">이미지 광고 서비스</header>
      <form className="login-container" onSubmit={handleSubmit}>
        <h2 className="login-title">로그인</h2>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="login-input"
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="비밀번호"
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button
            type="button"
            className="show-password-btn"
            onMouseDown={() => setShowPassword(true)}
            onMouseUp={() => setShowPassword(false)}
            onMouseLeave={() => setShowPassword(false)}
            aria-label="비밀번호 보기"
          >
            👁️
          </button>
        </div>

        <button type="submit" disabled={loading} className="login-button">
          {loading ? "로딩중..." : "로그인"}
        </button>

        <div className="login-footer">
          <Link to="/register">회원가입</Link> | <Link to="/password-reset">비밀번호 재설정</Link>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Login;

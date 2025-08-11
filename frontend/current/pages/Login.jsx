// src/pages/Login.js
import React, { useState, useMemo } from "react";
import {api} from '@api/api'; // axios 인스턴스 (baseURL 등 설정된 상태)
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '@style/Login.css';
import { Link } from "react-router-dom";
import Stars from "@components/Stars";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      toast.success("로그인 성공!");
      // TODO: 로그인 후 페이지 이동 등
    } catch (err) {
      // 서버에서 내려준 메시지 보여주기
      const msg =
        err.response?.data ||
        err.message ||
        "로그인 중 오류가 발생했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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

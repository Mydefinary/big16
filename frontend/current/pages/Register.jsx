// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { api } from '@api/api';
import "@style/Register.css";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import Stars from "@components/Stars";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    loginId: "",      // 로그인아이디 추가
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showCFPassword, setShowCFPassword] = useState(false);

  // 모달 상태 추가
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 비밀번호 유효성 검사 함수
  const validatePassword = (password) => {
    const lengthCheck = password.length >= 8;
    // const upperCheck = /[A-Z]/.test(password);
    const lowerCheck = /[a-z]/.test(password);
    const numberCheck = /[0-9]/.test(password);
    const specialCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // return lengthCheck && upperCheck && lowerCheck && numberCheck && specialCheck;
    return lengthCheck && lowerCheck && numberCheck && specialCheck;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.loginId.trim()) {
      toast.error("로그인 아이디를 입력하세요.");
      return;
    }

    if (!validatePassword(form.password)) {
      toast.error("비밀번호는 8자 이상, 소문자, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await api.post("/auth/register", {
        loginId: form.loginId,
        email: form.email,
        password: form.password,
        name: form.name,
      });
      setShowModal(true); // 모달 띄우기
    } catch (err) {
      const msg =
        err.response?.data || err.message || "회원가입 중 오류가 발생했습니다.";
      toast.error(msg);
    }
  };

  // 모달 확인 버튼 클릭 시
  const handleConfirm = () => {
    setShowModal(false);
    navigate("/login");
  };

  return (
    <div className="register-wrapper">
      <Stars />
      <header className="header">회원가입</header>
      <form className="register-container" onSubmit={handleSubmit}>
        <h2 className="register-title">계정을 생성하세요</h2>

        <input
          type="text"
          name="loginId"
          placeholder="로그인 아이디"
          className="register-input"
          value={form.loginId}
          onChange={handleChange}
          required
          autoFocus
        />
        <input
          type="text"
          name="name"
          placeholder="이름"
          className="register-input"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="이메일"
          className="register-input"
          value={form.email}
          onChange={handleChange}
          required
        />
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="비밀번호"
            className="register-input"
            value={form.password}
            onChange={handleChange}
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
        <div className="password-wrapper">
          <input
            type={showCFPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="비밀번호 확인"
            className="register-input"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="show-password-btn"
            onMouseDown={() => setShowCFPassword(true)}
            onMouseUp={() => setShowCFPassword(false)}
            onMouseLeave={() => setShowCFPassword(false)}
            aria-label="비밀번호 확인 보기"
          >
            👁️
          </button>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            뒤로가기
          </button>
          <button className="register-button" type="submit">
            가입하기
          </button>
        </div>

        <div className="register-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>
      </form>

      {/* 모달 영역 */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <p>회원가입 성공!</p>
            <p>이메일 인증을 확인하세요.</p>
            <button className="modal-confirm-btn" onClick={handleConfirm}>
              확인
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Register;

// src/pages/PasswordResetConfirm.js
import React, { useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import {api} from "@api/api";
import "@style/PasswordReset.css";
import Stars from "@components/Stars";

function PasswordResetConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm", { token, password });
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data || err.message || "오류가 발생했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="password-reset-wrapper">
        <Stars />
        <header className="header">잘못된 접근입니다.</header>
        <p style={{ padding: "20px", color: "#7d5a96" }}>
          유효하지 않은 토큰입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="password-reset-wrapper">
      <Stars />
      <header className="header">비밀번호 재설정</header>
      <form className="password-reset-container" onSubmit={handleSubmit}>
        <h2 className="password-reset-title">새 비밀번호를 입력하세요</h2>

        <input
          type="password"
          placeholder="새 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="password-reset-input"
        />

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="password-reset-input"
        />

        <button type="submit" disabled={loading} className="password-reset-button">
          {loading ? "변경중..." : "비밀번호 변경"}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PasswordResetConfirm;

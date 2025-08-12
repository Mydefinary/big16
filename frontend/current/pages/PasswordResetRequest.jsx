// src/pages/PasswordResetRequest.js
import React, { useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import { noAuthApi } from "@api/api";
import "@style/PasswordReset.css";
import Stars from "@components/Stars";


function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await noAuthApi.post("/auth/password-reset/request", { email });
      toast.success("비밀번호 재설정 메일이 발송되었습니다.");
    } catch (err) {
      const msg =
         err.response?.data?.message || err.response?.data || err.message || "오류가 발생했습니다.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-reset-wrapper">
      <Stars />
      <header className="header">비밀번호 재설정 요청</header>
      <form className="password-reset-container" onSubmit={handleSubmit}>
        <h2 className="password-reset-title">이메일을 입력하세요</h2>
        <input
          type="email"
          placeholder="등록된 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="password-reset-input"
        />
        <button type="submit" disabled={loading} className="password-reset-button">
          {loading ? "요청중..." : "재설정 메일 보내기"}
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PasswordResetRequest;

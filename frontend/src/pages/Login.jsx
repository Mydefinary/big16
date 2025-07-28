// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    try {
      const token = await login(email, password)
      localStorage.setItem('token', token)
      navigate('/dashboard') // 로그인 성공 시 이동할 경로
    } catch (err) {
      setError('로그인 실패. 이메일 또는 비밀번호를 확인하세요.')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto' }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}
        <button type="submit" style={{ marginTop: 20 }}>로그인</button>
      </form>
    </div>
  )
}

export default Login

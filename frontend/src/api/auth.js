// // src/api/auth.js
// import axios from 'axios'

// export const login = async (email, password) => {
//   const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/login`, {
//     email,
//     password,
//   })
//   return response.data.token // 백엔드에서 토큰 반환한다고 가정
// }

// src/api/auth.js 테스트용
export const login = async (email, password) => {
  // 테스트용 가짜 인증 로직
  if (email === 'test@example.com' && password === '1234') {
    return 'mock-jwt-token-123456' // 가짜 토큰 반환
  } else {
    throw new Error('Invalid credentials')
  }
}

// api.js

import axios from 'axios';

// API 기본 설정 (게이트웨이는 일반적으로 80포트에서 실행됨)
const API_BASE_URL = 'http://20.249.154.2/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키를 자동으로 포함
});

// 응답 인터셉터: 401 에러 시 로그인 페이지로 리다이렉트
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 쿠키 기반에서는 단순히 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // 쿠키 기반 인증 API
  login: (credentials) => api.post('/api/auths/login', credentials),
  logout: () => api.post('/api/auths/logout'),
  checkAuth: () => api.get('/api/auths/check'),
  
  // 기존 auth backend 직접 호출 API들
  safeLogin: (credentials) => api.post('/api/auths/safe-login', credentials),
  refreshToken: (refreshToken) => api.post('/api/auths/refresh', { refreshToken }),
  verifyCode: (email, code) => api.post('/api/auths/verify-code', { email, code }),
  resetPassword: (newPassword, emailToken) =>
    api.patch(
      '/api/auths/reset-password',
      { newPassword },
      {
        headers: {
          'X-User-Email': emailToken,
        },
      }
    ),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/api/auths/user/password-change', { currentPassword, newPassword }),
  resendCode: (email) => api.post('/api/auths/resend-code', { email }),
  checkEmail: (email) => api.post('/api/auths/check-email', { email }),
  checkLoginId: (loginId) => api.post('/api/auths/check-login-id', { loginId }),
};

// User API
export const userAPI = {
  register: (userData) => api.post('/api/users/register', userData),
  findId: (email) => api.get(`/api/users/find-id?email=${email}`),
  checkEmail: (email) => api.get(`/api/users/check-email?email=${email}`),
  deactivate: () => api.patch('/api/users/deactivate'),
};

export default api;
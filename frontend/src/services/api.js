// api.js

import axios from 'axios';

// API 기본 설정 (게이트웨이는 일반적으로 80포트에서 실행됨)
const API_BASE_URL = 'http://20.249.154.2/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 갱신 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // 토큰 갱신 요청 경로 수정
          const response = await axios.post(`${API_BASE_URL}api/auths/refresh`, {
            refreshToken: refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // AuthController의 실제 경로에 맞게 수정 (/auths)
  login: (credentials) => api.post('/api/auths/login', credentials),
  logout: (refreshToken) => api.post('/api/auths/logout', { refreshToken }),
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
  // 중복 확인 API 추가
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
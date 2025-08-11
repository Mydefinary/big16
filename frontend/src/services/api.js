import axios from 'axios';

// API 기본 설정
// ✅ [수정 없음] 기본 URL은 IP주소 자체가 맞습니다.
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
          // ✅ [수정] 토큰 갱신 요청 경로도 Ingress와 Gateway 규칙에 맞게 수정
          const response = await axios.post(`${API_BASE_URL}api/auth/refresh`, {
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
  // ✅ [수정] 모든 API 경로 앞에 /api/를 붙이고, Gateway 설정에 맞게 경로를 수정합니다.
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  verifyCode: (email, code) => api.post('/api/auth/verify-code', { email, code }),
  resetPassword: (newPassword, emailToken) =>
    api.patch(
      '/api/auth/reset-password',
      { newPassword },
      {
        headers: {
          'X-User-Email': emailToken,
        },
      }
    ),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/api/auth/password-change', { currentPassword, newPassword }),
  resendCode: (email) => api.post('/api/auth/resend-code', { email }),
};

// User API
export const userAPI = {
  // ✅ [수정] 모든 API 경로 앞에 /api/를 붙입니다.
  register: (userData) => api.post('/api/users/register', userData),
  findId: (email) => api.get(`/api/users/find-id?email=${email}`),
  checkEmail: (email) => api.get(`/api/users/check-email?email=${email}`),
  deactivate: () => api.patch('/api/users/deactivate'),
};

export default api;

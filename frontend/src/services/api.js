import axios from 'axios';

// API 기본 설정
const API_BASE_URL = 'https://improved-space-computing-machine-9gx9qqww4qv3p7rr-8088.app.github.dev'; // Gateway 주소

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
          const response = await axios.post(`${API_BASE_URL}/auths/refresh`, {
            refreshToken: refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // 리프레시 토큰도 만료된 경우 로그아웃
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
  login: (credentials) => api.post('/auths/login', credentials),
  logout: (refreshToken) => api.post('/auths/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auths/refresh', { refreshToken }),
  verifyCode: (email, code) => api.post('/auths/verify-code', { email, code }),
  // resetPassword: (email, newPassword) => api.patch('/auths/reset-password', { email, newPassword }),
  resetPassword: (newPassword, emailToken) =>
  api.patch(
    '/auths/reset-password',
    { newPassword },
    {
      headers: {
        'X-User-Email': emailToken, // Bearer 없이 토큰 문자열만
      },
    }
  ),
  changePassword: (currentPassword, newPassword) => 
    api.patch('/auths/user/password-change', { currentPassword, newPassword }),
  
  // 재발송 기능 추가
  resendCode: (email) => api.post('/auths/resend-code', { email }),
};

// User API
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  findId: (email) => api.get(`/users/find-id?email=${email}`),
  checkEmail: (email) => api.get(`/users/check-email?email=${email}`),
  deactivate: () => api.patch('/users/deactivate'),
};

export default api;
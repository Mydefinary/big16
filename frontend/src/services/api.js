import axios from 'axios';

// API 기본 설정
const API_BASE_URL = 'https://improved-space-computing-machine-9gx9qqww4qv3p7rr-8088.app.github.dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃 추가
});

// 토큰 갱신 중인지 추적하는 변수
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// 토큰 유효성 검사 함수
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // 5분 여유를 두고 체크
    return payload.exp > (currentTime + 300);
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// 토큰 갱신 함수
const refreshTokenFunction = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // 토큰 갱신 시 별도의 axios 인스턴스 사용 (무한루프 방지)
    const refreshResponse = await axios.post(`${API_BASE_URL}/auths/refresh`, {
      refreshToken: refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    // AuthContext에 새 토큰 알림
    window.dispatchEvent(new CustomEvent('tokenRefreshed', {
      detail: { accessToken, refreshToken: newRefreshToken }
    }));
    
    return accessToken;
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new CustomEvent('authRequired'));
    throw error;
  }
};

// 요청 인터셉터
api.interceptors.request.use(
  async (config) => {
    // 디버깅 로그
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      if (isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Valid token added to request');
      } else {
        console.log('⚠️ Token expired, attempting refresh...');
        
        if (isRefreshing) {
          // 이미 토큰 갱신 중이면 대기
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        try {
          const newToken = await refreshTokenFunction();
          processQueue(null, newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
          console.log('✅ Token refreshed and added to request');
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    } else {
      console.log('❌ No token found');
      // 인증이 필요한 엔드포인트인지 확인
      const publicEndpoints = [
        '/auths/login',
        '/auths/refresh',
        '/auths/verify-code',
        '/auths/reset-password',
        '/auths/resend-code',
        '/users/register',
        '/users/check-email',
        '/users/find-id'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url.includes(endpoint)
      );
      
      if (!isPublicEndpoint) {
        window.dispatchEvent(new CustomEvent('authRequired'));
        return Promise.reject(new Error('No authentication token'));
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error: ${error.response?.status} ${originalRequest?.url}`, error.response?.data);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await refreshTokenFunction();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
  resetPassword: (newPassword, emailToken) =>
    api.patch(
      '/auths/reset-password',
      { newPassword },
      {
        headers: {
          'X-User-Email': emailToken,
        },
      }
    ),
  changePassword: (currentPassword, newPassword) => 
    api.patch('/auths/user/password-change', { currentPassword, newPassword }),
  resendCode: (email) => api.post('/auths/resend-code', { email }),
};

// User API
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  findId: (email) => api.get(`/users/find-id?email=${email}`),
  checkEmail: (email) => api.get(`/users/check-email?email=${email}`),
  deactivate: () => {
    console.log('🗑️ Attempting account deletion...');
    return api.patch('/users/deactivate');
  },
};

export default api;
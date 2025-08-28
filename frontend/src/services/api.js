// /src/services/api.js

import axios from 'axios';

// API 기본 설정
const API_BASE_URL = 'http://20.249.113.18:9000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ 쿠키 포함
  timeout: 10000,
});

// 토큰 갱신 중인지 추적하는 변수
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, success = false) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  });
  
  failedQueue = [];
};

// 토큰 갱신 함수 (쿠키 기반)
const refreshTokenFunction = async () => {
  try {
    console.log('🔄 토큰 갱신 시도 중...');
    
    const refreshResponse = await axios.post(
      `${API_BASE_URL}/auths/refresh`, 
      {}, // 빈 body (서버에서 쿠키의 refreshToken 확인)
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    console.log('✅ 토큰 갱신 성공');
    
    // AuthContext에 토큰 갱신 알림
    window.dispatchEvent(new CustomEvent('tokenRefreshed'));
    
    return true;
  } catch (error) {
    console.error('❌ 토큰 갱신 실패:', error.response?.data || error.message);
    
    // AuthContext에 로그아웃 알림
    window.dispatchEvent(new CustomEvent('authRequired'));
    throw error;
  }
};

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    console.log(`🔍 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // POST, PUT, PATCH, DELETE 요청에 CSRF 토큰 추가
    // if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    //   const csrfToken = window.generateCSRFToken?.();
    //   if (csrfToken) {
    //     config.headers['X-CSRF-Token'] = csrfToken;
    //     console.log('🎫 CSRF Token added, length:', csrfToken.length);
    //   } else {
    //     console.warn('⚠️ CSRF Token not available');
    //   }
    // }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
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
      // 공개 엔드포인트는 토큰 갱신 시도하지 않음
      const publicEndpoints = ['/auths/login', '/auths/refresh', '/users/register'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        originalRequest.url?.includes(endpoint)
      );
      
      if (isPublicEndpoint) {
        console.log('🔓 공개 엔드포인트 오류 - 토큰 갱신 시도하지 않음');
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      if (isRefreshing) {
        console.log('⏳ 토큰 갱신 대기 중...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        await refreshTokenFunction();
        processQueue(null, true);
        
        console.log('🔄 원본 요청 재시도');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ 토큰 갱신 실패, 모든 대기 중인 요청 거부');
        processQueue(refreshError, false);
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
 login: (credentials) => {
   console.log('🔐 로그인 시도:', credentials?.loginId);
   if (!credentials) {
     return Promise.reject(new Error('로그인 정보가 필요합니다'));
   }
   return api.post('/auths/login', credentials);
 },
 
 logout: () => {
   console.log('🚪 로그아웃 시도');
   return api.post('/auths/logout');
 },
 
 me: () => {
   console.log('👤 사용자 정보 조회');
   return api.get('/auths/me');
 },
 
 refreshToken: () => {
   console.log('🔄 토큰 갱신 API 직접 호출');
   return api.post('/auths/refresh', {}); // 빈 body
 },
 
 verifyCode: (email, code) => {
   console.log('🔢 인증 코드 검증:', email);
   return api.post('/auths/verify-code', { email, code });
 },
 
 resetPassword: (newPassword) => {
  console.log('🔑 비밀번호 재설정');
  return api.patch('/auths/reset-password', { newPassword });
 },
 
 changePassword: (currentPassword, newPassword) => {
   console.log('🔐 비밀번호 변경');
   return api.patch('/auths/user/password-change', { 
     currentPassword, 
     newPassword 
   });
 },
 
 resendCode: (email) => {
   console.log('📧 인증 코드 재발송:', email);
   return api.post('/auths/resend-code', { email });
 },

 changeUserRole: (targetUserId, newRole) => {
   console.log('👑 사용자 권한 변경:', targetUserId, '->', newRole);
   return api.patch('/auths/role-change', { 
     targetUserId, 
     newRole 
   });
 },

 registerCompany: (companyData) => {
   console.log('🏢 회사 등록 시도:', companyData?.companyName);
   if (!companyData || !companyData.companyName) {
     return Promise.reject(new Error('회사명이 필요합니다'));
   }
   return api.post('/auths/register-company', companyData);
 },

 // 새로 추가: 관리자 전용 사용자 목록 조회
 getUsers: () => {
   console.log('👥 관리자 사용자 목록 조회');
   return api.get('/auths/admin/users');
 },
};

// User API
export const userAPI = {
 register: (userData) => {
   console.log('👤 회원가입 시도:', userData?.email);
   if (!userData) {
     return Promise.reject(new Error('회원가입 정보가 필요합니다'));
   }
   return api.post('/users/register', userData);
 },
 
 findId: (email) => {
   console.log('🔍 아이디 찾기:', email);
   return api.get(`/users/find-id?email=${email}`);
 },
 
 checkEmail: (email) => {
   console.log('📧 이메일 중복 확인:', email);
   return api.get(`/users/check-email?email=${email}`);
 },
 
 deactivate: () => {
   console.log('🗑️ 계정 비활성화 시도');
   return api.patch('/users/deactivate');
 },
 
};

export default api;
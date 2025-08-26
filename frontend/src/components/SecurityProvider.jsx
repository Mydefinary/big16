import React, { useEffect, useState, createContext, useContext, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 보안 컨텍스트 생성
const SecurityContext = createContext();

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

// 허용된 라우트 목록 (화이트리스트)
const ALLOWED_ROUTES = [
  '/',
  '/login',
  '/register',
  '/email-verification',
  '/find-id',
  '/find-password',
  '/notice-board',
  '/dashboard',
  '/mypage',
  '/chat-bot',
  '/webtoon-highlight-creator',
  '/webtoon-ppl-generator',
  '/webtoon-goods-generator',
  '/webtoon-dashboard',
  '/faq'
];

// 보안 설정
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30분
  RATE_LIMIT_REQUESTS: 300,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1분
  BLOCK_DURATION: 5 * 60 * 1000, // 5분
};

const SecurityProvider = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // 🔥 무한루프 방지를 위한 ref들
  const isInitializedRef = useRef(false);
  const lastLocationRef = useRef(null);
  const isNavigatingRef = useRef(false);
  
  // localStorage에서 보안 상태 불러오기
  const getStoredSecurityState = useCallback(() => {
    try {
      const stored = localStorage.getItem('securityState');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // 차단이 해제되었는지 확인
        if (parsed.isBlocked && parsed.blockEndTime && now > parsed.blockEndTime) {
          return {
            isBlocked: false,
            loginAttempts: parsed.loginAttempts || 0,
            lastActivity: now,
            requestCount: 0,
            rateLimitResetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
            blockEndTime: null
          };
        }
        
        // 레이트 리미팅 윈도우가 지났으면 요청 카운트만 리셋
        if (now > parsed.rateLimitResetTime) {
          return {
            ...parsed,
            requestCount: 0,
            rateLimitResetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
            lastActivity: now
          };
        }
        
        return {
          ...parsed,
          lastActivity: now
        };
      }
    } catch (error) {
      console.warn('Failed to load security state:', error);
    }
    
    return {
      isBlocked: false,
      loginAttempts: 0,
      lastActivity: Date.now(),
      requestCount: 0,
      rateLimitResetTime: Date.now() + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
      blockEndTime: null
    };
  }, []); // 빈 의존성 배열

  const [securityState, setSecurityState] = useState(() => getStoredSecurityState());

  // 🔥 보안 상태 업데이트 - 불필요한 재렌더링 방지
  const updateSecurityState = useCallback((updater) => {
    setSecurityState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : updater;
      
      // 🔥 상태가 실제로 변경된 경우에만 localStorage 저장
      if (JSON.stringify(newState) !== JSON.stringify(prev)) {
        try {
          localStorage.setItem('securityState', JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save security state:', error);
        }
        return newState;
      }
      return prev; // 변경사항이 없으면 이전 상태 반환
    });
  }, []);

  // 라우트 검증 함수
  const isValidRoute = useCallback((pathname) => {
    // 정확한 경로 매칭
    if (ALLOWED_ROUTES.includes(pathname)) {
      return true;
    }
    
    // 동적 라우트 허용
    const dynamicRoutePatterns = [
      /^\/webtoon\/[a-zA-Z0-9-]+$/,
      /^\/user\/[a-zA-Z0-9-]+$/,
      /^\/board\/[a-zA-Z0-9-]+$/
    ];
    
    return dynamicRoutePatterns.some(pattern => pattern.test(pathname));
  }, []);

  // XSS 방지 - 입력값 검증 및 정제
  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }, []);

  // CSRF 토큰 생성
  const generateCSRFToken = useCallback(() => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }, []);

  // 🔥 레이트 리미팅 - 중복 호출 방지
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // 차단 상태인지 먼저 확인
    if (securityState.isBlocked && securityState.blockEndTime && now <= securityState.blockEndTime) {
      return false;
    }
    
    // 차단이 해제되었다면 상태 업데이트
    if (securityState.isBlocked && securityState.blockEndTime && now > securityState.blockEndTime) {
      updateSecurityState({
        ...securityState,
        isBlocked: false,
        requestCount: 1,
        rateLimitResetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
        blockEndTime: null
      });
      return true;
    }
    
    // 레이트 리미팅 윈도우가 지났으면 카운트 리셋
    if (now > securityState.rateLimitResetTime) {
      updateSecurityState({
        ...securityState,
        requestCount: 1,
        rateLimitResetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    // 요청 한도 초과 확인
    if (securityState.requestCount >= SECURITY_CONFIG.RATE_LIMIT_REQUESTS) {
      return false;
    }
    
    // 요청 카운트 증가
    updateSecurityState(prev => ({
      ...prev,
      requestCount: prev.requestCount + 1
    }));
    return true;
  }, [securityState, updateSecurityState]);

  // 🔥 세션 타임아웃 체크 - 중복 실행 방지
  const checkSessionTimeout = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - securityState.lastActivity;
    
    if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
      // 🔥 중복 실행 방지
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        logout();
        localStorage.removeItem('securityState');
        sessionStorage.removeItem('initialLoadDone');
        navigate('/login', { replace: true });
      }
      return false;
    }
    
    return true;
  }, [securityState.lastActivity, logout, navigate]);

  // 활동 추적
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    // 🔥 마지막 활동 시간이 실제로 변경된 경우에만 업데이트
    if (Math.abs(now - securityState.lastActivity) > 1000) { // 1초 이상 차이날 때만
      updateSecurityState(prev => ({
        ...prev,
        lastActivity: now
      }));
    }
  }, [securityState.lastActivity, updateSecurityState]);

  // 로그인 시도 추적
  const recordLoginAttempt = useCallback((success = false) => {
    if (success) {
      updateSecurityState(prev => ({ ...prev, loginAttempts: 0 }));
    } else {
      updateSecurityState(prev => ({
        ...prev,
        loginAttempts: prev.loginAttempts + 1
      }));
    }
  }, [updateSecurityState]);

  // 보안 헤더 설정
  const setSecurityHeaders = useCallback(() => {
    const setMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[${name.includes('http-equiv') ? 'http-equiv' : 'name'}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (name.includes('http-equiv')) {
          meta.httpEquiv = name;
        } else {
          meta.name = name;
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // CSP 설정
    setMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://api.yourdomain.com;"
    );

    setMetaTag('X-Content-Type-Options', 'nosniff');
    setMetaTag('X-Frame-Options', 'DENY');
    setMetaTag('X-XSS-Protection', '1; mode=block');
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
  }, []);

  // 민감한 데이터 로깅 방지
  const securePrint = useCallback((...args) => {
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized = { ...arg };
        ['password', 'token', 'secret', 'key', 'auth'].forEach(field => {
          if (sanitized[field]) {
            sanitized[field] = '***MASKED***';
          }
        });
        return sanitized;
      }
      return arg;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURE]', ...sanitizedArgs);
    }
  }, []);

  // 🔥 초기화 - 한 번만 실행
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      setSecurityHeaders();
      updateLastActivity();
      
      // 전역에서 사용할 수 있도록 노출
      // window.generateCSRFToken = generateCSRFToken;
      
      // console.log('✅ SecurityProvider initialized');
      // console.log('✅ window.generateCSRFToken:', typeof window.generateCSRFToken);
      // console.log('✅ Test token:', window.generateCSRFToken());
    }
  }, [setSecurityHeaders, updateLastActivity]);

  // 🔥 라우트 변경 시 보안 검증 - 중복 검증 방지
  useEffect(() => {
    const currentPath = location.pathname;
    
    // 🔥 같은 경로로의 중복 검증 방지
    if (lastLocationRef.current === currentPath) {
      return;
    }
    
    lastLocationRef.current = currentPath;
    isNavigatingRef.current = false; // 네비게이션 플래그 리셋
    
    // 라우트 검증
    if (!isValidRoute(currentPath)) {
      securePrint('Invalid route detected:', currentPath);
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        navigate('/', { replace: true });
      }
      return;
    }

    // 세션 타임아웃 체크
    if (!checkSessionTimeout()) {
      return;
    }
    
    // 활동 추적
    updateLastActivity();
    
    // 🔥 초기 로드 체크 개선
    const isInitialLoad = !sessionStorage.getItem('initialLoadDone');
    if (isInitialLoad) {
      sessionStorage.setItem('initialLoadDone', 'true');
      console.log('Initial load completed');
    } else {
      // 초기 로드가 아닌 경우에만 레이트 리미팅 체크
      if (!checkRateLimit()) {
        const now = Date.now();
        updateSecurityState(prev => ({ 
          ...prev,
          isBlocked: true,
          blockEndTime: now + SECURITY_CONFIG.BLOCK_DURATION
        }));
        securePrint('Rate limit exceeded on route change');
      }
    }

  }, [location.pathname, isValidRoute, checkSessionTimeout, updateLastActivity, checkRateLimit, updateSecurityState, navigate, securePrint]);

  // 🔥 타이머 관리 - 메모리 누수 방지
  useEffect(() => {
    // 1초마다 현재 시간 업데이트 (차단 화면 카운트다운용)
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    // 페이지 이탈 시 민감한 데이터 정리
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('initialLoadDone');
      
      if (window.performance && window.performance.clearResourceTimings) {
        window.performance.clearResourceTimings();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 보안 상태가 차단된 경우
  if (securityState.isBlocked && securityState.blockEndTime) {
    const timeLeft = securityState.blockEndTime ? 
      Math.max(0, Math.ceil((securityState.blockEndTime - currentTime) / 1000)) : 0;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        <h2>접근이 일시적으로 제한되었습니다</h2>
        <p>보안상의 이유로 접근이 차단되었습니다.</p>
        <p>현재 요청 수: {securityState.requestCount}/{SECURITY_CONFIG.RATE_LIMIT_REQUESTS}</p>
        <p style={{ fontSize: '18px', color: '#dc3545', fontWeight: 'bold' }}>
          {timeLeft > 0 ? `${timeLeft}초 후 자동 해제됩니다` : '잠시만 기다려주세요...'}
        </p>
        <button 
          onClick={() => {
            localStorage.removeItem('securityState');
            sessionStorage.removeItem('initialLoadDone');
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          보안 상태 리셋 후 재시작
        </button>
      </div>
    );
  }

  const securityValue = {
    sanitizeInput,
    generateCSRFToken,
    recordLoginAttempt,
    updateLastActivity,
    checkRateLimit,
    securePrint,
    securityState
  };

  return (
    <SecurityContext.Provider value={securityValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityProvider;
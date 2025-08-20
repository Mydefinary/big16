# Gateway 라우팅 설정 상세 가이드

LEE Namespace의 Spring Cloud Gateway 라우팅 설정에 대한 상세 가이드입니다.

## 🚪 Gateway 라우팅 아키텍처

### 현재 Gateway 설정 (참고)
```yaml
# 기존 라우팅 맵 (수정 금지)
routes:
  - id: auth-routes
    uri: lb://auth-backend-service
    predicates:
      - Path=/auths/**
    filters:
      - RewritePath=/auths/(?<path>.*), /$\{path}

  - id: webtoon-frontend-routes  
    uri: lb://webtoon-dashboard-frontend-service
    predicates:
      - Path=/webtoon/**
    filters:
      - RewritePath=/webtoon/(?<path>.*), /$\{path}

  - id: webtoon-api-routes
    uri: lb://webtoon-dashboard-backend-service  
    predicates:
      - Path=/webtoon-api/**
    filters:
      - RewritePath=/webtoon-api/(?<path>.*), /$\{path}

  - id: board-frontend-routes
    uri: lb://board-frontend-service
    predicates:
      - Path=/board/**
    filters:
      - RewritePath=/board/(?<path>.*), /$\{path}

  - id: board-api-routes
    uri: lb://board-backend-service
    predicates:
      - Path=/board-api/**  
    filters:
      - RewritePath=/board-api/(?<path>.*), /$\{path}

  - id: default-routes
    uri: lb://auth-frontend-service
    predicates:
      - Path=/**
    order: 999  # 가장 낮은 우선순위
```

## 🔄 라우팅 변환 로직

### Path Rewrite 패턴
Gateway는 **Path Rewrite** 방식으로 요청을 변환합니다:

```yaml
클라이언트 요청 → Gateway 변환 → 서비스 전달

예시 1: Frontend 라우팅
요청: GET /webtoon/dashboard
변환: RewritePath=/webtoon/(?<path>.*), /${path}  
결과: GET /dashboard (to webtoon-dashboard-frontend-service)

예시 2: Backend API 라우팅  
요청: POST /webtoon-api/api/stats
변환: RewritePath=/webtoon-api/(?<path>.*), /${path}
결과: POST /api/stats (to webtoon-dashboard-backend-service)
```

### 중요한 이해사항
```yaml
⚠️ 핵심 포인트:
1. Gateway는 경로의 prefix만 제거합니다
2. 서비스는 제거된 경로로 요청을 받습니다
3. 따라서 서비스의 엔드포인트 경로가 중요합니다!

잘못된 이해:
- Gateway가 /webtoon-api를 그대로 전달 ❌

올바른 이해:  
- Gateway가 /webtoon-api를 제거하고 나머지만 전달 ✅
```

## 📍 서비스별 엔드포인트 설계

### Frontend 서비스 엔드포인트
```yaml
Gateway 라우팅: /webtoon/**
서비스에서 받는 경로: /*

nginx 설정 예시:
location /webtoon {
    alias /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}

React Router 설정:
- basename: "/webtoon"  
- 또는 package.json: "homepage": "/webtoon"
```

### Backend 서비스 엔드포인트
```yaml
Gateway 라우팅: /webtoon-api/**  
서비스에서 받는 경로: /*

FastAPI 엔드포인트 설계:
@app.get("/api/webtoons")          # Gateway에서 /webtoon-api/api/webtoons로 접근
@app.get("/api/stats")             # Gateway에서 /webtoon-api/api/stats로 접근
@app.post("/api/recommendations")  # Gateway에서 /webtoon-api/api/recommendations로 접근

Spring Boot 엔드포인트 설계:
@GetMapping("/api/webtoons")       # Gateway에서 /webtoon-api/api/webtoons로 접근
@PostMapping("/api/recommendations") # Gateway에서 /webtoon-api/api/recommendations로 접근
```

## 🎯 새 서비스 라우팅 설계

### 1. 서비스명 결정
```yaml
서비스명: chatbot
Frontend 라우팅: /chatbot/**
Backend 라우팅: /chatbot-api/**
```

### 2. Frontend 설정
```javascript
// package.json
{
  "homepage": "/chatbot"
}

// nginx.conf  
location /chatbot {
    alias /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}

// React Router
<BrowserRouter basename="/chatbot">
  <Routes>
    <Route path="/" element={<ChatInterface />} />
    <Route path="/history" element={<ChatHistory />} />
  </Routes>
</BrowserRouter>
```

### 3. Backend 설정
```python
# FastAPI 예시
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/chat")              # 접근: /chatbot-api/api/chat
async def get_chat_history():
    pass

@app.post("/api/chat")             # 접근: /chatbot-api/api/chat  
async def send_message():
    pass

@app.get("/api/health")            # 접근: /chatbot-api/api/health
async def health_check():
    return {"status": "ok"}
```

```java
// Spring Boot 예시  
@RestController
@RequestMapping("/api")
public class ChatController {
    
    @GetMapping("/chat")           // 접근: /chatbot-api/api/chat
    public ResponseEntity<?> getChatHistory() {
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/chat")          // 접근: /chatbot-api/api/chat
    public ResponseEntity<?> sendMessage() {
        return ResponseEntity.ok().build();
    }
}
```

## 🔐 JWT 인증 통합

### Gateway 인증 필터
```yaml
Gateway의 JWT 필터는 다음 경로들을 검증합니다:
- /webtoon-api/**  (웹툰 대시보드 API)
- /board-api/**    (게시판 API)  
- /chatbot-api/**  (챗봇 API - 신규)
- /{service}-api/** (모든 비즈니스 API)

인증 제외 경로:
- /auths/login
- /auths/register  
- /**/health
- / (메인 페이지)
```

### Frontend JWT 처리
```javascript
// 공통 API 클라이언트
const apiClient = {
  async request(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // 토큰 만료 시 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      window.location.href = '/';
      return;
    }

    return response;
  }
};

// 사용 예시
const chatHistory = await apiClient.request('/chatbot-api/api/chat');
```

### Backend JWT 검증
```python
# FastAPI JWT 미들웨어
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    try:
        # Gateway에서 이미 검증된 토큰이지만 추가 검증 가능
        payload = jwt.decode(token.credentials, verify=False)
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/chat")
async def get_chat(user = Depends(verify_token)):
    # 인증된 사용자 정보 사용
    user_id = user.get("sub")
    return {"user_id": user_id}
```

## 🛠️ 라우팅 테스트 가이드

### 1. 로컬 테스트
```bash
# Frontend 접근 테스트
curl http://20.249.113.18:9000/webtoon/
curl http://20.249.113.18:9000/chatbot/

# Backend API 테스트  
curl http://20.249.113.18:9000/webtoon-api/api/health
curl http://20.249.113.18:9000/chatbot-api/api/health

# JWT 인증 필요한 API 테스트
curl -H "Authorization: Bearer <token>" \
     http://20.249.113.18:9000/webtoon-api/api/stats
```

### 2. 브라우저 개발자 도구 확인
```javascript
// 콘솔에서 네트워크 요청 확인
console.log('현재 페이지:', window.location.pathname);

// API 요청 테스트
fetch('/chatbot-api/api/health')
  .then(r => r.json())
  .then(console.log);
```

### 3. Kubernetes 내부 테스트
```bash
# Gateway 서비스 확인
kubectl get services -n lee | grep gateway

# 서비스 간 통신 테스트
kubectl exec -it <gateway-pod> -n lee -- curl http://chatbot-backend-service:8003/api/health
```

## ⚠️ 라우팅 관련 주의사항

### 1. 경로 충돌 방지
```yaml
❌ 피해야 할 패턴:
- /api/** (너무 광범위)
- /chat/** (다른 서비스와 겹칠 수 있음)
- /{service}/** 와 /{service}-api/** 가 다른 서비스를 가리키는 경우

✅ 올바른 패턴:
- /{unique-service-name}/**  
- /{unique-service-name}-api/**
- 고유하고 명확한 서비스명 사용
```

### 2. Path Priority 관리
```yaml
Gateway 라우팅 우선순위:
1. 더 구체적인 경로가 우선
2. Order 값이 낮을수록 우선 (기본값: 0)  
3. 와일드카드 경로는 가장 마지막

올바른 순서:
- /webtoon-api/** (구체적)
- /webtoon/** (덜 구체적)  
- /** (가장 일반적, order: 999)
```

### 3. CORS 설정
```yaml
Gateway에서 CORS는 자동 처리되지만, 
개발 환경에서는 추가 설정이 필요할 수 있습니다:

Backend CORS 설정:
- Origin: http://20.249.113.18:9000
- Methods: GET, POST, PUT, DELETE
- Headers: Authorization, Content-Type
```

## 📚 참고 자료

### 성공 사례: 웹툰 대시보드
```yaml
라우팅 설계:
- Frontend: /webtoon/** → webtoon-dashboard-frontend-service:80
- Backend: /webtoon-api/** → webtoon-dashboard-backend-service:8002

실제 엔드포인트:  
- /webtoon-api/api/webtoons
- /webtoon-api/api/stats
- /webtoon-api/api/analysis/tags

장점:
- 명확한 서비스 구분
- JWT 인증 완벽 통합  
- Gateway 설정 변경 없이 구현
```

### 실패 사례들
```yaml
1. API 경로 중복 문제:
   문제: /webtoon-api/api/api/stats (api 중복)
   해결: /webtoon-api/api/stats

2. 기본 경로 불일치:  
   문제: 코드에서 /webtoon-dashboard/api/* 사용
   해결: /webtoon-api/api/* 로 수정

3. Docker 캐시 문제:
   문제: 수정된 코드가 이미지에 반영되지 않음
   해결: --no-cache 옵션으로 재빌드
```

---

**이 가이드를 통해 LEE Namespace의 Gateway 라우팅을 완벽하게 이해하고 활용할 수 있습니다.**

**문서 버전**: v1.0  
**마지막 업데이트**: 2025-08-20

🤖 Generated with [Claude Code](https://claude.ai/code)
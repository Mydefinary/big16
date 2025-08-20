# Kubernetes 서비스 추가 가이드라인 (Lee Namespace)

Azure AKS의 lee namespace에서 새로운 서비스를 추가할 때 따라야 할 가이드라인입니다.

## 🎯 개요

본 가이드는 **chatbot-lee 서비스**를 성공적으로 구현한 경험을 바탕으로, 다른 서비스들이 동일한 패턴을 따라 lee namespace에 원활하게 추가될 수 있도록 작성되었습니다.

## 📋 서비스 아키텍처 패턴

### 전체 구조
```
Internet → Gateway (20.249.113.18:9000) → Internal Services

lee namespace:
├── Gateway Service (라우팅 담당)
├── Auth Services (인증 시스템)
├── Business Services (각종 비즈니스 로직)
└── Infrastructure Services (DB, Message Queue)
```

## 🔧 서비스 추가 체크리스트

### 1. 명명 규칙 (Naming Convention)

**✅ chatbot-lee 성공 사례**:
- **서비스명**: `question-*-service-lee-2`
- **배포명**: `question-*-deployment-lee-2`
- **컨테이너명**: `question-*-container-lee-2`

**📏 권장 패턴**:
```yaml
# 서비스 이름 패턴
{service-name}-{component}-service-lee-{version}
{service-name}-{component}-deployment-lee-{version}
{service-name}-{component}-container-lee-{version}

# 예시: 새로운 analytics 서비스
analytics-backend-service-lee-2
analytics-frontend-service-lee-2
analytics-backend-deployment-lee-2
```

### 2. Gateway 라우팅 설정

**✅ chatbot-lee 성공 사례**:
```yaml
# Frontend 라우팅
- id: question-frontend
  uri: http://question-frontend-service-lee-2:80
  predicates:
    - Path=/question/**

# Backend API 라우팅  
- id: question-backend
  uri: http://question-backend-service-lee-2:8083
  predicates:
    - Path=/question-api/**
```

**📏 새 서비스 추가 패턴**:
```yaml
# analytics 서비스 예시
- id: analytics-frontend
  uri: http://analytics-frontend-service-lee-2:80
  predicates:
    - Path=/analytics/**

- id: analytics-backend
  uri: http://analytics-backend-service-lee-2:8080
  predicates:
    - Path=/analytics-api/**
```

### 3. Frontend 설정 요구사항

#### A. Vite 설정 (vite.config.mts)
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-service/',  // ⚠️ Gateway Path와 정확히 일치
  server: {
    host: true,
    port: 3000,
  },
})
```

#### B. Package.json
```json
{
  "name": "your-service-frontend",
  "homepage": "/your-service",  // ⚠️ base와 일치
}
```

#### C. Nginx 설정 (nginx.conf)
```nginx
server {
  listen 80;

  # ⚠️ 중요: 다른 서비스의 성공적인 패턴 사용
  location /your-service {
    alias /usr/share/nginx/html;
    index index.html index.htm;

    # 정적 파일 캐시
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files $uri =404;
    }

    # SPA fallback
    try_files $uri /your-service/index.html;
  }

  location / {
    return 301 /your-service/;
  }
}
```

#### D. API 호출 설정
```typescript
// ⚠️ 중요: baseURL 제거하고 직접 Gateway 경로 사용
const api = useMemo(() => 
  axios.create({ 
    baseURL: "",  // 비워두기!
    timeout: 20000, 
    headers: { "Content-Type": "application/json" } 
  }), []);

// API 호출
await api.post("/your-service-api/endpoint", data);
```

### 4. Backend 설정 요구사항

#### A. FastAPI 엔드포인트 정의
```python
from fastapi import FastAPI

app = FastAPI()

# ⚠️ 중요: Gateway 경로와 일치하는 prefix 사용
@app.post("/your-service-api/endpoint")
async def your_endpoint(request: YourRequest):
    return {"result": "success"}

# Health check
@app.get("/your-service-api/health")
async def health():
    return {"status": "ok"}
```

#### B. 포트 설정
```python
# main.py 또는 실행 명령
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)  # 포트 명시
```

### 5. Kubernetes 리소스 설정

#### A. Deployment (고성능 서비스용)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-service-backend-deployment-lee-2
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: your-service-backend-lee-2
  template:
    metadata:
      labels:
        app: your-service-backend-lee-2
    spec:
      # ⚠️ 고성능 서비스는 ragpool 노드 사용
      nodeSelector:
        agentpool: ragpool
      containers:
      - name: your-service-backend-container-lee-2
        image: kt16big.azurecr.io/your-service-backend-lee-2:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "4"
```

#### B. Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: your-service-backend-service-lee-2
  namespace: lee
spec:
  selector:
    app: your-service-backend-lee-2
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

## 🔍 검증 및 테스트

### 1. 배포 전 체크리스트
- [ ] Gateway 라우팅 경로와 Frontend base 일치
- [ ] Backend 엔드포인트 prefix와 Gateway API 경로 일치
- [ ] 서비스명 명명 규칙 준수
- [ ] Nginx 설정이 다른 성공 서비스 패턴과 일치
- [ ] 포트 충돌 없음 확인

### 2. 배포 후 검증
```bash
# 1. Pod 상태 확인
kubectl get pods -n lee | grep your-service

# 2. Service 엔드포인트 확인
kubectl get endpoints -n lee | grep your-service

# 3. Frontend 접근 테스트
curl -I http://20.249.113.18:9000/your-service

# 4. API 엔드포인트 테스트
curl -X POST http://20.249.113.18:9000/your-service-api/health

# 5. 로그 확인
kubectl logs -n lee deployment/your-service-backend-deployment-lee-2
```

## ⚠️ 일반적인 함정들

### 1. Frontend 관련
```typescript
// ❌ 이렇게 하지 마세요
const api = axios.create({ baseURL: "/api" }); // 405 오류 발생!
await api.post("/your-service-api/endpoint");

// ✅ 올바른 방법
const api = axios.create({ baseURL: "" });
await api.post("/your-service-api/endpoint");
```

### 2. Nginx 설정
```nginx
# ❌ 이렇게 하지 마세요 (정적 파일 404 오류)
location / {
  root /usr/share/nginx/html;
  try_files $uri /index.html;
}

# ✅ 올바른 방법 (중첩 location 블록 사용)
location /your-service {
  alias /usr/share/nginx/html;
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    try_files $uri =404;
  }
  try_files $uri /your-service/index.html;
}
```

### 3. Backend 엔드포인트
```python
# ❌ 이렇게 하지 마세요 (404 오류)
@app.post("/endpoint")  # Gateway 경로와 불일치

# ✅ 올바른 방법
@app.post("/your-service-api/endpoint")  # Gateway 경로와 일치
```

## 🚀 배포 워크플로우

### 1. 개발 단계
```bash
# Local 개발 서버 실행
cd frontend && npm run dev
cd backend && uvicorn main:app --reload
```

### 2. 빌드 단계
```bash
# Frontend 빌드
cd frontend
npm run build
docker build -t kt16big.azurecr.io/your-service-frontend-lee-2:latest .

# Backend 빌드  
cd backend
docker build -t kt16big.azurecr.io/your-service-backend-lee-2:latest .
```

### 3. 배포 단계
```bash
# 이미지 푸시
docker push kt16big.azurecr.io/your-service-frontend-lee-2:latest
docker push kt16big.azurecr.io/your-service-backend-lee-2:latest

# Kubernetes 배포
kubectl set image deployment/your-service-frontend-deployment-lee-2 \
  your-service-frontend-container-lee-2=kt16big.azurecr.io/your-service-frontend-lee-2:latest -n lee

kubectl set image deployment/your-service-backend-deployment-lee-2 \
  your-service-backend-container-lee-2=kt16big.azurecr.io/your-service-backend-lee-2:latest -n lee
```

## 📊 성공 사례: chatbot-lee

본 가이드는 chatbot-lee 서비스의 성공적인 구현을 바탕으로 작성되었습니다:

- ✅ **Gateway 라우팅**: `/question/**` ↔ `/question-api/**`
- ✅ **서비스 명명**: question-*-service-lee-2 패턴
- ✅ **Frontend 설정**: base: '/question/' 설정
- ✅ **Backend 엔드포인트**: /question-api/* prefix 사용
- ✅ **Nginx 설정**: 중첩 location 블록으로 정적 파일 처리
- ✅ **고성능 배포**: ragpool 노드 활용 (16GB RAM)

## 🤝 지원

새로운 서비스 추가 시 문제가 발생하면:
1. 본 가이드의 체크리스트 확인
2. chatbot-lee 서비스 설정과 비교
3. Claude Code와 함께 단계별 디버깅 수행

---

이 가이드를 따라하면 lee namespace에서 서비스를 안정적으로 추가할 수 있습니다! 🚀
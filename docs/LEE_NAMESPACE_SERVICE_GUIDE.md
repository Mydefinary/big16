# 📚 Lee Namespace 서비스 추가 가이드

이 문서는 **lee 네임스페이스**에 새로운 마이크로서비스를 추가할 때 따라야 할 표준화된 가이드라인을 제공합니다. board 서비스 구현 경험을 바탕으로 작성되었습니다.

## 🎯 목표

- **일관된 서비스 아키텍처** 유지
- **Gateway 라우팅** 표준화
- **Kubernetes 배포** 모범 사례 적용
- **Claude Code와의 효율적인 협업** 지원

## 🏗️ Lee Namespace 아키텍처 개요

```
ToonConnect Gateway (20.249.113.18:9000)
├── 전체 서비스 네비게이션 바
├── /board/** → board-frontend-service-lee:80
├── /board/api/** → board-backend-service-lee:8082
├── /ppl-gen/** → ppl-gen-frontend-service-lee-2:80
├── /ppl-gen/api/** → ppl-gen-backend-service-lee-2:8080
├── /goods-gen/** → goods-gen-frontend-service-lee-2:80
├── /goods-gen/api/** → goods-gen-backend-service-lee-2:8080
└── /[new-service]/** → [new-service]-frontend-service-lee:80
```

## 📋 서비스 네이밍 컨벤션

### 1. 서비스 이름 패턴

#### 기존 서비스 패턴 분석
```bash
# 기존 서비스들
ppl-gen-frontend-service-lee-2
ppl-gen-backend-service-lee-2
goods-gen-frontend-service-lee-2
goods-gen-backend-service-lee-2

# Board 서비스 (새로운 패턴)
board-frontend-service-lee
board-backend-service-lee
```

#### **권장 네이밍 규칙**
```
[service-name]-[component]-service-lee[-version]

예시:
- chat-frontend-service-lee
- chat-backend-service-lee  
- analytics-frontend-service-lee-2 (버전 2가 필요한 경우)
```

### 2. Kubernetes 리소스 네이밍
```
[service-name]-[component]-deployment-lee[-version]

예시:
- chat-frontend-deployment-lee
- chat-backend-deployment-lee
- analytics-frontend-deployment-lee-2
```

### 3. Docker 이미지 네이밍
```
kt16big.azurecr.io/[service-name]-[component]-lee:[tag]

예시:
- kt16big.azurecr.io/chat-frontend-lee:20250820-initial
- kt16big.azurecr.io/chat-backend-lee:20250820-jwt-auth
```

## 🚪 Gateway 라우팅 설정

### 라우팅 패턴

#### **Frontend 라우팅** (정적 파일, JWT 필터 없음)
```yaml
- id: [service-name]-frontend
  uri: http://[service-name]-frontend-service-lee:80
  predicates:
    - Path=/[service-name]/**
  # 정적 파일이므로 JWT 필터 없음
```

#### **Backend 라우팅** (API, JWT 필터 적용)
```yaml
- id: [service-name]-backend  
  uri: http://[service-name]-backend-service-lee:8080
  predicates:
    - Path=/[service-name]/api/**
  filters:
    - name: JwtAuthenticationFilter
```

### Board 서비스 실제 설정 예시
```yaml
# Frontend 라우팅
- id: board-frontend
  uri: http://board-frontend-service-lee:80
  predicates:
    - Path=/board/**

# Backend 라우팅  
- id: board-backend
  uri: http://board-backend-service-lee:8082
  predicates:
    - Path=/board/api/**
  filters:
    - name: JwtAuthenticationFilter
```

## 🐳 Docker 설정 표준

### 1. Multi-stage Dockerfile 구조

#### Frontend (React/Vue/Angular)
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend (Spring Boot)
```dockerfile  
# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B
COPY src/ ./src/
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar","--server.port=8080","--server.servlet.context-path=/[service-name]"]
```

### 2. .dockerignore 설정

#### Frontend .dockerignore
```
node_modules
dist
npm-debug.log*
.git
.gitignore
README.md
```

#### Backend .dockerignore  
```
target
.git
.gitignore
README.md
*.log
```

## ⚙️ 애플리케이션 설정 표준

### 1. Frontend 설정

#### webpack.config.js (React 예시)
```javascript
module.exports = {
  output: {
    publicPath: '/[service-name]/',  // Gateway 라우팅과 일치
  },
  // ... 다른 설정
};
```

#### React Router 설정
```javascript
// App.js
<BrowserRouter basename="/[service-name]">
  <Routes>
    <Route path="/" element={<HomePage />} />
    {/* 다른 라우트들 */}
  </Routes>
</BrowserRouter>
```

#### API 클라이언트 설정
```javascript
// api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/[service-name]/api',  // Gateway 라우팅과 일치
});

export default apiClient;
```

### 2. Backend 설정

#### application.properties (Spring Boot)
```properties
# 서버 설정 - Gateway 라우팅과 일치하기 위한 context path
server.servlet.context-path=/[service-name]
server.port=8080

# 데이터베이스 설정 (환경변수 사용)
spring.datasource.url=${spring.datasource.url}
spring.datasource.username=${spring.datasource.username}  
spring.datasource.password=${spring.datasource.password}

# 기타 설정들...
```

### 3. nginx 설정 (Frontend)

#### nginx.conf
```nginx
server {
  listen 80;

  # Gateway로부터의 /[service-name] 요청 처리
  location /[service-name] {
    alias /usr/share/nginx/html;
    index index.html index.htm;

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
      try_files $uri =404;
    }

    # SPA fallback
    try_files $uri /[service-name]/index.html;
  }

  location / {
    return 301 /[service-name]/;
  }
}
```

## 🎛️ Kubernetes 배포 설정

### 1. Deployment 템플릿

#### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [service-name]-frontend-deployment-lee
  namespace: lee
spec:
  replicas: 1
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: [service-name]-frontend-lee
  template:
    metadata:
      labels:
        app: [service-name]-frontend-lee
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
        - name: [service-name]-frontend-container
          image: kt16big.azurecr.io/[service-name]-frontend-lee:latest
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: [service-name]-frontend-service-lee
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: [service-name]-frontend-lee
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

#### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [service-name]-backend-deployment-lee
  namespace: lee
spec:
  replicas: 1
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: [service-name]-backend-lee
  template:
    metadata:
      labels:
        app: [service-name]-backend-lee
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
        - name: [service-name]-backend-container
          image: kt16big.azurecr.io/[service-name]-backend-lee:latest
          ports:
            - containerPort: 8080
          env:
            # Azure DB 연동을 위한 환경변수 (api-keys-secret에서 가져옴)
            - name: spring.datasource.url
              valueFrom:
                secretKeyRef:
                  name: api-keys-secret
                  key: DB_URL
            - name: spring.datasource.username
              valueFrom:
                secretKeyRef:
                  name: api-keys-secret
                  key: DB_USER
            - name: spring.datasource.password
              valueFrom:
                secretKeyRef:
                  name: api-keys-secret
                  key: DB_PASSWORD
---
apiVersion: v1
kind: Service
metadata:
  name: [service-name]-backend-service-lee
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: [service-name]-backend-lee
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
```

## 🤖 Claude Code와의 작업 가이드

### 1. 프로젝트 구조 설명시 포함할 정보

Claude Code에게 새 서비스를 요청할 때 다음 정보를 제공하세요:

```
"lee 네임스페이스에 [service-name] 서비스를 추가해주세요.

요구사항:
- 네임스페이스: lee
- Gateway URL: http://20.249.113.18:9000/[service-name]
- 기존 Gateway 설정과 일치하는 라우팅 필요
- Azure Container Registry: kt16big.azurecr.io
- Azure DB 연동 (api-keys-secret 사용)
- Multi-stage Docker 빌드 사용
- Frontend에서는 ToonConnect 네비게이션 바 제거 필요 (전체 서비스 공통 네비게이션이 있음)

참고할 기존 서비스:
- board 서비스: board-frontend-service-lee, board-backend-service-lee
- ppl-gen 서비스: ppl-gen-frontend-service-lee-2, ppl-gen-backend-service-lee-2
"
```

### 2. 주요 확인 포인트

Claude Code 작업 시 다음 사항들을 확인해주세요:

#### ✅ 네이밍 일관성 체크
- [ ] 서비스명이 기존 패턴과 일치하는가?
- [ ] Kubernetes 리소스명이 일관된가?
- [ ] Docker 이미지명이 올바른가?

#### ✅ 라우팅 설정 체크  
- [ ] Frontend webpack publicPath가 `/[service-name]/`인가?
- [ ] Backend context-path가 `/[service-name]`인가?
- [ ] API baseURL이 `/[service-name]/api`인가?
- [ ] nginx location 설정이 올바른가?

#### ✅ Gateway 연동 체크
- [ ] Frontend 라우팅: `/[service-name]/**`
- [ ] Backend 라우팅: `/[service-name]/api/**`
- [ ] JWT 필터가 Backend에만 적용되는가?

#### ✅ UI/UX 일관성 체크
- [ ] 전체 서비스 네비게이션 바와 중복되지 않는가?
- [ ] 서비스별 네비게이션이 제거되었는가?
- [ ] 일관된 Bootstrap/UI 라이브러리 사용하는가?

### 3. 일반적인 문제 해결

#### 🚨 자주 발생하는 문제들

1. **정적 파일 404 오류**
   ```bash
   # 확인사항
   - webpack publicPath: '/[service-name]/'
   - nginx location: /[service-name]
   - 파일 요청 경로: /[service-name]/bundle.js
   ```

2. **API 404 오류**
   ```bash  
   # 확인사항
   - Backend context-path: /[service-name]
   - API 요청 경로: /[service-name]/api/...
   - Gateway 라우팅: /[service-name]/api/**
   ```

3. **Gateway 라우팅 우선순위**
   ```yaml
   # 더 구체적인 경로가 먼저 와야 함
   - Path=/[service-name]/api/**  # Backend (우선)
   - Path=/[service-name]/**      # Frontend (후순위)
   ```

## 🎯 체크리스트

새 서비스 추가 완료 전 다음 체크리스트를 확인하세요:

### 📋 개발 단계
- [ ] 서비스명 네이밍 컨벤션 준수
- [ ] Multi-stage Dockerfile 구현
- [ ] .dockerignore 설정
- [ ] webpack/nginx/backend 설정 올바름
- [ ] API 클라이언트 baseURL 설정 

### 🚀 배포 단계
- [ ] Docker 이미지 빌드 및 푸시 성공
- [ ] Kubernetes Deployment YAML 작성
- [ ] Service 리소스 설정 완료
- [ ] Azure DB Secret 연동 설정
- [ ] kubectl apply 성공

### 🔍 검증 단계
- [ ] Frontend 페이지 로드 성공
- [ ] API 호출 정상 동작
- [ ] Gateway를 통한 라우팅 성공
- [ ] 정적 파일 로드 정상
- [ ] JWT 인증 (Backend API)

### 📝 문서화
- [ ] README.md 업데이트
- [ ] 서비스별 문서 작성
- [ ] Gateway 설정 문서화

## 💡 모범 사례 요약

1. **일관성 유지**: 기존 서비스 패턴을 따라 네이밍 및 구조 유지
2. **Gateway 우선**: 모든 설정은 Gateway 라우팅을 기준으로 맞춤
3. **Multi-stage 빌드**: 최적화된 Docker 이미지를 위해 Multi-stage 빌드 사용
4. **환경 분리**: 환경변수와 Secret을 통한 설정 관리
5. **문서화**: 모든 설정과 변경사항을 문서로 기록

---

**이 가이드를 따르면 lee 네임스페이스에 새로운 서비스를 안정적이고 일관되게 추가할 수 있습니다.**

🤖 **Generated with [Claude Code](https://claude.ai/code)**
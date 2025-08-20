# LEE Namespace 서비스 통합 가이드

LEE Namespace에서 새로운 서비스를 추가하거나 기존 서비스를 수정할 때 Gateway 라우팅과 설정을 올바르게 통합하기 위한 실무 가이드입니다.

## 🎯 이 가이드의 목적

이 문서는 **실제 운영 환경**에서 검증된 패턴과 설정을 기반으로 작성되었습니다. 이론적인 가이드라인보다는 **실제 동작하는 설정**을 우선으로 합니다.

## 🏗️ LEE Namespace 실제 아키텍처

### Gateway 라우팅 패턴 (실제 검증됨)
```yaml
실제 Gateway 라우팅:
- Frontend: /{service-name}/* → {service-name}-frontend-service
- Backend API: /api/* → 특정 backend 서비스 (공통 경로!)

예시:
- /webtoon-hl/* → webtoon-hl-frontend-service-lee-2:80
- /api/highlight → webtoon-hl-backend-service-lee-2:8003
- /webtoon/* → webtoon-dashboard-frontend-service:80  
- /webtoon-api/* → webtoon-dashboard-backend-service:8002
```

### ⚠️ 중요한 발견사항
LEE Namespace의 실제 Gateway는 이론적 가이드라인과 다른 패턴을 사용합니다:
- **이론**: `/{service-name}-api/api/*` 
- **실제**: `/api/*` (공통 API 경로) 또는 `/{service-name}-api/*`

## 🔧 Claude Code를 사용한 서비스 통합 프로세스

### 1단계: 실제 Gateway 라우팅 패턴 확인

```bash
# Gateway 로그에서 실제 라우팅 확인
kubectl logs deployment/gateway-lee-deployment -n lee --tail=50

# 테스트를 통한 라우팅 패턴 검증
curl -v http://20.249.113.18:9000/api/{your-endpoint}
curl -v http://20.249.113.18:9000/{service-name}-api/{your-endpoint}
```

**중요**: 401 Unauthorized = 라우팅 성공, 404 Not Found = 라우팅 실패

### 2단계: 서비스 코드 Gateway 패턴에 맞추기

#### Backend API 설정 (FastAPI 예시)
```python
# main.py
from fastapi import FastAPI
from app.api import your_router

app = FastAPI()

# 🚨 중요: 실제 Gateway 패턴에 맞춰 prefix 설정
# Case 1: 공통 /api/* 패턴 (webtoon-hl 사례)
app.include_router(your_router.router, prefix="/api")

# Case 2: 서비스별 /{service-name}-api/* 패턴 (webtoon-dashboard 사례)  
# app.include_router(your_router.router, prefix="/webtoon-api/api")
```

#### Frontend API 호출 설정 (React 예시)
```typescript
// API 호출 설정
// Case 1: 공통 /api/* 패턴
const API_BASE = "/api";

// Case 2: 서비스별 패턴
// const API_BASE = "/webtoon-api/api";

// API 호출
const response = await axios.post(`${API_BASE}/your-endpoint`, data, {
  headers: {
    'Authorization': `Bearer ${token}` // JWT 토큰 필수
  }
});
```

#### Frontend 라우팅 설정
```json
// package.json
{
  "homepage": "/{service-name}"
}
```

```nginx
# nginx.conf
server {
  listen 80;
  
  location /{service-name}/ {
    alias /usr/share/nginx/html/;
    try_files $uri $uri/ /{service-name}/index.html;
  }
}
```

### 3단계: Kubernetes 서비스 설정

#### 명명 규칙 (LEE Namespace 검증된 패턴)
```yaml
# Backend
Deployment: {service-name}-backend-deployment-lee-2
Service: {service-name}-backend-service-lee-2
Container: {service-name}-backend-container-lee-2

# Frontend  
Deployment: {service-name}-frontend-deployment-lee-2
Service: {service-name}-frontend-service-lee-2
Container: {service-name}-frontend-container-lee-2
```

#### 포트 매핑 (검증된 패턴)
```yaml
# Backend Service
spec:
  ports:
    - port: 8003        # Gateway에서 접근하는 포트 (순차 할당)
      targetPort: 8000  # 컨테이너 내부 포트 (FastAPI 기본)

# Frontend Service  
spec:
  ports:
    - port: 80          # Gateway에서 접근하는 포트
      targetPort: 80    # 컨테이너 내부 포트 (nginx 기본)
```

### 4단계: Docker 이미지 및 배포

#### 이미지 태깅 전략
```bash
# 검증된 이미지 태그 패턴
kt16big.azurecr.io/{service-name}-backend-lee:{version-tag}
kt16big.azurecr.io/{service-name}-frontend-lee:{version-tag}

# 버전 태그 예시
20250820-gateway-fix
20250820-api-integration  
20250820-complete
```

#### 배포 명령어
```bash
# 이미지 빌드 (캐시 문제 방지)
docker build --no-cache -t kt16big.azurecr.io/{service-name}-backend-lee:{tag} ./backend
docker build --no-cache -t kt16big.azurecr.io/{service-name}-frontend-lee:{tag} ./frontend

# ACR 푸시
docker push kt16big.azurecr.io/{service-name}-backend-lee:{tag}
docker push kt16big.azurecr.io/{service-name}-frontend-lee:{tag}

# Kubernetes 배포 업데이트
kubectl set image deployment/{service-name}-backend-deployment-lee-2 \
  {service-name}-backend-container-lee-2=kt16big.azurecr.io/{service-name}-backend-lee:{tag} -n lee

kubectl set image deployment/{service-name}-frontend-deployment-lee-2 \
  {service-name}-frontend-container-lee-2=kt16big.azurecr.io/{service-name}-frontend-lee:{tag} -n lee
```

## 🔍 문제 해결 체크리스트

### 404 API 오류 해결
1. **Gateway 라우팅 확인**
   ```bash
   kubectl logs deployment/gateway-lee-deployment -n lee --tail=20
   ```

2. **Backend prefix 확인**
   ```python
   # main.py에서 실제 Gateway 패턴과 일치하는지 확인
   app.include_router(router, prefix="/api")  # 또는 "/{service-name}-api/api"
   ```

3. **Service 포트 매핑 확인**
   ```bash
   kubectl get services -n lee | grep {service-name}
   kubectl describe service {service-name}-backend-service-lee-2 -n lee
   ```

### 401 Unauthorized 해결
- JWT 토큰 유효성 확인
- Frontend에서 Authorization 헤더 포함 여부 확인
- Gateway JWT 설정 동작 확인

### Docker 캐시 문제 해결
- `--no-cache` 옵션 사용
- 고유한 이미지 태그 사용
- 배포 후 Pod 재시작 확인

## 📋 실제 성공 사례: webtoon-hl 서비스

### 문제 상황
- 초기: LEE 가이드라인에 따라 `/webtoon-hl-api/api/*` 패턴으로 구현
- 결과: 404 Not Found 오류 발생

### 해결 과정
1. **실제 Gateway 라우팅 확인**
   ```bash
   curl http://20.249.113.18:9000/api/highlight
   # 결과: 401 Unauthorized (라우팅 성공, 인증 필요)
   
   curl http://20.249.113.18:9000/webtoon-hl-api/api/highlight  
   # 결과: 404 Not Found (라우팅 실패)
   ```

2. **코드 수정**
   ```python
   # Before
   app.include_router(highlight.router, prefix="/webtoon-hl-api/api")
   
   # After (실제 Gateway 패턴에 맞춤)
   app.include_router(highlight.router, prefix="/api")
   ```

   ```typescript
   // Before
   const API_BASE = "/webtoon-hl-api/api";
   
   // After
   const API_BASE = "/api";
   ```

3. **결과**
   - 404 Not Found → 401 Unauthorized (정상 라우팅)
   - JWT 인증 후 정상 API 호출 가능

### 핵심 교훈
- **가이드라인보다 실제 운영 환경 우선**
- **테스트를 통한 라우팅 패턴 검증 필수**
- **Claude Code 작업 시 실제 확인 과정 중요**

## 🛠️ Claude Code 작업 시 권장사항

### 1. 환경 분석 먼저
```bash
# 현재 서비스 상태 확인
kubectl get all -n lee

# Gateway 로그 분석
kubectl logs deployment/gateway-lee-deployment -n lee --tail=50

# 기존 성공 서비스 패턴 분석
kubectl describe service webtoon-dashboard-backend-service -n lee
```

### 2. 점진적 검증
```bash
# 1단계: 라우팅 테스트
curl -v http://20.249.113.18:9000/api/your-endpoint

# 2단계: 인증 테스트  
curl -H "Authorization: Bearer test-token" http://20.249.113.18:9000/api/your-endpoint

# 3단계: 실제 기능 테스트
# (브라우저에서 로그인 후 테스트)
```

### 3. Docker 빌드 전략
```bash
# 개발 중: 캐시 활용
docker build -t image:tag ./

# 운영 배포: 캐시 방지
docker build --no-cache -t image:tag ./

# 태그 관리
image:20250820-feature-name
image:20250820-bugfix-api
image:20250820-final
```

## 📊 LEE Namespace 서비스 현황 (참고용)

### 확인된 라우팅 패턴
```yaml
웹툰 대시보드:
- Frontend: /webtoon/* → webtoon-dashboard-frontend-service:80
- Backend: /webtoon-api/* → webtoon-dashboard-backend-service:8002

웹툰 하이라이트:  
- Frontend: /webtoon-hl/* → webtoon-hl-frontend-service-lee-2:80
- Backend: /api/* → webtoon-hl-backend-service-lee-2:8003

게시판:
- Frontend: /board/* → board-frontend-service-lee:80  
- Backend: /board-api/* → board-backend-service-lee:8082
```

### 포트 할당 현황
```yaml
Backend Services:
- auth-backend: 9001
- user-backend: 9002  
- board-backend: 8082
- webtoon-dashboard-backend: 8002
- webtoon-hl-backend: 8003
- goods-gen-backend: 8001
- ppl-gen-backend: 8000
- question-backend: 8083

Frontend Services:
- 모든 Frontend: 80 (nginx 표준)
```

## 🚀 새 서비스 추가 빠른 체크리스트

### Claude Code로 새 서비스 추가 시
1. [ ] 기존 서비스 라우팅 패턴 분석
2. [ ] Gateway 로그에서 실제 패턴 확인
3. [ ] 사용 가능한 포트 번호 확인
4. [ ] Backend API prefix 실제 패턴에 맞춤
5. [ ] Frontend API 호출 경로 설정
6. [ ] Docker 이미지 --no-cache 빌드
7. [ ] 고유한 이미지 태그 사용
8. [ ] kubectl set image로 배포
9. [ ] 라우팅 테스트 (401 = 성공, 404 = 실패)
10. [ ] JWT 인증 포함한 전체 기능 테스트

### 문제 발생 시 체크포인트
- [ ] Gateway 로그 확인
- [ ] Service 포트 매핑 확인  
- [ ] Pod 상태 및 로그 확인
- [ ] Docker 이미지 태그 확인
- [ ] 기존 성공 서비스와 패턴 비교

---

**이 가이드는 실제 webtoon-hl 서비스 통합 과정에서 얻은 경험을 바탕으로 작성되었습니다.**

**마지막 업데이트**: 2025-08-20  
**검증된 환경**: LEE Namespace, Azure AKS  
**작성자**: LEE Namespace Development Team

🤖 Generated with [Claude Code](https://claude.ai/code)
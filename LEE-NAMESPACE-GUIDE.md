# LEE Namespace 서비스 개발 가이드라인

Azure AKS의 LEE Namespace에서 새로운 서비스를 추가하거나 기존 서비스를 수정할 때 반드시 따라야 하는 가이드라인입니다.

## 🏗️ LEE Namespace 아키텍처

### 핵심 구조
```
LEE Namespace (http://20.249.113.18:9000/)
│
├── Gateway (gateway-lee-service)
│   ├── 라우팅 관리
│   ├── JWT 인증/인가
│   └── CORS 처리
│
├── 인증 시스템
│   ├── auth-frontend (로그인/회원가입 UI)
│   ├── auth-backend (JWT 관리)
│   └── user-backend (사용자 DB)
│
├── 비즈니스 서비스들
│   ├── board-* (게시판)
│   ├── webtoon-dashboard-* (웹툰 분석) 
│   ├── chatbot (AI 질의응답)
│   ├── goods-gen-* (굿즈 생성)
│   ├── ppl-gen-* (PPL 생성)
│   └── webtoon-hl-* (하이라이트)
│
└── 인프라
    └── zookeeper (Kafka 통신)
```

## 🚪 Gateway 라우팅 규칙

### 기본 라우팅 패턴
LEE Namespace의 Gateway는 **경로 기반 라우팅**을 사용합니다:

```yaml
라우팅 패턴:
- Frontend: /{service-name}/**
- Backend API: /{service-name}-api/**

예시:
- 웹툰 Frontend: /webtoon/** → webtoon-dashboard-frontend-service
- 웹툰 Backend: /webtoon-api/** → webtoon-dashboard-backend-service
- 게시판 Frontend: /board/** → board-frontend-service  
- 게시판 Backend: /board-api/** → board-backend-service
```

### 기존 Gateway 설정 (참고용)
```
기존 라우팅 목록:
├── /auths/** → auth-backend-service (JWT 인증)
├── /webtoon/** → webtoon-dashboard-frontend-service
├── /webtoon-api/** → webtoon-dashboard-backend-service
├── /board/** → board-frontend-service
├── /board-api/** → board-backend-service
└── /* (기본) → auth-frontend-service (메인 페이지)
```

## 📋 새 서비스 추가 체크리스트

### 1. 서비스 명명 규칙

#### Frontend 서비스
```yaml
서비스명: {feature-name}-frontend
예시: chatbot-frontend, goods-gen-frontend

Kubernetes 리소스명:
- Deployment: {feature-name}-frontend-deployment
- Service: {feature-name}-frontend-service
- Container: {feature-name}-frontend-container

라우팅 경로: /{feature-name}/**
```

#### Backend 서비스  
```yaml
서비스명: {feature-name}-backend
예시: chatbot-backend, goods-gen-backend

Kubernetes 리소스명:
- Deployment: {feature-name}-backend-deployment  
- Service: {feature-name}-backend-service
- Container: {feature-name}-backend-container

라우팅 경로: /{feature-name}-api/**
```

### 2. Docker 이미지 규칙

```bash
이미지 태그 형식:
kt16big.azurecr.io/{service-name}-lee:{version-tag}

예시:
- kt16big.azurecr.io/webtoon-dashboard-backend-lee:20250820-complete
- kt16big.azurecr.io/webtoon-dashboard-frontend-lee:20250820-complete
- kt16big.azurecr.io/chatbot-backend-lee:latest
```

### 3. Kubernetes 배포 가이드

#### 필수 설정 항목
```yaml
# deployment.yaml 예시
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service-name}-deployment
spec:
  replicas: 1
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: {service-name}
  template:
    metadata:
      labels:
        app: {service-name}
    spec:
      nodeSelector:
        agentpool: userpool  # 필수: userpool 노드에만 배포
      containers:
        - name: {service-name}-container
          image: kt16big.azurecr.io/{service-name}-lee:{tag}
          ports:
            - containerPort: {port}  # Backend: 8000, Frontend: 80
          resources:
            requests:
              cpu: 50m-100m
              memory: 128Mi-256Mi
            limits:
              cpu: 200m-500m
              memory: 256Mi-512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: {service-name}-service
spec:
  type: ClusterIP  # 필수: Gateway를 통해서만 접근
  selector:
    app: {service-name}
  ports:
    - protocol: TCP
      port: {external-port}     # Gateway에서 사용할 포트
      targetPort: {container-port}  # 컨테이너 내부 포트
```

### 4. 포트 할당 가이드

#### 표준 포트 규칙
```yaml
Frontend 서비스:
- Container Port: 80 (nginx)
- Service Port: 80
- Target Port: 80

Backend 서비스:  
- Container Port: 8000 (FastAPI/Spring Boot)
- Service Port: 8001, 8002, 8003... (순차 할당)
- Target Port: 8000

예시:
- webtoon-dashboard-backend: Service Port 8002
- board-backend: Service Port 8001  
- chatbot-backend: Service Port 8003 (신규 서비스)
```

## 🔐 JWT 인증 통합

### 인증이 필요한 서비스
모든 비즈니스 로직 API는 JWT 인증을 거쳐야 합니다:

```javascript
// Frontend에서 API 호출 시 자동으로 JWT 토큰 포함
const response = await fetch('/webtoon-api/api/stats', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### 인증 제외 경로
```yaml
제외 경로:
- /auths/login (로그인)
- /auths/register (회원가입) 
- /api/health (헬스체크)
- / (메인 페이지)
```

## 📁 프로젝트 구조 가이드

### Frontend 프로젝트 구조
```
{service-name}-frontend/
├── public/
├── src/
│   ├── components/
│   ├── services/
│   │   └── api.js (API 클라이언트)
│   ├── hooks/
│   └── utils/
├── package.json
│   └── "homepage": "/{service-name}"  # 필수!
├── nginx.conf
│   └── location /{service-name} {...}  # 필수!
└── Dockerfile
```

### Backend 프로젝트 구조  
```
{service-name}-backend/
├── main.py (FastAPI) 또는 Application.java (Spring)
├── requirements.txt 또는 pom.xml
├── models/
├── services/
├── routes/ 
│   └── 모든 엔드포인트: /{service-name}-api/api/*
└── Dockerfile
```

## 🛠️ Claude Code 작업 가이드

### Gateway 설정 변경 금지
```bash
⚠️ 중요: Gateway 설정은 절대 수정하지 마세요!

올바른 접근:
1. 기존 Gateway 라우팅 패턴 분석
2. 해당 패턴에 맞춰 서비스 코드 수정
3. 테스트 및 배포

잘못된 접근:
1. Gateway 설정 변경 요청 ❌
2. 새로운 라우팅 규칙 생성 ❌
```

### 개발 워크플로우
```bash
1. 기존 서비스 코드 분석
   - 성공한 서비스(webtoon-dashboard, board) 참조
   - 라우팅 패턴 및 설정 파악

2. 새 서비스 구현
   - 명명 규칙 준수
   - 포트 충돌 방지
   - JWT 인증 통합

3. Docker 이미지 빌드
   - 캐시 문제 방지: --no-cache 옵션 사용
   - ACR에 푸시

4. Kubernetes 배포
   - LEE namespace에 배포
   - 리소스 제한 설정
   - userpool 노드 선택

5. 테스트 및 검증
   - Gateway를 통한 접근 테스트
   - JWT 인증 동작 확인
   - API 엔드포인트 검증
```

## 🚀 실제 배포 예시

### 웹툰 대시보드 성공 사례
이 프로젝트는 LEE Namespace 가이드라인을 완벽하게 따른 성공 사례입니다:

```yaml
라우팅 설정:
- Frontend: /webtoon/** → webtoon-dashboard-frontend-service:80
- Backend: /webtoon-api/** → webtoon-dashboard-backend-service:8002

API 엔드포인트 패턴:
- 모든 API: /webtoon-api/api/*
- 예시: /webtoon-api/api/stats, /webtoon-api/api/webtoons

Docker 이미지:
- Backend: kt16big.azurecr.io/webtoon-dashboard-backend-lee:20250820-complete
- Frontend: kt16big.azurecr.io/webtoon-dashboard-frontend-lee:20250820-gateway-fix

Kubernetes 리소스:
- webtoon-dashboard-backend-deployment (userpool 노드)
- webtoon-dashboard-frontend-deployment (userpool 노드)
- 적절한 리소스 제한 설정
```

## ⚠️ 주의사항 및 문제 해결

### 자주 발생하는 문제들

#### 1. 404 라우팅 오류
```bash
원인: API 경로와 Gateway 라우팅 불일치
해결: 
- Gateway 패턴 확인: /{service}-api/**
- 백엔드 엔드포인트: /{service}-api/api/*
- 일치성 검증
```

#### 2. JWT 인증 실패
```bash
원인: 토큰 처리 로직 누락
해결:
- Frontend에서 Authorization 헤더 포함
- Backend에서 JWT 검증 로직 구현
- 토큰 만료 처리
```

#### 3. 정적 파일 404
```bash
원인: nginx 설정 및 publicPath 불일치  
해결:
- package.json: "homepage": "/{service-name}"
- nginx.conf: location /{service-name}
- 빌드 후 경로 확인
```

#### 4. 포트 충돌
```bash
원인: 기존 서비스와 동일한 포트 사용
해결:
- kubectl get services -n lee로 사용 중인 포트 확인
- 사용하지 않는 포트 번호 할당
```

## 📞 문제 해결 및 지원

### 문제 발생 시 체크리스트
1. **라우팅 확인**: Gateway 패턴과 코드 경로 일치성
2. **인증 확인**: JWT 토큰 처리 로직
3. **포트 확인**: 포트 충돌 및 서비스 연결
4. **이미지 확인**: 최신 Docker 이미지 배포 여부
5. **로그 확인**: kubectl logs로 에러 메시지 분석

### 도움 요청 시 필요한 정보
```bash
# 서비스 상태
kubectl get pods -n lee | grep {service-name}
kubectl get services -n lee | grep {service-name}

# 로그 수집
kubectl logs {pod-name} -n lee --tail=50

# 네트워크 테스트
curl http://20.249.113.18:9000/{service-name}/
curl http://20.249.113.18:9000/{service-name}-api/api/health
```

---

**이 가이드라인을 따르면 LEE Namespace에서 안정적이고 일관성 있는 서비스를 구축할 수 있습니다.**

**마지막 업데이트**: 2025-08-20  
**문서 버전**: v2.0  
**작성자**: LEE Namespace Development Team

🤖 Generated with [Claude Code](https://claude.ai/code)
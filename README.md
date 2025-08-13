# Lee 프로젝트 배포 가이드

## 🏗️ 아키텍처 개요

```
Internet
    ↓
[Ingress Controller]
    ↓
[Gateway Service:9000] ← JWT 인증, 라우팅
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   Auth Backend  │  User Backend   │   Frontend      │
│   Service:9001  │  Service:9002   │  Service:9003   │
└─────────────────┴─────────────────┴─────────────────┘
```

## 📋 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Gateway | 9000 | API 게이트웨이 |
| Auth Backend | 9001 | 인증 서비스 |
| User Backend | 9002 | 사용자 관리 서비스 |
| Frontend | 9003 | 프론트엔드 웹서버 |

## 🚀 배포 방법

### 1. 수동 배포 (권장)

```bash
# 실행 권한 부여
chmod +x complete-deploy.sh

# 전체 배포 실행
./complete-deploy.sh [이미지태그]

# 예시
./complete-deploy.sh v1.0.0
```

### 2. 개별 서비스 배포

```bash
# 개별 서비스 배포
IMAGE_TAG=latest envsubst < deployments/auth-backend-deployment.yaml | kubectl apply -f -
IMAGE_TAG=latest envsubst < deployments/user-backend-deployment.yaml | kubectl apply -f -
IMAGE_TAG=latest envsubst < deployments/auth-frontend-deployment.yaml | kubectl apply -f -
IMAGE_TAG=latest envsubst < deployments/gateway-deployment.yaml | kubectl apply -f -

# Ingress 배포
kubectl apply -f deployments/ingress-lee.yaml
```

### 3. CI/CD를 통한 자동 배포

`login-fb` 브랜치에 코드를 푸시하면 GitHub Actions가 자동으로:
1. 코드 빌드
2. Docker 이미지 생성 및 ACR 푸시
3. AKS 클러스터에 자동 배포

## 📁 파일 구조

```
deployments/
├── auth-backend-deployment.yaml    # Auth 백엔드 배포
├── user-backend-deployment.yaml    # User 백엔드 배포
├── auth-frontend-deployment.yaml   # 프론트엔드 배포
├── gateway-deployment.yaml         # 게이트웨이 배포
├── ingress-lee.yaml                # Ingress 설정
└── complete-deploy.sh              # 전체 배포 스크립트

.github/workflows/
├── auth-cicd.yml                   # Auth 백엔드 CI/CD
├── user-cicd.yml                   # User 백엔드 CI/CD
├── frontend-cicd.yml               # 프론트엔드 CI/CD
└── gateway-cicd.yml                # 게이트웨이 CI/CD
```

## 🔧 설정 요구사항

### Azure 리소스
- AKS 클러스터: `kt16big-aks`
- ACR: `kt16big.azurecr.io`
- 리소스 그룹: `kt16big`

### Kubernetes Secrets
```bash
kubectl create secret generic api-keys-secret \
  --from-literal=JWT_SECRET_KEY=your-jwt-secret \
  --from-literal=DB_URL=your-db-url \
  --from-literal=DB_USER=your-db-user \
  --from-literal=DB_PASSWORD=your-db-password
```

### Ingress Controller
NGINX Ingress Controller가 설치되어 있어야 합니다:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

## 🌐 서비스 접근

### 도메인 설정 후
```
http://microservices-lee.example.com/api/auths/login  # API 접근
http://microservices-lee.example.com/                # 프론트엔드 접근
```

### LoadBalancer IP 직접 접근
```bash
# Ingress IP 확인
kubectl get ingress microservices-lee-dev-ingress

# 접근
http://EXTERNAL-IP/api/auths/login  # API 접근
http://EXTERNAL-IP/                 # 프론트엔드 접근
```

## 📊 모니터링 및 디버깅

### 상태 확인
```bash
# Pod 상태
kubectl get pods -l app | grep lee

# 서비스 상태  
kubectl get svc | grep lee

# Ingress 상태
kubectl get ingress | grep lee
```

### 로그 확인
```bash
# Gateway 로그
kubectl logs -f deployment/gateway-lee-deployment

# Auth Backend 로그
kubectl logs -f deployment/auth-backend-lee-deployment

# User Backend 로그
kubectl logs -f deployment/user-backend-lee-deployment

# Frontend 로그
kubectl logs -f deployment/frontend-lee-deployment
```

### 문제 해결
```bash
# Pod 상세 정보
kubectl describe pod <pod-name>

# 이벤트 확인
kubectl get events --sort-by=.metadata.creationTimestamp

# 리소스 재시작
kubectl rollout restart deployment/gateway-lee-deployment
```

## 🔄 업데이트 및 롤백

### 이미지 업데이트
```bash
# 새 이미지로 업데이트
IMAGE_TAG=v1.1.0 ./complete-deploy.sh v1.1.0

# 또는 개별 서비스 업데이트
kubectl set image deployment/auth-backend-lee-deployment \
  auth-backend-lee-container=kt16big.azurecr.io/auth-backend:v1.1.0
```

### 롤백
```bash
# 이전 버전으로 롤백
kubectl rollout undo deployment/auth-backend-lee-deployment

# 특정 버전으로 롤백
kubectl rollout undo deployment/auth-backend-lee-deployment --to-revision=2
```

## 🔐 보안 고려사항

1. **Secrets 관리**: 민감한 정보는 반드시 Kubernetes Secrets 사용
2. **RBAC**: 서비스 계정별 권한 최소화
3. **Network Policies**: 필요한 통신만 허용
4. **Image Security**: 정기적인 이미지 스캔 및 업데이트

## 📝 참고사항

- 모든 서비스명에 `-lee` 접미사가 붙어 구분됩니다
- Gateway는 자체 `application.yml` 파일을 사용합니다
- CI/CD는 `login-fb` 브랜치 기준으로 동작합니다
- 개발환경에서는 `spring.profiles.active=docker` 프로파일을 사용합니다
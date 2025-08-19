# 🚀 Kubernetes 서비스 추가 가이드라인

이 문서는 `lee` 네임스페이스에 새로운 서비스를 추가하는 방법과 기존 4개 서비스(PPL/굿즈 생성기)의 설정 패턴을 설명합니다.

## 📋 목차
1. [기존 서비스 분석](#기존-서비스-분석)
2. [네이밍 컨벤션](#네이밍-컨벤션)
3. [라우팅 설정](#라우팅-설정)
4. [새 서비스 추가 단계](#새-서비스-추가-단계)
5. [게이트웨이 설정](#게이트웨이-설정)
6. [모범 사례](#모범-사례)

## 🔍 기존 서비스 분석

### 현재 배포된 4개 서비스

| 서비스 | Deployment | Service | 포트 | 라우팅 경로 |
|--------|------------|---------|------|-------------|
| PPL Frontend | `ppl-gen-frontend-deployment-lee-2` | `ppl-gen-frontend-service-lee-2` | 80 | `/ppl-gen/*` |
| PPL Backend | `ppl-gen-backend-deployment-lee-2` | `ppl-gen-backend-service-lee-2` | 8000 | `/api/ppl-gen/*` |
| 굿즈 Frontend | `goods-gen-frontend-deployment-lee-2` | `goods-gen-frontend-service-lee-2` | 80 | `/goods-gen/*` |
| 굿즈 Backend | `goods-gen-backend-deployment-lee-2` | `goods-gen-backend-service-lee-2` | 8001 | `/api/goods-gen/*` |

### 기존 서비스의 패턴 분석

#### 1. 네이밍 패턴
```yaml
# Deployment 이름
{service-type}-{component}-deployment-lee-2

# Service 이름  
{service-type}-{component}-service-lee-2

# Container 이름
{service-type}-{component}-container-lee-2

# App Label
{service-type}-{component}-lee-2
```

**예시:**
- `ppl-gen-frontend-deployment-lee-2`
- `goods-gen-backend-service-lee-2`

#### 2. 라우팅 패턴
```yaml
# Frontend: /{service-name}/*
/ppl-gen/*, /goods-gen/*

# Backend: /api/{service-name}/*  
/api/ppl-gen/*, /api/goods-gen/*
```

## 🏷️ 네이밍 컨벤션

### 필수 네이밍 규칙

1. **서비스 타입**: 서비스의 주요 기능을 나타내는 짧은 이름
   - 예: `ppl-gen`, `goods-gen`, `webtoon-hl`

2. **컴포넌트**: `frontend` 또는 `backend`

3. **네임스페이스 식별자**: `lee-2` (버전 포함)

4. **리소스 타입**: `deployment`, `service`, `container`

### 새 서비스 예시: `analytics-service`

```yaml
# 리소스 이름들
Deployment: analytics-frontend-deployment-lee-2
Service:    analytics-frontend-service-lee-2  
Container:  analytics-frontend-container-lee-2
App Label:  analytics-frontend-lee-2

Deployment: analytics-backend-deployment-lee-2
Service:    analytics-backend-service-lee-2
Container:  analytics-backend-container-lee-2
App Label:  analytics-backend-lee-2
```

## 🛣️ 라우팅 설정

### 게이트웨이 라우팅 규칙

기존 4개 서비스의 게이트웨이 설정을 분석하면:

```yaml
# Frontend 라우팅
- path: /{service-name}(/|$)(.*)
  pathType: Prefix
  backend:
    service:
      name: {service-name}-frontend-service-lee-2
      port:
        number: 80

# Backend 라우팅  
- path: /api/{service-name}(/|$)(.*)
  pathType: Prefix
  backend:
    service:
      name: {service-name}-backend-service-lee-2
      port:
        number: {backend-port}
```

### 포트 할당 규칙

**Frontend (React/Nginx)**: 항상 포트 `80`
**Backend**: 고유한 포트 할당
- PPL Backend: `8000`
- 굿즈 Backend: `8001`  
- 새 서비스: `8002`, `8003`, ... (순차적 할당)

## 🆕 새 서비스 추가 단계

### 1단계: 서비스 이름 정의
```bash
SERVICE_NAME="your-service"  # 예: analytics, dashboard, etc.
BACKEND_PORT="8002"          # 다음 사용 가능한 포트
```

### 2단계: Deployment 파일 생성

**Frontend Deployment (`{service-name}-frontend-deployment.yaml`)**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service-name}-frontend-deployment-lee-2
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {service-name}-frontend-lee-2
  template:
    metadata:
      labels:
        app: {service-name}-frontend-lee-2
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
      - name: {service-name}-frontend-container-lee-2
        image: kt16big.azurecr.io/{service-name}-frontend-lee-2:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: {service-name}-frontend-service-lee-2
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: {service-name}-frontend-lee-2
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

**Backend Deployment (`{service-name}-backend-deployment.yaml`)**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service-name}-backend-deployment-lee-2
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {service-name}-backend-lee-2
  template:
    metadata:
      labels:
        app: {service-name}-backend-lee-2
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
      - name: {service-name}-backend-container-lee-2
        image: kt16big.azurecr.io/{service-name}-backend-lee-2:latest
        ports:
        - containerPort: {backend-port}
        # 환경 변수 추가 (필요한 경우)
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys-secret
              key: {SERVICE_NAME}_API_KEY
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: {service-name}-backend-service-lee-2
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: {service-name}-backend-lee-2
  ports:
  - protocol: TCP
    port: {backend-port}
    targetPort: {backend-port}
```

### 3단계: Docker 이미지 빌드 & 푸시
```bash
# Frontend 빌드
cd {service-name}/frontend
docker build -t kt16big.azurecr.io/{service-name}-frontend-lee-2:latest .

# Backend 빌드  
cd ../backend
docker build -t kt16big.azurecr.io/{service-name}-backend-lee-2:latest .

# 푸시
az acr login --name kt16big
docker push kt16big.azurecr.io/{service-name}-frontend-lee-2:latest
docker push kt16big.azurecr.io/{service-name}-backend-lee-2:latest
```

### 4단계: Kubernetes 배포
```bash
# 배포 실행
kubectl apply -f {service-name}-frontend-deployment.yaml
kubectl apply -f {service-name}-backend-deployment.yaml

# 상태 확인
kubectl get pods -n lee | grep {service-name}
kubectl get services -n lee | grep {service-name}
```

## 🌐 게이트웨이 설정

### Ingress 규칙 추가

기존 게이트웨이에 새 서비스의 라우팅 규칙을 추가합니다:

```yaml
# 게이트웨이 설정 파일에 추가
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-app-gateway-ingress
  namespace: lee
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/proxy-body-size: "200m"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  rules:
  - http:
      paths:
      # 기존 서비스들...
      
      # 새 서비스 추가
      - path: /{service-name}(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: {service-name}-frontend-service-lee-2
            port:
              number: 80
      - path: /api/{service-name}(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: {service-name}-backend-service-lee-2
            port:
              number: {backend-port}
```

### 라우팅 업데이트
```bash
# 게이트웨이 설정 적용
kubectl apply -f gateway-ingress.yaml -n lee

# Ingress 상태 확인
kubectl get ingress -n lee
kubectl describe ingress multi-app-gateway-ingress -n lee
```

## ✅ 모범 사례

### 1. 리소스 제한
```yaml
resources:
  requests:
    memory: "128Mi"    # Frontend
    cpu: "100m"
  limits:
    memory: "256Mi"    # Frontend
    cpu: "200m"

# Backend은 더 많은 리소스 할당
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### 2. 헬스체크 설정
```yaml
# Backend 컨테이너에 추가
livenessProbe:
  httpGet:
    path: /health
    port: {backend-port}
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready  
    port: {backend-port}
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. 환경 변수 관리
```bash
# 새 시크릿 생성
kubectl create secret generic {service-name}-secret \
  --from-literal=API_KEY=your_key_here \
  --from-literal=DB_PASSWORD=your_password \
  -n lee

# 기존 시크릿에 키 추가
kubectl patch secret api-keys-secret -n lee \
  --type='json' \
  -p='[{"op": "add", "path": "/{SERVICE_NAME}_API_KEY", "value": "base64_encoded_value"}]'
```

### 4. 로그 및 모니터링
```yaml
# 로그 설정 (컨테이너에 추가)
env:
- name: LOG_LEVEL
  value: "INFO"
- name: LOG_FORMAT
  value: "json"

# 로그 확인 명령어
kubectl logs -f deployment/{service-name}-backend-deployment-lee-2 -n lee
```

## 🔧 트러블슈팅

### 일반적인 문제들

1. **Pod가 시작되지 않는 경우**
```bash
kubectl describe pod {pod-name} -n lee
kubectl logs {pod-name} -n lee
```

2. **Service 연결 문제**
```bash
kubectl get endpoints -n lee
kubectl port-forward service/{service-name}-backend-service-lee-2 8080:{backend-port} -n lee
```

3. **Ingress 라우팅 문제**
```bash
kubectl get ingress -n lee
kubectl logs -n ingress-nginx deployment/nginx-ingress-controller
```

## 📊 체크리스트

새 서비스 추가 시 확인사항:

- [ ] 네이밍 컨벤션 준수 (`{service-name}-{component}-{type}-lee-2`)
- [ ] 고유한 백엔드 포트 할당
- [ ] NodeSelector `agentpool: userpool` 설정
- [ ] 리소스 제한 설정
- [ ] 라벨과 셀렉터 일치 확인
- [ ] 게이트웨이 라우팅 규칙 추가
- [ ] Docker 이미지 푸시 완료
- [ ] 배포 후 상태 확인
- [ ] 헬스체크 엔드포인트 구현
- [ ] 로그 및 모니터링 설정

## 🔗 참고 자료

- [Kubernetes 공식 문서](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Azure AKS 문서](https://docs.microsoft.com/en-us/azure/aks/)

---

이 가이드를 따라하면 `lee` 네임스페이스에 새로운 서비스를 일관성 있게 추가할 수 있습니다. 문제가 발생하면 기존 4개 서비스의 설정을 참고하세요.
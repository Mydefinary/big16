# 🤖 Claude Code를 위한 서비스 등록 템플릿

이 문서는 Claude Code가 `lee` 네임스페이스에 새로운 서비스를 자동으로 등록할 수 있도록 작성된 실행 가능한 템플릿입니다.

## 🎯 사용 방법

Claude Code에게 다음과 같이 요청하세요:
```
"analytics 서비스를 lee 네임스페이스에 추가해줘. 백엔드 포트는 8002를 사용하고, 
claude-code-service-template.md를 참고해서 만들어줘."
```

## 📝 필수 정보 체크리스트

새 서비스 등록 전 다음 정보를 확인하세요:

### ✅ 서비스 정보
- [ ] **서비스명**: `{service-name}` (예: analytics, dashboard, monitoring)
- [ ] **백엔드 포트**: 다음 사용 가능한 포트 (8000, 8001은 사용 중)
- [ ] **API 키 필요 여부**: 환경 변수가 필요한지 확인
- [ ] **특별한 리소스 요구사항**: 기본값과 다른 CPU/메모리 필요한지

### ✅ 현재 사용 중인 포트
- `8000`: ppl-gen-backend
- `8001`: goods-gen-backend  
- `8002`: 다음 사용 가능
- `8003`: 그 다음 사용 가능

## 🚀 자동 생성 템플릿

### 1단계: 변수 설정
```bash
SERVICE_NAME="your-service-name"  # 실제 서비스명으로 교체
BACKEND_PORT="8002"               # 다음 사용 가능한 포트
```

### 2단계: Frontend Deployment 파일

**파일명**: `{SERVICE_NAME}-frontend-deployment.yaml`

```yaml
# ===================================================
# {SERVICE_NAME} 프론트엔드 (React) 배포
# ===================================================
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {SERVICE_NAME}-frontend-deployment-lee-2
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {SERVICE_NAME}-frontend-lee-2
  template:
    metadata:
      labels:
        app: {SERVICE_NAME}-frontend-lee-2
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
      - name: {SERVICE_NAME}-frontend-container-lee-2
        image: kt16big.azurecr.io/{SERVICE_NAME}-frontend-lee-2:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
# ===================================================
# {SERVICE_NAME} 프론트엔드 서비스
# ===================================================
apiVersion: v1
kind: Service
metadata:
  name: {SERVICE_NAME}-frontend-service-lee-2
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: {SERVICE_NAME}-frontend-lee-2
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

### 3단계: Backend Deployment 파일

**파일명**: `{SERVICE_NAME}-backend-deployment.yaml`

```yaml
# ===================================================
# {SERVICE_NAME} 백엔드 (FastAPI) 배포
# ===================================================
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {SERVICE_NAME}-backend-deployment-lee-2
  namespace: lee
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {SERVICE_NAME}-backend-lee-2
  template:
    metadata:
      labels:
        app: {SERVICE_NAME}-backend-lee-2
    spec:
      nodeSelector:
        agentpool: userpool
      containers:
      - name: {SERVICE_NAME}-backend-container-lee-2
        image: kt16big.azurecr.io/{SERVICE_NAME}-backend-lee-2:latest
        ports:
        - containerPort: {BACKEND_PORT}
        env:
        # 필요한 경우 환경 변수 추가
        - name: LOG_LEVEL
          value: "INFO"
        # API 키가 필요한 경우 아래 주석 해제
        # - name: {SERVICE_NAME_UPPER}_API_KEY
        #   valueFrom:
        #     secretKeyRef:
        #       name: api-keys-secret
        #       key: {SERVICE_NAME_UPPER}_API_KEY
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: {BACKEND_PORT}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: {BACKEND_PORT}
          initialDelaySeconds: 5
          periodSeconds: 5
---
# ===================================================
# {SERVICE_NAME} 백엔드 서비스
# ===================================================
apiVersion: v1
kind: Service
metadata:
  name: {SERVICE_NAME}-backend-service-lee-2
  namespace: lee
spec:
  type: ClusterIP
  selector:
    app: {SERVICE_NAME}-backend-lee-2
  ports:
  - protocol: TCP
    port: {BACKEND_PORT}
    targetPort: {BACKEND_PORT}
```

## 🔧 Claude Code 실행 스크립트

Claude Code가 실행할 명령어들:

### Docker 빌드 및 푸시
```bash
# 변수 설정
SERVICE_NAME="your-service-name"

# Frontend 빌드
cd {SERVICE_NAME}/frontend
docker build -t kt16big.azurecr.io/${SERVICE_NAME}-frontend-lee-2:latest .

# Backend 빌드
cd ../backend  
docker build -t kt16big.azurecr.io/${SERVICE_NAME}-backend-lee-2:latest .

# Azure 로그인 및 푸시
az acr login --name kt16big
docker push kt16big.azurecr.io/${SERVICE_NAME}-frontend-lee-2:latest
docker push kt16big.azurecr.io/${SERVICE_NAME}-backend-lee-2:latest
```

### Kubernetes 배포
```bash
# 배포 실행
kubectl apply -f ${SERVICE_NAME}-frontend-deployment.yaml
kubectl apply -f ${SERVICE_NAME}-backend-deployment.yaml

# 상태 확인
kubectl get pods -n lee | grep ${SERVICE_NAME}
kubectl get services -n lee | grep ${SERVICE_NAME}

# 배포 상태 확인
kubectl rollout status deployment/${SERVICE_NAME}-frontend-deployment-lee-2 -n lee
kubectl rollout status deployment/${SERVICE_NAME}-backend-deployment-lee-2 -n lee
```

## 🌐 게이트웨이 라우팅 설정

### Ingress 규칙 추가 템플릿

```yaml
# 기존 Ingress에 추가할 라우팅 규칙
- path: /{SERVICE_NAME}(/|$)(.*)
  pathType: Prefix
  backend:
    service:
      name: {SERVICE_NAME}-frontend-service-lee-2
      port:
        number: 80
- path: /api/{SERVICE_NAME}(/|$)(.*)
  pathType: Prefix
  backend:
    service:
      name: {SERVICE_NAME}-backend-service-lee-2
      port:
        number: {BACKEND_PORT}
```

### 게이트웨이 업데이트 명령
```bash
# 현재 Ingress 확인
kubectl get ingress -n lee

# Ingress 수정 (필요한 경우)
kubectl edit ingress multi-app-gateway-ingress -n lee

# 업데이트 확인
kubectl describe ingress multi-app-gateway-ingress -n lee
```

## ✅ 검증 체크리스트

Claude Code가 서비스 등록 후 확인해야 할 항목들:

### 배포 확인
```bash
# 1. Pod 상태 확인
kubectl get pods -n lee | grep {SERVICE_NAME}
# 모든 Pod이 "Running" 상태여야 함

# 2. Service 확인
kubectl get services -n lee | grep {SERVICE_NAME}
# ClusterIP가 할당되어야 함

# 3. Endpoint 확인
kubectl get endpoints -n lee | grep {SERVICE_NAME}
# 각 서비스에 IP:PORT가 매핑되어야 함

# 4. 로그 확인
kubectl logs -f deployment/{SERVICE_NAME}-backend-deployment-lee-2 -n lee
# 에러가 없어야 함
```

### 네트워킹 테스트
```bash
# 5. 포트 포워딩 테스트
kubectl port-forward service/{SERVICE_NAME}-backend-service-lee-2 8080:{BACKEND_PORT} -n lee
# 로컬에서 http://localhost:8080/health 접근 가능해야 함

# 6. DNS 해상도 테스트 (클러스터 내부에서)
kubectl run test-pod --image=busybox -it --rm --restart=Never -n lee \
  -- nslookup {SERVICE_NAME}-backend-service-lee-2.lee.svc.cluster.local
```

## 🚨 트러블슈팅 가이드

### 일반적인 오류와 해결책

1. **ImagePullBackOff**
```bash
# 이미지가 제대로 푸시되었는지 확인
az acr repository list --name kt16big

# Pod 상세 정보 확인
kubectl describe pod <pod-name> -n lee
```

2. **CrashLoopBackOff**
```bash
# 로그 확인
kubectl logs <pod-name> -n lee --previous

# 환경 변수 확인
kubectl exec -it <pod-name> -n lee -- env
```

3. **Service 연결 실패**
```bash
# Endpoint 확인
kubectl get endpoints <service-name> -n lee

# 포트 확인
kubectl describe service <service-name> -n lee
```

## 📊 리소스 모니터링

### 리소스 사용량 확인
```bash
# CPU/메모리 사용량
kubectl top pods -n lee | grep {SERVICE_NAME}

# 리소스 제한 확인
kubectl describe pod <pod-name> -n lee | grep -A 10 "Limits"
```

## 🔐 보안 설정

### API 키 관리 (필요한 경우)
```bash
# 새 시크릿 생성
kubectl create secret generic {SERVICE_NAME}-secret \
  --from-literal=API_KEY=your_api_key_here \
  -n lee

# 기존 시크릿에 키 추가
kubectl patch secret api-keys-secret -n lee \
  --type='json' \
  -p='[{"op": "add", "path": "/data/{SERVICE_NAME_UPPER}_API_KEY", "value": "'$(echo -n 'your_api_key' | base64)'"}]'
```

---

**Claude Code 사용 팁**: 
- 서비스명은 짧고 명확하게 (예: analytics, dashboard, monitor)
- 포트는 순차적으로 할당 (8002, 8003, ...)
- 배포 후 반드시 상태 확인
- 문제 발생 시 위의 트러블슈팅 가이드 참조
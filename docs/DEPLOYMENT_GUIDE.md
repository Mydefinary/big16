# Board-Lee 배포 가이드 및 런북

## 목차
1. [배포 개요](#배포-개요)
2. [사전 요구사항](#사전-요구사항)
3. [로컬 개발 환경 구성](#로컬-개발-환경-구성)
4. [Docker 이미지 빌드](#docker-이미지-빌드)
5. [Kubernetes 배포](#kubernetes-배포)
6. [배포 검증](#배포-검증)
7. [배포 롤백](#배포-롤백)
8. [일상 운영 작업](#일상-운영-작업)
9. [트러블슈팅](#트러블슈팅)

## 배포 개요

Board-Lee 시스템은 다음과 같은 배포 전략을 사용합니다:
- **컨테이너 기반**: Docker 컨테이너로 패키징
- **오케스트레이션**: Kubernetes(AKS) 환경에서 운영
- **이미지 저장소**: Azure Container Registry (ACR)
- **배포 방식**: Rolling Update (무중단 배포)

### 주요 구성 요소
- Frontend: React 애플리케이션 (Nginx 서버)
- Backend: Spring Boot 애플리케이션
- Database: MySQL (Azure 관리형)
- Gateway: ToonConnect Gateway (라우팅)

## 사전 요구사항

### 필수 도구
```bash
# Docker
docker --version  # 20.10+

# kubectl (Kubernetes CLI)
kubectl version --client  # 1.20+

# Azure CLI
az --version  # 2.40+

# Node.js (프론트엔드 빌드용)
node --version  # 18+
npm --version   # 8+

# Java (백엔드 빌드용)
java -version   # 17+
mvn --version   # 3.9+
```

### Azure 접근 권한
```bash
# Azure 로그인
az login

# ACR 접근 권한 확인
az acr list -o table

# AKS 클러스터 접근 설정
az aks get-credentials --resource-group kt16big --name <cluster-name>

# kubectl 컨텍스트 확인
kubectl config current-context
```

### 환경 변수 설정
```bash
export ACR_NAME="kt16big"
export ACR_URL="kt16big.azurecr.io"
export NAMESPACE="lee"
export VERSION=$(date +%Y%m%d-%H%M%S)
```

## 로컬 개발 환경 구성

### 1. 소스 코드 클론
```bash
git clone <repository-url>
cd board-lee
```

### 2. 프론트엔드 로컬 실행
```bash
cd frontend
npm install
npm run dev  # 개발 서버 (localhost:3000)
# 또는
npm run build  # 프로덕션 빌드
npm run serve  # 빌드된 파일 서빙
```

### 3. 백엔드 로컬 실행
```bash
cd backend
# application-local.yml 설정 (DB 연결 정보)
mvn clean package
java -jar target/boardapp-0.0.1-SNAPSHOT.jar --spring.profiles.active=local
```

### 4. 로컬 환경 통합 테스트
```bash
# 프론트엔드: http://localhost:3000
# 백엔드 API: http://localhost:8080/api
# 게시글 목록: GET http://localhost:8080/api/posts
```

## Docker 이미지 빌드

### 1. ACR 로그인
```bash
az acr login --name $ACR_NAME
```

### 2. 프론트엔드 이미지 빌드
```bash
cd frontend

# Multi-stage Dockerfile을 사용한 빌드
docker build -t board-frontend-lee:$VERSION .
docker tag board-frontend-lee:$VERSION $ACR_URL/board-frontend-lee:$VERSION
docker tag board-frontend-lee:$VERSION $ACR_URL/board-frontend-lee:latest

# ACR에 푸시
docker push $ACR_URL/board-frontend-lee:$VERSION
docker push $ACR_URL/board-frontend-lee:latest
```

### 3. 백엔드 이미지 빌드
```bash
cd backend

# Maven 빌드 포함한 Multi-stage Dockerfile
docker build -t board-backend-lee:$VERSION .
docker tag board-backend-lee:$VERSION $ACR_URL/board-backend-lee:$VERSION
docker tag board-backend-lee:$VERSION $ACR_URL/board-backend-lee:latest

# ACR에 푸시
docker push $ACR_URL/board-backend-lee:$VERSION
docker push $ACR_URL/board-backend-lee:latest
```

### 4. 이미지 빌드 스크립트
```bash
#!/bin/bash
# build-and-push.sh

set -e

VERSION=$(date +%Y%m%d-%H%M%S)
ACR_URL="kt16big.azurecr.io"

echo "Building version: $VERSION"

# Frontend
echo "Building frontend..."
cd frontend
docker build -t $ACR_URL/board-frontend-lee:$VERSION .
docker tag $ACR_URL/board-frontend-lee:$VERSION $ACR_URL/board-frontend-lee:latest
docker push $ACR_URL/board-frontend-lee:$VERSION
docker push $ACR_URL/board-frontend-lee:latest

# Backend  
echo "Building backend..."
cd ../backend
docker build -t $ACR_URL/board-backend-lee:$VERSION .
docker tag $ACR_URL/board-backend-lee:$VERSION $ACR_URL/board-backend-lee:latest
docker push $ACR_URL/board-backend-lee:$VERSION
docker push $ACR_URL/board-backend-lee:latest

echo "Build and push completed: $VERSION"
```

## Kubernetes 배포

### 1. 네임스페이스 확인
```bash
kubectl get namespaces
kubectl create namespace lee --dry-run=client -o yaml | kubectl apply -f -
```

### 2. 시크릿 설정
```bash
# 데이터베이스 비밀번호
kubectl create secret generic board-secrets \
  --from-literal=DB_PASSWORD="your_db_password" \
  --namespace=lee

# ACR 접근을 위한 시크릿 (필요시)
kubectl create secret docker-registry acr-secret \
  --docker-server=$ACR_URL \
  --docker-username=$ACR_NAME \
  --docker-password="$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)" \
  --namespace=lee
```

### 3. ConfigMap 설정
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: board-config
  namespace: lee
data:
  DB_HOST: "your-mysql-host"
  DB_PORT: "3306"
  DB_NAME: "boarddb"
  APP_ATTACHMENT_DIR: "/app/uploads"
  SPRING_PROFILES_ACTIVE: "production"
EOF
```

### 4. PersistentVolume 생성 (파일 저장용)
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: board-files-pvc
  namespace: lee
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: managed-csi
EOF
```

### 5. 애플리케이션 배포
```bash
# 백엔드 배포
kubectl apply -f backend/k8s/board-backend-deployment.yaml

# 프론트엔드 배포  
kubectl apply -f frontend/k8s/board-frontend-deployment.yaml

# 서비스 배포
kubectl apply -f k8s/services.yaml
```

### 6. 배포 상태 확인
```bash
# Deployment 상태
kubectl get deployments -n lee

# Pod 상태
kubectl get pods -n lee

# 서비스 상태
kubectl get services -n lee

# 이벤트 확인
kubectl get events -n lee --sort-by='.lastTimestamp'
```

### 7. 이미지 업데이트 (Rolling Update)
```bash
# 프론트엔드 이미지 업데이트
kubectl set image deployment/board-frontend-deployment-lee \
  board-frontend-container=$ACR_URL/board-frontend-lee:$VERSION \
  -n lee

# 백엔드 이미지 업데이트
kubectl set image deployment/board-backend-deployment-lee \
  board-backend-container=$ACR_URL/board-backend-lee:$VERSION \
  -n lee

# 롤아웃 상태 모니터링
kubectl rollout status deployment/board-frontend-deployment-lee -n lee
kubectl rollout status deployment/board-backend-deployment-lee -n lee
```

## 배포 검증

### 1. 헬스 체크
```bash
# Pod 상태 확인
kubectl get pods -n lee -l app=board-frontend-lee
kubectl get pods -n lee -l app=board-backend-lee

# 로그 확인
kubectl logs -f deployment/board-backend-deployment-lee -n lee

# 포트 포워딩을 통한 직접 접근
kubectl port-forward service/board-backend-service-lee 8082:8082 -n lee
curl http://localhost:8082/actuator/health
```

### 2. 기능 테스트
```bash
# Gateway를 통한 접근 테스트
curl -I http://20.249.113.18:9000/board/

# API 응답 테스트
curl http://20.249.113.18:9000/board/api/posts

# 파일 업로드 테스트 (Postman 또는 웹 UI 사용)
```

### 3. 성능 체크
```bash
# 리소스 사용량 확인
kubectl top pods -n lee

# 응답 시간 측정
time curl -s http://20.249.113.18:9000/board/api/posts > /dev/null
```

## 배포 롤백

### 1. 롤백 히스토리 확인
```bash
kubectl rollout history deployment/board-frontend-deployment-lee -n lee
kubectl rollout history deployment/board-backend-deployment-lee -n lee
```

### 2. 이전 버전으로 롤백
```bash
# 직전 버전으로 롤백
kubectl rollout undo deployment/board-frontend-deployment-lee -n lee
kubectl rollout undo deployment/board-backend-deployment-lee -n lee

# 특정 revision으로 롤백
kubectl rollout undo deployment/board-backend-deployment-lee --to-revision=2 -n lee
```

### 3. 롤백 확인
```bash
kubectl rollout status deployment/board-backend-deployment-lee -n lee
kubectl get pods -n lee
```

## 일상 운영 작업

### 1. 로그 모니터링
```bash
# 실시간 로그 확인
kubectl logs -f deployment/board-backend-deployment-lee -n lee

# 최근 로그 확인 (지난 1시간)
kubectl logs --since=1h deployment/board-backend-deployment-lee -n lee

# 특정 시간 범위 로그
kubectl logs --since-time="2025-08-28T10:00:00Z" deployment/board-backend-deployment-lee -n lee
```

### 2. 스케일링
```bash
# 수동 스케일링
kubectl scale deployment board-backend-deployment-lee --replicas=3 -n lee

# HPA (Horizontal Pod Autoscaler) 설정
kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: board-backend-hpa
  namespace: lee
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: board-backend-deployment-lee
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF
```

### 3. 백업 및 복원
```bash
# 데이터베이스 백업 (Azure MySQL의 경우)
az mysql server backup list --resource-group kt16big --server-name your-mysql-server

# 파일 저장소 백업
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- tar czf /tmp/uploads-backup.tar.gz /app/uploads
kubectl cp lee/$(kubectl get pods -n lee -l app=board-backend-lee -o jsonpath='{.items[0].metadata.name}'):/tmp/uploads-backup.tar.gz ./uploads-backup.tar.gz
```

### 4. 설정 업데이트
```bash
# ConfigMap 업데이트
kubectl patch configmap board-config -n lee --patch='{"data":{"NEW_CONFIG":"new_value"}}'

# Pod 재시작 (설정 적용을 위해)
kubectl rollout restart deployment/board-backend-deployment-lee -n lee
```

## 트러블슈팅

### 1. Pod 시작 실패
```bash
# Pod 상태 자세히 보기
kubectl describe pod <pod-name> -n lee

# 이벤트 확인
kubectl get events --field-selector involvedObject.name=<pod-name> -n lee

# 일반적인 원인:
# - 이미지 Pull 실패 → ACR 인증 확인
# - 리소스 부족 → 노드 용량 확인
# - ConfigMap/Secret 누락 → 설정 확인
```

### 2. 서비스 접근 불가
```bash
# 서비스 엔드포인트 확인
kubectl get endpoints -n lee

# Gateway 라우팅 확인
kubectl logs -f deployment/gateway-deployment -n lee

# 네트워크 정책 확인
kubectl get networkpolicies -n lee
```

### 3. 데이터베이스 연결 실패
```bash
# 연결 테스트
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD -e "SELECT 1"

# 네트워크 연결 확인
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  telnet $DB_HOST 3306
```

### 4. 파일 업로드 실패
```bash
# 저장 디렉토리 권한 확인
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  ls -la /app/uploads

# 디스크 용량 확인
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  df -h /app/uploads
```

### 5. 성능 이슈
```bash
# 리소스 사용량 확인
kubectl top pods -n lee
kubectl top nodes

# JVM 힙 덤프 (필요시)
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  jmap -dump:live,format=b,file=/tmp/heap.hprof 1

# 스레드 덤프
kubectl exec -it deployment/board-backend-deployment-lee -n lee -- \
  jstack 1
```

### 6. 빠른 문제 해결 체크리스트

#### ✅ 기본 확인사항
- [ ] Pod 상태: `kubectl get pods -n lee`
- [ ] 서비스 상태: `kubectl get svc -n lee`  
- [ ] 이벤트 확인: `kubectl get events -n lee`
- [ ] 로그 확인: `kubectl logs -f deployment/board-backend-deployment-lee -n lee`

#### ✅ 네트워크 확인
- [ ] 서비스 엔드포인트: `kubectl get endpoints -n lee`
- [ ] Gateway 로그: 라우팅 규칙 확인
- [ ] DNS 해상도: `nslookup` 테스트

#### ✅ 애플리케이션 확인  
- [ ] 헬스 체크: `/actuator/health` 엔드포인트
- [ ] 데이터베이스 연결: Connection Pool 상태
- [ ] 파일 시스템: 디스크 용량 및 권한

이 가이드를 참고하여 Board-Lee 시스템을 안정적으로 배포하고 운영할 수 있습니다.
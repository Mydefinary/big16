# 🎨 Image Generation Platform - Lee

웹툰 캐릭터를 활용한 PPL 및 굿즈 이미지 생성 플랫폼입니다. React + FastAPI로 구성된 마이크로서비스 아키텍처를 기반으로 합니다.

## 📋 프로젝트 개요

이 프로젝트는 두 가지 주요 서비스를 제공합니다:
- **PPL 생성기**: 웹툰 캐릭터와 제품을 결합한 광고 이미지 생성
- **굿즈 생성기**: 웹툰 캐릭터를 활용한 굿즈 디자인 초안 생성

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐
│  PPL Frontend   │    │ Goods Frontend  │
│   (React)       │    │   (React)       │
│   Port: 80      │    │   Port: 80      │
└─────────────────┘    └─────────────────┘
        │                       │
        └───────┬───────────────┘
                │
        ┌───────▼───────┐
        │   Gateway     │
        │  (Routing)    │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │  Kubernetes   │
        │  Cluster (AKS)│
        └───────┬───────┘
                │
    ┌───────────┼───────────┐
    ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  PPL Backend    │    │ Goods Backend   │
│  (FastAPI)      │    │  (FastAPI)      │
│  Port: 8000     │    │  Port: 8001     │
└─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Replicate API  │    │   Black Forest  │
│  (AI Models)    │    │   Labs API      │
└─────────────────┘    └─────────────────┘
```

## 🚀 서비스 구성

### PPL 생성기 (Product Placement)
- **Frontend**: React 애플리케이션, Nginx로 서빙
- **Backend**: FastAPI 서버, Replicate API 연동
- **기능**: 캐릭터 이미지 + 제품 이미지 → PPL 광고 이미지 생성

### 굿즈 생성기 (Goods Generator)  
- **Frontend**: React 애플리케이션, Nginx로 서빙
- **Backend**: FastAPI 서버, Black Forest Labs API 연동
- **기능**: 캐릭터 이미지 → 굿즈 디자인 초안 생성

## 🛠️ 기술 스택

### Frontend
- **React 18**: 사용자 인터페이스
- **TypeScript**: 타입 안정성
- **Axios**: HTTP 클라이언트
- **CSS-in-JS**: 스타일링

### Backend
- **FastAPI**: Python 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Pydantic**: 데이터 검증
- **Python 3.10**: 런타임

### Infrastructure
- **Kubernetes (AKS)**: 컨테이너 오케스트레이션
- **Docker**: 컨테이너화
- **Azure Container Registry**: 이미지 레지스트리
- **NGINX Ingress**: 로드 밸런싱 및 라우팅

## 📁 프로젝트 구조

```
img-gen-pre-lee/
├── ppl-gen-react/
│   ├── frontend/                 # PPL 프론트엔드
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── App.jsx
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── backend/                  # PPL 백엔드
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── goods-gen-react/
│   ├── frontend/                 # 굿즈 프론트엔드
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── App.jsx
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── backend/                  # 굿즈 백엔드
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── all-deployment.yaml           # 통합 배포 파일
├── *-deployment.yaml            # 개별 서비스 배포 파일들
├── kubernetes-service-guide.md  # 서비스 추가 가이드
└── README.md                    # 이 파일
```

## 🚀 배포 방법

### 1. Docker 이미지 빌드 및 푸시

```bash
# PPL 생성기
cd ppl-gen-react/frontend
docker build -t kt16big.azurecr.io/ppl-gen-frontend-lee-2:latest .
cd ../backend  
docker build -t kt16big.azurecr.io/ppl-gen-backend-lee-2:latest .

# 굿즈 생성기
cd ../../goods-gen-react/frontend
docker build -t kt16big.azurecr.io/goods-gen-frontend-lee-2:latest .
cd ../backend
docker build -t kt16big.azurecr.io/goods-gen-backend-lee-2:latest .

# Azure Container Registry 로그인 및 푸시
az acr login --name kt16big
docker push kt16big.azurecr.io/ppl-gen-frontend-lee-2:latest
docker push kt16big.azurecr.io/ppl-gen-backend-lee-2:latest
docker push kt16big.azurecr.io/goods-gen-frontend-lee-2:latest
docker push kt16big.azurecr.io/goods-gen-backend-lee-2:latest
```

### 2. Kubernetes 배포

```bash
# 개별 서비스 배포
kubectl apply -f ppl-gen-backend-deployment.yaml
kubectl apply -f ppl-gen-frontend-deployment.yaml
kubectl apply -f goods-gen-backend-deployment.yaml
kubectl apply -f goods-gen-frontend-deployment.yaml

# 또는 통합 배포
kubectl apply -f all-deployment.yaml -n lee
```

### 3. 서비스 상태 확인

```bash
# 파드 상태 확인
kubectl get pods -n lee | grep -E "(ppl-gen|goods-gen)"

# 서비스 상태 확인
kubectl get services -n lee | grep -E "(ppl-gen|goods-gen)"

# 로그 확인
kubectl logs -f deployment/ppl-gen-backend-deployment-lee-2 -n lee
```

## 🔧 로컬 개발 환경

### Frontend 개발

```bash
cd ppl-gen-react/frontend  # 또는 goods-gen-react/frontend
npm install
npm start  # http://localhost:3000
```

### Backend 개발

```bash
cd ppl-gen-react/backend  # 또는 goods-gen-react/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000  # 또는 8001
```

## 🌐 API 엔드포인트

### PPL 생성기 API
- `POST /api/ppl-gen/generate`: PPL 이미지 생성
  - 캐릭터 이미지, 제품 이미지, 프롬프트 입력
  - 생성된 이미지 반환

### 굿즈 생성기 API  
- `POST /api/goods-gen/generate`: 굿즈 이미지 생성
  - 캐릭터 이미지, 프롬프트 입력
  - 생성된 굿즈 디자인 반환

## 🔐 환경 변수 및 시크릿

### PPL 백엔드
- `REPLICATE_API_TOKEN`: Replicate API 인증 토큰

### 굿즈 백엔드
- `BFL_API_KEY`: Black Forest Labs API 키

```bash
# 시크릿 생성 예시
kubectl create secret generic api-keys-secret \
  --from-literal=REPLICATE_API_TOKEN=your_token_here \
  --from-literal=BFL_API_KEY=your_key_here \
  -n lee
```

## 📊 리소스 요구사항

### Frontend 컨테이너
- **요청**: 100m CPU, 128Mi 메모리
- **제한**: 200m CPU, 256Mi 메모리

### Backend 컨테이너  
- **요청**: 500m CPU, 512Mi 메모리
- **제한**: 1000m CPU, 1Gi 메모리

## 🔍 모니터링 및 트러블슈팅

### 일반적인 문제 해결

1. **ImagePullBackOff 오류**
   ```bash
   # 이미지 태그 확인
   kubectl describe pod <pod-name> -n lee
   
   # 이미지 태그 업데이트
   kubectl set image deployment/<deployment-name> <container-name>=<new-image> -n lee
   ```

2. **서비스 연결 문제**
   ```bash
   # 서비스 상태 확인
   kubectl get endpoints -n lee
   
   # 네트워크 정책 확인
   kubectl get networkpolicies -n lee
   ```

## 🤝 기여 방법

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📝 추가 정보

- [Kubernetes 서비스 추가 가이드](./kubernetes-service-guide.md)
- [Docker 빌드 자동화](./build-automation.md)
- [API 문서](./api-docs.md)

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**License**: MIT License  
**Maintainer**: Lee Development Team  
**Last Updated**: 2025-08-19
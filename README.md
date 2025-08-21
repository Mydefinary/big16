# 웹툰 대시보드 - LEE Namespace

웹툰 관련 데이터의 분석 정보를 분석할 수 있는 대시보드입니다. Azure AKS의 LEE Namespace에서 Gateway 라우팅을 통해 서비스됩니다.

## 🎯 프로젝트 개요

### 주요 기능
- **웹툰 데이터 분석**: 2904개 웹툰 데이터 기반 통계 및 분석
- **AI 기반 태그 네트워킹**: TF-IDF 알고리즘을 활용한 키워드 분석
- **추천 시스템**: 하이브리드 추천 알고리즘
- **시각화 대시보드**: D3.js 기반 인터랙티브 차트
- **JWT 인증**: Gateway를 통한 통합 인증 시스템

### 기술 스택
- **Frontend**: React, D3.js, Tailwind CSS
- **Backend**: FastAPI, Python, TF-IDF, scikit-learn
- **Infrastructure**: Azure AKS, Docker, Kubernetes
- **Gateway**: Spring Cloud Gateway (JWT 인증)

## 🚀 서비스 구조

### LEE Namespace 서비스 맵
```
LEE Namespace (http://20.249.113.18:9000/)
├── gateway-lee-service (라우팅 및 JWT 인증)
├── auth-frontend (로그인/회원가입 UI)
├── auth-backend (JWT 토큰 관리)
├── user-backend (사용자 정보 관리)
├── board-frontend (게시판 UI)
├── board-backend (게시판 API)
├── webtoon-dashboard-frontend (웹툰 분석 UI) ← 이 프로젝트
├── webtoon-dashboard-backend (웹툰 분석 API) ← 이 프로젝트
├── chatbot (질의응답 시스템)
├── goods-gen-frontend/backend (굿즈 생성)
├── ppl-gen-frontend/backend (PPL 생성)
├── webtoon-hl-frontend/backend (하이라이트 생성)
└── zookeeper (Kafka 통신)
```

### 웹툰 대시보드 라우팅
- **Frontend**: `http://20.249.113.18:9000/webtoon/` 
- **Backend API**: `http://20.249.113.18:9000/webtoon-api/`

## 📋 로컬 개발 환경

### Prerequisites
- Docker Desktop
- kubectl (AKS 클러스터 연결)
- Azure CLI
- Node.js 16+ (프론트엔드 개발 시)
- Python 3.9+ (백엔드 개발 시)

### 환경 설정
```bash
# Azure 로그인 및 AKS 연결
az login
az aks get-credentials --resource-group <resource-group> --name <aks-cluster>

# ACR 로그인
az acr login --name kt16big

# LEE Namespace 확인
kubectl get services -n lee
```

### 로컬 개발 실행

#### Frontend 개발
```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

#### Backend 개발  
```bash
cd backend
pip install -r requirements.txt
python enhanced_main.py  # http://localhost:8000
```

## 🏗️ 배포 가이드

### Docker 이미지 빌드
```bash
# Backend 이미지 빌드
docker build -t kt16big.azurecr.io/webtoon-dashboard-backend-lee:latest ./backend

# Frontend 이미지 빌드  
docker build -t kt16big.azurecr.io/webtoon-dashboard-frontend-lee:latest ./frontend

# ACR에 푸시
docker push kt16big.azurecr.io/webtoon-dashboard-backend-lee:latest
docker push kt16big.azurecr.io/webtoon-dashboard-frontend-lee:latest
```

### Kubernetes 배포
```bash
# Backend 배포
kubectl apply -f webtoon-dashboard-backend-deployment.yaml -n lee

# Frontend 배포
kubectl apply -f webtoon-dashboard-frontend-deployment.yaml -n lee

# 배포 상태 확인
kubectl get pods -n lee | grep webtoon-dashboard
kubectl logs -f <pod-name> -n lee
```

## 🔧 주요 API 엔드포인트

### 데이터 조회
- `GET /webtoon-api/api/webtoons` - 전체 웹툰 목록
- `GET /webtoon-api/api/stats` - 통계 데이터
- `GET /webtoon-api/api/analysis/tags` - 태그 분석
- `GET /webtoon-api/api/analysis/heatmap` - 히트맵 데이터
- `GET /webtoon-api/api/analysis/network` - 네트워크 분석

### 추천 시스템
- `POST /webtoon-api/api/recommendations` - 기본 추천
- `POST /webtoon-api/api/recommendations/enhanced` - 고급 추천

### TF-IDF 분석
- `GET /webtoon-api/api/analysis/tfidf` - TF-IDF 벡터 분석
- `POST /webtoon-api/api/analysis/summary-keywords` - 키워드 추출

## 🐛 트러블슈팅

### 자주 발생하는 문제들

#### 1. 404 API 오류
**증상**: 모든 API 요청이 404 Not Found
**해결**: 
- Gateway 라우팅 경로 확인
- 백엔드 엔드포인트 경로 일치성 확인
- Docker 이미지 캐시 클리어 후 재빌드

#### 2. JWT 인증 오류  
**증상**: 401 Unauthorized 에러
**해결**:
- 토큰 만료 확인 (재로그인)
- Gateway 인증 설정 확인

#### 3. 정적 파일 로딩 실패
**증상**: CSS/JS 파일 404 오류
**해결**:
- `package.json`의 `homepage` 설정 확인
- `nginx.conf`의 location 설정 확인

## 📊 모니터링

### 서비스 상태 확인
```bash
# Pod 상태 확인
kubectl get pods -n lee | grep webtoon-dashboard

# 로그 확인
kubectl logs -f deployment/webtoon-dashboard-backend-deployment -n lee
kubectl logs -f deployment/webtoon-dashboard-frontend-deployment -n lee

# 서비스 엔드포인트 테스트
curl http://20.249.113.18:9000/webtoon-api/api/health
```

### 성능 메트릭
- **데이터**: 2904개 웹툰 정보
- **TF-IDF 특성**: 1000개 키워드
- **응답 시간**: 평균 < 500ms
- **메모리 사용량**: Backend ~512MB, Frontend ~256MB

## 👥 기여하기

### 개발 가이드라인
1. **브랜치 전략**: `webtoon-dashboard-lee` 브랜치에서 작업
2. **커밋 메시지**: `fix:`, `feat:`, `docs:` 등 컨벤션 준수
3. **코드 스타일**: ESLint (Frontend), Black (Backend)
4. **테스트**: 배포 전 로컬 환경에서 충분한 테스트

### Pull Request 가이드
1. 기능 구현 및 테스트 완료
2. LEE Namespace 가이드라인 준수 확인
3. 충돌 없는 Gateway 라우팅 확인
4. 코드 리뷰 요청

## 📞 지원

### 문제 해결
- **이슈 리포팅**: GitHub Issues 사용
- **개발 문의**: LEE Namespace 개발팀
- **배포 관련**: AKS 관리자 문의

### 관련 문서
- [LEE Namespace 가이드라인](./LEE-NAMESPACE-GUIDE.md)
- [Gateway 라우팅 설정](./docs/gateway-routing.md)
- [Claude Code 작업 가이드](./docs/claude-code-guide.md)

---

## 📈 버전 히스토리

### v2.0.0 (2025-08-20)
- TF-IDF 기반 고급 분석 추가
- Gateway 라우팅 완전 지원
- Docker 컨테이너화 완료
- LEE Namespace 통합

### v1.0.0 (초기 버전)
- 기본 웹툰 데이터 시각화
- 간단한 추천 시스템

---

**프로젝트 라이센스**: MIT License  
**마지막 업데이트**: 2025-08-20  
**개발자**: LEE Namespace Team

🤖 Generated with [Claude Code](https://claude.ai/code)
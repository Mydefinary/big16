# 웹툰 하이라이트 생성 서비스

LEE Namespace에서 운영되는 웹툰 하이라이트 4컷 자동 생성 서비스입니다. OpenAI GPT-4o를 활용하여 업로드된 웹툰 이미지들 중에서 하이라이트 장면을 선별하고 4컷 포스터를 생성합니다.

## 🎯 서비스 개요

### 주요 기능
- **멀티 이미지 업로드**: 최대 20장의 웹툰 이미지 동시 업로드
- **AI 기반 하이라이트 선별**: OpenAI GPT-4o가 스토리 흐름과 감정적 임팩트를 분석하여 최적의 4컷 선별
- **자동 포스터 생성**: 선별된 이미지를 2x2 그리드 레이아웃으로 자동 배치
- **JWT 인증**: LEE Namespace Gateway를 통한 통합 인증
- **반응형 UI**: 모바일과 데스크톱 모두 지원하는 사용자 친화적 인터페이스

### 기술 스택
- **Frontend**: React 19.1.1, TypeScript, Axios, React Router DOM
- **Backend**: FastAPI, Python 3.13, OpenAI API, Pillow
- **Infrastructure**: Azure AKS, Docker, Kubernetes
- **Gateway**: Spring Cloud Gateway (JWT 인증 통합)
- **Container Registry**: Azure Container Registry (ACR)

## 🏗️ 아키텍처

### LEE Namespace 서비스 맵
```
LEE Namespace (http://20.249.113.18:9000/)
├── gateway-lee-service (라우팅 및 JWT 인증)
│   └── /api/* → webtoon-hl-backend-service-lee-2:8003
│   └── /webtoon-hl/* → webtoon-hl-frontend-service-lee-2:80
├── auth-frontend (로그인/회원가입 UI)
├── auth-backend (JWT 토큰 관리)  
├── user-backend (사용자 정보 관리)
├── webtoon-hl-frontend (웹툰 하이라이트 UI) ← 이 서비스
├── webtoon-hl-backend (웹툰 하이라이트 API) ← 이 서비스
└── ... (기타 서비스들)
```

### 서비스 엔드포인트
- **Frontend**: `http://20.249.113.18:9000/webtoon-hl/`
- **Backend API**: `http://20.249.113.18:9000/api/highlight`
- **Gateway**: `http://20.249.113.18:9000/` (LoadBalancer)

## 🚀 빠른 시작

### 사전 요구사항
- Docker Desktop
- kubectl (AKS 클러스터 연결)
- Azure CLI
- OpenAI API Key (Secret으로 관리됨)

### 로컬 개발 환경

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
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir src
```

### 운영 환경 배포

#### 1. Docker 이미지 빌드
```bash
# Backend 이미지 빌드
docker build --no-cache -t kt16big.azurecr.io/webtoon-hl-backend-lee:latest ./backend

# Frontend 이미지 빌드  
docker build --no-cache -t kt16big.azurecr.io/webtoon-hl-frontend-lee:latest ./frontend
```

#### 2. ACR에 이미지 푸시
```bash
# Azure 로그인 및 ACR 로그인
az login
az acr login --name kt16big

# 이미지 푸시
docker push kt16big.azurecr.io/webtoon-hl-backend-lee:latest
docker push kt16big.azurecr.io/webtoon-hl-frontend-lee:latest
```

#### 3. Kubernetes 배포 업데이트
```bash
# 기존 배포에 새 이미지 적용
kubectl set image deployment/webtoon-hl-backend-deployment-lee-2 \
  webtoon-hl-backend-container-lee-2=kt16big.azurecr.io/webtoon-hl-backend-lee:latest -n lee

kubectl set image deployment/webtoon-hl-frontend-deployment-lee-2 \
  webtoon-hl-frontend-container-lee-2=kt16big.azurecr.io/webtoon-hl-frontend-lee:latest -n lee

# 배포 상태 확인
kubectl rollout status deployment/webtoon-hl-backend-deployment-lee-2 -n lee
kubectl rollout status deployment/webtoon-hl-frontend-deployment-lee-2 -n lee
```

## 📋 API 문서

### 웹툰 하이라이트 생성
**POST** `/api/highlight`

**Request:**
- Content-Type: `multipart/form-data`
- files: `File[]` (최대 20개 이미지 파일)

**Response:**
```json
{
  "result_image": "base64_encoded_image_string"
}
```

**Headers:**
- Authorization: `Bearer {JWT_TOKEN}` (필수)

## 🔧 환경 설정

### 환경 변수
- `OPENAI_API_KEY`: OpenAI API 키 (Kubernetes Secret으로 관리)
- `REACT_APP_HL_API`: Frontend API 기본 경로 (기본값: `/api`)

### Kubernetes 리소스
```yaml
# 현재 운영 중인 리소스
- webtoon-hl-backend-deployment-lee-2 (Backend)
- webtoon-hl-frontend-deployment-lee-2 (Frontend)  
- webtoon-hl-backend-service-lee-2 (Backend Service, Port: 8003)
- webtoon-hl-frontend-service-lee-2 (Frontend Service, Port: 80)
```

## 🔍 모니터링 및 로그

### 서비스 상태 확인
```bash
# Pod 상태 확인
kubectl get pods -n lee | grep webtoon-hl

# 로그 확인  
kubectl logs -f deployment/webtoon-hl-backend-deployment-lee-2 -n lee
kubectl logs -f deployment/webtoon-hl-frontend-deployment-lee-2 -n lee

# 서비스 연결 테스트
curl -H "Authorization: Bearer {token}" http://20.249.113.18:9000/api/highlight
```

### 성능 메트릭
- **이미지 처리 시간**: 평균 15-30초 (이미지 수에 따라 변동)
- **메모리 사용량**: Backend ~1GB, Frontend ~512MB
- **동시 처리**: 단일 Pod 기준 최대 3-5개 요청

## 🐛 트러블슈팅

### 자주 발생하는 문제

#### 1. 404 API 오류
**증상**: POST /api/highlight 요청이 404 Not Found
**해결**: 
- Gateway 라우팅 확인: `/api/*` 패턴이 backend로 라우팅되는지 확인
- Backend prefix 확인: `app.include_router(highlight.router, prefix="/api")`
- Service 포트 매핑 확인: Service Port 8003 → Target Port 8000

#### 2. 401 Unauthorized 오류
**증상**: API 요청 시 인증 실패
**해결**:
- JWT 토큰 유효성 확인 (만료 여부)
- 브라우저에서 로그인 후 재시도
- Gateway JWT 설정 확인

#### 3. 이미지 업로드 실패
**증상**: 파일 업로드 시 오류 발생
**해결**:
- 파일 크기 제한 확인 (개별 이미지 최대 10MB)
- 파일 형식 확인 (JPG, PNG, GIF 지원)
- OpenAI API 키 유효성 확인

#### 4. Docker 캐시 문제
**증상**: 코드 변경이 반영되지 않음
**해결**:
- `--no-cache` 옵션으로 완전 재빌드
- 고유한 이미지 태그 사용 (날짜-기능-버전)

## 📊 사용법

### 1. 웹툰 이미지 업로드
1. http://20.249.113.18:9000/webtoon-hl/ 접속
2. "파일 선택" 버튼으로 웹툰 이미지들 선택 (최대 20장)
3. "웹툰 4컷 하이라이트 제작하기" 버튼 클릭

### 2. AI 분석 및 하이라이트 생성
- AI가 업로드된 이미지들을 분석하여 스토리의 핵심 장면 4개 선별
- 자동으로 2x2 그리드 레이아웃의 포스터 생성
- 처리 시간: 이미지 수에 따라 15-30초 소요

### 3. 결과 확인 및 다운로드
- 생성된 4컷 하이라이트 포스터 미리보기
- 우클릭으로 이미지 저장 가능

## 🤝 기여하기

### 개발 가이드라인
1. **브랜치 전략**: `webtoon-hightlight-lee` 브랜치에서 작업
2. **커밋 메시지**: `feat:`, `fix:`, `docs:` 등 컨벤션 준수
3. **코드 스타일**: ESLint (Frontend), Black (Backend) 
4. **테스트**: 배포 전 로컬 환경에서 충분한 테스트

### Pull Request 가이드
1. 기능 구현 및 테스트 완료
2. LEE Namespace Gateway 라우팅 패턴 준수 확인
3. Docker 이미지 빌드 및 푸시 테스트
4. 코드 리뷰 요청

## 📞 지원

### 문제 해결
- **이슈 리포팅**: GitHub Issues 사용
- **개발 문의**: LEE Namespace 개발팀
- **배포 관련**: AKS 관리자 문의

### 관련 문서
- [LEE Namespace 서비스 통합 가이드](./LEE-NAMESPACE-INTEGRATION-GUIDE.md)
- [Gateway 라우팅 설정 가이드](./docs/gateway-routing.md)
- [Claude Code 개발 워크플로우](./docs/claude-code-workflow.md)

---

## 📈 버전 히스토리

### v1.0.0 (2025-08-20)
- 웹툰 하이라이트 4컷 자동 생성 기능 구현
- OpenAI GPT-4o 기반 이미지 분석 및 선별
- LEE Namespace Gateway 라우팅 통합
- React + FastAPI 풀스택 구현
- Azure AKS 컨테이너화 배포

---

**프로젝트 라이센스**: MIT License  
**마지막 업데이트**: 2025-08-20  
**개발자**: LEE Namespace Team

🤖 Generated with [Claude Code](https://claude.ai/code)
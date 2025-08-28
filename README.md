# Board-Lee 게시판 시스템

lee 네임스페이스에 배포된 현대적인 웹 게시판 시스템입니다. Spring Boot와 React를 기반으로 한 마이크로서비스 아키텍처를 채택하여 파일 첨부, 답글 시스템, 역할 기반 권한 관리를 지원합니다.

## 📋 개요

- **서비스 URL**: http://20.249.113.18:9000/board
- **네임스페이스**: `lee`
- **아키텍처**: React Frontend + Spring Boot Backend + MySQL
- **배포 환경**: Azure AKS (Kubernetes)

## 🏗️ 아키텍처

```
ToonConnect Gateway (20.249.113.18:9000)
├── /board/** → board-frontend-service-lee:80
└── /board/api/** → board-backend-service-lee:8082
```

### 컴포넌트

| 컴포넌트 | 기술 스택 | 포트 | 역할 |
|---------|-----------|------|------|
| **Frontend** | React + nginx | 80 | 사용자 인터페이스 |
| **Backend** | Spring Boot + JPA | 8082 | API 서버 |
| **Database** | MySQL (Azure) | 3306 | 데이터 저장 |

## ✨ 주요 기능

### 📝 게시판 기능
- ✅ CRUD 게시글 관리 (생성, 조회, 수정, 삭제)
- ✅ 계층형 답글 시스템 (무제한 깊이)
- ✅ 다중 파일 첨부 (최대 20개, PDF/JPG/PNG만 허용, 각 10MB 제한)
- ✅ 파일 다운로드 및 관리
- ✅ 제목/작성자 검색
- ✅ 페이지네이션 (성능 최적화)

### 🔐 인증 및 권한 관리
- ✅ JWT 토큰 기반 인증
- ✅ 역할 기반 접근 제어 (RBAC)
  - `admin`: 모든 권한
  - `operator`: 모든 글 읽기 + 본인 글 수정/삭제
  - `user`: 본인 글 및 본인 글의 답글만 접근
- ✅ 쿠키 기반 세션 관리

### 💬 댓글 시스템
- ✅ 댓글 작성, 수정, 삭제
- ✅ 실시간 댓글 업데이트
- ✅ 댓글별 작성자 및 작성시간 표시

### 🔒 보안 기능
- ✅ IP 기반 Rate Limiting (초당 3개 요청)
- ✅ JWT 인증 필터 (백엔드 API)
- ✅ 파일 업로드 보안 검증
- ✅ XSS 방지 입력 검증

## 🚀 배포 정보

### Docker 이미지
- **Frontend**: `kt16big.azurecr.io/board-frontend-lee:20250820-no-navbar`
- **Backend**: `kt16big.azurecr.io/board-backend-lee:20250820-dockerfile-context`

### Kubernetes 리소스
```bash
# Frontend
kubectl apply -f frontend/board-frontend-deployment.yaml

# Backend  
kubectl apply -f backend/board-backend-deployment.yaml
```

### Gateway 라우팅 설정
```yaml
# Frontend 라우팅 (정적 파일)
- id: board-frontend
  uri: http://board-frontend-service-lee:80
  predicates:
    - Path=/board/**

# Backend 라우팅 (API)  
- id: board-backend
  uri: http://board-backend-service-lee:8082
  predicates:
    - Path=/board/api/**
  filters:
    - name: JwtAuthenticationFilter
```

## 🛠️ 개발 환경

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.9+
- Docker
- kubectl (Azure AKS 액세스)

### 로컬 개발
```bash
# Frontend
cd frontend
npm install
npm run build

# Backend
cd backend
mvn clean package

# Docker 빌드 (Multi-stage)
docker build -t board-frontend .
docker build -t board-backend .
```

## 📁 프로젝트 구조

```
board-lee/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── api.js          # API 클라이언트
│   │   └── index.js        # 앱 엔트리포인트
│   ├── Dockerfile          # Multi-stage 빌드
│   ├── nginx.conf          # Nginx 설정
│   └── board-frontend-deployment.yaml
├── backend/                 # Spring Boot 백엔드
│   ├── src/main/java/com/example/boardapp/
│   │   ├── controller/     # REST 컨트롤러
│   │   ├── domain/         # JPA 엔티티
│   │   ├── service/        # 비즈니스 로직
│   │   └── repository/     # 데이터 접근
│   ├── Dockerfile          # Multi-stage 빌드
│   └── board-backend-deployment.yaml
└── docs/                   # 문서
    ├── LEE_NAMESPACE_SERVICE_GUIDE.md
    └── kubernetes-service-guide.md
```

## 🔧 주요 설정

### Frontend 설정
- **webpack publicPath**: `/board/` (Gateway 라우팅 일치)
- **nginx location**: `/board { alias /usr/share/nginx/html; }`
- **React Router basename**: `/board`

### Backend 설정  
- **context-path**: `/board` (Gateway 라우팅 일치)
- **API prefix**: `/api`
- **MySQL 연동**: Azure DB 환경변수 사용

## 🐛 트러블슈팅

### 자주 발생하는 문제

1. **bundle.js 404 오류**
   - webpack publicPath가 `/board/`로 설정되어 있는지 확인
   - nginx 설정에서 정적 파일 경로가 올바른지 확인

2. **API 404 오류**
   - Backend context-path가 `/board`로 설정되어 있는지 확인
   - Gateway 라우팅에서 `/board/api/**` 패턴이 있는지 확인

3. **댓글 기능 안됨**
   - Frontend에서 올바른 API baseURL (`/board/api`) 사용하는지 확인

## 🤝 기여

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📞 지원

문제가 있거나 질문이 있으시면 다음을 참고하세요:
- **서비스 가이드**: [LEE_NAMESPACE_SERVICE_GUIDE.md](docs/LEE_NAMESPACE_SERVICE_GUIDE.md)
- **Kubernetes 가이드**: [kubernetes-service-guide.md](docs/kubernetes-service-guide.md)

---
**🤖 Generated with [Claude Code](https://claude.ai/code)**
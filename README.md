# 웹툰 통합 챗봇 서비스 (Chatbot-Lee)

Azure AKS 환경의 lee namespace에서 동작하는 웹툰 관련 질의응답 챗봇 서비스입니다.

## 🎯 프로젝트 개요

본 프로젝트는 웹툰과 관련된 다양한 질문에 답변하는 AI 챗봇 서비스로, ChatGPT 스타일의 현대적인 UI와 FastAPI 기반의 백엔드를 제공합니다.

### 주요 기능
- 📱 **ChatGPT 스타일 UI**: 직관적이고 현대적인 대화형 인터페이스
- 🤖 **AI 질의응답**: OpenAI GPT-4 기반의 웹툰 관련 질의응답
- 💬 **대화 관리**: 다중 대화 스레드 지원 및 로컬 저장
- 🔐 **JWT 인증**: 안전한 사용자 인증 시스템
- 🚀 **Kubernetes 배포**: Azure AKS 환경에서 확장 가능한 배포

## 🏗️ 시스템 아키텍처

```
Internet → Gateway (External IP) → Services
                ↓
┌─────────────────────────────────────────────┐
│             lee namespace                    │
├─────────────────────────────────────────────┤
│ /question/** → question-frontend-service-lee-2  │
│ /question-api/** → question-backend-service-lee-2 │
└─────────────────────────────────────────────┘
```

### 서비스 구성
- **Frontend**: React + TypeScript + Vite (ChatGPT 스타일 UI)
- **Backend**: FastAPI + Python (AI 질의응답 처리)
- **Gateway**: Spring Cloud Gateway (라우팅 및 로드밸런싱)
- **Infrastructure**: Azure AKS + Container Registry

## 📋 환경 요구사항

### 개발 환경
- Node.js 20+
- Python 3.11+
- Docker
- Azure CLI
- kubectl

### 운영 환경
- Azure AKS Cluster
- lee namespace
- ragpool node (16GB RAM) - Backend용
- Container Registry (kt16big.azurecr.io)

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd chatbot-lee
```

### 2. Frontend 개발 서버 실행
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend 개발 서버 실행
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8083
```

## 🐳 Docker 빌드 및 배포

### Frontend 빌드
```bash
cd frontend
docker build -t kt16big.azurecr.io/question-frontend-lee-2:latest .
docker push kt16big.azurecr.io/question-frontend-lee-2:latest
```

### Backend 빌드
```bash
cd backend
docker build -t kt16big.azurecr.io/question-backend-lee-2:latest .
docker push kt16big.azurecr.io/question-backend-lee-2:latest
```

### Kubernetes 배포
```bash
# Frontend 배포
kubectl set image deployment/question-frontend-deployment-lee-2 \
  question-frontend-container-lee-2=kt16big.azurecr.io/question-frontend-lee-2:latest -n lee

# Backend 배포 (ragpool 노드 사용)
kubectl set image deployment/question-backend-deployment-lee-2 \
  question-backend-container-lee-2=kt16big.azurecr.io/question-backend-lee-2:latest -n lee
```

## 🔧 설정

### Backend 환경변수
```bash
# .env 파일 생성
OPENAI_API_KEY=your_openai_api_key
WEBTOON_CSV_PATH=./webtoon_data.csv
CHROMA_DIR=./chroma_db5
FAISS_DB_DIR=./db
```

### Frontend 설정
```typescript
// vite.config.mts
export default defineConfig({
  plugins: [react()],
  base: '/question/',  // Gateway 라우팅과 일치
  server: {
    host: true,
    port: 3000,
  },
})
```

## 📡 API 엔드포인트

### 인증
- `GET /auths/me` - 사용자 인증 확인
- `POST /auths/login` - 로그인

### 챗봇
- `POST /question-api/ask` - 질의응답
  ```json
  {
    "question": "웹툰에 대해 알려주세요",
    "session_id": "unique_session_id"
  }
  ```

## 🌐 접속 URL

- **서비스 URL**: http://20.249.113.18:9000/question
- **네임스페이스**: lee
- **Gateway 외부 IP**: 20.249.113.18:9000

## 🔍 모니터링

### 서비스 상태 확인
```bash
# Pod 상태 확인
kubectl get pods -n lee | grep question

# 서비스 엔드포인트 확인
kubectl get endpoints -n lee | grep question

# 로그 확인
kubectl logs -n lee deployment/question-backend-deployment-lee-2
kubectl logs -n lee deployment/question-frontend-deployment-lee-2
```

## 🛠️ 트러블슈팅

### 일반적인 문제들

1. **404 Not Found**
   - Gateway 라우팅 설정 확인
   - 서비스 이름과 포트 매핑 확인

2. **405 Method Not Allowed**
   - Frontend API baseURL 설정 확인
   - 엔드포인트 경로 일치성 확인

3. **500 Internal Server Error**
   - Backend 환경변수 설정 확인
   - OpenAI API 키 유효성 확인

## 📚 관련 문서

- [서비스 추가 가이드라인](./KUBERNETES_SERVICE_GUIDE.md)
- [Gateway 라우팅 설정](./docs/gateway-routing.md)
- [개발 워크플로우](./docs/development-workflow.md)

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

🤖 **Claude Code**로 개발 · 배포됨
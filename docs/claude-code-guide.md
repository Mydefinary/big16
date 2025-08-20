# Claude Code를 활용한 LEE Namespace 개발 가이드

Claude Code로 LEE Namespace에서 효율적으로 개발하기 위한 실무 가이드입니다.

## 🤖 Claude Code 개발 철학

### LEE Namespace에서의 핵심 원칙
```yaml
1. Gateway 설정 보존
   - 기존 Gateway 라우팅은 절대 수정하지 않음
   - 서비스 코드를 Gateway에 맞춰 적응

2. 기존 패턴 분석 우선
   - 성공한 서비스(webtoon-dashboard, board) 참조
   - 동일한 구조와 패턴 적용

3. 점진적 문제 해결
   - 작은 단위로 문제 분석
   - 단계적 검증 및 수정

4. 완전한 테스트
   - 로컬 테스트 → Docker 빌드 → Kubernetes 배포
   - 각 단계별 검증 필수
```

## 📋 Claude Code 작업 워크플로우

### 1단계: 환경 분석 및 이해
```bash
# 현재 상태 파악
kubectl get services -n lee                    # 기존 서비스 확인
kubectl get pods -n lee                        # 실행 중인 Pod 확인  
kubectl logs <existing-service-pod> -n lee     # 기존 서비스 로그 분석

# Gateway 라우팅 패턴 분석
curl http://20.249.113.18:9000/webtoon/        # Frontend 접근 테스트
curl http://20.249.113.18:9000/webtoon-api/    # Backend 접근 테스트
```

**Claude Code 명령어 예시:**
```
"LEE namespace의 현재 서비스들을 분석하고, webtoon-dashboard 서비스의 라우팅 패턴을 파악해줘"
```

### 2단계: 기존 성공 사례 분석
```bash
# 성공한 서비스 구조 분석
ls -la webtoon-dashboard-*                     # 파일 구조 확인
cat webtoon-dashboard-*-deployment.yaml        # Kubernetes 설정 확인
grep -r "webtoon-api" frontend/src/            # API 호출 패턴 확인
```

**Claude Code 명령어 예시:**
```
"webtoon-dashboard 서비스의 frontend와 backend 설정을 분석해서, 새로운 chatbot 서비스에 적용할 수 있는 패턴을 알려줘"
```

### 3단계: 새 서비스 설계 및 구현
```yaml
설계 요소:
- 서비스명 결정 (chatbot)
- 라우팅 경로 설계 (/chatbot/**, /chatbot-api/**)  
- 포트 할당 (기존 포트와 충돌 없이)
- Docker 이미지 태그 규칙
- Kubernetes 리소스명
```

**Claude Code 명령어 예시:**
```
"chatbot 서비스를 LEE namespace 가이드라인에 맞춰 구현해줘. 
webtoon-dashboard와 동일한 패턴으로 frontend는 React, backend는 FastAPI로 만들어줘"
```

### 4단계: Docker 이미지 빌드 및 배포
```bash
# 이미지 빌드 (캐시 방지)
docker build --no-cache -t kt16big.azurecr.io/chatbot-backend-lee:latest ./backend
docker build --no-cache -t kt16big.azurecr.io/chatbot-frontend-lee:latest ./frontend

# ACR 푸시
docker push kt16big.azurecr.io/chatbot-backend-lee:latest
docker push kt16big.azurecr.io/chatbot-frontend-lee:latest
```

**Claude Code 명령어 예시:**
```
"chatbot 서비스의 Docker 이미지를 빌드하고 ACR에 푸시한 다음, 
Kubernetes에 배포까지 완료해줘"
```

### 5단계: 배포 및 검증
```bash
# Kubernetes 배포
kubectl apply -f chatbot-backend-deployment.yaml -n lee
kubectl apply -f chatbot-frontend-deployment.yaml -n lee

# 배포 상태 확인
kubectl rollout status deployment/chatbot-backend-deployment -n lee
kubectl get pods -n lee | grep chatbot
```

**Claude Code 명령어 예시:**
```
"chatbot 서비스가 정상적으로 배포되었는지 확인하고, 
Gateway를 통한 접근이 제대로 되는지 테스트해줘"
```

## 🔧 Claude Code 실무 팁

### 효과적인 요청 방법

#### 1. 구체적인 컨텍스트 제공
```
❌ 나쁜 예:
"API가 404 오류가 나는데 고쳐줘"

✅ 좋은 예:  
"LEE namespace의 webtoon-dashboard 서비스에서 /webtoon-api/api/stats API가 404 오류를 반환합니다. 
Gateway 라우팅은 /webtoon-api/**로 설정되어 있고, 백엔드 로그를 확인해서 문제를 찾아주세요"
```

#### 2. 단계별 작업 요청
```
❌ 나쁜 예:
"새로운 마이크로서비스를 만들어줘"

✅ 좋은 예:
"1. 먼저 LEE namespace의 기존 서비스 패턴을 분석해줘
2. chatbot 서비스의 라우팅 설계를 해줘  
3. FastAPI 백엔드를 구현해줘
4. React 프론트엔드를 구현해줘
5. Docker 이미지를 빌드하고 배포해줘"
```

#### 3. 제약사항 명시
```
✅ 항상 포함할 내용:
"LEE namespace에서 작업하고, Gateway 설정은 변경하지 말고, 
기존 webtoon-dashboard 패턴을 따라서 구현해줘"
```

### 문제 해결 시 Claude Code 활용

#### 404 라우팅 오류
```bash
Claude Code 분석 요청:
"현재 백엔드 로그를 확인하고, Gateway 라우팅 패턴과 실제 엔드포인트 경로가 일치하는지 분석해줘. 
webtoon-dashboard 서비스의 성공 사례와 비교해서 문제점을 찾아줘"

기대 결과:
- 로그 분석을 통한 실제 요청 경로 파악
- Gateway 패턴과의 일치성 확인
- 수정 방안 제시
```

#### JWT 인증 문제
```bash
Claude Code 분석 요청:
"JWT 토큰 관련 오류가 발생하고 있습니다. 
프론트엔드에서 Authorization 헤더가 제대로 포함되는지 확인하고, 
백엔드에서 토큰 검증이 올바르게 되는지 분석해줘"

기대 결과:
- Frontend API 호출 코드 점검
- Backend JWT 처리 로직 확인
- 토큰 만료 처리 개선
```

#### Docker 이미지 문제
```bash
Claude Code 분석 요청:
"Docker 이미지를 새로 빌드했는데 이전 코드가 실행되고 있습니다. 
캐시 문제를 해결하고 최신 코드가 반영되도록 해줘"

기대 결과:
- --no-cache 옵션 사용
- 이미지 태그 업데이트
- Kubernetes 배포 확인
```

## 📊 Claude Code 성공 사례 분석

### 웹툰 대시보드 프로젝트 복기

#### 초기 문제점들
```yaml
1. Gateway 라우팅 불일치
   - 요청: webtoon-dashboard 팀이 새로운 라우팅 설정 요청
   - Claude Code 접근: 기존 Gateway 설정 분석 후 코드 적응

2. API 경로 중복 문제  
   - 문제: /webtoon-api/api/api/stats (api 중복)
   - Claude Code 해결: 패턴 분석 후 체계적 수정

3. Docker 캐시 문제
   - 문제: 코드 변경이 이미지에 반영되지 않음
   - Claude Code 해결: --no-cache 옵션과 태그 관리
```

#### Claude Code 해결 과정
```bash
1단계: 문제 현상 분석
- kubectl logs로 실제 오류 확인
- Gateway 라우팅 패턴 파악
- 기존 성공 서비스와 비교

2단계: 근본 원인 파악  
- API 경로 중복 발견
- Docker 캐시 문제 식별
- Gateway 설정 변경 불필요 확인

3단계: 체계적 수정
- 모든 API 엔드포인트 경로 수정
- 캐시 없는 완전 재빌드
- 단계별 배포 및 검증

4단계: 최종 검증
- 모든 API 200 OK 응답 확인
- 프론트엔드 정상 동작 확인
- 문서화 및 가이드라인 작성
```

#### 학습된 Claude Code 패턴
```yaml
효과적인 패턴:
1. 현상 → 원인 → 해결 → 검증 순서
2. 기존 성공 사례 참조 우선
3. 작은 변경 단위로 점진적 접근
4. 각 단계별 충분한 검증
5. 완료 후 문서화 및 가이드라인화
```

## 🛠️ Claude Code 개발 환경 최적화

### .claude/settings.local.json 설정
```json
{
  "rules": {
    "allow": [
      "Bash(kubectl get:*)",
      "Bash(kubectl logs:*)", 
      "Bash(kubectl apply:*)",
      "Bash(kubectl exec:*)",
      "Bash(curl:*)",
      "Bash(docker build:*)",
      "Bash(docker push:*)",
      "Bash(git add:*)"
    ],
    "deny": [],
    "ask": []
  }
}
```

### 자주 사용하는 Claude Code 명령어 모음

#### 상태 확인
```bash
"LEE namespace의 모든 서비스 상태를 확인하고, 웹툰 대시보드 관련 Pod들의 로그를 분석해줘"
```

#### 문제 진단
```bash
"현재 404 오류가 발생하는 API들을 분석하고, Gateway 라우팅과 백엔드 엔드포인트의 일치성을 확인해줘"
```

#### 배포 자동화
```bash
"변경된 코드를 Docker 이미지로 빌드하고, ACR에 푸시한 다음 Kubernetes에 배포까지 완료해줘"
```

#### 테스트 실행
```bash
"배포된 서비스가 Gateway를 통해 정상적으로 접근되는지 테스트하고, JWT 인증도 확인해줘"
```

## ⚠️ Claude Code 작업 시 주의사항

### 해야 할 것 (Do's)
```yaml
✅ 기존 패턴 분석 우선
✅ 작은 단위로 점진적 변경
✅ 각 단계별 충분한 검증
✅ Gateway 설정 보존
✅ 문서화 및 로그 기록
✅ 기존 성공 서비스 참조
```

### 하지 말아야 할 것 (Don'ts)
```yaml
❌ Gateway 설정 변경 요청
❌ 한 번에 모든 것 변경
❌ 검증 없는 배포
❌ 기존 서비스 영향 주는 변경
❌ 포트 충돌 무시
❌ 캐시 문제 간과
```

### 에러 발생 시 Claude Code 대응
```yaml
1. 즉시 롤백 가능성 확보
   "이전 정상 동작 이미지로 롤백할 수 있게 준비해줘"

2. 로그 기반 분석 요청
   "현재 오류 로그를 분석하고 근본 원인을 파악해줘"

3. 단계별 해결 요청  
   "가장 간단한 해결책부터 단계적으로 적용해줘"

4. 검증 과정 포함
   "각 수정 후에 반드시 동작 테스트를 해줘"
```

## 📚 Claude Code 레퍼런스

### 템플릿 명령어 모음

#### 새 서비스 개발
```
"LEE namespace에 {service-name} 서비스를 추가하려고 합니다.
1. 기존 webtoon-dashboard 패턴을 분석해서 라우팅 설계를 해주세요
2. {기술스택}으로 frontend와 backend를 구현해주세요  
3. Docker 이미지 빌드부터 Kubernetes 배포까지 완료해주세요
4. Gateway를 통한 접근 테스트까지 검증해주세요"
```

#### 문제 해결
```
"LEE namespace의 {service-name}에서 {구체적 증상}이 발생합니다.
현재 상황을 분석하고 단계적으로 해결해주세요.
기존 정상 동작하는 webtoon-dashboard와 비교해서 차이점을 찾아주세요."
```

#### 배포 및 업데이트
```
"{service-name}의 {component}를 수정했습니다.
Docker 이미지를 새로 빌드하고 배포해서 정상 동작하는지 확인해주세요.
이전 버전으로 롤백 가능하도록 태그 관리도 해주세요."
```

---

**Claude Code를 활용하면 LEE Namespace에서 안전하고 효율적인 개발이 가능합니다.**

**문서 버전**: v1.0  
**마지막 업데이트**: 2025-08-20  
**작성자**: LEE Namespace Development Team

🤖 Generated with [Claude Code](https://claude.ai/code)
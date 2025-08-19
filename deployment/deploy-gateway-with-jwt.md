# JWT 인증이 적용된 Gateway 배포 가이드

## 현재 상황
- ✅ Ingress 설정 완료: 모든 요청이 Gateway로 라우팅됨
- ✅ JWT 인증 코드 완성: Cookie 기반 JWT 인증 필터 구현됨
- ⚠️ 배포 대기: 새로운 Gateway 설정이 운영 환경에 반영 필요

## 배포 방법

### 1. Gateway Docker 이미지 재빌드
```bash
cd gateway/
docker build -t kt16big.azurecr.io/gateway-hoa:latest .
docker push kt16big.azurecr.io/gateway-hoa:latest
```

### 2. Gateway 배포 업데이트
```bash
kubectl rollout restart deployment gateway-deployment-hoa
kubectl rollout status deployment/gateway-deployment-hoa
```

### 3. 테스트
```bash
# 인증 없이 보호된 서비스 접근 (401 예상)
curl -s -o /dev/null -w "%{http_code}" http://20.249.154.2/ppl-gen

# 로그인 후 쿠키로 접근 (200 예상)
# 1. 로그인하여 쿠키 획득
# 2. 쿠키와 함께 보호된 서비스 접근
```

## JWT 인증 동작

### 보호된 경로
- `/ppl-gen`, `/ppl-gen/**` - PPL 생성기
- `/goods-gen`, `/goods-gen/**` - 굿즈 생성기
- `/board`, `/board/**` - 게시판
- `/webtoon-dashboard`, `/webtoon-dashboard/**` - 웹툰 대시보드
- `/webtoon-hl`, `/webtoon-hl/**` - 웹툰 하이라이트

### 인증 방식
1. 쿠키 우선: `accessToken` 쿠키에서 JWT 토큰 추출
2. 헤더 대체: Authorization Bearer 헤더에서 토큰 추출
3. 인증 실패 시: 401 Unauthorized 응답

### 로그인/로그아웃 엔드포인트
- `POST /api/auths/login` - 로그인 (HttpOnly 쿠키 설정)
- `POST /api/auths/logout` - 로그아웃 (쿠키 삭제)
- `GET /api/auths/check` - 인증 상태 확인

## 확인 사항
✅ Ingress-Gateway-서비스 라우팅 구조 완성
✅ JWT 필터 로직 구현 완료
✅ 쿠키 기반 인증 시스템 구현
⚠️ Docker 이미지 재빌드 및 배포 필요
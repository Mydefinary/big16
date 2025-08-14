# 🚀 로컬-클라우드 하이브리드 배포 가이드

## 현재 상황
- ✅ **Vercel 프론트엔드**: 정상 배포됨
- ❌ **Railway 백엔드**: 502 에러 (재배포 중)
- ✅ **로컬 백엔드**: TF-IDF 포함 완벽 작동

## 즉시 사용할 수 있는 하이브리드 방법

### 1. 로컬 백엔드 실행
```bash
cd /Users/sinyoung/big16/webtoon-dashboard/backend

# TF-IDF 버전 실행 (포트 8000)
python3 enhanced_main.py

# 또는 기존 버전 실행
python3 main.py
```

### 2. 프론트엔드 환경 변수 수정
```bash
cd /Users/sinyoung/big16/webtoon-dashboard/frontend

# 로컬 백엔드 연결
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# 프론트엔드 실행
npm start
```

### 3. 공개 터널링 (ngrok 사용)
로컬 백엔드를 외부에서 접근 가능하게 만들기:

```bash
# ngrok 설치 (없는 경우)
brew install ngrok

# 로컬 8000 포트를 공개
ngrok http 8000
```

그 다음 ngrok에서 제공하는 HTTPS URL을 Vercel 환경변수에 설정:
```bash
# Vercel CLI 사용 (설치된 경우)
vercel env add REACT_APP_API_URL
# 값: https://abc123.ngrok.io (ngrok에서 제공한 URL)
```

## Railway 재배포 대기 중...

방금 빈 커밋을 푸시해서 Railway 재배포를 트리거했습니다:
- 일반적으로 3-5분 소요
- 자동 배포가 설정되어 있으면 자동 시작
- 배포 로그는 Railway 대시보드에서 확인 가능

## 문제 해결 체크리스트

### Railway 백엔드가 계속 안되면:
1. Railway 대시보드에서 수동 재배포
2. 환경 변수 확인 (특히 PORT=8000)
3. 빌드 로그 확인
4. Dockerfile 점검

### 프론트엔드 API 연결 확인:
```javascript
// 브라우저 개발자 도구에서 테스트
fetch('/api/health').then(r => r.json()).then(console.log)
```

### TF-IDF 기능 테스트:
```javascript
// TF-IDF 분석 테스트
fetch('/api/analysis/tfidf').then(r => r.json()).then(console.log)
```

## 현재 추천 배포 방식

**임시 (지금 당장):**
- 로컬 백엔드 + 로컬 프론트엔드

**단기 (Railway 복구 후):**
- Railway 백엔드 + Vercel 프론트엔드

**장기 (안정성을 위해):**
- Vercel 백엔드 + Vercel 프론트엔드 (모노레포)
- 또는 AWS/GCP 이중화

## 성능 비교

| 방식 | 속도 | 안정성 | TF-IDF 지원 |
|------|------|--------|-------------|
| 로컬 하이브리드 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |
| Railway + Vercel | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ |
| 기존 배포 | ❌ | ❌ | ❌ |
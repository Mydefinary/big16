# AKS 서비스 연결 문제 해결 기록

**작업일**: 2025-08-18  
**작업자**: Claude Code  
**목적**: 프론트엔드 서비스들의 빈 화면 및 500 에러 해결  

## 🚨 발견된 문제들

### 1. 게이트웨이 라우팅 설정 문제
- **webtoon-hl-frontend**: 게이트웨이에서 포트 3003 사용하지만 실제로는 포트 80에서 실행
- **정적 자산 라우팅 누락**: 모든 프론트엔드 서비스의 JS/CSS 파일에 대한 전용 라우트 없음

### 2. 서비스 포트 불일치 문제
- **ppl-gen-frontend**: Kubernetes Service targetPort가 80이었지만 nginx는 포트 3000에서 실행
- **다른 서비스들**: targetPort와 실제 nginx 포트 일치

### 3. nginx 설정 문제
- **webtoon-dashboard**: `/webtoon/` 경로 처리로 인한 정적 파일 라우팅 실패

## ✅ 적용된 해결책

### 1. Kubernetes Service 포트 수정
```bash
# ppl-gen-frontend만 targetPort를 3000으로 수정 (nginx가 포트 3000에서 실행)
kubectl patch svc ppl-gen-frontend-service -p '{"spec":{"ports":[{"port":80,"targetPort":3000}]}}'

# 나머지 서비스들은 targetPort 80 유지 (nginx가 포트 80에서 실행)
kubectl patch svc board-frontend-service -p '{"spec":{"ports":[{"port":80,"targetPort":80}]}}'
kubectl patch svc webtoon-dashboard-frontend-service -p '{"spec":{"ports":[{"port":80,"targetPort":80}]}}'
kubectl patch svc webtoon-hl-frontend-service -p '{"spec":{"ports":[{"port":80,"targetPort":80}]}}'
```

### 2. 게이트웨이 설정 수정
**주요 변경사항**:
- `webtoon-hl-frontend` URI: `http://webtoon-hl-frontend-service:3003` → `http://webtoon-hl-frontend-service:80`
- 모든 프론트엔드 서비스에 정적 자산 전용 라우트 추가
- 라우팅 우선순위 조정 (정적 자산 → 일반 페이지)

**파일 위치**: `gateway/src/main/resources/application-fixed.yml`

### 3. webtoon-dashboard nginx 설정 수정
**변경 전**:
```nginx
location /webtoon/ {
    alias /usr/share/nginx/html/;
    index index.html index.htm;
    try_files $uri $uri/ /webtoon/index.html;
}
```

**변경 후**:
```nginx
location / {
    root   /usr/share/nginx/html;
    index  index.html index.htm;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    try_files $uri $uri/ /index.html;
}
```

### 4. ppl-gen 경로 문제 해결
ppl-gen HTML이 `/ppl-gen/static/js/` 경로를 참조하지만 실제 파일은 `/static/js/`에 있었음:
```bash
kubectl exec ppl-gen-frontend-deployment-xxx -- sh -c "mkdir -p /usr/share/nginx/html/ppl-gen && cp -r /usr/share/nginx/html/static /usr/share/nginx/html/ppl-gen/"
```

## 📊 최종 서비스 포트 설정

| 서비스명 | Service Port | Target Port | nginx 포트 | 상태 |
|---------|-------------|-------------|-----------|------|
| **ppl-gen-frontend-service** | 80 | **3000** | 3000 | ✅ |
| **goods-gen-frontend-service** | 80 | 3000 | 3000 | ✅ |
| **board-frontend-service** | 80 | 80 | 80 | ✅ |
| **webtoon-dashboard-frontend-service** | 80 | 80 | 80 | ✅ |
| **webtoon-hl-frontend-service** | 80 | 80 | 80 | ✅ |

## 🔧 ConfigMap 적용 방법

### 게이트웨이 설정 적용:
```bash
# 1. ConfigMap 생성
kubectl create configmap gateway-config --from-file=application.yml=gateway/src/main/resources/application-fixed.yml

# 2. Deployment에 ConfigMap 마운트
kubectl patch deployment gateway-deployment-hoa -p '{"spec":{"template":{"spec":{"volumes":[{"name":"config-volume","configMap":{"name":"gateway-config"}}],"containers":[{"name":"gateway-container-hoa","volumeMounts":[{"name":"config-volume","mountPath":"/app/config","readOnly":true}],"env":[{"name":"SPRING_CONFIG_LOCATION","value":"classpath:/application.yml,/app/config/application.yml"}]}]}}}}'

# 3. 재시작
kubectl rollout restart deployment/gateway-deployment-hoa
```

## 🎯 결과

### ✅ 해결된 서비스:
- **ppl-gen**: 정상 작동 (포트 수정 + 경로 문제 해결)
- **goods-gen**: 정상 작동 (이미 올바른 설정이었음)

### ⚠️ 부분 해결된 서비스:
- **webtoon-hl**: JavaScript 로드 성공, React 앱 초기화 문제 남음
- **board**: JavaScript 로드 성공, React 앱 초기화 문제 남음
- **webtoon-dashboard**: nginx 설정은 수정했으나 여전히 정적 자산 라우팅 문제

### 🔍 남은 문제:
1. **React 앱 초기화 실패**: webtoon-hl, board는 JS 파일은 로드되지만 빈 화면
2. **상대 경로 문제**: webtoon-dashboard의 `./static/js/` 상대 경로로 인한 라우팅 실패

## 📁 저장된 파일들

1. **gateway/src/main/resources/application-fixed.yml** - 수정된 게이트웨이 설정
2. **nginx-configs/webtoon-dashboard-nginx.conf** - 수정된 webtoon-dashboard nginx 설정
3. **nginx-configs/board-frontend-nginx.conf** - board nginx 설정 백업
4. **nginx-configs/webtoon-hl-frontend-nginx.conf** - webtoon-hl nginx 설정 백업
5. **AKS-SERVICE-FIXES.md** - 이 문서

## 📋 추후 권장사항

1. **빌드 설정 통일**: 모든 프론트엔드를 절대 경로로 빌드하도록 webpack/vite 설정 수정
2. **React 환경 변수**: API 엔드포인트 설정 확인 및 CORS 정책 점검
3. **Docker 이미지 재빌드**: nginx 설정 변경사항을 영구적으로 적용하기 위해 이미지 재빌드 필요
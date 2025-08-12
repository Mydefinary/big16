# frontend/Dockerfile

### 1단계: 빌드 환경 설정 (Node.js) ###
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json 과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 전체 복사
COPY . .

# React 애플리케이션 빌드
RUN npm run build


### 2단계: 실행 환경 설정 (NGINX) ###
FROM nginx:stable-alpine

# ✅ [추가] 위에서 만든 NGINX 설정을 복사하여 기본 설정을 덮어씀
COPY --from=builder /app/nginx/default.conf /etc/nginx/conf.d/default.conf

# 빌드된 React 결과물을 NGINX의 기본 웹 루트 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 80번 포트를 외부에 노출
EXPOSE 80

# NGINX 실행
CMD ["nginx", "-g", "daemon off;"]
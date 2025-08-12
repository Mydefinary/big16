# ===================================================
# 1. 빌드 스테이지 (Build Stage)
# ===================================================
# Node.js 최신 안정화 버전 이미지를 빌드 환경으로 사용
FROM node:18-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# 먼저 package.json과 package-lock.json을 복사하여 의존성을 설치합니다.
# 이 파일들이 변경되지 않으면 의존성 설치 단계는 캐시되어 빌드 속도가 향상됩니다.
COPY package*.json ./
RUN npm install

# 전체 소스 코드를 복사합니다.
COPY . .

# React 애플리케이션을 빌드하여 정적 파일(dist 폴더)을 생성합니다.
RUN npm run build


# ===================================================
# 2. 실행 스테이지 (Run Stage)
# ===================================================
# 기존에 사용하시던 경량 웹서버 이미지를 최종 실행 환경으로 사용
FROM webratio/nodejs-http-server:latest

# -- 빌드 스테이지(build)에서 생성된 dist 폴더 안의 모든 파일을 복사 --
# COPY [빌드 스테이지의 결과물 경로] [실행 환경의 웹서버 루트 경로]
COPY --from=build /app/dist /opt/www

# 프론트엔드 서비스가 사용할 포트를 명시합니다. (문서화 목적)
EXPOSE 3000

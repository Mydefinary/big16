# build 단계
#FROM node:18 AS build
#WORKDIR /app
#COPY package*.json ./
#RUN npm ci
#COPY . .
#RUN npm run build

# nginx 단계
#FROM nginx:alpine
#COPY --from=build /app/build /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]

# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# CRA가 /webtoon-hl 기준으로 에셋 내보내도록 package.json의 homepage 명시 필요
RUN npm run build

# ---------- runtime stage (nginx) ----------
FROM nginx:1.27-alpine
# Nginx 설정 교체: /webtoon-hl 정적 우선 -> SPA fallback -> API 프록시(X)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 빌드 산출물을 /usr/share/nginx/html/webtoon-hl 로 복사
COPY --from=build /app/build /usr/share/nginx/html/webtoon-hl

# 헬스체크(선택)
HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1



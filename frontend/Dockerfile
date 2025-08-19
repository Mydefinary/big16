# ---- Build stage ----
FROM node:20-bullseye AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 빌드된 정적 파일을 NGINX 서버에 배포
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# React Router를 사용할 경우를 대비한 NGINX 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

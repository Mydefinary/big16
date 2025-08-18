# 1단계: 소스코드 빌드
FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 빌드된 정적 파일을 NGINX 서버에 배포
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# React Router를 사용할 경우를 대비한 NGINX 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf
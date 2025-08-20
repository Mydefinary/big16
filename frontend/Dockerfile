# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 실제 Gateway 라우팅 패턴에 맞춤 (/api/* 패턴)
ARG REACT_APP_HL_API=/api
ENV REACT_APP_HL_API=$REACT_APP_HL_API

# 서브패스 배포(/webtoon-hl) — CRA면 PUBLIC_URL 사용
ARG PUBLIC_URL=/webtoon-hl
ENV PUBLIC_URL=$PUBLIC_URL

RUN npm run build

# runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
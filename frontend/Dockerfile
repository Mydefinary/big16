FROM nginx:alpine

# React 빌드 파일 복사
COPY dist /usr/share/nginx/html

# React 환경변수는 빌드 시에 적용되므로 런타임에는 의미 없음
# (필요하다면 빌드 전에 처리)

# 시간대 설정
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# SPA를 위한 nginx 설정
RUN echo 'server { \
    listen 9003; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    \
    # SPA 라우팅을 위한 fallback 설정 \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # 정적 파일 캐싱 \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # gzip 압축 \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
}' > /etc/nginx/conf.d/default.conf

# 기본 nginx.conf의 server 블록 제거 (포트 충돌 방지)
RUN sed -i '/server {/,/}/d' /etc/nginx/nginx.conf

EXPOSE 9003

CMD ["nginx", "-g", "daemon off;"]
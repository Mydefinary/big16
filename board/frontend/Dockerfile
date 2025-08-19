FROM nginx:alpine

# Vite 빌드 결과물 복사
COPY dist/ /usr/share/nginx/html/

# 우리가 만든 설정으로 기본 conf 교체
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

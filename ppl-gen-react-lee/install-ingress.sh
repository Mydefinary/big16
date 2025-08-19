#!/bin/bash

# 스크립트 실행 중 오류가 발생하면 즉시 중단합니다.
set -e

# 1. 헬름 저장소 추가 및 업데이트 (최신 정보 유지)
echo "Helm 저장소를 추가하고 업데이트합니다..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# 2. 헬름으로 NGINX Ingress 컨트롤러 설치 또는 업그레이드
# 'my-nginx'라는 이름으로 'ingress-nginx' 네임스페이스에 설치합니다.
# '-f' 옵션으로 우리가 만든 설정 파일을 사용하도록 지정합니다.
echo "NGINX Ingress 컨트롤러를 설치/업그레이드합니다..."
helm upgrade --install my-nginx ingress-nginx/ingress-nginx \
  --create-namespace \
  --namespace ingress-nginx \
  -f my-ingress-values.yaml

echo "🚀 NGINX Ingress 컨트롤러 배포가 완료되었습니다."
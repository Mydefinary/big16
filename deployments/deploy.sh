#!/bin/bash

# ===================================================
# Lee 프로젝트 배포 스크립트
# ===================================================

set -e  # 오류 발생시 스크립트 중단

echo "🚀 Lee 프로젝트 배포 시작..."

# 이미지 태그 설정 (기본값: latest)
IMAGE_TAG=${1:-latest}
echo "📦 사용할 이미지 태그: $IMAGE_TAG"

# 각 서비스 배포
echo "🔧 서비스들 배포 중..."

# Auth Backend 배포
echo "  - Auth Backend 배포..."
IMAGE_TAG=$IMAGE_TAG envsubst < auth-backend-deployment.yaml | kubectl apply -f -

# User Backend 배포
echo "  - User Backend 배포..."
IMAGE_TAG=$IMAGE_TAG envsubst < user-backend-deployment.yaml | kubectl apply -f -

# Frontend 배포
echo "  - Frontend 배포..."
IMAGE_TAG=$IMAGE_TAG envsubst < auth-frontend-deployment.yaml | kubectl apply -f -

# Gateway 배포
echo "  - Gateway 배포..."
IMAGE_TAG=$IMAGE_TAG envsubst < gateway-deployment.yaml | kubectl apply -f -

# Ingress 배포
echo "🌐 Ingress 배포 중..."
kubectl apply -f ingress-lee.yaml

echo ""
echo "✅ 배포 완료!"
echo ""
echo "📋 배포 상태 확인:"
echo "kubectl get pods -l app | grep lee"
echo "kubectl get svc | grep lee"
echo "kubectl get ingress | grep lee"
echo ""
echo "🌐 서비스 접근:"
echo "http://your-domain.com (또는 LoadBalancer IP)"
echo ""
echo "📊 모니터링:"
echo "kubectl logs -f deployment/gateway-lee-deployment"
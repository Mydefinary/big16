#!/bin/bash

# ===================================================
# Lee 프로젝트 완전 배포 스크립트
# Docker Build → Push → AKS Deploy
# ===================================================

set -e  # 오류 발생시 스크립트 중단

# 색깔 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_step() {
    echo -e "${BLUE}🔸 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 설정값
ACR_NAME="kt16big"
IMAGE_TAG=${1:-$(date +%Y%m%d-%H%M%S)}
SERVICES=("auth-backend-lee" "user-backend-lee" "frontend-lee" "gateway-lee")
SERVICE_DIRS=("auth-backend" "user-backend" "frontend" "gateway")

echo -e "${GREEN}🚀 Lee 프로젝트 완전 배포 시작${NC}"
echo "📦 이미지 태그: $IMAGE_TAG"
echo "🏗️  ACR: $ACR_NAME.azurecr.io"
echo ""

# ACR 로그인 확인
print_step "ACR 로그인 확인 중..."
if ! az acr login --name $ACR_NAME 2>/dev/null; then
    print_error "ACR 로그인 실패. Azure CLI가 설정되어 있는지 확인하세요."
    exit 1
fi
print_success "ACR 로그인 성공"

# 각 서비스별 빌드 및 푸시
for i in "${!SERVICES[@]}"; do
    service="${SERVICES[$i]}"
    service_dir="${SERVICE_DIRS[$i]}"
    
    print_step "$service 빌드 및 푸시 중..."
    
    if [ ! -d "$service_dir" ]; then
        print_warning "$service_dir 디렉토리가 존재하지 않습니다. 건너뜁니다."
        continue
    fi
    
    cd $service_dir
    
    # Gradle 빌드 (Java 프로젝트인 경우)
    if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
        print_step "  $service Gradle 빌드 중..."
        ./gradlew build
    fi
    
    # Docker 빌드 및 푸시
    print_step "  $service Docker 이미지 빌드 중..."
    docker build -t $ACR_NAME.azurecr.io/$service:$IMAGE_TAG .
    docker tag $ACR_NAME.azurecr.io/$service:$IMAGE_TAG $ACR_NAME.azurecr.io/$service:latest
    docker push $ACR_NAME.azurecr.io/$service:$IMAGE_TAG
    docker push $ACR_NAME.azurecr.io/$service:latest
    
    print_success "  $service 빌드 및 푸시 완료"
    cd ..
done

# Kubernetes 배포
print_step "Kubernetes 배포 시작..."

# 서비스들 배포
deployment_files=(
    "auth-backend-lee-deployment.yaml"
    "user-backend-lee-deployment.yaml" 
    "auth-frontend-lee-deployment.yaml"
    "gateway-lee-deployment.yaml"
)

for file in "${deployment_files[@]}"; do
    if [ -f "$file" ]; then
        service_name=$(basename $file .yaml)
        print_step "  $service_name 배포 중..."
        IMAGE_TAG=$IMAGE_TAG envsubst < $file | kubectl apply -f -
        print_success "  $service_name 배포 완료"
    else
        print_warning "  $file 파일이 존재하지 않습니다."
    fi
done

# Ingress 배포
print_step "Ingress 배포 중..."
kubectl apply -f ingress-lee.yaml

print_success "모든 배포 완료!"

echo ""
echo -e "${BLUE}📋 배포 상태 확인:${NC}"
echo "kubectl get pods -l app | grep lee"
echo "kubectl get svc | grep lee" 
echo "kubectl get ingress | grep lee"
echo ""

echo -e "${BLUE}🔍 실시간 상태 확인:${NC}"
echo "kubectl get pods -l app --watch | grep lee"
echo ""

echo -e "${BLUE}📊 로그 확인:${NC}"
echo "kubectl logs -f deployment/gateway-lee-deployment"
echo "kubectl logs -f deployment/auth-backend-lee-deployment"
echo ""

echo -e "${BLUE}🌐 서비스 접근:${NC}"
echo "Ingress를 통한 접근: http://your-domain.com"
echo "또는 LoadBalancer IP 확인: kubectl get ingress microservices-lee-ingress"
echo ""

# 배포 상태 실시간 확인
print_step "배포 상태 확인 중..."
kubectl get pods -l app | grep lee || echo "아직 Pod가 생성되지 않았습니다."
echo ""
print_success "배포 스크립트 실행 완료!"
echo -e "${YELLOW}💡 팁: Pod 상태가 Running이 될 때까지 잠시 기다려주세요.${NC}"
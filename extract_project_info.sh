#!/bin/bash

# 프로젝트 분석용 정보 추출 스크립트
# 사용법: ./extract_project_info.sh

OUTPUT_FILE="project_analysis_$(date +%Y%m%d_%H%M%S).txt"

echo "=== BIG16 프로젝트 분석 정보 추출 시작 ===" | tee "$OUTPUT_FILE"
echo "추출 시간: $(date)" | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# 1. Git 브랜치 정보 확인
echo "=== 1. Git 브랜치 정보 ===" | tee -a "$OUTPUT_FILE"
echo "현재 브랜치: $(git branch --show-current)" | tee -a "$OUTPUT_FILE"
echo "모든 브랜치:" | tee -a "$OUTPUT_FILE"
git branch -a | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# 2. 프로젝트 구조 확인
echo "=== 2. 프로젝트 구조 ===" | tee -a "$OUTPUT_FILE"
if command -v tree >/dev/null 2>&1; then
    tree -L 3 -I 'node_modules|target|build|dist|__pycache__|*.pyc|.git' | tee -a "$OUTPUT_FILE"
else
    find . -type d -name "node_modules" -prune -o -type d -name "target" -prune -o -type d -name "build" -prune -o -type d -name "dist" -prune -o -type d -name "__pycache__" -prune -o -type d -name ".git" -prune -o -type d -print | head -30 | tee -a "$OUTPUT_FILE"
fi
echo "" | tee -a "$OUTPUT_FILE"

# 3. Docker 관련 파일 확인
echo "=== 3. Docker 설정 파일들 ===" | tee -a "$OUTPUT_FILE"
echo "--- docker-compose.yml ---" | tee -a "$OUTPUT_FILE"
if [ -f "docker-compose.yml" ]; then
    cat docker-compose.yml | tee -a "$OUTPUT_FILE"
elif [ -f "docker-compose.yaml" ]; then
    cat docker-compose.yaml | tee -a "$OUTPUT_FILE"
else
    echo "docker-compose 파일을 찾을 수 없습니다." | tee -a "$OUTPUT_FILE"
fi
echo "" | tee -a "$OUTPUT_FILE"

# Dockerfile들 찾기
echo "--- Dockerfile 목록 ---" | tee -a "$OUTPUT_FILE"
find . -name "Dockerfile*" -type f | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

# 4. 패키지 관리 파일들 확인
echo "=== 4. 패키지/의존성 관리 파일들 ===" | tee -a "$OUTPUT_FILE"

# Spring Boot (Java)
echo "--- Java/Spring Boot 프로젝트 ---" | tee -a "$OUTPUT_FILE"
find . -name "pom.xml" -o -name "build.gradle" -o -name "build.gradle.kts" | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용:" | tee -a "$OUTPUT_FILE"
    cat "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# Python/FastAPI
echo "--- Python 프로젝트 ---" | tee -a "$OUTPUT_FILE"
find . -name "requirements.txt" -o -name "pyproject.toml" -o -name "Pipfile" | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용:" | tee -a "$OUTPUT_FILE"
    cat "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# Node.js/React
echo "--- Node.js/React 프로젝트 ---" | tee -a "$OUTPUT_FILE"
find . -name "package.json" | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용:" | tee -a "$OUTPUT_FILE"
    cat "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# 5. 설정 파일들 확인
echo "=== 5. 애플리케이션 설정 파일들 ===" | tee -a "$OUTPUT_FILE"

# Spring Boot 설정
find . -name "application.yml" -o -name "application.yaml" -o -name "application.properties" | while read file; do
    echo "--- $file ---" | tee -a "$OUTPUT_FILE"
    cat "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# FastAPI/Python 설정
find . -name "*.env" -o -name ".env.example" -o -name "config.py" -o -name "settings.py" | while read file; do
    echo "--- $file ---" | tee -a "$OUTPUT_FILE"
    # 보안상 민감한 정보는 마스킹
    sed 's/\(password\|secret\|key\|token\)=.*/\1=***MASKED***/gi' "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# 6. 주요 소스코드 파일 구조
echo "=== 6. 주요 소스코드 파일 구조 ===" | tee -a "$OUTPUT_FILE"

# Java 메인 클래스들
echo "--- Java 메인 클래스들 ---" | tee -a "$OUTPUT_FILE"
find . -name "*Application.java" -o -name "*Main.java" | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용:" | tee -a "$OUTPUT_FILE"
    cat "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# Python 메인 파일들
echo "--- Python 메인 파일들 ---" | tee -a "$OUTPUT_FILE"
find . -name "main.py" -o -name "app.py" -o -name "__init__.py" | head -10 | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용 (처음 50줄):" | tee -a "$OUTPUT_FILE"
    head -50 "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# React 메인 파일들
echo "--- React 메인 파일들 ---" | tee -a "$OUTPUT_FILE"
find . -name "App.js" -o -name "App.jsx" -o -name "index.js" | while read file; do
    echo "파일: $file" | tee -a "$OUTPUT_FILE"
    echo "내용 (처음 50줄):" | tee -a "$OUTPUT_FILE"
    head -50 "$file" | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
done

# 7. 서비스별 폴더 구조 확인
echo "=== 7. 서비스별 폴더 구조 ===" | tee -a "$OUTPUT_FILE"

SERVICES=("auth-backend-service-hoa" "user-backend-service-hoa" "board-backend-service" "gateway" "frontend")

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        echo "--- $service 서비스 구조 ---" | tee -a "$OUTPUT_FILE"
        ls -la "$service/" | tee -a "$OUTPUT_FILE"
        echo "" | tee -a "$OUTPUT_FILE"
        
        # 해당 서비스의 주요 파일들 찾기
        find "$service" -maxdepth 3 \( -name "*.java" -o -name "*.py" -o -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) -type f | head -10 | while read file; do
            echo "파일: $file" | tee -a "$OUTPUT_FILE"
        done
        echo "" | tee -a "$OUTPUT_FILE"
    fi
done

# 8. 현재 실행 중인 서비스 확인 (Docker)
echo "=== 8. Docker 컨테이너 상태 ===" | tee -a "$OUTPUT_FILE"
if command -v docker >/dev/null 2>&1; then
    echo "--- 실행 중인 컨테이너 ---" | tee -a "$OUTPUT_FILE"
    docker ps | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
    
    echo "--- 모든 컨테이너 (중지된 것 포함) ---" | tee -a "$OUTPUT_FILE"
    docker ps -a | tee -a "$OUTPUT_FILE"
    echo "" | tee -a "$OUTPUT_FILE"
else
    echo "Docker가 설치되어 있지 않거나 실행되지 않고 있습니다." | tee -a "$OUTPUT_FILE"
fi

# 9. 네트워크 포트 확인
echo "=== 9. 사용 중인 포트 확인 ===" | tee -a "$OUTPUT_FILE"
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep -E ':(80|300[0-9]|800[0-9]|900[0-9])' | tee -a "$OUTPUT_FILE"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep -E ':(80|300[0-9]|800[0-9]|900[0-9])' | tee -a "$OUTPUT_FILE"
else
    echo "netstat 또는 ss 명령어를 찾을 수 없습니다." | tee -a "$OUTPUT_FILE"
fi
echo "" | tee -a "$OUTPUT_FILE"

# 10. 최근 Git 커밋 로그
echo "=== 10. 최근 Git 커밋 로그 ===" | tee -a "$OUTPUT_FILE"
git log --oneline -10 | tee -a "$OUTPUT_FILE"
echo "" | tee -a "$OUTPUT_FILE"

echo "=== 정보 추출 완료 ===" | tee -a "$OUTPUT_FILE"
echo "결과 파일: $OUTPUT_FILE" | tee -a "$OUTPUT_FILE"
echo ""
echo "분석이 완료되었습니다. '$OUTPUT_FILE' 파일의 내용을 확인하세요."
echo "이 파일의 내용을 복사해서 Claude에게 공유하면 정확한 문제 진단과 해결책을 받을 수 있습니다."

# 파일 크기가 너무 클 경우 압축
FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
if [ "$FILE_SIZE" -gt 1048576 ]; then  # 1MB 이상일 경우
    echo "파일이 너무 큽니다. 압축 파일을 생성합니다..."
    gzip "$OUTPUT_FILE"
    echo "압축된 파일: ${OUTPUT_FILE}.gz"
fi
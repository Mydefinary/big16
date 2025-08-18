# ✅ Java 11과 Maven이 포함된 공식 이미지 사용
FROM maven:3.9.4-eclipse-temurin-11-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# ✅ 환경 확인
RUN echo "=== Build Environment ===" && \
    java -version && \
    mvn -version

# 의존성 캐싱을 위해 pom.xml 먼저 복사
COPY pom.xml .

# ✅ 의존성 미리 다운로드 (캐싱 최적화)
RUN mvn dependency:go-offline -B

# 소스 코드 복사
COPY src ./src

# ✅ 애플리케이션 빌드
RUN echo "=== Building Application ===" && \
    mvn clean package -DskipTests -B && \
    echo "=== Build Complete ==="

# ✅ 런타임 이미지 (경량화)
FROM eclipse-temurin:11-jre-alpine

# 필수 패키지 설치
RUN apk add --no-cache curl tzdata

# 시간대 설정 (한국)
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 애플리케이션 사용자 생성 (보안)
RUN addgroup -g 1001 appuser && \
    adduser -u 1001 -G appuser -s /bin/sh -D appuser

# 작업 디렉토리 설정
WORKDIR /app

# 빌드된 JAR 파일 복사
COPY --from=builder /app/target/*.jar app.jar

# 소유권 변경
RUN chown -R appuser:appuser /app

# 애플리케이션 사용자로 전환
USER appuser

# 포트 노출
EXPOSE 8080

# ✅ 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# ✅ JVM 최적화 옵션 추가
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Xms256m", \
    "-Xmx1024m", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
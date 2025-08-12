# ===================================================
# 1. 빌드 스테이지 (Build Stage) - Java 11 사용
# ===================================================
# Maven과 JDK 11이 포함된 이미지를 빌드 환경으로 사용
FROM maven:3.8.5-openjdk-11 AS build

# 작업 디렉토리 설정
WORKDIR /app

# 먼저 pom.xml을 복사하여 의존성을 다운로드합니다.
COPY pom.xml .
RUN mvn dependency:go-offline

# 전체 소스 코드를 복사합니다.
COPY src ./src

# Maven을 사용하여 애플리케이션을 빌드합니다.
RUN mvn package -DskipTests


# ===================================================
# 2. 실행 스테이지 (Run Stage)
# ===================================================
# 더 가벼운 OpenJDK 11 JRE 이미지를 최종 실행 환경으로 사용
FROM openjdk:11.0.12-jre-slim

# 작업 디렉토리 설정
WORKDIR /app

# -- 빌드 스테이지(build)에서 생성된 JAR 파일만 복사 --
COPY --from=build /app/target/*-SNAPSHOT.jar app.jar

# 타임존 설정
ENV TZ=Asia/Seoul

# 애플리케이션 실행 포트 노출 (각 서비스에 맞게 수정: 8080, 8081 등)
EXPOSE 8080

# 컨테이너 시작 시 JAR 파일 실행
ENTRYPOINT ["java", "-jar", "app.jar"]

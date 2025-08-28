# Build stage
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy Maven configuration
COPY pom.xml ./

# Download dependencies (for better caching)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src/ ./src/

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/boardapp-0.0.1-SNAPSHOT.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 8082

ENTRYPOINT ["java","-jar","/app/app.jar","--server.port=8082","--server.servlet.context-path=/board"]
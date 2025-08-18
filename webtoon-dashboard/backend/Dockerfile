FROM python:3.9-slim

WORKDIR /app

# 시스템 패키지 업데이트 및 Java 설치 (KoNLPy 의존성)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openjdk-11-jre-headless \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# JAVA_HOME 환경변수 설정
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "enhanced_main:app", "--host", "0.0.0.0", "--port", "8000"]
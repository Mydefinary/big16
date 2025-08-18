FROM python:3.9-slim

WORKDIR /app

# Java 설치 (KoNLPy 의존성)
RUN apt-get update && apt-get install -y \
    openjdk-11-jdk \
    && rm -rf /var/lib/apt/lists/*

# JAVA_HOME 환경변수 설정
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "enhanced_main:app", "--host", "0.0.0.0", "--port", "8000"]
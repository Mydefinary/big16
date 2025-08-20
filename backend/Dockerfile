# ---- Dependencies Stage ----
FROM python:3.11-slim as dependencies

WORKDIR /app

# 시스템 의존성 설치 (빌드에 필요한 패키지들)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Requirements 복사 및 의존성 설치
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# ---- Runtime Stage ----
FROM python:3.11-slim

WORKDIR /app

# 빌드 도구 없이 런타임 패키지만 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 의존성 스테이지에서 설치된 패키지들 복사
COPY --from=dependencies /root/.local /root/.local

# PATH에 사용자 설치 패키지 경로 추가
ENV PATH=/root/.local/bin:$PATH

# 앱 파일들 복사
COPY . .

# 런타임 환경변수 기본값
ENV WEBTOON_CSV_PATH=./webtoon_data.csv \
    CHROMA_DIR=./chroma_db5 \
    FAISS_DB_DIR=./db

# Uvicorn 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8083"]

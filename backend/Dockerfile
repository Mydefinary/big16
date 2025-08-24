# ---- Base ----
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# requirements 먼저 복사 → 캐시 활용
COPY requirements.txt .

# (선택) OpenAI/FAISS/Chroma 조합에 필요한 라이브러리 설치
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 앱 복사
COPY . .

# 런타임 환경변수 기본값 (필요시 compose에서 오버라이드)
ENV WEBTOON_CSV_PATH=./webtoon_data.csv \
    CHROMA_DIR=./chroma_db5 \
    FAISS_DB_DIR=./db

# Uvicorn 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8083"]

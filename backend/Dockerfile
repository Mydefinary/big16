FROM python:3.13-slim

# 시스템 기본 설정
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 의존성
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스
COPY ./src /app/src
ENV PYTHONPATH=/app/src

# 포트
EXPOSE 8000

# 실행 (src/app/main.py 안에 app = FastAPI() 가정)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

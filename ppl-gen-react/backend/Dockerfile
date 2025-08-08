# PPL 서비스 dockerfile, port 8000
# Python 3.10 버전을 기반으로 이미지 생성
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 복사 및 라이브러리 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 8000 포트로 FastAPI 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
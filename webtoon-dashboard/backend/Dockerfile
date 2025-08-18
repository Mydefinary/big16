FROM python:3.9-slim

WORKDIR /app

# 임시로 Java 설치 제거 (KoNLPy 비활성화)

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "enhanced_main:app", "--host", "0.0.0.0", "--port", "8000"]
백엔드 서버 실행 가이드 

## 1. 가상환경 설정 
루트 디렉토리에서 아래 명령어 실행
## 1-1. 가상환경 생성 
python -m venv venv
## 1-2. 가상환경 active 
.\venv\Scripts\Activate

pip install -r requirements.txt

## 서버 실행 
cd backend
$env:PYTHONPATH="src"
uvicorn app.main:app --reload


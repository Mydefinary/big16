# goods-gen의 main.py

import os
import base64
import time
import uuid
from pathlib import Path

# Request 객체와 Response 객체를 사용하기 위해 추가
from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse, Response # Response 추가
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import requests

# --- 환경 변수 및 기본 설정 ---
load_dotenv()
token_value = os.getenv("BFL_API_KEY")

if not token_value:
    raise RuntimeError("❌ .env 또는 Secret에 BFL_API_KEY가 설정되어 있지 않습니다.")

BFL_API_KEY = token_value.strip()
BFL_API_URL = 'https://api.bfl.ai/v1/flux-kontext-max'

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT 인증 설정
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    JWT 토큰을 검증하는 함수
    Gateway에서 X-User-Id 헤더를 전달받아 인증 확인
    """
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=401, detail="토큰이 필요합니다")
    return token

def get_user_id(request: Request):
    """
    Gateway에서 전달받은 X-User-Id 헤더 값을 반환
    """
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="사용자 인증이 필요합니다")
    return user_id


def encode_image_file(file: UploadFile) -> str:
    """FastAPI의 UploadFile 객체를 Base64 문자열로 인코딩합니다."""
    content = file.file.read()
    if not content:
        raise ValueError("업로드된 파일이 비어 있습니다.")
    return base64.b64encode(content).decode("utf-8")

@app.post("/generate")
async def generate_goods(
    request: Request,
    prompt: str = Form(...),
    input_image: UploadFile = File(...),
    aspect_ratio: str = Form(...),
    seed: int = Form(...),
    safety_tolerance: int = Form(...),
    token: str = Depends(verify_token)
):
    try:
        # 사용자 인증 확인
        user_id = get_user_id(request)
        print(f"✅ 인증된 사용자 ID: {user_id}")
        
        print("✅ 굿즈 생성 요청 받음. BFL.ai API 호출 시작...")
        
        encoded_img = encode_image_file(input_image)

        headers = {
            'accept': 'application/json',
            'x-key': BFL_API_KEY,
            'Content-Type': 'application/json',
        }
        payload = {
            'prompt': prompt,
            'input_image': encoded_img,
            'seed': seed,
            'aspect_ratio': aspect_ratio,
            'safety_tolerance': safety_tolerance
        }

        initial_response = requests.post(BFL_API_URL, headers=headers, json=payload)
        initial_response.raise_for_status()
        response_data = initial_response.json()
        
        request_id = response_data.get("id")
        polling_url = response_data.get("polling_url")

        if not request_id or not polling_url:
            raise ValueError("API에서 유효한 요청 ID를 받지 못했습니다.")
        
        print(f"✅ 작업 시작됨. Request ID: {request_id}. Polling 시작...")

        external_image_url = None
        while True:
            time.sleep(1)
            poll_response = requests.get(
                polling_url,
                headers={'accept': 'application/json', 'x-key': BFL_API_KEY},
                params={'id': request_id}
            )
            poll_response.raise_for_status()
            poll_data = poll_response.json()

            status = poll_data.get('status')
            if status == 'Ready':
                external_image_url = poll_data['result']['sample']
                print("✅ 작업 완료. BFL.ai로부터 이미지 URL 받음.")
                break
            elif status in ['Error', 'Failed']:
                raise RuntimeError(f"BFL.ai 모델 생성 실패. 상태: {status}")
            
            print(f" - Polling 중... (상태: {status})")
            
        if not external_image_url:
            raise ValueError("최종 이미지 URL을 얻는 데 실패했습니다.")

        # --- ✨✨✨ 핵심 수정 로직 ✨✨✨ ---
        # 1. 외부 URL에서 이미지 데이터 다운로드
        print(f"✅ 외부 URL에서 이미지 다운로드 시작: {external_image_url}")
        image_response = requests.get(external_image_url)
        image_response.raise_for_status()
        image_bytes = image_response.content

        # 2. [핵심] JSON 대신 이미지 데이터를 직접 반환합니다.
        # 브라우저가 이 응답을 이미지 파일로 인식하도록 media_type을 'image/png'로 설정합니다.
        print("✅ 이미지 데이터 직접 반환 (타입: image/png)")
        return Response(content=image_bytes, media_type="image/png")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# ppl-gen의 main.py

import os
import base64
import mimetypes
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import replicate
import requests

# --- 기본 설정 (수정 없음) ---
load_dotenv()
token_value = os.getenv("REPLICATE_API_TOKEN")

if not token_value:
    raise RuntimeError("❌ .env 또는 Secret에 REPLICATE_API_TOKEN이 설정되어 있지 않습니다.")
# [핵심 수정] .strip()을 추가하여 토큰 값의 앞뒤 공백/줄바꿈을 제거합니다.
REPLICATE_API_TOKEN = token_value.strip()
# replicate 라이브러리가 환경 변수를 직접 참조하므로 다시 설정해 줍니다.
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://20.249.154.2", "http://20.249.113.18:9000", "http://20.249.113.18"],
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

# --- ✨✨✨ 새로운 코드 추가 ✨✨✨ ---
# 'static' 폴더를 정적 파일 경로로 지정합니다.
# 이제 "http://127.0.0.1:8000/static/이미지파일.png" 와 같은 주소로 파일에 접근할 수 있습니다.
STATIC_DIR = Path("static")
STATIC_DIR.mkdir(parents=True, exist_ok=True)  # static 폴더가 없으면 생성
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def encode_file(file: UploadFile) -> str:
    content = file.file.read()
    if not content:
        raise ValueError("파일이 비어 있습니다.")
    mime_type = mimetypes.guess_type(file.filename)[0] or "image/png"
    return f"data:{mime_type};base64," + base64.b64encode(content).decode("utf-8")


# --- ✨✨✨ generate_image 함수 전체 수정 ✨✨✨ ---
@app.post("/generate")
async def generate_image(
    request: Request,
    prompt: str = Form(...),
    aspect_ratio: str = Form(...),
    seed: Optional[str] = Form(None),
    output_format: str = Form(...),
    safety_tolerance: int = Form(...),
    input_image_1: UploadFile = File(...),
    input_image_2: UploadFile = File(...),
    # token: str = Depends(verify_token)  # 임시로 인증 비활성화
):
    try:
        # 사용자 인증 확인 (임시로 비활성화)
        # user_id = get_user_id(request)
        # print(f"✅ 인증된 사용자 ID: {user_id}")
        print("✅ 인증 우회 - 테스트 모드")
        
        encoded_img1 = encode_file(input_image_1)
        encoded_img2 = encode_file(input_image_2)

        inputs = {
            "prompt": prompt,
            "input_image_1": encoded_img1,
            "input_image_2": encoded_img2,
            "aspect_ratio": aspect_ratio,
            "output_format": output_format,
            "safety_tolerance": safety_tolerance
        }
        if seed:
            inputs["seed"] = int(seed)

        print("✅ Replicate에 전송할 payload:", inputs.keys())

        output = await run_in_threadpool(
            replicate.run,
            "flux-kontext-apps/multi-image-kontext-max",
            input=inputs
        )

        print(f"✅ Replicate 응답 받음 (타입: {type(output)})")

        image_bytes = None
        # iterator나 list일 경우를 대비해 첫 번째 항목을 가져옵니다.
        result = output[0] if isinstance(output, list) and output else output

        # ✨✨✨ 핵심 수정 로직 ✨✨✨
        # 1. 결과가 FileOutput 객체(또는 파일 유사 객체)인 경우
        if hasattr(result, 'read') and callable(getattr(result, 'read')):
            print("✅ 결과 처리: FileOutput 객체에서 .read()로 데이터 추출")
            image_bytes = result.read()
        # 2. 결과가 URL 문자열인 경우 (만약을 위한 대비책)
        elif isinstance(result, str) and result.startswith('http'):
            print("✅ 결과 처리: URL 문자열이므로 requests로 다운로드")
            response = requests.get(result)
            response.raise_for_status()  # 200 OK가 아니면 에러 발생
            image_bytes = response.content
        else:
            raise TypeError(f"처리할 수 없는 결과 타입입니다: {type(result)}")

        if not image_bytes:
            raise ValueError("이미지 데이터를 얻는 데 실패했습니다.")

        # [핵심 수정] JSON 대신 이미지 데이터를 직접 반환합니다.(파일저장, URL 반환 로직 폐기)
        # 브라우저가 이 응답을 이미지 파일로 인식하도록 media_type을 설정합니다.
        file_extension = output_format if output_format in ['png', 'jpeg', 'webp'] else 'png'
        print(f"✅ 이미지 데이터 직접 반환 (타입: image/{file_extension})")
        return Response(content=image_bytes, media_type=f"image/{file_extension}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})
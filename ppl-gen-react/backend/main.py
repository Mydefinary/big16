import os
import base64
import mimetypes
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
import replicate
import requests
from googletrans import Translator # ✅ 번역 라이브러리 import

# --- 기본 설정 (수정 없음) ---
load_dotenv()
token_value = os.getenv("REPLICATE_API_TOKEN")

if not token_value:
    raise RuntimeError("❌ .env 또는 Secret에 REPLICATE_API_TOKEN이 설정되어 있지 않습니다.")
REPLICATE_API_TOKEN = token_value.strip()
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # ✅ 모든 오리진을 허용하도록 변경
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ [신규] 번역을 위한 Translator 객체 생성
translator = Translator()

# ✅ [신규] 한글 프롬프트를 영어로 번역하는 API 엔드포인트
@app.post("/translate")
async def translate_prompt(request: Request):
    data = await request.json()
    korean_text = data.get("prompt")
    if not korean_text:
        return JSONResponse(status_code=400, content={"error": "번역할 프롬프트가 없습니다."})
    
    try:
        # 백그라운드 스레드에서 번역 실행
        translated = await run_in_threadpool(translator.translate, korean_text, dest='en')
        return JSONResponse(content={"translated_text": translated.text})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# --- 기존 코드 (수정 없음) ---
def encode_file(file: UploadFile) -> str:
    content = file.file.read()
    if not content:
        raise ValueError("파일이 비어 있습니다.")
    mime_type = mimetypes.guess_type(file.filename)[0] or "image/png"
    return f"data:{mime_type};base64," + base64.b64encode(content).decode("utf-8")

@app.post("/generate")
async def generate_image(
    request: Request,
    prompt: str = Form(...),
    aspect_ratio: str = Form(...),
    seed: Optional[str] = Form(None),
    output_format: str = Form(...),
    safety_tolerance: int = Form(...),
    input_image_1: UploadFile = File(...),
    input_image_2: UploadFile = File(...)
):
    try:
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
        
        result = output[0] if isinstance(output, list) and output else output
        image_bytes = None

        if hasattr(result, 'read') and callable(getattr(result, 'read')):
            print("✅ 결과 처리: FileOutput 객체에서 .read()로 데이터 추출")
            image_bytes = result.read()
        elif isinstance(result, str) and result.startswith('http'):
            print("✅ 결과 처리: URL 문자열이므로 requests로 다운로드")
            response = requests.get(result)
            response.raise_for_status()
            image_bytes = response.content
        else:
            raise TypeError(f"처리할 수 없는 결과 타입입니다: {type(result)}")

        if not image_bytes:
            raise ValueError("이미지 데이터를 얻는 데 실패했습니다.")

        file_extension = output_format if output_format in ['png', 'jpeg', 'webp'] else 'png'
        print(f"✅ 이미지 데이터 직접 반환 (타입: image/{file_extension})")
        return Response(content=image_bytes, media_type=f"image/{file_extension}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

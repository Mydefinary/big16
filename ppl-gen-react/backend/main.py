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
import openai # ✅ openai 라이브러리 import

# --- 기본 설정 (수정) ---
load_dotenv()

# Replicate API 토큰 설정
token_value = os.getenv("REPLICATE_API_TOKEN")
if not token_value:
    raise RuntimeError("❌ REPLICATE_API_TOKEN이 설정되어 있지 않습니다.")
REPLICATE_API_TOKEN = token_value.strip()
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# ✅ [신규] OpenAI API 키 설정
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise RuntimeError("❌ OPENAI_API_KEY가 설정되어 있지 않습니다.")
# OpenAI 클라이언트 초기화
client = openai.AsyncOpenAI(api_key=openai_api_key.strip())


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ [수정] OpenAI API를 호출하는 번역 엔드포인트
@app.post("/translate")
async def translate_prompt(request: Request):
    data = await request.json()
    korean_text = data.get("prompt")
    if not korean_text:
        return JSONResponse(status_code=400, content={"error": "번역할 프롬프트가 없습니다."})
    
    try:
        # ChatGPT API 호출
        chat_completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a translator who translates Korean into natural, concise English for an image generation AI model.",
                },
                {
                    "role": "user",
                    "content": korean_text,
                }
            ],
            model="gpt-4o", # 또는 "gpt-3.5-turbo"
        )
        translated_text = chat_completion.choices[0].message.content
        return JSONResponse(content={"translated_text": translated_text})
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return JSONResponse(status_code=500, content={"error": "번역 중 오류가 발생했습니다."})


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
            image_bytes = result.read()
        elif isinstance(result, str) and result.startswith('http'):
            response = requests.get(result)
            response.raise_for_status()
            image_bytes = response.content
        else:
            raise TypeError(f"처리할 수 없는 결과 타입입니다: {type(result)}")

        if not image_bytes:
            raise ValueError("이미지 데이터를 얻는 데 실패했습니다.")

        file_extension = output_format if output_format in ['png', 'jpeg', 'webp'] else 'png'
        return Response(content=image_bytes, media_type=f"image/{file_extension}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

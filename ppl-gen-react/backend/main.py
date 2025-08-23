# ppl-gen의 main.py

import os
import base64
import mimetypes
import uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.concurrency import run_in_threadpool
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
    allow_origins=["http://20.249.113.18:9000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
@app.post("/api/ppl-gen/generate")
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
    

# # enterprise에서 사용할 수 있는 코드를 제공해 줘
# # 코드를 제외한 대화는 한국어로 해 줘.

# import os
# import base64
# import mimetypes
# import uuid
# from pathlib import Path
# from typing import Optional

# # FastAPI는 파이썬으로 API 서버를 쉽게 만들 수 있게 해주는 웹 프레임워크입니다.
# from fastapi import FastAPI, File, UploadFile, Form, Request
# # JSONResponse는 JSON 형태의 응답을, Response는 이미지 등 직접적인 응답을 보낼 때 사용합니다.
# from fastapi.responses import JSONResponse, Response
# # CORSMiddleware는 다른 주소(도메인)의 프론트엔드에서 오는 요청을 허용하기 위해 필요합니다.
# from fastapi.middleware.cors import CORSMiddleware
# # StaticFiles는 서버의 특정 폴더에 있는 파일에 직접 접근할 수 있게 해줍니다.
# from fastapi.staticfiles import StaticFiles
# # FastAPI의 비동기 환경에서 동기적인(순서대로 실행되는) 코드를 안전하게 실행시켜 줍니다.
# from fastapi.concurrency import run_in_threadpool
# # .env 파일에서 환경 변수를 불러옵니다.
# from dotenv import load_dotenv
# # Replicate API와 통신하기 위한 라이브러리입니다.
# import replicate
# # Replicate API가 이미지 URL을 반환했을 때, 그 URL에서 데이터를 다운로드하기 위해 사용합니다.
# import requests

# # --- 1. 기본 설정 ---

# # .env 파일에 저장된 환경 변수를 로드합니다. (예: REPLICATE_API_TOKEN=...)
# load_dotenv()
# # os.getenv를 사용해 REPLICATE_API_TOKEN 값을 가져옵니다.
# token_value = os.getenv("REPLICATE_API_TOKEN")

# # API 토큰이 없으면 서버 실행을 중단시키고 에러 메시지를 표시합니다.
# if not token_value:
#     raise RuntimeError("❌ .env 또는 Secret에 REPLICATE_API_TOKEN이 설정되어 있지 않습니다.")

# # 토큰 값 앞뒤에 있을 수 있는 공백이나 줄바꿈 문자를 제거하여 순수한 토큰 값만 남깁니다.
# REPLICATE_API_TOKEN = token_value.strip()
# # replicate 라이브러리가 이 환경 변수를 직접 사용하므로, 깨끗하게 정리된 토큰으로 다시 설정해 줍니다.
# os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# # FastAPI 애플리케이션 인스턴스를 생성합니다.
# app = FastAPI()

# # CORS(Cross-Origin Resource Sharing) 설정을 추가합니다.
# # 프론트엔드 주소인 'http://20.249.113.18:9000'에서의 요청을 허용합니다.
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://20.249.113.18:9000"],
#     allow_credentials=True,
#     allow_methods=["*"],  # 모든 HTTP 메소드(GET, POST 등) 허용
#     allow_headers=["*"], # 모든 HTTP 헤더 허용
# )

# # 현재는 사용되지 않지만, 나중에 서버에 저장된 정적 파일을 웹에서 접근할 때 필요한 설정입니다.
# STATIC_DIR = Path("static")
# STATIC_DIR.mkdir(parents=True, exist_ok=True)
# app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# # --- 2. 이미지 인코딩 헬퍼 함수 ---

# # 프론트엔드에서 받은 이미지 파일(UploadFile)을 Replicate API가 요구하는
# # Base64 데이터 URI 형식으로 변환하는 함수입니다.
# def encode_file(file: UploadFile) -> str:
#     # 파일을 열어 바이너리(byte) 형태로 내용을 모두 읽습니다.
#     content = file.file.read()
#     # 파일 내용이 비어있으면 에러를 발생시킵니다.
#     if not content:
#         raise ValueError("파일이 비어 있습니다.")
    
#     # 파일 이름(예: 'image.png')을 보고 MIME 타입을 추측합니다. (결과: 'image/png')
#     # 만약 추측이 안되면 기본값으로 'image/png'를 사용합니다.
#     mime_type = mimetypes.guess_type(file.filename)[0] or "image/png"
    
#     # Base64로 인코딩된 데이터와 MIME 타입을 조합하여 데이터 URI 문자열을 만듭니다.
#     # 최종 형태: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
#     return f"data:{mime_type};base64," + base64.b64encode(content).decode("utf-8")


# # --- 3. API 엔드포인트: 이미지 생성 ---

# # POST 요청을 받을 경로를 지정합니다. 두 경로 모두 동일한 함수를 실행합니다.
# @app.post("/generate")
# @app.post("/api/ppl-gen/generate")
# # 'async'는 이 함수가 비동기적으로 동작함을 의미합니다. (요청 처리 중 다른 요청도 받을 수 있음)
# async def generate_image(
#     request: Request, # 현재 요청에 대한 정보 객체
#     # Form(...)은 프론트엔드에서 보낸 form-data에서 각 필드의 값을 추출합니다.
#     prompt: str = Form(...),
#     aspect_ratio: str = Form(...),
#     seed: Optional[str] = Form(None), # seed는 선택 사항이므로 None이 될 수 있음
#     output_format: str = Form(...),
#     safety_tolerance: int = Form(...),
#     # File(...)은 form-data에서 파일 데이터를 추출합니다.
#     input_image_1: UploadFile = File(...),
#     input_image_2: UploadFile = File(...)
# ):
#     try:
#         # --- 3-1. 입력 데이터 처리 ---
#         # 업로드된 두 이미지를 각각 Base64 데이터 URI로 인코딩합니다.
#         encoded_img1 = encode_file(input_image_1)
#         encoded_img2 = encode_file(input_image_2)

#         # Replicate API에 보낼 'input' 페이로드(payload)를 딕셔너리 형태로 구성합니다.
#         inputs = {
#             "prompt": prompt,
#             "input_image_1": encoded_img1,
#             "input_image_2": encoded_img2,
#             "aspect_ratio": aspect_ratio,
#             "output_format": output_format,
#             "safety_tolerance": safety_tolerance
#         }
#         # 만약 seed 값이 있다면, 정수형으로 변환하여 inputs 딕셔너리에 추가합니다.
#         if seed:
#             inputs["seed"] = int(seed)

#         print("✅ Replicate에 전송할 payload:", inputs.keys())

#         # --- 3-2. Replicate API 호출 ---
#         # replicate.run은 동기 함수이므로, run_in_threadpool을 사용해
#         # FastAPI의 이벤트 루프를 막지 않고 별도의 스레드에서 실행합니다.
#         output = await run_in_threadpool(
#             replicate.run,
#             "flux-kontext-apps/multi-image-kontext-max", # 사용할 AI 모델 이름
#             input=inputs  # 위에서 구성한 입력 데이터 전달
#         )

#         print(f"✅ Replicate 응답 받음 (타입: {type(output)})")

#         # --- 3-3. 결과 처리 ---
#         image_bytes = None # 최종 이미지 바이너리 데이터를 담을 변수
        
#         # API 응답이 리스트 형태일 수 있으므로, 리스트이면 첫 번째 항목을 결과로 사용합니다.
#         result = output[0] if isinstance(output, list) and output else output

#         # ✨✨✨ 핵심 로직: API 응답 형태에 따라 다르게 처리 ✨✨✨
        
#         # 1. 결과가 파일 객체(FileOutput)일 경우 (가장 일반적인 경우)
#         #    .read() 메소드가 있는지 확인하여 파일 객체인지 판별합니다.
#         if hasattr(result, 'read') and callable(getattr(result, 'read')):
#             print("✅ 결과 처리: FileOutput 객체에서 .read()로 데이터 추출")
#             # .read()를 호출하여 이미지의 원본 바이너리(bytes) 데이터를 직접 읽어옵니다.
#             image_bytes = result.read()
        
#         # 2. 결과가 URL 문자열일 경우 (예비 처리)
#         elif isinstance(result, str) and result.startswith('http'):
#             print("✅ 결과 처리: URL 문자열이므로 requests로 다운로드")
#             # requests.get으로 해당 URL의 이미지를 서버에서 직접 다운로드합니다.
#             response = requests.get(result)
#             response.raise_for_status()  # HTTP 상태 코드가 200이 아니면 에러 발생
#             # 다운로드한 응답의 본문(content)이 바로 이미지의 바이너리 데이터입니다.
#             image_bytes = response.content
#         else:
#             # 위 두 경우가 아니면 처리할 수 없는 타입이므로 에러를 발생시킵니다.
#             raise TypeError(f"처리할 수 없는 결과 타입입니다: {type(result)}")

#         if not image_bytes:
#             raise ValueError("이미지 데이터를 얻는 데 실패했습니다.")

#         # --- 3-4. 최종 응답 반환 ---
        
#         # 프론트엔드에 JSON(URL 정보) 대신 이미지 원본 데이터를 직접 반환합니다.
#         # 브라우저가 이 데이터를 이미지 파일로 인식하도록 media_type을 설정하는 것이 핵심입니다.
#         file_extension = output_format if output_format in ['png', 'jpeg', 'webp'] else 'png'
#         print(f"✅ 이미지 데이터 직접 반환 (타입: image/{file_extension})")
#         # FastAPI의 Response 객체를 사용하여 바이너리 데이터와 MIME 타입을 응답으로 보냅니다.
#         # 이것이 바로 프론트엔드가 받는 'Blob 데이터'가 됩니다.
#         return Response(content=image_bytes, media_type=f"image/{file_extension}")

#     # 모든 과정에서 에러가 발생하면, 어떤 에러인지 JSON 형태로 응답합니다.
#     except Exception as e:
#         import traceback
#         traceback.print_exc() # 서버 콘솔에 자세한 에러 로그를 출력합니다.
#         return JSONResponse(status_code=500, content={"error": str(e)})
# goods-gen의 main.py

import os
import base64
import time
import uuid
from pathlib import Path

# Request 객체와 Response 객체를 사용하기 위해 추가
from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.responses import JSONResponse, FileResponse, Response # Response 추가
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["http://20.249.113.18:9000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def encode_image_file(file: UploadFile) -> str:
    """FastAPI의 UploadFile 객체를 Base64 문자열로 인코딩합니다."""
    content = file.file.read()
    if not content:
        raise ValueError("업로드된 파일이 비어 있습니다.")
    return base64.b64encode(content).decode("utf-8")

@app.post("/generate")
@app.post("/api/goods-gen/generate")
async def generate_goods(
    prompt: str = Form(...),
    input_image: UploadFile = File(...),
    aspect_ratio: str = Form(...),
    seed: int = Form(...),
    safety_tolerance: int = Form(...)
):
    try:
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


# # enterprise에서 사용할 수 있는 코드를 제공해 줘
# # 코드를 제외한 대화는 한국어로 해 줘.

# import os
# import base64
# import time # 폴링 시, 주기적인 요청 사이에 지연을 주기 위해 사용
# import uuid
# from pathlib import Path

# # FastAPI 관련 라이브러리 임포트
# from fastapi import FastAPI, File, UploadFile, Form, Request
# from fastapi.responses import JSONResponse, Response
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# import requests # 외부 API와 HTTP 통신을 하기 위해 사용

# # --- 1. 환경 변수 및 기본 설정 ---
# load_dotenv() # .env 파일 로드
# token_value = os.getenv("BFL_API_KEY") # BFL.ai API 키 가져오기

# if not token_value:
#     raise RuntimeError("❌ .env 또는 Secret에 BFL_API_KEY가 설정되어 있지 않습니다.")

# BFL_API_KEY = token_value.strip() # API 키의 앞뒤 공백 제거
# BFL_API_URL = 'https://api.bfl.ai/v1/flux-kontext-max' # 사용할 BFL.ai API 엔드포인트 주소

# app = FastAPI() # FastAPI 앱 생성

# # CORS 미들웨어 설정 (ppl-gen과 동일)
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://20.249.113.18:9000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- 2. 이미지 인코딩 헬퍼 함수 ---
# def encode_image_file(file: UploadFile) -> str:
#     """
#     FastAPI의 UploadFile 객체를 BFL.ai API가 요구하는
#     순수 Base64 문자열로 인코딩합니다. (data URI 형식 아님)
#     """
#     content = file.file.read() # 파일 내용을 바이트로 읽기
#     if not content:
#         raise ValueError("업로드된 파일이 비어 있습니다.")
#     # 바이트 데이터를 Base64로 인코딩하고, 다시 utf-8 문자열로 변환하여 반환
#     return base64.b64encode(content).decode("utf-8")

# # --- 3. API 엔드포인트: 이미지 생성 ---
# @app.post("/generate")
# @app.post("/api/goods-gen/generate")
# async def generate_goods(
#     # 프론트엔드로부터 form-data 형식으로 데이터 수신
#     prompt: str = Form(...),
#     input_image: UploadFile = File(...),
#     aspect_ratio: str = Form(...),
#     seed: int = Form(...),
#     safety_tolerance: int = Form(...)
# ):
#     try:
#         print("✅ 굿즈 생성 요청 받음. BFL.ai API 호출 시작...")
        
#         # --- 3-1. 이미지 인코딩 및 요청 데이터 준비 ---
#         encoded_img = encode_image_file(input_image)

#         # BFL.ai API에 보낼 HTTP 요청 헤더 설정
#         headers = {
#             'accept': 'application/json',
#             'x-key': BFL_API_KEY, # 인증을 위한 API 키
#             'Content-Type': 'application/json',
#         }
#         # BFL.ai API에 보낼 요청 본문(payload) 설정
#         payload = {
#             'prompt': prompt,
#             'input_image': encoded_img, # Base64로 인코딩된 이미지 문자열
#             'seed': seed,
#             'aspect_ratio': aspect_ratio,
#             'safety_tolerance': safety_tolerance
#         }

#         # --- 3-2. BFL.ai API에 작업 생성 요청 (첫 번째 요청) ---
#         # requests.post를 사용해 이미지 생성을 '요청'하고 작업을 시작시킴
#         initial_response = requests.post(BFL_API_URL, headers=headers, json=payload)
#         initial_response.raise_for_status() # HTTP 에러 발생 시 예외 처리
#         response_data = initial_response.json() # 응답을 JSON으로 파싱
        
#         # 첫 응답에서 작업 ID와 상태를 확인할 수 있는 polling_url을 추출
#         request_id = response_data.get("id")
#         polling_url = response_data.get("polling_url")

#         if not request_id or not polling_url:
#             raise ValueError("API에서 유효한 요청 ID를 받지 못했습니다.")
        
#         print(f"✅ 작업 시작됨. Request ID: {request_id}. Polling 시작...")

#         # --- 3-3. 폴링(Polling) 시작: 작업 완료 여부 주기적 확인 ---
#         external_image_url = None # 최종 이미지 URL을 저장할 변수
#         while True: # 작업이 완료될 때까지 무한 반복
#             # 1초 대기 후 다음 상태 확인 요청을 보냄 (API 서버 부하 감소)
#             time.sleep(1)
            
#             # polling_url로 GET 요청을 보내 작업의 현재 상태를 확인
#             poll_response = requests.get(
#                 polling_url,
#                 headers={'accept': 'application/json', 'x-key': BFL_API_KEY},
#                 params={'id': request_id} # 쿼리 파라미터로 작업 ID 전달
#             )
#             poll_response.raise_for_status()
#             poll_data = poll_response.json()

#             status = poll_data.get('status')
#             # 상태가 'Ready'(준비됨/완료)이면, 결과에서 이미지 URL을 추출하고 반복 종료
#             if status == 'Ready':
#                 external_image_url = poll_data['result']['sample']
#                 print("✅ 작업 완료. BFL.ai로부터 이미지 URL 받음.")
#                 break # while 루프 탈출
#             # 상태가 'Error' 또는 'Failed'이면, 에러를 발생시키고 작업 중단
#             elif status in ['Error', 'Failed']:
#                 raise RuntimeError(f"BFL.ai 모델 생성 실패. 상태: {status}")
            
#             # 아직 처리 중이면 현재 상태를 출력하고 다시 루프의 처음으로 돌아감
#             print(f" - Polling 중... (상태: {status})")
            
#         if not external_image_url:
#             raise ValueError("최종 이미지 URL을 얻는 데 실패했습니다.")

#         # --- 3-4. 최종 이미지 다운로드 및 반환 ---
#         # 1. 폴링으로 얻은 최종 이미지 URL에서 실제 이미지 데이터를 다운로드
#         print(f"✅ 외부 URL에서 이미지 다운로드 시작: {external_image_url}")
#         image_response = requests.get(external_image_url)
#         image_response.raise_for_status()
#         # .content 속성으로 이미지의 원본 바이너리(bytes) 데이터를 가져옴
#         image_bytes = image_response.content

#         # 2. 프론트엔드에 이미지 바이너리 데이터를 직접 반환 (Blob 데이터)
#         print("✅ 이미지 데이터 직접 반환 (타입: image/png)")
#         # Response 객체를 사용해 바이너리 데이터와 MIME 타입을 응답으로 보냄
#         return Response(content=image_bytes, media_type="image/png")

#     # 모든 과정에서 에러 발생 시 500 에러 코드와 에러 메시지를 JSON으로 반환
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return JSONResponse(status_code=500, content={"error": str(e)})
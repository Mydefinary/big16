import base64
import io
import math
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

FONT_SIZE = 24
TITLE_FONT_SIZE = 50

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def analyze_image_gpt(image_bytes: bytes) -> str:
    base64_image = encode_image(image_bytes)
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "이 웹툰 장면이 하이라이트 컷인지 판단해줘. 아래 세 질문에 각각 명확히 답해줘:\n"
                                "1. 해당 컷의 대사를 분석하거나 묘사를 해줘.\n"
                                "2. 해당 장면이 하이라이트 컷에 적합해?\n"
                                "3. 이 장면에 어울리는 대사를 만들어줘."
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"GPT 분석 실패: {e}"


async def filter_highlight_images(uploaded_images: list) -> list:
    selected = []

    for image in uploaded_images:
        image_bytes = await image.read()
        result = analyze_image_gpt(image_bytes)

        #디버깅 로그
        print(f"[DEBUG] {image.filename} GPT 응답:\n{result}")

        highlight_keywords = ["하이라이트", "적합", "중요", "전환점", "감정", "성장", "변화", "클라이맥스"]
        if any(keyword in result for keyword in highlight_keywords):
            summary = "하이라이트"
            for line in result.splitlines():
                if "어울리는 대사" in line or "대사" in line:
                    parts = line.split(":")
                    if len(parts) > 1:
                        summary = parts[-1].strip().replace("**", "")
                        break

            selected.append((image_bytes, summary))

    return selected


def create_poster(images_with_titles: list) -> bytes:
    n = min(len(images_with_titles), 4)
    cols = 2
    rows = math.ceil(n / cols)
    thumb_w, thumb_h = 400, 600
    spacing = 20
    width = cols * (thumb_w + spacing) + spacing
    height = rows * (thumb_h + spacing) + spacing

    poster = Image.new("RGB", (width, height), (20, 10, 10))
    draw = ImageDraw.Draw(poster)

    try:
        font = ImageFont.truetype(settings.FONT_PATH, FONT_SIZE)
    except:
        font = ImageFont.load_default()

    for i, (img_bytes, title) in enumerate(images_with_titles[:n]):
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((thumb_w, thumb_h))
        x = spacing + (i % cols) * (thumb_w + spacing)
        y = spacing + (i // cols) * (thumb_h + spacing)
        poster.paste(img, (x, y))

    output = io.BytesIO()
    poster.save(output, format="PNG")
    output.seek(0)
    return output.read()

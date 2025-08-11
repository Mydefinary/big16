from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import base64

from app.services.highlight_service import filter_highlight_images, create_poster

router = APIRouter()

@router.post("/highlight")
async def highlight_webtoon(files: List[UploadFile] = File(...)):
    images_with_titles = await filter_highlight_images(files)
    
    if not images_with_titles:
        return JSONResponse(content={"result_image": None})

    poster_bytes = create_poster(images_with_titles)

    base64_image = base64.b64encode(poster_bytes).decode("utf-8")
    
    return JSONResponse(content={"result_image": base64_image})

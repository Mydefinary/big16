from fastapi import FastAPI
from app.api import highlight
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Webtoon Highlight API is running!"}

# 게이트웨이 경로에 맞춰서 prefix를 "/api/webtoon-hl" 로 변경
app.include_router(highlight.router, prefix="/api/webtoon-hl")
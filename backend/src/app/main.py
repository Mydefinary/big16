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

# 실제 Gateway 라우팅: /api/* 패턴
app.include_router(highlight.router, prefix="/api")
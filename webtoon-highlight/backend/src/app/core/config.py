import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    FONT_PATH: str = os.getenv("FONT_PATH", "./NanumGothic-Regular.ttf")

settings = Settings()



import os
import json
import re
import csv
from pathlib import Path
from datetime import datetime, timezone
from typing import Literal, Optional, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import pandas as pd

# LangChain / Vector DB
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma, FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser

# -----------------------------------------------------------------------------
# 환경설정
# -----------------------------------------------------------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("환경변수 OPENAI_API_KEY가 없습니다. .env에 설정해 주세요.")

WEBTOON_CSV_PATH = os.getenv("WEBTOON_CSV_PATH", "./webtoon_data.csv")
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db5")
FAISS_DB_DIR = os.getenv("FAISS_DB_DIR", "./db")

try:
    from zoneinfo import ZoneInfo
    _KST = ZoneInfo("Asia/Seoul")
except Exception:
    _KST = timezone.utc

# -----------------------------------------------------------------------------
# LLM 초기화 (원본 로직 유지)
# -----------------------------------------------------------------------------
llm = ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=1024)
llm_struct = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_tokens=256)

# -----------------------------------------------------------------------------
# 스키마 / 파서 (원본 로직)
# -----------------------------------------------------------------------------
class IntentResult(BaseModel):
    intent: Literal["법률", "정보", "현황", "추천"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasons: str

class FilterResult(BaseModel):
    카테고리: Optional[str] = ""
    연령층: Optional[Literal["10~20대", "30대", "40대", ""]] = ""
    성별: Optional[Literal["남성", "여성", ""]] = ""

intent_llm = llm_struct.with_structured_output(IntentResult)
filter_parser = PydanticOutputParser(pydantic_object=FilterResult)

# -----------------------------------------------------------------------------
# 전역 상태 (벡터스토어, 체인, 메모리)
# -----------------------------------------------------------------------------
df: pd.DataFrame = None
vectordb: Chroma = None
retriever_info = None
rag_chain = None

# -----------------------------------------------------------------------------
# 벡터스토어 빌드/로드 (원본 로직 동일)
# -----------------------------------------------------------------------------

def build_or_load_vectorstores():
    global df, vectordb, rag_chain, retriever_info
    df = pd.read_csv(WEBTOON_CSV_PATH)
    if "조회수" in df.columns and "구독자수" not in df.columns:
        df = df.rename(columns={"조회수": "구독자수"})

    Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)
    embeddings_hf = HuggingFaceEmbeddings(model_name="intfloat/multilingual-e5-base")
    vectordb = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings_hf)
    retriever_law = vectordb.as_retriever(search_kwargs={"k": 5})
    rag_chain = RetrievalQAWithSourcesChain.from_chain_type(llm=llm, retriever=retriever_law)

    faiss_path = Path(FAISS_DB_DIR)
    if faiss_path.exists() and any(faiss_path.iterdir()):
        embedding_info = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore_info = FAISS.load_local(FAISS_DB_DIR, embedding_info, allow_dangerous_deserialization=True)
    else:
        records = []
        for _, row in df.iterrows():
            title = str(row.get("제목", ""))
            summary = str(row.get("줄거리", row.get("키워드", "")))
            meta = {k: (None if pd.isna(v) else v) for k, v in row.to_dict().items()}
            content = f"제목: {title}\n요약: {summary}\n메타: {meta}"
            records.append(content)
        embedding_info = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore_info = FAISS.from_texts(records, embedding_info)
        vectorstore_info.save_local(FAISS_DB_DIR)
    retriever_info = vectorstore_info.as_retriever(search_kwargs={"k": 5})

# 세션별 대화 메모리 (정보 질의에 사용)
_memory_pool: Dict[str, ConversationBufferMemory] = {}

def _now_kst_str() -> str:
    return datetime.now(tz=_KST).strftime("%Y-%m-%d %H:%M:%S%z")

# -----------------------------------------------------------------------------
# 원본 프롬프트/함수 (Streamlit 코드와 동일한 동작)
# -----------------------------------------------------------------------------
intent_prompt = ChatPromptTemplate.from_messages([
    ("system",
     """너는 사용자 질문의 의도를 다음 중 하나로 정확히 분류한다.
     규칙:
     - \"법률\": 2차 창작(드라마/영화/게임/애니 등) 관련 저작권/계약/법령/법적 이슈 문의
     - \"정보\": 작품 자체 정보(제목/줄거리/작가/등장인물/설정 등)
     - \"추천\": 2차 창작 목적의 '적합한 웹툰 추천' 요청 (2차 창작 언급 없으면 추천 아님)
     - \"현황\": 조회수/구독자수/평점/순위/연령·성별 선호도 등 통계·랭킹 요청
     """
    ),
    ("human", "질문: {question}\n하나의 라벨을 고르고, 신뢰도와 간단한 근거를 함께 내.")
])

filters_prompt = ChatPromptTemplate.from_messages([
    ("system",
     "사용자 질문에서 추천/현황 분석에 필요한 필터를 추출한다."
     "카테고리(자유 텍스트), 연령층(10~20대/30대/40대/빈), 성별(남성/여성/빈)을 채워라."),
    ("human", "질문: {question}")
])

def _strip_code_fences(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        import re as _re
        t = _re.sub(r"^```(?:json)?\s*", "", t, flags=_re.IGNORECASE)
        t = _re.sub(r"\s*```$", "", t)
    return t.strip()

import re as _re

def _regex_salvage(text: str) -> dict | None:
    t = _strip_code_fences(text)
    m = _re.search(r'\{.*\}', t, flags=_re.DOTALL)
    if m:
        t = m.group(0)
    kv = {}
    for key in ["intent", "confidence", "reasons"]:
        p = rf'["\'\s]*{key}["\'\s]*\s*:\s*(".*?"|\d+(\.\d+)?|true|false|null|[^,}}]+)'
        mm = _re.search(p, t, flags=_re.IGNORECASE|_re.DOTALL)
        if mm:
            rawv = mm.group(1).strip()
            if rawv.startswith('"') and rawv.endswith('"'):
                rawv = rawv[1:-1]
            kv[key] = rawv
    return kv or None

def _normalize_quoted_keys(obj: dict) -> dict:
    norm = {}
    for k, v in obj.items():
        kk = str(k)
        kk = _re.sub(r'^[\s\'"]+|[\s\'"]+$', "", kk)
        norm[kk] = v
    return norm

def tolerant_pydantic_parse(text: str, model_cls: type[BaseModel]):
    for candidate in [text, _strip_code_fences(text)]:
        try:
            return model_cls.parse_obj(json.loads(candidate))
        except Exception:
            pass
        try:
            t2 = candidate.replace("'", '"')
            obj = json.loads(t2)
            obj = _normalize_quoted_keys(obj)
            return model_cls.parse_obj(obj)
        except Exception:
            pass
    t3 = _re.sub(r'"{2,}\s*([A-Za-z_][\w\- ]*)\s*"{2,}\s*:', r'"\1":', text)
    try:
        obj = json.loads(_strip_code_fences(t3))
        obj = _normalize_quoted_keys(obj)
        return model_cls.parse_obj(obj)
    except Exception:
        pass
    salvaged = _regex_salvage(text)
    if salvaged:
        try:
            if "confidence" in salvaged:
                try:
                    salvaged["confidence"] = float(salvaged["confidence"])
                except Exception:
                    salvaged["confidence"] = 0.0
            salvaged.setdefault("reasons", "")
            if "intent" in salvaged:
                lbl = salvaged["intent"].strip()
                mapping = {
                    "법률":"법률", "legal":"법률",
                    "정보":"정보", "info":"정보",
                    "현황":"현황", "status":"현황", "통계":"현황",
                    "추천":"추천", "recommend":"추천"
                }
                salvaged["intent"] = mapping.get(lbl.lower(), lbl)
            return model_cls.parse_obj(salvaged)
        except Exception:
            pass
    return None

INTENT_LOG_PATH = Path("./intent_logs.csv")

def log_intent_row(question: str, res: IntentResult, raw_payload: str = ""):
    write_header = not INTENT_LOG_PATH.exists()
    with INTENT_LOG_PATH.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if write_header:
            w.writerow(["timestamp_kst","question","intent","confidence","reasons","raw"])
        w.writerow([
            _now_kst_str(), question, res.intent, f"{res.confidence:.3f}", res.reasons, raw_payload
        ])

def _rule_based_fallback(q: str, default: str = "정보") -> str:
    ql = q.lower()
    law_kw = ["저작권","법","법률","계약","초상권","허가","라이선스","드라마화","영화화","각색","판권","ip","리메이크","원작 계약","섭외"]
    status_kw = ["조회수","구독자수","평점","랭킹","순위","선호도","통계"]
    rec_kw = ["추천","골라줘","픽","고르면","추천해","골라","뭘 볼까","추천 좀"]
    if any(k in q for k in law_kw): return "법률"
    if any(k in q for k in status_kw): return "현황"
    if ("드라마" in q or "영화" in q or "게임" in q or "애니" in q) and any(k in ql for k in rec_kw): return "추천"
    if any(k in ql for k in rec_kw): return "추천"
    return default

def classify_intent(question: str, confidence_threshold: float = 0.5) -> str:
    msgs = intent_prompt.format_messages(question=question)
    res: IntentResult = intent_llm.invoke(msgs)
    intent = res.intent
    conf = max(0.0, min(1.0, float(res.confidence)))
    if conf < confidence_threshold:
        intent = _rule_based_fallback(question, default=intent)
    raw_payload = f'{{"intent":"{res.intent}", "confidence":{res.confidence}, "reasons":"{res.reasons}"}}'
    log_intent_row(question, res, raw_payload=raw_payload)
    return intent

filters_prompt = ChatPromptTemplate.from_messages([
    ("system",
     "사용자 질문에서 추천/현황 분석에 필요한 필터를 추출한다. 카테고리(자유 텍스트), 연령층(10~20대/30대/40대/빈), 성별(남성/여성/빈)을 채워라."),
    ("human", "질문: {question}")
])

def extract_filters_structured(question: str) -> dict:
    raw = ""
    try:
        msgs = filters_prompt.format_messages(
            format_instructions=filter_parser.get_format_instructions(),
            question=question,
        )
        resp = llm_struct.invoke(msgs)
        raw = resp.content or ""
        try:
            parsed: FilterResult = filter_parser.parse(raw)
        except Exception:
            parsed = tolerant_pydantic_parse(raw, FilterResult)
            if parsed is None:
                raise KeyError('filters_parse_failed')
        return parsed.dict()
    except Exception:
        cond = {"카테고리": "", "연령층": "", "성별": ""}
        cats = ["로맨스", "드라마", "액션", "무협", "스릴러", "판타지", "코미디", "학원", "스포츠", "공포"]
        for c in cats:
            if c in question:
                cond["카테고리"] = c
                break
        if any(k in question for k in ["10대", "20대", "10~20대", "젊은", "청소년", "Z세대"]):
            cond["연령층"] = "10~20대"
        elif "30대" in question or "직장인" in question:
            cond["연령층"] = "30대"
        elif "40대" in question:
            cond["연령층"] = "40대"
        if "여성" in question or "여자" in question:
            cond["성별"] = "여성"
        elif "남성" in question or "남자" in question:
            cond["성별"] = "남성"
        return cond

prompt_template_info = ChatPromptTemplate.from_messages([
    ("system", "너는 웹툰 전문가야. 반드시 웹툰 데이터베이스(검색 문서) 내 정보만 사용해. 문서가 없으면 '해당 정보를 찾을 수 없습니다'라고만 말해."),
    ("human", "질문: {question}\n\n관련 문서:\n{context}")
])

def custom_rag_chatbot(query, retriever, llm, memory: ConversationBufferMemory):
    docs = retriever.get_relevant_documents(query)
    if not docs:
        return "해당 정보를 웹툰 데이터베이스에서 찾을 수 없습니다. 웹툰과 관련된 다른 질문을 해주세요."
    context = "\n\n".join([d.page_content for d in docs])
    messages = prompt_template_info.format_messages(question=query, context=context)
    response = llm(messages)
    memory.chat_memory.add_user_message(query)
    memory.chat_memory.add_ai_message(response.content)
    return response.content

# 헬퍼들
import pandas as _pd

def extract_top_k(question: str, default_k=5) -> int:
    m = _re.search(r"(?:상위|top\s*)?(\d+)\s*(?:개|편|명|위)?", question, _re.IGNORECASE)
    if m:
        try:
            n = int(m.group(1))
            return max(1, min(5, n))
        except:
            pass
    return default_k

def _safe_contains(series: _pd.Series, needle: str) -> _pd.Series:
    if not needle:
        return _pd.Series([True]*len(series), index=series.index)
    return series.fillna("").astype(str).str.contains(needle, case=False, na=False)

def handle_recommendation(question: str) -> str:
    k = extract_top_k(question, default_k=5)
    cond = extract_filters_structured(question)
    filtered = df.copy()
    if "카테고리" in df.columns and cond["카테고리"]:
        filtered = filtered[_safe_contains(filtered["카테고리"], cond["카테고리"])]
    if cond["연령층"] in df.columns:
        filtered = filtered[_safe_contains(filtered[cond["연령층"]], "상|중")]
    if "성별선호도" in df.columns and cond["성별"]:
        filtered = filtered[_safe_contains(filtered["성별선호도"], cond["성별"])]
    if filtered.empty:
        return "❗ 조건에 맞는 웹툰을 찾지 못했습니다."
    score = []
    for _, row in filtered.iterrows():
        rating = float(row.get("평점", 0) or 0)
        subs = float(row.get("구독자수", 0) or 0)
        score.append(rating * 1.0 + (subs / 1000.0))
    filtered = filtered.assign(추천점수=score).sort_values("추천점수", ascending=False).head(k)
    lines = []
    for _, r in filtered.iterrows():
        title = r.get("제목", "N/A")
        rating = r.get("평점", "N/A")
        subs = int(float(r.get("구독자수", 0)))
        kw = r.get("키워드", "")
        lines.append(f"- {title} (평점: {rating}, 구독자수: {subs}, 키워드: {kw})")
    return "\n".join(lines)

def handle_status(question: str) -> str:
    k = extract_top_k(question, default_k=5)
    cond = extract_filters_structured(question)
    filtered = df.copy()
    if "카테고리" in df.columns and cond["카테고리"]:
        filtered = filtered[_safe_contains(filtered["카테고리"], cond["카테고리"])]
    if cond["연령층"] in df.columns:
        filtered = filtered[_safe_contains(filtered[cond["연령층"]], "상|중")]
    if "성별선호도" in df.columns and cond["성별"]:
        filtered = filtered[_safe_contains(filtered["성별선호도"], cond["성별"])]
    if "구독자수" in question:
        key = "구독자수"
    elif "평점" in question:
        key = "평점"
    else:
        key = None
    if key and key in filtered.columns:
        top = filtered.sort_values(key, ascending=False).head(k)
    else:
        cols = [c for c in ["평점", "구독자수"] if c in filtered.columns]
        if cols:
            top = filtered.sort_values(cols, ascending=False).head(k)
        else:
            return "❗ 조건에 맞는 웹툰이 없습니다."
    lines = []
    for _, r in top.iterrows():
        title = r.get("제목", "N/A")
        rating = r.get("평점", "N/A")
        subs = int(float(r.get("구독자수", 0)))
        cat = r.get("카테고리", "")
        lines.append(f"- {title} (평점: {rating}, 구독자수: {subs}, 카테고리: {cat})")
    return "\n".join(lines)


# -----------------------------------------------------------------------------
# FastAPI 앱/엔드포인트
# -----------------------------------------------------------------------------
app = FastAPI(title="웹툰 챗봇 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"

class AskResponse(BaseModel):
    intent: str
    answer: str
    chunks: List[str] = []  # 법률 모드에서만 반환

@app.on_event("startup")
def _startup():
    build_or_load_vectorstores()


def _get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _memory_pool:
        _memory_pool[session_id] = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True, output_key="answer"
        )
    return _memory_pool[session_id]

@app.get("/health")
def health():
    return {"status": "ok", "time": _now_kst_str()}

@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    q = req.question.strip()
    if not q:
        raise HTTPException(status_code=400, detail="question is empty")
    intent = classify_intent(q)

    chunks: List[str] = []
    if intent == "법률":
        result = rag_chain(q)
        answer = result.get("answer", "")
        # 참고 문서 일부 노출
        docs = vectordb.similarity_search(q, k=5)
        chunks = [d.page_content for d in docs]
    elif intent == "현황":
        answer = handle_status(q)
    elif intent == "추천":
        answer = handle_recommendation(q)
    elif intent == "정보":
        mem = _get_memory(req.session_id or "default")
        answer = custom_rag_chatbot(q, retriever_info, llm, mem)
    else:
        answer = "❗ 질문을 이해하지 못했습니다. 다시 시도해주세요."

    return AskResponse(intent=intent, answer=answer, chunks=chunks)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
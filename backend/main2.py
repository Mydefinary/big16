#!/usr/bin/env python3
"""
Main entrypoint with:
  1) CLI subcommands (info/status/recommend/legal/auto)
  2) FastAPI app exposing /question-api/ask (AskRequest -> AskResponse)

FastAPI schema (required):

class AskRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"

class AskResponse(BaseModel):
    intent: str
    answer: str

Run API (option 1):
  uvicorn main:app --host 0.0.0.0 --port 8000

Run API (option 2):
  python main.py serve --host 0.0.0.0 --port 8000

CLI examples:
  python main.py auto --ask "타임루프가 주요 소재인 작품 알려줘"
  python main.py auto --ask "20대 남성에게 가장 인기 많은 웹툰 3개, 구독자수와 평점도"
  python main.py legal --question "웹툰 캐릭터 굿즈 라이선스?" --chroma-dir ./chroma_db5 --k 5 --json
"""
from __future__ import annotations

import argparse
import importlib
import importlib.util
import io
import json
import os
import re
import runpy
import sys
from contextlib import contextmanager, redirect_stdout
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
load_dotenv()

# ---------------- Defaults / paths ----------------
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

DEF_DB_INFO = os.getenv("INFO_DB", "./db")
DEF_COL_INFO = os.getenv("INFO_COLLECTION", "webtoon_info")
DEF_CSV = os.getenv("STATUS_CSV", "./webtoon_data_new.csv")
DEF_DB_STATUS = os.getenv("STATUS_DB", "./db2")
DEF_COL_STATUS = os.getenv("STATUS_COLLECTION", "webtoon_status")
DEF_LEGAL_CHROMA = os.getenv("CHROMA_DIR", "./chroma_db5")

# LLM availability (for router)
try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    USE_LLM = bool(os.getenv("OPENAI_API_KEY"))
except Exception:
    USE_LLM = False

# ---------------- Small utils ----------------
@contextmanager
def patched_argv(argv: List[str]):
    old = sys.argv[:]
    try:
        sys.argv = ["_embedded_main_"] + list(argv)
        yield
    finally:
        sys.argv = old


def module_exists(name: str) -> bool:
    return importlib.util.find_spec(name) is not None


def run_module_main(module_name: str, argv: List[str]) -> int:
    """Import module and run its main() with patched argv.
    Returns exit code (int)."""
    try:
        mod = importlib.import_module(module_name)
    except ModuleNotFoundError as e:
        raise SystemExit(f"[Error] Module '{module_name}' not found: {e}")

    with patched_argv(argv):
        try:
            if hasattr(mod, "main") and callable(getattr(mod, "main")):
                mod.main()
            else:
                runpy.run_module(module_name, run_name="__main__")
            return 0
        except SystemExit as e:
            code = e.code if isinstance(e.code, int) or e.code is None else 1
            return int(code or 0)


def run_module_capture(module_name: str, argv: List[str]) -> str:
    """Run a module's main() and capture its STDOUT as a string (for API responses)."""
    buf = io.StringIO()
    with redirect_stdout(buf):
        run_module_main(module_name, argv)
    return buf.getvalue().strip()

# ---------------- Lightweight NLP helpers ----------------
MALE_TOKENS = ["남성","남자","남","male","m"]
FEMALE_TOKENS = ["여성","여자","여","female","f"]
POPULARITY_HINTS = ["가장","top","상위","최고","1위","랭킹","순위","인기","평점","조회수","구독","관심"]
RECOMMEND_HINTS = ["추천","콜라보","브랜드","광고","분위기","무드","컨셉","2차","타깃","타겟"]
INFO_HINTS = ["줄거리","작품 정보","작품 알려줘","무슨 작품","설정","세계관","등장인물","작품 검색","작품 찾아"]
LEGAL_HINTS = [
    "법률","법적","저작권","라이선스","라이센스","상표","상표권","초상권","표절","계약","사용허락","허가",
    "2차 창작","2차창작","저작인격권","공정이용","페어유즈","퍼블리싱","배급권","판권","광고 표시","표시광고법",
    "청소년","심의","불법","침해","저작재산권","라이선싱"
]


def parse_age(text: str) -> Optional[int]:
    m = re.search(r"(\d{1,2})\s*대", text)
    if m: return int(m.group(1))
    m = re.search(r"(\d{2})s\b", text.lower())
    if m: return int(m.group(1))
    return None


def parse_gender(text: str) -> Optional[str]:
    if any(tok in text for tok in MALE_TOKENS): return "male"
    if any(tok in text for tok in FEMALE_TOKENS): return "female"
    return None


def parse_top_n(text: str, fallback: int = 3) -> int:
    # avoid age → N 오인
    t = re.sub(r"\b(\d{1,2})\s*대\b", " ", text)
    t = re.sub(r"\b(\d{2})s\b", " ", t, flags=re.IGNORECASE)
    for pat in [r"top\s*(\d{1,2})", r"상위\s*(\d{1,2})", r"(\d{1,2})\s*개만", r"(\d{1,2})\s*(?:개|위|작품)"]:
        m = re.search(pat, t, re.I)
        if m: return max(1, int(m.group(1)))
    if re.search(r"가장|최고|1위", t):
        return 1
    m = re.search(r"(\d{1,2})", t)
    return int(m.group(1)) if m else fallback

# ---------------- LLM router ----------------
ROUTER_SYS = (
    """
당신은 웹툰 챗봇의 라우팅 도우미입니다. 사용자의 한국어 요청을 보고 아래 JSON을 **정확히** 반환하세요.
형식 외의 텍스트는 출력하지 마세요.

Schema (JSON):
{
  "intent": "info | status | recommend | legal",
  "top": <int or null>,
  "metric": <string or null>,
  "age": <int or null>,
  "gender": "male | female | null",
  "platform": <string or null>,
  "with_rag": <bool or null>,
  "with_llm": <bool or null>,
  "notes": <string>
}

판단 기준:
- 순위/지표/Top-N/평점/조회/구독 등 → intent="status"
- 컨셉/분위기/광고/콜라보/브랜드/추천 → intent="recommend"
- 저작권/라이선스/상표/초상권/계약/법적 쟁점 → intent="legal"
- 작품 정보/검색/줄거리/세계관/인물 → intent="info"
- top은 문장에 "3개만", "상위 5", "Top 10", "1위/가장" 등을 반영
"""
)


def route_with_llm(ask: str) -> Dict[str, Any]:
    if not USE_LLM:
        return route_with_rules(ask)
    chat = ChatOpenAI(model="gpt-4o", temperature=0)
    messages = [
        SystemMessage(content=ROUTER_SYS),
        HumanMessage(content=f"요청: {ask}\n반환 JSON:")
    ]
    out = chat.invoke(messages)
    txt = out.content or ""
    m = re.search(r"\{.*\}", txt, re.S)
    if m:
        txt = m.group(0)
    try:
        return json.loads(txt)
    except Exception:
        return route_with_rules(ask)


def route_with_rules(ask: str) -> Dict[str, Any]:
    text = ask
    # intent (priority: legal > recommend > status > info)
    if any(k in text for k in LEGAL_HINTS):
        intent = "legal"
    elif any(k in text for k in RECOMMEND_HINTS):
        intent = "recommend"
    elif any(k in text.lower() for k in [w.lower() for w in POPULARITY_HINTS]):
        intent = "status"
    elif any(k in text for k in INFO_HINTS):
        intent = "info"
    else:
        intent = "recommend"

    age = parse_age(text)
    gender = parse_gender(text)
    top = parse_top_n(text, 5 if intent == "recommend" else 3)
    metric = None
    for key in ["평점","rating","조회","조회수","views","구독","관심","interest","likes","좋아요"]:
        if key in text:
            metric = key
            break
    platform = None
    for p in ["Naver","네이버","Kakao","카카오","Lezhin","레진","Webtoon","LINE"]:
        if p in text:
            platform = p
            break
    return {
        "intent": intent,
        "top": top,
        "metric": metric,
        "age": age,
        "gender": gender,
        "platform": platform,
        "with_rag": False,
        "with_llm": True if intent == "recommend" else False,
        "notes": "rules-fallback",
    }


def auto_route(ask: str) -> Dict[str, Any]:
    return route_with_llm(ask) if USE_LLM else route_with_rules(ask)

# ---------------- Dispatchers (CLI) ----------------

def dispatch_info(args: argparse.Namespace, ask: str) -> int:
    argv = ["--query", ask, "--db", getattr(args, "db", DEF_DB_INFO), "--collection", getattr(args, "collection", DEF_COL_INFO)]
    if getattr(args, "k", None) is not None: argv += ["--k", str(args.k)]
    if getattr(args, "max_ctx", None) is not None: argv += ["--max-ctx", str(args.max_ctx)]
    return run_module_main("query_webtoon_chroma", argv)


def dispatch_status(args: argparse.Namespace, ask: str, slots: Dict[str, Any]) -> int:
    argv = ["--csv", getattr(args, "csv", DEF_CSV), "--db", getattr(args, "status_db", DEF_DB_STATUS), "--collection", getattr(args, "status_collection", DEF_COL_STATUS)]
    argv += ["--query", ask]
    if slots.get("top"): argv += ["--top", str(slots["top"])]
    if slots.get("metric"): argv += ["--metric", str(slots["metric"])]
    if slots.get("platform"):
        filt = json.dumps({"platform": slots["platform"]})
        argv += ["--filter-json", filt]
    if bool(slots.get("with_rag")): argv += ["--with-rag"]
    return run_module_main("query_webtoon_status", argv)


def dispatch_recommend(args: argparse.Namespace, ask: str, slots: Dict[str, Any]) -> int:
    mod = "recommend_webtoon_v2" if module_exists("recommend_webtoon_v2") else "recommend_webtoon"
    argv = ["--query", ask, "--csv", getattr(args, "csv", DEF_CSV), "--story-db", getattr(args, "db", DEF_DB_INFO), "--story-col", getattr(args, "collection", DEF_COL_INFO)]
    if slots.get("top"): argv += ["--top", str(slots["top"])]
    if slots.get("age") is not None: argv += ["--age", str(slots["age"])]
    if slots.get("gender"): argv += ["--gender", str(slots["gender"])]
    if bool(slots.get("with_llm")): argv += ["--with-llm"]
    return run_module_main(mod, argv)


def dispatch_legal(args: argparse.Namespace, ask: str, slots: Dict[str, Any]) -> int:
    argv = ["--question", ask, "--chroma-dir", getattr(args, "legal_chroma_dir", DEF_LEGAL_CHROMA), "--k", str(getattr(args, "k", 5))]
    if getattr(args, "json", None):
        argv += ["--json"]
    # legal_advice.py 또는 legal_advice_cli.py 중 있는 모듈 사용
    mod = "legal_advice" if module_exists("legal_advice") else "legal_advice_cli"
    return run_module_main(mod, argv)

# ---------------- CLI ----------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Webtoon chatbot entrypoint with LLM router + FastAPI")
    sub = p.add_subparsers(dest="cmd", required=True)

    # manual: info
    pi = sub.add_parser("info", help="웹툰 정보 제공 (RAG)")
    pi.add_argument("--query", required=True)
    pi.add_argument("--db", default=DEF_DB_INFO)
    pi.add_argument("--collection", default=DEF_COL_INFO)
    pi.add_argument("--k", type=int, default=None)
    pi.add_argument("--max-ctx", type=int, default=None)
    pi.set_defaults(func=lambda a: run_module_main("query_webtoon_chroma", [
        "--query", a.query, "--db", a.db, "--collection", a.collection] + (
        ["--k", str(a.k)] if a.k is not None else []) + (
        ["--max-ctx", str(a.max_ctx)] if a.max_ctx is not None else [])))

    # manual: status
    ps = sub.add_parser("status", help="웹툰 현황 제공 (랭킹/지표)")
    ps.add_argument("--query", required=True)
    ps.add_argument("--csv", default=DEF_CSV)
    ps.add_argument("--db", dest="status_db", default=DEF_DB_STATUS)
    ps.add_argument("--collection", dest="status_collection", default=DEF_COL_STATUS)
    ps.add_argument("--top", type=int, default=None)
    ps.add_argument("--metric", type=str, default=None)
    ps.add_argument("--rank-col", dest="rank_col", type=str, default=None)
    ps.add_argument("--title-col", dest="title_col", type=str, default=None)
    ps.add_argument("--asc", action="store_true")
    ps.add_argument("--desc", action="store_true")
    ps.add_argument("--filter-json", dest="filter_json", type=str, default=None)
    ps.add_argument("--date-col", dest="date_col", type=str, default=None)
    ps.add_argument("--date-from", dest="date_from", type=str, default=None)
    ps.add_argument("--date-to", dest="date_to", type=str, default=None)
    ps.add_argument("--with-rag", action="store_true")
    ps.set_defaults(func=lambda a: run_module_main("query_webtoon_status", [
        "--csv", a.csv, "--db", a.status_db, "--collection", a.status_collection, "--query", a.query
    ] + (["--top", str(a.top)] if a.top is not None else [])
      + (["--metric", a.metric] if a.metric else [])
      + (["--rank-col", a.rank_col] if a.rank_col else [])
      + (["--title-col", a.title_col] if a.title_col else [])
      + (["--asc"] if a.asc else [])
      + (["--desc"] if a.desc else [])
      + (["--filter-json", a.filter_json] if a.filter_json else [])
      + (["--date-col", a.date_col] if a.date_col else [])
      + (["--date-from", a.date_from] if a.date_from else [])
      + (["--date-to", a.date_to] if a.date_to else [])
      + (["--with-rag"] if a.with_rag else [])
    ))

    # manual: recommend
    pr = sub.add_parser("recommend", help="웹툰 추천 (스토리+통계)")
    pr.add_argument("--query", required=True)
    pr.add_argument("--csv", default=DEF_CSV)
    pr.add_argument("--db", default=DEF_DB_INFO)
    pr.add_argument("--collection", default=DEF_COL_INFO)
    pr.add_argument("--top", type=int, default=None)
    pr.add_argument("--weights", type=str, default=None)
    pr.add_argument("--platform", type=str, default=None)
    pr.add_argument("--age", type=int, default=None)
    pr.add_argument("--gender", type=str, default=None)
    pr.add_argument("--with-llm", action="store_true")
    def _run_rec(a: argparse.Namespace) -> int:
        mod = "recommend_webtoon_v2" if module_exists("recommend_webtoon_v2") else "recommend_webtoon"
        argv = ["--query", a.query, "--csv", a.csv, "--story-db", a.db, "--story-col", a.collection]
        if a.top is not None: argv += ["--top", str(a.top)]
        if a.weights: argv += ["--weights", a.weights]
        if a.platform: argv += ["--platform", a.platform]
        if a.age is not None: argv += ["--age", str(a.age)]
        if a.gender: argv += ["--gender", a.gender]
        if a.with_llm: argv += ["--with-llm"]
        return run_module_main(mod, argv)
    pr.set_defaults(func=_run_rec)

    # manual: legal
    pl = sub.add_parser("legal", help="법률 조언 (RAG)")
    pl.add_argument("--question", required=True)
    pl.add_argument("--chroma-dir", default=DEF_LEGAL_CHROMA)
    pl.add_argument("--k", type=int, default=5)
    pl.add_argument("--json", action="store_true")
    def _run_legal(a: argparse.Namespace) -> int:
        argv = ["--question", a.question, "--chroma-dir", a.chroma_dir, "--k", str(a.k)] + (["--json"] if a.json else [])
        mod = "legal_advice" if module_exists("legal_advice") else "legal_advice_cli"
        return run_module_main(mod, argv)
    pl.set_defaults(func=_run_legal)

    # auto route (LLM/규칙)
    pa = sub.add_parser("auto", help="자연어 → 의도 분류 후 자동 실행")
    pa.add_argument("--ask", required=True, help="사용자 자연어 요청")
    pa.add_argument("--db", default=DEF_DB_INFO)
    pa.add_argument("--collection", default=DEF_COL_INFO)
    pa.add_argument("--csv", default=DEF_CSV)
    pa.add_argument("--status-db", dest="status_db", default=DEF_DB_STATUS)
    pa.add_argument("--status-collection", dest="status_collection", default=DEF_COL_STATUS)
    pa.add_argument("--legal-chroma-dir", dest="legal_chroma_dir", default=DEF_LEGAL_CHROMA)
    pa.set_defaults(func=None)

    # serve (optional): run uvicorn
    srv = sub.add_parser("serve", help="Run FastAPI server (uvicorn)")
    srv.add_argument("--host", default="0.0.0.0")
    srv.add_argument("--port", type=int, default=8000)
    srv.set_defaults(func=lambda a: _serve(host=a.host, port=a.port))

    return p

# ---------------- FastAPI ----------------
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Webtoon Chatbot API", version="1.0.0")

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

@app.get("/question-api/health")
def health():
    return {"status": "ok"}


def _execute_for_api(question: str) -> AskResponse:
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="question is empty")

    slots = auto_route(question)
    intent = slots.get("intent") or "recommend"

    # Build argv and capture output
    if intent == "info":
        argv = ["--query", question, "--db", DEF_DB_INFO, "--collection", DEF_COL_INFO]
        out = run_module_capture("query_webtoon_chroma", argv)
    elif intent == "status":
        argv = ["--csv", DEF_CSV, "--db", DEF_DB_STATUS, "--collection", DEF_COL_STATUS, "--query", question]
        if slots.get("top"): argv += ["--top", str(slots["top"])]
        if slots.get("metric"): argv += ["--metric", str(slots["metric"])]
        out = run_module_capture("query_webtoon_status", argv)
    elif intent == "legal":
        mod = "legal_advice" if module_exists("legal_advice") else "legal_advice_cli"
        argv = ["--question", question, "--chroma-dir", DEF_LEGAL_CHROMA, "--k", "5", "--json"]
        out = run_module_capture(mod, argv)
    else:  # recommend
        mod = "recommend_webtoon_v2" if module_exists("recommend_webtoon_v2") else "recommend_webtoon"
        argv = ["--query", question, "--csv", DEF_CSV, "--story-db", DEF_DB_INFO, "--story-col", DEF_COL_INFO]
        if slots.get("top"): argv += ["--top", str(slots["top"])]
        out = run_module_capture(mod, argv)

    # If JSON came back (legal --json), try to normalize to just answer
    try:
        data = json.loads(out)
        if isinstance(data, dict) and "answer" in data:
            answer_text = str(data.get("answer") or "").strip()
        else:
            answer_text = out.strip()
    except Exception:
        answer_text = out.strip()

    if not answer_text:
        answer_text = "(no output)"

    return AskResponse(intent=intent, answer=answer_text)


@app.post("/question-api/ask", response_model=AskResponse)
def ask(req: AskRequest) -> AskResponse:
    return _execute_for_api(req.question)


# ---------------- Serve helper ----------------
def _serve(host: str = "0.0.0.0", port: int = 8083) -> int:
    try:
        import uvicorn
    except Exception as e:
        raise SystemExit(f"uvicorn not installed: {e}")
    uvicorn.run("main2:app", host=host, port=port, reload=False)
    return 0


# ---------------- main() ----------------

def main():
    parser = build_parser()
    args = parser.parse_args()

    if args.cmd == "auto":
        slots = auto_route(args.ask)
        intent = slots.get("intent") or "recommend"
        print(f"[Router] intent={intent} slots={json.dumps(slots, ensure_ascii=False)}\n")
        if intent == "info":
            rc = dispatch_info(args, args.ask)
        elif intent == "status":
            rc = dispatch_status(args, args.ask, slots)
        elif intent == "legal":
            rc = dispatch_legal(args, args.ask, slots)
        else:
            rc = dispatch_recommend(args, args.ask, slots)
        sys.exit(rc)

    rc = args.func(args) if hasattr(args, "func") and args.func else 0
    sys.exit(rc)


if __name__ == "__main__":
    main()

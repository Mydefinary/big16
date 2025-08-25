#!/usr/bin/env python3
"""
Webtoon '현황 제공' 질의 도구 (v3):
- 자연어에서 지표(평점/구독/조회 등) 파싱 → 해당 지표로 정렬
- "가장/최고" → Top=1, "N개만" → 정확히 N
- 여러 지표 요청 시 동시 출력 (예: "구독자수와 평점")
- 선택: 연령/성별 파싱 및 전용 컬럼 자동 매핑, 기간/플랫폼 필터
"""

from __future__ import annotations

import argparse, json, os, re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple
import pandas as pd

# (옵션) RAG 요약
try:
    from langchain_chroma import Chroma  # type: ignore
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI  # type: ignore
    from langchain.prompts import ChatPromptTemplate  # type: ignore
    RAG_AVAILABLE = True
except Exception:
    RAG_AVAILABLE = False

from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_DB_DIR = "./db2"
DEFAULT_COLLECTION = "webtoon_status"

TITLE_KEYS = ["title","Title","name","Name","series","Series","webtoon_title","작품명","제목","작품","작품명(국문)"]
RANK_KEYS  = ["rank","순위","랭크","랭킹"]

# 지표 별 별칭(컬럼 부분문자열)
METRIC_ALIASES: Dict[str, List[str]] = {
    "views":    ["views","view","pv","조회","뷰"],
    "readers":  ["readers","uv","독자"],
    "likes":    ["likes","hearts","좋아요","하트"],
    # 구독/관심 계열(interest_count 포함)
    "subs":     ["subs","subscribers","subscriber","구독","구독자","interest","interest_count","관심","관심수","찜"],
    "comments": ["comments","댓글"],
    "rating":   ["rating","score","별점","평점","점수"],
}
POPULARITY_HINTS = ["인기","TOP","상위","최고","1위","랭킹","순위"]
AGE_WORDS = {"ten":10,"twenty":20,"thirty":30,"forty":40,"fifty":50,"sixty":60}

def _norm_cols(df: pd.DataFrame) -> Dict[str,str]:
    return {c.lower().strip(): c for c in df.columns}

def _find_first_col(df: pd.DataFrame, cands: Iterable[str]) -> Optional[str]:
    m = _norm_cols(df)
    for k in cands:
        kk = str(k).lower().strip()
        if kk in m: return m[kk]
    return None

def _find_title_col(df: pd.DataFrame) -> Optional[str]:
    return _find_first_col(df, TITLE_KEYS)

# ---- 자연어 파서 ----
def parse_gender(q: str) -> Optional[str]:
    ql = q.lower()
    if any(t in q for t in ["남성","남자"]) or re.search(r"\b남\b", q): return "male"
    if any(t in q for t in ["여성","여자"]) or re.search(r"\b여\b", q): return "female"
    if " male" in ql or ql.startswith("male"): return "male"
    if " female" in ql or ql.startswith("female"): return "female"
    return None

def parse_age(q: str) -> Optional[int]:
    m = re.search(r"(\d{1,2})\s*대", q)
    if m: return int(m.group(1))
    m = re.search(r"(\d{2})s\b", q.lower())
    if m: return int(m.group(1))
    for w,n in AGE_WORDS.items():
        if w in q.lower(): return n
    return None

def _strip_age_numbers(q: str) -> str:
    q = re.sub(r"\b(\d{1,2})\s*대\b"," ",q)
    q = re.sub(r"\b(\d{2})s\b"," ",q)
    return q

def parse_top_n(text: Optional[str], fallback: int = 3) -> int:
    """Parse Top-N from natural language.
    Priority:
      1) Explicit N (e.g., "3개만", "상위 5", "Top 10", "3위", "3 작품")
      2) If no explicit N but "가장/최고/1위" present → 1
      3) Any remaining bare number
      4) Fallback
    Also strips age tokens like "20대" so age doesn't get misread as Top-N.
    """
    if not text:
        return fallback

    import re
    # Remove age patterns like "20대", "30s" so they don't collide with Top-N
    t = re.sub(r"\b(\d{1,2})\s*대\b", " ", text)
    t = re.sub(r"\b(\d{2})s\b", " ", t, flags=re.IGNORECASE)

    # 1) Explicit patterns first (Korean & English)
    explicit_pats = [
        r"top\s*(\d{1,2})",                 # Top 3
        r"상위\s*(\d{1,2})",                 # 상위 3
        r"(\d{1,2})\s*개만",                 # 3개만
        r"(\d{1,2})\s*(?:개|위|작품)",       # 3개 / 3위 / 3 작품
    ]
    for pat in explicit_pats:
        m = re.search(pat, t, flags=re.IGNORECASE)
        if m:
            try:
                n = int(m.group(1))
                return max(1, n)
            except Exception:
                pass

    # 2) Superlative only → 1
    if re.search(r"(가장|최고|1위)", t):
        return 1

    # 3) Any remaining bare number
    m = re.search(r"(\d{1,2})", t)
    if m:
        return int(m.group(1))

    # 4) Fallback
    return fallback

def parse_requested_metrics(q: str) -> List[str]:
    ql = q.lower(); req: List[str] = []
    for key, subs in METRIC_ALIASES.items():
        if any(sub.lower() in ql for sub in subs):
            req.append(key)
    # 중복 제거(순서 보존)
    out, seen = [], set()
    for k in req:
        if k not in seen:
            out.append(k); seen.add(k)
    return out

# ---- 컬럼 탐색 ----
def _find_rank_col(df: pd.DataFrame, *, age: Optional[int], gender: Optional[str]) -> Optional[str]:
    tokens: List[str] = []
    if gender:
        tokens += ["male","남"] if gender.lower() in ["male","m","남","남성","남자"] else ["female","여"]
    if age: tokens += [f"{age}대", f"{age}s", f"{age}"]
    cands = []
    for c in df.columns:
        cl = str(c).lower()
        if any(r in cl for r in ["rank","순위","랭크","랭킹"]):
            if not tokens or any(t in cl for t in [t.lower() for t in tokens]):
                cands.append(c)
    if not cands: return _find_first_col(df, RANK_KEYS)
    def score(x: str) -> int:
        xl=x.lower(); s=0
        if any(t in xl for t in ["male","female","남","여"]): s+=1
        if age and any(t in x for t in [f"{age}대", f"{age}s", str(age)]): s+=1
        return s
    cands.sort(key=lambda x:(score(x),-len(x)), reverse=True)
    return cands[0]

def _find_metric_col(df: pd.DataFrame, metric_key: str, *, age: Optional[int], gender: Optional[str]) -> Optional[str]:
    subs = METRIC_ALIASES.get(metric_key, [])
    tokens: List[str] = []
    if gender:
        tokens += ["male","남"] if gender.lower() in ["male","m","남","남성","남자"] else ["female","여"]
    if age: tokens += [f"{age}대", f"{age}s", f"{age}"]
    best, best_score = None, -1
    for c in df.columns:
        cl = str(c).lower()
        if not any(sub.lower() in cl for sub in subs): continue
        score = 0
        if any(t in cl for t in [t.lower() for t in tokens]): score += 2
        if any(k in cl for k in ["view","조회","like","좋아요","sub","구독","interest","관심","rating","평점","score","별점"]): score += 1
        if score > best_score: best_score, best = score, c
    if best: return best
    for c in df.columns:
        cl = str(c).lower()
        if any(sub.lower() in cl for sub in subs): return c
    return None

# ---- 핵심 로직 ----
@dataclass
class Selection:
    title: str
    score_name: str
    score: Any
    row_index: int

def compute_top(
    df: pd.DataFrame, *,
    query_text: Optional[str],
    top_n: int,
    metric: Optional[str],
    rank_col: Optional[str],
    title_col: Optional[str],
    desc: Optional[bool],
    date_col: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    filter_json: Optional[str],
    age: Optional[int],
    gender: Optional[str],
) -> Tuple[List[Selection], str, List[str]]:
    work = df.copy()

    # 동등/기간 필터
    if filter_json:
        filt = json.loads(filter_json)
        for k,v in filt.items():
            if k in work.columns:
                work = work[work[k] == v]
    if date_col and date_col in work.columns and (date_from or date_to):
        ser = pd.to_datetime(work[date_col], errors="coerce")
        if date_from: work = work[ser >= pd.to_datetime(date_from)]
        if date_to:   work = work[ser <= pd.to_datetime(date_to)]

    # 인구통계 행 필터(존재 시)
    gender_col = next((c for c in ["성별","gender","Gender"] if c in work.columns), None)
    age_col    = next((c for c in ["연령대","연령","age_group","age","연령층"] if c in work.columns), None)
    if gender and gender_col:
        target = "남" if gender.lower() in ["male","m","남","남성","남자"] else "여"
        work = work[ work[gender_col].astype(str).str.contains(target, case=False, na=False) ]
    if age and age_col:
        work = work[ work[age_col].astype(str).str.contains(str(age), na=False) ]

    # 타이틀/랭크 컬럼
    title_col = title_col or _find_title_col(work)
    chosen_rank = _find_rank_col(work, age=age, gender=gender)

    # 쿼리에서 요청 지표 파악 → 1순위 지표를 정렬 기준으로
    requested_metrics = parse_requested_metrics(query_text or "")
    primary_metric_key = metric or (requested_metrics[0] if requested_metrics else None)
    chosen_metric_col = _find_metric_col(work, primary_metric_key, age=age, gender=gender) if primary_metric_key else None

    reason = ""
    if chosen_metric_col is not None:
        criterion = chosen_metric_col
        sort_desc = True if (desc is None) else desc
        reason = f"{criterion} {'내림차순' if sort_desc else '오름차순'}"
    elif chosen_rank is not None and any(h in (query_text or "") for h in POPULARITY_HINTS):
        criterion = chosen_rank
        sort_desc = False if (desc is None) else not (not desc)
        reason = f"{criterion} 오름차순(=순위)"
    else:
        # 백업: 대표 지표 우선순위
        for key in ["rating","subs","views","likes","comments"]:
            col = _find_metric_col(work, key, age=age, gender=gender)
            if col:
                criterion, sort_desc, reason = col, True, f"{col} 내림차순"
                break
        else:
            num_cols = [c for c in work.columns if pd.api.types.is_numeric_dtype(work[c])]
            if not num_cols:
                raise SystemExit("No numeric metric or rank column found to compute a ranking.")
            criterion, sort_desc, reason = num_cols[0], True, f"{num_cols[0]} 내림차순"

    # 숫자 캐스팅 후 정렬
    try:
        work[criterion] = pd.to_numeric(work[criterion])
    except Exception:
        pass
    work_sorted = work.sort_values(by=criterion, ascending=not sort_desc, na_position="last")

    title_col = title_col or _find_title_col(work_sorted) or work_sorted.columns[0]

    results: List[Selection] = []
    for idx, row in work_sorted.head(top_n).iterrows():
        results.append(Selection(
            title=str(row.get(title_col, "(제목 미상)")),
            score_name=criterion,
            score=row.get(criterion),
            row_index=idx
        ))

    # 설명 꼬리표(인구통계)
    demo_bits = []
    if gender: demo_bits.append("남성" if str(gender).lower().startswith("m") or gender in ["남","남성","남자"] else "여성")
    if age:    demo_bits.append(f"{age}대")
    if demo_bits: reason = ", ".join(demo_bits) + " | " + reason

    return results, reason, requested_metrics

# ---- (옵션) RAG 요약 ----
SYSTEM_PROMPT = """너는 웹툰 현황 분석 도우미야. 선정된 작품의 핵심 지표(조회수, 구독자, 평점 등)를 간결히 소개해.
- 근거는 주어진 컨텍스트에서만 찾고, 추측하지 마.
- 각 항목 1~2문장, 한국어로 답변.
"""
USER_TEMPLATE = """선정된 작품과 점수:
{items}

검색 컨텍스트(발췌):
{context}
"""

def rag_summarize(selections: List[Selection], *, db_dir: str, collection: str, title_keys: List[str], k: int = 2) -> Optional[str]:
    if not RAG_AVAILABLE or not os.getenv("OPENAI_API_KEY"):
        return None
    embeddings = OpenAIEmbeddings()
    vs = Chroma(collection_name=collection, persist_directory=db_dir, embedding_function=embeddings)

    ctx_lines: List[str] = []
    for s in selections:
        chunks = vs.similarity_search(s.title, k=k)
        for ch in chunks:
            title = s.title
            for key in title_keys:
                if key in ch.metadata and str(ch.metadata[key]).strip():
                    title = str(ch.metadata[key]).strip(); break
            ctx_lines.append(f"- {title}: {ch.page_content}")
    items_str = "\n".join([f"- {s.title} ({s.score_name}={s.score})" for s in selections])

    llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    prompt = ChatPromptTemplate.from_messages([("system", SYSTEM_PROMPT), ("user", USER_TEMPLATE)])
    out = prompt | llm
    return out.invoke({"items": items_str, "context": "\n".join(ctx_lines)}).content

# ---- CLI ----
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Structured ranking queries for webtoon status CSV (demographic & multi-metric)")
    p.add_argument("--csv", type=str, default="./webtoon_data_new.csv")
    p.add_argument("--db", type=str, default=DEFAULT_DB_DIR)
    p.add_argument("--collection", type=str, default=DEFAULT_COLLECTION)
    p.add_argument("--query", type=str, default=None)
    p.add_argument("--top", type=int, default=None)
    p.add_argument("--metric", type=str, default=None)  # rating / subs / views ...
    p.add_argument("--rank-col", type=str, default=None)
    p.add_argument("--title-col", type=str, default=None)
    p.add_argument("--asc", action="store_true")
    p.add_argument("--desc", action="store_true")
    p.add_argument("--filter-json", type=str, default=None)
    p.add_argument("--date-col", type=str, default=None)
    p.add_argument("--date-from", type=str, default=None)
    p.add_argument("--date-to", type=str, default=None)
    p.add_argument("--with-rag", action="store_true")
    p.add_argument("--age", type=int, default=None)
    p.add_argument("--gender", type=str, default=None)
    return p.parse_args()

def main():
    args = parse_args()
    df = pd.read_csv(args.csv)

    age    = args.age if args.age is not None else parse_age(args.query or "")
    gender = args.gender if args.gender is not None else parse_gender(args.query or "")
    top_n  = args.top if args.top else parse_top_n(args.query or "", 3)
    desc   = True if args.desc else False if args.asc else None

    selections, reason, requested_metrics = compute_top(
        df,
        query_text=args.query,
        top_n=top_n,
        metric=args.metric,
        rank_col=args.rank_col,
        title_col=args.title_col,
        desc=desc,
        date_col=args.date_col,
        date_from=args.date_from,
        date_to=args.date_to,
        filter_json=args.filter_json,
        age=age,
        gender=gender,
        
    )

    # 표시에 사용할 지표(요청 없으면 기본: subs+rating)
    metrics_to_show = requested_metrics if requested_metrics else ["subs","rating"]
    metric_cols: Dict[str, Optional[str]] = {mk: _find_metric_col(df, mk, age=age, gender=gender) for mk in metrics_to_show}
    label_map = {"subs":"구독/관심","rating":"평점","views":"조회수","likes":"좋아요","comments":"댓글"}

    demo_bits = []
    if gender: demo_bits.append("남성" if str(gender).lower().startswith("m") or gender in ["남","남성","남자"] else "여성")
    if age:    demo_bits.append(f"{age}대")
    demo_label = " | ".join(demo_bits) if demo_bits else "전체"

    # print(f"[Result] 대상: {demo_label} | 기준: {reason} | Top {top_n}\n")
    print(f"[Result] 대상: {demo_label}\n")
    for i, s in enumerate(selections, 1):
        row = df.loc[s.row_index]
        fields = []
        for mk in metrics_to_show:
            col = metric_cols.get(mk)
            label = label_map.get(mk, mk)
            fields.append(f"{label}:{row.get(col)}" if col and col in df.columns else f"{label}:N/A")
        print(f"{i}. {s.title} ({s.score_name}={s.score}) | {', '.join(fields)}")

    if args.with_rag:
        summary = rag_summarize(selections, db_dir=args.db, collection=args.collection, title_keys=TITLE_KEYS, k=2)
        if summary: print("\n[Summary]\n" + summary)

if __name__ == "__main__":
    main()

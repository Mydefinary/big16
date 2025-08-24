#!/usr/bin/env python3
"""
Webtoon RAG Recommender (hybrid: storyline embeddings + status CSV)

v2 fixes
- Robust Korean text normalization (NFKC, whitespace, zero-width chars)
- Better retrieval fallback: if Chroma returns 0, fall back to CSV-only ranking (demographic-aware)
- Brand/category expansion now covers 아웃도어/복싱 등 추가
- Adaptive weights based on intent (광고/콜라보 → pop↑, 2차 창작/컨셉 → sim↑)
- --with-llm only fires when there are items; tries to fetch snippets by title if fallback path used
- Clear printing of the **actual** weights in use

Usage
  pip install -U pandas langchain langchain-chroma langchain-openai langchain-text-splitters
  export OPENAI_API_KEY=YOUR_KEY    # only needed for embeddings/LLM

  python recommend_webtoon_v2.py \
    --query "30대 남성을 타깃으로 할 프리미엄 아웃도어 콜라보레이션용 웹툰 추천" \
    --csv ./webtoon_data_new.csv \
    --story-db ./db1 --story-col webtoon_info \
    --top 5 --with-llm
"""

from __future__ import annotations

import argparse
import json
import os
import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pandas as pd

# Optional deps for RAG/LLM
try:
    from langchain_chroma import Chroma  # type: ignore
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI  # type: ignore
    from langchain.prompts import ChatPromptTemplate  # type: ignore
    RAG_OK = True
except Exception:
    RAG_OK = False

from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# ----------------------- Config -----------------------
TITLE_KEYS = [
    "title","Title","name","Name","series","Series","webtoon_title",
    "작품명","제목","작품","작품명(국문)",
]
RANK_KEYS = ["rank","순위","랭크","랭킹"]
METRIC_ALIASES: Dict[str, List[str]] = {
    "views":    ["views","view","pv","조회","뷰"],
    "likes":    ["likes","hearts","좋아요","하트"],
    "comments": ["comments","댓글"],
    "subs":     ["subs","subscribers","subscriber","구독","구독자","interest","interest_count","관심","관심수","찜"],
    "rating":   ["rating","score","평점","별점","점수"],
}
POPULARITY_HINTS = ["인기","top","상위","최고","1위","랭킹","순위","대세"]

BRAND_KEYWORDS = {
    # cosmetics/beauty
    r"cosmetic|beauty|화장품|메이크업|스킨케어": ["로맨스","힐링","일상","감성","패션","청춘","성장"],
    # food & drink
    r"food|배달|식품|커피|카페|음료": ["일상","코미디","회사","가족","청춘","먹방"],
    # game
    r"game|게임|rpg|fps|mmorpg": ["액션","판타지","모험","배틀","성장","SF"],
    # finance
    r"finance|금융|은행|카드|보험": ["현실","오피스","성공","성장","계약","계획"],
    # tech
    r"tech|it|폰|스마트폰|앱|전자": ["미래","혁신","SF","학교","청년층"],
    # outdoor (added)
    r"outdoor|아웃도어|등산|하이킹|트레킹|캠핑|백패킹|클라이밍|낚시|골프": ["자연","모험","여행","생존","스포츠","힐링","청정","성장"],
    # boxing / combat sports (added)
    r"복싱|권투|boxing|mma|격투|무술": ["스포츠","액션","성장","투지","훈련","라이벌"],
}

DEFAULT_WEIGHTS = {"sim": 0.55, "pop": 0.30, "rating": 0.15}
ZEROWIDTH = "\u200b\u200c\u200d\ufeff"

# ----------------------- Text normalization -----------------------

def norm_text(s: str) -> str:
    if not s:
        return s
    s = ''.join(ch for ch in s if ch not in ZEROWIDTH)
    s = unicodedata.normalize('NFKC', s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

# ----------------------- Utils -----------------------

def _norm_cols(df: pd.DataFrame) -> Dict[str,str]:
    return {c.lower().strip(): c for c in df.columns}

def _find_first_col(df: pd.DataFrame, candidates: Iterable[str]) -> Optional[str]:
    lm = _norm_cols(df)
    for key in candidates:
        k = str(key).lower().strip()
        if k in lm: return lm[k]
    return None

def _find_title_col(df: pd.DataFrame) -> Optional[str]:
    return _find_first_col(df, TITLE_KEYS)

def _find_rank_col(df: pd.DataFrame, age: Optional[int], gender: Optional[str]) -> Optional[str]:
    toks: List[str] = []
    if gender:
        toks += ["male","남"] if str(gender).lower() in ["male","m","남","남성","남자"] else ["female","여"]
    if age: toks += [f"{age}대", f"{age}s", f"{age}"]
    cands = []
    for c in df.columns:
        cl = str(c).lower()
        if any(r in cl for r in ["rank","순위","랭크","랭킹"]):
            if not toks or any(t in cl for t in toks):
                cands.append(c)
    if cands:
        def score(x: str) -> int:
            xl=x.lower(); s=0
            if any(t in xl for t in ["male","female","남","여"]): s+=1
            if age and any(t in x for t in [f"{age}대", f"{age}s", str(age)]): s+=1
            return s
        cands.sort(key=lambda x:(score(x),-len(x)), reverse=True)
        return cands[0]
    return _find_first_col(df, RANK_KEYS)

def _find_metric_col(df: pd.DataFrame, metric_key: str, age: Optional[int], gender: Optional[str]) -> Optional[str]:
    subs = METRIC_ALIASES.get(metric_key, [])
    toks: List[str] = []
    if gender:
        toks += ["male","남"] if str(gender).lower() in ["male","m","남","남성","남자"] else ["female","여"]
    if age: toks += [f"{age}대", f"{age}s", f"{age}"]
    best = None; best_score = -1
    for c in df.columns:
        cl = str(c).lower()
        if not any(sub.lower() in cl for sub in subs):
            continue
        s = 0
        if any(t in cl for t in toks): s += 2
        if any(k in cl for k in ["view","조회","sub","구독","interest","관심","rating","평점","score","별점","like","좋아요"]): s += 1
        if s > best_score:
            best, best_score = c, s
    if best: return best
    for c in df.columns:
        cl = str(c).lower()
        if any(sub.lower() in cl for sub in subs):
            return c
    return None

# ----------------------- NLP-ish parsing -----------------------
MALE_TOKENS = ["남성","남자","남","male","m"]
FEMALE_TOKENS = ["여성","여자","여","female","f"]

def parse_gender(q: str) -> Optional[str]:
    q = norm_text(q)
    if any(tok in q for tok in MALE_TOKENS): return "male"
    if any(tok in q for tok in FEMALE_TOKENS): return "female"
    return None

def parse_age(q: str) -> Optional[int]:
    q = norm_text(q)
    m = re.search(r"(\d{1,2})\s*대", q)
    if m: return int(m.group(1))
    m = re.search(r"(\d{2})s\b", q.lower())
    if m: return int(m.group(1))
    return None

def strip_age_numbers(q: str) -> str:
    q = re.sub(r"\b(\d{1,2})\s*대\b"," ", q)
    q = re.sub(r"\b(\d{2})s\b"," ", q)
    return q

def parse_top_n(text: Optional[str], fallback: int = 5) -> int:
    if not text: return fallback
    t = strip_age_numbers(norm_text(text))
    for pat in [r"top\s*(\d{1,2})", r"상위\s*(\d{1,2})", r"(\d{1,2})\s*개만", r"(\d{1,2})\s*(?:개|위|작품)"]:
        m = re.search(pat, t, re.I)
        if m: return max(1, int(m.group(1)))
    if re.search(r"가장|최고|1위", t):
        return 1
    m = re.search(r"(\d{1,2})", t)
    if m: return int(m.group(1))
    return fallback

def parse_keywords(q: str) -> List[str]:
    q = norm_text(q)
    tokens = re.split(r"[^0-9A-Za-z가-힣_]+", q)
    tokens = [t for t in tokens if t and len(t) >= 2]
    lex = set("""
    로맨스 순정 학원 액션 모험 판타지 무협 SF 스릴러 공포 추리 미스터리 코미디 일상 힐링 음악 스포츠 게임 시티 성장 레트로 감성 청춘 캠퍼스 오피스 가족 정치 군상 드라마 요리 먹방 여행 치유 코지 어드벤처 배틀 던전 마법 회귀 타임루프 복수 핍진 현실 공상 미래 사이버 스팀펑크 느와르 생존 자연 등반 캠핑 등산 하이킹 트레킹 권투 복싱 격투 훈련 라이벌
    """.split())
    out = []
    for t in tokens:
        if t in lex or re.match(r"[A-Za-z]{3,}", t):
            out.append(t)
    return list(dict.fromkeys(out))

# brand/product → concept expansion

def expand_brand_concepts(q: str) -> List[str]:
    ql = norm_text(q).lower()
    out: List[str] = []
    for pat, kws in BRAND_KEYWORDS.items():
        if re.search(pat, ql):
            out.extend(kws)
    return list(dict.fromkeys(out))

# auto weights based on intent

def auto_weights(q: str) -> Dict[str, float]:
    ql = norm_text(q).lower()
    # 광고/브랜드/콜라보 → 대중성 약간↑, 평점 약간↑
    if any(k in ql for k in ["광고","브랜드","콜라보","콜라보레이션","타이업","스폰서","프리미엄"]):
        return {"sim":0.45, "pop":0.35, "rating":0.20}
    # 2차 창작/컨셉/분위기 중심 → 의미론 유사도↑
    if any(k in ql for k in ["2차", "컨셉", "분위기", "무드", "스타일", "세계관"]):
        return {"sim":0.70, "pop":0.15, "rating":0.15}
    # 기본
    return DEFAULT_WEIGHTS.copy()

# ----------------------- Scoring helpers -----------------------
@dataclass
class Candidate:
    title: str
    doc_snippet: str
    meta: Dict[str, Any]
    sim: float
    pop: Optional[float]  # normalized 0..1
    rating: Optional[float]  # normalized 0..1
    raw_metrics: Dict[str, Any]


def minmax_norm(series: List[float]) -> List[float]:
    if not series: return []
    mn = min(series); mx = max(series)
    if mn == mx: return [1.0 for _ in series]
    return [(x - mn) / (mx - mn) for x in series]

# ----------------------- Retrieval & Join -----------------------

def retrieve_candidates(
    query: str,
    story_db: str,
    story_col: str,
    k_fetch: int = 60,
    k_final: int = 24,
) -> List[Tuple[Any, float]]:
    if not RAG_OK:
        return []
    embeddings = OpenAIEmbeddings()
    vs = Chroma(collection_name=story_col, persist_directory=story_db, embedding_function=embeddings)
    q = norm_text(query)
    # try 1: straight similarity with scores
    pairs: List[Tuple[Any, float]] = []
    try:
        pairs = vs.similarity_search_with_score(q, k=k_final)
    except Exception:
        pairs = []
    # try 2: MMR fallback
    if not pairs:
        try:
            docs = vs.max_marginal_relevance_search(q, k=k_final, fetch_k=max(k_fetch, k_final), lambda_mult=0.5)
            pairs = []
            for d in docs:
                # approximate distance via re-querying the original query (not doc content)
                sc = vs.similarity_search_with_score(q, k=1)[0][1]
                pairs.append((d, sc))
        except Exception:
            pairs = []
    return pairs


def build_title_index(df: pd.DataFrame) -> Tuple[Dict[str,int], str]:
    tcol = _find_title_col(df) or df.columns[0]
    idx = {}
    for i, v in enumerate(df[tcol].astype(str).fillna("")):
        key = re.sub(r"\s+", "", v).lower()
        idx[key] = i
    return idx, tcol

# decide columns based on demographics and metrics

def pick_columns(df: pd.DataFrame, *, age: Optional[int], gender: Optional[str]) -> Dict[str, Optional[str]]:
    cols: Dict[str, Optional[str]] = {}
    cols["rank"]   = _find_rank_col(df, age, gender)
    cols["rating"] = _find_metric_col(df, "rating", age, gender)
    cols["subs"]   = _find_metric_col(df, "subs", age, gender)
    cols["views"]  = _find_metric_col(df, "views", age, gender)
    return cols

# ----------------------- Ranking -----------------------

def rank_and_blend(
    pairs: List[Tuple[Any, float]],
    df: pd.DataFrame,
    title_idx: Dict[str,int],
    cols: Dict[str, Optional[str]],
    weights: Dict[str, float],
) -> List[Candidate]:
    pop_vals: List[Optional[float]] = []
    rating_vals: List[Optional[float]] = []
    cands: List[Candidate] = []

    def pop_from_row(row: pd.Series) -> Optional[float]:
        if cols.get("subs") and pd.notna(row.get(cols["subs"])):
            try: return float(row.get(cols["subs"]))
            except Exception: pass
        if cols.get("views") and pd.notna(row.get(cols["views"])):
            try: return float(row.get(cols["views"]))
            except Exception: pass
        if cols.get("rank") and pd.notna(row.get(cols["rank"])):
            try: return -float(row.get(cols["rank"]))  # lower rank → higher popularity
            except Exception: pass
        return None

    for d, dist in pairs:
        meta = dict(d.metadata or {})
        title = meta.get("title") or meta.get("작품명") or meta.get("name") or meta.get("제목")
        if not title:
            first = (d.page_content or "").splitlines()[0].strip() if d.page_content else ""
            m = re.search(r"제목\s*[:：]\s*(.+)$", first)
            title = m.group(1).strip() if m else first[:40]
        key = re.sub(r"\s+","", str(title)).lower()
        row = df.iloc[ title_idx[key] ] if key in title_idx else None

        raw = {}
        pop = None
        rating = None
        if row is not None:
            if cols.get("rating") and pd.notna(row.get(cols["rating"])):
                try: rating = float(row.get(cols["rating"]))
                except Exception: rating = None
            pop = pop_from_row(row)
            for mk, col in cols.items():
                if col and col in df.columns:
                    raw[mk] = row.get(col)
        try:
            sim = 1.0 / (1.0 + float(dist))  # distance → similarity
        except Exception:
            sim = 0.5
        cands.append(Candidate(
            title=str(title),
            doc_snippet=(d.page_content or "")[:240],
            meta=meta,
            sim=sim,
            pop=None if pop is None else float(pop),
            rating=None if rating is None else float(rating),
            raw_metrics=raw,
        ))
        pop_vals.append(cands[-1].pop)
        rating_vals.append(cands[-1].rating)

    norm_pop = minmax_norm([p for p in pop_vals if p is not None])
    norm_rat = minmax_norm([r for r in rating_vals if r is not None])
    ip = ir = 0
    for c in cands:
        if c.pop is not None:
            c.pop = norm_pop[ip]; ip += 1
        if c.rating is not None:
            c.rating = norm_rat[ir]; ir += 1

    ws = weights
    for c in cands:
        ps = c.pop if c.pop is not None else 0.5
        rs = c.rating if c.rating is not None else 0.5
        c.meta["hybrid_score"] = ws["sim"] * c.sim + ws["pop"] * ps + ws["rating"] * rs

    cands.sort(key=lambda x: x.meta.get("hybrid_score", 0.0), reverse=True)
    # basic dedup by title
    seen = set(); deduped: List[Candidate] = []
    for c in cands:
        k = re.sub(r"\s+","", c.title).lower()
        if k in seen: continue
        seen.add(k); deduped.append(c)
    return deduped

# ----------------------- CSV-only fallback -----------------------

def csv_fallback(df: pd.DataFrame, *, age: Optional[int], gender: Optional[str], top_n: int) -> List[Candidate]:
    df2 = df.copy()
    gcol = next((c for c in ["성별","gender","Gender"] if c in df2.columns), None)
    acol = next((c for c in ["연령대","연령","age_group","age","연령층"] if c in df2.columns), None)
    if gender and gcol:
        tgt = "남" if str(gender).lower() in ["male","m","남","남성","남자"] else "여"
        df2 = df2[df2[gcol].astype(str).str.contains(tgt, case=False, na=False)]
    if age and acol:
        df2 = df2[df2[acol].astype(str).str.contains(str(age), na=False)]

    cols = pick_columns(df2, age=age, gender=gender)
    # build popularity and rating
    pop_series = None
    if cols.get("subs") and cols["subs"] in df2.columns:
        pop_series = pd.to_numeric(df2[cols["subs"]], errors="coerce")
    elif cols.get("views") and cols["views"] in df2.columns:
        pop_series = pd.to_numeric(df2[cols["views"]], errors="coerce")
    elif cols.get("rank") and cols["rank"] in df2.columns:
        pop_series = -pd.to_numeric(df2[cols["rank"]], errors="coerce")
    else:
        # any numeric col
        num_cols = [c for c in df2.columns if pd.api.types.is_numeric_dtype(df2[c])]
        pop_series = pd.to_numeric(df2[num_cols[0]], errors="coerce") if num_cols else pd.Series([0]*len(df2))

    rat_series = None
    if cols.get("rating") and cols["rating"] in df2.columns:
        rat_series = pd.to_numeric(df2[cols["rating"]], errors="coerce")
    else:
        rat_series = pd.Series([None]*len(df2))

    # normalize
    def _norm(s: pd.Series) -> pd.Series:
        s = s.fillna(s.min())
        mn, mx = s.min(), s.max()
        if mn == mx:
            return pd.Series([1.0]*len(s), index=s.index)
        return (s - mn) / (mx - mn)

    popn = _norm(pop_series)
    ratn = _norm(rat_series) if rat_series.notna().any() else pd.Series([0.5]*len(df2), index=df2.index)

    score = 0.65*popn + 0.35*ratn
    df2 = df2.assign(__score=score)

    tcol = _find_title_col(df2) or df2.columns[0]
    rows = df2.sort_values("__score", ascending=False).head(top_n)

    out: List[Candidate] = []
    for _, row in rows.iterrows():
        title = str(row.get(tcol))
        raw = {}
        for mk, col in cols.items():
            if col and col in df2.columns:
                raw[mk] = row.get(col)
        out.append(Candidate(title=title, doc_snippet="", meta={"hybrid_score": float(row["__score"])}, sim=0.0,
                             pop=float(popn.loc[row.name]), rating=float(ratn.loc[row.name]), raw_metrics=raw))
    return out

# ----------------------- High-level pipeline -----------------------

def make_query_for_storyline(user_q: str) -> str:
    kws = parse_keywords(user_q)
    brand = expand_brand_concepts(user_q)
    parts = []
    if kws: parts.append("키워드:" + ",".join(kws))
    if brand: parts.append("브랜드적합:" + ",".join(brand))
    parts.append(norm_text(user_q))
    return " \n".join(parts)


def run(
    *,
    user_query: str,
    csv_path: str,
    story_db: str,
    story_col: str,
    top_n: int,
    weights: Dict[str, float],
    platform: Optional[str],
    age: Optional[int],
    gender: Optional[str],
    with_llm: bool,
) -> List[Candidate]:
    # load CSV
    df = pd.read_csv(csv_path)
    # platform filter if requested
    if platform and ("platform" in df.columns):
        df = df[df["platform"] == platform]

    # title index & metric columns
    title_idx, _ = build_title_index(df)
    cols = pick_columns(df, age=age, gender=gender)

    # build storyline query & retrieve
    story_q = make_query_for_storyline(user_query)
    pairs = retrieve_candidates(story_q, story_db=story_db, story_col=story_col, k_fetch=80, k_final=max(top_n*5, 25))

    cands: List[Candidate] = []
    if pairs:
        cands = rank_and_blend(pairs, df, title_idx, cols, weights)
        if not cands:
            # if join failed for all (titles mismatch), keep top by similarity only
            for d, dist in pairs:
                try:
                    sim = 1.0/(1.0+float(dist))
                except Exception:
                    sim = 0.5
                title = (d.metadata.get("title") if d.metadata else None) or (d.page_content or "").splitlines()[0][:40]
                cands.append(Candidate(title=str(title), doc_snippet=(d.page_content or "")[:240], meta={"hybrid_score":sim}, sim=sim, pop=None, rating=None, raw_metrics={}))

    # CSV fallback if still empty
    if not cands:
        cands = csv_fallback(df, age=age, gender=gender, top_n=top_n)

    return cands[:top_n]

# ----------------------- LLM rationale (optional) -----------------------
SYS_PROMPT = """
너는 웹툰 추천 도우미야. 아래 항목들을 간단히 추천 사유로 설명해.
- 타깃 독자층과의 적합성(연령/성별 표현이 있으면 반영)
- 요청한 컨셉/분위기/장르 키워드와의 매칭 근거(줄거리 단서 활용)
- 지표(구독/조회/평점 등)가 강점이면 1문장 언급
한국어로 간결하게, 각 작품 2문장 이내.
"""

USER_TMPL = """
사용자 요청: {user_query}

후보:
{items}

각 후보의 줄거리 발췌:
{snips}
"""


def summarize_reasons(items: List[Candidate], user_query: str, *, story_db: str, story_col: str) -> Optional[str]:
    if not RAG_OK or not os.getenv("OPENAI_API_KEY") or not items:
        return None
    # Try to fetch snippets by title if missing
    embeddings = OpenAIEmbeddings()
    vs = Chroma(collection_name=story_col, persist_directory=story_db, embedding_function=embeddings)
    enriched: List[Candidate] = []
    for c in items:
        if c.doc_snippet:
            enriched.append(c); continue
        try:
            hits = vs.similarity_search(c.title, k=1)
            if hits:
                c.doc_snippet = (hits[0].page_content or "")[:240]
        except Exception:
            pass
        enriched.append(c)

    chat = ChatOpenAI(model="gpt-4o", temperature=0.3)
    prompt = ChatPromptTemplate.from_messages([("system", SYS_PROMPT), ("user", USER_TMPL)])
    items_line = "\n".join([f"- {c.title} (hybrid={c.meta.get('hybrid_score'):.3f}, pop={c.pop if c.pop is not None else 'N/A'}, rating={c.raw_metrics.get('rating','N/A')})" for c in enriched])
    snips = "\n".join([f"- {c.title}: {c.doc_snippet}" for c in enriched])
    out = (prompt | chat).invoke({"user_query": norm_text(user_query), "items": items_line, "snips": snips})
    return out.content

# ----------------------- CLI -----------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Hybrid webtoon recommender (storyline RAG + status stats)")
    p.add_argument("--query", type=str, required=True, help="자연어 추천 요청")
    p.add_argument("--csv", type=str, default="./webtoon_data_new.csv")
    p.add_argument("--story-db", type=str, default="./db1")
    p.add_argument("--story-col", type=str, default="webtoon_info")
    p.add_argument("--status-col", type=str, default=None)
    p.add_argument("--top", type=int, default=None)
    p.add_argument("--weights", type=str, default=None, help='JSON like {"sim":0.55,"pop":0.30,"rating":0.15}')
    p.add_argument("--platform", type=str, default=None)
    p.add_argument("--age", type=int, default=None)
    p.add_argument("--gender", type=str, default=None)
    p.add_argument("--with-llm", action="store_true")
    return p.parse_args()


def main():
    args = parse_args()

    # parse from query if not explicitly given
    q = norm_text(args.query)
    age    = args.age if args.age is not None else parse_age(q)
    gender = args.gender if args.gender is not None else parse_gender(q)
    top_n  = args.top if args.top else parse_top_n(q, 5)

    # Weights: explicit > auto > default
    if args.weights:
        try:
            used_weights = DEFAULT_WEIGHTS.copy()
            used_weights.update(json.loads(args.weights))
        except Exception as e:
            raise SystemExit(f"Invalid --weights JSON: {e}")
    else:
        used_weights = auto_weights(q)

    items = run(
        user_query=q,
        csv_path=args.csv,
        story_db=args.story_db,
        story_col=args.story_col,
        top_n=top_n,
        weights=used_weights,
        platform=args.platform,
        age=age,
        gender=gender,
        with_llm=args.with_llm,
    )

    print(f"[Recommend] Top {top_n} (weights: sim={used_weights['sim']}, pop={used_weights['pop']}, rating={used_weights['rating']})\n")
    if not items:
        print("(No candidates found: check --story-db/--story-col, or ensure embeddings are built.)")
        return

    for i, c in enumerate(items, 1):
        metas = []
        if c.raw_metrics.get('rating') is not None:
            metas.append(f"평점={c.raw_metrics.get('rating')}")
        if c.raw_metrics.get('subs') is not None:
            metas.append(f"구독/관심={c.raw_metrics.get('subs')}")
        if c.raw_metrics.get('views') is not None:
            metas.append(f"조회수={c.raw_metrics.get('views')}")
        print(f"{i}. {c.title}  | hybrid={c.meta.get('hybrid_score'):.3f} | " + ", ".join(metas) )

    if args.with_llm and items:
        expl = summarize_reasons(items, q, story_db=args.story_db, story_col=args.story_col)
        if expl:
            print("\n[Why these]")
            print(expl)


if __name__ == "__main__":
    main()

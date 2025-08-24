#!/usr/bin/env python3
"""
Build a Chroma vector DB for the '현황 제공' feature from a CSV of webtoon KPIs / status.

This script is tailored for semi-structured, metric-heavy CSVs. It will:
- Read the CSV
- Create a natural-language summary per row (if a dedicated text column isn't provided)
- Chunk -> embed (OpenAI) -> persist to Chroma (./db2 by default)

Quickstart:
  pip install -U pandas langchain langchain-chroma langchain-openai langchain-text-splitters
  export OPENAI_API_KEY=YOUR_KEY
  python build_webtoon_status_chroma.py \
    --csv /mnt/data/webtoon_data_new.csv \
    --db ./db2 \
    --collection webtoon_status \
    --chunk-size 700 \
    --chunk-overlap 120 \
    --recreate

Notes:
- Embedding model defaults to text-embedding-3-large (change via --embedding-model)
- Title detection tries multiple common keys; you can force with --title-column
- If no obvious free-text column, the script composes a readable summary from useful fields
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any, Iterable

import pandas as pd

from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

# ---------- heuristics ----------
CANDIDATE_TEXT_COLS = [
    # English
    "summary", "description", "desc", "notes", "note", "status", "metric_summary", "overview",
    # Korean
    "요약", "설명", "비고", "메모", "현황", "지표요약", "개요",
]

CANDIDATE_TITLE_COLS = [
    # English
    "title", "series", "name", "webtoon_title",
    # Korean
    "작품명", "제목", "작품",
]

ID_LIKE_COLS = {"id", "ID", "work_id", "series_id", "작품ID", "코드"}
NUMERIC_PREFERENCE_COLS = [
    # common KPI names (both EN/KR)
    "views", "view", "uv", "pv", "readers", "likes", "hearts", "comments", "subs", "subscribers",
    "조회수", "조회", "독자", "좋아요", "하트", "댓글", "구독", "구독자",
    "rating", "score", "평점", "점수",
]


from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-large"


# ---------- utils ----------
def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", str(text)).strip()


def hash_id(*parts: str) -> str:
    h = hashlib.sha1()
    for p in parts:
        h.update(str(p).encode("utf-8"))
        h.update(b"|")
    return h.hexdigest()


def first_present_key(d: Dict[str, Any], candidates: Iterable[str]) -> Optional[str]:
    if not d:
        return None
    lower_map = {str(k).lower(): k for k in d}
    for c in candidates:
        if str(c).lower() in lower_map:
            return lower_map[str(c).lower()]
    return None


def pick_title(meta: Dict[str, Any], title_col: Optional[str], candidates: Iterable[str]) -> Optional[str]:
    if title_col and title_col in meta and str(meta[title_col]).strip():
        return str(meta[title_col]).strip()
    k = first_present_key(meta, candidates)
    if k:
        v = meta.get(k)
        if v is not None:
            s = str(v).strip()
            if s:
                return s
    return None


def pick_content_column(df: pd.DataFrame, content_col: Optional[str]) -> Optional[str]:
    if content_col:
        return content_col if content_col in df.columns else None
    lower_cols = {c.lower(): c for c in df.columns}
    for key in CANDIDATE_TEXT_COLS:
        if key.lower() in lower_cols:
            return lower_cols[key.lower()]
    # fallback: choose object column with highest mean length
    candidates = []
    for c in df.columns:
        if df[c].dtype == object:
            lengths = df[c].dropna().astype(str).map(len)
            if not lengths.empty and lengths.mean() > 40:
                candidates.append((lengths.mean(), c))
    if candidates:
        candidates.sort(reverse=True)
        return candidates[0][1]
    return None


def pretty_num(x: Any) -> Optional[str]:
    try:
        f = float(x)
    except Exception:
        return None
    # drop NaN/inf
    if pd.isna(f) or f != f:
        return None
    if abs(f) >= 1000:
        return f"{int(round(f)):,}"
    # keep up to 2 decimals for small numbers
    return f"{f:.2f}".rstrip("0").rstrip(".")


def compose_text_row(row: pd.Series, *, title_col: Optional[str], include_cols: Optional[List[str]] = None) -> str:
    meta = row.to_dict()
    title = pick_title(meta, title_col, CANDIDATE_TITLE_COLS)

    # gather fields to include
    fields: List[str] = []
    if include_cols:
        for c in include_cols:
            if c in row and pd.notna(row[c]):
                fields.append((c, row[c]))
    else:
        # heuristic: include title-ish, categorical/time, and common KPI numerics
        preferred_keys = set(CANDIDATE_TITLE_COLS)
        preferred_keys.update([
            "platform", "site", "연재처", "플랫폼",
            "genre", "장르",
            "date", "날짜", "week", "월", "주", "기간",
        ])
        for c in row.index:
            if c in ID_LIKE_COLS:
                continue
            v = row[c]
            if pd.isna(v):
                continue
            s = str(v).strip()
            if not s:
                continue
            if c in preferred_keys:
                fields.append((c, s))
        # include prominent numeric KPIs
        for c in row.index:
            if any(key.lower() in str(c).lower() for key in NUMERIC_PREFERENCE_COLS):
                pn = pretty_num(row[c])
                if pn is not None:
                    fields.append((c, pn))
        # include one fallback text field if nothing yet
        if not fields:
            for c in row.index:
                if row[c] is not None and isinstance(row[c], str) and len(row[c]) > 0:
                    fields.append((c, row[c]))
                    break

    # build a readable line
    parts: List[str] = []
    if title:
        parts.append(f"작품명: {title}")
    for k, v in fields:
        if isinstance(v, (int, float)):
            v_str = pretty_num(v) or str(v)
        else:
            v_str = str(v)
        # avoid repeating title
        if title and str(k) in CANDIDATE_TITLE_COLS:
            continue
        parts.append(f"{k}: {v_str}")

    text = " | ".join(parts)
    return normalize_ws(text)


def row_metadata(row: pd.Series, content_col: Optional[str], title_col: Optional[str]) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    for c, v in row.items():
        if content_col and c == content_col:
            continue
        if pd.isna(v):
            continue
        if isinstance(v, (int, float, bool)):
            meta[c] = v
        else:
            s = str(v).strip()
            if 0 < len(s) <= 500:
                meta[c] = s
    # store detected/forced title in metadata for downstream display
    title = pick_title(meta, title_col, CANDIDATE_TITLE_COLS)
    if title:
        meta.setdefault("title", title)
    return meta


def load_documents(
    csv_path: Path,
    *,
    content_column: Optional[str],
    title_column: Optional[str],
    include_cols: Optional[List[str]],
    chunk_size: int,
    chunk_overlap: int,
) -> List[Document]:
    df = pd.read_csv(csv_path)

    candidate_content = pick_content_column(df, content_column)

    # Drop rows with no usable content, but we may compose text
    rows: List[Document] = []
    for idx, row in df.iterrows():
        text: Optional[str] = None
        if candidate_content and pd.notna(row[candidate_content]):
            text = normalize_ws(str(row[candidate_content]))
        else:
            text = compose_text_row(row, title_col=title_column, include_cols=include_cols)
        if not text:
            continue
        meta = row_metadata(row, candidate_content, title_column)
        source_id = hash_id(str(idx), text[:64])
        meta.update({
            "source": str(csv_path),
            "source_id": source_id,
            "content_column": candidate_content or "<composed>",
        })
        rows.append(Document(page_content=text, metadata=meta))

    # Chunk
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", "！", "？", ". ", "! ", "? ", " "]
    )

    docs: List[Document] = []
    for d in rows:
        chunks = splitter.split_text(d.page_content)
        for i, ch in enumerate(chunks):
            chunk_id = hash_id(d.metadata["source_id"], str(i), ch[:64])
            m = dict(d.metadata)
            m.update({
                "chunk_index": i,
                "chunk_id": chunk_id,
                "chunk_size": len(ch),
            })
            docs.append(Document(page_content=ch, metadata=m))

    return docs


def build_chroma(
    docs: List[Document],
    *,
    persist_directory: Path,
    collection_name: str,
    embedding_model: str,
) -> None:
    persist_directory.mkdir(parents=True, exist_ok=True)
    embeddings = OpenAIEmbeddings(model=embedding_model)

    vectorstore = Chroma(
        collection_name=collection_name,
        persist_directory=str(persist_directory),
        embedding_function=embeddings,
    )

    texts = [d.page_content for d in docs]
    metadatas = [d.metadata for d in docs]
    ids = [d.metadata.get("chunk_id") for d in docs]

    vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)
    vectorstore.persist()


# ---------- CLI ----------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build Chroma DB for webtoon status CSV")
    p.add_argument("--csv", type=str, default="./webtoon_data_new.csv", help="Path to the CSV file")
    p.add_argument("--db", type=str, default="./db2", help="Directory to persist Chroma DB (default: ./db2)")
    p.add_argument("--collection", type=str, default="webtoon_status", help="Chroma collection name")
    p.add_argument("--content-column", type=str, default=None, help="Explicit free-text column to embed if present")
    p.add_argument("--title-column", type=str, default=None, help="Explicit title column name (optional)")
    p.add_argument("--include-cols", type=str, default=None, help="Comma-separated column names to include in composed text")
    p.add_argument("--chunk-size", type=int, default=500, help="Chunk size (characters)")
    p.add_argument("--chunk-overlap", type=int, default=120, help="Chunk overlap (characters)")
    p.add_argument("--embedding-model", type=str, default=DEFAULT_EMBEDDING_MODEL, help="Embedding model name")
    p.add_argument("--recreate", action="store_true", help="Delete existing DB directory before building")
    return p.parse_args()


def main():
    args = parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    db_dir = Path(args.db)
    if args.recreate and db_dir.exists():
        print(f"[info] Removing existing DB directory: {db_dir}")
        shutil.rmtree(db_dir)

    include_cols = None
    if args.include_cols:
        include_cols = [c.strip() for c in args.include_cols.split(',') if c.strip()]

    print("[info] Loading & preparing rows...")
    docs = load_documents(
        csv_path=csv_path,
        content_column=args.content_column,
        title_column=args.title_column,
        include_cols=include_cols,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
    )

    print(f"[info] Prepared {len(docs)} chunks for embedding.")

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set. Please export it before running.")

    print("[info] Building Chroma vector store...")
    build_chroma(
        docs=docs,
        persist_directory=db_dir,
        collection_name=args.collection,
        embedding_model=args.embedding_model,
    )

    unique_sources = len({d.metadata.get("source_id") for d in docs})
    print("\n[success] Status DB build complete!")
    print(f"  - DB path        : {db_dir}")
    print(f"  - Collection     : {args.collection}")
    print(f"  - Rows ingested  : {unique_sources}")
    print(f"  - Total chunks   : {len(docs)}")


if __name__ == "__main__":
    main()

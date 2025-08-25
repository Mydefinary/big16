#!/usr/bin/env python3
"""
Build Chroma DB for webtoon storylines with sensible defaults.

- No args needed: auto-detect CSV (INFO_CSV -> ./webtoon_storyline_data.csv -> /mnt/data/... -> ./data/...)
- DB dir: ./db, collection: webtoon_info, embedding: text-embedding-3-small
- langchain-chroma (new) compatible: no .persist(), only optional _client.persist()
"""

from __future__ import annotations
import argparse, os, shutil, sys
import pandas as pd
from dotenv import load_dotenv
load_dotenv()

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

DEFAULT_DB = "./db1"
DEFAULT_COLLECTION = "webtoon_info"
DEFAULT_EMBED_MODEL = "text-embedding-3-small"

TITLE_CANDS = ["제목", "작품명", "title", "Title", "name", "series"]
STORY_CANDS = ["줄거리", "내용", "설명", "story", "synopsis", "summary", "content", "description"]

def find_default_csv() -> str | None:
    for cand in [
        os.getenv("INFO_CSV"),
        "./webtoon_storyline_data.csv",
    ]:
        if cand and os.path.exists(cand):
            return cand
    return None

def pick_col(df: pd.DataFrame, cands) -> str | None:
    # exact
    for c in cands:
        if c in df.columns:
            return c
    # case-insensitive
    lower = {c.lower(): c for c in df.columns}
    for c in cands:
        if c.lower() in lower:
            return lower[c.lower()]
    return None

def build_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build Chroma DB for webtoon storylines")
    p.add_argument("--csv", type=str, default=find_default_csv(), help="CSV path (auto-detected if omitted)")
    p.add_argument("--db", type=str, default=DEFAULT_DB, help="Chroma DB directory")
    p.add_argument("--collection", type=str, default=DEFAULT_COLLECTION, help="Chroma collection name")
    p.add_argument("--model", type=str, default=DEFAULT_EMBED_MODEL, help="OpenAI embedding model")
    p.add_argument("--chunk", type=int, default=800)
    p.add_argument("--overlap", type=int, default=100)
    p.add_argument("--reset", action="store_true", help="Remove DB dir before building")
    return p.parse_args()

def main():
    args = build_args()

    if not os.getenv("OPENAI_API_KEY"):
        sys.exit("OPENAI_API_KEY not set.")

    if not args.csv:
        sys.exit("CSV 파일을 찾지 못했습니다. --csv 로 경로를 지정하거나, INFO_CSV를 설정하세요.")

    if args.reset and os.path.exists(args.db):
        shutil.rmtree(args.db)

    # CSV load with BOM-safe fallback
    try:
        df = pd.read_csv(args.csv, encoding="utf-8-sig")
    except Exception:
        df = pd.read_csv(args.csv)

    title_col = pick_col(df, TITLE_CANDS)
    story_col = pick_col(df, STORY_CANDS)
    if not title_col or not story_col:
        sys.exit(f"CSV에서 제목/줄거리 컬럼을 찾지 못했습니다. (제목 후보: {TITLE_CANDS}, 줄거리 후보: {STORY_CANDS})")

    splitter = RecursiveCharacterTextSplitter(chunk_size=args.chunk, chunk_overlap=args.overlap)
    docs = []
    for i, row in df.iterrows():
        title = str(row.get(title_col, "")).strip()
        story = str(row.get(story_col, "")).strip()
        if not title and not story:
            continue
        base = f"[제목] {title}\n[줄거리] {story}"
        for j, chunk in enumerate(splitter.split_text(base)):
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "title": title or "(제목 미상)",
                    "작품명": title or "(제목 미상)",
                    "source": f"row{i}",      # RetrievalQA 기본 prompt 호환용
                    "source_id": f"row{i}",
                    "chunk_id": f"{i:06d}-{j:03d}",
                }
            ))

    if not docs:
        sys.exit("인덱싱할 문서가 없습니다. CSV 내용을 확인하세요.")

    embeddings = OpenAIEmbeddings(model=args.model)
    vs = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        collection_name=args.collection,
        persist_directory=args.db,
    )

    # optional persist for some client backends
    try:
        if hasattr(vs, "_client") and hasattr(vs._client, "persist"):
            vs._client.persist()
    except Exception:
        pass

    count = 0
    try:
        count = vs._collection.count()
    except Exception:
        pass

    print(f"[done] indexed {len(docs)} chunks → {args.db} / {args.collection} (count={count})")

if __name__ == "__main__":
    main()

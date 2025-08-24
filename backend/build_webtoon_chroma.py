#!/usr/bin/env python3
"""
Build a Chroma vector DB from a CSV of webtoon storylines.

Usage:
  python build_webtoon_chroma.py \
    --csv ./webtoon_storyline_data.csv \
    --db ./db \
    --collection webtoon_storylines \
    --chunk-size 800 \
    --chunk-overlap 150 \
    [--content-column storyline] \
    [--recreate]

Requirements:
  pip install -U pandas chromadb langchain langchain-community langchain-openai langchain-text-splitters
  export OPENAI_API_KEY=your_key

Notes:
  - Uses OpenAI text-embedding-3-large by default. Change via --embedding-model.
  - Persists Chroma DB to --db directory (default: ./db).
"""

import argparse
import hashlib
import os
import re
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

import pandas as pd

# LangChain components
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document


CANDIDATE_CONTENT_COLUMNS = [
    "storyline",
    "story",
    "synopsis",
    "summary",
    "plot",
    "content",
    "description",
    "줄거리",
    "스토리",
    "시놉시스",
]

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-large"


def normalize_whitespace(text: str) -> str:
    text = re.sub(r"\s+", " ", str(text)).strip()
    return text


def guess_content_column(df: pd.DataFrame) -> str:
    lower_cols = {c.lower(): c for c in df.columns}
    for key in CANDIDATE_CONTENT_COLUMNS:
        if key.lower() in lower_cols:
            return lower_cols[key.lower()]
    # fallback: choose the longest average-length text-like column
    text_like_cols = []
    for c in df.columns:
        if df[c].dtype == object:
            lengths = df[c].dropna().astype(str).map(len)
            if not lengths.empty and lengths.mean() > 50:  # heuristic
                text_like_cols.append((lengths.mean(), c))
    if not text_like_cols:
        raise ValueError(
            "Couldn't find a suitable content column. Please specify --content-column explicitly."
        )
    text_like_cols.sort(reverse=True)
    return text_like_cols[0][1]


def row_metadata(row: pd.Series, content_col: str) -> Dict[str, Any]:
    meta: Dict[str, Any] = {}
    for c, v in row.items():
        if c == content_col:
            continue
        # keep only simple metadata types and small strings
        if pd.isna(v):
            continue
        if isinstance(v, (int, float, bool)):
            meta[c] = v
        else:
            s = str(v).strip()
            if 0 < len(s) <= 500:  # avoid giant fields in metadata
                meta[c] = s
    return meta


def hash_id(*parts: str) -> str:
    h = hashlib.sha1()
    for p in parts:
        h.update(p.encode("utf-8"))
        h.update(b"|")
    return h.hexdigest()


def load_documents(
    csv_path: Path,
    content_column: Optional[str] = None,
    chunk_size: int = 500,
    chunk_overlap: int = 150,
) -> List[Document]:
    df = pd.read_csv(csv_path)
    if content_column is None:
        content_column = guess_content_column(df)

    if content_column not in df.columns:
        raise ValueError(f"Content column '{content_column}' not found in CSV.")

    # Drop rows with no content
    df = df[df[content_column].notna()].copy()

    # Normalize text
    df[content_column] = df[content_column].astype(str).map(normalize_whitespace)

    # Deduplicate rows by exact content to avoid redundant embeddings
    df = df.drop_duplicates(subset=[content_column])

    # Build base documents
    base_docs: List[Document] = []
    for idx, row in df.iterrows():
        content = row[content_column]
        if not content or content.strip() == "":
            continue
        meta = row_metadata(row, content_column)
        # Provide a stable source id per row
        source_id = hash_id(str(idx), meta.get("title", ""), content[:64])
        meta.update({
            "source": str(csv_path),
            "source_id": source_id,
            "content_column": content_column,
        })
        base_docs.append(Document(page_content=content, metadata=meta))

    # Chunk documents
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "! ", "? ", " "]
    )

    chunked_docs: List[Document] = []
    for doc in base_docs:
        chunks = splitter.split_text(doc.page_content)
        for i, chunk in enumerate(chunks):
            # create a unique, stable id for each chunk
            chunk_id = hash_id(doc.metadata["source_id"], str(i), chunk[:64])
            meta = dict(doc.metadata)
            meta.update({
                "chunk_index": i,
                "chunk_id": chunk_id,
                "chunk_size": len(chunk),
            })
            chunked_docs.append(Document(page_content=chunk, metadata=meta))

    return chunked_docs


def build_chroma(
    docs: List[Document],
    persist_directory: Path,
    collection_name: str,
    embedding_model: str = DEFAULT_EMBEDDING_MODEL,
) -> None:
    # Ensure output dir exists
    persist_directory.mkdir(parents=True, exist_ok=True)

    # Initialize embeddings (requires OPENAI_API_KEY)
    embeddings = OpenAIEmbeddings(model=embedding_model)

    # Prepare data for insertion
    texts = [d.page_content for d in docs]
    metadatas = [d.metadata for d in docs]
    ids = [d.metadata.get("chunk_id") for d in docs]

    # Create / connect to Chroma collection and add docs
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(persist_directory),
    )

    # Note: LangChain's Chroma#add_texts does an upsert-like behavior if ids clash
    vectorstore.add_texts(texts=texts, metadatas=metadatas, ids=ids)
    vectorstore.persist()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a Chroma DB from webtoon storyline CSV")
    parser.add_argument("--csv", type=str, default="./webtoon_storyline_data.csv", help="Path to the CSV file")
    parser.add_argument("--db", type=str, default="./db", help="Directory to persist Chroma DB")
    parser.add_argument("--collection", type=str, default="webtoon_storylines", help="Chroma collection name")
    parser.add_argument("--content-column", type=str, default=None, help="Name of the storyline/content column in CSV")
    parser.add_argument("--chunk-size", type=int, default=500, help="Chunk size (characters)")
    parser.add_argument("--chunk-overlap", type=int, default=150, help="Chunk overlap (characters)")
    parser.add_argument("--embedding-model", type=str, default=DEFAULT_EMBEDDING_MODEL, help="Embedding model name")
    parser.add_argument("--recreate", action="store_true", help="Delete existing DB directory before building")
    return parser.parse_args()


def main():
    args = parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    db_dir = Path(args.db)
    if args.recreate and db_dir.exists():
        print(f"[info] Removing existing DB directory: {db_dir}")
        shutil.rmtree(db_dir)

    print("[info] Loading and chunking documents...")
    docs = load_documents(
        csv_path=csv_path,
        content_column=args.content_column,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
    )
    print(f"[info] Prepared {len(docs)} chunks for embedding.")

    # Warn if API key missing
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set. Please export it before running.")

    print("[info] Building Chroma vector store...")
    build_chroma(
        docs=docs,
        persist_directory=db_dir,
        collection_name=args.collection,
        embedding_model=args.embedding_model,
    )

    # Simple success message
    unique_sources = len({d.metadata.get("source_id") for d in docs})
    print("\n[success] Chroma DB build complete!")
    print(f"  - DB path        : {db_dir}")
    print(f"  - Collection     : {args.collection}")
    print(f"  - Rows ingested  : {unique_sources}")
    print(f"  - Total chunks   : {len(docs)}")


if __name__ == "__main__":
    main()

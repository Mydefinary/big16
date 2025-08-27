#!/usr/bin/env python3
"""
Webtoon info RAG (simplified): RetrievalQAWithSourcesChain

- 벡터 검색 → 컨텍스트 0개면 즉시 중단(할루시네이션 방지)
- RetrievalQAWithSourcesChain 으로 간단/안정 운영
- Chroma(new: langchain_chroma), OpenAIEmbeddings, gpt-4o

Usage
  export OPENAI_API_KEY=...
  python query_webtoon_chroma.py --query "김부장 스토리 알려줘" \
    --db ./db --collection webtoon_info --k 5
"""

from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv
load_dotenv()

import pandas as pd  # (미사용이지만 환경 의존시 남겨둠)

# LangChain (최신 패키지 기준)
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate, PromptTemplate
from langchain.schema import Document
from langchain.chains import RetrievalQAWithSourcesChain

# ---------------- Defaults ----------------
DEFAULT_DB_DIR = "./db1"
DEFAULT_COLLECTION = "webtoon_info"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"
DEFAULT_CHAT_MODEL = "gpt-4o"

# 메타데이터에서 제목 추출 후보
TITLE_KEYS = [
    # EN
    "title", "Title", "name", "Name", "series", "Series", "webtoon_title",
    # KR
    "작품명", "제목", "작품", "작품명(국문)",
]

SYSTEM_PROMPT = """
너는 웹툰 RAG 어시스턴트야. 아래 컨텍스트에서만 근거를 찾아 한국어로 간결하게 답해.
- 컨텍스트에 없는 사실은 추측하지 마. 부족하면 '추가 정보 필요'라고 답해.
- 작품 요약은 3~5문장 내로 핵심만.
"""

# stuff 체인이 요구하는 변수명은 {context}, {question}
USER_PROMPT = """
질문:
{question}

검색 컨텍스트:
{context}

지침:
- 위 컨텍스트에서만 근거를 찾아 간결하게 답해.
- 필요 시 최대 3개까지만 비교/추천하고 관련 근거 한 줄.
"""


# ------------- helpers -------------
def _pick_meta(meta: Dict[str, Any], keys: Iterable[str]) -> Optional[str]:
    if not meta:
        return None
    lowered = {str(k).lower(): k for k in meta.keys()}
    for cand in keys:
        k = str(cand)
        if k.lower() in lowered:
            v = meta.get(lowered[k.lower()])
            if v is not None and str(v).strip():
                return str(v).strip()
    return None

def _title_of(d: Document) -> str:
    meta = d.metadata or {}
    t = _pick_meta(meta, TITLE_KEYS)
    if t:
        return t
    for k in ["id","ID","work_id","작품ID","코드"]:
        if meta.get(k):
            return f"(제목 미상:{meta[k]})"
    return "(제목 미상)"

def _print_sources(docs: List[Document]) -> None:
    print("[Sources]")
    seen = set()
    for d in docs:
        meta = d.metadata or {}
        title = _title_of(d)
        sid = str(meta.get("source_id", meta.get("source","")))[:8] or "fallback"
        cid = str(meta.get("chunk_id",""))[:8] or "fallback"
        key = (title, sid, cid)
        if key in seen:
            continue
        seen.add(key)
        print(f"- {title}")

# ------------- core -------------
def build_retriever(vs: Chroma, k: int, mmr: bool, alpha: float, filt: Optional[Dict[str, Any]]):
    search_kwargs: Dict[str, Any] = {"k": k}
    search_type = "mmr" if mmr else "similarity"
    if mmr:
        search_kwargs.update({"fetch_k": max(20, k*4), "lambda_mult": alpha})
    if filt:
        search_kwargs["filter"] = filt
    return vs.as_retriever(search_type=search_type, search_kwargs=search_kwargs)

def run_query(
    query: str,
    db_dir: str,
    collection: str,
    embedding_model: str,
    k: int,
    mmr: bool,
    alpha: float,
    model_name: str,
    filt: Optional[Dict[str, Any]],
):
    # Vector store
    embeddings = OpenAIEmbeddings(model=embedding_model)
    vs = Chroma(collection_name=collection, persist_directory=db_dir, embedding_function=embeddings)

    # Pre-retrieve to block hallucination when empty
    retriever = build_retriever(vs, k=k, mmr=mmr, alpha=alpha, filt=filt)
    preview_docs: List[Document] = retriever.invoke(query)

    if not preview_docs:
        print("[Answer]검색 컨텍스트에 요청하신 내용이 없습니다. 인덱스/컬렉션/질문을 확인해 주세요. [출처 없음]")
        print("[Sources]")
        return

    # RAG chain
    llm = ChatOpenAI(model=model_name, temperature=0.2)
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT),
    ])
    doc_prompt = PromptTemplate(input_variables=["page_content"], template="{page_content}")

    chain = RetrievalQAWithSourcesChain.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={
            "prompt": prompt,                     # {question}, {context} 사용
            "document_variable_name": "context",  # ← 우리가 쓰는 변수명
            "document_prompt": doc_prompt,        # ← 핵심: {source} 요구 제거
        },
        return_source_documents=True,
    )

    result = chain.invoke({"question": query})
    answer: str = result.get("answer", "").strip()
    src_docs: List[Document] = result.get("source_documents", []) or preview_docs

    # Output
    print("[Answer]")
    print(answer if answer else "추가 정보가 필요합니다.")
    # _print_sources(src_docs)

# ------------- CLI -------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Webtoon info via RetrievalQAWithSourcesChain")
    p.add_argument("--db", type=str, default=DEFAULT_DB_DIR)
    p.add_argument("--collection", type=str, default=DEFAULT_COLLECTION)
    p.add_argument("--embedding-model", type=str, default=DEFAULT_EMBEDDING_MODEL)
    p.add_argument("--model", type=str, default=DEFAULT_CHAT_MODEL)
    p.add_argument("--k", type=int, default=5)
    p.add_argument("--mmr", action="store_true")
    p.add_argument("--alpha", type=float, default=0.5)
    p.add_argument("--filter", type=str, default=None, help="JSON for metadata filter")
    p.add_argument("--query", type=str, default=None)
    return p.parse_args()

def main():
    args = parse_args()
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set.")
    filt = None
    if args.filter:
        try:
            filt = json.loads(args.filter)
        except Exception as e:
            raise SystemExit(f"Invalid --filter JSON: {e}")
    if args.query:
        run_query(
            query=args.query,
            db_dir=args.db,
            collection=args.collection,
            embedding_model=args.embedding_model,
            k=args.k,
            mmr=args.mmr,
            alpha=args.alpha,
            model_name=args.model,
            filt=filt,
        )
    else:
        print("질문이 필요합니다. 예) --query '김부장 스토리 알려줘'")

if __name__ == "__main__":
    main()

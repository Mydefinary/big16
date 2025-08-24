#!/usr/bin/env python3
"""
Query the persisted Chroma DB (built from webtoon storylines) with a simple RAG pipeline.

Updates in this version:
- langchain-chroma import (no deprecation warnings)
- LCEL wired to accept {"question": ...}
- retriever.invoke() instead of deprecated methods
- **Title mapping**: new `--title-keys` lets you specify candidate metadata keys for the title
- Safer string handling, cleaner printing

Usage:
  python query_webtoon_chroma.py --query "타임루프가 주요 소재인 작품 알려줘"
  python query_webtoon_chroma.py --k 6 --mmr --alpha 0.4 --query "좀비 학원물"
  python query_webtoon_chroma.py --query "기사단장 여주 판타지" --filter '{"platform":"Naver"}'
  python query_webtoon_chroma.py --title-keys "title,Title,작품명,제목,webtoon_title"

Requirements:
  pip install -U langchain langchain-chroma langchain-openai langchain-text-splitters pandas
  export OPENAI_API_KEY=your_key
"""

import argparse
import json
import os
from operator import itemgetter
from typing import List, Dict, Any, Iterable

from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain.schema.runnable import RunnableLambda
from langchain_core.output_parsers import StrOutputParser

from dotenv import load_dotenv
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

DEFAULT_DB_DIR = "./db"
DEFAULT_COLLECTION = "webtoon_storylines"
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-large"
DEFAULT_CHAT_MODEL = "gpt-4o"
DEFAULT_TITLE_KEYS = [
    # common English
    "title", "Title", "name", "Name", "series", "Series", "webtoon_title",
    # Korean
    "작품명", "제목", "작품", "작품명(국문)",
]

SYSTEM_PROMPT = (
    """
너는 웹툰 RAG 어시스턴트야. 아래 제공되는 검색 컨텍스트만으로 정확하고 간결하게 답변해.
- 답변은 반드시 한국어로.
- 모호하면 사실 범위 내에서만 요약/정리하고, 추가 정보가 필요함을 알려줘.
- 작품/회차/플랫폼 등 메타데이터를 아는 경우, 본문에 자연스럽게 녹이되 과도하게 나열하지 마.
- 사실 불명확하거나 컨텍스트에 없는 정보는 추측하지 마.
- 마지막에 간단한 출처 표기를 해. (예: [작품명 #회차 | source_id 앞 8자리])
"""
)

USER_PROMPT = (
    """
질문:
{question}

검색 컨텍스트 (최대 {max_ctx}개):
{context}

지침:
- 위 컨텍스트에서 답을 찾아 간결히 설명해.
- 사용자가 작품 검색/줄거리 문의를 했다면, 해당 작품(들)의 핵심 정보를 요약해.
- 필요하면 최대 3개까지만 비교/추천하고, 왜 관련 있는지 근거를 한 줄로 덧붙여.
- 답변 끝에 관련 출처를 나열해.
"""
)


def _pick_meta(meta: Dict[str, Any], keys: Iterable[str]) -> str | None:
    # case-insensitive key match
    if not meta:
        return None
    lowered = {str(k).lower(): k for k in meta.keys()}
    for cand in keys:
        k = str(cand)
        if k.lower() in lowered:
            val = meta.get(lowered[k.lower()])
            if val is not None:
                s = str(val).strip()
                if s:
                    return s
    return None


def _get_title(meta: Dict[str, Any], title_keys: List[str]) -> str:
    title = _pick_meta(meta, title_keys)
    if title:
        return title
    # Fallbacks: try a few common id-like fields; otherwise return placeholder
    for k in ["id", "ID", "work_id", "작품ID", "코드"]:
        v = meta.get(k)
        if v:
            return f"(제목 미상:{v})"
    return "(제목 미상)"


def make_format_docs(title_keys: List[str]):
    def _format(docs: List[Document]) -> str:
        parts: List[str] = []
        for i, d in enumerate(docs, 1):
            title = _get_title(d.metadata or {}, title_keys)
            episode = d.metadata.get("episode") or d.metadata.get("회차")
            tag = f"{title}{f' #{episode}' if episode else ''}"
            sid = str(d.metadata.get("source_id", ""))[:8]
            parts.append(f"[{i}] ({tag} | {sid}){d.page_content}")
        return "".join(parts)
    return _format


def print_sources(docs: List[Document], title_keys: List[str]) -> None:
    print("[Sources]")
    seen = set()
    for d in docs:
        title = _get_title(d.metadata or {}, title_keys)
        episode = d.metadata.get("episode") or d.metadata.get("회차")
        sid = str(d.metadata.get("source_id", ""))[:8]
        cid = str(d.metadata.get("chunk_id", ""))[:8]
        key = (title, episode, sid, cid)
        if key in seen:
            continue
        seen.add(key)
        ep = f" #{episode}" if episode else ""
        print(f"- {title}{ep} | source:{sid} | chunk:{cid}")


def build_chain(vs: Chroma, k: int, use_mmr: bool, alpha: float, model_name: str, filt: Dict[str, Any] | None, title_keys: List[str]):
    # Configure retriever (with optional filter)
    search_kwargs: Dict[str, Any] = {"k": k}
    if use_mmr:
        search_type = "mmr"
        search_kwargs.update({"fetch_k": max(k * 4, 20), "lambda_mult": alpha})
    else:
        search_type = "similarity"
    if filt:
        search_kwargs["filter"] = filt

    retriever = vs.as_retriever(search_type=search_type, search_kwargs=search_kwargs)

    # LLM
    llm = ChatOpenAI(model=model_name, temperature=0.2)

    # Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT),
    ])

    # Build LCEL chain: input expects {"question": str}
    chain = (
        {
            "question": itemgetter("question"),
            "context": itemgetter("question") | retriever | RunnableLambda(make_format_docs(title_keys)),
            "max_ctx": RunnableLambda(lambda _: k),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain, retriever


def run_query(
    query: str,
    db_dir: str,
    collection: str,
    embedding_model: str,
    k: int,
    use_mmr: bool,
    alpha: float,
    model_name: str,
    title_keys: List[str],
    filt: Dict[str, Any] | None = None,
) -> None:
    # Embeddings must match the build step
    embeddings = OpenAIEmbeddings(model=embedding_model)
    vs = Chroma(
        collection_name=collection,
        persist_directory=db_dir,
        embedding_function=embeddings,
    )

    chain, retriever = build_chain(vs, k=k, use_mmr=use_mmr, alpha=alpha, model_name=model_name, filt=filt, title_keys=title_keys)

    # Retrieve docs for source printing
    docs = retriever.invoke(query)

    # Run chain
    answer = chain.invoke({"question": query})

    print("[Answer]" + answer)
    print_sources(docs, title_keys)


def parse_args():
    p = argparse.ArgumentParser(description="Query webtoon Chroma RAG")
    p.add_argument("--db", type=str, default=DEFAULT_DB_DIR, help="Persisted Chroma directory")
    p.add_argument("--collection", type=str, default=DEFAULT_COLLECTION, help="Chroma collection name")
    p.add_argument("--embedding-model", type=str, default=DEFAULT_EMBEDDING_MODEL, help="Embedding model used at build time")
    p.add_argument("--model", type=str, default=DEFAULT_CHAT_MODEL, help="Chat model (e.g., gpt-4o, gpt-4o-mini)")
    p.add_argument("--k", type=int, default=5, help="# of chunks to stuff into context")
    p.add_argument("--mmr", action="store_true", help="Use Maximal Marginal Relevance retrieval")
    p.add_argument("--alpha", type=float, default=0.5, help="MMR diversity (0~1, lower=more diversity)")
    p.add_argument("--query", type=str, default=None, help="One-shot query. If omitted, starts an interactive REPL")
    p.add_argument("--filter", type=str, default=None, help="JSON dict for metadata filter (exact match / simple ranges)")
    p.add_argument("--title-keys", type=str, default=",".join(DEFAULT_TITLE_KEYS), help="Comma-separated candidate metadata keys for title detection")
    return p.parse_args()


def main():
    args = parse_args()

    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is not set. Please export it before running.")

    # Parse title keys
    title_keys = [k.strip() for k in (args.title_keys.split(",") if args.title_keys else []) if k.strip()]
    if not title_keys:
        title_keys = DEFAULT_TITLE_KEYS

    # Parse filter JSON
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
            use_mmr=args.mmr,
            alpha=args.alpha,
            model_name=args.model,
            title_keys=title_keys,
            filt=filt,
        )
        return

    # Interactive REPL
    print("Webtoon RAG REPL (Ctrl+C to exit). DB=", args.db, "| collection=", args.collection)
    while True:
        try:
            q = input("질문> ").strip()
            if not q:
                continue
            run_query(
                query=q,
                db_dir=args.db,
                collection=args.collection,
                embedding_model=args.embedding_model,
                k=args.k,
                use_mmr=args.mmr,
                alpha=args.alpha,
                model_name=args.model,
                title_keys=title_keys,
                filt=filt,
            )
        except KeyboardInterrupt:
            print("Bye!")
            break


if __name__ == "__main__":
    main()

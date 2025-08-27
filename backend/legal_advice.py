#!/usr/bin/env python3
# legal_advice.py (drop-in)
from __future__ import annotations
import argparse, json, os, re, textwrap
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
load_dotenv()

# ---- Chroma / Embeddings (신규 권장 임포트 우선) ----
try:
    from langchain_chroma import Chroma  # >=0.1
except Exception:
    from langchain_community.vectorstores import Chroma  # fallback

# try:
#     from langchain_huggingface import HuggingFaceEmbeddings  # >=0.1
# except Exception:
#     from langchain_community.embeddings import HuggingFaceEmbeddings  # fallback

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from chromadb.errors import InvalidArgumentError  # 차원 불일치 캐치

DEFAULT_CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db5")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
# 기존 인덱스가 768차원일 가능성이 높아 mpnet 기본
DEFAULT_EMB_MODEL = os.getenv("LEGAL_EMB_MODEL", "text-embedding-3-small")

# 차원→권장 모델 맵
DIM_TO_MODEL = {
    384: "text-embedding-3-small",
    512: "text-embedding-3-small",
    768: "text-embedding-3-small",
    1024:"text-embedding-3-small",
}

def _ensure_api_key() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("환경변수 OPENAI_API_KEY가 없습니다. .env에 설정하거나 export 해주세요.")

def _emb(model_name: str) -> OpenAIEmbeddings:
    # normalize_embeddings=True 를 주면 IP 검색에서 더 안정적인 경우가 많음
    return OpenAIEmbeddings(model=model_name)

def _build_vs(chroma_dir: str, emb_model: str) -> Chroma:
    if not Path(chroma_dir).exists():
        raise SystemExit(f"Chroma 디렉터리를 찾을 수 없습니다: {chroma_dir}")
    return Chroma(persist_directory=chroma_dir, embedding_function=_emb(emb_model))

def _detect_dimension_and_suggest(e: InvalidArgumentError) -> Optional[str]:
    m = re.search(r"dimension of (\d+)", str(e))
    if not m:
        return None
    dim = int(m.group(1))
    return DIM_TO_MODEL.get(dim)

SYSTEM_PROMPT = """\
당신은 한국의 저작권/상표/콘텐츠 계약 실무를 돕는 법률 도우미입니다.
반드시 아래 컨텍스트 안에서만 사실을 인용하고, 모호하면 '일반 절차/검토 체크리스트'를 제시하세요.
답변은 한국어로, 구조적으로 작성합니다:

[핵심 요약] 2~3줄
[필수 권리/계약 항목] 불릿
[진행 절차] 1→2→3 순서
[주의/리스크] 불릿
[참고 조항/근거] 조문·가이드라인 제목/조 번호 (있으면)

법률 자문이 아닌 일반 정보임을 한 줄로 고지하세요.
"""

USER_TMPL = """\
질문:
{question}

검색 컨텍스트(요약 발췌, 최대 {ctx_k}개):
{context}

요구사항:
- 컨텍스트에 근거해 답변. 직접 인용은 최소화, 요약/정리 중심.
- 굿즈/머천다이징 이슈가 보이면 저작권(2차적저작물 작성권/복제·배포권), 상표/캐릭터 라이선스, 표시광고/청소년보호 등 연계 이슈 언급.
- 권리자: 웹툰 IP 보유사(작가/플랫폼/에이전시)로 특정. 플랫폼 정책(네이버/카카오 등) 존재 가능성도 언급.
- 계약 항목: 허용 범위(품목·지역·기간·유통채널), 저작자표시·검수·승인, 로열티/최저보장(MG), 품질/하자, 표시광고/준법, 해지·위반시 조치.
"""

NEGATIVE_PATTERNS = [
    "정보가 없습니다", "충분한 정보", "제공된 컨텍스트로는", "I don't have the information", "cannot answer",
]

def _looks_bad(text: str) -> bool:
    if not text or len(text.strip()) < 60:
        return True
    tl = text.lower()
    return any(p.lower() in tl for p in NEGATIVE_PATTERNS)

def _fallback_answer(q: str) -> str:
    # 컨텍스트가 부실할 때 내보낼 실무형 체크리스트 템플릿
    return textwrap.dedent(f"""\
    [핵심 요약]
    웹툰 캐릭터를 굿즈로 제작·판매하려면 저작권자(또는 권리관리사)로부터 '머천다이징/캐릭터 라이선스'를 받아야 하며,
    상표권 사용 허락(브랜드/로고)이 필요한지 추가로 확인해야 합니다.

    [필수 권리/계약 항목]
    - 저작권: 2차적저작물 작성권, 복제/배포/전송권 등 굿즈 제작·판매에 필요한 범위
    - 상표권: 작품명/캐릭터명/로고 사용 시 상표 사용 허락 여부
    - 초상/성명권: 실존 인물·성우·모델 요소가 포함되는 경우 별도 허락
    - 계약범위: 품목(의류/피규어 등), 지역, 기간, 유통채널(온라인/오프라인/해외몰)
    - 검수/승인: 시안 제출, QC 기준, 표기(ⓒ권리자), 금지 표현·소재
    - 금액: 로열티율/최저보장(MG)/정산보고·감사권
    - 준법: 표시광고법, KC/안전인증(아동·생활용품), 청소년보호·심의, 플랫폼 정책 준수
    - 위반/해지: 침해·리콜·품질불량 시 조치, 재고 처리, 손해배상

    [진행 절차]
    1) 권리자 파악: 작가 단독이 아닌 플랫폼/에이전시가 권리 관리하는 경우 다수 → 권리 귀속/승인 라인 확인
    2) 제안서: 브랜드/품목/디자인·수량/지역·기간/유통채널/가격·예상 매출/마케팅·일정
    3) 법무 검토/계약: 허용 범위·표시·검수·로열티·준법·해지조항 확정
    4) 시안 승인·QC: 시안→검수→승인 로그 보관, 표기(ⓒ권리자/라이선스 문구)
    5) 출시/사후관리: 정산보고, 침해대응 협조, 재계약/연장 협의

    [주의/리스크]
    - 플랫폼 약관: 연재 플랫폼(NAVER/KAKAO 등)이 2차 사업·머천 권한을 보유/공동관리할 수 있음
    - 무단 사용 리스크: 권리자가 다수(공동저작·캐릭터·상표 등)일 때 일부만 허락받으면 분쟁 가능
    - 청소년/안전 규제: 유해성·안전인증·표시광고 위반에 주의

    [참고 조언]
    - 계약서에 '허용 품목/지역/기간/유통'을 명시하고, 검수·승인·표시·위반시 조치와 정산 프로세스를 구체화하세요.

    ※ 본 답변은 일반 정보 제공용이며 법률 자문이 아닙니다. 실제 계약은 전문 변호사 검토를 권장합니다.
    """)

def _compose_context(docs: List[Any], limit_chars: int = 1200) -> str:
    blocks = []
    for d in docs:
        txt = str(getattr(d, "page_content", "")).strip().replace("\n", " ")
        if not txt:
            continue
        if len(txt) > limit_chars:
            txt = txt[:limit_chars] + "..."
        title = None
        md = getattr(d, "metadata", {}) or {}
        for k in ("title", "문서명", "source", "파일명"):
            if k in md and str(md[k]).strip():
                title = str(md[k]).strip()
                break
        blocks.append(f"- {title or '근거'}: {txt}")
    return "\n".join(blocks)

def _extract_refs(docs: List[Any]) -> str:
    refs = []
    for d in docs:
        md = getattr(d, "metadata", {}) or {}
        title = md.get("title") or md.get("문서명") or md.get("source")
        # 조문 번호 추출 시도
        nums = re.findall(r"제\\s*\\d+\\s*조", str(getattr(d, "page_content", "")))
        if title or nums:
            refs.append(f"{title or '법령/가이드라인'} {', '.join(nums[:3]) if nums else ''}".strip())
    return ", ".join([r for r in refs if r]) or "컨텍스트 문서"

def run(question: str, *, chroma_dir: str = DEFAULT_CHROMA_DIR, k: int = 5,
        model: str = DEFAULT_MODEL, emb_model: str = DEFAULT_EMB_MODEL) -> Dict[str, Any]:
    _ensure_api_key()
    q = (question or "").strip()
    if not q:
        raise SystemExit("question is empty")

    # 1) 벡터스토어 로드 (+차원 자동 폴백)
    try:
        vs = _build_vs(chroma_dir, emb_model)
    except InvalidArgumentError as e:
        suggested = _detect_dimension_and_suggest(e)
        if suggested and suggested != emb_model:
            vs = _build_vs(chroma_dir, suggested)
            emb_model = suggested
        else:
            raise

    # 2) 검색 (MMR 지원 시 사용)
    docs: List[Any] = []
    try:
        # langchain_chroma >=0.1 에서 search_type="mmr" 지원
        docs = vs.as_retriever(search_kwargs={"k": max(5, k), "fetch_k": max(20, k*4), "search_type": "mmr"}).invoke(q)
    except Exception:
        docs = vs.similarity_search(q, k=max(6, k))

    # 3) 도메인 전용 프롬프트로 직접 응답
    ctx = _compose_context(docs, limit_chars=1200)
    llm = ChatOpenAI(model=model, temperature=0)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": USER_TMPL.format(question=q, context=ctx, ctx_k=min(len(docs), max(5, k)) )},
    ]
    answer = llm.invoke(messages).content

    # 4) 품질 체크 → 페일오버
    if _looks_bad(answer):
        answer = _fallback_answer(q)

    # 5) 참고 블록
    chunks = [getattr(d, "page_content", "") for d in docs[:max(5, k)]]
    return {"intent": "legal", "answer": answer, "chunks": chunks}

# ---------------- CLI ----------------
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="웹툰 법률 조언(LLM RAG) - 함수형/CLI")
    p.add_argument("--question", "-q", required=True, help="질문 문장")
    p.add_argument("--chroma-dir", default=DEFAULT_CHROMA_DIR, help="Chroma persist 디렉터리")
    p.add_argument("--k", type=int, default=5, help="retriever top-k")
    p.add_argument("--model", default=DEFAULT_MODEL, help="OpenAI Chat 모델명 (기본 gpt-4o)")
    p.add_argument("--emb-model", default=DEFAULT_EMB_MODEL, help="임베딩 모델명 (기본 768-d mpnet)")
    p.add_argument("--json", action="store_true", help="JSON 형식으로 출력")
    return p.parse_args()

def main() -> None:
    args = parse_args()
    out = run(args.question, chroma_dir=args.chroma_dir, k=args.k, model=args.model, emb_model=args.emb_model)
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return
    print(f"[LegalAnswer]\n{out['answer']}\n")
    if out.get("chunks"):
        print("[Chunks]")
        for i, ch in enumerate(out["chunks"], 1):
            snip = ch.replace("\n", " ")
            print(f"- {i}. {snip[:240]}{'...' if len(snip)>240 else ''}")

if __name__ == "__main__":
    main()

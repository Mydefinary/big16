import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import axios from "axios";

export default function App() {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <main className="container">
        <ChatbotPage />
      </main>
    </BrowserRouter>
  );
}

function GlobalStyles() {
  const css = `
    {채팅 말풍선 --me, --bot}
    {보내기 버튼: --brand}
    {시간표시: --sub}
    :root{
      --muted:#22c55e; --text:#000000; --sub:#a8adbd;
      --me:#22c55e; --bot:#22c55e; --danger:#ff6767;
      --brand:#22c55e;
    }
    *{box-sizing:border-box}
    html,body,#root{height:100%}
    body{margin:0;
    background:#f0fdf4;
    color:var(--text);
    font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","맑은 고딕",sans-serif;
    }

    .container{
    max-width:830px;
    margin:0 auto;
    }

    /* Chat */
    .chat-wrap{
    display:flex;
    flex-direction:column;
    height:min(100vh);
    }
    .chat{
    flex:1;
    overflow:auto;
    padding:16px;
    }

    .msg-row{
    display:flex;
    margin:10px 0;
    gap:8px;
    align-items:flex-end
    }
    .msg-row.me{
    justify-content:flex-end
    }

    .stack{display:flex;flex-direction:column;max-width:48%} /* 중앙에서 양옆 한 글자 폭 여유 */
    .msg-row.me .stack{margin-left:auto}

    .bubble{
    width:fit-content;
    max-width:100%;
    padding:10px 12px;
    border-radius:14px;
    font-size:14px;
    line-height:1.5;
    word-break:break-word;
    white-space:pre-wrap
    }
    .bubble.me{
    background:var(--me);
    color:#0b0c10;
    border-top-right-radius:4px
    }
    .bubble.bot{
    background:var(--bot);
    color:var(--text);
    border-top-left-radius:4px
    }

    .meta{
    margin-top:4px;
    font-size:11px;
    color:var(--sub)
    }
    .msg-row.me .meta{ text-align:right }

    .input-row{
    display:flex;
    gap:8px;
    margin-top:12px
    }
    .field{
    flex:1;
    background:#FFFFFF;
    border:1px solid var(--muted);
    border-radius:12px;
    padding:12px 12px;color:var(--text);
    font-size:14px
    }
    .field:focus{
    outline:none;
    border-color:#3b4160;
    box-shadow:0 0 0 3px #22c55e}
    .send{
    padding:12px 14px;
    border-radius:12px;
    background:var(--brand);
    color:#0b0c10;border:none;
    font-weight:700;
    cursor:pointer
    }
    .send:disabled{
    opacity:.6;
    cursor:default
    }

    .pill{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;background:#141824;border:1px solid var(--muted);font-size:12px;color:var(--sub)}
    .kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid var(--muted);padding:2px 6px;border-radius:6px;background:#0e1117;color:var(--sub);font-size:11px}
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// -------------------------------
// Chatbot Page (KakaoTalk-like UI)
// -------------------------------
interface ChatMsg { id: string; role: "user" | "bot"; text: string; time: string; }
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

function ChatbotPage(){
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => ([
    { id: crypto.randomUUID(), role: "bot", text: "안녕하세요! 작품에 대해 무엇이든 물어보세요.", time: nowHM() },
  ]));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const api = useMemo(() => axios.create({ baseURL: "/api", timeout: 20000, headers: { "Content-Type": "application/json" } }), []);
  const USE_NETWORK = true; // ← 서버 준비되면 true로
  
  useEffect(() => {
    const el = listRef.current; if(!el) return; el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const canSend = input.trim().length > 0 && !loading;
  const push = (m: ChatMsg) => setMsgs(prev => [...prev, m]);
  const pushUser = (text: string) => push({ id: crypto.randomUUID(), role: "user", text, time: nowHM() });
  const pushBot  = (text: string) => push({ id: crypto.randomUUID(), role: "bot",  text, time: nowHM() });

  async function handleSend(){
    if(!canSend) return;
    const q = input.trim(); setInput(""); pushUser(q); setLoading(true);
    try {
      if (USE_NETWORK) {
        const { data } = await api.post("/ask", { question: q, session_id: "web" });
        const answer = (data && (data.answer ?? data.result ?? data.message)) ?? "서버 응답이 비어있습니다.";
        pushBot(String(answer));
      } else {
        await new Promise(r => setTimeout(r, 300));
        pushBot(`(stub) '${q}' 에 대한 답변 예시입니다.
${classifyHint(q)}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "요청 중 오류가 발생했습니다.";
      pushBot(`요청 실패: ${msg}`);
    } finally {
      setLoading(false); inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); handleSend(); }
  }

  return (
    <section>
      <div className="chat-wrap">
        <div ref={listRef} className="chat" role="log" aria-live="polite" aria-relevant="additions">
          {msgs.map(m => (<MessageRow key={m.id} msg={m} />))}
          {loading && <Typing />}
        </div>

        <div className="input-row" role="form" aria-label="메시지 입력">
          <input ref={inputRef} className="field" placeholder="작품 제목, 줄거리, 통계/추천 등 질문을 입력하세요" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} />
          <button className="send" disabled={!canSend} onClick={handleSend} aria-label="보내기">보내기</button>
        </div>
      </div>

    </section>
  );
}

function classifyHint(q: string){
  const law = ["저작권","법","법률","계약","초상권","허가","라이선스","드라마화","영화화","각색","판권","ip","리메이크","원작 계약","섭외"];
  const status = ["조회수","구독자수","평점","랭킹","순위","선호도","통계"];
  const rec = ["추천","골라줘","픽","고르면","추천해","골라","뭘 볼까","추천 좀"];  
  const hit = (arr:string[]) => arr.some(k => q.includes(k));
  if(hit(law)) return "의도 추정: 법률 문의 (저작권/계약 등)";
  if(hit(status)) return "의도 추정: 현황/통계 요청";
  if(hit(rec)) return "의도 추정: 추천 요청 (2차 창작 목적 여부 확인)";
  return "의도 추정: 작품 정보 질의";
}

function MessageRow({ msg }: { msg: ChatMsg }){
  const isMe = msg.role === "user";
  return (
    <div className={"msg-row "+(isMe?"me":"bot") }>
      {/* bubble + timestamp를 하나의 stack으로 묶어 정렬 */}
      <div className="stack">
        <div className={"bubble "+(isMe?"me":"bot")}>{msg.text}</div>
        <div className="meta" aria-label="전송 시간">{msg.time}</div>
      </div>
    </div>
  );
}

function Typing(){
  return (
    <div className="msg-row bot" aria-label="답변 작성 중">
      <div className="stack">
        <div className="bubble bot"><Dots /></div>
        <div className="meta">입력 중...</div>
      </div>
    </div>
  );
}

function Dots(){
  const css = `@keyframes blink{0%{opacity:.2} 20%{opacity:1} 100%{opacity:.2}}`;
  return (
    <span>
      <style dangerouslySetInnerHTML={{__html:css}} />
      <span style={{animation:"blink 1s infinite"}}>. </span>
      <span style={{animation:"blink 1s infinite .2s"}}>. </span>
      <span style={{animation:"blink 1s infinite .4s"}}>. </span>
    </span>
  );
}

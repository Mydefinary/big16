import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import type { Intent } from './types'

/**
 * Webtoon Chatbot UI (React + TypeScript + CSS only)
 * - Persistent top navigation bar
 * - Routing: Home, 작품 질의하기(챗봇), 하이라이트 제작, 웹툰 상세분석, 광고 초안 생성, 광고 파트너쉽 문의, Sign up, Sign in, FAQ
 * - KakaoTalk-like chat bubbles for the chatbot page
 * - Networking optional with Axios; toggle via USE_NETWORK
 */

export default function App() {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <NavBar />
      <main className="container">
        <AppRoutes />
      </main>
      <Footer />
    </BrowserRouter>
  );
}

function GlobalStyles() {
  const css = `
    :root{
      --bg:#0b0c10; --panel:#111318; --muted:#2a2d39; --text:#e6e8ef; --sub:#a8adbd;
      --brand:#7c9cff; --brand-2:#9bffd6; --me:#7c9cff; --bot:#2f343f; --danger:#ff6767;
    }
    *{box-sizing:border-box}
    html,body,#root{height:100%}
    body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","맑은 고딕",sans-serif}
    a{color:inherit;text-decoration:none}

    .navbar{position:sticky;top:0;z-index:20;background:rgba(11,12,16,0.8);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--muted)}
    .nav-inner{max-width:1120px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:10px}
    .brand{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:999px;transition:transform .08s ease;}
    .brand:hover{transform:translateY(-1px)}
    .logo{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));display:inline-block}
    .brand-title{font-weight:700;letter-spacing:.2px}

    .nav-links{display:flex;gap:8px;flex-wrap:wrap;margin-left:8px}
    .nav-btn{padding:8px 12px;border:1px solid var(--muted);background:#0e1015;color:var(--text);border-radius:10px;font-size:13px;line-height:1;transition:all .15s ease}
    .nav-btn:hover{border-color:#3a3f52;background:#121521}
    .nav-btn.primary{border-color:transparent;background:var(--brand);color:#0b0c10;font-weight:700}

    .spacer{flex:1}
    .auth-links{display:flex;gap:8px}

    .container{max-width:1120px;margin:0 auto;padding:20px 16px}

    .footer{max-width:1120px;margin:40px auto 24px auto;padding:0 16px;color:var(--sub);font-size:12px}
    .footer a{color:var(--brand)}

    .hero{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:center}
    .card{background:var(--panel);border:1px solid var(--muted);border-radius:16px;padding:20px}
    .card h2{margin:0 0 8px}
    .cta-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
    @media (max-width: 900px){.hero{grid-template-columns:1fr}}

    /* Chat */
    .chat-wrap{display:flex;flex-direction:column;height:min(72vh,760px)}
    .chat{flex:1;overflow:auto;padding:16px;background:radial-gradient(1800px 400px at 20% -20%,rgba(124,156,255,0.12),transparent),linear-gradient(#0d1016,#0b0c10);border:1px solid var(--muted);border-radius:16px}

    .msg-row{display:flex;margin:10px 0;gap:8px;align-items:flex-end}
    .msg-row.me{justify-content:flex-end}
    .avatar{width:32px;height:32px;border-radius:10px;background:#1b1f2b;flex-shrink:0;border:1px solid var(--muted)}

    .stack{display:flex;flex-direction:column;max-width:48%} /* 중앙에서 양옆 한 글자 폭 여유 */
    .msg-row.me .stack{margin-left:auto}

    .bubble{width:fit-content;max-width:100%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.5;word-break:break-word;white-space:pre-wrap}
    .bubble.me{background:var(--me);color:#0b0c10;border-top-right-radius:4px}
    .bubble.bot{background:var(--bot);color:var(--text);border-top-left-radius:4px}

    .meta{margin-top:4px;font-size:11px;color:var(--sub)}
    .msg-row.me .meta{ text-align:right }

    .input-row{display:flex;gap:8px;margin-top:12px}
    .field{flex:1;background:#0e1117;border:1px solid var(--muted);border-radius:12px;padding:12px 12px;color:var(--text);font-size:14px}
    .field:focus{outline:none;border-color:#3b4160;box-shadow:0 0 0 3px rgba(124,156,255,0.15)}
    .send{padding:12px 14px;border-radius:12px;background:var(--brand);color:#0b0c10;border:none;font-weight:700;cursor:pointer}
    .send:disabled{opacity:.6;cursor:default}

    .pill{display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border-radius:999px;background:#141824;border:1px solid var(--muted);font-size:12px;color:var(--sub)}
    .kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid var(--muted);padding:2px 6px;border-radius:6px;background:#0e1117;color:var(--sub);font-size:11px}

    .nav-btn.active{outline:2px solid var(--brand);outline-offset:1px}
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function NavBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (pathname === to ? "nav-btn active" : "nav-btn");

  return (
    <header className="navbar" role="navigation" aria-label="Global">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="메인 페이지로 이동">
          <i className="logo" aria-hidden />
          <span className="brand-title">WEBTOON AI</span>
        </Link>

        <nav className="nav-links" aria-label="주요 기능">
          <Link className={isActive("/ask")} to="/ask">작품 질의하기</Link>
          <Link className={isActive("/highlight")} to="/highlight">하이라이트 제작</Link>
          <Link className={isActive("/analysis")} to="/analysis">웹툰 상세분석</Link>
          <Link className={isActive("/ad-draft")} to="/ad-draft">광고 초안 생성</Link>
          <Link className={isActive("/ad-partnership")} to="/ad-partnership">광고 파트너쉽 문의</Link>
          <Link className={isActive("/faq")} to="/faq">FAQ</Link>
        </nav>

        <div className="spacer" />

        <div className="auth-links" aria-label="인증">
          <Link className="nav-btn" to="/signup">sign up</Link>
          <Link className="nav-btn primary" to="/signin">sign in</Link>
        </div>
      </div>
    </header>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ask" element={<ChatbotPage />} />
      <Route path="/highlight" element={<Placeholder title="하이라이트 제작" />} />
      <Route path="/analysis" element={<Placeholder title="웹툰 상세분석" />} />
      <Route path="/ad-draft" element={<Placeholder title="광고 초안 생성" />} />
      <Route path="/ad-partnership" element={<Placeholder title="광고 파트너쉽 문의" />} />
      <Route path="/signup" element={<Placeholder title="Sign up" />} />
      <Route path="/signin" element={<Placeholder title="Sign in" />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function HomePage() {
  return (
    <section className="hero">
      <div className="card">
        <h2>웹툰 IP를 더 똑똑하게 활용하세요</h2>
        <p style={{color:"var(--sub)"}}>
          작품 정보 검색, 통계/현황 질의, 2차 창작 추천까지.
          <br />
          <span className="pill">FastAPI 백엔드 준비 완료</span>{" "}
          <span className="pill">React + TypeScript + CSS</span>
        </p>
        <div className="cta-row">
          <Link className="nav-btn primary" to="/ask">작품 질의하기 시작하기 →</Link>
          <Link className="nav-btn" to="/faq">FAQ 보기</Link>
        </div>
      </div>
      <div className="card" aria-label="단축키 안내">
        <h3 style={{marginTop:0}}>빠른 사용법</h3>
        <ul>
          <li>상단 네비게이션은 모든 페이지에서 고정 유지됩니다.</li>
          <li>Enter로 전송, Shift + Enter로 줄바꿈 <span className="kbd">Enter</span></li>
          <li>보내기 후 입력창 자동초점, 목록 자동 스크롤</li>
        </ul>
      </div>
    </section>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="card">
      <h2 style={{marginTop:0}}>{title}</h2>
      <p style={{color:"var(--sub)"}}>이 섹션은 다른 팀에서 개발 중입니다. 현재는 라우팅만 연결되어 있습니다.</p>
      <div className="cta-row">
        <Link className="nav-btn" to="/ask">작품 질의하기로 이동</Link>
      </div>
    </section>
  );
}

function FAQPage(){
  return (
    <section className="card">
      <h2 style={{marginTop:0}}>FAQ</h2>
      <details open>
        <summary>네트워킹은 구현되어 있나요?</summary>
        <p style={{color:"var(--sub)"}}>옵션입니다. UI는 완성되어 있고, Axios로 FastAPI의 <code>/ask</code>와 연결할 수 있습니다.</p>
      </details>
      <details>
        <summary>어떤 브라우저를 지원하나요?</summary>
        <p style={{color:"var(--sub)"}}>최신 Chromium/Firefox/Safari 최신 2버전 범위를 권장합니다.</p>
      </details>
    </section>
  );
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
  // const USE_NETWORK = false; // ← 서버 준비되면 true로
  const USE_NETWORK = true;
  
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
    <section className="card">
      <header style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div className="pill">작품 질의하기</div>
      </header>

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
      {/* 봇 메시지에는 왼쪽 아바타 표시 */}
      {!isMe && <div className="avatar" aria-hidden />}

      {/* bubble + timestamp를 하나의 stack으로 묶어 정렬 */}
      <div className="stack">
        <div className={"bubble "+(isMe?"me":"bot")}>{msg.text}</div>
        <div className="meta" aria-label="전송 시간">{msg.time}</div>
      </div>

      {/* 사용자 메시지는 오른쪽 끝에 밀착시키기 위해 아바타 placeholder 제거 */}
    </div>
  );
}

function Typing(){
  return (
    <div className="msg-row bot" aria-label="답변 작성 중">
      <div className="avatar" aria-hidden />
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

function Footer(){
  return (
    <footer className="footer">
      <div>
        © {new Date().getFullYear()} WEBTOON AI — Built with React + TypeScript + CSS. <span style={{marginLeft:8}}>백엔드: FastAPI <code>/ask</code> 엔드포인트 연동(axios) 옵션 제공.</span>
      </div>
    </footer>
  );
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import './App.css'

// --------------------------------------------------
// ChatGPT처럼 보이는 UI로 전면 개편한 App2.tsx
// - 기존 me/bot 채팅 로직 유지
// - 상단 헤더 + 좌측 사이드바(대화 목록) + 중앙 채팅 영역
// - Enter 전송, Shift + Enter 줄바꿈
// - 메시지 복사, 로딩 중 중단(Stop)
// - 로컬스토리지에 최근 대화 저장
// --------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <GlobalStyles />
      <Routes>
        <Route path="/*" element={<ChatLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

// -------------------- 전역 스타일 --------------------
function GlobalStyles() {
  const css = `
    :root{
      --bg:#f6f7f9; --panel:#ffffff; --border:#e5e7eb; --text:#0b0c10; --muted:#6b7280;
      --brand:#10b981; --brand-ink:#053b2f; --danger:#ef4444;
      --radius:14px;
    }
    *{box-sizing:border-box}
    html,body,#root{height:100%}
    body{margin:0; background:var(--bg); color:var(--text);
      font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,
      "Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","맑은 고딕",sans-serif;}

    .layout{display:grid; grid-template-columns:260px 1fr; height:100vh}

    /* 사이드바 */
    .sidebar{border-right:1px solid var(--border); background:#fbfbfc; display:flex; flex-direction:column}
    .sidebar .top{padding:16px; border-bottom:1px solid var(--border); display:flex; gap:8px}
    .sidebar .new{flex:1; padding:10px 12px; border-radius:10px; border:1px solid var(--border); background:var(--panel); cursor:pointer}
    .sidebar .list{flex:1; overflow:auto; padding:8px}
    .sidebar .item{position:relative; padding:10px 12px; border-radius:10px; cursor:pointer; border:1px solid transparent}
    .sidebar .item:hover{background:#f2f3f5}
    .sidebar .item.active{background:#ecfdf5; border-color:#bbf7d0}
    .sidebar .row{display:flex; align-items:center; gap:8px}
    .sidebar .title{flex:1; font-weight:600; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
    .sidebar .kebab{opacity:0; transition:opacity .15s ease; border:1px solid var(--border); background:#fff; padding:4px 6px; border-radius:8px; font-size:14px; line-height:1; cursor:pointer}
    .sidebar .item:hover .kebab{opacity:1}
    .sidebar .menu{position:absolute; right:8px; top:38px; background:#fff; border:1px solid var(--border); border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.08); padding:6px; z-index:20; min-width:140px}
    .sidebar .menu button{width:100%; text-align:left; padding:8px 10px; border:none; background:#fff; border-radius:8px; cursor:pointer}
    .sidebar .menu button:hover{background:#f3f4f6}
    .sidebar .title-input{width:100%; border:none; background:transparent; font-weight:600; font-size:14px;}
    .sidebar .title-input:focus{outline:none; background:#fff8; border-radius:6px;}

    // /* 상단 네비게이션바 */
    // .navbar{position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid var(--border); background:var(--panel)}
    // .brand{display:flex; align-items:center; gap:8px; font-weight:800}
    // .brand .logo{width:24px; height:24px; border-radius:6px; background:var(--brand); display:inline-flex; align-items:center; justify-content:center; color:var(--brand-ink); font-weight:900}
    // .nav-center{flex:1; display:flex; justify-content:center}
    // .title-edit{min-width:120px; max-width:560px; width:60%; text-align:center; background:transparent; border:1px solid transparent; padding:6px 10px; border-radius:10px; font-weight:700}
    // .title-edit:hover{background:#f8fafb; border-color:var(--border)}
    // .title-edit:focus{outline:none; background:#fff; border-color:#cbd5e1}
    // .nav-right{display:flex; align-items:center; gap:8px}
    // .select, .btn{border:1px solid var(--border); background:#fff; padding:8px 10px; border-radius:10px; cursor:pointer; font-size:14px}
    // .btn.danger{border-color:#fecaca; background:#fff}

    /* 메인(채팅) */
    .main{display:flex; flex-direction:column; height:100vh}
    .chat-wrap{flex:1; display:flex; justify-content:center; overflow:auto}
    .chat{width:min(900px, 100%); padding:24px 16px 40px;}

    .msg-row{display:flex; gap:12px; margin:16px 0}
    .avatar{width:28px; height:28px; border-radius:999px; display:flex; align-items:center; justify-content:center; font-weight:700}
    .avatar.bot{background:#111827; color:#fff}
    .avatar.me{background:#10b981; color:#052e25}

    .bubble{flex:1; background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; white-space:pre-wrap; line-height:1.6}
    .row-meta{margin-top:6px; font-size:12px; color:var(--muted)}

    .tools{display:flex; gap:8px; margin-top:8px}
    .tool-btn{font-size:12px; padding:6px 8px; border-radius:8px; border:1px solid var(--border); background:#fff; cursor:pointer}

    /* 입력부: sticky 하단 */
    .composer{position:sticky; bottom:0; background:linear-gradient(180deg, rgba(246,247,249,0), rgba(246,247,249,1) 40%);} 
    .composer .inner{max-width:900px; margin:0 auto; padding:12px 16px 20px;}
    .input-row{display:flex; gap:10px; align-items:flex-end}
    .field{flex:1; min-height:44px; max-height:200px; resize:vertical; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:#fff; font-size:14px}
    .send{padding:12px 14px; border-radius:12px; border:none; background:var(--brand); color:#052e25; font-weight:700; cursor:pointer}
    .send:disabled{opacity:.6; cursor:default}
    .kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; padding:2px 6px; border-radius:6px; border:1px solid var(--border); background:#fff; color:#6b7280; font-size:12px}

    .typing{display:inline-flex; gap:6px}
    .dot{width:6px; height:6px; background:#9ca3af; border-radius:999px; animation:blink 1.2s infinite}
    .dot:nth-child(2){animation-delay:.2s}
    .dot:nth-child(3){animation-delay:.4s}
    @keyframes blink{0%{opacity:.2} 20%{opacity:1} 100%{opacity:.2}}

    @media (max-width: 920px){
      .layout{grid-template-columns:1fr}
      .sidebar{display:none}
    }
      /* Header 추가 */

    /* Header Logout Button Styles - App.css에 추가해주세요 */

    .mypage-btn {
      background: #8b5cf6;
      color: white !important;
      border: 1px solid #8b5cf6;
    }

    .mypage-btn:hover {
      background: #7c3aed;
      border-color: #7c3aed;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }

    .logout-btn {
      background: #ef4444;
      color: white !important;
      border: 1px solid #ef4444;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .logout-btn:hover:not(:disabled) {
      background: #dc2626;
      border-color: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    .logout-btn:disabled {
      background: #d1d5db;
      color: #9ca3af;
      border-color: #d1d5db;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* 반응형 디자인에서 로그아웃 버튼 스타일 조정 */
    @media (max-width: 768px) {
      .logout-btn {
        padding: 6px 12px;
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .logout-btn {
        padding: 6px 10px;
        font-size: 12px;
      }
    }
    /* Header Styles - 이 코드를 App.css 상단에 추가해주세요 */

    /* Header */
    .header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 64px;
    }

    /* 로고 */
    .header-logo .logo-link {
      font-size: 20px;
      font-weight: 700;
      color: #22c55e;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .header-logo .logo-link:hover {
      color: #16a34a;
    }

    /* 네비게이션 */
    .header-nav {
      flex: 1;
      margin: 0 40px;
    }

    .nav-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 32px;
      justify-content: center;
    }

    .nav-item {
      position: relative;
    }

    .nav-link {
      color: #374151;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 8px 0;
      transition: color 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      color: #22c55e;
    }

    .nav-link.active {
      color: #22c55e;
      font-weight: 600;
    }

    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      height: 2px;
      background: #22c55e;
      border-radius: 1px;
    }

    /* 우측 액션 버튼들 */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-btn {
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .signup-btn {
      color: #22c55e;
      border: 1px solid #22c55e;
      background: white;
    }

    .signup-btn:hover {
      background: #22c55e;
      color: white;
    }

    .signin-btn {
      background: #22c55e;
      color: white;
      border: 1px solid #22c55e;
    }

    .signin-btn:hover {
      background: #16a34a;
      border-color: #16a34a;
    }

    .faq-btn {
      color: #6b7280;
      background: transparent;
      border: none;
    }

    .faq-btn:hover {
      color: #374151;
    }

    .dashboard-btn {
      background: #22c55e;
      color: white;
      border: 1px solid #22c55e;
    }

    .dashboard-btn:hover {
      background: #16a34a;
      border-color: #16a34a;
    }

    /* 반응형 디자인 */
    @media (max-width: 768px) {
      .header-container {
        padding: 0 16px;
        height: 56px;
      }
      
      .header-nav {
        display: none; /* 모바일에서는 네비게이션 숨김 */
      }
      
      .header-actions {
        gap: 12px;
      }
      
      .header-btn {
        padding: 6px 12px;
        font-size: 13px;
      }
      
      .header-logo .logo-link {
        font-size: 18px;
      }
    }

    @media (max-width: 480px) {
      .header-container {
        padding: 0 12px;
      }
      
      .header-actions {
        gap: 8px;
      }
      
      .header-btn {
        padding: 6px 10px;
        font-size: 12px;
      }
    }

    /* Main Content Styles - App.css에 추가해주세요 */

    /* 메인 콘텐츠 영역 */
    .main-content {
      min-height: calc(100vh - 64px); /* Header 높이만큼 빼기 */
    }

    /* 페이지 placeholder 스타일 */
    .page-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      font-size: 24px;
      color: #6b7280;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      text-align: center;
      padding: 40px 20px;
    }

    @media (max-width: 768px) {
      .main-content {
        min-height: calc(100vh - 56px);
      }
      
      .page-placeholder {
        min-height: calc(100vh - 56px);
        font-size: 18px;
        padding: 20px;
      }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// -------------------- 타입 & 유틸 --------------------
interface ChatMsg { id: string; role: "user" | "bot"; text: string; time: string; }
interface ThreadSummary{ id: string; title: string; updatedAt: number }
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const newId = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));

// -------------------- 메인 레이아웃 --------------------
function ChatLayout(){
  const [threads, setThreads] = useState<ThreadSummary[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string>(() => threads[0]?.id ?? createNewThread(setThreads));

  function handleDeleteThread(id:string){
    deleteThread(id, setThreads);
    if(id === activeId){
      const next = loadThreads()[0]?.id ?? createNewThread(setThreads);
      setActiveId(next);
    }
  }
  
  return (
    <main className="main-content">
        <Header></Header>
        <div className="layout">
            <Sidebar
              threads={threads}
              activeId={activeId}
              onNew={() => setActiveId(createNewThread(setThreads))}
              onSelect={(id) => setActiveId(id)}
              onRename={(id, title) => renameThread(id, title, setThreads)}
              onDelete={handleDeleteThread}
            />
            <div className="main">
                <ChatArea
                threadId={activeId}
                onTitle={(title) => renameThread(activeId, title, setThreads)}
                />
            </div>
        </div>
    </main>
  );
}

// -------------------- 사이드바 --------------------
function Sidebar({ threads, activeId, onNew, onSelect, onRename, onDelete }:{ threads:ThreadSummary[]; activeId:string; onNew:()=>void; onSelect:(id:string)=>void; onRename:(id:string,title:string)=>void; onDelete:(id:string)=>void }){
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState<string>("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  function startEdit(id:string, current:string){ setEditingId(id); setTempTitle(current); setMenuOpenId(null); }
  function commitEdit(){ if(editingId){ onRename(editingId, tempTitle.trim() || "새 대화"); setEditingId(null); } }

  return (
    <aside className="sidebar" aria-label="대화 목록">
      <div className="top">
        <button className="new" onClick={onNew}>+ 새 대화</button>
      </div>
      <div className="list">
        {threads.length===0 && <div style={{padding:12, color:'#6b7280'}}>대화를 시작해 보세요.</div>}
        {threads.map(t => (
          <div key={t.id} className={`item ${t.id===activeId? 'active':''}`} onClick={() => onSelect(t.id)} onMouseLeave={()=> setMenuOpenId(prev => prev===t.id? null : prev)}>
            {editingId === t.id ? (
              <input className="title-input" value={tempTitle} autoFocus onChange={(e)=>setTempTitle(e.target.value)} onBlur={commitEdit} onKeyDown={(e)=>{if(e.key==='Enter') commitEdit();}} />
            ):(
              <div className="row">
                <div className="title">{t.title}</div>
                <button className="kebab" aria-label="메뉴" onClick={(e)=>{e.stopPropagation(); setMenuOpenId(id=> id===t.id? null : t.id);}}>⋯</button>
              </div>
            )}
            <div style={{fontSize:12, color:'#6b7280', marginTop:4}}>{new Date(t.updatedAt).toLocaleString()}</div>

            {menuOpenId===t.id && (
              <div className="menu" onClick={(e)=>e.stopPropagation()}>
                <button onClick={()=> startEdit(t.id, t.title)}>이름 바꾸기</button>
                <button onClick={()=> onDelete(t.id)}>삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

// -------------------- 채팅 영역 --------------------
function ChatArea({ threadId, onTitle, onDelete }:{ threadId:string; onTitle:(t:string)=>void; onDelete:()=>void }){
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => loadMsgs(threadId));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { setMsgs(loadMsgs(threadId)); }, [threadId]);
  useEffect(() => { saveMsgs(threadId, msgs); if(msgs.length===1 && msgs[0].role==='bot'){ onTitle("새 대화"); } else { const t = summarizeTitle(msgs); if(t) onTitle(t); }}, [msgs, threadId]);
  useEffect(() => { const el = listRef.current; if(!el) return; el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs.length, loading]);

  const api = useMemo(() => axios.create({ baseURL: "/api", timeout: 20000, headers: { "Content-Type": "application/json" } }), []);
  const USE_NETWORK = true; // 서버 준비되면 true

  const canSend = input.trim().length > 0 && !loading;
  const push = (m: ChatMsg) => setMsgs(prev => [...prev, m]);
  const pushUser = (text: string) => push({ id: newId(), role: "user", text, time: nowHM() });
  const pushBot  = (text: string) => push({ id: newId(), role: "bot",  text, time: nowHM() });

  async function handleSend(){
    if(!canSend) return;
    const q = input.trim(); setInput(""); pushUser(q); setLoading(true);
    try {
      if (USE_NETWORK) {
        const { data } = await api.post("/ask", { question: q, session_id: threadId });
        const answer = (data && (data.answer ?? data.result ?? data.message)) ?? "서버 응답이 비어있습니다.";
        pushBot(String(answer));
      } else {
        await new Promise(r => setTimeout(r, 300));
        pushBot(fakeAnswer(q));
      }
    } catch (err:any) {
      const msg = err?.response?.data?.detail || err?.message || "요청 중 오류가 발생했습니다.";
      pushBot(`요청 실패: ${msg}`);
    } finally {
      setLoading(false); textareaRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>){
    if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); handleSend(); }
  }

  function handleCopy(text:string){
    navigator.clipboard?.writeText(text);
  }

  function handleStop(){ setLoading(false); }

  return (
    <div style={{display:'contents'}}>
      <div className="chat-wrap">
        <div ref={listRef} className="chat" role="log" aria-live="polite" aria-relevant="additions">
          {msgs.map(m => (
            <div key={m.id} className="msg-row">
              <div className={`avatar ${m.role==='bot'?'bot':'me'}`}>{m.role==='bot'? 'B': 'M'}</div>
              <div style={{flex:1}}>
                <div className="bubble">{m.text}</div>
                <div className="tools">
                  <button className="tool-btn" onClick={() => handleCopy(m.text)}>복사</button>
                </div>
                <div className="row-meta">{m.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-row">
              <div className="avatar bot">B</div>
              <div style={{flex:1}}>
                <div className="bubble"><span className="typing"><span className="dot"/><span className="dot"/><span className="dot"/></span></div>
                <div className="row-meta">입력 중...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 입력부 */}
      <div className="composer" role="form" aria-label="메시지 입력">
        <div className="inner">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8, color:'#6b7280', fontSize:12}}>
            <div><span className="kbd">Enter</span> 전송 · <span className="kbd">Shift</span>+<span className="kbd">Enter</span> 줄바꿈</div>
            {loading && <button className="tool-btn" onClick={handleStop}>중단</button>}
          </div>
          <div className="input-row">
            <textarea ref={textareaRef} className="field" placeholder="메시지를 입력하세요" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown} />
            <button className="send" disabled={!canSend} onClick={handleSend} aria-label="보내기">보내기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- 로컬 저장 도구 --------------------
function storeKey(){ return "chatgpt-ui-threads-v1"; }
function loadThreads(): ThreadSummary[]{
  const raw = localStorage.getItem(storeKey());
  if(!raw) return [];
  try { const parsed = JSON.parse(raw) as { [id:string]: { title:string; updatedAt:number; msgs:ChatMsg[] } }; return Object.keys(parsed).map(id => ({ id, title: parsed[id].title, updatedAt: parsed[id].updatedAt })).sort((a,b)=>b.updatedAt-a.updatedAt); } catch { return []; }
}
function loadMsgs(id:string): ChatMsg[]{
  const raw = localStorage.getItem(storeKey());
  if(!raw) return [ { id:newId(), role:'bot', text:'안녕하세요! 무엇을 도와드릴까요?', time:nowHM() } ];
  try { const parsed = JSON.parse(raw) as { [id:string]: { title:string; updatedAt:number; msgs:ChatMsg[] } }; return parsed[id]?.msgs ?? [ { id:newId(), role:'bot', text:'안녕하세요! 무엇을 도와드릴까요?', time:nowHM() } ]; } catch { return [ { id:newId(), role:'bot', text:'안녕하세요! 무엇을 도와드릴까요?', time:nowHM() } ]; }
}
function saveMsgs(id:string, msgs:ChatMsg[]){
  const raw = localStorage.getItem(storeKey());
  const db = raw? JSON.parse(raw) : {};
  const title = summarizeTitle(msgs) || db[id]?.title || '새 대화';
  db[id] = { title, updatedAt: Date.now(), msgs };
  localStorage.setItem(storeKey(), JSON.stringify(db));
}
function renameThread(id:string, title:string, setThreads:(updater:ThreadSummary[])=>void){
  const raw = localStorage.getItem(storeKey());
  if(!raw) return;
  const db = JSON.parse(raw);
  if(db[id]){ db[id].title = title; localStorage.setItem(storeKey(), JSON.stringify(db)); }
  setThreads(loadThreads());
}
function deleteThread(id:string, setThreads:(updater:ThreadSummary[])=>void){
  const raw = localStorage.getItem(storeKey());
  if(!raw) return;
  const db = JSON.parse(raw);
  delete db[id];
  localStorage.setItem(storeKey(), JSON.stringify(db));
  setThreads(loadThreads());
}
function createNewThread(setThreads:(updater:ThreadSummary[])=>void){
  const id = newId();
  const dbRaw = localStorage.getItem(storeKey());
  const db = dbRaw? JSON.parse(dbRaw) : {};
  db[id] = { title: '새 대화', updatedAt: Date.now(), msgs: [ { id:newId(), role:'bot', text:'안녕하세요! 무엇을 도와드릴까요?', time:nowHM() } ] };
  localStorage.setItem(storeKey(), JSON.stringify(db));
  setThreads(loadThreads());
  return id;
}
function summarizeTitle(msgs:ChatMsg[]){
  const firstUser = msgs.find(m=>m.role==='user')?.text?.trim();
  if(!firstUser) return '';
  return firstUser.length>18? firstUser.slice(0,18)+"…" : firstUser;
}

// -------------------- 스텁 응답 --------------------
function fakeAnswer(q:string){
  return `질문: ${q}\n\n여기는 스텁 응답입니다. 서버 연동 후에는 실제 답변이 표시됩니다.`;
}

// --------------------- 헤더 -----------------------
const Header = () => {
  const [loading, setLoading] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* 로고/서비스명 */}
        <div className="header-logo">
          <Link to="/" className="logo-link">
            ToonConnect
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="header-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link
                to="/question"
                className={`nav-link`}
              >
                작품 질의하기
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/characters"
                className={`nav-link`}
              >
                하이라이트 제작
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/gallery"
                className={`nav-link`}
              >
                웹툰 상세 분석
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/community"
                className={`nav-link`}
              >
                광고 초안 생성
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/board"
                className={`nav-link`}
              >
                광고 파트너십 문의
              </Link>
            </li>
          </ul>
        </nav>

        {/* 우측 버튼들 */}
        <div className="header-actions">
            <>
              <Link to="/register" className="header-btn signup-btn">
                Sign Up
              </Link>
              <Link to="/login" className="header-btn signin-btn">
                Sign In
              </Link>
              <Link to="/faq" className="header-btn faq-btn">
                FAQ
              </Link>
            </>
        </div>
      </div>
    </header>
  );
};
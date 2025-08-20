import React, { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
      <Routes>
        <Route path="/*" element={<ChatLayout />} />
      </Routes>
    </BrowserRouter>
  );
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
  // ----------------------- 인증 -----------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth()
        setIsAuthenticated(true)
      } catch (error) {
        setIsAuthenticated(false)
        // 인증 실패시 로그인 페이지로 리다이렉트
        window.location.href = '/auths/login'
      } finally {
        setIsAuthLoading(false)
      }
    }
    verifyAuth()
  }, [])

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>인증 확인 중...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다...</div>
      </div>
    )
  }

  function handleDeleteThread(id:string){
    deleteThread(id, setThreads);
    if(id === activeId){
      const next = loadThreads()[0]?.id ?? createNewThread(setThreads);
      setActiveId(next);
    }
  }
  
  return (
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
function ChatArea({ threadId, onTitle }:{ threadId:string; onTitle:(t:string)=>void }){
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => loadMsgs(threadId));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { setMsgs(loadMsgs(threadId)); }, [threadId]);
  useEffect(() => { saveMsgs(threadId, msgs); if(msgs.length===1 && msgs[0].role==='bot'){ onTitle("새 대화"); } else { const t = summarizeTitle(msgs); if(t) onTitle(t); }}, [msgs, threadId]);
  useEffect(() => { const el = listRef.current; if(!el) return; el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs.length, loading]);

  const api = useMemo(() => axios.create({ baseURL: "/api", timeout: 20000, headers: { "Content-Type": "application/json" } }), []);

  const canSend = input.trim().length > 0 && !loading;
  const push = (m: ChatMsg) => setMsgs(prev => [...prev, m]);
  const pushUser = (text: string) => push({ id: newId(), role: "user", text, time: nowHM() });
  const pushBot  = (text: string) => push({ id: newId(), role: "bot",  text, time: nowHM() });

  async function handleSend(){
    if(!canSend) return;
    const q = input.trim(); setInput(""); pushUser(q); setLoading(true);
    try {
      const { data } = await api.post("/question-api/ask", { question: q, session_id: threadId });
      const answer = (data && (data.answer ?? data.result ?? data.message)) ?? "서버 응답이 비어있습니다.";
      pushBot(String(answer));

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

// JWT 인증 확인 함수
export async function checkAuth(): Promise<void> {
  try {
    const response = await axios.get('/auths/me', {
      withCredentials: true // 쿠키 포함
    });
    
    if (response.status !== 200) {
      throw new Error('Authentication failed');
    }
  } catch (error: any) {
    throw new Error('Authentication failed: ' + (error.response?.statusText || error.message));
  }
}

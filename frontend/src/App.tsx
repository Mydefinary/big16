import { ask, checkAuth } from './api'
import type { Intent } from './types'
import { useState, useEffect } from 'react'
import './App.css'

interface ChatItem { role: 'user' | 'assistant'; text: string; intent?: Intent; chunks?: string[] }

const intentBadge: Record<Intent, string> = {
  '법률': '📚 법률 응답',
  '현황': '📊 현황 응답',
  '추천': '🎯 추천 응답',
  '정보': '📘 웹툰 정보 응답',
}

export default function App() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<ChatItem[]>([])
  const [sessionId] = useState('default')
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
        window.location.href = '/'
      } finally {
        setIsAuthLoading(false)
      }
    }
    verifyAuth()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setHistory(prev => [{ role: 'user', text: q }, ...prev])
    setInput('')
    setLoading(true)
    try {
      const res = await ask(q, sessionId)
      setHistory(prev => [
        { role: 'assistant', text: res.answer, intent: res.intent, chunks: res.chunks },
        ...prev,
      ])
    } catch (err: any) {
      setHistory(prev => [{ role: 'assistant', text: '오류가 발생했습니다: ' + err?.message }, ...prev])
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="page">
      {/* Hero */}
      <main className="hero">
        <h1 className="hero__title">웹툰 통합 챗봇 (법률 + 정보 + 현황 + 추천)</h1>
        <p className="hero__subtitle">2차 창작 + 데이터 통계 + 웹툰 정보 제공 챗봇</p>

        <form className="hero__form" onSubmit={onSubmit}>
          <div className="inputPill">
            <input
              className="inputPill__input"
              placeholder="질문을 입력하세요 (예: 30대 여성이 좋아할 드라마 웹툰 추천해줘)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <button disabled={loading} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #333' }}>
            {loading ? '질문 중...' : '질문하기'}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {history.map((item, idx) => (
            <div key={idx} style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
              {item.role === 'user' ? (
                <p><b>💬 질문:</b> {item.text}</p>
              ) : (
                <div>
                  {item.intent && <div style={{ fontSize: 13, color: '#555', marginBottom: 6 }}><b>{intentBadge[item.intent]}</b></div>}
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.text}</div>
                  {item.chunks && item.chunks.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary>참고 문서 보기 (법률)</summary>
                      <ul>
                        {item.chunks.map((c, i) => (
                          <li key={i} style={{ fontSize: 13, color: '#444', whiteSpace: 'pre-wrap' }}>{c.slice(0, 300)}{c.length > 300 ? '…' : ''}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__right">KT AIVLE SCHOOL 6반 16조</div>
      </footer>
    </div>
  )
}

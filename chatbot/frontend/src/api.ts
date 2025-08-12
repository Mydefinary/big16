import type { AskResponse } from './types'

export async function ask(question: string, sessionId = 'default'): Promise<AskResponse> {
  const r = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId }),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}
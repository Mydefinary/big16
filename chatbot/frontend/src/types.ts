export type Intent = '법률' | '정보' | '현황' | '추천'

export interface AskResponse {
  intent: Intent
  answer: string
  chunks: string[]
}
import axios from 'axios';
import type { AskResponse } from './types';

export async function ask(question: string, sessionId = 'default'): Promise<AskResponse> {
  try {
    const response = await axios.post<AskResponse>('/api/chatbot/ask', {
      question,
      session_id: sessionId,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      // 서버가 응답을 보냈지만, 상태 코드가 2xx 범위가 아님
      throw new Error(error.response.data || error.response.statusText);
    } else if (error.request) {
      // 요청이 전송되었으나 응답이 없음
      throw new Error('No response received from server.');
    } else {
      // 요청 설정 중 발생한 에러
      throw new Error(error.message);
    }
  }
}

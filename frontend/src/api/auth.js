// src/api/auth.js
import { noAuthApi } from "./api";

export const login = async (email, password) => {
  try {
    const response = await noAuthApi.post("/login", { email, password });
    return response.data.token;
  } catch (error) {
    // 에러 로그, 알림 처리 등
    throw error; // 호출부로 에러 전달
  }
};

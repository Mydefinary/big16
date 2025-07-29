// src/api/api.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// 요청 인터셉터: 토큰 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 인증 필요 없는 API (헤더 제외)
const noAuthApi = axios.create({
  baseURL,
  withCredentials: false, // 쿠키기반인증(쿠키 옮길래?)
});

export { api, noAuthApi };

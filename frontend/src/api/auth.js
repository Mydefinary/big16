// src/api/auth.js
import { noAuthApi } from "./api";

export const login = async (email, password) => {
  const response = await noAuthApi.post("/login", { email, password });
  return response.data.token;
};

// client/src/api/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  withCredentials: true,
});

// Attach JWT from localStorage on every request (Axios v1 types)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    // Axios v1 headers is AxiosHeaders; prefer set()
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      // Fallback for unusual typings
      (config.headers as any) = config.headers || {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Optional: clear token on 401s
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default api;

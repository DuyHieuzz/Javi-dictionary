import axios from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { callRefreshToken } from "./authApi";

// Mutex nhỏ để tránh refresh token bị gọi song song 2 lần
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // gửi cookie refresh_token tự động
});

// Request Interceptor: gắn access token vào header
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response Interceptor: tự refresh token nếu gặp 401
axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Nếu lỗi không phải 401 → throw luôn
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Ngăn vòng lặp vô hạn
    if (isRefreshing) {
      // Nếu refresh đang chạy, chờ queue
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          },
          reject: (err) => reject(err),
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await callRefreshToken();
      const newToken = res.data.token;
      const { setAuth } = useAuthStore.getState();
      setAuth(res.data); // cập nhật Zustand (token + user)
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;

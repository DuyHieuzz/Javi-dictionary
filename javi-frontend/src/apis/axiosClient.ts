// src/apis/axiosClient.ts
import axios from "axios";
import { message } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGlobalErrorStore } from "@/stores/useGlobalErrorStore";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000, // tránh request treo
});

// =================== REQUEST INTERCEPTOR ===================
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =================== RESPONSE INTERCEPTOR ===================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // tạm thời comment để code tiếp
    // PHÁT HIỆN SERVER DOWN / MẤT KẾT NỐI
    // if (!error.response || (error.response.status >= 500 && error.response.status <= 599)) {
    //   const { setServerDown } = useGlobalErrorStore.getState();
    //   setServerDown(true); // hiển thị <ServerError /> toàn cục
    //   message.error("Máy chủ đang gặp sự cố, vui lòng thử lại sau!");
    //   return Promise.reject(error);
    // }

    const status = error.response?.status;

    // REFRESH TOKEN LOGIC (chuẩn theo ILoginResponse)
    if (status === 401) {
      try {
        const { callRefreshToken } = await import("@/apis/authApi");
        const { setAuth, clearAuth } = useAuthStore.getState();

        // BE trả trực tiếp ILoginResponse
        const res = await callRefreshToken();

        if (res?.data?.token && res?.data?.user) {
          // Cập nhật lại auth store bằng ILoginResponse thật
          setAuth(res.data);

          // Gọi lại request cũ với token mới
          const originalRequest = error.config;
          originalRequest.headers["Authorization"] = `Bearer ${res.data.token}`;
          return axiosClient(originalRequest);
        }
      } catch {
        // Refresh thất bại → xóa auth
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      }
    }

    // Các lỗi còn lại để page tự handle (400, 403, 404,...)
    return Promise.reject(error);
  }
);

export default axiosClient;

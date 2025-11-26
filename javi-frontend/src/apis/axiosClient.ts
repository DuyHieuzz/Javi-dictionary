import axios from "axios";
import { message } from "antd";
import { useAuthStore } from "@/stores/useAuthStore";
import { callRefreshToken } from "./authApi";
import { useGlobalErrorStore } from "@/stores/useGlobalErrorStore";
import { callLogout } from "@/apis/authApi";
// import { useNavigate } from "react-router-dom";

// const navigate = useNavigate();
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
      const originalRequest = error.config;

      // Nếu request chính là /auth/refresh hoặc đã retry rồi thì không thử lại nữa
      if (originalRequest._retry || originalRequest.url?.includes("/auth/refresh")) {
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Gọi API refresh token — BE trả trực tiếp ILoginResponse
        const res = await callRefreshToken();

        if (res?.data?.token && res?.data?.user) {
          // Lấy lại hàm setAuth trực tiếp từ store mỗi lần gọi
          const { setAuth } = useAuthStore.getState();

          // Cập nhật lại auth store bằng ILoginResponse thật
          setAuth(res.data);

          // Gọi lại request cũ với token mới
          originalRequest.headers["Authorization"] = `Bearer ${res.data.token}`;
          return axiosClient(originalRequest);
        }
      } catch (e) {
        // Refresh thất bại → xóa auth
        const { clearAuth } = useAuthStore.getState();
        message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        try {
          // đã thử refresh và thất bại
          await callLogout(); // gọi server để xóa cookie httpOnly (axiosNoAuth)
        } catch (logoutErr) {
          // logout request có thể lỗi (network) -> log nhưng vẫn tiếp tục
          console.error("Server logout failed:", logoutErr);
        } finally {
          clearAuth(); // xóa token / user khỏi FE
          window.location.href = "/"; // điều hướng về trang chủ
        }
      }
    }
    // Các lỗi còn lại để page tự handle (400, 403, 404,...)
    return Promise.reject(error);
  }
);

export default axiosClient;

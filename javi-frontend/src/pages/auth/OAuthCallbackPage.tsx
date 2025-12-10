import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { callRefreshToken } from "@/apis/authApi";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "react-toastify";

export default function OAuthCallbackPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    useEffect(() => {
        const init = async () => {
            try {
                // Gọi API refresh/exchange nếu server đã set cookie refresh_token
                const res = await callRefreshToken();
                setAuth(res.data);
                toast.success("Đăng nhập Google thành công!");

                // Lấy redirect lưu ở localStorage
                const redirect = localStorage.getItem("javi_oauth_redirect");
                localStorage.removeItem("javi_oauth_redirect");

                // Bảo vệ open-redirect: chỉ cho redirect internal path bắt đầu bằng '/'
                const isSafe =
                    typeof redirect === "string" && redirect.startsWith("/");

                if (!isSafe || redirect.startsWith("/login")) {
                    navigate("/search", { replace: true });
                } else {
                    navigate(redirect, { replace: true });
                }
            } catch (e) {
                toast.error("Không thể đăng nhập Google. Vui lòng thử lại!");
                navigate("/login", { replace: true });
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <p>Đang xử lý đăng nhập Google...</p>
        </div>
    );
}

// function getParam(name: string): string | null {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
// }

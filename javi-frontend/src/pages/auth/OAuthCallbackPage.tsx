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
                // const refreshToken = getParam("refreshToken");
                const res = await callRefreshToken(); // cookie refresh_token đã có
                console.log(res);
                setAuth(res.data);
                toast.success("Đăng nhập Google thành công!");
                navigate("/search");
            } catch (e) {
                toast.error("Không thể đăng nhập Google. Vui lòng thử lại!");
                navigate("/login");
            }
        };
        init();
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

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { callVerifyEmail } from "../../apis/authApi";
import { TbMailCheck, TbMailX } from "react-icons/tb";

export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");
            if (!token) {
                setStatus("error");
                toast.error("Liên kết xác minh không hợp lệ hoặc đã hết hạn.", {
                    position: "top-right",
                });
                return;
            }

            try {
                // Gọi API verify qua authApi
                const res = await callVerifyEmail(token);

                const message =
                    res?.data?.message ||
                    "Xác minh email thành công! Bạn có thể đăng nhập ngay.";

                toast.success(message, { position: "top-right" });
                setStatus("success");

                // Điều hướng sau 2 giây
                setTimeout(() => navigate("/search"), 2000);
            } catch (err: any) {
                console.error("Email verification failed:", err);

                const message =
                    err?.response?.data?.message ||
                    "Xác minh thất bại hoặc liên kết đã hết hạn.";

                toast.error(message, { position: "top-right" });
                setStatus("error");
            }
        };

        verifyEmail();
    }, [navigate, searchParams]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="bg-white w-[450px] rounded-2xl shadow-md flex flex-col items-center px-6 py-10">
                {status === "loading" && (
                    <>
                        <TbMailCheck className="text-blue-600 text-6xl mb-4 animate-pulse" />
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Đang xác minh email...
                        </h2>
                        <p className="text-gray-500 text-center">
                            Vui lòng chờ trong giây lát, chúng tôi đang kiểm tra
                            liên kết xác minh của bạn.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <TbMailCheck className="text-green-600 text-6xl mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Xác minh thành công!
                        </h2>
                        <p className="text-gray-500 text-center">
                            Cảm ơn bạn đã xác minh email. Hệ thống sẽ chuyển bạn
                            về trang tìm kiếm trong giây lát.
                        </p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <TbMailX className="text-red-500 text-6xl mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            Liên kết không hợp lệ!
                        </h2>
                        <p className="text-gray-500 text-center">
                            Liên kết xác minh của bạn đã hết hạn hoặc không hợp
                            lệ.
                            <br />
                            Vui lòng đăng ký lại để nhận email xác minh mới.
                        </p>
                        <button
                            onClick={() => navigate("/register")}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Đăng ký lại
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

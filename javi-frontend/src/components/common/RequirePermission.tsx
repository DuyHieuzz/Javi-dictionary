import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthStore } from "@/stores/useAuthStore"; // adjust path
import { hasAnyPermission } from "@/utils/permission";

type Props = {
    required?: string[]; // danh sách permission, nếu user có 1 trong số này => allow
    fallbackPath?: string; // đường dẫn redirect khi không có quyền
    children: React.ReactNode;
};

const RequirePermission: React.FC<Props> = ({
    required,
    fallbackPath = "/search",
    children,
}) => {
    const user = useAuthStore((s) => s.user);
    const isAuth = !!user;
    const navigate = useNavigate();

    useEffect(() => {
        // nếu chưa login thì redirect lên login (ProtectedRoute thường đã xử lý)
        if (!isAuth) {
            navigate("/login");
            return;
        }

        // kiểm tra permission ngay khi mount
        if (!hasAnyPermission(user, required ?? [])) {
            toast.error("Bạn không có quyền truy cập chức năng này.");
            // small delay -> redirect để user thấy toast
            setTimeout(() => {
                navigate(fallbackPath, { replace: true });
            }, 300);
        }
    }, [user, isAuth, required, navigate, fallbackPath]);

    // Nếu không có quyền, component sẽ vẫn mount một chút trước khi navigate;
    // tránh hiển thị nội dung nhạy cảm bằng guard sau:
    if (!isAuth) return null;
    if (!hasAnyPermission(user, required ?? [])) return null;

    return <>{children}</>;
};

export default RequirePermission;

// src/components/common/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

type Props = {
    children: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const user = useAuthStore((s) => s.user);

    // Nếu chưa đăng nhập => chuyển tới login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

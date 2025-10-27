import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import AppHeader from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Outlet } from "react-router-dom";
import { useGlobalErrorStore } from "@/stores/useGlobalErrorStore";
import ServerError from "@/components/common/ServerError";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { serverDown, setServerDown } = useGlobalErrorStore();

    // Bao giờ server lỗi hoặc không chạy sẽ render ra
    if (serverDown) {
        return <ServerError onRetry={() => setServerDown(false)} />;
    }

    return (
        <div className="bg-[#f7f8fa] font-sans min-h-screen m-0 object-cover overflow-y-overlay">
            {/* Sidebar cố định */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            {/* Nội dung chính */}
            <div className="flex flex-col min-h-screen md:ml-[214px] transition-all duration-300">
                {/* Header */}
                <AppHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Content */}
                <main className="flex-1 overflow-y-auto mt-[64px]">
                    <div className="max-w-[1380px] mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <div className="md:px-4 mt-4">
                    <Footer />
                </div>
            </div>
        </div>
    );
}

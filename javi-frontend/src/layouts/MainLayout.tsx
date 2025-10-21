import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import AppHeader from "../components/common/Header";
import Footer from "../components/common/Footer";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="bg-[#f7f8fa] text-gray-800 font-sans min-h-screen">
            {/* Sidebar cố định */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

            {/* Nội dung chính */}
            <div className="flex flex-col min-h-screen md:ml-[214px] transition-all duration-300">
                {/* Header */}
                <AppHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[1380px] mx-auto px-8 py-8">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <div className="px-4 mt-4 ">
                    <Footer />
                </div>
            </div>
        </div>
    );
}

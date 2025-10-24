import { useEffect, useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function AppHeader({ onMenuClick }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const titles: Record<string, string> = {
        "/login": "Chào ngày mới",
        "/register": "Chào ngày mới",
        "/search/word": "Tra cứu",
        "/search/kanji": "Tra cứu",
        "/search/grammar": "Tra cứu",
        "/translate": "Dịch",
        "/jlpt": "JLPT",
        "/intro": "Giới thiệu",
        "/premium": "Nâng cấp",
    };

    const currentTitle = titles[location.pathname] || "Javi Dictionary";

    return (
        <header
            className={`fixed top-0 z-40
                w-full md:w-[calc(100%-214px)] md:left-[214px]
                h-[64px] flex items-center transition-all duration-200
                ${isScrolled ? "bg-[#fefefe]/90" : "bg-transparent"}
            `}
        >
            <div className="w-full max-w-[1380px] mx-auto flex items-center justify-between px-3">
                {/* Bên trái: icon menu + title */}
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden text-gray-700 text-2xl"
                        onClick={onMenuClick}
                    >
                        <RxHamburgerMenu />
                    </button>

                    <h1 className="hidden md:block text-xl transition-colors duration-300 text-gray-800">
                        {currentTitle}
                    </h1>
                </div>

                {/* Bên phải */}
                <div className="flex items-center justify-end space-x-4">
                    {/* Ẩn nút Đăng nhập nếu đang ở trang /login */}
                    {location.pathname !== "/login" && (
                        <Button
                            type="primary"
                            size="large"
                            className="!bg-[#3e67d6] hover:!bg-[#3558b6]"
                            onClick={() => navigate("/login")}
                        >
                            Đăng nhập
                        </Button>
                    )}

                    {/* Ẩn nút Đăng ký nếu đang ở trang /register */}
                    {location.pathname !== "/register" && (
                        <Button
                            size="large"
                            className="!bg-white/80"
                            onClick={() => navigate("/register")}
                        >
                            Đăng ký
                        </Button>
                    )}

                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        <img
                            src="https://flagcdn.com/w40/vn.png"
                            alt="VN"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}

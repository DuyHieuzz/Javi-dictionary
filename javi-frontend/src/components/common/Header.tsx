import { RxHamburgerMenu } from "react-icons/rx";
import { Button } from "antd";
import { useLocation } from "react-router-dom";

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function AppHeader({ onMenuClick }: HeaderProps) {
    const location = useLocation();

    const titles: Record<string, string> = {
        "/": "Tra cứu",
        "/translate": "Dịch",
        "/jlpt": "JLPT",
        "/intro": "Giới thiệu",
        "/premium": "Nâng cấp",
    };

    const currentTitle = titles[location.pathname] || "Javi Dictionary";

    return (
        <header className="h-[64px] w-full flex items-center bg-transparent border-none">
            <div className="w-full max-w-[1380px] mx-auto flex items-center justify-between px-6">
                {/* Bên trái: icon menu + title */}
                <div className="flex items-center gap-3">
                    {/* Nút menu (chỉ mobile hiển thị) */}
                    <button
                        className="md:hidden text-gray-700 text-2xl"
                        onClick={onMenuClick}
                    >
                        <RxHamburgerMenu />
                    </button>

                    {/* Tiêu đề trang - chỉ hiện desktop */}
                    <h1 className="hidden md:block text-xl m-0">
                        {currentTitle}
                    </h1>
                </div>

                {/* Bên phải: login / register / flag */}
                <div className="flex items-center justify-end space-x-4">
                    <Button type="primary" size="large">
                        Đăng nhập
                    </Button>
                    <Button size="large">Đăng ký</Button>

                    {/* Quốc kỳ */}
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

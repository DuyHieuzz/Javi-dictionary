import { useNavigate, useLocation, NavLink } from "react-router-dom";
import SearchBar from "../../components/search/SearchBar";
import SearchHomeContent from "../../components/search/SearchHomeContent";
import RecentComments from "../../components/comment/RecentComments";

export default function SearchHome() {
    const navigate = useNavigate();
    const location = useLocation();

    // Xác định tab hiện tại
    let activeTab: "word" | "kanji" | "grammar" = "word";
    if (location.pathname.includes("/kanji")) activeTab = "kanji";
    else if (location.pathname.includes("/grammar")) activeTab = "grammar";

    // Danh sách tab
    const tabs = [
        { path: "/search/word", label: "Từ vựng" },
        { path: "/search/kanji", label: "Hán tự" },
        { path: "/search/grammar", label: "Ngữ pháp" },
    ];

    // Xử lý tìm kiếm
    const handleSearch = (kw: string) => {
        if (kw.trim()) navigate(`/search/${activeTab}/${kw.trim()}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Cột trái */}
            <div className="w-full md:w-[75%] flex flex-col gap-6">
                {/* Thanh search + tabs */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                    <SearchBar onSubmit={handleSearch} activeTab={activeTab} />

                    <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }) =>
                                    `px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? "bg-blue-500 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`
                                }
                            >
                                {tab.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Nội dung chính (có banner + phần từ vựng trong ngày) */}
                <div className="flex flex-col gap-6">
                    <SearchHomeContent />
                </div>
            </div>

            {/* Cột phải - Bình luận gần đây */}
            <div className="w-full md:w-[25%] ">
                <RecentComments />
            </div>
        </div>
    );
}

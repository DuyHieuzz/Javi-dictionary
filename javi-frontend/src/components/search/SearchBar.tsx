import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { IoSearchOutline } from "react-icons/io5";
import * as wanakana from "wanakana";

interface SearchBarProps {
    onSubmit?: (keyword: string) => void;
    activeTab?: "word" | "kanji" | "grammar";
}

export default function SearchBar({
    onSubmit,
    activeTab = "word",
}: SearchBarProps) {
    const { keyword: paramKeyword } = useParams<{ keyword?: string }>();
    const [keyword, setKeyword] = useState(paramKeyword || "");
    const location = useLocation();
    const navigate = useNavigate();

    // 🧠 Đồng bộ input khi URL thay đổi
    useEffect(() => {
        if (paramKeyword !== undefined) setKeyword(paramKeyword);
    }, [paramKeyword]);

    const placeholderMap = {
        word: "日本, nihon, Nhật Bản",
        kanji: "公, CÔNG",
        grammar: "Cấu trúc ngữ pháp",
    };

    // 🧠 Chuyển Romaji → Kana
    const convertInput = (value: string): string => {
        const trimmed = value.trim();
        if (!trimmed) return "";

        if (wanakana.isRomaji(trimmed)) {
            if (/^[A-Z\s]+$/.test(trimmed)) {
                return wanakana.toKatakana(trimmed.toLowerCase());
            }
            return wanakana.toHiragana(trimmed);
        }

        return trimmed;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const converted = convertInput(keyword);
        setKeyword(converted);

        if (!converted.trim()) return;

        // ✅ gọi onSubmit nếu có (để logic ngoài vẫn hoạt động)
        if (onSubmit) onSubmit(converted.trim());

        // ✅ ép Router cập nhật URL kể cả khi giống path cũ
        const newPath = `/search/${activeTab}/${encodeURIComponent(
            converted.trim()
        )}`;
        if (location.pathname === newPath) {
            // nếu trùng path → thêm timestamp param để ép reload
            navigate(`${newPath}?t=${Date.now()}`, { replace: true });
        } else {
            navigate(newPath);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <div className="flex flex-nowrap items-center w-full gap-2 h-[52px] md:h-[56px]">
                {/* Select ngôn ngữ */}
                <select className="md:hidden flex-shrink-0 bg-[#3f67d6] text-white text-sm font-medium px-3 md:px-4 h-full rounded-xl outline-none hover:bg-[#365cc9] transition appearance-none">
                    <option>JA - VI</option>
                    <option>VI - JA</option>
                </select>

                <select className="hidden lg:block flex-shrink-0 bg-[#3f67d6] text-white text-sm font-medium px-3 md:px-4 h-full rounded-xl outline-none hover:bg-[#365cc9] transition appearance-none">
                    <option>Nhật - Việt</option>
                    <option>Việt - Nhật</option>
                </select>

                {/* Ô tìm kiếm */}
                <div className="relative flex-1 h-full">
                    {/* Icon tìm kiếm */}
                    <button
                        type="submit"
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 p-2 transition"
                        title="Tìm kiếm"
                    >
                        <IoSearchOutline className="text-xl" />
                    </button>

                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={placeholderMap[activeTab]}
                        className="w-full h-full border border-blue-400 rounded-xl pl-10 pr-3 md:pr-[96px] text-[15px] md:text-base text-gray-800 placeholder-gray-400 outline-none focus:ring-0 focus:outline-none transition"
                    />

                    {/* Nút tìm kiếm bên phải */}
                    <button
                        type="submit"
                        className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-[#3f67d6] hover:bg-blue-600 text-white rounded-lg px-5 py-2 text-base transition"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </form>
    );
}

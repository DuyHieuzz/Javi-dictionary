import { useState } from "react";

const categories = [
    { key: "vocab", label: "Từ vựng" },
    { key: "kanji", label: "Hán tự" },
    { key: "grammar", label: "Ngữ pháp" },
];

interface CategoryTabsProps {
    onChange: (key: string) => void;
}

export default function CategoryTabs({ onChange }: CategoryTabsProps) {
    const [active, setActive] = useState("vocab");

    const handleClick = (key: string) => {
        setActive(key);
        onChange(key);
    };

    return (
        <div className="flex bg-white justify-center gap-3 mt-3">
            {categories.map((cat) => (
                <button
                    key={cat.key}
                    onClick={() => handleClick(cat.key)}
                    className={`px-4 py-2 text-sm md:text-base rounded-3xl transition-all border border-transparent ${
                        active === cat.key
                            ? "!bg-[#f1f5fd] !border-[#3e67d6] !text-[#3e67d6]"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    {cat.label}
                </button>
            ))}
        </div>
    );
}

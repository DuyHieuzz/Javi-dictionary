interface CategoryTabsProps {
    activeTab: string;
    onTabChange: (tab: "word" | "kanji" | "grammar") => void;
}

export default function CategoryTabs({
    activeTab,
    onTabChange,
}: CategoryTabsProps) {
    const tabs = [
        { key: "word", label: "Từ vựng" },
        { key: "kanji", label: "Hán tự" },
        { key: "grammar", label: "Ngữ pháp" },
    ];

    return (
        <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() =>
                        onTabChange(tab.key as "word" | "kanji" | "grammar")
                    }
                    className={`px-4 py-2 text-sm md:text-base rounded-3xl transition-all border border-transparent ${
                        activeTab === tab.key
                            ? "!bg-[#f1f5fd] !border-[#3e67d6] !text-[#3e67d6]"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

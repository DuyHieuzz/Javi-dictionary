interface KanjiListProps {
    kanjis: { id?: number; characterName: string; sinoViName: string }[];
    selectedId: string | null;
    onSelect: (characterName: string) => void;
    keyword?: string;
}

export default function KanjiList({
    kanjis,
    selectedId,
    onSelect,
    keyword,
}: KanjiListProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex flex-col">
            <h3 className="text-gray-800 mb-3 text-[15px]">
                Kết quả tra cứu kanji:{" "}
                <span className="text-[#3e67d6]">{keyword}</span>
            </h3>

            <div className="flex flex-col">
                {kanjis.length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-4">
                        Không có kết quả nào phù hợp.
                    </p>
                ) : (
                    kanjis.map((item) => (
                        <div
                            key={item.characterName}
                            onClick={() => onSelect(item.characterName)}
                            className={`flex items-center justify-start gap-2 p-3 rounded-lg cursor-pointer transition-all
                                ${
                                    selectedId === item.characterName
                                        ? "bg-[#f1f5fd]"
                                        : "bg-white"
                                }`}
                        >
                            <h1 className="text-xl font-medium text-[#3e67d6] mb-1">
                                {item.characterName}
                            </h1>
                            <p className="ml-1 text-[15px] text-gray-700 line-clamp-1">
                                {item.sinoViName}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

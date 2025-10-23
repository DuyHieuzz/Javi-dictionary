import { useState } from "react";

export default function VocabularyList() {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const vocabularies = [
        { id: 1, word: "起こる", reading: "おこる", meaning: "xảy ra" },
        { id: 2, word: "怒る", reading: "いかる・おこる", meaning: "bực tức" },
        { id: 3, word: "興る", reading: "おこる", meaning: "được dựng lại" },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 flex flex-col">
            <h3 className="text-gray-800 mb-3">
                Kết quả tra cứu: <span className="text-[#3e67d6]">おこる</span>
            </h3>

            <div className="flex flex-col gap-2">
                {vocabularies.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all
                            ${
                                selectedId === item.id
                                    ? "bg-[#f1f5fd]"
                                    : "hover:bg-[#e2ebfa] bg-white"
                            }`}
                    >
                        <h1 className="text-[18px] font-medium text-[#3e67d6] mb-1">
                            {item.word}
                        </h1>
                        <p className="text-sm text-gray-600 mb-1">
                            {item.reading}
                        </p>
                        <p className="text-[15px] text-gray-700 line-clamp-1">
                            {item.meaning}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

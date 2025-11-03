import { Select, Empty } from "antd";
import { IGrammarResponse } from "@/types/backend";

interface Props {
    grammars: IGrammarResponse[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    level: "" | "N5" | "N4" | "N3" | "N2" | "N1";
    onLevelChange: (v: "" | "N5" | "N4" | "N3" | "N2" | "N1") => void;
    keyword?: string | null;
}

const levelOptions: {
    label: string;
    value: "" | "N5" | "N4" | "N3" | "N2" | "N1";
}[] = [
    { label: "Tất cả", value: "" },
    { label: "N5", value: "N5" },
    { label: "N4", value: "N4" },
    { label: "N3", value: "N3" },
    { label: "N2", value: "N2" },
    { label: "N1", value: "N1" },
];

export default function GrammarList({
    grammars,
    selectedId,
    onSelect,
    level,
    onLevelChange,
}: Props) {
    return (
        <div className="border rounded-2xl shadow-sm overflow-hidden bg-white">
            <div className="p-4 flex items-center justify-between border-b">
                <h3 className="text-base">Kết quả ngữ pháp</h3>
                <Select
                    value={
                        (level || undefined) as
                            | ""
                            | "N5"
                            | "N4"
                            | "N3"
                            | "N2"
                            | "N1"
                            | undefined
                    }
                    onChange={(v: "" | "N5" | "N4" | "N3" | "N2" | "N1") =>
                        onLevelChange(v)
                    }
                    options={levelOptions}
                    className="w-32"
                    placeholder="Trình độ"
                />
            </div>

            {grammars.length === 0 ? (
                <Empty description="Không tìm thấy ngữ pháp" className="mt-6" />
            ) : (
                <div className="max-h-[70vh] overflow-y-auto p-3">
                    {grammars.map((g) => (
                        <div
                            key={g.id}
                            onClick={() => onSelect(g.id)}
                            className={`p-3 cursor-pointer border-b hover:bg-gray-50 transition rounded-2xl ${
                                selectedId === g.id ? "bg-[#f1f5fd]" : ""
                            }`}
                        >
                            <div className="flex flex-col items-start gap-2 mb-2">
                                <span
                                    className={`text-xs font-bold text-white rounded-full px-2 py-0.5 ${
                                        g.level === "N1"
                                            ? "bg-blue-600"
                                            : g.level === "N2"
                                            ? "bg-green-600"
                                            : g.level === "N3"
                                            ? "bg-yellow-500"
                                            : g.level === "N4"
                                            ? "bg-red-500"
                                            : "bg-purple-700"
                                    }`}
                                >
                                    {g.level}
                                </span>
                                <span className="text-base">
                                    {g.pattern.trim()}
                                </span>
                            </div>

                            <div className="text-gray-600 text-sm line-clamp-2">
                                {g.meaning}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

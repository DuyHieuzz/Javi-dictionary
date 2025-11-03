import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { message, Spin } from "antd";
import { callSearchGrammars, callGetGrammarDetail } from "@/apis/grammarApi";
import { IGrammarResponse, IPageResponse } from "@/types/backend";
import GrammarList from "@/components/grammar/GrammarList";
import GrammarDetail from "@/components/grammar/GrammarDetail";
import SearchSection from "@/components/search/SearchSection";

export default function GrammarResult() {
    const { keyword } = useParams<{ keyword: string }>();

    const [grammarList, setGrammarList] = useState<IGrammarResponse[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [grammarDetail, setGrammarDetail] = useState<IGrammarResponse | null>(
        null
    );
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [level, setLevel] = useState<"" | "N5" | "N4" | "N3" | "N2" | "N1">(
        ""
    );

    /** Gọi API tìm kiếm ngữ pháp theo keyword & level */
    useEffect(() => {
        if (!keyword) return;
        setGrammarList([]);
        setGrammarDetail(null);
        setSelectedId(null);
        setLoadingList(true);

        callSearchGrammars({
            keyword,
            level: level || undefined,
            page: 1,
            size: 10,
        })
            .then((res) => {
                const result = res.data
                    ?.result as IPageResponse<IGrammarResponse>;
                const list = result?.content || [];
                setGrammarList(list);
                if (list.length > 0) {
                    // Chọn tự động ngữ pháp đầu tiên
                    setSelectedId(list[0].id);
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm ngữ pháp:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tìm kiếm ngữ pháp. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingList(false));
    }, [keyword, level]);

    /** Khi chọn ngữ pháp khác hoặc load đầu tiên */
    useEffect(() => {
        if (!selectedId) return;
        setGrammarDetail(null);
        setLoadingDetail(true);

        callGetGrammarDetail(selectedId)
            .then((res) => {
                setGrammarDetail(res.data?.result || null);
            })
            .catch((err) => {
                console.error("Lỗi khi lấy chi tiết ngữ pháp:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tải chi tiết ngữ pháp. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingDetail(false));
    }, [selectedId]);

    return (
        <div className="flex flex-col gap-6">
            {/* Thanh tìm kiếm cố định */}
            <SearchSection activeTab="grammar" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* ==== CỘT TRÁI: DANH SÁCH NGỮ PHÁP ==== */}
                <div className="w-full md:w-[30%]">
                    {loadingList ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <GrammarList
                            grammars={grammarList}
                            selectedId={selectedId}
                            onSelect={(id) => setSelectedId(id)}
                            level={level}
                            onLevelChange={(v) => setLevel(v)}
                            keyword={keyword}
                        />
                    )}
                </div>

                {/* ==== CỘT PHẢI: CHI TIẾT NGỮ PHÁP ==== */}
                <div className="w-full md:w-[70%]">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : grammarDetail ? (
                        <GrammarDetail data={grammarDetail} />
                    ) : (
                        <p className="text-gray-500 italic mt-5">
                            {grammarList.length === 0
                                ? "Không tìm thấy ngữ pháp nào phù hợp."
                                : "Chọn một mẫu ngữ pháp để xem chi tiết."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

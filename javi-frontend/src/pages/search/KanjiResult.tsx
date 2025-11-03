import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { message, Spin } from "antd";
import { callSearchKanji, callGetKanjiDetail } from "@/apis/kanjiApi";
import { IKanjiResponse, IKanjiDetailResponse } from "@/types/backend";
import KanjiList from "@/components/kanji/KanjiList";
import KanjiDetail from "@/components/kanji/KanjiDetail";
import SearchSection from "@/components/search/SearchSection";

export default function KanjiResult() {
    const { keyword } = useParams<{ keyword: string }>();

    const [kanjiList, setKanjiList] = useState<IKanjiResponse[]>([]);
    const [selectedKanji, setSelectedKanji] = useState<string | null>(null);
    const [kanjiDetail, setKanjiDetail] = useState<IKanjiDetailResponse | null>(
        null
    );
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    /** Gọi API tìm kiếm Kanji theo keyword */
    useEffect(() => {
        if (!keyword) return;
        setKanjiList([]);
        setKanjiDetail(null);
        setSelectedKanji(null);
        setLoadingList(true);

        callSearchKanji(keyword, { saveHistory: true })
            .then((res) => {
                const list = res.data?.result || [];
                setKanjiList(list);
                if (list.length > 0) {
                    // Tự động chọn kanji đầu tiên sau khi tra → lưu lịch sử chi tiết đầu tiên
                    const firstKanji = list[0].characterName;
                    setSelectedKanji(firstKanji);

                    callGetKanjiDetail(firstKanji, { saveHistory: true })
                        .then((detailRes) => {
                            setKanjiDetail(detailRes.data?.result || null);
                        })
                        .catch((err) => {
                            console.error(
                                "Lỗi khi lấy chi tiết Kanji đầu tiên:",
                                err
                            );
                        });
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm Kanji:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tìm kiếm Kanji. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingList(false));
    }, [keyword]);

    /** Khi chọn Kanji khác hoặc có Kanji đầu tiên, gọi API lấy chi tiết */
    useEffect(() => {
        if (!selectedKanji) return;
        setKanjiDetail(null);
        setLoadingDetail(true);

        // User click Kanji cụ thể → lưu lịch sử
        callGetKanjiDetail(selectedKanji, { saveHistory: true })
            .then((res) => {
                setKanjiDetail(res.data?.result || null);
            })
            .catch((err) => {
                console.error("Lỗi khi lấy chi tiết Kanji:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tải chi tiết Kanji. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingDetail(false));
    }, [selectedKanji]);

    return (
        <div className="flex flex-col gap-6">
            {/* Giữ nguyên thanh tìm kiếm */}
            <SearchSection activeTab="kanji" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* ==== CỘT TRÁI: DANH SÁCH KANJI ==== */}
                <div className="w-full md:w-[25%]">
                    {loadingList ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <KanjiList
                            kanjis={kanjiList}
                            selectedId={selectedKanji}
                            onSelect={(char) => setSelectedKanji(char)}
                            keyword={keyword}
                        />
                    )}
                </div>

                {/* ==== CỘT PHẢI: CHI TIẾT KANJI ==== */}
                <div className="w-full md:w-[75%]">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : kanjiDetail ? (
                        <KanjiDetail data={kanjiDetail} />
                    ) : (
                        <p className="text-gray-500 italic mt-5">
                            {kanjiList.length === 0
                                ? "Không tìm thấy Kanji nào phù hợp."
                                : "Chọn một chữ Kanji để xem chi tiết."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Spin } from "antd";
import {
    callSearchVocabulary,
    callGetVocabularyByWord,
} from "@/apis/vocabularyApi";
import { callGetKanjiDetail } from "@/apis/kanjiApi";
import {
    IVocabResponse,
    IKanjiDetailResponse,
    IBackendRes,
} from "@/types/backend";
import VocabularyList from "@/components/vocabulary/VocabularyList";
import VocabularyDetail from "@/components/vocabulary/VocabularyDetail";
import SearchSection from "@/components/search/SearchSection";
import { AxiosResponse } from "axios";

export default function VocabularyResult() {
    const { keyword } = useParams<{ keyword: string }>();
    const navigate = useNavigate();

    const [vocabList, setVocabList] = useState<IVocabResponse[]>([]);
    const [selectedVocab, setSelectedVocab] = useState<string | null>(null);
    const [vocabDetail, setVocabDetail] = useState<IVocabResponse | null>(null);
    const [kanjiDetails, setKanjiDetails] = useState<IKanjiDetailResponse[]>(
        []
    );
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    /** Gọi API tìm kiếm Vocabulary theo keyword */
    useEffect(() => {
        if (!keyword) return;
        setVocabList([]);
        setVocabDetail(null);
        setSelectedVocab(null);
        setKanjiDetails([]);
        setLoadingList(true);

        callSearchVocabulary(keyword, { saveHistory: true })
            .then((res: AxiosResponse<IBackendRes<IVocabResponse[]>>) => {
                const list = res.data?.result || [];
                setVocabList(list);
                if (list.length > 0) {
                    // Tự động chọn từ đầu tiên sau khi tra → lưu lịch sử chi tiết đầu tiên
                    const firstWord = list[0].word;
                    setSelectedVocab(firstWord);

                    callGetVocabularyByWord(firstWord, { saveHistory: false })
                        .then((detailRes) => {
                            setVocabDetail(detailRes.data?.result || null);
                        })
                        .catch((err) => {
                            console.error(
                                "Lỗi khi lấy chi tiết từ đầu tiên:",
                                err
                            );
                        });
                }
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm từ vựng:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tìm kiếm từ vựng. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingList(false));
    }, [keyword]);

    /** Khi chọn từ khác hoặc có từ đầu tiên, gọi API lấy chi tiết */
    useEffect(() => {
        if (!selectedVocab) return;
        setVocabDetail(null);
        setKanjiDetails([]);
        setLoadingDetail(true);

        callGetVocabularyByWord(selectedVocab, { saveHistory: true })
            .then((res: AxiosResponse<IBackendRes<IVocabResponse>>) => {
                const data = res.data?.result;
                setVocabDetail(data || null);

                // Nếu có danh sách Kanji trong từ → gọi detail từng kanji
                if (data?.kanjis && data.kanjis.length > 0) {
                    Promise.all(
                        data.kanjis.map((k: any) =>
                            callGetKanjiDetail(k.characterName)
                                .then(
                                    (
                                        r: AxiosResponse<
                                            IBackendRes<IKanjiDetailResponse>
                                        >
                                    ) => r.data?.result
                                )
                                .catch(() => null)
                        )
                    ).then(
                        (
                            details: (IKanjiDetailResponse | null | undefined)[]
                        ) => {
                            setKanjiDetails(
                                details.filter(
                                    (d): d is IKanjiDetailResponse => d != null
                                )
                            );
                        }
                    );
                }
            })
            .catch((err) => {
                console.error("Lỗi khi lấy chi tiết từ vựng:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tải chi tiết từ vựng. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => setLoadingDetail(false));
    }, [selectedVocab]);

    /** Chuyển sang trang KanjiResult khi bấm “Xem chi tiết” */
    const handleViewKanjiDetail = (character: string) => {
        navigate(`/search/kanji/${encodeURIComponent(character)}`);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Thanh tìm kiếm */}
            <SearchSection activeTab="word" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* ==== CỘT TRÁI ==== */}
                <div className="w-full md:w-[25%]">
                    {loadingList ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <VocabularyList
                            vocabularies={vocabList}
                            selectedId={selectedVocab}
                            onSelect={(word) => setSelectedVocab(word)}
                            keyword={keyword}
                            kanjiDetails={kanjiDetails}
                            onViewKanjiDetail={handleViewKanjiDetail}
                        />
                    )}
                </div>

                {/* ==== CỘT PHẢI ==== */}
                <div className="w-full md:w-[75%]">
                    {loadingDetail ? (
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : vocabDetail ? (
                        <VocabularyDetail data={vocabDetail} />
                    ) : (
                        <p className="text-gray-500 italic mt-5">
                            {vocabList.length === 0
                                ? "Không tìm thấy từ vựng nào phù hợp."
                                : "Chọn một từ vựng để xem chi tiết."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

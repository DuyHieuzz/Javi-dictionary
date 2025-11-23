import { useEffect, useState, useRef } from "react";
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

    // --- Thêm cho infinite scroll (0-based page)
    const [page, setPage] = useState<number>(0); // trang hiện tại (0-based)
    const [hasMore, setHasMore] = useState<boolean>(false);

    // ref sentinel để observer observe
    const observerRef = useRef<HTMLDivElement | null>(null);

    // ref guard tránh gọi API nhiều lần
    const loadingMoreRef = useRef(false);

    /**
     * fetchGrammars: load danh sách grammar
     * - pageToLoad: 0-based
     * - append: nếu true thì nối vào danh sách hiện tại, ngược lại replace
     * - lưu ý: auto-load (append) sẽ không lưu lịch sử (saveHistory: false)
     */
    const fetchGrammars = (pageToLoad = 0, append = false) => {
        // guard nếu đang load trước đó
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingList(true);

        callSearchGrammars({
            keyword: keyword || "",
            level: level || undefined,
            page: pageToLoad,
            size: 10,
            saveHistory: false, // auto load không lưu lịch sử
        })
            .then((res) => {
                const result = res.data
                    ?.result as IPageResponse<IGrammarResponse>;
                const list = result?.content || [];

                // cập nhật pagination
                const tp = result?.totalPages ?? 1;
                setHasMore(pageToLoad < tp - 1);

                if (append) {
                    setGrammarList((prev) => {
                        const ids = new Set(prev.map((p) => p.id));
                        const newItems = list.filter((it) => !ids.has(it.id));
                        return [...prev, ...newItems];
                    });
                } else {
                    setGrammarList(list);
                    if (list.length > 0) {
                        setSelectedId(list[0].id);
                    } else {
                        setSelectedId(null);
                    }
                }

                setPage(pageToLoad);
            })
            .catch((err) => {
                console.error("Lỗi khi tìm kiếm ngữ pháp:", err);
                const msg =
                    err.response?.data?.message ||
                    "Không thể tìm kiếm ngữ pháp. Vui lòng thử lại!";
                message.error(msg);
            })
            .finally(() => {
                loadingMoreRef.current = false;
                setLoadingList(false);
            });
    };

    /** Gọi API tìm kiếm ngữ pháp theo keyword & level */
    useEffect(() => {
        if (!keyword) return;

        // reset state khi keyword/level thay đổi
        setGrammarList([]);
        setGrammarDetail(null);
        setSelectedId(null);
        setPage(0);
        setHasMore(false);

        fetchGrammars(0, false);
    }, [keyword, level]);

    /** Khi chọn ngữ pháp khác hoặc load đầu tiên */
    useEffect(() => {
        if (!selectedId) return;
        setGrammarDetail(null);
        setLoadingDetail(true);

        callGetGrammarDetail(selectedId, { saveHistory: true })
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

    // IntersectionObserver để detect khi scroll gần cuối -> load page tiếp
    useEffect(() => {
        const sentinel = observerRef.current;
        if (!sentinel) return;
        if (!hasMore) return;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (
                        entry.isIntersecting &&
                        hasMore &&
                        !loadingMoreRef.current
                    ) {
                        fetchGrammars(page + 1, true);
                    }
                });
            },
            {
                root: null,
                rootMargin: "200px", // trigger sớm hơn để UX mượt
                threshold: 0.1,
            }
        );

        io.observe(sentinel);
        // --- Cleanup an toàn: unobserve sentinel cũ trước khi disconnect
        return () => {
            try {
                if (io && sentinel) {
                    io.unobserve(sentinel);
                }
            } catch (e) {
                // bỏ qua lỗi không mong muốn khi unobserve
            }
            try {
                io.disconnect();
            } catch (e) {
                // bỏ qua lỗi khi disconnect
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, hasMore]);

    return (
        <div className="flex flex-col gap-6">
            {/* Thanh tìm kiếm cố định */}
            <SearchSection activeTab="grammar" />

            <div className="flex flex-col md:flex-row gap-6">
                {/* ==== CỘT TRÁI: DANH SÁCH NGỮ PHÁP ==== */}
                <div className="w-full md:w-[30%]">
                    {loadingList && grammarList.length === 0 ? (
                        // load lần đầu: show full spinner
                        <div className="flex justify-center items-center py-10">
                            <Spin />
                        </div>
                    ) : (
                        <>
                            <GrammarList
                                grammars={grammarList}
                                selectedId={selectedId}
                                onSelect={(id) => setSelectedId(id)}
                                level={level}
                                onLevelChange={(v) => setLevel(v)}
                                keyword={keyword}
                            />

                            {/* sentinel cho IntersectionObserver */}
                            <div ref={observerRef} />

                            {/* nếu đang load thêm (append) hiển thị loader nhỏ */}
                            {loadingList && grammarList.length > 0 && (
                                <div className="text-center py-3">
                                    <Spin size="small" />
                                </div>
                            )}
                        </>
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

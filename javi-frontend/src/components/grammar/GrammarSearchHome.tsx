import { useState, useEffect } from "react";
import { Select, Spin, Empty, Modal } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { callSearchGrammars, callGetGrammarDetail } from "@/apis/grammarApi";
import { IGrammarResponse, IPageResponse } from "@/types/backend";
import { useSearchParams } from "react-router-dom";
import GrammarDetail from "@/components/grammar/GrammarDetail";

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

export default function GrammarSearchHome() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get("q") || "";

    const [level, setLevel] = useState<"" | "N5" | "N4" | "N3" | "N2" | "N1">(
        ""
    );
    const [grammars, setGrammars] = useState<IGrammarResponse[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // modal
    const [openModal, setOpenModal] = useState(false);
    const [selectedGrammar, setSelectedGrammar] =
        useState<IGrammarResponse | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Gọi API phân trang
    const fetchGrammars = async (
        pageToLoad = 1,
        reset = false,
        saveHistory = false
    ) => {
        try {
            setLoading(true);
            const pageParam = Math.max(0, pageToLoad - 1);
            const res = await callSearchGrammars({
                keyword: keyword || undefined,
                level: level || undefined,
                page: pageParam,
                size: 10,
                saveHistory, // truyền tham số saveHistory vào API
            });

            const data = res.data?.result as IPageResponse<IGrammarResponse>;
            const newList = reset
                ? data.content
                : [...grammars, ...data.content];

            setGrammars(newList);
            setHasMore(!data.last);
            setPage(data.number + 1);

            // Khi user search lần đầu, mở luôn grammar đầu tiên và lưu lịch sử
            if (saveHistory && data.content.length > 0) {
                const firstGrammar = data.content[0];
                const resDetail = await callGetGrammarDetail(firstGrammar.id, {
                    saveHistory: true,
                });
                setSelectedGrammar(resDetail.data?.result || null);
                setOpenModal(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Khi filter hoặc keyword thay đổi → load lại trang đầu
    useEffect(() => {
        fetchGrammars(1, true, keyword.trim() !== "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level, keyword]);

    const handleLevelChange = (
        value: "" | "N5" | "N4" | "N3" | "N2" | "N1"
    ) => {
        setLevel(value);
    };

    // Khi click grammar → mở modal + lấy chi tiết
    const handleOpenDetail = async (id: number) => {
        try {
            setLoadingDetail(true);
            setOpenModal(true);
            const res = await callGetGrammarDetail(id, { saveHistory: true });
            setSelectedGrammar(res.data?.result || null);
        } finally {
            setLoadingDetail(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="w-full p-3 bg-white">
                <h2 className="text-lg font-semibold mb-3">
                    Kết quả tra cứu ngữ pháp
                </h2>

                <div className="flex gap-3 mb-5">
                    <Select
                        value={level || undefined}
                        onChange={handleLevelChange}
                        options={levelOptions}
                        className="w-40"
                        placeholder="Trình độ"
                    />
                </div>

                {loading && grammars.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Spin />
                    </div>
                ) : grammars.length === 0 ? (
                    <Empty
                        description="Không tìm thấy ngữ pháp nào"
                        className="mt-16"
                    />
                ) : (
                    <InfiniteScroll
                        dataLength={grammars.length}
                        next={() => fetchGrammars(page + 1, false, false)} // load thêm: không lưu lịch sử
                        hasMore={hasMore}
                        loader={
                            <div className="text-center py-3">
                                <Spin size="small" />
                            </div>
                        }
                        scrollThreshold={0.9}
                    >
                        <div className="flex flex-col divide-y divide-gray-200">
                            {grammars.map((g) => (
                                <div
                                    key={g.id}
                                    onClick={() => handleOpenDetail(g.id)} // mở modal thay vì navigate
                                    className="p-3 cursor-pointer hover:bg-gray-50 transition rounded-md"
                                >
                                    <div className="flex flex-col items-start ">
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
                                        <span className="text-lg font-medium my-2">
                                            {g.pattern.trim()}
                                        </span>
                                    </div>
                                    <div className="text-gray-600 text-sm line-clamp-2">
                                        {g.meaning}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                )}
            </div>

            {/* ==== MODAL CHI TIẾT NGỮ PHÁP (CÓ COMMENT) ==== */}
            <Modal
                open={openModal}
                onCancel={() => setOpenModal(false)}
                footer={null}
                width={950}
                centered
                closable={false}
                destroyOnClose
                bodyStyle={{
                    padding: 0,
                    background: "transparent",
                }}
                className="!p-0 [&_.ant-modal-content]:!bg-transparent [&_.ant-modal-content]:!shadow-none"
            >
                {loadingDetail ? (
                    <div className="flex justify-center items-center py-10">
                        <Spin size="large" />
                    </div>
                ) : selectedGrammar ? (
                    <GrammarDetail data={selectedGrammar} />
                ) : (
                    <p className="text-gray-500 text-center py-10">
                        Không thể tải chi tiết ngữ pháp.
                    </p>
                )}
            </Modal>
        </div>
    );
}

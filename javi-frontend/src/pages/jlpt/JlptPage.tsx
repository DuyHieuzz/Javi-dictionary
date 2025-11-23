import React, { useEffect, useMemo, useState } from "react";
import {
    Row,
    Col,
    Card,
    Pagination,
    Checkbox,
    Radio,
    Spin,
    Tooltip,
    Alert,
    message,
} from "antd";
import SearchResultModal from "@/components/search/SearchResultModal";
import {
    IVocabResponse,
    IKanjiResponse,
    IGrammarResponse,
    IPageResponse,
} from "@/types/backend";
import { callGetVocabularyPage } from "@/apis/vocabularyApi";
import { callGetKanjiPage } from "@/apis/kanjiApi";
import { callGetGrammarsByFilter } from "@/apis/grammarApi";
import { SwapOutlined as ShuffleOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { useLocation } from "react-router-dom";

// kiểu entity nội bộ
type EntityType = "vocab" | "grammar" | "kanji";
// modal entity type (phù hợp SearchResultModal)
type ModalEntityType = "WORD" | "KANJI" | "GRAMMAR";

const PAGE_SIZE = 20;

const JlptPage: React.FC = () => {
    // lọc & loại
    const [entityType, setEntityType] = useState<EntityType>("vocab");
    const [level, setLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");

    // toggles hiển thị (vocab uses 3 toggles; grammar & kanji map accordingly)
    const [showVocab, setShowVocab] = useState(true); // vocab / mẫu câu / hán tự
    const [showReading, setShowReading] = useState(true); // phiên âm / ví dụ / hán-vi
    const [showMeaning, setShowMeaning] = useState(true); // nghĩa (chỉ áp dụng cho vocab & grammar)

    // paging & data
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);

    const [vocabPage, setVocabPage] =
        useState<IPageResponse<IVocabResponse> | null>(null);
    const [kanjiPage, setKanjiPage] =
        useState<IPageResponse<IKanjiResponse> | null>(null);
    const [grammarPage, setGrammarPage] =
        useState<IPageResponse<IGrammarResponse> | null>(null);

    // lỗi
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // responsive columns cho Kanji grid (điện thoại 6, tablet 8, desktop 10)
    const [kanjiCols, setKanjiCols] = useState<number>(10);
    useEffect(() => {
        const calcCols = () => {
            const w = window.innerWidth;
            // phone 6 chữ, màn to hơn 8 chữ, desktop 10 chữ
            if (w < 640) setKanjiCols(6); // phone
            else if (w < 1024) setKanjiCols(8); // tablet / small laptop
            else setKanjiCols(10); // desktop
        };
        calcCols();
        window.addEventListener("resize", calcCols);
        return () => window.removeEventListener("resize", calcCols);
    }, []);

    // Nếu viewport/table nhỏ (ví dụ embed trong iframe/cell) dựng layout mobile-like
    const [isNarrow, setIsNarrow] = useState<boolean>(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 900px)");
        const handler = (e: MediaQueryListEvent | MediaQueryList) =>
            setIsNarrow("matches" in e ? e.matches : (e as any).matches);
        // set initial
        setIsNarrow(mq.matches);
        if ("addEventListener" in mq) {
            mq.addEventListener("change", handler as any);
            return () => mq.removeEventListener("change", handler as any);
        } else {
            // fallback
            // @ts-ignore
            mq.addListener(handler as any);
            return () => {
                // @ts-ignore
                mq.removeListener(handler as any);
            };
        }
    }, []);

    // dữ liệu hiện tại (array) - dùng để shuffle
    const currentList = useMemo(() => {
        if (entityType === "vocab") return vocabPage?.content ?? [];
        if (entityType === "kanji") return kanjiPage?.content ?? [];
        return grammarPage?.content ?? [];
    }, [entityType, vocabPage, kanjiPage, grammarPage]);

    // modal
    const [modalOpen, setModalOpen] = useState(false);
    const [modalEntityType, setModalEntityType] =
        useState<ModalEntityType>("WORD");
    const [modalEntityIdOrKey, setModalEntityIdOrKey] = useState<
        number | string | undefined
    >(undefined);

    const location = useLocation();

    // khi mount hoặc query string thay đổi -> áp giá trị mặc định từ URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const qLevel = params.get("level"); // N1..N5
        const qType = params.get("type"); // vocab | kanji | grammar

        // set level nếu hợp lệ
        if (
            qLevel === "N1" ||
            qLevel === "N2" ||
            qLevel === "N3" ||
            qLevel === "N4" ||
            qLevel === "N5"
        ) {
            setLevel(qLevel as any);
        }

        // set entityType + mặc định toggles theo type
        if (qType === "kanji" || qType === "grammar" || qType === "vocab") {
            setEntityType(qType as EntityType);

            // reset toggles theo loại:
            if (qType === "vocab") {
                setShowVocab(true);
                setShowReading(true);
                setShowMeaning(true);
            } else if (qType === "kanji") {
                setShowVocab(true); // hiển thị ký tự
                setShowReading(true); // hiển thị hán-vi
                setShowMeaning(false); // nghĩa không áp dụng
            } else if (qType === "grammar") {
                setShowVocab(true); // pattern
                setShowReading(false); // phiên âm không dùng
                setShowMeaning(true); // nghĩa
            }
        } else {
            // nếu không có type trong url, ta vẫn muốn mặc định là vocab
            setEntityType("vocab");
            setShowVocab(true);
            setShowReading(true);
            setShowMeaning(true);
        }

        // reset page về 0 khi vào từ nút
        setPage(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // đảm bảo luôn ít nhất 1 toggle bật (backstop)
    useEffect(() => {
        const applicable = (() => {
            if (entityType === "vocab")
                return [showVocab, showReading, showMeaning];
            if (entityType === "kanji") return [showVocab, showReading];
            return [showVocab, showMeaning]; // grammar
        })();
        const countOn = applicable.filter(Boolean).length;
        if (countOn === 0) {
            // bật mặc định 1 toggle phù hợp (ưu tiên showVocab)
            setShowVocab(true);
            message.info("Phải có ít nhất 1 mục hiển thị.");
        }
    }, [showVocab, showReading, showMeaning, entityType]);

    // load data khi entityType / level / page đổi
    useEffect(() => {
        fetchPage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityType, level, page]);

    const fetchPage = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const levelFilter = `level:'${level}'`;

            if (entityType === "vocab") {
                const params = { page, size: PAGE_SIZE, filter: levelFilter };
                const res = await callGetVocabularyPage(params);
                const payload =
                    (res as any).data?.result ??
                    (res as any).result ??
                    (res as any).data ??
                    res;
                setVocabPage(payload);
            } else if (entityType === "kanji") {
                const params = { page, size: PAGE_SIZE, filter: levelFilter };
                const res = await callGetKanjiPage(params);
                const payload =
                    (res as any).data?.result ??
                    (res as any).result ??
                    (res as any).data ??
                    res;
                setKanjiPage(payload);
            } else {
                const filter = levelFilter;
                const res = await callGetGrammarsByFilter(
                    filter,
                    page,
                    PAGE_SIZE
                );
                const payload =
                    (res as any).data?.result ??
                    (res as any).result ??
                    (res as any).data ??
                    res;
                setGrammarPage(payload);
            }
        } catch (err: any) {
            console.error("Fetch JLPT page error", err);
            const msg =
                err?.response?.data?.message ??
                err?.message ??
                "Lỗi kết nối API";
            setErrorMessage(msg);
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // shuffle nội bộ (chỉ shuffle order của array hiện tại)
    const handleShuffle = () => {
        const list = currentList.slice();
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        if (entityType === "vocab" && vocabPage)
            setVocabPage({ ...vocabPage, content: list as any });
        else if (entityType === "kanji" && kanjiPage)
            setKanjiPage({ ...kanjiPage, content: list as any });
        else if (entityType === "grammar" && grammarPage)
            setGrammarPage({ ...grammarPage, content: list as any });
    };

    // Mở modal: map entityType nội bộ sang modalEntityType hợp lệ
    const openModalForItem = (item: any) => {
        if (entityType === "vocab") {
            setModalEntityType("WORD");
            setModalEntityIdOrKey(item.id ?? undefined);
        } else if (entityType === "kanji") {
            setModalEntityType("KANJI");
            setModalEntityIdOrKey(item.characterName ?? item.id ?? undefined);
        } else {
            setModalEntityType("GRAMMAR");
            setModalEntityIdOrKey(item.id ?? undefined);
        }
        setModalOpen(true);
    };

    const trySetToggle = (
        next: boolean,
        setter: (v: boolean) => void,
        key: "vocab" | "reading" | "meaning"
    ) => {
        // nếu bật -> ok luôn
        if (next === true) {
            setter(true);
            return;
        }

        // mô phỏng trạng thái sau khi thay đổi
        let newShowVocab = showVocab;
        let newShowReading = showReading;
        let newShowMeaning = showMeaning;

        if (key === "vocab") newShowVocab = next;
        if (key === "reading") newShowReading = next;
        if (key === "meaning") newShowMeaning = next;

        // tính số toggle "áp dụng" cho entityType hiện tại sẽ còn bật
        let countOn = 0;
        if (entityType === "vocab") {
            if (newShowVocab) countOn++;
            if (newShowReading) countOn++;
            if (newShowMeaning) countOn++;
        } else if (entityType === "kanji") {
            if (newShowVocab) countOn++; // ký tự
            if (newShowReading) countOn++; // hán-vi
        } else {
            // grammar
            if (newShowVocab) countOn++; // pattern
            if (newShowMeaning) countOn++;
        }

        if (countOn === 0) {
            message.info("Phải có ít nhất 1 mục hiển thị.");
            return;
        }

        // nếu pass -> set
        setter(false);
    };

    // Render Kanji grid item (chữ + hán-vi)
    const renderKanjiGridItem = (k: IKanjiResponse) => {
        // Lưu ý: ẩn/hiện từng phần theo showVocab / showReading
        return (
            <div
                key={k.id}
                className="flex flex-col items-center justify-start gap-1 p-2 cursor-pointer hover:bg-white rounded"
                onClick={() => openModalForItem(k)}
            >
                {/* chữ Hán: chỉ hiển thị khi showVocab === true */}
                {showVocab && (
                    <div className="text-[20px] sm:text-[22px] md:text-[26px] lg:text-[28px] font-normal text-[#2b5bd7] font-mplus">
                        {k.characterName}
                    </div>
                )}

                {/* tên Hán-Việt: chỉ hiển thị khi showReading === true */}
                {showReading && (
                    <div className="text-xs md:text-sm text-gray-600 uppercase tracking-wider">
                        {k.sinoViName}
                    </div>
                )}
            </div>
        );
    };

    // render item card theo loại và toggles (vocab)
    const renderVocabItem = (v: IVocabResponse) => (
        <Card
            key={v.id}
            size="small"
            hoverable
            className="cursor-pointer"
            onClick={() => openModalForItem(v)}
        >
            <div className="flex flex-col gap-1">
                {showVocab && (
                    <div className="text-xl md:text-2xl font-normal text-[#2b5bd7] font-mplus">
                        {v.word}
                    </div>
                )}
                {showReading && (
                    <div className="text-sm text-gray-500">
                        {v.hiragana || v.katakana || v.romaji || "---"}
                    </div>
                )}
                {showMeaning && (
                    <div
                        className="text-sm text-gray-700 meaning-clamp-2-line whitespace-pre-wrap break-words"
                        // sanitize trước khi render
                        dangerouslySetInnerHTML={{
                            __html:
                                (v.meanings?.[0]?.meaningVn ??
                                    v.meanings
                                        ?.map((m) => m.meaningVn)
                                        .join("; ") ??
                                    "") ||
                                `<span class="text-gray-400">—</span>`,
                        }}
                    />
                )}
            </div>
        </Card>
    );

    // render grammar item: chỉ hiển thị pattern + meaning (bỏ phiên âm)
    const renderGrammarItem = (g: IGrammarResponse) => {
        const safeMeaning = g.meaning ? DOMPurify.sanitize(g.meaning) : "";
        return (
            <Card
                key={g.id}
                size="small"
                hoverable
                className="cursor-pointer"
                onClick={() => openModalForItem(g)}
            >
                <div className="flex flex-col gap-2">
                    {showVocab && (
                        <div className="text-lg font-medium text-[#2b5bd7]">
                            {g.pattern}
                        </div>
                    )}
                    {showMeaning && (
                        <div
                            className="text-sm text-gray-700 meaning-clamp-2-line whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{
                                __html:
                                    safeMeaning ||
                                    `<span class="text-gray-400">—</span>`,
                            }}
                        />
                    )}
                </div>
            </Card>
        );
    };

    const totalElements =
        entityType === "vocab"
            ? vocabPage?.totalElements ?? 0
            : entityType === "kanji"
            ? kanjiPage?.totalElements ?? 0
            : grammarPage?.totalElements ?? 0;

    return (
        <div className="p-3 md:p-0 md:mt-6">
            <Row gutter={16}>
                {/* SIDEBAR */}
                <Col xs={24} md={6}>
                    <Card
                        className="rounded-xl mb-3 md:mb-0"
                        bodyStyle={{ padding: 16 }}
                    >
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">
                                Chọn loại từ
                            </div>
                            <Radio.Group
                                value={entityType}
                                onChange={(e) => {
                                    setEntityType(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <div className="flex flex-col gap-3">
                                    <Radio value="vocab">Từ vựng</Radio>
                                    <Radio value="grammar">Ngữ pháp</Radio>
                                    <Radio value="kanji">Hán tự</Radio>
                                </div>
                            </Radio.Group>
                        </div>

                        {/* ===== Chọn cấp độ (Radio.Group - vertical) ===== */}
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">
                                Chọn cấp độ
                            </div>

                            <Radio.Group
                                value={level}
                                onChange={(e) => {
                                    setLevel(e.target.value);
                                    setPage(0);
                                }}
                            >
                                <div className="flex flex-col gap-2">
                                    {/* dùng Radio của antd để UI / keyboard / accessibility tốt hơn */}
                                    <Radio value="N5">N5</Radio>
                                    <Radio value="N4">N4</Radio>
                                    <Radio value="N3">N3</Radio>
                                    <Radio value="N2">N2</Radio>
                                    <Radio value="N1">N1</Radio>
                                </div>
                            </Radio.Group>
                        </div>

                        {/* giữ chỗ cho ads hoặc thông tin khác */}
                        <div className="mt-6">
                            {/* ví dụ: quảng cáo / thông tin phụ */}
                        </div>
                    </Card>
                </Col>

                {/* MAIN */}
                <Col xs={24} md={18}>
                    <Card className="rounded-xl" bodyStyle={{ padding: 12 }}>
                        {/** ---------- Thanh controls ngang (đã chuyển từ sidebar dọc) ---------- */}
                        <div className="flex flex-row items-start items-center justify-between mb-4">
                            {/* Controls hiển thị — đây là nơi duy nhất để điều khiển 'Hiển thị' */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {/* Hạn chế: không cho tắt checkbox cuối cùng -> check trước khi set */}
                                <Checkbox
                                    checked={showVocab}
                                    onChange={(e) => {
                                        const next = e.target.checked;
                                        trySetToggle(
                                            next,
                                            setShowVocab,
                                            "vocab"
                                        );
                                    }}
                                >
                                    {entityType === "grammar"
                                        ? "Mẫu câu"
                                        : entityType === "kanji"
                                        ? "Hán tự"
                                        : "Từ vựng"}
                                </Checkbox>

                                {/* Checkbox phiên âm chỉ hiện nếu không phải grammar */}
                                {entityType !== "grammar" && (
                                    <Checkbox
                                        checked={showReading}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            trySetToggle(
                                                next,
                                                setShowReading,
                                                "reading"
                                            );
                                        }}
                                    >
                                        {entityType === "kanji"
                                            ? "Hán-Việt"
                                            : "Phiên âm"}
                                    </Checkbox>
                                )}

                                {/* Chỉ hiển thị toggle 'Nghĩa' đối với vocab/grammar */}
                                {entityType !== "kanji" && (
                                    <Checkbox
                                        checked={showMeaning}
                                        onChange={(e) => {
                                            const next = e.target.checked;
                                            trySetToggle(
                                                next,
                                                setShowMeaning,
                                                "meaning"
                                            );
                                        }}
                                    >
                                        Nghĩa
                                    </Checkbox>
                                )}
                            </div>

                            {/* action icons */}
                            <div className="flex items-center gap-3">
                                <Tooltip title="Đảo thứ tự (chỉ trong trang hiện tại)">
                                    <button
                                        onClick={handleShuffle}
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-[#2b5bd7] hover:bg-[#d8e5ff] hover:shadow-md active:scale-95 transition-all duration-150"
                                    >
                                        <ShuffleOutlined className="text-lg" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Hiển thị lỗi nếu có */}
                        <div className="">
                            {errorMessage && (
                                <div className="mb-4">
                                    <Alert
                                        type="error"
                                        message="Có lỗi khi tải dữ liệu"
                                        description={errorMessage}
                                        showIcon
                                    />
                                </div>
                            )}

                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <Spin />
                                </div>
                            ) : (
                                <>
                                    {/** Nếu là Kanji: hiển thị grid “ký tự lớn + hán-vi” */}
                                    {entityType === "kanji" ? (
                                        <div className="px-2">
                                            <div
                                                className="grid gap-6"
                                                // cố định số cột theo kanjiCols (phone 6 / tablet 8 / desktop 10)
                                                style={{
                                                    gridTemplateColumns: `repeat(${
                                                        isNarrow ? 6 : kanjiCols
                                                    }, minmax(0, 1fr))`,
                                                    alignItems: "start",
                                                }}
                                            >
                                                {(
                                                    currentList as IKanjiResponse[]
                                                ).length === 0 ? (
                                                    <div
                                                        className="col-span-full flex items-center justify-center py-10 text-gray-400 text-center"
                                                        style={{
                                                            gridColumn:
                                                                "1 / -1",
                                                        }}
                                                    >
                                                        Không có dữ liệu
                                                    </div>
                                                ) : (
                                                    (
                                                        currentList as IKanjiResponse[]
                                                    ).map((k) =>
                                                        renderKanjiGridItem(k)
                                                    )
                                                )}
                                            </div>

                                            <div className="mt-6 flex justify-center">
                                                <Pagination
                                                    current={page + 1}
                                                    pageSize={PAGE_SIZE}
                                                    total={totalElements}
                                                    onChange={(p) =>
                                                        setPage(p - 1)
                                                    }
                                                    showSizeChanger={false}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        // Vocab / Grammar: mobile 1 column, md+ 2 columns; nếu isNarrow true (table narrow) ép giống mobile
                                        <>
                                            <div
                                                className={
                                                    isNarrow
                                                        ? "grid grid-cols-1 gap-2"
                                                        : "grid grid-cols-1 md:grid-cols-2 gap-2"
                                                }
                                            >
                                                {(
                                                    currentList as (
                                                        | IVocabResponse
                                                        | IGrammarResponse
                                                    )[]
                                                ).length === 0 ? (
                                                    <div className="col-span-2 text-center py-10 text-gray-400">
                                                        Không có dữ liệu
                                                    </div>
                                                ) : entityType === "vocab" ? (
                                                    (
                                                        currentList as IVocabResponse[]
                                                    ).map((v) =>
                                                        renderVocabItem(v)
                                                    )
                                                ) : (
                                                    (
                                                        currentList as IGrammarResponse[]
                                                    ).map((g) =>
                                                        renderGrammarItem(g)
                                                    )
                                                )}
                                            </div>

                                            <div className="mt-6 flex justify-center">
                                                <Pagination
                                                    current={page + 1}
                                                    pageSize={PAGE_SIZE}
                                                    total={totalElements}
                                                    onChange={(p) =>
                                                        setPage(p - 1)
                                                    }
                                                    showSizeChanger={false}
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Chỉ render modal khi đã có entityId để tránh lỗi type (string|number required) */}
            {modalEntityIdOrKey !== undefined && (
                <SearchResultModal
                    open={modalOpen}
                    entityType={modalEntityType as any}
                    entityId={modalEntityIdOrKey as string | number}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};

export default JlptPage;

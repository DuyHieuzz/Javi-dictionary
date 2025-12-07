import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TranslateBlock from "@/components/translate/TranslateBlock";
import type { TranslateBlockModel } from "@/types/backend";
import {
    callTranslateText,
    callTranslateImage,
    callGetTranslateHistory,
    callCheckGrammar,
    callDeleteSelectedTranslateHistory,
    callDeleteAllTranslateHistory,
} from "@/apis/translateApi";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { MdHistory } from "react-icons/md";
import { useAuthStore } from "@/stores/useAuthStore";
import no_history from "@/assets/no-history.png";

const makeId = () => Math.random().toString(36).slice(2, 10);

export default function TranslatePage() {
    const [blocks, setBlocks] = useState<TranslateBlockModel[]>(() => [
        {
            id: makeId(),
            sourceText: "",
            translatedText: "",
            sourceLang: "ja",
            targetLang: "vi",
            engine: "GOOGLE",
            loading: false,
            file: undefined,
            grammar: null,
        },
    ]);
    // Lấy token trực tiếp từ Zustand store
    const token = useAuthStore((state) => state.token);

    const [historyList, setHistoryList] = useState<any[]>([]);
    const [historyPage, setHistoryPage] = useState(0);
    const [historySize] = useState(20);
    const [historyHasMore, setHistoryHasMore] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const historyRef = useRef<HTMLDivElement | null>(null);

    const historyLoadingRef = useRef(false);
    const historyLoadingMoreRef = useRef(false);

    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [fillKeys, setFillKeys] = useState<Record<string, number>>({});

    const isProcessingRef = useRef(false);

    // snapshot per-block: lưu text/engine lần dịch gần nhất theo block id
    const previousTextRefPerBlock = useRef<Record<string, string>>({});
    const previousEngineRefPerBlock = useRef<Record<string, string>>({});
    const lastTranslateAtRefPerBlock = useRef<Record<string, number>>({});

    const fetchHistoryPage = useCallback(
        async (pageToLoad = 0, reset = false) => {
            if (reset) {
                if (historyLoadingRef.current) return;
            } else {
                if (historyLoadingMoreRef.current) return;
            }

            try {
                if (reset) {
                    historyLoadingRef.current = true;
                    setHistoryLoading(true);
                } else {
                    historyLoadingMoreRef.current = true;
                    setHistoryLoadingMore(true);
                }

                const res = await callGetTranslateHistory(
                    pageToLoad,
                    historySize,
                    "createdAt,desc"
                );
                const data = res?.data;
                let list: any[] = [];
                let last = true;
                let backendNumber = pageToLoad;

                if (data?.result?.content) {
                    list = data.result.content;
                    last = data.result.last ?? true;
                    backendNumber = data.result.number ?? pageToLoad;
                } else if (Array.isArray(data?.result)) {
                    list = data.result;
                    last = list.length < historySize;
                    backendNumber = pageToLoad;
                } else if (Array.isArray(data)) {
                    list = data;
                    last = list.length < historySize;
                    backendNumber = pageToLoad;
                } else {
                    if (data?.result) {
                        list = Array.isArray(data.result)
                            ? data.result
                            : [data.result];
                        last = list.length < historySize;
                    }
                }

                setHistoryList((prev) => (reset ? list : [...prev, ...list]));
                setHistoryHasMore(!last);
                setHistoryPage(backendNumber);
            } catch (err) {
                console.error("Lỗi load history:", err);
            } finally {
                if (reset) {
                    historyLoadingRef.current = false;
                    setHistoryLoading(false);
                } else {
                    historyLoadingMoreRef.current = false;
                    setHistoryLoadingMore(false);
                }
            }
        },
        [historySize]
    );

    useEffect(() => {
        if (!token) {
            return;
        }
        // Nếu đã có token thì gọi fetch lịch sử bình thường
        fetchHistoryPage(0, true);
    }, [token]); // chỉ chạy lại khi token thay đổi

    useEffect(() => {
        const el = historyRef.current;
        if (!el) return;
        const onScroll = () => {
            if (!historyHasMore || historyLoadingMoreRef.current) return;
            const threshold = 260;
            const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (remaining < threshold) {
                const nextPage = historyPage + 1;
                fetchHistoryPage(nextPage, false);
            }
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [historyHasMore, historyPage, fetchHistoryPage]);

    // ----- block helpers -----
    const addBlock = useCallback((data?: Partial<TranslateBlockModel>) => {
        const id = data?.id ?? makeId();
        setBlocks((prev) => [
            ...prev,
            {
                id,
                sourceText: "",
                translatedText: "",
                sourceLang: "ja",
                targetLang: "vi",
                engine: "GOOGLE",
                loading: false,
                file: undefined,
                grammar: null,
                ...data,
            },
        ]);
        return id;
    }, []);

    const updateBlock = useCallback(
        (id: string, patch: Partial<TranslateBlockModel>) => {
            setBlocks((prev) =>
                prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
            );
        },
        []
    );

    const deleteBlock = useCallback((id: string) => {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
        setFillKeys((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });

        // cleanup snapshot per-block
        delete previousTextRefPerBlock.current[id];
        delete previousEngineRefPerBlock.current[id];
        delete lastTranslateAtRefPerBlock.current[id];
    }, []);

    // ----- translate handler (text or image) -----
    // GHI CHÚ: hàm này nhận param `file` (tùy chọn) được truyền từ TranslateBlock khi người dùng chọn ảnh.
    const handleTranslate = useCallback(
        async (id: string, file?: File | undefined) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;

            if (isProcessingRef.current) return;

            const currentText = (blk.sourceText ?? "").trim();
            const currentEngine = blk.engine ?? "GOOGLE";

            // Lấy snapshot cho block này (fallback "")
            const prevTextForBlock = previousTextRefPerBlock.current[id] ?? "";
            const prevEngineForBlock =
                previousEngineRefPerBlock.current[id] ?? "";

            // Nếu không có file được truyền (file param undefined) và cũng không có blk.file
            // và nội dung giống snapshot trước -> chặn (đã dịch rồi)
            if (
                typeof file === "undefined" &&
                !blk.file &&
                currentText === prevTextForBlock &&
                currentEngine === prevEngineForBlock
            ) {
                toast.info("Văn bản chưa thay đổi — đã dịch trước đó.");
                return;
            }

            // Nếu không có file param nhưng blk.file tồn tại, we may still use image branch below

            isProcessingRef.current = true;
            updateBlock(id, { loading: true });

            try {
                let translated = "";

                // Logic quyết định (đã cố định):
                // - Nếu có param `file` truyền vào → dùng nhánh dịch ảnh (vì người dùng vừa chọn ảnh)
                // - Nếu đã có blk.file VÀ người dùng KHÔNG sửa sourceText từ lần dịch trước (currentText === previousTextRef.current) → dùng nhánh dịch ảnh
                // - Nếu có blk.file NHƯNG người dùng đã chỉnh sửa sourceText → dùng nhánh dịch văn bản (và xóa file)
                // - Nếu không có file → dịch văn bản bình thường
                const shouldUseImageBranch =
                    // Nếu hàm được gọi với param file (khi chọn ảnh) => bắt buộc sử dụng image branch
                    typeof file !== "undefined"
                        ? true
                        : // Nếu không có param file, nhưng block đang có blk.file AND user chưa chỉnh sourceText so với snapshot
                          !!blk.file && currentText === prevTextForBlock;

                if (
                    !!blk.file &&
                    !shouldUseImageBranch &&
                    typeof file === "undefined"
                ) {
                    // blk.file exists but user edited sourceText -> clear file and run text branch
                    updateBlock(id, { file: undefined });
                }

                if (shouldUseImageBranch && (file ?? blk.file)) {
                    // ---------- image translation branch (OCR) ----------
                    const fileToSend = (file ?? blk.file) as File;

                    const res = await callTranslateImage({
                        file: fileToSend,
                        sourceLang: blk.sourceLang as any,
                        targetLang: blk.targetLang as any,
                        engine: blk.engine,
                    } as any);

                    const r = res?.data?.result;

                    if (typeof r === "string") {
                        translated = r;
                    } else if (r && typeof r.translatedText === "string") {
                        translated = r.translatedText;
                    } else {
                        translated = "";
                    }

                    const returnedSourceText =
                        r && typeof r.sourceText === "string"
                            ? r.sourceText
                            : undefined;
                    const returnedSourceLang =
                        r && r.sourceLang ? (r.sourceLang as any) : undefined;
                    const returnedTargetLang =
                        r && r.targetLang ? (r.targetLang as any) : undefined;

                    updateBlock(id, {
                        translatedText: translated,
                        ...(returnedSourceText !== undefined
                            ? { sourceText: returnedSourceText }
                            : {}),
                        ...(returnedSourceLang !== undefined
                            ? { sourceLang: returnedSourceLang }
                            : {}),
                        ...(returnedTargetLang !== undefined
                            ? { targetLang: returnedTargetLang }
                            : {}),
                    });
                } else {
                    // ---------- text translation ----------
                    const payload = {
                        sourceText: blk.sourceText ?? "",
                        sourceLang: blk.sourceLang ?? "ja",
                        targetLang: blk.targetLang ?? "vi",
                        engine: blk.engine ?? "GOOGLE",
                    };

                    const res = await callTranslateText(payload as any);
                    const r = res?.data?.result;

                    if (typeof r === "string") {
                        translated = r;
                    } else if (r && typeof r.translatedText === "string") {
                        translated = r.translatedText;
                    } else {
                        translated = "";
                    }

                    updateBlock(id, { translatedText: translated });
                }

                // sau khi dịch thành công -> lưu snapshot per-block
                previousTextRefPerBlock.current[id] = currentText;
                previousEngineRefPerBlock.current[id] = currentEngine;
                lastTranslateAtRefPerBlock.current[id] = Date.now();

                setFillKeys((prev) => ({ ...prev, [id]: Date.now() }));

                try {
                    await fetchHistoryPage(0, true);
                } catch (e) {
                    // ignore
                }
            } catch (err) {
                toast.error("Dịch thất bại");
            } finally {
                updateBlock(id, { loading: false });
                isProcessingRef.current = false;
            }
        },
        [blocks, updateBlock, fetchHistoryPage]
    );

    // ----- kiểm tra ngữ pháp -----
    const handleCheckGrammar = useCallback(
        async (id: string) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;
            try {
                const res = await callCheckGrammar({
                    sourceText: blk.sourceText ?? "",
                    targetLang: "vi",
                });
                const grammar = res?.data?.result ?? null;
                updateBlock(id, { grammar });
            } catch (err) {
                toast.error("Kiểm tra ngữ pháp thất bại");
            }
        },
        [blocks, updateBlock]
    );

    // ----- swap source/target -----
    const handleSwap = useCallback(
        (id: string) => {
            const blk = blocks.find((b) => b.id === id);
            if (!blk) return;
            updateBlock(id, {
                sourceLang: blk.targetLang,
                targetLang: blk.sourceLang,
                sourceText: blk.translatedText ?? "",
                translatedText: blk.sourceText ?? "",
            });
            // reset snapshot cho block này khi đổi chiều dịch
            previousTextRefPerBlock.current[id] = "";
            previousEngineRefPerBlock.current[id] = "";
            lastTranslateAtRefPerBlock.current[id] = 0;

            setFillKeys((prev) => ({ ...prev, [id]: Date.now() }));
        },
        [blocks, updateBlock]
    );

    const renderedBlocks = useMemo(() => blocks, [blocks]);

    // -------------------------
    // HISTORY: delete handling
    // -------------------------
    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onDeleteSelected = async () => {
        if (!selectedIds.length) return;

        // Nếu chưa đăng nhập thì không gọi API xóa
        if (!token) {
            toast.warning("Vui lòng đăng nhập để xóa lịch sử.");
            return;
        }

        try {
            await callDeleteSelectedTranslateHistory(selectedIds);
            setHistoryList((prev) =>
                prev.filter((it: any) => !selectedIds.includes(it.id))
            );
            setSelectedIds([]);
            setDeleteMode(false);
            fetchHistoryPage(0, true);
        } catch (err) {
            console.error("Lỗi xóa lịch sử đã chọn:", err);
            toast.error("Xóa thất bại");
        }
    };

    const onDeleteAll = async () => {
        // Nếu chưa đăng nhập thì không gọi API xóa
        if (!token) {
            toast.warning("Vui lòng đăng nhập để xóa lịch sử.");
            return;
        }

        try {
            await callDeleteAllTranslateHistory();
            setHistoryList([]);
            setSelectedIds([]);
            setDeleteMode(false);
            setHistoryHasMore(false);
            toast.success("Đã xóa tất cả lịch sử");
        } catch (err) {
            console.error("Lỗi xóa tất cả lịch sử:", err);
            toast.error("Xóa tất cả thất bại");
        }
    };

    // -------------------------
    // formatTime
    // -------------------------
    const formatTime = (v?: any) => {
        if (!v && v !== 0) return "";
        try {
            // case: ISO string
            if (typeof v === "string") {
                const d = dayjs(v);
                if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
                return v;
            }

            if (typeof v === "number") {
                const d = dayjs(v);
                if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
                return String(v);
            }

            if (Array.isArray(v)) {
                const [y, m, d, hh = 0, mm = 0, ss = 0] = v.map((x) =>
                    Number(x)
                );
                // guard values
                if (
                    !Number.isFinite(y) ||
                    !Number.isFinite(m) ||
                    !Number.isFinite(d)
                ) {
                    return String(v);
                }
                const dt = dayjs(
                    new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0)
                );
                if (dt.isValid()) return dt.format("DD/MM/YYYY HH:mm");
                return String(v);
            }

            // fallback
            const d = dayjs(v);
            if (d.isValid()) return d.format("DD/MM/YYYY HH:mm");
            return String(v);
        } catch {
            return String(v);
        }
    };

    return (
        <div className="w-full px-2 pb-20 pt-3">
            <div className="space-y-6">
                {renderedBlocks.map((b) => (
                    <div key={b.id}>
                        <TranslateBlock
                            block={b}
                            removable={renderedBlocks.length > 1}
                            onChange={(patch) => updateBlock(b.id, patch)}
                            onTranslate={(file) => handleTranslate(b.id, file)}
                            onSwap={() => handleSwap(b.id)}
                            onDelete={() => deleteBlock(b.id)}
                            onCheckGrammar={() => handleCheckGrammar(b.id)}
                            isPremium={true}
                            fillKey={fillKeys[b.id]}
                            onClearSnapshot={() => {
                                previousTextRefPerBlock.current[b.id] = "";
                                previousEngineRefPerBlock.current[b.id] = "";
                                lastTranslateAtRefPerBlock.current[b.id] = 0;
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center">
                <button
                    onClick={() => addBlock()}
                    className="px-4 py-2 bg-white border rounded"
                >
                    + Thêm bản dịch
                </button>
            </div>

            {/* HISTORY: header controls */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-center font-normal bg-[#ffa800] text-white text-[15px] py-[6px] px-3 rounded-full">
                        <MdHistory className="text-xl mr-[2px]" />
                        Lịch sử
                    </h2>
                    {/* Hiển thị nhóm nút Xóa CHỈ khi đã đăng nhập */}
                    {token && (
                        <div className="flex items-center gap-2">
                            {!deleteMode ? (
                                <button
                                    onClick={() => {
                                        setDeleteMode(true);
                                        setSelectedIds([]);
                                    }}
                                    className="px-3 py-1 rounded-md bg-red-600 text-white"
                                >
                                    Xóa lịch sử
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setDeleteMode(false);
                                            setSelectedIds([]);
                                        }}
                                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={onDeleteSelected}
                                        disabled={!selectedIds.length}
                                        className="px-3 py-1 rounded-md bg-red-600 text-white disabled:opacity-60"
                                    >
                                        Xóa đã chọn
                                    </button>
                                    <button
                                        onClick={onDeleteAll}
                                        className="px-3 py-1 rounded-md bg-red-500 text-white"
                                    >
                                        Xóa tất cả
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div
                    ref={historyRef}
                    className="bg-white rounded-lg border p-3"
                >
                    {historyLoading && historyList.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">
                            Đang tải...
                        </div>
                    ) : historyList.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-5">
                            <img
                                className="w-[50px] h-[50px]"
                                src={no_history}
                                alt="no-history"
                            />
                            <div className="mt-2 text-center text-gray-500">
                                Chưa có lịch sử
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {historyList.map((h: any) => {
                                const sourceText =
                                    h.keyword ?? h.sourceText ?? h.text ?? "-";
                                const key =
                                    h.id ?? `${h.createdAt}-${Math.random()}`;

                                return (
                                    <div
                                        key={key}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (deleteMode) {
                                                if (h.id) toggleSelect(h.id);
                                                return;
                                            }
                                            const source = h;
                                            const sourceTextVal =
                                                source.keyword ??
                                                source.sourceText ??
                                                source.text ??
                                                "";
                                            const sourceLang =
                                                source.sourceLang ??
                                                source.langFrom ??
                                                "ja";
                                            const targetLang =
                                                source.targetLang ??
                                                source.langTo ??
                                                "vi";
                                            const id = makeId();
                                            setBlocks((prev) => [
                                                ...prev,
                                                {
                                                    id,
                                                    sourceText: sourceTextVal,
                                                    translatedText:
                                                        source.translatedText ??
                                                        source.result ??
                                                        "",
                                                    sourceLang,
                                                    targetLang,
                                                    engine:
                                                        source.engine ??
                                                        "GOOGLE",
                                                    loading: false,
                                                    file: undefined,
                                                    grammar: null,
                                                },
                                            ]);
                                            setFillKeys((prev) => ({
                                                ...prev,
                                                [id]: Date.now(),
                                            }));
                                            // đồng bộ snapshot per-block ở parent để ngăn gọi API không cần thiết
                                            previousTextRefPerBlock.current[
                                                id
                                            ] = String(
                                                sourceTextVal ?? ""
                                            ).trim();
                                            previousEngineRefPerBlock.current[
                                                id
                                            ] = String(
                                                source.engine ?? "GOOGLE"
                                            );
                                            lastTranslateAtRefPerBlock.current[
                                                id
                                            ] = Date.now();
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                if (deleteMode) {
                                                    if (h.id)
                                                        toggleSelect(h.id);
                                                    return;
                                                }
                                                if (h.id) {
                                                    const source = h;
                                                    const sourceTextVal =
                                                        source.keyword ??
                                                        source.sourceText ??
                                                        source.text ??
                                                        "";
                                                    const sourceLang =
                                                        source.sourceLang ??
                                                        source.langFrom ??
                                                        "ja";
                                                    const targetLang =
                                                        source.targetLang ??
                                                        source.langTo ??
                                                        "vi";
                                                    const id = makeId();
                                                    setBlocks((prev) => [
                                                        ...prev,
                                                        {
                                                            id,
                                                            sourceText:
                                                                sourceTextVal,
                                                            translatedText:
                                                                source.translatedText ??
                                                                source.result ??
                                                                "",
                                                            sourceLang,
                                                            targetLang,
                                                            engine:
                                                                source.engine ??
                                                                "GOOGLE",
                                                            loading: false,
                                                            file: undefined,
                                                            grammar: null,
                                                        },
                                                    ]);
                                                    setFillKeys((prev) => ({
                                                        ...prev,
                                                        [id]: Date.now(),
                                                    }));
                                                    // đồng bộ snapshot per-block ở parent để ngăn gọi API không cần thiết
                                                    previousTextRefPerBlock.current[
                                                        id
                                                    ] = String(
                                                        sourceTextVal ?? ""
                                                    ).trim();
                                                    previousEngineRefPerBlock.current[
                                                        id
                                                    ] = String(
                                                        source.engine ??
                                                            "GOOGLE"
                                                    );
                                                    lastTranslateAtRefPerBlock.current[
                                                        id
                                                    ] = Date.now();
                                                }
                                            }
                                        }}
                                        className="p-3 border rounded cursor-pointer hover:bg-gray-50"
                                        aria-label={`Mở lịch sử: ${sourceText}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs text-gray-500">
                                                {formatTime(
                                                    h.createdAt ??
                                                        h.searchedAt ??
                                                        h.createdDate
                                                )}
                                            </div>

                                            {deleteMode ? (
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        h.id
                                                            ? selectedIds.includes(
                                                                  h.id
                                                              )
                                                            : false
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (h.id)
                                                            toggleSelect(h.id);
                                                    }}
                                                    className="shrink-0"
                                                    aria-label="Chọn lịch sử"
                                                />
                                            ) : null}
                                        </div>

                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {sourceText}
                                        </div>

                                        <div className="text-xs text-gray-400 mt-1">
                                            <span className="capitalize">
                                                {(() => {
                                                    if (!h.entityType)
                                                        return "";
                                                    const k = String(
                                                        h.entityType
                                                    ).toUpperCase();
                                                    if (
                                                        k === "WORD" ||
                                                        k === "VOCABULARY"
                                                    )
                                                        return "Từ vựng";
                                                    if (k === "KANJI")
                                                        return "Chữ Hán";
                                                    if (k === "GRAMMAR")
                                                        return "Ngữ pháp";
                                                    return String(h.entityType);
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {historyLoadingMore && (
                                <div className="py-4 text-center">
                                    Đang tải thêm...
                                </div>
                            )}

                            {!historyHasMore && historyList.length > 0 && (
                                <div className="py-3 text-center text-gray-400">
                                    Đã hiển thị tất cả lịch sử
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

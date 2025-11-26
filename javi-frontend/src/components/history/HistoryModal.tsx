import { Modal, Spin, Empty } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MdHistory } from "react-icons/md";
import { FaRegClock } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { AiOutlineClose } from "react-icons/ai";

import {
    callGetHistory,
    callDeleteHistory,
    callDeleteAllHistory,
} from "@/apis/historyApi";

import { callGetMyComments, callGetMyLikedComments } from "@/apis/commentApi";

import {
    IHistorySearchItem,
    IPageResponse,
    ICommentResponse,
} from "@/types/backend";

import SearchResultModal from "@/components/search/SearchResultModal";
import HistoryPickerModal from "@/components/history/HistoryPickerModal";

import dayjs from "dayjs";
import { GoComment } from "react-icons/go";
import { IoIosHeartEmpty } from "react-icons/io";

/**
 * HistoryModal
 *
 * - 3 tab: Lịch sử | Góp ý | Góp ý đã thích
 * - Lịch sử: danh sách lịch sử (infinite scroll) + xóa
 * - Góp ý: danh sách comment của user (infinite scroll)
 * - Góp ý đã thích: danh sách comment đã liked của user (infinite scroll)
 *
 * Khi click 1 item:
 * - Nếu history có entityId -> mở modal chi tiết
 * - Nếu history không có entityId -> mở Picker modal
 * - Nếu click comment -> mở modal chi tiết bằng comment.entityType + comment.entityId
 *   (với KANJI ưu tiên dùng entityName nếu có)
 */

type ActiveTab = "HISTORY" | "COMMENTS" | "LIKED";

interface Props {
    open: boolean;
    onClose: () => void;
    pageSize?: number;
    /**
     * Callback được gọi khi có thay đổi (xóa) để component cha refresh dữ liệu.
     */
    onHistoryChanged?: () => void;
}

export default function HistoryModal({
    open,
    onClose,
    pageSize = 15,
    onHistoryChanged,
}: Props) {
    const navigate = useNavigate();

    // refs cho từng panel để gắn infinite scroll riêng biệt
    const historyRef = useRef<HTMLDivElement | null>(null);
    const commentsRef = useRef<HTMLDivElement | null>(null);
    const likedRef = useRef<HTMLDivElement | null>(null);

    const [activeTab, setActiveTab] = useState<ActiveTab>("HISTORY");
    // helper boolean tránh TS narrow false-positive
    const isHistory = activeTab === "HISTORY";
    const isComments = activeTab === "COMMENTS";
    const isLiked = activeTab === "LIKED";

    // trạng thái chung loading
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // trạng thái lịch sử
    const [items, setItems] = useState<IHistorySearchItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // trạng thái comment (dùng cho Góp ý và Góp ý đã thích)
    const [comments, setComments] = useState<ICommentResponse[]>([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsHasMore, setCommentsHasMore] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(false);

    // modal chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] = useState<any>("WORD");
    const [detailEntityIdOrName, setDetailEntityIdOrName] = useState<
        number | string
    >(0);

    // picker (Mazii-like)
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerKeyword, setPickerKeyword] = useState<string>("");
    const [pickerDefaultTab, setPickerDefaultTab] = useState<
        "KANJI" | "WORD" | "GRAMMAR" | null
    >(null);

    // -------------------------
    // LẤY LỊCH SỬ & INFINITE
    // -------------------------
    const fetchHistoryPage = async (pageToLoad = 1, reset = false) => {
        if (!isHistory) return;
        if (loading || loadingMore) return;
        try {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            const res = await callGetHistory(pageToLoad, pageSize);
            const data = res.data?.result as
                | IPageResponse<IHistorySearchItem>
                | undefined;
            const list = data?.content ?? [];

            setItems((prev) => (reset ? list : [...prev, ...list]));
            const isLast = data?.last ?? true;
            setHasMore(!isLast);

            const backendNumber = data?.number ?? pageToLoad - 1;
            setPage(backendNumber + 1);
        } catch (err) {
            console.error("Lỗi khi tải lịch sử:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // -------------------------
    // COMMENTS (góp ý của tôi)
    // -------------------------
    const fetchCommentsPage = async (p = 1, reset = false) => {
        if (!isComments) return;
        if (commentsLoading) return;
        try {
            setCommentsLoading(true);
            const res = await callGetMyComments(p, 20);
            const data = res.data?.result;
            const list = data?.content ?? [];
            setComments((prev) => (reset ? list : [...prev, ...list]));
            setCommentsHasMore(!(data?.last ?? true));
            setCommentsPage((data?.number ?? p - 1) + 1);
        } catch (err) {
            console.error("Lỗi load comments:", err);
            setComments([]);
            setCommentsHasMore(false);
        } finally {
            setCommentsLoading(false);
        }
    };

    // -------------------------
    // LIKED COMMENTS (góp ý đã thích)
    // -------------------------
    const fetchLikedCommentsPage = async (p = 1, reset = false) => {
        if (!isLiked) return;
        if (commentsLoading) return;
        try {
            setCommentsLoading(true);
            const res = await callGetMyLikedComments(p, 20);
            const data = res.data?.result;
            const list = data?.content ?? [];
            setComments((prev) => (reset ? list : [...prev, ...list]));
            setCommentsHasMore(!(data?.last ?? true));
            setCommentsPage((data?.number ?? p - 1) + 1);
        } catch (err) {
            console.error("Lỗi load liked comments:", err);
            setComments([]);
            setCommentsHasMore(false);
        } finally {
            setCommentsLoading(false);
        }
    };

    // -------------------------
    // Khi modal mở hoăc tab thay đổi -> load dữ liệu tab tương ứng
    // -------------------------
    useEffect(() => {
        if (!open) return;
        // khi modal mở, load theo tab đang active
        if (isHistory) {
            fetchHistoryPage(1, true);
        } else if (isComments) {
            fetchCommentsPage(1, true);
        } else if (isLiked) {
            fetchLikedCommentsPage(1, true);
        }
    }, [open, activeTab]);

    // -------------------------
    // infinite scroll HISTORY
    // -------------------------
    useEffect(() => {
        // chỉ gắn listener khi element tồn tại
        const el = historyRef.current;
        if (!el) return;

        let throttleTimeout: any = null;

        // handler chính (chỉ quyết định gọi khi guard ok)
        const onScroll = () => {
            // guard tổng quát: nếu đang load hoặc không còn page thì không gọi
            if (!hasMore || loading || loadingMore) return;

            const threshold = 260;
            const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

            if (remaining < threshold) {
                fetchHistoryPage(page + 1, false);
            }
        };

        // throttle đơn giản để giảm tần suất xử lý khi user scroll nhanh
        const throttled = () => {
            if (throttleTimeout) return;
            throttleTimeout = window.setTimeout(() => {
                throttleTimeout = null;
                onScroll();
            }, 120);
        };

        // luôn add listener khi element có mặt (không phụ thuộc hasMore)
        el.addEventListener("scroll", throttled);

        // kiểm tra ngay lần đầu (trường hợp content ngắn, cần load tiếp)
        setTimeout(() => {
            try {
                const remaining =
                    el.scrollHeight - el.scrollTop - el.clientHeight;
                if (remaining < 260 && hasMore && !loading && !loadingMore) {
                    fetchHistoryPage(page + 1, false);
                }
            } catch (e) {}
        }, 50);

        return () => {
            el.removeEventListener("scroll", throttled);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, [page, hasMore, loading, loadingMore, isHistory, open]);

    // -------------------------
    // infinite scroll COMMENTS (góp ý của tôi)
    // -------------------------
    useEffect(() => {
        const el = commentsRef.current;
        if (!el) return;

        let throttleTimeout: any = null;

        const onScroll = () => {
            if (!commentsHasMore || commentsLoading) return;

            const threshold = 260;
            const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

            if (remaining < threshold) {
                fetchCommentsPage(commentsPage + 1, false);
            }
        };

        const throttled = () => {
            if (throttleTimeout) return;
            throttleTimeout = window.setTimeout(() => {
                throttleTimeout = null;
                onScroll();
            }, 120);
        };

        el.addEventListener("scroll", throttled);

        // kiểm tra ngay lần đầu
        setTimeout(() => {
            try {
                const remaining =
                    el.scrollHeight - el.scrollTop - el.clientHeight;
                if (remaining < 260 && commentsHasMore && !commentsLoading) {
                    fetchCommentsPage(commentsPage + 1, false);
                }
            } catch (e) {}
        }, 50);

        return () => {
            el.removeEventListener("scroll", throttled);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
        // dependencies
    }, [commentsPage, commentsHasMore, commentsLoading, isComments, open]);

    // -------------------------
    // infinite scroll LIKED (góp ý đã thích)
    // -------------------------
    useEffect(() => {
        const el = likedRef.current;
        if (!el) return;

        let throttleTimeout: any = null;

        const onScroll = () => {
            if (!commentsHasMore || commentsLoading) return;

            const threshold = 260;
            const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;

            if (remaining < threshold) {
                fetchLikedCommentsPage(commentsPage + 1, false);
            }
        };

        const throttled = () => {
            if (throttleTimeout) return;
            throttleTimeout = window.setTimeout(() => {
                throttleTimeout = null;
                onScroll();
            }, 120);
        };

        el.addEventListener("scroll", throttled);

        // kiểm tra ngay lần đầu
        setTimeout(() => {
            try {
                const remaining =
                    el.scrollHeight - el.scrollTop - el.clientHeight;
                if (remaining < 260 && commentsHasMore && !commentsLoading) {
                    fetchLikedCommentsPage(commentsPage + 1, false);
                }
            } catch (e) {}
        }, 50);

        return () => {
            el.removeEventListener("scroll", throttled);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
        // dependencies
    }, [commentsPage, commentsHasMore, commentsLoading, isLiked, open]);

    // -------------------------
    // XỬ LÝ XÓA (history)
    // -------------------------
    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const onDeleteSelected = async () => {
        if (!selectedIds.length) return;
        try {
            await callDeleteHistory(selectedIds);
            setItems((prev) =>
                prev.filter((it) => !selectedIds.includes(it.id))
            );
            setSelectedIds([]);
            setDeleteMode(false);
            onHistoryChanged?.();
        } catch (err) {
            console.error("Lỗi xóa lịch sử đã chọn:", err);
        }
    };

    const onDeleteAll = async () => {
        try {
            await callDeleteAllHistory();
            setItems([]);
            setSelectedIds([]);
            setDeleteMode(false);
            setHasMore(false);
            onHistoryChanged?.();
        } catch (err) {
            console.error("Lỗi xóa tất cả lịch sử:", err);
        }
    };

    // -------------------------
    // MỞ CHI TIẾT HOẶC PICKER
    // -------------------------
    const openDetailFromHistory = (item: IHistorySearchItem) => {
        // nếu có entityId thì thường mở chi tiết bằng id...
        // nhưng nếu là KANJI và có entityName (ký tự) -> ưu tiên gửi characterName
        const typeKey = String(item.entityType ?? "").toUpperCase();

        if (item.entityId !== undefined && item.entityId !== null) {
            if (typeKey === "KANJI" && item.entityName) {
                // ưu tiên ký tự (entityName) cho Kanji
                setDetailEntityType(item.entityType);
                setDetailEntityIdOrName(item.entityName);
                setDetailOpen(true);
                return;
            }

            // mặc định: gửi id
            setDetailEntityType(item.entityType);
            setDetailEntityIdOrName(item.entityId);
            setDetailOpen(true);
            return;
        }

        // nếu không có entityId -> mở picker giống Mazii (tìm theo keyword/entityName)
        const kw = item.keyword ?? item.entityName ?? "";
        if (!kw) return;

        let tab: "KANJI" | "WORD" | "GRAMMAR" | null = null;
        if (item.entityType) {
            const key = String(item.entityType).toUpperCase();
            if (key === "KANJI") tab = "KANJI";
            else if (key === "WORD" || key === "VOCABULARY") tab = "WORD";
            else if (key === "GRAMMAR") tab = "GRAMMAR";
        }

        setPickerKeyword(kw);
        setPickerDefaultTab(tab);
        setPickerOpen(true);
    };

    const onPickerSelect = (payload: {
        entityType: "KANJI" | "WORD" | "GRAMMAR";
        id?: number | string;
        name?: string;
    }) => {
        if (
            payload.id !== undefined &&
            payload.id !== null &&
            String(payload.id).trim() !== ""
        ) {
            setPickerOpen(false);
            setDetailEntityType(payload.entityType);
            setDetailEntityIdOrName(payload.id as number | string);
            setDetailOpen(true);
            return;
        }

        const q = payload.name ?? "";
        if (!q) {
            setPickerOpen(false);
            return;
        }

        setPickerOpen(false);
        onClose();
        const params = new URLSearchParams();
        params.set("keyword", q);
        params.set("type", payload.entityType ?? "WORD");
        navigate(`/search?${params.toString()}`);
    };

    // click 1 comment -> mở detail theo comment.entityType + entityId (KANJI ưu tiên entityName)
    const onClickComment = (c: ICommentResponse) => {
        if (!c) return;

        const key = String(c.entityType ?? "").toUpperCase();

        // Nếu là KANJI ưu tiên entityName (ký tự) nếu có
        if (key === "KANJI") {
            if (c.entityName) {
                setDetailEntityType(c.entityType);
                setDetailEntityIdOrName(c.entityName);
                setDetailOpen(true);
                return;
            }
            if (c.entityId !== undefined && c.entityId !== null) {
                setDetailEntityType(c.entityType);
                setDetailEntityIdOrName(c.entityId);
                setDetailOpen(true);
                return;
            }
            return;
        }

        // với loại khác ưu tiên id, không có thì entityName
        if (c.entityId !== undefined && c.entityId !== null) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityId);
            setDetailOpen(true);
            return;
        }

        if (c.entityName) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityName);
            setDetailOpen(true);
            return;
        }

        // không có gì để mở
    };

    // format date cho comment: chỉ lấy ngày (dd/MM/YYYY), bỏ phần giờ
    const formatCommentDateOnly = (v?: string | null) => {
        if (!v) return "";
        const d = dayjs(v);
        if (d.isValid()) return d.format("DD/MM/YYYY");
        return String(v);
    };

    const formatTime = (arr?: number[] | string | null) => {
        if (!arr) return "";
        if (typeof arr === "string") return arr;
        try {
            const [y, m, d, hh = 0, mm = 0, ss = 0] = arr;
            return dayjs(new Date(y, m - 1, d, hh, mm, ss)).format(
                "DD/MM/YYYY HH:mm"
            );
        } catch {
            return "";
        }
    };

    const entityTypeLabel = (t?: string | null) => {
        if (!t) return "";
        const key = String(t).toUpperCase();
        if (key === "WORD") return "Từ vựng";
        if (key === "KANJI") return "Chữ Hán";
        if (key === "GRAMMAR") return "Ngữ pháp";
        if (key === "VOCABULARY") return "Từ vựng";
        return String(t);
    };

    // helper class cho button tab
    const btnTabClass = (tab: ActiveTab) =>
        `px-3 py-1 rounded-full text-[15px] flex items-center gap-1 ${
            activeTab === tab
                ? "bg-[#ffa800] text-white"
                : "bg-transparent text-gray-600"
        }`;

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                footer={null}
                width={820}
                className="rounded-2xl overflow-hidden history-modal"
                destroyOnClose={false}
                closable={false}
                bodyStyle={{ padding: 0 }}
                style={{ padding: 0 }}
                centered
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border-b">
                    {/* left: tabs */}
                    <div className="flex items-center gap-3 rounded-full p-2 bg-[#f0f2f5] flex-wrap">
                        <button
                            className={btnTabClass("HISTORY")}
                            onClick={() => setActiveTab("HISTORY")}
                        >
                            <MdHistory className="text-[22px]" />
                            <span>Lịch sử</span>
                        </button>

                        <button
                            className={btnTabClass("COMMENTS")}
                            onClick={() => setActiveTab("COMMENTS")}
                        >
                            <GoComment className="text-[22px]" />
                            Góp ý
                        </button>

                        <button
                            className={btnTabClass("LIKED")}
                            onClick={() => setActiveTab("LIKED")}
                        >
                            <IoIosHeartEmpty className="text-[22px]" />
                            Góp ý đã thích
                        </button>
                    </div>

                    {/* right: controls */}
                    <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        {/* --- giữ chỗ khi màn nhỏ để dấu X luôn nằm bên phải --- */}
                        <div className="flex-1 sm:hidden"></div>

                        {/* Chỉ hiện controls xóa khi đang ở tab HISTORY */}
                        {isHistory && (
                            <>
                                {!deleteMode ? (
                                    <button
                                        onClick={() => {
                                            setDeleteMode(true);
                                            setSelectedIds([]);
                                        }}
                                        className="flex items-center gap-1 text-white text-[15px] bg-red-600 px-3 py-1 rounded-md"
                                    >
                                        <FiTrash2 className="text-[18px]" /> Xóa
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
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800 text-[20px]"
                        >
                            <AiOutlineClose />
                        </button>
                    </div>
                </div>

                {/* Body: container relative để 3 panel xếp chồng và animate mượt */}
                <div className="relative h-[560px] bg-white">
                    {/* PANEL LỊCH SỬ */}
                    <div
                        ref={historyRef}
                        className={`absolute inset-0 overflow-auto transition-all duration-300 ease-in-out transform ${
                            isHistory
                                ? "opacity-100 translate-y-0 z-30 pointer-events-auto"
                                : "opacity-0 -translate-y-2 z-10 pointer-events-none"
                        }`}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center py-16">
                                <Spin />
                            </div>
                        ) : (
                            <div>
                                {items.map((it) => (
                                    <div
                                        key={it.id}
                                        className="flex items-center gap-3 px-3 py-2 border-b hover:bg-gray-50 cursor-pointer"
                                        onClick={() => {
                                            if (!deleteMode)
                                                openDetailFromHistory(it);
                                        }}
                                    >
                                        {deleteMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    it.id
                                                )}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(it.id);
                                                }}
                                                className="shrink-0"
                                            />
                                        )}

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="font-normal text-[15px]"
                                                    style={{
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {it.entityName ??
                                                        it.keyword ??
                                                        "(không tên)"}
                                                </div>

                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <FaRegClock />
                                                    <span>
                                                        {formatTime(
                                                            it.searchedAt
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-400 mt-1">
                                                <span className="capitalize">
                                                    {entityTypeLabel(
                                                        it.entityType
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {items.length === 0 && (
                                    <div className="py-10 text-center text-gray-500">
                                        Chưa có lịch sử
                                    </div>
                                )}

                                {loadingMore && (
                                    <div className="py-4 text-center">
                                        <Spin />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PANEL GÓP Ý */}
                    <div
                        ref={commentsRef}
                        className={`absolute inset-0 overflow-auto transition-all duration-300 ease-in-out transform ${
                            isComments
                                ? "opacity-100 translate-y-0 z-30 pointer-events-auto"
                                : "opacity-0 translate-y-2 z-10 pointer-events-none"
                        }`}
                    >
                        {commentsLoading ? (
                            <div className="py-8 flex justify-center">
                                <Spin />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="p-6">
                                <Empty
                                    description={
                                        isComments
                                            ? "Chưa có góp ý"
                                            : "Chưa có góp ý đã thích"
                                    }
                                />
                            </div>
                        ) : (
                            <div>
                                {comments.map((c) => {
                                    const commentDate =
                                        c.createdAt ??
                                        (c as any).createdDate ??
                                        null;
                                    const entityName =
                                        (c as any).entityName ?? "";
                                    return (
                                        <div
                                            key={c.id}
                                            className="flex items-start gap-3 py-2 px-3 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => onClickComment(c)}
                                        >
                                            {/* Ẩn avatar để giao diện gọn */}
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-400 ">
                                                    <span>
                                                        {entityTypeLabel(
                                                            c.entityType
                                                        )}
                                                    </span>
                                                    {entityName ? (
                                                        <span className="mx-1">
                                                            :
                                                        </span>
                                                    ) : null}
                                                    {entityName ? (
                                                        <span className="font-medium text-[15px] text-gray-600">
                                                            {entityName}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                                    {c.content}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {formatCommentDateOnly(
                                                            commentDate
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {commentsHasMore && (
                                    <div className="py-4 text-center text-gray-400">
                                        Đang có thêm dữ liệu, kéo xuống để tải
                                        tự động...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* PANEL GÓP Ý ĐÃ THÍCH */}
                    <div
                        ref={likedRef}
                        className={`absolute inset-0 overflow-auto transition-all duration-300 ease-in-out transform ${
                            isLiked
                                ? "opacity-100 translate-y-0 z-30 pointer-events-auto"
                                : "opacity-0 translate-y-2 z-10 pointer-events-none"
                        }`}
                    >
                        {commentsLoading ? (
                            <div className="py-8 flex justify-center">
                                <Spin />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="p-6">
                                <Empty
                                    description={
                                        isLiked
                                            ? "Chưa có góp ý đã thích"
                                            : "Chưa có góp ý"
                                    }
                                />
                            </div>
                        ) : (
                            <div>
                                {comments.map((c) => {
                                    const commentDate =
                                        c.createdAt ??
                                        (c as any).createdDate ??
                                        null;
                                    const entityName =
                                        (c as any).entityName ?? "";
                                    return (
                                        <div
                                            key={c.id}
                                            className="flex items-start gap-3 py-2 px-3 border-b hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                            onClick={() => onClickComment(c)}
                                        >
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-400 ">
                                                    <span>
                                                        {entityTypeLabel(
                                                            c.entityType
                                                        )}
                                                    </span>
                                                    {entityName ? (
                                                        <span className="mx-1">
                                                            :
                                                        </span>
                                                    ) : null}
                                                    {entityName ? (
                                                        <span className="font-medium text-[15px] text-gray-600">
                                                            {entityName}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                                    {c.content}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {formatCommentDateOnly(
                                                            commentDate
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {commentsHasMore && (
                                    <div className="py-4 text-center text-gray-400">
                                        Đang có thêm dữ liệu, kéo xuống để tải
                                        tự động...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Picker modal (Mazii-like) */}
            <HistoryPickerModal
                open={pickerOpen}
                keyword={pickerKeyword}
                defaultTab={pickerDefaultTab}
                onClose={() => setPickerOpen(false)}
                onSelect={onPickerSelect}
                pageSize={10}
            />

            {/* Modal chi tiết */}
            <SearchResultModal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                entityType={detailEntityType}
                entityId={detailEntityIdOrName}
            />
        </>
    );
}

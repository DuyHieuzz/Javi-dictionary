import { useEffect, useRef, useState } from "react";
import { Spin, Empty } from "antd";
import dayjs from "dayjs";
import { callGetMyComments } from "@/apis/commentApi";
import { ICommentResponse } from "@/types/backend";
import SearchResultModal from "@/components/search/SearchResultModal";

interface Props {
    pageSize?: number;
    userId?: number | null;
}

export default function UserActivityPanel({
    pageSize = 20,
    userId = null,
}: Props) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [items, setItems] = useState<ICommentResponse[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Trạng thái mở modal chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] = useState<any>("WORD");
    const [detailEntityIdOrName, setDetailEntityIdOrName] = useState<
        number | string
    >(0);

    // Lấy danh sách comment (hiện tại chỉ lấy comment của chính người dùng)
    const fetchPage = async (p = 1, reset = false) => {
        // Chặn không cho gọi API trùng khi đang tải
        if (loading || loadingMore) return;
        try {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            // Hiện tại chỉ gọi API: lấy comment của user đang đăng nhập
            const res = await callGetMyComments(p, pageSize);
            const data = res.data?.result;
            const list = data?.content ?? [];

            setItems((prev) => (reset ? list : [...prev, ...list]));
            setHasMore(!(data?.last ?? true));
            setPage((data?.number ?? p - 1) + 1);
        } catch (err) {
            console.error("Lỗi tải hoạt động:", err);
            if (reset) setItems([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        // Tải trang đầu tiên khi component mount
        fetchPage(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Infinite scroll: tự động load trang tiếp theo khi cuộn gần cuối
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let ticking = false;
        const threshold = 260; // Khoảng cách từ đáy để trigger load thêm

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const remaining =
                    el.scrollHeight - el.scrollTop - el.clientHeight;

                // Nếu còn trang tiếp theo và đã cuộn gần đáy → tải thêm
                if (hasMore && !loadingMore && remaining < threshold) {
                    fetchPage(page + 1, false);
                }

                ticking = false;
            });
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, page]);

    // Format ngày chỉ hiển thị dạng dd/MM/yyyy
    const formatDateOnly = (v?: string | null) => {
        if (!v) return "";
        const d = dayjs(v);
        if (d.isValid()) return d.format("DD/MM/YYYY");
        return String(v);
    };

    // Khi click vào 1 comment → mở modal chi tiết
    const onClickComment = (c: ICommentResponse) => {
        if (!c) return;
        const key = String(c.entityType ?? "").toUpperCase();

        // Với Kanji: ưu tiên dùng entityName (ký tự Hán)
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

        // Các loại khác: ưu tiên entityId
        if (c.entityId !== undefined && c.entityId !== null) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityId);
            setDetailOpen(true);
            return;
        }

        // Nếu không có id thì fallback sang entityName
        if (c.entityName) {
            setDetailEntityType(c.entityType);
            setDetailEntityIdOrName(c.entityName);
            setDetailOpen(true);
        }
    };

    return (
        <>
            <div
                ref={scrollRef}
                className="max-h-[520px] overflow-auto bg-white rounded-2xl border border-gray-200"
            >
                {loading && items.length === 0 ? (
                    <div className="py-8 flex justify-center">
                        <Spin />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-6">
                        <Empty description="Chưa có hoạt động" />
                    </div>
                ) : (
                    <div>
                        {items.map((c) => {
                            const commentDate =
                                c.createdAt ?? (c as any).createdDate ?? null;
                            const entityName = (c as any).entityName ?? "";
                            return (
                                <div
                                    key={c.id}
                                    className="flex items-start gap-3 py-2 px-3 border-b hover:bg-gray-50 cursor-pointer"
                                    onClick={() => onClickComment(c)}
                                >
                                    <div className="">
                                        <div className="text-xs text-gray-400 ">
                                            <span className="capitalize">
                                                {String(c.entityType ?? "")}
                                            </span>
                                            {entityName ? (
                                                <span className="mx-1">:</span>
                                            ) : null}
                                            {entityName ? (
                                                <span className="font-medium text-[15px] text-gray-600">
                                                    {entityName}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="text-sm text-gray-700 mt-1">
                                            {c.content}
                                        </div>

                                        <div className="text-xs text-gray-400 mt-1">
                                            {formatDateOnly(commentDate)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {loadingMore && (
                            <div className="py-4 text-center">
                                <Spin />
                            </div>
                        )}
                    </div>
                )}
            </div>

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

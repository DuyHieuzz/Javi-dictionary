import { useEffect, useRef, useState } from "react";
import { Spin, Empty } from "antd";
import dayjs from "dayjs";
import {
    callGetMyComments,
    callGetCommentsByUsername,
} from "@/apis/commentApi";
import { ICommentResponse } from "@/types/backend";
import SearchResultModal from "@/components/search/SearchResultModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { LoadingOutlined } from "@ant-design/icons";

interface Props {
    pageSize?: number;
    username?: string | null;
}

export default function UserActivityPanel({
    pageSize = 20,
    username = null,
}: Props) {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const [items, setItems] = useState<ICommentResponse[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const { user: currentUser } = useAuthStore();
    // Trạng thái mở modal chi tiết
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailEntityType, setDetailEntityType] = useState<any>("WORD");
    const [detailEntityIdOrName, setDetailEntityIdOrName] = useState<
        number | string
    >(0);

    /**
     * fetchPage: tự động chọn API phù hợp:
     *  - Nếu có username prop và khác currentUser.username -> callGetCommentsByUsername
     *  - Ngược lại -> callGetMyComments
     */
    const fetchPage = async (pageIndex = 0, reset = false) => {
        if (loading || loadingMore) return;
        try {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            let res: any;
            // Gọi API: helpers mong page là 1-based -> truyền pageIndex + 1
            if (username && username !== currentUser?.username) {
                res = await callGetCommentsByUsername(
                    username,
                    pageIndex + 1,
                    pageSize
                );
            } else {
                res = await callGetMyComments(pageIndex + 1, pageSize);
            }

            const data = res.data?.result;
            const list = data?.content ?? [];

            // nếu reset thì thay mới, ngược lại append
            setItems((prev) => (reset ? list : [...prev, ...list]));

            // hasMore = !last
            const lastFlag = Boolean(data?.last ?? true);
            setHasMore(!lastFlag);

            // data.number từ backend là 0-based page index (nếu backend trả)
            const returnedNumber =
                typeof data?.number !== "undefined" ? data.number : pageIndex;
            setPage(returnedNumber);
            // Nếu còn trang tiếp và nội dung hiện tại chưa tạo scrollbar (chưa đủ cao)
            // -> tự gọi trang kế để fill content (tránh trường hợp không có scroll và user không thể trigger)
            setTimeout(() => {
                const el2 = scrollRef.current;
                if (!el2) return;
                // true nếu chưa có scrollbar (nội dung fit trong container)
                const contentFits = el2.scrollHeight <= el2.clientHeight;

                if (contentFits && !loadingMore && !lastFlag) {
                    // gọi trang kế (returnedNumber là index 0-based)
                    fetchPage(returnedNumber + 1, false);
                }
            }, 120);
        } catch (err) {
            if (reset) setItems([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        // Tải trang đầu tiên khi component mount
        fetchPage(0, true);
    }, [username]);

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

    // Map entity type sang tên tiếng Việt
    const mapEntityTypeLabel = (type?: string) => {
        switch ((type || "").toUpperCase()) {
            case "WORD":
                return "TỪ VỰNG";
            case "KANJI":
                return "KANJI";
            case "GRAMMAR":
                return "NGỮ PHÁP";
            default:
                return type || "";
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
                        <Spin
                            indicator={<LoadingOutlined spin />}
                            size="large"
                        />
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
                                    <div className="w-full">
                                        <div className="flex items-center justify-between text-xs w-full">
                                            <div className="text-gray-400">
                                                <span className="capitalize">
                                                    {mapEntityTypeLabel(
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

                                            <div className="text-gray-400 ml-4 text-nowrap">
                                                {formatDateOnly(commentDate)}
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-700 mt-1 whitespace-pre-line break-words">
                                            {c.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {loadingMore && (
                            <div className="py-4 text-center">
                                <Spin
                                    indicator={<LoadingOutlined spin />}
                                    size="large"
                                />
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

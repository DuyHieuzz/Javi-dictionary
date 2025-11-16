import { useEffect, useState } from "react";
import { callGetRecentComments } from "@/apis/commentApi";
import { ICommentResponse, EntityType } from "@/types/backend";
import avatar from "@/assets/avatar.png";
import SearchResultModal from "@/components/search/SearchResultModal";
import { useNavigate } from "react-router-dom";
import { GoCommentDiscussion } from "react-icons/go";

export default function RecentComments() {
    const navigate = useNavigate();

    const [items, setItems] = useState<ICommentResponse[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    // modal
    const [open, setOpen] = useState(false);
    const [entityType, setEntityType] = useState<EntityType>("WORD");
    const [entityId, setEntityId] = useState<number | string>(0);

    const load = async (pageToLoad = 1, reset = false) => {
        if (loading) return;
        try {
            setLoading(true);
            const res = await callGetRecentComments(pageToLoad, 10);
            const data = res.data?.result;
            const list = data?.content ?? [];
            // dùng functional update để tránh stale state khi setItems dựa trên items hiện tại
            setItems((prev) => (reset ? list : [...prev, ...list]));
            setHasMore(!(data?.last ?? true));
            setPage((data?.number ?? 0) + 1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mở modal hiển thị entity (và lưu lịch sử)
    // Nếu là KANJI, dùng entityName (ký tự) để modal gọi API lấy chi tiết theo characterName
    const openEntity = (type: EntityType, idOrName: number | string) => {
        setEntityType(type);
        setEntityId(idOrName);
        setOpen(true);
    };

    const typeLabel = (t: EntityType) =>
        t === "WORD" ? "từ vựng" : t === "KANJI" ? "hán tự" : "ngữ pháp";

    return (
        <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col">
            <h2 className="flex items-center gap-2 text-base text-center pb-3 border-b border-gray-300">
                <GoCommentDiscussion className="text-lg" /> Bình luận gần đây
            </h2>

            {/* Khung danh sách có cuộn */}
            <div className="flex-1 max-h-[200px] md:max-h-[480px] overflow-y-auto pr-1 text-sm text-gray-700 divide-y divide-gray-200">
                {items.map((c) => (
                    <div key={c.id} className="py-3">
                        {/* dòng nội dung 2 dòng + tag loại */}
                        <div className="flex items-start gap-2">
                            <span className="text-center shrink-0 mt-[2px] rounded-full text-[11px] px-2 py-[1px] bg-gray-100 text-gray-700 w-[65px] ">
                                {typeLabel(c.entityType)}
                            </span>

                            {/* Hiển thị entityName */}
                            <p className="line-clamp-2 leading-5">
                                {c.entityName && (
                                    <span className="text-blue-600 font-semibold mr-1">
                                        {c.entityName}:
                                    </span>
                                )}
                                {c.content}
                            </p>
                        </div>

                        {/* user */}
                        <div className="flex items-center gap-2 text-gray-600 mt-2">
                            <img
                                src={c.avatarUrl || avatar}
                                alt="avatar"
                                className="w-5 h-5 rounded-full border border-gray-300"
                            />
                            {/* click username -> profile */}
                            <span
                                onClick={() =>
                                    navigate(`/users/profile/${c.userName}`)
                                }
                                className="truncate cursor-pointer hover:underline hover:text-blue-600"
                            >
                                {c.userName}
                            </span>

                            {/* click xem chi tiết -> mở modal và LƯU lịch sử */}
                            <button
                                onClick={() => {
                                    // backend trả entityName (ví dụ ký tự Kanji hoặc từ),
                                    // ưu tiên dùng entityName cho KANJI — modal / API cần ký tự Kanji.
                                    // WORD & GRAMMAR vẫn truyền id (số).
                                    if (c.entityType === "KANJI") {
                                        // use characterName (entityName) for kanji detail
                                        const charName =
                                            c.entityName ?? String(c.entityId);
                                        openEntity(c.entityType, charName);
                                    } else {
                                        openEntity(
                                            c.entityType,
                                            Number(c.entityId)
                                        );
                                    }
                                }}
                                className="ml-auto text-[12px] text-blue-600 hover:underline"
                            >
                                Xem chi tiết
                            </button>
                        </div>
                    </div>
                ))}

                {!items.length && !loading && (
                    <div className="py-6 text-center text-gray-500">
                        Chưa có bình luận.
                    </div>
                )}
            </div>

            {/* Nút xem thêm tách đáy */}
            <div className="border-t border-gray-200 text-center bg-white">
                <button
                    onClick={() => hasMore && load(page)}
                    disabled={!hasMore || loading}
                    className="text-[13px] mt-[8px] text-blue-600 hover:underline disabled:text-gray-400"
                >
                    {hasMore
                        ? loading
                            ? "Đang tải..."
                            : "Xem thêm"
                        : "Hết rồi"}
                </button>
            </div>

            {/* Modal đa năng: LƯU lịch sử vì user chủ động click */}
            <SearchResultModal
                open={open}
                onClose={() => setOpen(false)}
                entityType={entityType}
                entityId={entityId}
            />
        </div>
    );
}

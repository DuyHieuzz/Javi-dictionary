import { useState, useEffect } from "react";
import { Pagination, Spin, message } from "antd";
import {
    AiOutlineLike,
    AiOutlineDislike,
    AiFillLike,
    AiFillDislike,
} from "react-icons/ai";
import axios from "axios";

interface Comment {
    id: number;
    content: string;
    userName: string;
    likeCount: number;
    dislikeCount: number;
    myReaction: "LIKE" | "DISLIKE" | null;
}

export default function CommentList() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [activePage, setActivePage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Load comment từ BE
    const fetchComments = async (page: number) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `/api/comments?entityType=WORD&entityId=1&page=${
                    page - 1
                }&size=10`
            );

            const data = res.data.result;
            setComments(data.content);
            setTotalPages(data.totalPages);
            setActivePage(data.number + 1);
        } catch (e) {
            console.error(e);
            message.error("Không tải được bình luận");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(activePage);
    }, [activePage]);

    // Gửi bình luận mới
    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await axios.post("/api/comments", {
                entityType: "WORD",
                entityId: 1,
                content: newComment.trim(),
            });

            message.success("Đã gửi bình luận!");
            setNewComment("");
            fetchComments(activePage);
        } catch (e) {
            message.error("Gửi bình luận thất bại!");
        } finally {
            setSubmitting(false);
        }
    };

    // Gửi like/dislike
    const handleReact = async (id: number, type: "LIKE" | "DISLIKE") => {
        try {
            const res = await axios.post(
                `/api/comments/${id}/react?type=${type}`
            );
            const updated: Comment = res.data.result;

            // Cập nhật lại state comment
            setComments((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
        } catch {
            message.error("Không thể gửi phản ứng!");
        }
    };

    return (
        <div className="border-t border-gray-200 mt-6">
            {/* Tiêu đề */}
            <h3 className="text-gray-800 font-medium mt-3">
                Có {comments.length} ý kiến đóng góp
            </h3>

            {/* Danh sách comment */}
            <div className="flex flex-col divide-y divide-gray-200 min-h-[120px]">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Spin />
                    </div>
                ) : comments.length > 0 ? (
                    comments.map((c) => (
                        <div key={c.id} className="py-3">
                            <p className="text-gray-800 whitespace-pre-line break-words text-[15px] leading-relaxed">
                                {c.content}
                            </p>

                            <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() =>
                                            handleReact(c.id, "LIKE")
                                        }
                                        className={`flex items-center gap-1 transition ${
                                            c.myReaction === "LIKE"
                                                ? "text-[#3e67d6]"
                                                : "hover:text-blue-600"
                                        }`}
                                    >
                                        {c.myReaction === "LIKE" ? (
                                            <AiFillLike className="w-4 h-4" />
                                        ) : (
                                            <AiOutlineLike className="w-4 h-4" />
                                        )}
                                        {c.likeCount}
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleReact(c.id, "DISLIKE")
                                        }
                                        className={`flex items-center gap-1 transition ${
                                            c.myReaction === "DISLIKE"
                                                ? "text-[#d9534f]"
                                                : "hover:text-blue-600"
                                        }`}
                                    >
                                        {c.myReaction === "DISLIKE" ? (
                                            <AiFillDislike className="w-4 h-4" />
                                        ) : (
                                            <AiOutlineDislike className="w-4 h-4" />
                                        )}
                                        {c.dislikeCount}
                                    </button>
                                </div>

                                <span className="hover:text-blue-600 hover:underline cursor-pointer transition">
                                    {c.userName}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm italic py-4">
                        Chưa có bình luận nào, hãy là người đầu tiên!
                    </p>
                )}
            </div>

            {/* Ẩn pagination nếu chưa có comment */}
            {comments.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Pagination
                        current={activePage}
                        total={totalPages * 10}
                        pageSize={10}
                        showSizeChanger={false}
                        onChange={(page) => setActivePage(page)}
                    />
                </div>
            )}

            {/* Ô nhập bình luận */}
            <div className="mt-5">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full resize-none border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    rows={3}
                    placeholder="Thêm nghĩa hoặc ví dụ. Ấn SHIFT + ENTER để xuống dòng"
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || submitting}
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                            newComment.trim()
                                ? "bg-[#3e67d6] text-white hover:bg-[#3657bb]"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        {submitting ? "Đang gửi..." : "Gửi"}
                    </button>
                </div>
            </div>
        </div>
    );
}

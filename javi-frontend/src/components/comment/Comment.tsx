import { useState, useEffect } from "react";
import { Pagination, Spin, message, Popconfirm, Tooltip } from "antd";
import {
    AiOutlineLike,
    AiOutlineDislike,
    AiFillLike,
    AiFillDislike,
    AiOutlineDelete,
} from "react-icons/ai";
import axiosClient from "@/apis/axiosClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { ICommentResponse, EntityType } from "@/types/backend";
import { useNavigate } from "react-router-dom";

interface Props {
    entityType: EntityType;
    entityId: number;
}

export default function Comment({ entityType, entityId }: Props) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isLoggedIn = !!user;
    const hasManagePermission =
        user?.role?.permissions?.some(
            (p) => p.name === "MANAGE_USER_COMMENT"
        ) ?? false;

    const [comments, setComments] = useState<ICommentResponse[]>([]);
    const [activePage, setActivePage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null
    );

    /** Load comment từ BE */
    const fetchComments = async (page: number) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/comments`, {
                params: {
                    entityType,
                    entityId,
                    page: page - 1,
                    size: 10,
                    sort: ["likeCount,desc", "createdAt,desc"],
                },
            });

            const data = res.data.result;
            setComments(data.content || []);
            setTotalPages(data.totalPages || 1);
            setActivePage(data.number + 1);

            // Nếu user đã có bình luận, hiển thị sẵn nội dung để chỉnh sửa
            if (isLoggedIn) {
                const myCmt = data.content?.find(
                    (c: ICommentResponse) => c.userId === user?.id
                );
                if (myCmt) {
                    setNewComment(myCmt.content);
                    setEditingCommentId(myCmt.id);
                } else {
                    setNewComment("");
                    setEditingCommentId(null);
                }
            }
        } catch (e: any) {
            console.error(" Lỗi khi tải bình luận:", e);
            message.error(
                e?.response?.data?.message || "Không tải được bình luận"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments(activePage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePage, entityId]);

    // Chuẩn hoá comment trước khi gửi
    const cleanedComment = newComment
        .replace(/\r\n/g, "\n") // chuyển CRLF → LF
        .split("\n") // tách theo dòng
        .map((line) => line.trim()) // xoá khoảng trắng thừa mỗi dòng
        .filter((line) => line.length > 0) // chỉ giữ dòng có chữ
        .join("\n"); // ghép lại, mỗi dòng có chữ cách nhau đúng 1 newline

    /** Thêm mới hoặc cập nhật bình luận */
    const handleSubmit = async () => {
        if (!newComment.trim()) return;
        if (!isLoggedIn) {
            message.info("Vui lòng đăng nhập để bình luận.");
            return;
        }

        setSubmitting(true);
        try {
            if (editingCommentId) {
                //  Cập nhật bình luận của mình
                await axiosClient.put(`/comments/${editingCommentId}`, {
                    content: cleanedComment,
                });
                message.success("Đã cập nhật bình luận!");
            } else {
                //  Thêm bình luận mới
                await axiosClient.post(`/comments`, {
                    entityType,
                    entityId,
                    content: cleanedComment,
                });
                message.success("Đã gửi bình luận!");
            }

            setActivePage(1);
            fetchComments(1);
        } catch (e: any) {
            message.error(
                e?.response?.data?.message || "Gửi bình luận thất bại!"
            );
        } finally {
            setSubmitting(false);
        }
    };

    /** Gửi like/dislike */
    const handleReact = async (id: number, type: "LIKE" | "DISLIKE") => {
        try {
            const res = await axiosClient.post(`/comments/${id}/react`, null, {
                params: { type },
            });
            const updated: ICommentResponse = res.data.result;
            setComments((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
        } catch (e: any) {
            message.error(
                e?.response?.data?.message || "Không thể gửi phản ứng!"
            );
        }
    };

    /** Xóa bình luận */
    const handleDelete = async (id: number) => {
        try {
            await axiosClient.delete(`/comments/${id}`);
            message.success("Đã xóa bình luận!");
            fetchComments(activePage);
        } catch (e: any) {
            message.error(
                e?.response?.data?.message || "Không thể xóa bình luận!"
            );
        }
    };

    /** Khi nhấn vào tên user */
    const handleUserClick = (username: string) => {
        if (!username) return;
        navigate(`/users/profile/${username}`);
    };

    return (
        <div className="border-t border-gray-200 mt-6">
            {/* Tiêu đề */}
            <h3 className="text-gray-800 font-medium mt-3">
                Có {comments.length} ý kiến đóng góp
            </h3>

            {/* Danh sách comment */}
            <div className="flex flex-col divide-y divide-gray-200 min-h-[60px]">
                {loading ? (
                    <div className="flex justify-center py-6">
                        <Spin />
                    </div>
                ) : comments.length > 0 ? (
                    comments.map((c) => (
                        <div key={c.id} className="py-3">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-800 whitespace-pre-line break-words text-[15px] leading-relaxed flex-1">
                                    {c.content}
                                </p>

                                {/* Xóa bình luận */}
                                {(hasManagePermission ||
                                    c.userId === user?.id) && (
                                    <Popconfirm
                                        title="Xóa bình luận này?"
                                        okText="Xóa"
                                        cancelText="Hủy"
                                        onConfirm={() => handleDelete(c.id)}
                                    >
                                        <Tooltip title="Xóa bình luận">
                                            <button className="ml-3 text-gray-400 hover:text-red-500 transition">
                                                <AiOutlineDelete className="w-4 h-4" />
                                            </button>
                                        </Tooltip>
                                    </Popconfirm>
                                )}
                            </div>

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

                                <span
                                    onClick={() => handleUserClick(c.userName)}
                                    className="hover:text-blue-600 hover:underline cursor-pointer transition"
                                >
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

            {/* Pagination */}
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
            {isLoggedIn && (
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
                            {submitting
                                ? "Đang gửi..."
                                : editingCommentId
                                ? "Cập nhật"
                                : "Gửi"}
                        </button>
                    </div>
                </div>
            )}

            {!isLoggedIn && (
                <p className="text-gray-500 text-sm italic mt-3">
                    Vui lòng đăng nhập để bình luận.
                </p>
            )}
        </div>
    );
}

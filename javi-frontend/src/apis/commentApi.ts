import axiosClient from "@/apis/axiosClient";
import {
  IBackendRes,
  ICommentResponse,
  ICreateCommentRequest,
  IUpdateCommentRequest,
  IPage,
  EntityType,
} from "@/types/backend";

/** Lấy comment theo entity (word, kanji, grammar) */
export const callGetCommentsByEntity = (
  entityType: EntityType,
  entityId: number,
  page = 1,
  size = 10,
  sort: string[] = ["likeCount,desc", "createdAt,desc"]
) =>
  axiosClient.get<IBackendRes<IPage<ICommentResponse>>>(`/comments`, {
    params: { entityType, entityId, page: page -1, size, sort },
  });

/** Tạo comment mới */
export const callCreateComment = (payload: ICreateCommentRequest) =>
  axiosClient.post<IBackendRes<ICommentResponse>>(`/comments`, payload);

/** Cập nhật comment */
export const callUpdateComment = (id: number, payload: IUpdateCommentRequest) =>
  axiosClient.put<IBackendRes<ICommentResponse>>(`/comments/${id}`, payload);

/** Xóa comment */
export const callDeleteComment = (id: number) =>
  axiosClient.delete<IBackendRes<void>>(`/comments/${id}`);

/** Like / Dislike comment */
export const callReactComment = (commentId: number, type: "LIKE" | "DISLIKE") =>
  axiosClient.post<IBackendRes<ICommentResponse>>(
    `/comments/${commentId}/react`,
    null,
    { params: { type } }
  );

/** Comment của user cụ thể */
export const callGetCommentsByUsername = (
  username: string,
  page = 1,
  size = 20
) =>
  axiosClient.get<IBackendRes<IPage<ICommentResponse>>>(
    `/comments/user/${encodeURIComponent(username)}`,
    { params: { page: page - 1, size } }
  );

/** Comment của tôi */
export const callGetMyComments = (page = 1, size = 20) =>
  axiosClient.get<IBackendRes<IPage<ICommentResponse>>>(`/comments/my-comment`, {
    params: { page: page - 1, size },
  });

/** Các comment tôi đã like */
export const callGetMyLikedComments = (page = 1, size = 20) =>
  axiosClient.get<IBackendRes<IPage<ICommentResponse>>>(
    `/comment-reactions/liked`,
    { params: { page: page - 1, size } }
  );

// Lấy tất cả bình luận mới nhất ("Bình luận gần đây")
export const callGetRecentComments = (page = 1, size = 10) =>
  axiosClient.get<IBackendRes<IPage<ICommentResponse>>>(`/comments/all`, {
    params: { page: page - 1, size }, // BE đã default sort createdAt desc
  });

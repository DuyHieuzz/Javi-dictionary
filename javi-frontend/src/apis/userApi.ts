import axiosClient from "./axiosClient";
import { IBackendRes, IPublicUserResponse, IUserResponse } from "../types/backend";
import {
  ICreateUserRequest,
  IUpdateUserRequest,
  IChangePassRequest,
  PremiumType,
} from "@/types/backend";

/** Tạo người dùng (chỉ dành cho ADMIN) */
export const callCreateUser = (data: ICreateUserRequest) => {
  return axiosClient.post<IBackendRes<IUserResponse>>("/users", data);
};

/** Lấy thông tin user hiện tại (đã đăng nhập) */
export const callGetMyInfo = () => {
  return axiosClient.get<IBackendRes<IUserResponse>>("/users/my-info");
};

/** Cập nhật thông tin user theo ID */
export const callUpdateUserById = (id: number, data: IUpdateUserRequest) => {
  return axiosClient.put<IBackendRes<IUserResponse>>(`/users/${id}`, data);
};

/** Đổi mật khẩu người dùng */
export const callChangePassword = (id: number, data: IChangePassRequest) => {
  return axiosClient.put<IBackendRes<IUserResponse>>(`/users/change-password/${id}`, data);
};

/** Cập nhật avatar người dùng */
export const callUpdateAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.put<IBackendRes<string>>(`/users/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Lấy thông tin người dùng theo ID */
export const callGetUserById = (id: number) => {
  return axiosClient.get<IBackendRes<IUserResponse>>(`/users/${id}`);
};

/** Lấy thông tin công khai của user theo username (ai cũng xem được) */
export const callGetPublicUserProfile = (username: string) => {
  return axiosClient.get<IBackendRes<IPublicUserResponse>>(`/users/profile/${username}`);
};

/** Lấy danh sách user (phân trang + filter) */
export const callGetAllUsers = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}) => {
  return axiosClient.get<
    IBackendRes<{ content: IUserResponse[]; totalElements: number; totalPages: number }>
  >("/users", { params });
};

/** Khóa tài khoản user */
export const callBlockUser = (id: number) => {
  return axiosClient.put<IBackendRes<null>>(`/users/block/${id}`);
};

/** Mở khóa tài khoản user */
export const callUnblockUser = (id: number) => {
  return axiosClient.put<IBackendRes<null>>(`/users/unblock/${id}`);
};

/** Nâng cấp tài khoản lên PREMIUM (ADMIN) */
export const callUpgradePremium = (id: number, type: PremiumType) => {
  return axiosClient.put<IBackendRes<IUserResponse>>(`/users/${id}/upgrade-premium?type=${type}`);
};

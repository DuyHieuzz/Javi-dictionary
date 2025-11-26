import axiosClient from "./axiosClient";
import { IBackendRes, IPermission } from "@/types/backend";

// Tạo mới permission
export const callCreatePermission = (data: Partial<IPermission>) => {
  return axiosClient.post<IBackendRes<IPermission>>("/permission", data);
};

// Cập nhật permission theo ID
export const callUpdatePermission = (id: number, data: Partial<IPermission>) => {
  return axiosClient.put<IBackendRes<IPermission>>(`/permission/${id}`, data);
};

// Xóa permission theo ID
export const callDeletePermission = (id: number) => {
  return axiosClient.delete<IBackendRes<null>>(`/permission/${id}`);
};

// Lấy thông tin permission theo ID
export const callGetPermissionById = (id: number) => {
  return axiosClient.get<IBackendRes<IPermission>>(`/permission/${id}`);
};

// Lấy danh sách permission (phân trang & filter)
export const callGetAllPermissions = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}) => {
  return axiosClient.get<
    IBackendRes<{ content: IPermission[]; totalElements: number; totalPages: number }>
  >("/permission", { params });
};

// Lấy toàn bộ permission không phân trang (dùng cho checkbox list)
export const callGetPermissionsAll = () => {
  return axiosClient.get<IBackendRes<IPermission[]>>("/permission/all");
};

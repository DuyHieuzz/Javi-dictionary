import axiosClient from "./axiosClient";
import { IBackendRes, IRole, IRoleRequest } from "../types/backend";

/** Tạo mới role */
export const callCreateRole = (data: IRoleRequest) => {
  return axiosClient.post<IBackendRes<IRole>>("/role", data);
};

/** Cập nhật role theo ID */
export const callUpdateRole = (id: number, data: IRoleRequest) => {
  return axiosClient.put<IBackendRes<IRole>>(`/role/${id}`, data);
};

/** Xóa role theo ID */
export const callDeleteRole = (id: number) => {
  return axiosClient.delete<IBackendRes<null>>(`/role/${id}`);
};

/** Lấy thông tin role theo ID */
export const callGetRoleById = (id: number) => {
  return axiosClient.get<IBackendRes<IRole>>(`/role/${id}`);
};

/** Lấy tất cả role không phân trang */
export const callGetAllRolesList = () => {
  return axiosClient.get<IBackendRes<IRole[]>>("/role/all");
};

/** Lấy danh sách role (phân trang & filter) */
export const callGetAllRoles = (params?: {
  page?: number;
  size?: number;
  sort?: string;
  filter?: string;
}) => {
  return axiosClient.get<IBackendRes<{ content: IRole[]; totalElements: number; totalPages: number }>>("/role", {
    params,
  });
};

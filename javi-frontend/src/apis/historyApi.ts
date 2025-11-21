import axiosClient from "@/apis/axiosClient";
import { IBackendRes } from "@/types/backend";

export const callGetHistory = (page: number, size = 15) => {
  return axiosClient.get<IBackendRes<any>>(`/history`, {
    params: { page: page - 1, size },
  });
};

export const callDeleteHistory = (ids: number[]) => {
  return axiosClient.delete<IBackendRes<void>>(`/history`, {
    data: ids,
  });
};

export const callDeleteAllHistory = () => {
  return axiosClient.delete<IBackendRes<void>>(`/history/delete-all`);
};

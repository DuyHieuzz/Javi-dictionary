import axiosClient from "@/apis/axiosClient";
import {
    IBackendRes,
    IGrammarResponse,
    ICreateGrammarRequest,
    IUpdateGrammarRequest,
    IGrammarSearchRequest,
    IGrammarCheckSourceText,
    IGrammarCheckResult,
    IPageResponse,
} from "@/types/backend";

/**
 *  Lấy chi tiết một mẫu ngữ pháp theo ID
 */
export const callGetGrammarDetail = async (id: number, opts?: { saveHistory?: boolean }) => {
  return axiosClient.get<IBackendRes<IGrammarResponse>>(`/grammar/${id}`, {
    params: { saveHistory: opts?.saveHistory ?? false },
  });
};

/**
 * Tìm kiếm danh sách ngữ pháp (phân trang + filter)
 */
export const callSearchGrammars = async (params: IGrammarSearchRequest & { saveHistory?: boolean }) => {
  return axiosClient.get<IBackendRes<IPageResponse<IGrammarResponse>>>(`/grammar/search`, { params });
};

/**
 * Tạo mới một mẫu ngữ pháp
 */
export const callCreateGrammar = async (data: ICreateGrammarRequest) => {
    return axiosClient.post<IBackendRes<IGrammarResponse>>(`/grammar`, data);
};

/**
 * Cập nhật mẫu ngữ pháp theo ID
 */
export const callUpdateGrammar = async (id: number, data: IUpdateGrammarRequest) => {
    return axiosClient.put<IBackendRes<IGrammarResponse>>(`/grammar/${id}`, data);
};

/**
 * Xóa một mẫu ngữ pháp theo ID
 */
export const callDeleteGrammar = async (id: number) => {
    return axiosClient.delete<IBackendRes<void>>(`/grammar/${id}`);
};

/** 
 * Kiểm tra ngữ pháp bằng AI (chỉ dành cho tài khoản PREMIUM)
 */
export const callCheckGrammar = async (data: IGrammarCheckSourceText) => {
    return axiosClient.post<IBackendRes<IGrammarCheckResult>>(`/grammar/check`, data);
};

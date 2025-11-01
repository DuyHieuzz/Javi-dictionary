import axiosClient from "@/apis/axiosClient";
import { IBackendRes, IVocabCreateRequest, IVocabResponse, IVocabUpdateRequest } from "@/types/backend";

/** Tạo từ vựng */
export const callCreateVocabulary = (body: IVocabCreateRequest) => {
  return axiosClient.post<IBackendRes<IVocabResponse>>(`/vocab`, body);
};

/** Cập nhật từ vựng */
export const callUpdateVocabulary = (id: number, body: IVocabUpdateRequest) => {
  return axiosClient.put<IBackendRes<IVocabResponse>>(`/vocab/${id}`, body);
};

/** Tìm kiếm từ vựng theo keyword */
export const callSearchVocabulary = (keyword: string) => {
  return axiosClient.get<IBackendRes<IVocabResponse[]>>(`/vocab/search/${keyword}`);
};

/** Lấy chi tiết từ vựng theo từ (word) */
export const callGetVocabularyByWord = (word: string) => {
  return axiosClient.get<IBackendRes<IVocabResponse>>(`/vocab/search/word/${word}`);
};

/** Lấy chi tiết từ vựng theo ID */
export const callGetVocabularyById = (id: number) => {
  return axiosClient.get<IBackendRes<IVocabResponse>>(`/vocab/id/${id}`);
};

/** Lấy danh sách từ vựng (phân trang / filter - admin) */
export const callGetVocabularyPage = (params?: Record<string, any>) => {
  return axiosClient.get<IBackendRes<any>>(`/vocab`, { params });
};

/** Xóa từ vựng theo ID */
export const callDeleteVocabulary = (id: number) => {
  return axiosClient.delete<IBackendRes<void>>(`/vocab/${id}`);
};

/** Giải nghĩa từ vựng bằng AI */
export const callExplainVocabulary = (word: string) => {
  return axiosClient.post<IBackendRes<string>>(`/vocab/explain/${word}`);
};

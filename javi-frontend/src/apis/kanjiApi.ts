import axiosClient from "@/apis/axiosClient";
import {
  IBackendRes,
  IKanjiResponse,
  IKanjiDetailResponse,
  IKanjiDecompositionResult,
  IKanjiRequest,
} from "@/types/backend";

export const callCreateOrUpdateKanji = (body: IKanjiRequest) => {
  return axiosClient.post<IBackendRes<IKanjiResponse>>(`/kanji`, body);
};

/** Xóa Kanji theo characterName */
export const callDeleteKanji = (characterName: string) => {
  return axiosClient.delete<IBackendRes<void>>(`/kanji`, {
    params: { characterName },
  });
};

/** Tìm kiếm Kanji theo keyword (dùng cho thanh search chính) */
export const callSearchKanji = (keyword: string) => {
  return axiosClient.get<IBackendRes<IKanjiResponse[]>>(`/kanji/search`, {
    params: { keyword },
  });
};

/** Lấy chi tiết Kanji theo characterName */
export const callGetKanjiDetail = (characterName: string) => {
  return axiosClient.get<IBackendRes<IKanjiDetailResponse>>(
    `/kanji/search/get-mean`,
    { params: { characterName } }
  );
};

/** Phân tích Kanji */
export const callAnalyzeKanji = (character: string) => {
  return axiosClient.get<IBackendRes<IKanjiDecompositionResult>>(
    `/kanji/analyze/${character}`
  );
};

/** Lấy danh sách Kanji theo bộ lọc */
export const callGetKanjiPage = (params?: Record<string, any>) => {
  return axiosClient.get<IBackendRes<any>>(`/kanji`, { params });
};

/** Upload ảnh GIF cho Kanji */
export const callUploadKanjiGif = (character: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.put<IBackendRes<IKanjiResponse>>(
    `/kanji/${character}/gif`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

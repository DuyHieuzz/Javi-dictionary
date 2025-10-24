import axiosClient from "./axiosClient";
import { ILoginResponse, IUserResponse } from "../types/backend";

/** Đăng ký tài khoản */
export const callRegister = (email: string, password: string, confirmPassword: string) => {
  return axiosClient.post<{ message: string }>("/auth/register", {
    email,
    password,
    confirmPassword,
  });
};

/** Đăng nhập */
export const callLogin = (email: string, password: string) => {
  return axiosClient.post<ILoginResponse>("/auth/login", { email, password });
};

/** Refresh access token */
export const callRefreshToken = () => {
  return axiosClient.post<ILoginResponse>("/auth/refresh", {});
};

/** Đăng xuất */
export const callLogout = () => {
  return axiosClient.post<{ message: string }>("/auth/logout", {});
};

/** Lấy thông tin user hiện tại */
export const callGetMyInfo = () => {
  return axiosClient.get<IUserResponse>("/users/me");
};

/** Xác minh email người dùng */
export const callVerifyEmail = async (token: string) => {
  return axiosClient.get<{ message: string }>(`/auth/verify-email?token=${token}`);
};

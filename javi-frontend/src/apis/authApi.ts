import axiosClient from "./axiosClient";
import { ILoginResponse, IResetPassRequest } from "../types/backend";

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

/** Xác minh email người dùng */
export const callVerifyEmail = async (token: string) => {
  return axiosClient.get<{ message: string }>(`/auth/verify-email?token=${token}`);
};

/** Gửi email khôi phục mật khẩu */
export const callForgotPassword = (email: string) => {
  return axiosClient.post<{ message: string }>(
    `/auth/forgot-password?email=${encodeURIComponent(email)}`
  );
};

/** Xác minh token khôi phục mật khẩu */
export const callVerifyResetToken = (token: string) => {
  return axiosClient.get<{ message: string }>(
    `/auth/verify-reset-token?token=${encodeURIComponent(token)}`
  );
};

/** Đặt lại mật khẩu mới */
export const callResetPassword = (data: IResetPassRequest) => {
  return axiosClient.post<{ message: string }>("/auth/reset-password", data);
};


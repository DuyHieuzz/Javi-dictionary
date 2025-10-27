export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
  result?: T;
}

export interface IPermission {
  id: number;
  name: string;
  description: string;
  systemPermission: boolean;
}


export interface IRole {
  id: number;
  name: string;
  description: string;
  permissions: IPermission[];
  systemRole: boolean;
}

/** Payload tạo hoặc cập nhật Role */
export interface IRoleRequest {
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissions: { id: number }[];
}


export interface IUserResponse {
  id: number;
  fullName: string;
  username: string;
  email: string;
  dateOfBirth: string | null;
  level: string | null;
  selfIntroduction: string;
  avatarUrl: string;
  accountType: "FREE" | "PREMIUM";
  premiumExpiredAt: string | null;
  status: "ACTIVE" | "BLOCKED";
  verified: boolean;
  role: IRole;
}

/** PublicUserResponse — dữ liệu công khai của người khác */
export interface IPublicUserResponse {
  id: number;
  username: string;
  fullName: string;
  level: string | null;
  selfIntroduction: string;
  status: "ACTIVE" | "BLOCKED";
  avatarUrl: string;
  premiumType: PremiumType;
  dateOfBirth: string | null;
  createdAt: string;
}

/** Payload tạo user (Admin) */
export interface ICreateUserRequest {
  fullName?: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string | null;
  level?: string | null;
  selfIntroduction?: string;
  avatarUrl?: string;
  roleId?: number;
  status?: "ACTIVE" | "BLOCKED";
  accountType?: "FREE" | "PREMIUM";
  premiumExpiredAt?: string | null;
}

/** Payload cập nhật user */
export interface IUpdateUserRequest {
  username: string;
  dateOfBirth?: string | null;
  fullName?: string | null;
  jlptLevel?: string | null;
  selfIntroduction?: string;
  roleId?: number;
}

/** Payload đổi mật khẩu */
export interface IChangePassRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Payload cập nhật avatar */
export interface IAvatarUpload {
  id: number;
  file: File;
}

/** Enum gói Premium */
export type PremiumType = "MONTHLY_1" | "MONTHLY_3" | "MONTHLY_6" | "LIFETIME";

export interface ILoginResponse {
  token: string;
  tokenType: "Bearer";
  refresh_token: string;
  user: IUserResponse;
}

export interface IResetPassRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
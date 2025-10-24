export interface IBackendRes<T> {
  error?: string | string[];
  message: string;
  statusCode: number | string;
  data?: T;
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

export interface ILoginResponse {
  token: string;
  tokenType: "Bearer";
  refresh_token: string;
  user: IUserResponse;
}


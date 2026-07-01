import { api } from "../lib/api";

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
  requireOtp?: boolean;
  otpTxId?: string;
}

export const authService = {
  login: (data: any) => api.post<LoginResponse>("/auth/login", data),
  verifyLogin: (data: { otpTxId: string; otp: string }) => api.post<LoginResponse>("/auth/verify-login", data),
  register: (data: any) => api.post<{ success: boolean; requireOtp: boolean; otpTxId?: string; user?: any; error?: string }>("/auth/register", data),
  verifyRegister: (data: { otpTxId: string; otp: string }) => api.post<{ success: boolean; user?: any; error?: string }>("/auth/verify-register", data),
  forgotPassword: (data: { email: string }) => api.post<{ success: boolean; otpTxId?: string; error?: string }>("/auth/forgot-password", data),
  verifyForgotPassword: (data: { otpTxId: string; otp: string; newPassword?: string }) => api.post<{ success: boolean; message?: string; error?: string }>("/auth/verify-forgot-password", data),
  toggleOtp: (data: { username: string; requireOtp: boolean }) => api.post<{ success: boolean; requireOtp: boolean }>("/auth/toggle-otp", data),
};

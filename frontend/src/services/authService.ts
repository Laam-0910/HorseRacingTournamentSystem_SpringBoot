// Nhập đối tượng api đã được cấu hình sẵn để thực hiện các yêu cầu HTTP (Axios)
import { api } from "../lib/api";

// Định nghĩa giao diện (interface) cho phản hồi trả về từ API đăng nhập
export interface LoginResponse {
  // Trạng thái thành công hay thất bại của yêu cầu đăng nhập
  success: boolean;
  // Chuỗi JWT token xác thực (nếu đăng nhập thành công)
  token?: string;
  // Thông tin đối tượng người dùng (nếu đăng nhập thành công)
  user?: any;
  // Thông điệp báo lỗi (nếu có lỗi xảy ra)
  error?: string;
  // Cờ đánh dấu tài khoản có yêu cầu xác thực OTP hay không
  requireOtp?: boolean;
  // Mã giao dịch OTP dùng để xác thực bước tiếp theo
  otpTxId?: string;
}

// Khai báo service quản lý các thao tác xác thực người dùng (Auth Service)
export const authService = {
  // Gửi yêu cầu Đăng nhập với dữ liệu tài khoản/mật khẩu
  login: (data: any) => api.post<LoginResponse>("/auth/login", data),
  // Gửi yêu cầu Xác thực mã OTP sau khi đăng nhập thành công bước 1
  verifyLogin: (data: { otpTxId: string; otp: string }) => api.post<LoginResponse>("/auth/verify-login", data),
  // Gửi yêu cầu Đăng ký tài khoản người dùng mới
  register: (data: any) => api.post<{ success: boolean; requireOtp: boolean; otpTxId?: string; user?: any; error?: string }>("/auth/register", data),
  // Gửi yêu cầu Xác thực mã OTP để hoàn tất quá trình đăng ký tài khoản
  verifyRegister: (data: { otpTxId: string; otp: string }) => api.post<{ success: boolean; user?: any; error?: string }>("/auth/verify-register", data),
  // Gửi yêu cầu Quên mật khẩu để lấy mã OTP đặt lại mật khẩu qua Email
  forgotPassword: (data: { email: string }) => api.post<{ success: boolean; otpTxId?: string; error?: string }>("/auth/forgot-password", data),
  // Gửi yêu cầu Xác thực OTP và Đặt lại mật khẩu mới
  verifyForgotPassword: (data: { otpTxId: string; otp: string; newPassword?: string }) => api.post<{ success: boolean; message?: string; error?: string }>("/auth/verify-forgot-password", data),
  // Gửi yêu cầu Bật/Tắt tính năng xác thực OTP 2 yếu tố cho tài khoản
  toggleOtp: (data: { username: string; requireOtp: boolean }) => api.post<{ success: boolean; requireOtp: boolean }>("/auth/toggle-otp", data),
};

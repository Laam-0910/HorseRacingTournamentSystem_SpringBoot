// Import các React hooks và kiểu dữ liệu ReactNode phục vụ Context API
import { createContext, useContext, useState, ReactNode } from "react";

// Định nghĩa Interface AuthUser chứa thông tin hồ sơ tài khoản đang đăng nhập
export interface AuthUser {
  id: number; // ID định danh duy nhất của người dùng
  username: string; // Tên đăng nhập hệ thống
  email: string; // Địa chỉ email đăng ký
  roleId: number; // Vai trò (1=Admin, 2=Owner, 3=Jockey, 4=Referee, 5=Spectator)
  status?: string; // Trạng thái hoạt động (ACTIVE, INACTIVE, PENDING_OTP)
  avatar?: string; // Đường dẫn ảnh đại diện avatar
  fullName?: string; // Họ và tên đầy đủ
  weight?: number; // Cân nặng thực tế (dành cho kỵ sĩ/nài ngựa)
  requireOtp?: boolean; // Cờ cấu hình bắt buộc nhập OTP 2FA khi đăng nhập
  totalRacesParticipated?: number; // Tổng số trận đua đã tham gia
  totalTop3Finishes?: number; // Tổng số lần đạt top 3 cán đích
  biography?: string; // Lời tự giới thiệu/tiểu sử cá nhân
}

// Định nghĩa Interface AuthContextType quy định cấu trúc Context State và các hàm thao tác
interface AuthContextType {
  user: AuthUser | null; // Đối tượng thông tin người dùng hiện tại (null nếu chưa đăng nhập)
  setUser: (u: AuthUser | null) => void; // Hàm cập nhật thông tin người dùng
  logout: () => void; // Hàm đăng xuất khỏi hệ thống
}

// Khởi tạo AuthContext với giá trị mặc định undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hợp phần Provider quản lý State toàn cục cho hệ thống xác thực
export function AuthProvider({ children }: { children: ReactNode }) {
  // Khởi tạo state user, tự động khôi phục dữ liệu từ sessionStorage nếu có
  const [user, setUserState] = useState<AuthUser | null>(() => {
    // Đọc thông tin user đã lưu trong bộ nhớ sessionStorage của trình duyệt
    const saved = sessionStorage.getItem("user");
    // Chuyển đổi từ chuỗi JSON sang đối tượng AuthUser hoặc trả về null
    return saved ? JSON.parse(saved) : null;
  });

  // Hàm cập nhật trạng thái user và đồng bộ vào sessionStorage
  const setUser = (u: AuthUser | null) => {
    setUserState(u); // Cập nhật React State
    if (u) {
      // Lưu thông tin người dùng vào sessionStorage khi đăng nhập thành công
      sessionStorage.setItem("user", JSON.stringify(u));
    } else {
      // Xóa thông tin user và JWT token khỏi sessionStorage khi đăng xuất
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
  };

  // Hàm đăng xuất: Xóa dữ liệu user và đặt state về null
  const logout = () => setUser(null);

  return (
    // Cung cấp dữ liệu AuthContext cho tất cả các component con bên trong
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook useAuth giúp các component dễ dàng truy xuất thông tin xác thực
export function useAuth() {
  const ctx = useContext(AuthContext); // Truy xuất giá trị từ AuthContext
  if (!ctx) throw new Error("useAuth must be used within AuthProvider"); // Báo lỗi nếu dùng ngoài AuthProvider
  return ctx; // Trả về đối tượng chứa user, setUser và logout
}

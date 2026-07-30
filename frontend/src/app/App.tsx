import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/ui/PageTransition";

// ===== Auth (Các trang xác thực người dùng) =====
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyLogin from "./components/auth/VerifyLogin";
import VerifyRegister from "./components/auth/VerifyRegister";
import VerifyForgot from "./components/auth/VerifyForgot";

// ===== Landing (Các trang công khai ngoài trang chủ) =====
import Landing from "./components/landing/Landing";
import Chatbot from "./components/landing/Chatbot";
import Livestream from "./components/landing/Livestream";

// ===== Dashboards (Bảng điều khiển cho từng vai trò người dùng) =====
import Admin from "./components/dashboards/Admin";
import HorseOwner from "./components/dashboards/HorseOwner";
import Jockey from "./components/dashboards/Jockey";
import Referee from "./components/dashboards/Referee";
import Spectator from "./components/dashboards/Spectator";

/**
 * Component ProtectedRoute - Bảo vệ các route yêu cầu đăng nhập và đúng vai trò (role).
 * @param children Component con sẽ hiển thị nếu hợp lệ
 * @param allowedRoles Mảng chứa các ID vai trò được phép truy cập (ví dụ: [1] cho Admin)
 */
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: number[];
}) {
  // Lấy thông tin user hiện tại từ AuthContext
  const { user } = useAuth();
  
  // Nếu chưa đăng nhập, chuyển hướng người dùng về trang login và thay thế lịch sử duyệt web
  if (!user) return <Navigate to="/login" replace />;
  
  // Nếu đã đăng nhập nhưng roleId không nằm trong danh sách được cho phép, cũng chuyển về login
  if (!allowedRoles.includes(user.roleId)) return <Navigate to="/login" replace />;
  
  // Nếu thỏa mãn tất cả điều kiện, render component con bình thường
  return children;
}

/**
 * Component AnimatedRoutes - Chứa định nghĩa toàn bộ Route của ứng dụng
 * và bọc chúng trong AnimatePresence để tạo hiệu ứng chuyển trang (Page Transitions).
 */
function AnimatedRoutes() {
  // Lấy location (URL hiện tại) để làm key duy nhất cho các Route chuyển đổi động
  const location = useLocation();

  return (
    // AnimatePresence quản lý việc xuất hiện/biến mất của các component con khi URL thay đổi
    // mode="wait" yêu cầu component cũ biến mất hoàn toàn trước khi component mới bắt đầu hiệu ứng xuất hiện
    <AnimatePresence mode="wait">
      {/* Cấu hình Routes với location và key để React Router nhận biết sự thay đổi trang phục vụ hiệu ứng */}
      <Routes location={location} key={location.pathname}>
        {/* === Public Routes (Các trang ai cũng có thể truy cập) === */}
        {/* Trang chủ Landing Page */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        {/* Trang Chatbot trợ lý AI */}
        <Route path="/chatbot" element={<PageTransition><Chatbot /></PageTransition>} />
        
        {/* Xem trực tiếp cuộc đua (yêu cầu đăng nhập với bất kỳ vai trò nào từ 1 đến 5) */}
        <Route
          path="/livestream"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Xem trực tiếp cuộc đua cụ thể bằng raceId */}
        <Route
          path="/livestream/:raceId"
          element={
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        
        {/* Các trang phục vụ Đăng nhập, Đăng ký và Quên mật khẩu kèm hiệu ứng chuyển trang */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/verify-login" element={<PageTransition><VerifyLogin /></PageTransition>} />
        <Route path="/verify-register" element={<PageTransition><VerifyRegister /></PageTransition>} />
        <Route path="/verify-forgot" element={<PageTransition><VerifyForgot /></PageTransition>} />

        {/* === Role-based dashboards (Phân quyền truy cập Dashboard theo ID vai trò) ===
            roleId: 1 = Admin, 2 = Owner (Chủ ngựa), 3 = Jockey (Nài ngựa), 4 = Spectator (Khán giả), 5 = Referee (Trọng tài) */}
        
        {/* Dashboard dành riêng cho Admin */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={[1]}>
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Dashboard dành riêng cho Chủ ngựa */}
        <Route
          path="/dashboard/owner"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <PageTransition><HorseOwner /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Dashboard dành riêng cho Nài ngựa */}
        <Route
          path="/dashboard/jockey"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <PageTransition><Jockey /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Dashboard dành riêng cho Khán giả */}
        <Route
          path="/dashboard/spectator"
          element={
            <ProtectedRoute allowedRoles={[4]}>
              <PageTransition><Spectator /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Dashboard dành riêng cho Trọng tài */}
        <Route
          path="/dashboard/referee"
          element={
            <ProtectedRoute allowedRoles={[5]}>
              <PageTransition><Referee /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Bất kỳ đường dẫn lạ nào khác không khớp sẽ tự động chuyển hướng về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

/**
 * Component chính của ứng dụng - Root Component
 * Thiết lập các Provider toàn cục bao gồm AuthProvider (quản lý session/đăng nhập)
 * và BrowserRouter (quản lý định tuyến và lịch sử duyệt web).
 */
export default function App() {
  return (
    // AuthProvider cung cấp trạng thái đăng nhập cho toàn bộ ứng dụng
    <AuthProvider>
      {/* BrowserRouter kích hoạt tính năng định tuyến của react-router-dom */}
      <BrowserRouter>
        {/* Component quản lý danh sách Routes có hiệu ứng chuyển đổi */}
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Nhập các thành phần cần thiết từ react-router-dom để quản lý định tuyến ứng dụng
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
// Nhập AuthProvider và hook useAuth từ context xác thực người dùng
import { AuthProvider, useAuth } from "../context/AuthContext";
// Nhập AnimatePresence từ framer-motion để xử lý hiệu ứng khi component xuất hiện/biến mất
import { AnimatePresence } from "framer-motion";
// Nhập component PageTransition để tạo hiệu ứng chuyển trang mượt mà
import PageTransition from "./components/ui/PageTransition";

// ===== Auth (Các trang xác thực người dùng) =====
// Nhập trang Đăng nhập
import Login from "./components/auth/Login";
// Nhập trang Đăng ký tài khoản
import Register from "./components/auth/Register";
// Nhập trang Quên mật khẩu
import ForgotPassword from "./components/auth/ForgotPassword";
// Nhập trang Xác thực OTP đăng nhập
import VerifyLogin from "./components/auth/VerifyLogin";
// Nhập trang Xác thực OTP đăng ký
import VerifyRegister from "./components/auth/VerifyRegister";
// Nhập trang Xác thực OTP đặt lại mật khẩu
import VerifyForgot from "./components/auth/VerifyForgot";

// ===== Landing (Các trang công khai ngoài trang chủ) =====
// Nhập trang chủ Landing Page
import Landing from "./components/landing/Landing";
// Nhập trang trợ lý Chatbot AI
import Chatbot from "./components/landing/Chatbot";
// Nhập trang xem cuộc đua trực tiếp Livestream
import Livestream from "./components/landing/Livestream";

// ===== Dashboards (Bảng điều khiển cho từng vai trò người dùng) =====
// Nhập trang Dashboard quản trị viên (Admin)
import Admin from "./components/dashboards/Admin";
// Nhập trang Dashboard chủ ngựa (Horse Owner)
import HorseOwner from "./components/dashboards/HorseOwner";
// Nhập trang Dashboard nài ngựa (Jockey)
import Jockey from "./components/dashboards/Jockey";
// Nhập trang Dashboard trọng tài (Referee)
import Referee from "./components/dashboards/Referee";
// Nhập trang Dashboard khán giả (Spectator)
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
  // Đợi kiểu dữ liệu cho children là một JSX.Element
  children: JSX.Element;
  // Danh sách các vai trò được phép truy cập đường dẫn này
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
        {/* Route trang chủ Landing Page */}
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        {/* Route trang Chatbot trợ lý AI */}
        <Route path="/chatbot" element={<PageTransition><Chatbot /></PageTransition>} />
        
        {/* Route xem trực tiếp cuộc đua (yêu cầu đăng nhập với bất kỳ vai trò nào từ 1 đến 5) */}
        <Route
          path="/livestream"
          element={
            // Bọc bảo vệ route yêu cầu roleId thuộc từ 1 đến 5
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              {/* Thêm hiệu ứng chuyển trang cho Livestream */}
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Route xem trực tiếp cuộc đua cụ thể bằng raceId */}
        <Route
          path="/livestream/:raceId"
          element={
            // Bọc bảo vệ route yêu cầu roleId thuộc từ 1 đến 5
            <ProtectedRoute allowedRoles={[1, 2, 3, 4, 5]}>
              {/* Thêm hiệu ứng chuyển trang cho Livestream theo raceId */}
              <PageTransition><Livestream /></PageTransition>
            </ProtectedRoute>
          }
        />
        
        {/* Các trang phục vụ Đăng nhập, Đăng ký và Quên mật khẩu kèm hiệu ứng chuyển trang */}
        {/* Route trang Đăng nhập */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        {/* Route trang Đăng ký */}
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        {/* Route trang Quên mật khẩu */}
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        {/* Route trang Xác thực đăng nhập OTP */}
        <Route path="/verify-login" element={<PageTransition><VerifyLogin /></PageTransition>} />
        {/* Route trang Xác thực đăng ký OTP */}
        <Route path="/verify-register" element={<PageTransition><VerifyRegister /></PageTransition>} />
        {/* Route trang Xác thực đổi mật khẩu OTP */}
        <Route path="/verify-forgot" element={<PageTransition><VerifyForgot /></PageTransition>} />

        {/* === Role-based dashboards (Phân quyền truy cập Dashboard theo ID vai trò) ===
            roleId: 1 = Admin, 2 = Owner (Chủ ngựa), 3 = Jockey (Nài ngựa), 4 = Spectator (Khán giả), 5 = Referee (Trọng tài) */}
        
        {/* Route Dashboard dành riêng cho Admin (roleId = 1) */}
        <Route
          path="/dashboard/admin"
          element={
            // Kiểm tra quyền Admin
            <ProtectedRoute allowedRoles={[1]}>
              {/* Render giao diện Admin với hiệu ứng chuyển trang */}
              <PageTransition><Admin /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Route Dashboard dành riêng cho Chủ ngựa (roleId = 2) */}
        <Route
          path="/dashboard/owner"
          element={
            // Kiểm tra quyền Chủ ngựa
            <ProtectedRoute allowedRoles={[2]}>
              {/* Render giao diện Chủ ngựa với hiệu ứng chuyển trang */}
              <PageTransition><HorseOwner /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Route Dashboard dành riêng cho Nài ngựa (roleId = 3) */}
        <Route
          path="/dashboard/jockey"
          element={
            // Kiểm tra quyền Nài ngựa
            <ProtectedRoute allowedRoles={[3]}>
              {/* Render giao diện Nài ngựa với hiệu ứng chuyển trang */}
              <PageTransition><Jockey /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Route Dashboard dành riêng cho Khán giả (roleId = 4) */}
        <Route
          path="/dashboard/spectator"
          element={
            // Kiểm tra quyền Khán giả
            <ProtectedRoute allowedRoles={[4]}>
              {/* Render giao diện Khán giả với hiệu ứng chuyển trang */}
              <PageTransition><Spectator /></PageTransition>
            </ProtectedRoute>
          }
        />
        {/* Route Dashboard dành riêng cho Trọng tài (roleId = 5) */}
        <Route
          path="/dashboard/referee"
          element={
            // Kiểm tra quyền Trọng tài
            <ProtectedRoute allowedRoles={[5]}>
              {/* Render giao diện Trọng tài với hiệu ứng chuyển trang */}
              <PageTransition><Referee /></PageTransition>
            </ProtectedRoute>
          }
        />

        {/* Route mặc định catch-all: Bất kỳ đường dẫn không hợp lệ nào sẽ chuyển hướng về trang chủ */}
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
  // Trả về cấu trúc cây component chính của ứng dụng
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

import { useState, useEffect } from "react"; // Import các hook cơ bản của React
import { useNavigate, useSearchParams } from "react-router-dom"; // Import công cụ điều hướng
import { authService } from "../../../services/authService"; // Import dịch vụ xác thực
import { $t } from '@/lib/i18n'; // Import hàm hỗ trợ dịch đa ngôn ngữ

// Component Xác thực mã OTP và đặt lại mật khẩu mới
export default function VerifyForgot() {
  // Khởi tạo các state
  const [otp, setOtp] = useState(""); // State lưu mã OTP
  const [newPassword, setNewPassword] = useState(""); // State lưu mật khẩu mới
  const [confirmPassword, setConfirmPassword] = useState(""); // State xác nhận mật khẩu mới
  const [error, setError] = useState(""); // Thông báo lỗi
  const [success, setSuccess] = useState(""); // Thông báo thành công
  const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu
  const [searchParams] = useSearchParams(); // Hook lấy tham số trên URL
  const navigate = useNavigate(); // Hook chuyển trang
  const otpTxId = searchParams.get("otpTxId"); // Lấy mã giao dịch OTP từ URL

  // Hook kiểm tra nếu không có mã giao dịch thì quay lại trang Quên mật khẩu
  useEffect(() => {
    if (!otpTxId) {
      navigate("/forgot-password");
    }
  }, [otpTxId, navigate]);

  // Hàm xử lý gửi yêu cầu đặt lại mật khẩu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const lang = localStorage.getItem("app-lang") || "vi"; // Lấy ngôn ngữ hiện tại

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      setError($t("Passwords do not match.", lang));
      return;
    }

    // Kiểm tra độ phức tạp của mật khẩu mới
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      setError(
        $t("New password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)", lang)
      );
      return;
    }

    if (!otpTxId) return;

    setLoading(true);

    try {
      // Gọi API xác thực mã OTP và cập nhật mật khẩu
      const res = await authService.verifyForgotPassword({
        otpTxId,
        otp,
        newPassword,
      });
      if (res.success) {
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500); // Chuyển về trang đăng nhập sau 2.5s
      } else {
        setError(res.error || "Verification failed. Please check the code.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during verification."); // Báo lỗi
    } finally {
      setLoading(false); // Tắt trạng thái tải
    }
  };

  // Trả về giao diện người dùng
  return (
    <div className="min-h-screen flex items-center justify-center bg-black/60 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#151310]/60 border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <span className="text-2xl font-bold font-serif">🔄</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Create New Password
          </h2>
          <p className="mt-2 text-center text-sm text-white/60">
            Enter the 6-digit code sent to your email along with your new password.
          </p>
        </div>

        {/* Hiển thị lỗi (nếu có) */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Hiển thị thông báo thành công */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-2 text-center">
                Verification Code (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoComplete="off"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="appearance-none block w-full px-4 py-3 bg-[#1a1815] border border-white/10 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-150 ease-in-out text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 bg-[#1a1815] border border-white/10 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 bg-[#1a1815] border border-white/10 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-150 ease-in-out sm:text-sm"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>
        </form>

        <div className="text-center text-sm mt-6">
          <button
            onClick={() => navigate("/forgot-password")}
            className="font-medium text-amber-500 hover:text-amber-400 transition"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}

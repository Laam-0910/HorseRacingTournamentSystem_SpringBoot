import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../../services/authService";
import { $t } from '@/lib/i18n';

/**
 * Component VerifyForgot - Trang xác nhận OTP quên mật khẩu và đặt lại mật khẩu mới.
 * Sử dụng mã OTP 6 chữ số gửi qua email kết hợp cùng mã giao dịch trong URL để thiết lập
 * mật khẩu mới sau khi đã xác minh thành công.
 */
export default function VerifyForgot() {
  // State lưu trữ mã OTP do người dùng nhập
  const [otp, setOtp] = useState("");
  // State lưu mật khẩu mới
  const [newPassword, setNewPassword] = useState("");
  // State lưu xác nhận mật khẩu mới
  const [confirmPassword, setConfirmPassword] = useState("");
  // State lưu thông tin lỗi nếu có
  const [error, setError] = useState("");
  // State lưu thông báo thành công
  const [success, setSuccess] = useState("");
  // Trạng thái chờ gọi API cập nhật mật khẩu
  const [loading, setLoading] = useState(false);
  // Hook xử lý trích xuất tham số Query từ URL (?otpTxId=xxx)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Trích xuất mã giao dịch OTP (otpTxId) từ URL
  const otpTxId = searchParams.get("otpTxId");

  // Effect kiểm tra nếu thiếu otpTxId trong URL, tự động chuyển người dùng về lại trang quên mật khẩu
  useEffect(() => {
    if (!otpTxId) {
      navigate("/forgot-password");
    }
  }, [otpTxId, navigate]);

  // Xử lý gửi biểu mẫu đặt lại mật khẩu khi submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tự reload trang
    setError("");
    setSuccess("");

    const lang = localStorage.getItem("app-lang") || "vi";

    // 1. Kiểm tra hai mật khẩu nhập vào có trùng khớp nhau không
    if (newPassword !== confirmPassword) {
      setError($t("Passwords do not match.", lang));
      return;
    }

    // 2. Kiểm tra độ phức tạp của mật khẩu mới (Chữ hoa, số, ký tự đặc biệt, >=8 ký tự)
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      setError(
        $t("New password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)", lang)
      );
      return;
    }

    if (!otpTxId) return;

    setLoading(true); // Bật hiệu ứng chờ gọi API

    try {
      // Gọi API gửi mã OTP cùng mật khẩu mới để thiết lập lại
      const res = await authService.verifyForgotPassword({
        otpTxId,
        otp,
        newPassword,
      });
      if (res.success) {
        // Nếu đặt lại mật khẩu thành công:
        // Hiển thị thông báo thành công và tự động điều hướng sang trang Đăng nhập sau 2.5 giây
        setSuccess("Password updated successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        // Nếu xác thực thất bại
        setError(res.error || "Verification failed. Please check the code.");
      }
    } catch (err: any) {
      // Nếu gặp lỗi kết nối
      setError(err.message || "An error occurred during verification.");
    } finally {
      setLoading(false); // Tắt hiệu ứng chờ gọi API
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/60 px-4 py-12 sm:px-6 lg:px-8">
      {/* Khung Card bọc mờ chứa form Thiết lập mật khẩu mới */}
      <div className="max-w-md w-full space-y-8 bg-[#151310]/60 border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div>
          {/* Icon làm mới vòng quay */}
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

        {/* Banner thông báo lỗi */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Banner thông báo thành công */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            {/* Trường nhập mã OTP xác thực */}
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

            {/* Trường nhập Mật khẩu mới */}
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

            {/* Trường nhập lại mật khẩu mới để xác nhận */}
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
            {/* Nút submit xác nhận đổi mật khẩu, vô hiệu hóa nếu mã OTP chưa đủ 6 ký tự */}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </div>
        </form>

        {/* Nút quay lại trang yêu cầu quên mật khẩu để gửi lại mã mới */}
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

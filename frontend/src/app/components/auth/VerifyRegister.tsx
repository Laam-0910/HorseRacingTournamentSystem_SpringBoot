import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../../services/authService";

/**
 * Component VerifyRegister - Trang xác thực đăng ký tài khoản (Verify Email qua mã OTP).
 * Sử dụng mã giao dịch gửi từ email (otpTxId) trong URL để gửi cùng mã OTP 6 số
 * lên server xác nhận kích hoạt tài khoản đăng ký mới.
 */
export default function VerifyRegister() {
  // State lưu mã OTP người dùng nhập
  const [otp, setOtp] = useState("");
  // State lưu thông báo lỗi
  const [error, setError] = useState("");
  // State lưu thông báo thành công
  const [success, setSuccess] = useState("");
  // Trạng thái chờ gọi API xác thực
  const [loading, setLoading] = useState(false);
  // Hook xử lý trích xuất các tham số Query từ URL (ví dụ: ?otpTxId=xxx)
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Trích xuất mã giao dịch OTP (otpTxId) từ Query Parameter trong URL
  const otpTxId = searchParams.get("otpTxId");

  // Effect kiểm tra nếu không có mã giao dịch trong URL, tự động chuyển người dùng về trang đăng ký
  useEffect(() => {
    if (!otpTxId) {
      navigate("/register");
    }
  }, [otpTxId, navigate]);

  // Xử lý gửi mã xác nhận đăng ký lên server khi người dùng submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn hành vi tải lại trang mặc định
    setError("");
    setSuccess("");
    setLoading(true);

    if (!otpTxId) return;

    try {
      // Gọi API xác thực tài khoản đăng ký với mã giao dịch và mã OTP
      const res = await authService.verifyRegister({ otpTxId, otp });
      if (res.success) {
        // Nếu xác thực thành công, hiển thị thông báo và tự động chuyển về trang Đăng nhập sau 2.5 giây
        setSuccess("Account verified successfully! Redirecting to login page...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        // Nếu server báo lỗi xác thực
        setError(res.error || "Verification failed. Please check the code.");
      }
    } catch (err: any) {
      // Trường hợp lỗi mạng hoặc lỗi server khác
      setError(err.message || "An error occurred during verification.");
    } finally {
      setLoading(false); // Tắt trạng thái chờ gọi API
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black/60 px-4 py-12 sm:px-6 lg:px-8">
      {/* Khung Card bọc mờ chứa giao diện Verify */}
      <div className="max-w-md w-full space-y-8 bg-[#151310]/60 border border-white/5 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div>
          {/* Icon lá thư bay bổng nhấp nháy */}
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <span className="text-2xl font-bold font-serif">📨</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Verify Email
          </h2>
          <p className="mt-2 text-center text-sm text-white/60">
            We have sent a 6-digit registration code to your email. Enter the code to activate your account.
          </p>
        </div>

        {/* Banner thông báo lỗi nếu có */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Banner thông báo thành công nếu có */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm text-center">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-2 text-center">
              Registration Code (OTP)
            </label>
            {/* Input nhập OTP: Chặn toàn bộ ký tự không phải số và giới hạn 6 ký tự */}
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="appearance-none block w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-150 ease-in-out text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
            />
          </div>

          <div>
            {/* Nút gửi xác nhận, bị vô hiệu hóa khi đang tải hoặc chuỗi nhập chưa đủ 6 ký tự */}
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-black bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? "Verifying..." : "Verify & Activate"}
            </button>
          </div>
        </form>

        {/* Nút điều hướng quay lại trang Đăng ký để thay đổi email */}
        <div className="text-center text-sm mt-6">
          <button
            onClick={() => navigate("/register")}
            className="font-medium text-amber-500 hover:text-amber-400 transition"
          >
            Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";

/**
 * Component VerifyLogin - Trang xác thực mã OTP đăng nhập (Bảo mật 2 lớp).
 * Nhận mã OTP 6 chữ số từ email người dùng gửi về để hoàn tất quá trình
 * đăng nhập an toàn vào hệ thống.
 */
export default function VerifyLogin() {
  const navigate = useNavigate();
  // Sử dụng useLocation để lấy các dữ liệu được truyền qua từ trang trước (Login)
  const location = useLocation();
  // Lấy hàm setUser từ AuthContext để lưu thông tin phiên đăng nhập thành công
  const { setUser } = useAuth();
  
  // State lưu trữ mã OTP do người dùng nhập
  const [otp, setOtp] = useState("");
  // State lưu thông tin lỗi nếu xác thực thất bại
  const [error, setError] = useState("");
  // Trạng thái chờ gọi API
  const [loading, setLoading] = useState(false);

  // Lấy ID giao dịch OTP (otpTxId) từ state của router (đã được truyền từ trang Login.tsx)
  const otpTxId = location.state?.otpTxId || "";

  // Xử lý gửi mã xác thực khi submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);
    
    try {
      // Nếu không có mã giao dịch OTP, yêu cầu người dùng quay lại trang đăng nhập để tạo mới
      if (!otpTxId) {
        throw new Error("Missing OTP transaction ID. Please log in again.");
      }
      
      // Gọi service API xác thực mã OTP kèm theo mã giao dịch
      const data = await authService.verifyLogin({ otpTxId, otp });
      
      if (data?.user && data?.token) {
        // Nếu xác thực thành công và nhận được User kèm JWT Token:
        // 1. Lưu JWT token vào sessionStorage
        sessionStorage.setItem("token", data.token);
        // 2. Lưu thông tin User vào AuthContext
        setUser(data.user);
        
        // 3. Chuyển hướng người dùng về đúng trang Dashboard theo vai trò tài khoản
        const roleId = data.user.roleId;
        if (roleId === 1) navigate("/dashboard/admin");
        else if (roleId === 2) navigate("/dashboard/owner");
        else if (roleId === 3) navigate("/dashboard/jockey");
        else if (roleId === 5) navigate("/dashboard/referee");
        else navigate("/dashboard/spectator");
      } else {
        // Ném lỗi nếu server phản hồi lỗi hoặc không trả về token/user
        throw new Error(data?.error || "Verification failed");
      }
    } catch (err: any) {
      // Cập nhật thông báo lỗi hiển thị lên màn hình
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false); // Tắt trạng thái chờ gọi API
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* Phông nền ảnh chiến mã tương tự trang login */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/anhngua1-1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "0 1rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {/* Logo trang xác thực dạng Khiên bảo vệ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>Verification</h1>
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>2-Step Login</p>
            </div>
          </div>

          {/* Khung Card nhập mã OTP */}
          <div style={{ background: "rgba(21,19,16,0.95)", backdropFilter: "blur(8px)", border: "1px solid #2a2825", borderRadius: "0.5rem", padding: "2rem", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f0f0f0", marginBottom: "0.25rem" }}>Enter Verification Code</h2>
            <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              We've sent a 6-digit verification code to your email. Please enter it below to complete login.
            </p>

            {/* Banner hiển thị lỗi */}
            {error && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "0.25rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>6-Digit Code</label>
                {/* Input nhập mã số OTP: Chỉ chấp nhận ký tự số, giới hạn 6 ký tự */}
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="------"
                  maxLength={6}
                  required
                  autoComplete="off"
                  style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.25rem", fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5em", fontFamily: "monospace" }}
                />
              </div>

              {/* Nút gửi mã OTP, bị vô hiệu hóa nếu mã chưa đủ 6 ký tự */}
              <button type="submit" disabled={loading || otp.length < 6} style={{ width: "100%", background: "#c9a227", color: "#0e0c09", padding: "0.75rem", borderRadius: "0.25rem", border: "none", fontFamily: "monospace", fontWeight: 500, fontSize: "0.875rem", cursor: loading || otp.length < 6 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem", opacity: loading || otp.length < 6 ? 0.7 : 1 }}>
                {loading ? "Verifying..." : "Verify & Login"}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              </button>
            </form>

            {/* Link quay lại trang Đăng nhập thông thường */}
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #2a2825", textAlign: "center" }}>
              <Link to="/login" style={{ fontSize: "0.75rem", color: "#c9a227", textDecoration: "none", fontWeight: 500 }}>Cancel and return to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

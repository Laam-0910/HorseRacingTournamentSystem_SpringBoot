// Import hook useState từ React
import { useState } from "react";
// Import hook useNavigate và component Link từ React Router
import { useNavigate, Link } from "react-router-dom";
// Import api client và hàm getErrMsg từ thư viện api
import { api, getErrMsg } from "../../../lib/api";
// Import hàm đa ngôn ngữ $t
import { $t } from '@/lib/i18n';

/**
 * Component Register - Trang đăng ký tài khoản mới cho hệ thống trường đua.
 * Cung cấp form thu thập Họ tên, Username, Email, Mật khẩu và xác nhận mật khẩu.
 * Thực hiện kiểm tra tính hợp lệ dữ liệu ở frontend (độ dài, trùng khớp mật khẩu, mật khẩu phức tạp)
 * trước khi gọi API đăng ký và chuyển tiếp sang xác thực mã OTP đăng ký.
 */
export default function Register() {
  // Hook điều hướng trang của React Router
  const navigate = useNavigate();
  
  // State lưu trữ dữ liệu form đăng ký tài khoản
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  // Trạng thái ẩn/hiện trường nhập mật khẩu
  const [showPwd, setShowPwd] = useState(false);
  // Trạng thái ẩn/hiện trường nhập mật khẩu xác nhận
  const [showConfirm, setShowConfirm] = useState(false);
  // State lưu thông báo lỗi dữ liệu nhập không hợp lệ
  const [error, setError] = useState("");
  // Trạng thái hiển thị vòng chờ gọi API đăng ký
  const [loading, setLoading] = useState(false);
  // Đọc ngôn ngữ hiện tại của ứng dụng
  const lang = localStorage.getItem("app-lang") || "vi";

  // Hàm xử lý khi người dùng submit form đăng ký
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tự tải lại trang
    
    // 1. Kiểm tra họ và tên hợp lệ (không trống và dài ít nhất 3 ký tự)
    if (!form.fullName.trim()) {
      // Đặt thông báo lỗi nếu họ tên trống
      setError($t("Vui lòng nhập họ và tên đầy đủ", lang));
      return;
    }
    if (form.fullName.trim().length < 3) {
      // Đặt thông báo lỗi nếu họ tên dưới 3 ký tự
      setError($t("Họ và tên phải có ít nhất 3 ký tự", lang));
      return;
    }
    
    // 2. Kiểm tra tên đăng nhập (username) hợp lệ
    if (!form.username.trim()) {
      // Đặt thông báo lỗi nếu username trống
      setError($t("Vui lòng nhập username đăng nhập", lang));
      return;
    }
    if (form.username.trim().length < 3) {
      // Đặt thông báo lỗi nếu username dưới 3 ký tự
      setError($t("Username must be at least 3 characters long", lang));
      return;
    }
    
    // 3. So sánh mật khẩu và mật khẩu nhập lại có trùng khớp không
    if (form.password !== form.confirmPassword) {
      // Đặt thông báo lỗi nếu mật khẩu nhập lại không khớp
      setError($t("Passwords do not match.", lang));
      return;
    }
    
    // 4. Kiểm tra độ phức tạp của mật khẩu bằng Regular Expression
    // Yêu cầu: Ít nhất 8 ký tự, 1 chữ cái hoa, 1 số, 1 ký tự đặc biệt
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(form.password)) {
      // Đặt thông báo lỗi nếu mật khẩu không đạt chuẩn an toàn
      setError(
        $t("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)", lang)
      );
      return;
    }

    setError(""); // Reset thông báo lỗi cũ
    setLoading(true); // Bật hiệu ứng chờ
    
    try {
      // Gọi API POST /auth/register để tạo tài khoản mới ở backend Spring Boot
      const res = await api.post<any>("/auth/register", { 
        username: form.username.trim(), 
        fullName: form.fullName.trim(), 
        email: form.email, 
        password: form.password 
      });
      
      if (res.requireOtp) {
        // Nếu hệ thống cấu hình yêu cầu xác minh email đăng ký:
        // Chuyển hướng người dùng sang trang verify-register cùng mã giao dịch OTP
        navigate(`/verify-register?otpTxId=${res.otpTxId}`, { state: { email: form.email } });
      } else {
        // Nếu không yêu cầu xác minh OTP, chuyển thẳng về trang Đăng nhập
        navigate("/login");
      }
    } catch (err: any) {
      // Cập nhật thông báo lỗi trả về từ server
      setError(getErrMsg(err, "Registration failed"));
    } finally {
      setLoading(false); // Tắt hiệu ứng chờ
    }
  };

  return (
    // Khung giao diện toàn màn hình tràn viewport
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      {/* Hình nền chiến mã tương tự trang Login */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/anhngua1-1.jpg')",
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        {/* Lớp phủ độ mờ màu xám đen để nổi bật nội dung form */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.70) 100%)" }} />
      </div>

      {/* Vùng căn giữa thẻ đăng ký */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "1rem" }}>
        {/* Khung nội dung tối đa 28rem */}
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {/* Khung chứa Icon cúp vàng */}
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* Biểu tượng cúp danh vọng SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            {/* Tiêu đề ứng dụng */}
            <div>
              {/* Tên thương hiệu HorseRace */}
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>HorseRace</h1>
              {/* Dòng mô tả hệ thống quản lý */}
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</p>
            </div>
          </div>

          {/* Khung Card chứa form Đăng ký */}
          <div style={{ background: "rgba(21,19,16,0.95)", backdropFilter: "blur(8px)", border: "1px solid #2a2825", borderRadius: "0.5rem", padding: "2rem", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            {/* Tiêu đề Đăng ký tài khoản */}
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f0f0f0", marginBottom: "0.25rem" }}>Create Account</h2>
            {/* Dòng giới thiệu tham gia hệ thống */}
            <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Join the racing season system</p>

            {/* Banner hiển thị lỗi */}
            {error && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "0.25rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace" }}>{error}</div>
            )}

            {/* Form thu thập dữ liệu người dùng */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Ô nhập Họ và Tên */}
              <div>
                {/* Nhãn Họ và tên */}
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Full Name</label>
                {/* Input nhập Họ tên */}
                <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Nguyen Van A" required style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem" }} />
              </div>

              {/* Ô nhập Tên đăng nhập */}
              <div>
                {/* Nhãn Username */}
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Username <span style={{ color: "#c9a227" }}>(for login)</span></label>
                {/* Input nhập Username */}
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="e.g. nguyenvana99" required style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem" }} />
              </div>

              {/* Ô nhập Email */}
              <div>
                {/* Nhãn Email */}
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Email</label>
                {/* Input nhập địa chỉ Email */}
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="your.email@example.com" required style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem" }} />
              </div>

              {/* Ô nhập Mật khẩu */}
              <div>
                {/* Nhãn Password */}
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Password</label>
                {/* Container chứa input mật khẩu và nút bật/tắt hiển thị */}
                <div style={{ position: "relative" }}>
                  {/* Input nhập Mật khẩu */}
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Create a password" required style={{ width: "100%", padding: "0.75rem 3rem 0.75rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem" }} />
                  {/* Nút bật tắt xem mật khẩu */}
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", display: "flex" }}>
                    {/* Icon mắt ẩn/hiện */}
                    {showPwd ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              {/* Ô xác nhận lại Mật khẩu */}
              <div>
                {/* Nhãn Confirm Password */}
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Confirm Password</label>
                {/* Container chứa input xác nhận mật khẩu và nút bật/tắt hiển thị */}
                <div style={{ position: "relative" }}>
                  {/* Input nhập lại Mật khẩu */}
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="Confirm your password" required style={{ width: "100%", padding: "0.75rem 3rem 0.75rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem" }} />
                  {/* Nút bật tắt xem mật khẩu xác nhận */}
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", display: "flex" }}>
                    {/* Icon mắt ẩn/hiện */}
                    {showConfirm ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              {/* Nút gửi yêu cầu đăng ký */}
              <button type="submit" disabled={loading} style={{ width: "100%", background: "#c9a227", color: "#0e0c09", padding: "0.75rem", borderRadius: "0.25rem", border: "none", fontFamily: "monospace", fontWeight: 500, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: loading ? 0.7 : 1 }}>
                {/* Hiển thị văn bản nút bấm dựa vào trạng thái loading */}
                {loading ? "Creating..." : "Create Account"}
                {/* Icon mũi tên hướng sang phải */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </form>

            {/* Link dẫn về trang Đăng nhập nếu đã có tài khoản */}
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #2a2825", textAlign: "center" }}>
              {/* Dòng chữ gợi ý đã có tài khoản */}
              <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>
                Already have an account?{" "}
                {/* Link chuyển sang trang Đăng nhập */}
                <Link to="/login" style={{ color: "#c9a227", textDecoration: "none", fontWeight: 500 }}>Sign in here</Link>
              </p>
            </div>
          </div>

          {/* Dòng chữ bản quyền phần chân trang */}
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#a0a0a0", marginTop: "1.5rem" }}>HorseRace Management System</p>
        </div>
      </div>
    </div>
  );
}

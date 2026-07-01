import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";

export default function VerifyLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const otpTxId = location.state?.otpTxId || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (!otpTxId) {
        throw new Error("Missing OTP transaction ID. Please log in again.");
      }
      const data = await authService.verifyLogin({ otpTxId, otp });
      if (data?.user && data?.token) {
        sessionStorage.setItem("token", data.token);
        setUser(data.user);
        const roleId = data.user.roleId;
        if (roleId === 1) navigate("/dashboard/admin");
        else if (roleId === 2) navigate("/dashboard/owner");
        else if (roleId === 3) navigate("/dashboard/jockey");
        else if (roleId === 5) navigate("/dashboard/referee");
        else navigate("/dashboard/spectator");
      } else {
        throw new Error(data?.error || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/anhngua1-1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.75) 100%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "0 1rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>Verification</h1>
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>2-Step Login</p>
            </div>
          </div>

          {/* Card */}
          <div style={{ background: "rgba(21,19,16,0.95)", backdropFilter: "blur(8px)", border: "1px solid #2a2825", borderRadius: "0.5rem", padding: "2rem", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f0f0f0", marginBottom: "0.25rem" }}>Enter Verification Code</h2>
            <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              We've sent a 6-digit verification code to your email. Please enter it below to complete login.
            </p>

            {error && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "0.25rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>6-Digit Code</label>
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

              <button type="submit" disabled={loading || otp.length < 6} style={{ width: "100%", background: "#c9a227", color: "#0e0c09", padding: "0.75rem", borderRadius: "0.25rem", border: "none", fontFamily: "monospace", fontWeight: 500, fontSize: "0.875rem", cursor: loading || otp.length < 6 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem", opacity: loading || otp.length < 6 ? 0.7 : 1 }}>
                {loading ? "Verifying..." : "Verify & Login"}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #2a2825", textAlign: "center" }}>
              <Link to="/login" style={{ fontSize: "0.75rem", color: "#c9a227", textDecoration: "none", fontWeight: 500 }}>Cancel and return to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

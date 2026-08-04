import { getErrMsg } from "../../../lib/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../../services/authService";

import StarryBackground from "../common/StarryBackground";

/**
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(""); 
    setError(""); 
    setLoading(true);
    
    try {
      const res = await authService.forgotPassword({ email: email.trim() });
      
      if (res.success && res.otpTxId) {
        setMessage("Verification code sent! Redirecting...");
        setTimeout(() => {
          navigate(`/verify-forgot?otpTxId=${res.otpTxId}`);
        }, 800);
      } else {
        setError(res.error || "Failed to send code");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <StarryBackground />

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "0 1rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>HorseRace</h1>
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</p>
            </div>
          </div>

          <div className="uiverse-cyber-form">
            <h2 className="title">Reset Password</h2>
            <p className="message">Enter your email or username to receive a verification code.</p>

            {message && (
              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "#c9a227", color: "#0b0d11", fontSize: "0.875rem", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                {message}
              </div>
            )}
            {error && (
              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace" }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <label>
                <input 
                  className="cyber-input" 
                  type="text" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder=" " 
                  required 
                />
                <span>Email or Username</span>
              </label>

              <button type="submit" disabled={loading} className="cyber-submit">
                {loading ? "Sending..." : "Send Verification Code"}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </form>

            <p className="signin">
              Remember your password?{" "}
              <Link to="/login">Back to login</Link>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#a0a0a0", marginTop: "1.5rem" }}>HorseRace Management System</p>
        </div>
      </div>
    </div>
  );
}

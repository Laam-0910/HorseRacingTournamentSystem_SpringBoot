import { getErrMsg } from "../../../lib/api";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/authService";

import StarryBackground from "../common/StarryBackground";

/**
 */
export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    
    try {
      const res = await authService.login({ username: email, password });
      
      if (res.requireOtp) {
        navigate("/verify-login", { state: { otpTxId: res.otpTxId } });
      } else if (res.user && res.token) {
        sessionStorage.setItem("token", res.token);
        setUser(res.user);
        const roleId = res.user.roleId;
        if (roleId === 1) navigate("/dashboard/admin");
        else if (roleId === 2) navigate("/dashboard/owner");
        else if (roleId === 3) navigate("/dashboard/jockey");
        else if (roleId === 5) navigate("/dashboard/referee");
        else navigate("/dashboard/spectator");
      } else {
        throw new Error(res.error || "Login failed");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <StarryBackground />

      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", height: "100%", padding: "0 1rem"
      }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", lineHeight: 1.2 }}>HorseRace</h1>
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</p>
            </div>
          </div>

          <div className="uiverse-cyber-form">
            <h2 className="title">Welcome Back</h2>
            <p className="message">Sign in to access your dashboard</p>

            {error && (
              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                {error}
              </div>
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

              <label>
                <div style={{ position: "relative" }}>
                  <input
                    className="cyber-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder=" "
                    required
                  />
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", display: "flex", zIndex: 10, padding: "0.25rem" }}
                  >
                    {showPassword
                      ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                      : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link to="/forgot-password" style={{ fontSize: "0.75rem", color: "#c9a227", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="cyber-submit">
                {loading ? "Signing in..." : "Sign In"}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </form>

            <p className="signin">
              Don't have an account?{" "}
              <Link to="/register">Register here</Link>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#a0a0a0", marginTop: "1.5rem" }}>
            HorseRace Management System
          </p>
        </div>
      </div>
    </div>
  );
}

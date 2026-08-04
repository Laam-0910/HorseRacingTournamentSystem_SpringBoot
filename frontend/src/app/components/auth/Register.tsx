import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, getErrMsg } from "../../../lib/api";
import { $t } from '@/lib/i18n';

import StarryBackground from "../common/StarryBackground";

/**
 */
export default function Register() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lang = localStorage.getItem("app-lang") || "en";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.fullName.trim()) {
      setError($t("Please enter your full name"));
      return;
    }
    if (form.fullName.trim().length < 3) {
      setError($t("Full name must be at least 3 characters"));
      return;
    }
    
    // 2. Validate username
    if (!form.username.trim()) {
      setError($t("Please enter a username for login"));
      return;
    }
    if (form.username.trim().length < 3) {
      setError($t("Username must be at least 3 characters long"));
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setError($t("Passwords do not match."));
      return;
    }
    
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(form.password)) {
      setError(
        $t("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)")
      );
      return;
    }

    setError("");
    setLoading(true);
    
    try {
      const res = await api.post<any>("/auth/register", { 
        username: form.username.trim(), 
        fullName: form.fullName.trim(), 
        email: form.email, 
        password: form.password 
      });
      
      if (res.requireOtp) {
        navigate(`/verify-register?otpTxId=${res.otpTxId}`, { state: { email: form.email } });
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <StarryBackground />

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>HorseRace</h1>
              <p style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</p>
            </div>
          </div>

          <div className="uiverse-cyber-form">
            <h2 className="title">Create Account</h2>
            <p className="message">Join the racing season system</p>

            {error && (
              <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "#c0392b", color: "#fff", fontSize: "0.875rem", fontFamily: "monospace" }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <label>
                <input 
                  className="cyber-input" 
                  type="text" 
                  value={form.fullName} 
                  onChange={e => setForm({...form, fullName: e.target.value})} 
                  placeholder=" " 
                  required 
                />
                <span>Full Name</span>
              </label>

              <label>
                <input 
                  className="cyber-input" 
                  type="text" 
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value})} 
                  placeholder=" " 
                  required 
                />
                <span>Username (for login)</span>
              </label>

              <label>
                <input 
                  className="cyber-input" 
                  type="email" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  placeholder=" " 
                  required 
                />
                <span>Email</span>
              </label>

              <label>
                <div style={{ position: "relative" }}>
                  <input 
                    className="cyber-input" 
                    type={showPwd ? "text" : "password"} 
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})} 
                    placeholder=" " 
                    required 
                  />
                  <span>Password</span>
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", zIndex: 10, display: "flex" }}>
                    {showPwd ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </label>

              <label>
                <div style={{ position: "relative" }}>
                  <input 
                    className="cyber-input" 
                    type={showConfirm ? "text" : "password"} 
                    value={form.confirmPassword} 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                    placeholder=" " 
                    required 
                  />
                  <span>Confirm Password</span>
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", zIndex: 10, display: "flex" }}>
                    {showConfirm ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </label>

              <button type="submit" disabled={loading} className="cyber-submit">
                {loading ? "Creating..." : "Create Account"}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </form>

            <p className="signin">
              Already have an account?{" "}
              <Link to="/login">Sign in here</Link>
            </p>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#a0a0a0", marginTop: "1.5rem" }}>HorseRace Management System</p>
        </div>
      </div>
    </div>
  );
}

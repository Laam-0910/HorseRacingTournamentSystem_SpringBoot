import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { api, getErrMsg } from "../../../../lib/api";

interface Props {
  roleColor: string;
  roleLabel: string;
}

export default function ProfileTab({ roleColor, roleLabel }: Props) {
  const { user, setUser } = useAuth();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const [fullName, setFullName] = useState(user?.fullName || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [weight, setWeight] = useState(user?.weight?.toString() || "");
  const [biography, setBiography] = useState(user?.biography || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [otpEnabled, setOtpEnabled] = useState<boolean>(user?.requireOtp ?? false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");

  useEffect(() => {
    if (user?.requireOtp !== undefined) {
      setOtpEnabled(!!user.requireOtp);
    }
  }, [user?.requireOtp]);

  const [passMode, setPassMode] = useState(false);
  const [otpTxId, setOtpTxId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileMsg(""); setProfileErr("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { 
        setProfileErr("Avatar image size must be under 1.5MB."); return;
      }
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setAvatar(event.target.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(""); setProfileErr("");
    if (user?.roleId === 3 && weight) {
      const wVal = parseFloat(weight);
      if (isNaN(wVal) || wVal < 45 || wVal > 100) {
        setProfileErr("Jockey weight must be between 45kg and 100kg.");
        return;
      }
    }

    setProfileLoading(true);
    try {
      const parsedWeight = user?.roleId === 3 ? parseFloat(weight) || null : null;
      const res = await api.post<any>("/auth/update-profile", {
        id: user?.id, fullName: fullName.trim(), email: email.trim(), weight: parsedWeight, avatar: avatar || null, biography: biography.trim(), requireOtp: otpEnabled
      });
      if (res.success && res.user) {
        setUser({ ...user, fullName: res.user.fullName, email: res.user.email, weight: res.user.weight, avatar: res.user.avatar, biography: res.user.biography, requireOtp: res.user.requireOtp ?? otpEnabled } as any);
        setProfileMsg("✅ Profile saved successfully!");
        setTimeout(() => setProfileMsg(""), 3000);
      } else {
        setProfileErr(res.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setProfileErr(getErrMsg(err, "Error updating profile."));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRequestPassCode = async () => {
    setPassMsg(""); setPassErr(""); setPassLoading(true);
    try {
      const res = await api.post<any>("/auth/forgot-password", { email: user?.email });
      if (res.success && res.otpTxId) {
        setOtpTxId(res.otpTxId); setPassMode(true);
        setPassMsg("🔑 Verification code sent to your email!");
      } else {
        setPassErr(res.error || "Error sending verification code.");
      }
    } catch (err: any) {
      setPassErr("Failed to send code.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleConfirmPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(""); setPassErr("");

    if (newPassword !== confirmPassword) { 
      setPassErr("Passwords do not match."); 
      return; 
    }

    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      setPassErr(
        "New password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)"
      );
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.post<any>("/auth/verify-forgot-password", { otpTxId, otp: otpCode.trim(), newPassword });
      if (res.success) {
        setPassMsg("✅ Password updated successfully!");
        setTimeout(() => { setPassMode(false); setOtpCode(""); setNewPassword(""); setConfirmPassword(""); setPassMsg(""); }, 2000);
      } else {
        setPassErr(res.error || "Verification failed");
      }
    } catch (err: any) {
      setPassErr(getErrMsg(err, "Error verifying code."));
    } finally {
      setPassLoading(false);
    }
  };

  const toggleOtp = async () => {
    setOtpLoading(true); setOtpMsg("");
    try {
      const next = !otpEnabled;
      await api.post("/auth/toggle-otp", { username: user?.username, requireOtp: next });
      setOtpEnabled(next);
      setUser({ ...user, requireOtp: next } as any);
    } catch {
      setOtpMsg("Error toggling 2FA");
    } finally {
      setOtpLoading(false);
    }
  };

  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "?";

  // NEW PURE GLASS STYLE
  const bentoBoxStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.03)", // Ultra light glass background
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderTop: "1px solid rgba(255, 255, 255, 0.15)", // Brighter top edge for 3D feel
    borderRadius: "24px",
    padding: "2rem",
    boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "1rem 1.25rem", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px", color: "#fff", fontSize: "0.95rem", outline: "none", transition: "all 0.3s ease",
    fontFamily: "'Outfit', 'Inter', sans-serif"
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.6)",
    marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Outfit', 'Inter', sans-serif"
  };

  const displayRoleLabel = roleLabel === "Horse Owner" || roleLabel === "Horse Owner" ? "HORSE OWNER" 
    : roleLabel === "Jockey" || roleLabel === "Jockey" ? "JOCKEY" 
    : roleLabel === "Admin" || roleLabel === "Admin" ? "ADMIN"
    : roleLabel === "Referee" || roleLabel === "Referee" ? "REFEREE"
    : roleLabel.toUpperCase();

  return (
    <div style={{ position: "relative", minHeight: "85vh", padding: isMobile ? "0.5rem" : "1.5rem", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
          
          @keyframes glowPulse {
            0% { transform: scale(1) translate(0, 0); opacity: 0.15; }
            33% { transform: scale(1.1) translate(5%, 5%); opacity: 0.2; }
            66% { transform: scale(0.9) translate(-5%, -5%); opacity: 0.1; }
            100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
          }
          
          .bento-input:focus {
            border-color: ${roleColor}88 !important;
            box-shadow: 0 0 0 4px ${roleColor}22 !important;
            background: rgba(255, 255, 255, 0.08) !important;
          }
          
          .bento-btn {
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px -5px ${roleColor}66;
          }
          .bento-btn::after {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
          }
          .bento-btn:hover::after { left: 100%; }
          .bento-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 12px 30px -5px ${roleColor}88; }
          .bento-btn:active { transform: translateY(1px); }
          
          .glass-badge {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(12px);
          }
          
          ::-webkit-scrollbar { width: 0px; background: transparent; }
        `}
      </style>

      {/* Pure Glow Background - Using ONLY the roleColor and White for a clean, non-muddy aesthetic */}
      <div style={{ 
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
        pointerEvents: "none", overflow: "hidden"
      }}>
         <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: roleColor, filter: "blur(140px)", animation: "glowPulse 15s ease infinite" }} />
         <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%", background: roleColor, filter: "blur(140px)", animation: "glowPulse 18s ease infinite reverse" }} />
         <div style={{ position: "absolute", top: "30%", left: "30%", width: "40%", height: "40%", background: "#ffffff", filter: "blur(120px)", opacity: 0.03 }} />
      </div>

      <div style={{ 
        position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto",
        display: "flex", flexDirection: "column", gap: "1.5rem"
      }}>

        {/* HERO ROW FOR NON-JOCKEYS (Instead of vertical stretch) */}
        {user?.roleId !== 3 && (
          <div style={{ ...bentoBoxStyle, flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "flex-start", gap: "2rem", padding: "2.5rem 3rem" }}>
             <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: `linear-gradient(90deg, transparent, ${roleColor}22)`, opacity: 0.5 }} />
             
             <div 
               onClick={() => fileInputRef.current?.click()}
               style={{ 
                 width: "120px", height: "120px", borderRadius: "50%", padding: "4px", flexShrink: 0,
                 background: `linear-gradient(135deg, ${roleColor}, rgba(255,255,255,0.1))`,
                 cursor: "pointer", boxShadow: `0 10px 30px ${roleColor}44`, position: "relative"
               }}
             >
               <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#111" }}>
                  {avatar ? (
                    <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", fontWeight: 800, color: roleColor }}>{getInitials(user?.fullName || user?.username)}</div>
                  )}
               </div>
               <div className="glass-badge" style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Change Avatar
               </div>
             </div>

             <div style={{ zIndex: 2, textAlign: isMobile ? "center" : "left" }}>
               <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem 0", letterSpacing: "-1px" }}>{user?.fullName || user?.username}</h2>
               <span style={{ color: roleColor, padding: "0.4rem 1.25rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", background: `${roleColor}15`, border: `1px solid ${roleColor}33` }}>
                 {displayRoleLabel}
               </span>
             </div>
          </div>
        )}

        {/* GRID LAYOUT */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(12, 1fr)", 
          gap: "1.5rem"
        }}>

          {/* FOR JOCKEY ONLY: AVATAR & STATS */}
          {user?.roleId === 3 && (
            <>
              {/* BENTO BOX 1: Avatar (Spans 4 cols) */}
              <div style={{ ...bentoBoxStyle, gridColumn: isMobile ? "span 1" : isTablet ? "span 2" : "span 4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem 2rem" }}>
                 <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: `linear-gradient(to bottom, ${roleColor}22, transparent)`, opacity: 0.5 }} />
                 
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   style={{ 
                     width: "140px", height: "140px", borderRadius: "50%", padding: "4px",
                     background: `linear-gradient(135deg, ${roleColor}, rgba(255,255,255,0.1))`,
                     cursor: "pointer", boxShadow: `0 15px 35px -10px ${roleColor}66`,
                     marginBottom: "1.5rem", position: "relative", zIndex: 2
                   }}
                 >
                   <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "#111" }}>
                      {avatar ? (
                        <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: 800, color: roleColor }}>{getInitials(user?.fullName || user?.username)}</div>
                      )}
                   </div>
                   <div className="glass-badge" style={{ position: "absolute", bottom: "-10px", left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Change Avatar
                   </div>
                 </div>

                 <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: "0 0 0.5rem 0", zIndex: 2 }}>{user?.fullName || user?.username}</h2>
                 
                 <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", zIndex: 2, flexWrap: "wrap" }}>
                   <span className="glass-badge" style={{ color: roleColor, padding: "0.4rem 1rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                     Jockey
                   </span>
                   {(user.totalTop3Finishes || 0) > 10 && (
                     <span style={{ background: "rgba(250, 204, 21, 0.15)", color: "#facc15", border: "1px solid rgba(250, 204, 21, 0.3)", padding: "0.4rem 1rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
                       Pro
                     </span>
                   )}
                 </div>
              </div>

              {/* BENTO BOX 2: Stats (Spans 8 cols) */}
              <div style={{ ...bentoBoxStyle, gridColumn: isMobile ? "span 1" : isTablet ? "span 2" : "span 8", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "2rem", padding: "2rem" }}>
                 <div style={{ textAlign: "center" }}>
                   <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 0.5rem 0" }}>Races Participated</p>
                   <h1 style={{ fontSize: "4.5rem", fontWeight: 800, margin: 0, background: `linear-gradient(to bottom, #fff, rgba(255,255,255,0.4))`, WebkitBackgroundClip: "text", color: "transparent", lineHeight: 1 }}>{user.totalRacesParticipated || 0}</h1>
                 </div>
                 
                 <div style={{ width: "1px", height: "80px", background: "rgba(255,255,255,0.1)", display: isMobile ? "none" : "block" }} />
                 
                 <div style={{ textAlign: "center" }}>
                   <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 0.5rem 0" }}>Top 3 Finishes</p>
                   <h1 style={{ fontSize: "4.5rem", fontWeight: 800, margin: 0, background: `linear-gradient(to bottom, #10b981, #047857)`, WebkitBackgroundClip: "text", color: "transparent", lineHeight: 1 }}>{user.totalTop3Finishes || 0}</h1>
                 </div>

                 <div style={{ width: "1px", height: "80px", background: "rgba(255,255,255,0.1)", display: isMobile ? "none" : "block" }} />
                 <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                   <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 0.5rem 0" }}>Achievement Title</p>
                   <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                     <span style={{ fontSize: "3rem", filter: "drop-shadow(0 0 15px rgba(251, 191, 36, 0.4))" }}>{(user.totalTop3Finishes || 0) > 10 ? "🏆" : "🏅"}</span>
                     <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                        {(user.totalTop3Finishes || 0) > 10 ? <span style={{ color: "#fbbf24" }}>Champion</span> : <span style={{ color: "#60a5fa" }}>Rising Star</span>}
                     </h2>
                   </div>
                 </div>
              </div>
            </>
          )}

          {/* BENTO BOX 3: Edit Profile (Spans 5 cols for Jockey, 8 cols for others) */}
          <div style={{ ...bentoBoxStyle, gridColumn: isMobile ? "span 1" : isTablet ? "span 2" : (user?.roleId === 3 ? "span 5" : "span 7") }}>
             <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
               </div>
               <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", margin: 0 }}>Edit Profile</h3>
             </div>

             <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg, image/jpg" style={{ display: "none" }} />
                
                <div style={{ display: "flex", gap: "1.25rem", flexDirection: isMobile ? "column" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Full Name</label>
                    <input type="text" className="bento-input" required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                  </div>
                  {user?.roleId === 3 && (
                    <div style={{ width: isMobile ? "100%" : "120px" }}>
                      <label style={labelStyle}>Weight (kg)</label>
                      <input type="number" step="0.1" className="bento-input" required value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
                    </div>
                  )}
                </div>

                {user?.roleId === 3 && (
                  <div>
                    <label style={labelStyle}>Biography</label>
                    <textarea 
                      className="bento-input" 
                      placeholder="Share your jockey experience..." 
                      value={biography} 
                      onChange={e => setBiography(e.target.value)} 
                      style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} 
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" className="bento-input" disabled readOnly value={email} style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
                </div>

                <div style={{ marginTop: "auto", paddingTop: "1.5rem" }}>
                  {profileMsg && <div style={{ padding: "0.85rem", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>{profileMsg}</div>}
                  {profileErr && <div style={{ padding: "0.85rem", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", textAlign: "center" }}>{profileErr}</div>}
                  <button type="submit" disabled={profileLoading} className="bento-btn" style={{ width: "100%", padding: "1.2rem", background: `linear-gradient(135deg, ${roleColor}, ${roleColor}aa)`, color: "#fff", border: "none", borderRadius: "16px", fontSize: "1rem", fontWeight: 700, cursor: profileLoading ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
                    {profileLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
             </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", gridColumn: isMobile ? "span 1" : isTablet ? "span 2" : (user?.roleId === 3 ? "span 7" : "span 5") }}>
            {/* BENTO BOX 4: Password */}
            <div style={{ ...bentoBoxStyle, flex: 1 }}>
               <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                 <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                 </div>
                 <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fff", margin: 0 }}>Password Settings</h3>
               </div>

               {!passMode ? (
                 <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                   <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "2rem" }}>Request a security code via Gmail to change your password.</p>
                   <div style={{ marginTop: "auto" }}>
                     <button onClick={handleRequestPassCode} disabled={passLoading} className="bento-btn" style={{ width: "100%", padding: "1.2rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "16px", fontSize: "0.95rem", fontWeight: 600, cursor: passLoading ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
                       {passLoading ? "Sending..." : "Request Password Change"}
                     </button>
                   </div>
                 </div>
               ) : (
                 <form onSubmit={handleConfirmPassChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%" }}>
                   <div>
                     <label style={labelStyle}>OTP Code</label>
                     <input type="text" className="bento-input" maxLength={6} required placeholder="Enter 6-digit OTP" value={otpCode} onChange={e => setOtpCode(e.target.value)} style={inputStyle} />
                   </div>
                   <div style={{ display: "flex", gap: "1.25rem" }}>
                     <div style={{ flex: 1 }}>
                       <label style={labelStyle}>New Password</label>
                       <input type="password" className="bento-input" required placeholder="Min 8 chars (uppercase, digit, special)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                     </div>
                     <div style={{ flex: 1 }}>
                       <label style={labelStyle}>Confirm Password</label>
                       <input type="password" className="bento-input" required placeholder="Re-enter new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
                     </div>
                   </div>
                   {passMsg && <div style={{ color: "#10b981", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>{passMsg}</div>}
                   {passErr && <div style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 600, textAlign: "center" }}>{passErr}</div>}
                   <div style={{ display: "flex", gap: "1rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                     <button type="submit" disabled={passLoading} className="bento-btn" style={{ flex: 2, padding: "1.1rem", background: "#fff", color: "#000", border: "none", borderRadius: "16px", fontSize: "1rem", fontWeight: 700, cursor: passLoading ? "not-allowed" : "pointer" }}>Update Password</button>
                     <button type="button" onClick={() => setPassMode(false)} style={{ flex: 1, padding: "1.1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "16px", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                   </div>
                 </form>
               )}
            </div>

            {/* BENTO BOX 5: Security / 2FA */}
            <div style={{ ...bentoBoxStyle, background: otpEnabled ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.03)", borderColor: otpEnabled ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)" }}>
               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                 <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                   <div style={{ width: 44, height: 44, borderRadius: 14, background: otpEnabled ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${otpEnabled ? "rgba(16,185,129,0.4)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={otpEnabled ? "#10b981" : "#fff"} strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                   </div>
                   <div>
                     <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", margin: "0 0 0.25rem 0" }}>2-Factor Auth (2FA)</h3>
                     <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", padding: "0.2rem 0.6rem", borderRadius: "100px", background: otpEnabled ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.1)", color: otpEnabled ? "#10b981" : "rgba(255,255,255,0.5)", display: "inline-block" }}>
                       {otpEnabled ? "Enabled" : "Disabled"}
                     </span>
                   </div>
                 </div>
                 
                 {/* Toggle Switch */}
                 <div onClick={toggleOtp} style={{ width: 60, height: 34, borderRadius: 17, background: otpEnabled ? "#10b981" : "rgba(0,0,0,0.6)", border: `2px solid ${otpEnabled ? "#10b981" : "rgba(255,255,255,0.2)"}`, cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
                    <div style={{ position: "absolute", top: 2, left: otpEnabled ? 28 : 2, width: 26, height: 26, borderRadius: "50%", background: "#fff", transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)", boxShadow: "0 2px 5px rgba(0,0,0,0.3)" }} />
                 </div>
               </div>
               
               <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>
                 Protect your account with email OTP on every login.
               </p>

               <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                 <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, margin: 0 }}>
                   Note: Admins & Referees bypass 2FA.
                 </p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

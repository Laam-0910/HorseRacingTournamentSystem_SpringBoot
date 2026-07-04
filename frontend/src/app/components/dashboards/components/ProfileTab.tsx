import { useState, useRef } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { api } from "../../../../lib/api";

interface Props {
  roleColor: string;
  roleLabel: string;
}

const PROFILE_TRANSLATIONS: Record<string, any> = {
  vi: {
    personalProfile: "Thông tin cá nhân",
    emailAddress: "Địa chỉ Email",
    saveChanges: "Lưu thay đổi",
    savingChanges: "Đang lưu thay đổi...",
    passwordSettings: "🔑 Cài đặt mật khẩu",
    passwordSettingsDesc: "Để thay đổi mật khẩu, vui lòng yêu cầu một mã xác minh bảo mật được gửi đến địa chỉ Gmail đã đăng ký của bạn.",
    changePassBtn: "Thay đổi mật khẩu qua xác thực Gmail",
    sendingCode: "Đang gửi mã xác minh...",
    twoFactor: "Xác thực 2 yếu tố",
    twoFactorDesc: "Khi được bật, mã OTP gồm 6 chữ số sẽ được gửi đến email của bạn mỗi khi đăng nhập. Cung cấp một lớp bảo mật bổ sung cho tài khoản của bạn.",
    noteAdmin: "Lưu ý: Tài khoản Admin và Trọng tài theo mặc định bỏ qua 2FA. Hãy đảm bảo địa chỉ email của bạn chính xác trước khi bật tính năng này.",
    upload: "Tải ảnh",
    fullName: "Họ và tên",
    weight: "Cân nặng (kg)",
    verCode: "Mã xác minh (từ Email)",
    enterOtp: "Nhập mã OTP 6 chữ số",
    newPass: "Mật khẩu mới",
    confirmPass: "Xác nhận mật khẩu mới",
    atLeast4: "Tối thiểu 4 ký tự",
    reEnter: "Nhập lại mật khẩu mới",
    updatePass: "Cập nhật mật khẩu",
    updating: "Đang cập nhật...",
    cancel: "Hủy",
    avatarSizeErr: "Kích thước ảnh đại diện phải nhỏ hơn 1.5MB",
    enabled: "Đã bật",
    disabled: "Đã tắt",
    successMsg: "✅ Cập nhật thông tin cá nhân thành công!"
  },
  en: {
    personalProfile: "Personal Profile Details",
    emailAddress: "Email Address",
    saveChanges: "Save Profile Changes",
    savingChanges: "Saving Changes...",
    passwordSettings: "🔒 Password Settings",
    passwordSettingsDesc: "To change your password, request a security verification code sent to your registered Gmail address.",
    changePassBtn: "Change Password via Gmail Verification",
    sendingCode: "Sending Verification Code...",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "When enabled, a 6-digit OTP code will be sent to your email each time you log in. Provides an extra layer of security for your account.",
    noteAdmin: "Note: Admin and Referee accounts bypass 2FA by default. Make sure your email address is correct before enabling this feature.",
    upload: "Upload",
    fullName: "Full Name",
    weight: "Weight (kg)",
    verCode: "Verification Code (from Email)",
    enterOtp: "Enter 6-digit OTP code",
    newPass: "New Password",
    confirmPass: "Confirm New Password",
    atLeast4: "At least 4 characters",
    reEnter: "Re-enter new password",
    updatePass: "Update Password",
    updating: "Updating...",
    cancel: "Cancel",
    avatarSizeErr: "Avatar image size must be less than 1.5MB",
    enabled: "Enabled",
    disabled: "Disabled",
    successMsg: "✅ Personal information updated successfully!"
  },
  zh: {
    personalProfile: "个人资料详情",
    emailAddress: "电子邮件地址",
    saveChanges: "保存个人资料更改",
    savingChanges: "正在保存更改...",
    passwordSettings: "🔒 密码设置",
    passwordSettingsDesc: "要更改密码，请请求向您的注册 Gmail 地址发送安全验证码。",
    changePassBtn: "通过 Gmail 验证更改密码",
    sendingCode: "正在发送验证码...",
    twoFactor: "双重身份验证 (2FA)",
    twoFactorDesc: "启用后，每次登录时都会向您的电子邮箱发送一个6位数的 OTP 验证码。为您的帐户提供额外的安全保障。",
    noteAdmin: "注意：管理员和裁判帐户默认绕过 2FA。在启用此功能之前，请确保您的电子邮箱地址正确无误。",
    upload: "上传头像",
    fullName: "姓名",
    weight: "体重 (kg)",
    verCode: "验证码 (来自邮箱)",
    enterOtp: "输入6位数OTP验证码",
    newPass: "新密码",
    confirmPass: "确认新密码",
    atLeast4: "至少4个字符",
    reEnter: "重新输入新密码",
    updatePass: "更新密码",
    updating: "正在更新...",
    cancel: "取消",
    avatarSizeErr: "头像图片大小必须小于 1.5MB",
    enabled: "已启用",
    disabled: "已禁用",
    successMsg: "✅ 个人信息更新成功！"
  },
  ja: {
    personalProfile: "個人プロフィールの詳細",
    emailAddress: "メールアドレス",
    saveChanges: "プロフィールの変更を保存",
    savingChanges: "変更を保存中...",
    passwordSettings: "🔒 パスワード設定",
    passwordSettingsDesc: "パスワードを変更するには、登録済みの Gmail アドレスにセキュリティ検証コードを送信するようリクエストしてください。",
    changePassBtn: "Gmail認証によるパスワード変更",
    sendingCode: "検証コードを送信中...",
    twoFactor: "二要素認証 (2FA)",
    twoFactorDesc: "有効にすると、ログインするたびに6桁 of OTPコードがメールに送信されます。アカウントにセキュリティレイヤーを追加します。",
    noteAdmin: "注意: 管理者および審判のアカウントはデフォルトで2FAをバイパスします。この機能を有効にする前に、メールアドレスが正しいことを確認してください。",
    upload: "アップロード",
    fullName: "氏名",
    weight: "体重 (kg)",
    verCode: "認証コード (メールから)",
    enterOtp: "6桁のOTPコードを入力してください",
    newPass: "新しいパスワード",
    confirmPass: "新しいパスワードの確認",
    atLeast4: "4文字以上",
    reEnter: "新しいパスワードを再入力してください",
    updatePass: "パスワードを更新",
    updating: "更新中...",
    cancel: "キャンセル",
    avatarSizeErr: "アバター画像のサイズは1.5MB未満である必要があります",
    enabled: "有効",
    disabled: "無効",
    successMsg: "✅ 個人情報が正常に更新されました！"
  }
};

export default function ProfileTab({ roleColor, roleLabel }: Props) {
  const { user, setUser } = useAuth();
  
  const lang = localStorage.getItem("app-lang") || "vi";
  const st = PROFILE_TRANSLATIONS[lang] || PROFILE_TRANSLATIONS.vi;
  
  // Profile state
  const [fullName, setFullName] = useState(user?.fullName || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [weight, setWeight] = useState(user?.weight?.toString() || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  // OTP Enable/Disable state
  const [otpEnabled, setOtpEnabled] = useState<boolean>(user?.requireOtp ?? false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");
  const [otpErr, setOtpErr] = useState("");

  // Password reset state
  const [passMode, setPassMode] = useState(false);
  const [otpTxId, setOtpTxId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileMsg("");
    setProfileErr("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // limit to 1.5MB
        setProfileErr(st.avatarSizeErr);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    setProfileLoading(true);
    try {
      const parsedWeight = user?.roleId === 3 ? parseFloat(weight) || null : null;
      const res = await api.post<any>("/auth/update-profile", {
        id: user?.id,
        fullName: fullName.trim(),
        email: email.trim(),
        weight: parsedWeight,
        avatar: avatar || null
      });

      if (res.success && res.user) {
        setUser({
          ...user,
          fullName: res.user.fullName,
          email: res.user.email,
          weight: res.user.weight,
          avatar: res.user.avatar
        } as any);
        setProfileMsg(st.successMsg);
      } else {
        setProfileErr(res.error || (lang === "vi" ? "Lỗi cập nhật thông tin." : lang === "zh" ? "更新个人资料失败。" : lang === "ja" ? "プロフィールの更新に失敗しました。" : "Failed to update profile."));
      }
    } catch (err: any) {
      setProfileErr(err.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Request Password Change Code
  const handleRequestPassCode = async () => {
    setPassMsg("");
    setPassErr("");
    setPassLoading(true);
    try {
      const res = await api.post<any>("/auth/forgot-password", { email: user?.email });
      if (res.success && res.otpTxId) {
        setOtpTxId(res.otpTxId);
        setPassMode(true);
        setPassMsg("🔑 Verification code has been sent to your Gmail.");
      } else {
        setPassErr(res.error || "Failed to request verification code.");
      }
    } catch (err: any) {
      setPassErr(err.message || "Failed to send password reset code. Please check email config.");
    } finally {
      setPassLoading(false);
    }
  };

  // Handle Confirm Password Change
  const handleConfirmPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg("");
    setPassErr("");
    if (newPassword.length < 4) {
      setPassErr("Password must be at least 4 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErr("Confirm password does not match");
      return;
    }
    setPassLoading(true);
    try {
      const res = await api.post<any>("/auth/verify-forgot-password", {
        otpTxId,
        otp: otpCode.trim(),
        newPassword
      });
      if (res.success) {
        setPassMsg("✅ Password updated successfully!");
        setTimeout(() => {
          setPassMode(false);
          setOtpCode("");
          setNewPassword("");
          setConfirmPassword("");
          setPassMsg("");
        }, 2500);
      } else {
        setPassErr(res.error || "Invalid OTP code.");
      }
    } catch (err: any) {
      setPassErr(err.message || "Failed to verify code and change password.");
    } finally {
      setPassLoading(false);
    }
  };

  // Handle OTP Toggle
  const toggleOtp = async () => {
    setOtpLoading(true);
    setOtpMsg("");
    setOtpErr("");
    try {
      const next = !otpEnabled;
      await api.post("/auth/toggle-otp", {
        username: user?.username,
        requireOtp: next,
      });
      setOtpEnabled(next);
      setUser({ ...user, requireOtp: next } as any);
      setOtpMsg(
        next
          ? "✅ Two-factor authentication has been ENABLED. You will receive an email OTP on next login."
          : "🔓 Two-factor authentication has been DISABLED."
      );
    } catch {
      setOtpErr("Failed to update 2FA setting. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "#1c1917",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "0.5rem",
    color: "#fff",
    fontSize: "0.8rem",
    fontFamily: "monospace",
    outline: "none"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.65rem",
    fontFamily: "monospace",
    textTransform: "uppercase",
    color: "#a0a0a0",
    marginBottom: "0.375rem",
    letterSpacing: "0.05em"
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start", maxWidth: "60rem" }}>
      
      {/* Left side: Profile Info & Avatar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.75rem", padding: "1.5rem",
        }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.05rem", color: "#f4f2ec", marginBottom: "1.5rem" }}>
            {st.personalProfile}
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Avatar block */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "1.25rem" }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "relative",
                  width: "4.5rem", height: "4.5rem",
                  borderRadius: "50%",
                  border: `2px solid ${roleColor}`,
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#1c1917"
                }}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.25rem", fontWeight: 700, color: roleColor, fontFamily: "monospace" }}>
                    {getInitials(user?.fullName || user?.username)}
                  </span>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.6)", padding: "0.15rem 0",
                  display: "flex", justifyContent: "center", alignItems: "center"
                }}>
                  <span style={{ fontSize: "0.5rem", color: "#fff", fontFamily: "monospace", textTransform: "uppercase" }}>{st.upload}</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/png, image/jpeg, image/jpg" 
                style={{ display: "none" }} 
              />
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f4f2ec" }}>{user?.fullName || user?.username}</p>
                <p style={{ fontSize: "0.65rem", fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", display: "inline-block", marginTop: "0.25rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                  🏷️ {lang === "vi" ? (roleLabel === "Admin" ? "Quản trị viên" : roleLabel === "Horse Owner" ? "Chủ ngựa" : roleLabel === "Jockey" ? "Nài ngựa" : roleLabel === "Referee" ? "Trọng tài" : "Người xem") : lang === "zh" ? (roleLabel === "Admin" ? "管理员" : roleLabel === "Horse Owner" ? "马主" : roleLabel === "Jockey" ? "骑师" : roleLabel === "Referee" ? "裁判" : "观众") : lang === "ja" ? (roleLabel === "Admin" ? "管理者" : roleLabel === "Horse Owner" ? "馬主" : roleLabel === "Jockey" ? "ジョッキー" : roleLabel === "Referee" ? "審判" : "観客") : roleLabel}
                </p>
              </div>
            </div>

            {/* Full Name field */}
            <div>
              <label style={labelStyle}>{st.fullName}</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                style={inputStyle} 
              />
            </div>

            {/* Email field */}
            <div>
              <label style={labelStyle}>{st.emailAddress}</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={inputStyle} 
              />
            </div>

            {/* Jockey weight field (Only displayed for Jockeys - roleId 3) */}
            {user?.roleId === 3 && (
              <div>
                <label style={labelStyle}>{st.weight}</label>
                <input 
                  type="number" 
                  step="0.1" 
                  required 
                  placeholder="E.g. 52.5" 
                  value={weight} 
                  onChange={e => setWeight(e.target.value)} 
                  style={inputStyle} 
                />
              </div>
            )}

            {profileMsg && <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#4ade80" }}>{profileMsg}</p>}
            {profileErr && <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#ef4444" }}>{profileErr}</p>}

            <button
              type="submit"
              disabled={profileLoading}
              style={{
                width: "100%", padding: "0.625rem",
                background: roleColor, color: "#fff",
                border: "none", borderRadius: "0.5rem",
                fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700,
                cursor: profileLoading ? "not-allowed" : "pointer"
              }}
            >
              {profileLoading ? st.savingChanges : st.saveChanges}
            </button>
          </form>
        </div>
      </div>

      {/* Right side: Security, Password & 2FA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Password Reset Section */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.75rem", padding: "1.5rem",
        }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.05rem", color: "#f4f2ec", marginBottom: "1.25rem" }}>
            {st.passwordSettings}
          </h3>

          {!passMode ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#a0a0a0", lineHeight: 1.5 }}>
                {st.passwordSettingsDesc}
              </p>
              {passErr && <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#ef4444" }}>{passErr}</p>}
              <button
                onClick={handleRequestPassCode}
                disabled={passLoading}
                style={{
                  width: "100%", padding: "0.625rem",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#f4f2ec", borderRadius: "0.5rem",
                  fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700,
                  cursor: passLoading ? "not-allowed" : "pointer"
                }}
              >
                {passLoading ? st.sendingCode : st.changePassBtn}
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmPassChange} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {passMsg && <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#4ade80" }}>{passMsg}</p>}
              {passErr && <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#ef4444" }}>{passErr}</p>}
              
              <div>
                <label style={labelStyle}>{st.verCode}</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  required 
                  placeholder={st.enterOtp} 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>{st.newPass}</label>
                <input 
                  type="password" 
                  required 
                  placeholder={st.atLeast4} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div>
                <label style={labelStyle}>{st.confirmPass}</label>
                <input 
                  type="password" 
                  required 
                  placeholder={st.reEnter} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={passLoading}
                  style={{
                    flex: 1, padding: "0.625rem",
                    background: roleColor, color: "#fff",
                    border: "none", borderRadius: "0.5rem",
                    fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700,
                    cursor: passLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {passLoading ? st.updating : st.updatePass}
                </button>
                <button
                  type="button"
                  onClick={() => setPassMode(false)}
                  style={{
                    padding: "0.625rem 1rem",
                    background: "rgba(255,255,255,0.05)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem",
                    fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {st.cancel}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2FA Toggle Section */}
        <div style={{
          background: otpEnabled ? "rgba(74,157,111,0.05)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${otpEnabled ? "rgba(74,157,111,0.25)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "0.75rem", padding: "1.5rem",
          transition: "all 0.3s",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>🔐</span>
                <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>
                  {st.twoFactor}
                </h3>
                <span style={{
                  fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase",
                  padding: "0.15rem 0.45rem", borderRadius: "0.25rem",
                  background: otpEnabled ? "rgba(74,157,111,0.2)" : "rgba(192,57,43,0.2)",
                  color: otpEnabled ? "#4a9d6f" : "#ef4444",
                }}>
                  {otpEnabled ? st.enabled : st.disabled}
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#a0a0a0", lineHeight: 1.6 }}>
                {st.twoFactorDesc}
              </p>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={toggleOtp}
              disabled={otpLoading}
              style={{
                flexShrink: 0,
                width: 52, height: 28,
                borderRadius: 14,
                background: otpEnabled ? "#4a9d6f" : "#2a2825",
                border: `2px solid ${otpEnabled ? "#4a9d6f" : "#3a3835"}`,
                cursor: otpLoading ? "not-allowed" : "pointer",
                position: "relative",
                transition: "all 0.3s",
                opacity: otpLoading ? 0.6 : 1,
              }}
            >
              <span style={{
                position: "absolute",
                top: 2, left: otpEnabled ? 22 : 2,
                width: 20, height: 20,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.3s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }} />
            </button>
          </div>

          {/* Messages */}
          {otpMsg && (
            <div style={{ marginTop: "1rem", padding: "0.625rem 0.875rem", borderRadius: "0.375rem", background: "rgba(74,157,111,0.1)", border: "1px solid rgba(74,157,111,0.2)", color: "#4a9d6f", fontSize: "0.8rem", fontFamily: "monospace" }}>
              {otpMsg}
            </div>
          )}
          {otpErr && (
            <div style={{ marginTop: "1rem", padding: "0.625rem 0.875rem", borderRadius: "0.375rem", background: "rgba(192,57,43,0.1)", border: "1px solid rgba(192,57,43,0.2)", color: "#ef4444", fontSize: "0.8rem", fontFamily: "monospace" }}>
              {otpErr}
            </div>
          )}

          <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "0.375rem", background: "rgba(201,162,39,0.05)", border: "1px solid rgba(201,162,39,0.15)" }}>
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", lineHeight: 1.6 }}>
              💡 <strong style={{ color: "#c9a227" }}>{lang === "vi" ? "Lưu ý" : lang === "zh" ? "注意" : lang === "ja" ? "注意" : "Note"}:</strong> {st.noteAdmin}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

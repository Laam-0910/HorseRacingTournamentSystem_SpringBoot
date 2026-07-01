import { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { api } from "../../../../lib/api";

interface Props {
  roleColor: string;
  roleLabel: string;
}

export default function ProfileTab({ roleColor, roleLabel }: Props) {
  const { user } = useAuth();
  const [otpEnabled, setOtpEnabled] = useState<boolean>(
    (user as any)?.requireOtp ?? false
  );
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");
  const [otpErr, setOtpErr] = useState("");

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "40rem" }}>

      {/* Account Info */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "0.75rem", padding: "1.5rem",
      }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.05rem", color: "#f4f2ec", marginBottom: "1.25rem" }}>
          Account Information
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { label: "Username", value: user?.username },
            { label: "Email", value: (user as any)?.email || "—" },
            { label: "Role", value: roleLabel },
            { label: "Status", value: (user as any)?.status || "ACTIVE" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
              <span style={{ fontSize: "0.85rem", color: "#f0f0f0", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Toggle */}
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
                Two-Factor Authentication
              </h3>
              <span style={{
                fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase",
                padding: "0.15rem 0.45rem", borderRadius: "0.25rem",
                background: otpEnabled ? "rgba(74,157,111,0.2)" : "rgba(192,57,43,0.2)",
                color: otpEnabled ? "#4a9d6f" : "#ef4444",
              }}>
                {otpEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#a0a0a0", lineHeight: 1.6 }}>
              When enabled, a 6-digit OTP code will be sent to your email each time you log in.
              Provides an extra layer of security for your account.
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
            💡 <strong style={{ color: "#c9a227" }}>Note:</strong> Admin and Referee accounts bypass 2FA by default.
            Make sure your email address is correct before enabling this feature.
          </p>
        </div>
      </div>

    </div>
  );
}

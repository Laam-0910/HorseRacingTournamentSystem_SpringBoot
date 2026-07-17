import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

export default function Users() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const lang = localStorage.getItem("app-lang") || "vi";
  const placeholderText = 
    lang === "en" ? "Search username, email, or horse..." :
    lang === "zh" ? "搜索用户名、邮箱或马匹..." :
    lang === "ja" ? "ユーザー名、メール、または馬を検索..." :
    "Tìm kiếm tên người dùng, email, hoặc ngựa...";

  // Create User Form State
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRoleId, setCreateRoleId] = useState("4"); // Default Spectator
  const [createWeight, setCreateWeight] = useState("");

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("4");
  const [editWeight, setEditWeight] = useState("");
  const [editRequireOtp, setEditRequireOtp] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const allUsers = await api.get<any[]>("/admin/users");
      setUsers(allUsers);
    } catch (err: any) {
      setError(err.message || "Failed to load users data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const body: any = {
        username: createUsername,
        email: createEmail,
        password: createPassword,
        roleId: parseInt(createRoleId, 10),
      };
      if (createRoleId === "3" && createWeight) {
        body.weight = parseFloat(createWeight);
      }

      const res = await api.post<any>("/admin/users", body);
      if (res.user) {
        showSuccess(`Account "${createUsername}" created successfully.`);
        // Reset form
        setCreateUsername("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateRoleId("4");
        setCreateWeight("");
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRoleId(user.roleId.toString());
    setEditWeight(user.weight ? user.weight.toString() : "");
    setEditRequireOtp(!!user.requireOtp);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError("");
    setSuccess("");
    try {
      const body: any = {
        username: editUsername,
        email: editEmail,
        roleId: parseInt(editRoleId, 10),
        requireOtp: editRequireOtp,
      };
      if (editRoleId === "3" && editWeight) {
        body.weight = parseFloat(editWeight);
      }

      await api.post(`/admin/users/${editingUser.id}`, body);
      showSuccess(`User "${editUsername}" updated successfully.`);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert("Failed to update user: " + err.message);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/toggle`);
      showSuccess("User status changed.");
      fetchData();
    } catch (err: any) {
      alert("Failed to change status: " + err.message);
    }
  };



  const filteredUsers = users.filter((u) => {
    let matchesRole = true;
    if (filterRole === "ADMIN") matchesRole = (u.roleId === 1);
    else if (filterRole === "OWNER") matchesRole = (u.roleId === 2);
    else if (filterRole === "JOCKEY") matchesRole = (u.roleId === 3);
    else if (filterRole === "SPECTATOR") matchesRole = (u.roleId === 4);
    else if (filterRole === "REFEREE") matchesRole = (u.roleId === 5);

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const usernameMatch = (u.username || "").toLowerCase().includes(q);
      const emailMatch = (u.email || "").toLowerCase().includes(q);
      matchesSearch = usernameMatch || emailMatch;
    }

    return matchesRole && matchesSearch;
  });



  const getRoleName = (roleId: number) => {
    if (roleId === 1) return $t("Admin", (localStorage.getItem('app-lang') || 'vi'));
    if (roleId === 2) return $t("Horse Owner", (localStorage.getItem('app-lang') || 'vi'));
    if (roleId === 3) return "Jockey";
    if (roleId === 5) return $t("Referee", (localStorage.getItem('app-lang') || 'vi'));
    return $t("Spectator", (localStorage.getItem('app-lang') || 'vi'));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "13px" }}>
          ✓ {success}
        </div>
      )}

      {/* 1. Create New Account (JSP Style) */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Create New Account", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Register an Owner, Jockey or Spectator manually", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={labelStyle}>{$t("Username", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input type="text" required value={createUsername} onChange={e => setCreateUsername(e.target.value)} style={inputStyle} placeholder={$t("Nguyen Van A", (localStorage.getItem('app-lang') || 'vi'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Email", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input type="email" required value={createEmail} onChange={e => setCreateEmail(e.target.value)} style={inputStyle} placeholder={$t("van.a@example.com", (localStorage.getItem('app-lang') || 'vi'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Password", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input type="password" required value={createPassword} onChange={e => setCreatePassword(e.target.value)} style={inputStyle} placeholder={$t("••••••••", (localStorage.getItem('app-lang') || 'vi'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Role", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <select value={createRoleId} onChange={e => setCreateRoleId(e.target.value)} style={selectStyle}>
              <option value="4">{$t("Spectator / Fan", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="2">{$t("Horse Owner", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="3">{$t("Jockey", (localStorage.getItem('app-lang') || 'vi'))}</option>
            </select>
          </div>
          {createRoleId === "3" && (
            <div>
              <label style={labelStyle}>{$t("Weight (kg)", (localStorage.getItem('app-lang') || 'vi'))}</label>
              <input type="number" step="0.1" required value={createWeight} onChange={e => setCreateWeight(e.target.value)} style={inputStyle} placeholder={$t("E.g., 55.5", (localStorage.getItem('app-lang') || 'vi'))} />
            </div>
          )}
          <div>
            <button type="submit" style={{ width: "100%", padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>{$t("+ Create", (localStorage.getItem('app-lang') || 'vi'))}</button>
          </div>
        </form>
      </div>

      {/* 2. Unified Directory Search Bar */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🔍</span>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder={placeholderText} 
          style={{ 
            flex: 1, 
            background: "none", 
            border: "none", 
            color: "#f4f2ec", 
            fontSize: "0.825rem", 
            outline: "none",
            fontFamily: "monospace"
          }} 
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")} 
            style={{ 
              background: "none", 
              border: "none", 
              color: "rgba(255,255,255,0.4)", 
              cursor: "pointer", 
              fontSize: "11px",
              fontFamily: "monospace" 
            }}
          >{$t("Clear", (localStorage.getItem('app-lang') || 'vi'))}</button>
        )}
      </div>

      {/* 3. Registered Users Directory */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Registered Users Directory", (localStorage.getItem('app-lang') || 'vi'))}</h4>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("System user catalog & role assignment options", (localStorage.getItem('app-lang') || 'vi'))}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{$t("Filter:", (localStorage.getItem('app-lang') || 'vi'))}</span>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: "0.25rem 0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#f4f2ec", fontSize: "11px" }}>
              <option value="ALL">{$t("All Roles", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="ADMIN">{$t("Administrators", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="OWNER">{$t("Horse Owners", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="JOCKEY">{$t("Jockeys", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="REFEREE">{$t("Referees", (localStorage.getItem('app-lang') || 'vi'))}</option>
              <option value="SPECTATOR">{$t("Spectators", (localStorage.getItem('app-lang') || 'vi'))}</option>
            </select>
          </div>
        </div>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No matching users found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : filteredUsers.map((u) => (
              <div key={u.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", opacity: u.status === "INACTIVE" ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "14px" }}>{u.username}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>Email: {u.email}</div>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>ID: #{u.id}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.375rem" }}>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: u.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: u.status === "ACTIVE" ? "#34d399" : "#f87171" }}>
                      {u.status}
                    </span>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: "rgba(201,162,39,0.1)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.2)" }}>
                      {getRoleName(u.roleId)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "flex-end" }}>
                  <button onClick={() => handleOpenEdit(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(59,130,196,0.1)", border: "1px solid rgba(59,130,196,0.2)", color: "#60a5fa", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>{$t("Edit", (localStorage.getItem('app-lang') || 'vi'))}</button>
                  {u.roleId !== 1 && (
                    <button onClick={() => handleToggleStatus(u.id)} style={{ padding: "0.375rem 0.75rem", background: u.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: u.status === "ACTIVE" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)", color: u.status === "ACTIVE" ? "#f87171" : "#34d399", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>
                      {u.status === "ACTIVE" ? $t("Deactivate", (localStorage.getItem('app-lang') || 'vi')) : $t("Activate", (localStorage.getItem('app-lang') || 'vi'))}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["User Details", "Status", "Role", "Role Management"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1.5rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 3 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No matching users found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.015] transition-colors" style={{ opacity: u.status === "INACTIVE" ? 0.6 : 1 }}>
                    <td style={{ padding: "0.75rem 1.5rem" }}>
                      <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{u.username}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Email: {u.email} | ID: #{u.id}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1.5rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: u.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: u.status === "ACTIVE" ? "#34d399" : "#f87171" }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1.5rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: "rgba(201,162,39,0.1)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.2)" }}>
                        {getRoleName(u.roleId)}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                        <button onClick={() => handleOpenEdit(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(59,130,196,0.1)", border: "1px solid rgba(59,130,196,0.2)", color: "#60a5fa", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>{$t("Edit", (localStorage.getItem('app-lang') || 'vi'))}</button>
                        {u.roleId !== 1 && (
                          <button onClick={() => handleToggleStatus(u.id)} style={{ padding: "0.375rem 0.75rem", background: u.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: u.status === "ACTIVE" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)", color: u.status === "ACTIVE" ? "#f87171" : "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>
                            {u.status === "ACTIVE" ? $t("Deactivate", (localStorage.getItem('app-lang') || 'vi')) : $t("Activate", (localStorage.getItem('app-lang') || 'vi'))}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "28rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,162,39,0.1)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>{$t("Edit User Account", (localStorage.getItem('app-lang') || 'vi'))}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>{$t("Username", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <input type="text" required value={editUsername} onChange={e => setEditUsername(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{$t("Email", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <input type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{$t("Role", (localStorage.getItem('app-lang') || 'vi'))}</label>
                {editingUser.roleId === 1 ? (
                  <input type="text" disabled value="Administrator" style={{ ...inputStyle, opacity: 0.6 }} />
                ) : (
                  <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} style={selectStyle}>
                    <option value="4">{$t("Spectator / Fan", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="2">{$t("Horse Owner", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="3">{$t("Jockey", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  </select>
                )}
              </div>
              {editRoleId === "3" && (
                <div>
                  <label style={labelStyle}>{$t("Weight (kg)", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="number" step="0.1" required value={editWeight} onChange={e => setEditWeight(e.target.value)} style={inputStyle} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                <input type="checkbox" id="requireOtp" checked={editRequireOtp} onChange={e => setEditRequireOtp(e.target.checked)} style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#c9a227" }} />
                <label htmlFor="requireOtp" style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>{$t("Enable Login OTP Verification", (localStorage.getItem('app-lang') || 'vi'))}</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(201,162,39,0.1)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>{$t("Save Changes", (localStorage.getItem('app-lang') || 'vi'))}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "0.5rem",
  color: "rgba(255,255,255,0.4)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "#12141a",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

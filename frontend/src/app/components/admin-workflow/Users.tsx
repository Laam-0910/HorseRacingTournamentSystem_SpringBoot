import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, getErrMsg } from "../../../lib/api";
import { PaginationControls } from "./PaginationControls";

/**
 */
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

  const lang = localStorage.getItem("app-lang") || "en";
  const placeholderText = "Search username, email, or horse...";

  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRoleId, setCreateRoleId] = useState("4"); // Default: Spectator
  const [createWeight, setCreateWeight] = useState("");

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("4");
  const [editWeight, setEditWeight] = useState("");
  const [editRequireOtp, setEditRequireOtp] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchQuery]);

  const [depositModalUser, setDepositModalUser] = useState<any | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("500");

  const handleDepositWallet = async () => {
    if (!depositModalUser || !depositAmount || parseFloat(depositAmount) <= 0) return;
    try {
      await api.post(`/admin/users/${depositModalUser.id}/deposit`, { amount: parseFloat(depositAmount) });
      showSuccess(`Successfully deposited ${parseFloat(depositAmount).toLocaleString()} VND into ${depositModalUser.username}'s wallet.`);
      setDepositModalUser(null);
      setDepositAmount("500");
      fetchData();
    } catch (err: any) {
      alert(getErrMsg(err, "Deposit failed: "));
    }
  };

  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [userDetailsData, setUserDetailsData] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<"general" | "role" | "invitations" | "commissions">("general");

  const handleViewFullDetails = async (u: any) => {
    setViewingUser(u);
    setActiveDetailsTab("general");
    setUserDetailsData(null);
    setDetailsLoading(true);
    try {
      const data = await api.get<any>(`/admin/users/${u.id}/details`);
      setUserDetailsData(data);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load user profile details."));
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const allUsers = await api.get<any[]>("/admin/users");
      setUsers(allUsers);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load users data."));
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
    const lang = localStorage.getItem("app-lang") || "en";

    if (createUsername.trim().length < 3) {
      setError($t("Username must be at least 3 characters long"));
      return;
    }

    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(createPassword)) {
      setError(
        $t("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)")
      );
      return;
    }

    try {
      const body: any = {
        username: createUsername.trim(),
        email: createEmail.trim(),
        password: createPassword,
        roleId: parseInt(createRoleId, 10),
      };
      // Include weight if jockey (range 45-100kg)
      if (createRoleId === "3" && createWeight) {
        const wVal = parseFloat(createWeight);
        if (isNaN(wVal) || wVal < 45 || wVal > 100) {
          setError($t("Jockey weight must be between 45kg and 100kg."));
          return;
        }
        body.weight = wVal;
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
      setError(getErrMsg(err, "Failed to create user."));
    }
  };

  // Open edit modal and set initial values
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRoleId(user.roleId.toString());
    setEditWeight(user.weight ? user.weight.toString() : "");
    setEditRequireOtp(!!user.requireOtp);
  };

  // Submit account update
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
      // Include weight if jockey (range 45-100kg)
      if (editRoleId === "3" && editWeight) {
        const wVal = parseFloat(editWeight);
        if (isNaN(wVal) || wVal < 45 || wVal > 100) {
          alert($t("Jockey weight must be between 45kg and 100kg."));
          return;
        }
        body.weight = wVal;
      }

      await api.post(`/admin/users/${editingUser.id}`, body);
      showSuccess(`User "${editUsername}" updated successfully.`);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      alert(getErrMsg(err, "Failed to update user: "));
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.post(`/admin/users/${id}/toggle`);
      showSuccess("User status changed.");
      fetchData();
    } catch (err: any) {
      alert(getErrMsg(err, "Failed to change status: "));
    }
  };

  const filteredUsers = users.filter((u: any) => {
    if (filterRole !== "ALL") {
      let rId = 0;
      if (filterRole === "ADMIN") rId = 1;
      else if (filterRole === "OWNER") rId = 2;
      else if (filterRole === "JOCKEY") rId = 3;
      else if (filterRole === "SPECTATOR") rId = 4;
      else if (filterRole === "REFEREE") rId = 5;
      if (u.roleId !== rId && String(u.roleId) !== filterRole) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (u.username || "").toLowerCase().includes(q) || (u.fullName || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRoleName = (roleId: number) => {
    if (roleId === 1) return $t("Admin", (localStorage.getItem('app-lang') || 'en'));
    if (roleId === 2) return $t("Horse Owner", (localStorage.getItem('app-lang') || 'en'));
    if (roleId === 3) return "Jockey";
    if (roleId === 5) return $t("Referee", (localStorage.getItem('app-lang') || 'en'));
    return $t("Spectator", (localStorage.getItem('app-lang') || 'en'));
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

      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Create New Account", (localStorage.getItem('app-lang') || 'en'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Register an Owner, Jockey, Referee or Spectator manually", (localStorage.getItem('app-lang') || 'en'))}</p>
        </div>
        <form onSubmit={handleCreateUser} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", alignItems: "end" }}>
          <div>
            <label style={labelStyle}>{$t("Username", (localStorage.getItem('app-lang') || 'en'))}</label>
            <input type="text" required value={createUsername} onChange={e => setCreateUsername(e.target.value)} style={inputStyle} placeholder={window.innerWidth < 768 ? "Nguyen Van A" : $t("Nguyen Van A", (localStorage.getItem('app-lang') || 'en'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Email", (localStorage.getItem('app-lang') || 'en'))}</label>
            <input type="email" required value={createEmail} onChange={e => setCreateEmail(e.target.value)} style={inputStyle} placeholder={window.innerWidth < 768 ? "van.a@example.com" : $t("van.a@example.com", (localStorage.getItem('app-lang') || 'en'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Password", (localStorage.getItem('app-lang') || 'en'))}</label>
            <input type="password" required value={createPassword} onChange={e => setCreatePassword(e.target.value)} style={inputStyle} placeholder={window.innerWidth < 768 ? "Min 8 chars" : $t("Min 8 chars (uppercase, digit, special)", (localStorage.getItem('app-lang') || 'en'))} />
          </div>
          <div>
            <label style={labelStyle}>{$t("Role", (localStorage.getItem('app-lang') || 'en'))}</label>
            <select value={createRoleId} onChange={e => setCreateRoleId(e.target.value)} style={selectStyle}>
              <option value="4">{$t("Spectator / Fan", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="2">{$t("Horse Owner", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="3">{$t("Jockey", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="5">{$t("Referee", (localStorage.getItem('app-lang') || 'en'))}</option>
            </select>
          </div>
          {createRoleId === "3" && (
            <div>
              <label style={labelStyle}>{$t("Weight (kg)", (localStorage.getItem('app-lang') || 'en'))}</label>
              <input type="number" step="0.1" required value={createWeight} onChange={e => setCreateWeight(e.target.value)} style={inputStyle} placeholder={$t("E.g., 55.5", (localStorage.getItem('app-lang') || 'en'))} />
            </div>
          )}
          <div>
            <button type="submit" style={{ width: "100%", padding: "0.625rem", border: "none", borderRadius: "0.5rem", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>{$t("+ Create", (localStorage.getItem('app-lang') || 'en'))}</button>
          </div>
        </form>
      </div>

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
          >{$t("Clear", (localStorage.getItem('app-lang') || 'en'))}</button>
        )}
      </div>

      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Registered Users Directory", (localStorage.getItem('app-lang') || 'en'))}</h4>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("System user catalog & role assignment options", (localStorage.getItem('app-lang') || 'en'))}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{$t("Filter:", (localStorage.getItem('app-lang') || 'en'))}</span>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: "0.25rem 0.5rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#f4f2ec", fontSize: "11px" }}>
              <option value="ALL">{$t("All Roles", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="ADMIN">{$t("Administrators", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="OWNER">{$t("Horse Owners", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="JOCKEY">{$t("Jockeys", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="REFEREE">{$t("Referees", (localStorage.getItem('app-lang') || 'en'))}</option>
              <option value="SPECTATOR">{$t("Spectators", (localStorage.getItem('app-lang') || 'en'))}</option>
            </select>
          </div>
        </div>
        
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'en'))}</div>
            ) : paginatedUsers.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No matching users found.", (localStorage.getItem('app-lang') || 'en'))}</div>
            ) : paginatedUsers.map((u) => (
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
                  <button onClick={() => handleViewFullDetails(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#fbbf24", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "bold" }}>View Details</button>
                  <button onClick={() => handleOpenEdit(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(59,130,196,0.1)", border: "1px solid rgba(59,130,196,0.2)", color: "#60a5fa", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>{$t("Edit", (localStorage.getItem('app-lang') || 'en'))}</button>
                  {u.roleId !== 1 && (
                    <button onClick={() => handleToggleStatus(u.id)} style={{ padding: "0.375rem 0.75rem", background: u.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: u.status === "ACTIVE" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)", color: u.status === "ACTIVE" ? "#f87171" : "#34d399", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>
                      {u.status === "ACTIVE" ? $t("Deactivate", (localStorage.getItem('app-lang') || 'en')) : $t("Activate", (localStorage.getItem('app-lang') || 'en'))}
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
                    <th key={idx} style={{ padding: "0.75rem 1.5rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 3 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'en'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No matching users found.", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                ) : paginatedUsers.map((u) => (
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
                        <button onClick={() => handleViewFullDetails(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#fbbf24", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "bold" }}>View Details</button>
                        <button onClick={() => setDepositModalUser(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "bold" }}>💰 Deposit</button>
                        <button onClick={() => handleOpenEdit(u)} style={{ padding: "0.375rem 0.75rem", background: "rgba(59,130,196,0.1)", border: "1px solid rgba(59,130,196,0.2)", color: "#60a5fa", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>Edit</button>
                        {u.roleId !== 1 && (
                          <button onClick={() => handleToggleStatus(u.id)} style={{ padding: "0.375rem 0.75rem", background: u.status === "ACTIVE" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: u.status === "ACTIVE" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)", color: u.status === "ACTIVE" ? "#f87171" : "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>
                            {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
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

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        />
      </div>

      {editingUser && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "28rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,162,39,0.1)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>{$t("Edit User Account", (localStorage.getItem('app-lang') || 'en'))}</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>{$t("Username", (localStorage.getItem('app-lang') || 'en'))}</label>
                <input type="text" required value={editUsername} onChange={e => setEditUsername(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>{$t("Email", (localStorage.getItem('app-lang') || 'en'))}</label>
                <input type="email" disabled readOnly value={editEmail} style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
              </div>
              <div>
                <label style={labelStyle}>{$t("Role", (localStorage.getItem('app-lang') || 'en'))}</label>
                {editingUser.roleId === 1 ? (
                  <input type="text" disabled value="Administrator" style={{ ...inputStyle, opacity: 0.6 }} />
                ) : (
                  <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} style={selectStyle}>
                    <option value="4">{$t("Spectator / Fan", (localStorage.getItem('app-lang') || 'en'))}</option>
                    <option value="2">{$t("Horse Owner", (localStorage.getItem('app-lang') || 'en'))}</option>
                    <option value="3">{$t("Jockey", (localStorage.getItem('app-lang') || 'en'))}</option>
                    <option value="5">{$t("Referee", (localStorage.getItem('app-lang') || 'en'))}</option>
                  </select>
                )}
              </div>
              {editRoleId === "3" && (
                <div>
                  <label style={labelStyle}>{$t("Weight (kg)", (localStorage.getItem('app-lang') || 'en'))}</label>
                  <input type="number" step="0.1" required value={editWeight} onChange={e => setEditWeight(e.target.value)} style={inputStyle} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                <input type="checkbox" id="requireOtp" checked={editRequireOtp} onChange={e => setEditRequireOtp(e.target.checked)} style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#c9a227" }} />
                <label htmlFor="requireOtp" style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>{$t("Enable Login OTP Verification", (localStorage.getItem('app-lang') || 'en'))}</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(201,162,39,0.1)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'en'))}</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>{$t("Save Changes", (localStorage.getItem('app-lang') || 'en'))}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {viewingUser && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "1rem", width: "100%", maxWidth: "48rem", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}>
            
            {/* Header Modal */}
            <div style={{ padding: "1.25rem 1.5rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(201,162,39,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(201,162,39,0.2)", border: "1px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                  👤
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{viewingUser.username}</h3>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>User ID: #{viewingUser.id} | Email: {viewingUser.email}</div>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
            </div>

            {/* Categorized Tabs Bar */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 1rem" }}>
              {[
                { id: "general", label: "General Profile" },
                { id: "role", label: "Role Details & Assets" },
                { id: "invitations", label: "Invitations History" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailsTab(tab.id as any)}
                  style={{
                    padding: "0.875rem 1.25rem",
                    background: "none",
                    border: "none",
                    borderBottom: activeDetailsTab === tab.id ? "2px solid #c9a227" : "2px solid transparent",
                    color: activeDetailsTab === tab.id ? "#fbbf24" : "rgba(255,255,255,0.5)",
                    fontWeight: activeDetailsTab === tab.id ? "bold" : "normal",
                    fontSize: "0.8rem",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Body */}
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, fontSize: "0.85rem", color: "#e2e8f0" }}>
              {detailsLoading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>Loading user details...</div>
              ) : userDetailsData ? (
                <>
                  {activeDetailsTab === "general" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={labelStyle}>Full Name</div>
                        <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{userDetailsData.user?.fullName || "Not provided"}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={labelStyle}>Account Status</div>
                        <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: userDetailsData.user?.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: userDetailsData.user?.status === "ACTIVE" ? "#34d399" : "#f87171" }}>
                          {userDetailsData.user?.status}
                        </span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={labelStyle}>Weight (Jockey)</div>
                        <div>{userDetailsData.user?.weight ? `${userDetailsData.user.weight} kg` : "N/A"}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={labelStyle}>Total Races / Top 3</div>
                        <div>{userDetailsData.user?.totalRacesParticipated || 0} Races | {userDetailsData.user?.totalTop3Finishes || 0} Top-3</div>
                      </div>
                      <div style={{ background: "rgba(251,191,36,0.05)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <div style={{ ...labelStyle, color: "#fbbf24" }}>💰 Wallet Balance</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#fbbf24", fontFamily: "monospace" }}>
                          ${(userDetailsData.user?.walletBalance !== undefined && userDetailsData.user?.walletBalance !== null ? Number(userDetailsData.user.walletBalance) : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailsTab === "role" && (
                    <div>
                      {viewingUser.roleId === 2 && (
                        <div>
                          <h4 style={{ color: "#fbbf24", marginBottom: "0.75rem", fontFamily: "monospace" }}>Owned Horses ({userDetailsData.ownedHorses?.length || 0})</h4>
                          {userDetailsData.ownedHorses?.length === 0 ? (
                            <div style={{ color: "rgba(255,255,255,0.4)" }}>No owned horses registered.</div>
                          ) : (
                            <div style={{ display: "grid", gap: "0.5rem" }}>
                              {userDetailsData.ownedHorses.map((h: any) => (
                                <div key={h.id} style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                                  <span>🐎 <strong>{h.name}</strong> ({h.breed || "Standard"})</span>
                                  <span style={{ fontFamily: "monospace", color: "#c9a227" }}>Rating: {h.currentRating}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {viewingUser.roleId === 3 && (
                        <div>
                          <h4 style={{ color: "#fbbf24", marginBottom: "0.75rem", fontFamily: "monospace" }}>Jockey Mounts History ({userDetailsData.jockeyMounts?.length || 0})</h4>
                          {userDetailsData.jockeyMounts?.length === 0 ? (
                            <div style={{ color: "rgba(255,255,255,0.4)" }}>No race mounts recorded.</div>
                          ) : (
                            <div style={{ display: "grid", gap: "0.5rem" }}>
                              {userDetailsData.jockeyMounts.map((m: any) => (
                                <div key={m.id} style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                                  <span>Race #{m.raceId} - Gate #{m.gateNumber || "TBD"}</span>
                                  <span style={{ fontFamily: "monospace" }}>Status: {m.status} | Weight: {m.carriedWeight || 55}kg</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {viewingUser.roleId !== 2 && viewingUser.roleId !== 3 && (
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>No specific role asset records for this account role.</div>
                      )}
                    </div>
                  )}

                  {activeDetailsTab === "invitations" && (
                    <div>
                      <h4 style={{ color: "#fbbf24", marginBottom: "0.75rem", fontFamily: "monospace" }}>Race Invitations ({userDetailsData.invitations?.length || 0})</h4>
                      {userDetailsData.invitations?.length === 0 ? (
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>No invitation records found.</div>
                      ) : (
                        <div style={{ display: "grid", gap: "0.5rem" }}>
                          {userDetailsData.invitations.map((inv: any) => (
                            <div key={inv.id} style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div>Invitation #{inv.id} for Race #{inv.raceId}</div>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Horse ID: #{inv.horseId} | Jockey ID: #{inv.jockeyId}</div>
                              </div>
                              <span style={{ padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", background: inv.status === "ACCEPTED" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: inv.status === "ACCEPTED" ? "#34d399" : "#f87171" }}>
                                {inv.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer Modal */}
            <div style={{ padding: "1rem 1.5rem", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setViewingUser(null)} style={{ padding: "0.5rem 1.25rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {depositModalUser && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "24rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.95rem", color: "#4ade80" }}>
                💰 Deposit Funds into Wallet
              </h3>
              <button onClick={() => setDepositModalUser(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#a0a0a0" }}>Recipient: <strong style={{ color: "#f4f2ec" }}>{depositModalUser.fullName || depositModalUser.username}</strong></p>
                <p style={{ fontSize: "11px", fontFamily: "monospace", color: "#a0a0a0", marginTop: "0.2rem" }}>Current Balance: <strong style={{ color: "#fbbf24" }}>{Number(depositModalUser.walletBalance || 0).toLocaleString('en-US')} VND</strong></p>
              </div>

              <div>
                <label style={labelStyle}>Deposit Amount (VND)</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  style={inputStyle}
                  placeholder="Enter amount in VND (e.g. 50,000, 500,000)"
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={handleDepositWallet}
                  style={{ flex: 1, padding: "0.6rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Confirm Deposit
                </button>
                <button
                  onClick={() => setDepositModalUser(null)}
                  style={{ padding: "0.6rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0a0", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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

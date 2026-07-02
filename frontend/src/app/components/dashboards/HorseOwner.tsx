import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { parseSafeDate } from "../../utils/dateTimeHelper";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";

type OwnerTab = "hub" | "stable" | "calendar" | "invitations" | "results" | "profile";

const ROLE_COLOR = "#4a9d6f";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Owner Hub",           view: "hub"         },
  { index: "02", icon: "book-open",         label: "My Stable",          view: "stable"      },
  { index: "03", icon: "calendar",          label: "Race Calendar",      view: "calendar"    },
  { index: "04", icon: "mail",              label: "Invitations",        view: "invitations" },
  { index: "05", icon: "award",             label: "Results & Earnings", view: "results"     },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.625rem 0.875rem",
  background: "rgba(14,12,9,0.8)", border: "1px solid #2a2825",
  borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "0.8rem", fontFamily: "monospace",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "0.6rem", fontFamily: "monospace",
  textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0", marginBottom: "0.375rem",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
  } catch { return d; }
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    APPROVED: "rgba(74,157,111,0.15)", ACTIVE: "rgba(74,157,111,0.15)",
    PENDING: "rgba(201,162,39,0.15)", ACCEPTED: "rgba(74,157,111,0.15)",
    REJECTED: "rgba(239,91,91,0.15)", DECLINED: "rgba(239,91,91,0.15)",
    CLOSED: "rgba(255,255,255,0.08)", DECLARATION_OPEN: "rgba(201,162,39,0.15)",
  };
  const tc: Record<string, string> = {
    APPROVED: "#4a9d6f", ACTIVE: "#4a9d6f",
    PENDING: "#c9a227", ACCEPTED: "#4a9d6f",
    REJECTED: "#ef5b5b", DECLINED: "#ef5b5b",
    CLOSED: "rgba(255,255,255,0.4)", DECLARATION_OPEN: "#c9a227",
  };
  return (
    <span style={{
      fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase",
      letterSpacing: "0.08em", fontWeight: 700, padding: "0.2rem 0.5rem",
      borderRadius: "0.25rem", background: map[status] ?? "rgba(255,255,255,0.08)",
      color: tc[status] ?? "rgba(255,255,255,0.6)",
    }}>{status}</span>
  );
};

// ── HubView ────────────────────────────────────────────────────────────────
function HubView({ dashboard, meetings, stable, onRegisterOwner, onRegisterHorses }: {
  dashboard: any; meetings: any[]; stable: any[];
  onRegisterOwner: (id: number) => void;
  onRegisterHorses: (meetingId: number, horseIds: number[]) => Promise<void>;
}) {
  const [selectedHorses, setSelectedHorses] = useState<Record<number, number[]>>({});

  const handleCheckbox = (meetingId: number, horseId: number) => {
    setSelectedHorses(prev => {
      const list = prev[meetingId] || [];
      return { ...prev, [meetingId]: list.includes(horseId) ? list.filter(id => id !== horseId) : [...list, horseId] };
    });
  };

  const handleBulkRegister = async (meetingId: number) => {
    const list = selectedHorses[meetingId] || [];
    if (!list.length) return;
    await onRegisterHorses(meetingId, list);
    setSelectedHorses(prev => ({ ...prev, [meetingId]: [] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: "1rem" }}>
          {[
            { label: "Total Horses",          value: dashboard.totalHorses ?? 0,           color: ROLE_COLOR },
            { label: "Avg Place Position",    value: dashboard.averagePlace ? Number(dashboard.averagePlace).toFixed(1) : "N/A" },
            { label: "Total Prizes ($)",      value: `$${(dashboard.totalEarnings ?? 0).toLocaleString()}`, color: "#c9a227" },
            { label: "Pending Registrations", value: dashboard.pendingRegistrations ?? 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", display: "block", marginBottom: "0.25rem" }}>{s.label}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color ?? "#f4f2ec" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Available Race Meetings</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>Register your stable for upcoming race day events.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
          {meetings.length === 0
            ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No upcoming meetings available.</p>
            : meetings.map((m: any) => {
                const isReg = dashboard?.registeredMeetingIds?.includes(m.id);
                const regStatus = dashboard?.regStatuses?.[m.id];
                const regHorses = dashboard?.meetingRegisteredHorses?.[m.id] || [];
                const unregHorses = dashboard?.meetingUnregisteredHorses?.[m.id] || [];
                const sel = selectedHorses[m.id] || [];

                return (
                  <div key={m.id} className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <h4 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                      {isReg ? <StatusBadge status={regStatus ?? "APPROVED"} /> : <StatusBadge status="UNREGISTERED" />}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span>📅 {formatDate(m.startDate || m.date)}</span>
                      <span>📍 {m.venue}</span>
                      <span>💰 ${(m.totalBudget || 0).toLocaleString()}</span>
                    </div>

                    {!isReg && (
                      <div>
                        {stable.length === 0
                          ? <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No active horses in stable.</p>
                          : (
                            <>
                              <p style={{ ...labelStyle, marginBottom: "0.375rem" }}>Select Horses to Register:</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "100px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                                {stable.map((h: any) => (
                                  <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                                    <input type="checkbox" checked={sel.includes(h.id)} onChange={() => handleCheckbox(m.id, h.id)} style={{ accentColor: ROLE_COLOR }} />
                                    {h.name} (Rating: {h.currentRating})
                                  </label>
                                ))}
                              </div>
                              <button
                                onClick={() => sel.length ? handleBulkRegister(m.id) : onRegisterOwner(m.id)}
                                disabled={sel.length === 0 && stable.length > 0}
                                style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: sel.length > 0 ? ROLE_COLOR : "rgba(74,157,111,0.3)", color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: sel.length > 0 ? "pointer" : "not-allowed" }}
                              >
                                {sel.length > 0 ? `Register ${sel.length} Horse(s)` : "Register for Event"}
                              </button>
                            </>
                          )}
                      </div>
                    )}

                    {isReg && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {regHorses.length > 0 && (
                          <div>
                            <p style={labelStyle}>Registered Horses:</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {regHorses.map((rh: any) => (
                                <div key={rh.horse?.id ?? rh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.375rem", padding: "0.375rem 0.5rem" }}>
                                  <span style={{ fontSize: "0.75rem", color: "#f4f2ec", fontFamily: "monospace" }}>🐎 {rh.horse?.name ?? rh.name}</span>
                                  <StatusBadge status={rh.status} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {unregHorses.length > 0 && (
                          <div>
                            <p style={labelStyle}>Register Additional Horses:</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "100px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                              {unregHorses.map((h: any) => (
                                <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                                  <input type="checkbox" checked={sel.includes(h.id)} onChange={() => handleCheckbox(m.id, h.id)} style={{ accentColor: ROLE_COLOR }} />
                                  {h.name} (Rating: {h.currentRating})
                                </label>
                              ))}
                            </div>
                            <button
                              onClick={() => handleBulkRegister(m.id)}
                              disabled={sel.length === 0}
                              style={{ width: "100%", marginTop: "0.5rem", padding: "0.4rem", background: sel.length > 0 ? "rgba(74,157,111,0.2)" : "rgba(255,255,255,0.05)", color: sel.length > 0 ? ROLE_COLOR : "#a0a0a0", border: `1px solid ${sel.length > 0 ? "rgba(74,157,111,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: sel.length > 0 ? "pointer" : "not-allowed" }}
                            >
                              Submit Additional Horses ({sel.length})
                            </button>
                          </div>
                        )}
                        {unregHorses.length === 0 && regHorses.length > 0 && (
                          <p style={{ fontSize: "0.65rem", color: ROLE_COLOR, fontStyle: "italic", fontFamily: "monospace" }}>✓ All stable horses registered</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

// ── StableView ─────────────────────────────────────────────────────────────
function StableView({ stable, onRefresh }: { stable: any[]; onRefresh: () => void }) {
  const { user } = useAuth();
  const [horseName, setHorseName] = useState("");
  const [breed, setBreed] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatar, setAvatar] = useState("");
  const [description, setDescription] = useState("");
  const [editingHorse, setEditingHorse] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editRating, setEditRating] = useState<number>(52);
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [msg, setMsg] = useState("");

  const formatDobForApi = (dobStr: string): string => {
    if (!dobStr) return "";
    const parts = dobStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]} 00:00:00`;
    }
    return dobStr;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    setMsg("");
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        setMsg("❌ Avatar image size must be less than 1.5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (isEdit) {
            setEditAvatar(event.target.result as string);
          } else {
            setAvatar(event.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterHorse = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    try {
      await api.post("/horses", { name: horseName, breed, dateOfBirth: formatDobForApi(dateOfBirth), ownerId: user?.id, avatar, description, status: "PENDING" });
      setMsg("✅ Horse declaration submitted for approval.");
      setHorseName(""); setBreed(""); setDateOfBirth(""); setAvatar(""); setDescription("");
      onRefresh();
    } catch (err: any) { setMsg("❌ " + (err.message || "Failed to submit horse registration.")); }
  };

  const startEdit = (item: any) => {
    setEditingHorse(item.horse);
    setEditName(item.horse.name || "");
    setEditBreed(item.horse.breed || "");
    setEditDob(item.horse.dateOfBirth ? (() => { const d = parseSafeDate(item.horse.dateOfBirth); return d ? d.toISOString().split("T")[0] : ""; })() : "");
    setEditRating(item.horse.currentRating || 52);
    setEditAvatar(item.horse.avatar || "");
    setEditDescription(item.horse.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingHorse) return;
    try {
      await api.put(`/horses/${editingHorse.id}`, { name: editName, breed: editBreed, dateOfBirth: formatDobForApi(editDob), currentRating: editRating, avatar: editAvatar, description: editDescription });
      setEditingHorse(null); onRefresh();
    } catch (err: any) { setMsg("❌ " + (err.message || "Failed to update horse.")); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px,340px)", gap: "2rem", alignItems: "start" }}>
      {/* Stable List */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Horse Stable List</h3>
        {msg && <p style={{ marginBottom: "1rem", fontSize: "0.8rem", color: msg.startsWith("✅") ? "#4ade80" : "#ef4444" }}>{msg}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {stable.length === 0
            ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No horses in stable yet.</p>
            : stable.map((item: any) => {
                const h = item.horse;
                return (
                  <div key={h.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
                    {h.avatar
                      ? <img src={h.avatar} alt={h.name} style={{ width: "100%", height: "11rem", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "11rem", background: "#0e0c09", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3835", fontWeight: 700, fontFamily: "monospace", fontSize: "0.7rem" }}>NO IMAGE</div>}
                    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                      <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{h.name}</h4>
                      <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Breed: {h.breed} · Status: <span style={{ color: h.status === "ACTIVE" ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{h.status}</span></p>
                      <div style={{ borderTop: "1px solid #2a2825", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#a0a0a0" }}>
                        <span>Rating: <strong style={{ color: "#c9a227" }}>{h.currentRating}</strong></span>
                        <span>Wins: <strong>{item.totalWins ?? 0}</strong>/{item.totalRaces ?? 0}</span>
                      </div>
                      <button onClick={() => startEdit(item)} style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "0.7rem", fontFamily: "monospace", cursor: "pointer" }}>Edit Details</button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Declare Horse Form */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Declare New Horse</h3>
        <form onSubmit={handleRegisterHorse} style={{ background: "rgba(21,19,16,0.6)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { lbl: "Horse Name", val: horseName, set: setHorseName, type: "text", ph: "E.g., Shadow Fax" },
            { lbl: "Breed",      val: breed,     set: setBreed,     type: "text", ph: "E.g., Arabian Thoroughbred" },
            { lbl: "Date of Birth", val: dateOfBirth, set: setDateOfBirth, type: "date", ph: "" },
          ].map(f => (
            <div key={f.lbl}>
              <label style={labelStyle}>{f.lbl}</label>
              <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Horse Photo / Avatar</label>
            <input type="file" accept="image/*" onChange={e => handleAvatarChange(e, false)} style={inputStyle} />
            {avatar && (
              <img src={avatar} alt="Preview" style={{ width: "100%", height: "8rem", objectFit: "cover", marginTop: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)" }} />
            )}
          </div>
          <div>
            <label style={labelStyle}>Biography / Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter horse details..." style={{ ...inputStyle, height: "5rem", resize: "none" }} />
          </div>
          <button type="submit" style={{ width: "100%", padding: "0.75rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>Declare Horse</button>
        </form>
      </div>

      {/* Edit Horse Modal */}
      {editingHorse && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#121010", border: "1px solid rgba(201,162,39,0.18)", borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "28rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setEditingHorse(null)} style={{ position: "absolute", right: "1rem", top: "1rem", background: "transparent", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", marginBottom: "1rem" }}>Edit Horse Details</h3>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { lbl: "Horse Name", val: editName, set: setEditName, type: "text" },
                { lbl: "Breed",      val: editBreed, set: setEditBreed, type: "text" },
                { lbl: "Date of Birth", val: editDob, set: setEditDob, type: "date" },
              ].map(f => (
                <div key={f.lbl}>
                  <label style={labelStyle}>{f.lbl}</label>
                  <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Horse Photo / Avatar</label>
                <input type="file" accept="image/*" onChange={e => handleAvatarChange(e, true)} style={inputStyle} />
                {editAvatar && (
                  <img src={editAvatar} alt="Preview" style={{ width: "100%", height: "8rem", objectFit: "cover", marginTop: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)" }} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Rating</label>
                <input type="number" value={editRating} disabled={editingHorse.totalRaces > 0} onChange={e => setEditRating(parseInt(e.target.value))} style={{ ...inputStyle, opacity: editingHorse.totalRaces > 0 ? 0.5 : 1 }} />
                {editingHorse.totalRaces > 0 && <span style={{ fontSize: "0.65rem", color: "#a0a0a0" }}>* Horse has raced — only Admin may change Rating.</span>}
              </div>
              <div>
                <label style={labelStyle}>Biography</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, height: "5rem", resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setEditingHorse(null)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0e0c09", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CalendarView ───────────────────────────────────────────────────────────
function CalendarView({ meetings, allRaces, seasons, dashboard, onSendInvitation }: {
  meetings: any[]; allRaces: any[]; seasons: any[]; dashboard: any;
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number }) => void;
}) {
  const [seasonFilter, setSeasonFilter] = useState("");

  const filteredMeetings = seasonFilter
    ? meetings.filter(m => String(m.seasonId) === seasonFilter)
    : meetings;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Race Calendar</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Select a race to invite an approved jockey. You must be registered for the meeting.</p>
        </div>
        {seasons.length > 0 && (
          <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={labelStyle}>Filter by Season</label>
            <select
              value={seasonFilter}
              onChange={e => setSeasonFilter(e.target.value)}
              style={{ ...inputStyle, width: "220px", cursor: "pointer" }}
            >
              <option value="">-- All Seasons --</option>
              {seasons.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.status})</option>)}
            </select>
          </div>
        )}
      </div>

      {filteredMeetings.length === 0
        ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No meetings found.</p>
        : filteredMeetings.map((m: any) => {
            const isReg = dashboard?.registeredMeetingIds?.includes(m.id);
            const meetingRaces = allRaces.filter(r => r.raceMeetingId === m.id);
            const meetingHorses = dashboard?.meetingHorses?.[m.id] || [];
            const meetingJockeys = dashboard?.meetingJockeys?.[m.id] || [];

            return (
              <div key={m.id} className="rounded-xl" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
                {/* Meeting header */}
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                  <div>
                    <h4 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, color: "#f4f2ec", marginBottom: "0.25rem" }}>{m.name}</h4>
                    <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                      {formatDate(m.startDate)} · {m.venue}
                    </p>
                  </div>
                  {isReg
                    ? <span style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", borderRadius: "0.25rem", background: "rgba(74,157,111,0.12)", color: "#4a9d6f", border: "1px solid rgba(74,157,111,0.25)" }}>Event Registration Approved</span>
                    : <span style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", borderRadius: "0.25rem", background: "rgba(239,91,91,0.12)", color: "#ef5b5b", border: "1px solid rgba(239,91,91,0.25)" }}>Event Registration Required</span>}
                </div>

                {/* Races */}
                {meetingRaces.length === 0
                  ? <p style={{ padding: "1.5rem", color: "#a0a0a0", textAlign: "center", fontFamily: "monospace", fontSize: "0.8rem" }}>No races scheduled for this meeting.</p>
                  : meetingRaces.map((race: any) => {
                      const eligibleHorses = meetingHorses.filter((h: any) => {
                        const minOk = race.minRating == null || h.currentRating >= race.minRating;
                        const maxOk = race.maxRating == null || h.currentRating <= race.maxRating;
                        return minOk && maxOk;
                      });

                      return (
                        <RaceRow
                          key={race.id}
                          race={race}
                          isReg={isReg}
                          eligibleHorses={eligibleHorses}
                          jockeys={meetingJockeys}
                          onSendInvitation={onSendInvitation}
                        />
                      );
                    })}
              </div>
            );
          })}
    </div>
  );
}

function RaceRow({ race, isReg, eligibleHorses, jockeys, onSendInvitation }: {
  race: any; isReg: boolean; eligibleHorses: any[]; jockeys: any[];
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number }) => void;
}) {
  const [horseId, setHorseId] = useState("");
  const [jockeyId, setJockeyId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!horseId || !jockeyId) return;
    onSendInvitation({ horseId: parseInt(horseId), raceId: race.id, jockeyId: parseInt(jockeyId) });
    setHorseId(""); setJockeyId("");
  };

  return (
    <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between" }}>
      {/* Race info */}
      <div style={{ flex: 1, minWidth: "260px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.9rem" }}>{race.classLevel}</span>
          <StatusBadge status={race.status} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: "0.75rem" }}>
          {[
            { label: "Start Time",      value: formatDate(race.startTime) },
            { label: "Distance & Track", value: `${race.distanceMeters}m (${race.trackType})` },
            { label: "Rating Limits",   value: `${race.minRating ?? "0"} – ${race.maxRating ?? "∞"}` },
            { label: "Purse",           value: `$${(race.purse || 0).toLocaleString()}`, color: "#4a9d6f" },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", marginBottom: "0.15rem" }}>{s.label}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: s.color ?? "#f4f2ec", fontFamily: "monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <span><strong style={{ color: "rgba(201,162,39,0.8)" }}>Entries Open:</strong> {formatDate(race.registrationStartTime)}</span>
          <span><strong style={{ color: "rgba(201,162,39,0.8)" }}>Close:</strong> {formatDate(race.registrationEndTime)}</span>
        </div>
      </div>

      {/* Invitation form */}
      {isReg && (
        <div style={{ width: "260px", display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: "1rem", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
          {race.status === "DECLARATION_OPEN" ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div>
                <label style={labelStyle}>Select Horse</label>
                <select value={horseId} onChange={e => setHorseId(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Select Horse --</option>
                  {eligibleHorses.map((h: any) => <option key={h.id} value={h.id}>{h.name} (Rating: {h.currentRating})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Select Jockey</label>
                <select value={jockeyId} onChange={e => setJockeyId(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">-- Select Jockey --</option>
                  {jockeys.map((j: any) => <option key={j.id} value={j.id}>{j.username} ({j.weight}kg)</option>)}
                </select>
              </div>
              <button type="submit" style={{ width: "100%", padding: "0.5rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                ✉ Send Invitation
              </button>
            </form>
          ) : race.status === "SCHEDULED" ? (
            <div style={{ textAlign: "center", padding: "1rem", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "0.5rem", background: "rgba(255,255,255,0.01)" }}>
              <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace" }}>Registration opens at:</p>
              <p style={{ fontSize: "0.7rem", color: "#c9a227", fontFamily: "monospace", fontWeight: 700 }}>{formatDate(race.registrationStartTime)}</p>
            </div>
          ) : (
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", textAlign: "center" }}>Declarations closed for this race.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── InvitationsView ────────────────────────────────────────────────────────
function InvitationsView({ invitations }: { invitations: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Sent Invitations</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Manage and track invitations sent to jockeys for various races.</p>
      </div>
      <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                {["ID", "Meeting", "Race", "Horse", "Jockey", "Status"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitations.length === 0
                ? <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No invitations have been sent yet.</td></tr>
                : invitations.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>#{inv.id}</td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#f4f2ec" }}>{inv.meetingName ?? `Meeting #${inv.raceId}`}</td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                      {inv.classLevel ? `${inv.classLevel} · ${formatDate(inv.startTime)}` : `Race #${inv.raceId}`}
                    </td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#f4f2ec" }}>{inv.horseName ?? `Horse #${inv.horseId}`}</td>
                    <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", color: "#f4f2ec" }}>{inv.jockeyName ?? `Jockey #${inv.jockeyId}`}</td>
                    <td style={{ padding: "0.875rem 1.25rem" }}><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── ResultsView ────────────────────────────────────────────────────────────
function ResultsView({ results, totalEarnings }: { results: any[]; totalEarnings: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Results & Earnings</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Comprehensive record of all finished races and prize money won by your stable.</p>
        </div>
        <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(74,157,111,0.2)", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>💰</span>
          <div>
            <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0" }}>Total Stable Earnings</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#4a9d6f", fontFamily: "monospace" }}>${totalEarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                {["Date", "Meeting", "Race Class", "Horse", "Pos", "Finish Time", "Rating Adj", "Prize"].map(h => (
                   <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length === 0
                ? <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No race results available yet.</td></tr>
                : results.map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>{formatDate(r.startTime)}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", fontWeight: 600, color: "#f4f2ec" }}>{r.meetingName ?? "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", color: "#a0a0a0" }}>{r.classLevel ?? r.raceName ?? `Race #${r.raceId}`}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", fontWeight: 700, color: "#f4f2ec" }}>{r.horseName ?? `Horse #${r.horseId}`}</td>
                    <td style={{ padding: "0.875rem 1rem" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "0.25rem", background: r.position === 1 ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.05)", color: r.position === 1 ? "#c9a227" : "#f4f2ec" }}>
                        {r.position ?? r.finalPosition ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>{r.finishTime ?? "—"}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.75rem", fontFamily: "monospace", color: r.ratingAdjustment > 0 ? "#4a9d6f" : r.ratingAdjustment < 0 ? "#ef5b5b" : "#a0a0a0" }}>
                      {r.ratingAdjustment != null ? (r.ratingAdjustment > 0 ? `+${r.ratingAdjustment}` : r.ratingAdjustment) : "—"}
                    </td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", fontFamily: "monospace", fontWeight: 700, color: "#4a9d6f" }}>
                      ${(r.prizeMoney ?? r.prizeAmount ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HorseOwner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OwnerTab>(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    return (p as OwnerTab) || "hub";
  });
  const [dashboard, setDashboard] = useState<any>(null);
  const [stable, setStable] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [allRaces, setAllRaces] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      const [stats, stableData, invites, allMeetings, ownerResults, allSeasonsData, racesData] = await Promise.all([
        api.get<any>(`/owner/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/owner/${user.id}/stable`).catch(() => []),
        api.get<any[]>(`/owner/${user.id}/invitations`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>(`/owner/${user.id}/results`).catch(() => []),
        api.get<any[]>("/races/seasons").catch(() => []),
        api.get<any[]>("/races").catch(() => []),
      ]);
      setDashboard(stats);
      setStable(Array.isArray(stableData) ? stableData : []);
      setInvitations(Array.isArray(invites) ? invites : []);
      setMeetings(Array.isArray(allMeetings) ? allMeetings : []);
      setResults(Array.isArray(ownerResults) ? ownerResults : []);
      setSeasons(Array.isArray(allSeasonsData) ? allSeasonsData : []);
      setAllRaces(Array.isArray(racesData) ? racesData : []);
    } catch (err: any) { setErrorMsg(err.message || "Failed to load owner data."); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRegisterOwner = async (meetingId: number) => {
    if (!user) return;
    try {
      await api.post("/registrations/owner", { meetingId, ownerId: user.id });
      setSuccessMsg("Successfully registered as Owner for meeting.");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to register for meeting."); }
  };

  const handleRegisterHorses = async (meetingId: number, horseIds: number[]) => {
    try {
      setErrorMsg(""); setSuccessMsg("");
      await Promise.all(horseIds.map(horseId => api.post("/registrations/horse", { meetingId, horseId })));
      setSuccessMsg(`Successfully registered ${horseIds.length} horse(s) for meeting.`);
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to register horse(s)."); }
  };

  const handleSendInvitation = async (form: { horseId: number; raceId: number; jockeyId: number }) => {
    if (!user) return;
    try {
      await api.post("/invitations", { ...form, ownerId: user.id, status: "PENDING" });
      setSuccessMsg("Invitation sent to jockey.");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to send invitation."); }
  };

  const totalEarnings = results.reduce((sum: number, r: any) => sum + (r.prizeMoney ?? r.prizeAmount ?? 0), 0);
  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Owner Hub";
  const navItemsWithBadge = NAV_ITEMS.map(n => n.view === "invitations" ? { ...n, badge: pendingInvitations } : n);

  const renderContent = () => {
    switch (activeTab) {
      case "hub":
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} />;
      case "stable":
        return <StableView stable={stable} onRefresh={fetchData} />;
      case "calendar":
        return <CalendarView meetings={meetings} allRaces={allRaces} seasons={seasons} dashboard={dashboard} onSendInvitation={handleSendInvitation} />;
      case "invitations":
        return <InvitationsView invitations={invitations} />;
      case "results":
        return <ResultsView results={results} totalEarnings={totalEarnings} />;
      case "profile":
        return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Horse Owner" />;
      default:
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} />;
    }
  };

  return (
    <DashboardLayout
      roleLabel="Horse Owner"
      roleColor={ROLE_COLOR}
      activeLabel={activeLabel}
      currentView={activeTab}
      navItems={navItemsWithBadge}
      onViewChange={v => { setActiveTab(v as OwnerTab); setSuccessMsg(""); setErrorMsg(""); }}
      successMsg={successMsg}
      errorMsg={errorMsg}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

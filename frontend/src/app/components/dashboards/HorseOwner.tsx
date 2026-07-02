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

// ── Shared input/select styles ─────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  background: "rgba(14,12,9,0.8)",
  border: "1px solid #2a2825",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.8rem",
  fontFamily: "monospace",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6rem",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#a0a0a0",
  marginBottom: "0.375rem",
};

// ── HubView ────────────────────────────────────────────────────────────────
function HubView({ dashboard, meetings, stable, onRegisterOwner, onRegisterHorses }: {
  dashboard: any;
  meetings: any[];
  stable: any[];
  onRegisterOwner: (id: number) => void;
  onRegisterHorses: (meetingId: number, horseIds: number[]) => Promise<void>;
}) {
  const [selectedHorses, setSelectedHorses] = useState<Record<number, number[]>>({});

  const handleCheckboxChange = (meetingId: number, horseId: number) => {
    setSelectedHorses((prev) => {
      const list = prev[meetingId] || [];
      const newList = list.includes(horseId)
        ? list.filter((id) => id !== horseId)
        : [...list, horseId];
      return { ...prev, [meetingId]: newList };
    });
  };

  const handleBulkRegister = async (meetingId: number) => {
    const list = selectedHorses[meetingId] || [];
    if (list.length === 0) return;
    await onRegisterHorses(meetingId, list);
    setSelectedHorses((prev) => ({ ...prev, [meetingId]: [] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stats */}
      {dashboard && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
          {[
            { label: "Total Horses",          value: dashboard.totalHorses ?? 0,         color: ROLE_COLOR },
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

      {/* Available Race Meetings */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Available Race Meetings</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>Register your stable for upcoming race day events to participate in races.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {meetings.length === 0 ? (
            <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>No upcoming meetings available.</p>
          ) : meetings.map((m: any) => {
            const isOwnerReg = dashboard?.registeredMeetingIds?.includes(m.id);
            const unregHorses = dashboard?.meetingUnregisteredHorses?.[m.id] || [];
            const regHorses = dashboard?.meetingRegisteredHorses?.[m.id] || [];
            const selectedList = selectedHorses[m.id] || [];

            return (
              <div key={m.id} className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue}</p>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>📅 {m.startDate || m.date}</p>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>💰 ${(m.totalBudget || 0).toLocaleString()}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {isOwnerReg ? (
                    <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#4a9d6f", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0" }}>
                      ✓ Registered as Owner
                    </span>
                  ) : (
                    <button
                      onClick={() => onRegisterOwner(m.id)}
                      style={{ width: "100%", padding: "0.5rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      Register Stable Owner
                    </button>
                  )}

                  {/* Registered Horses */}
                  {regHorses.length > 0 && (
                    <div style={{ marginTop: "0.25rem" }}>
                      <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", marginBottom: "0.25rem" }}>Registered Horses:</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {regHorses.map((rh: any) => (
                          <span key={rh.horse.id} style={{ fontSize: "0.65rem", fontFamily: "monospace", background: "rgba(74, 157, 111, 0.15)", border: "1px solid rgba(74, 157, 111, 0.3)", color: "#4a9d6f", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                            🐎 {rh.horse.name} ({rh.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unregistered Horses with Checkboxes */}
                  {stable.length === 0 ? (
                    <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", marginTop: "0.25rem" }}>
                      No active horses in stable. Go to "My Stable" to declare horses.
                    </p>
                  ) : unregHorses.length === 0 ? (
                    <p style={{ fontSize: "0.65rem", color: "#4a9d6f", fontStyle: "italic", fontFamily: "monospace", marginTop: "0.25rem" }}>
                      ✓ All stable horses registered
                    </p>
                  ) : (
                    <div style={{ marginTop: "0.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem" }}>
                      <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", marginBottom: "0.375rem" }}>Select Horses to Register:</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "120px", overflowY: "auto" }}>
                        {unregHorses.map((h: any) => {
                          const isChecked = selectedList.includes(h.id);
                          return (
                            <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCheckboxChange(m.id, h.id)}
                                style={{ accentColor: ROLE_COLOR, cursor: "pointer" }}
                              />
                              <span>{h.name}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleBulkRegister(m.id)}
                        disabled={selectedList.length === 0}
                        style={{
                          width: "100%",
                          marginTop: "0.75rem",
                          padding: "0.5rem",
                          background: selectedList.length === 0 ? "rgba(255,255,255,0.05)" : ROLE_COLOR,
                          color: selectedList.length === 0 ? "#a0a0a0" : "#fff",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: selectedList.length === 0 ? "not-allowed" : "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        Register Selected Horses ({selectedList.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StableView (My Stable + Declare Horse Form) ───────────────────────────
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 340px)", gap: "2rem", alignItems: "start" }}>
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

// ── InvitationsView ────────────────────────────────────────────────────────
function InvitationsView({ invitations, stable, meetings, jockeys, races, setRaces, onSubmit }: {
  invitations: any[]; stable: any[]; meetings: any[]; jockeys: any[];
  races: any[]; setRaces: (r: any[]) => void; onSubmit: (form: any) => void;
}) {
  const [horseId, setHorseId] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [raceId, setRaceId] = useState("");
  const [jockeyId, setJockeyId] = useState("");

  useEffect(() => {
    if (meetingId) api.get<any[]>(`/public/races?meetingId=${meetingId}`).then(setRaces).catch(() => setRaces([]));
    else setRaces([]);
    setRaceId("");
  }, [meetingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ horseId: parseInt(horseId), raceId: parseInt(raceId), jockeyId: parseInt(jockeyId) });
    setHorseId(""); setMeetingId(""); setRaceId(""); setJockeyId("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px, 340px)", gap: "2rem", alignItems: "start" }}>
      {/* Sent Invitations List */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Sent Rides Invitations</h3>
        <div className="rounded-xl" style={{ border: "1px solid #2a2825", overflow: "hidden" }}>
          {invitations.length === 0
            ? <p style={{ padding: "1.5rem", color: "#a0a0a0", textAlign: "center", fontFamily: "monospace", fontSize: "0.875rem" }}>No invitations sent yet.</p>
            : invitations.map((inv: any, i: number) => (
              <div key={i} style={{ padding: "1rem", borderBottom: "1px solid #2a2825", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.875rem" }}>Jockey ID #{inv.jockeyId}</h4>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>Horse ID: #{inv.horseId} · Race ID: #{inv.raceId}</p>
                </div>
                <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: inv.status === "ACCEPTED" ? "rgba(74,222,128,0.1)" : "rgba(234,179,8,0.1)", color: inv.status === "ACCEPTED" ? "#4ade80" : "#eab308" }}>
                  {inv.status}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Invite Form */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Invite Jockey to Ride</h3>
        <form onSubmit={handleSubmit} style={{ background: "rgba(21,19,16,0.6)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { lbl: "Select Horse",   val: horseId,   set: setHorseId,   opts: stable.map((h: any) => ({ v: h.id, l: h.name })) },
            { lbl: "Select Meeting", val: meetingId, set: setMeetingId, opts: meetings.map((m: any) => ({ v: m.id, l: m.name })) },
            { lbl: "Select Race",    val: raceId,    set: setRaceId,    opts: races.map((r: any) => ({ v: r.id, l: `${r.classLevel} — ${r.distanceMeters}m` })), disabled: !meetingId },
            { lbl: "Select Jockey", val: jockeyId,  set: setJockeyId,  opts: jockeys.map((j: any) => ({ v: j.id, l: j.username })) },
          ].map(f => (
            <div key={f.lbl}>
              <label style={labelStyle}>{f.lbl}</label>
              <select value={f.val} onChange={e => f.set(e.target.value)} disabled={(f as any).disabled} style={{ ...inputStyle, cursor: (f as any).disabled ? "not-allowed" : "pointer" }}>
                <option value="">-- Choose --</option>
                {f.opts.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <button type="submit" style={{ width: "100%", padding: "0.75rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>Send Invitation</button>
        </form>
      </div>
    </div>
  );
}

// ── CalendarView ───────────────────────────────────────────────────────────
function CalendarView({ meetings }: { meetings: any[] }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Race Calendar</h3>
      {meetings.length === 0
        ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No upcoming meetings.</p>
        : <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {meetings.map((m: any, i: number) => (
            <div key={i} className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.25rem" }}>📍 {m.venue} · 📅 {m.startDate || m.date}</p>
              </div>
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: `rgba(74,157,111,0.1)`, color: ROLE_COLOR }}>{m.status ?? "UPCOMING"}</span>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ── ResultsView ────────────────────────────────────────────────────────────
function ResultsView({ results }: { results: any[] }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Results & Earnings</h3>
      {results.length === 0
        ? <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No race results available yet.</p>
        </div>
        : <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: `rgba(74,157,111,0.08)`, borderBottom: "1px solid #2a2825" }}>
                {["Race", "Horse", "Jockey", "Position", "Prize ($)"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem" }}>{r.raceName ?? `Race #${r.raceId}`}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem", fontWeight: 700 }}>{r.horseName ?? `Horse #${r.horseId}`}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontSize: "0.8rem" }}>{r.jockeyName ?? `Jockey #${r.jockeyId}`}</td>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontWeight: 700, color: r.position === 1 ? "#c9a227" : r.position <= 3 ? "#4ade80" : "#f4f2ec" }}>#{r.position}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#4ade80", fontFamily: "monospace", fontWeight: 700 }}>${(r.prizeAmount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HorseOwner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OwnerTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as OwnerTab) || "hub";
  });
  const [dashboard, setDashboard] = useState<any>(null);
  const [stable, setStable] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [jockeys, setJockeys] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      const [stats, stableData, invites, allMeetings, activeJockeys, ownerResults] = await Promise.all([
        api.get<any>(`/owner/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/owner/${user.id}/stable`).catch(() => []),
        api.get<any[]>(`/owner/${user.id}/invitations`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>("/public/users?roleId=3").catch(() => []),
        api.get<any[]>(`/owner/${user.id}/results`).catch(() => []),
      ]);
      setDashboard(stats);
      setStable(Array.isArray(stableData) ? stableData : []);
      setInvitations(Array.isArray(invites) ? invites : []);
      setMeetings(Array.isArray(allMeetings) ? allMeetings : []);
      setJockeys(Array.isArray(activeJockeys) ? activeJockeys : []);
      setResults(Array.isArray(ownerResults) ? ownerResults : []);
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
      setErrorMsg("");
      setSuccessMsg("");
      await Promise.all(
        horseIds.map(horseId => api.post("/registrations/horse", { meetingId, horseId }))
      );
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

  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Owner Hub";

  const navItemsWithBadge = NAV_ITEMS.map(n =>
    n.view === "invitations" ? { ...n, badge: pendingInvitations } : n
  );

  const renderContent = () => {
    switch (activeTab) {
      case "hub":
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} />;
      case "stable":
        return <StableView stable={stable} onRefresh={fetchData} />;
      case "calendar":
        return <CalendarView meetings={meetings} />;
      case "invitations":
        return <InvitationsView invitations={invitations} stable={stable} meetings={meetings} jockeys={jockeys} races={races} setRaces={setRaces} onSubmit={handleSendInvitation} />;
      case "results":
        return <ResultsView results={results} />;
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

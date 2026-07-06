import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { parseSafeDate, formatDateTime, formatClassLevel } from "../../utils/dateTimeHelper";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";
import ProfileModal from "./components/ProfileModal";
import HorsePerformanceModal from "./components/HorsePerformanceModal";

interface InlineDatePickerProps {
  label: string;
  value: string; // format: dd-MM-yyyy
  onChange: (val: string) => void;
}

function InlineDatePicker({ label, value, onChange }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });

  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = value.match(datePattern);
  const selectedDay = match ? parseInt(match[1]) : null;
  const selectedMonth = match ? parseInt(match[2]) - 1 : null;
  const selectedYear = match ? parseInt(match[3]) : null;

  useEffect(() => {
    if (isOpen && selectedMonth !== null && selectedYear !== null) {
      setCurrentDate({ month: selectedMonth, year: selectedYear });
    }
  }, [isOpen, selectedMonth, selectedYear]);

  const daysInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
  let firstDay = new Date(currentDate.year, currentDate.month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = () => {
    setCurrentDate(prev =>
      prev.month === 0 ? { month: 11, year: prev.year - 1 } : { month: prev.month - 1, year: prev.year }
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(prev =>
      prev.month === 11 ? { month: 0, year: prev.year + 1 } : { month: prev.month + 1, year: prev.year }
    );
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(currentDate.month + 1).padStart(2, "0");
    onChange(`${formattedDay}-${formattedMonth}-${currentDate.year}`);
    setIsOpen(false);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="relative">
      <label style={labelStyle}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          value={value}
          placeholder="dd-mm-yyyy"
          style={inputStyle}
          className="cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-500 transition text-sm focus:outline-none"
        >
          📅
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-[110%] left-0 w-64 bg-[#100f0c] border border-[#2a2825] rounded-xl p-3.5 shadow-2xl z-50 space-y-3 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <button type="button" onClick={handlePrevMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">◀</button>
              <div className="flex items-center gap-1">
                <select
                  value={currentDate.month}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold uppercase tracking-wider border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#100f0c] text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDate.year}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 99 + i).map(yr => (
                    <option key={yr} value={yr} className="bg-[#100f0c] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">▶</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-white/40 uppercase font-mono">
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => <div key={`blank-${b}`} className="h-7 w-7"></div>)}
              {daysArray.map(day => {
                const isSelected = selectedDay === day && selectedMonth === currentDate.month && selectedYear === currentDate.year;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 text-[10px] font-mono rounded-lg flex items-center justify-center transition ${
                      isSelected ? "bg-amber-500 text-black font-bold" : "text-white/80 hover:bg-white/5 hover:text-amber-500"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


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
    const dt = parseSafeDate(d);
    if (!dt || isNaN(dt.getTime())) return d;
    const pad = (n: number) => String(n).padStart(2, "0");
    const datePart = `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()}`;
    
    const hasTime = d.includes(":") || d.includes(" ");
    if (hasTime) {
      const hasSeconds = d.split(":").length > 2;
      const timePart = hasSeconds
        ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
        : `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      return `${datePart} ${timePart}`;
    }
    return datePart;
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
                        {unregHorses.length === 0
                          ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No unregistered horses available.</p>
                              <button
                                onClick={() => onRegisterOwner(m.id)}
                                style={{ width: "100%", padding: "0.5rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Register for Event
                              </button>
                            </div>
                          )
                          : (
                            <>
                              <p style={{ ...labelStyle, marginBottom: "0.375rem" }}>Select Horses to Register:</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "100px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                                {unregHorses.map((h: any) => {
                                  return (
                                    <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                                      <input type="checkbox" checked={sel.includes(h.id)} onChange={() => handleCheckbox(m.id, h.id)} style={{ accentColor: ROLE_COLOR }} />
                                      {h.name} (Rating: {h.currentRating})
                                    </label>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => sel.length ? handleBulkRegister(m.id) : onRegisterOwner(m.id)}
                                disabled={sel.length === 0 && unregHorses.length > 0}
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
  const [sex, setSex] = useState("Gelding");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatar, setAvatar] = useState("");
  const [description, setDescription] = useState("");
  const [editingHorse, setEditingHorse] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editSex, setEditSex] = useState("Gelding");
  const [editDob, setEditDob] = useState("");
  const [editRating, setEditRating] = useState<number>(52);
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedHorse, setSelectedHorse] = useState<{ id: number; name: string } | null>(null);
  const [msg, setMsg] = useState("");

  const [retiringHorse, setRetiringHorse] = useState<any | null>(null);
  const [retireReason, setRetireReason] = useState("");
  const [retireRequests, setRetireRequests] = useState<any[]>([]);

  const fetchRetireRequests = async () => {
    try {
      const list = await api.get<any[]>("/retirement/requests");
      setRetireRequests(list);
    } catch {}
  };

  useEffect(() => {
    fetchRetireRequests();
  }, []);

  const formatDobForApi = (dobStr: string): string => {
    return dobStr ? `${dobStr} 00:00:00` : "";
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

  const validateAgeAndSex = (dobStr: string, sexVal: string): boolean => {
    if (!dobStr || !sexVal) return true;
    const parts = dobStr.split("-");
    if (parts.length !== 3) return true;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age >= 4) {
      if (sexVal === "Colt") {
        alert("A Colt must be under 4 years old. For uncastrated male horses 4 years or older, please select 'Horse'.");
        return false;
      }
      if (sexVal === "Filly") {
        alert("A Filly must be under 4 years old. For female horses 4 years or older, please select 'Mare'.");
        return false;
      }
    } else {
      if (sexVal === "Horse") {
        alert("A Horse (uncastrated male) must be 4 years or older. For uncastrated male horses under 4 years, please select 'Colt'.");
        return false;
      }
      if (sexVal === "Mare") {
        alert("A Mare must be 4 years or older. For female horses under 4 years, please select 'Filly'.");
        return false;
      }
    }
    return true;
  };

  const handleRegisterHorse = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    if (!validateAgeAndSex(dateOfBirth, sex)) return;
    try {
      await api.post("/horses", { name: horseName, breed, sex, dateOfBirth: formatDobForApi(dateOfBirth), ownerId: user?.id, avatar, description, status: "PENDING" });
      setMsg("✅ Horse declaration submitted for approval.");
      setHorseName(""); setBreed(""); setSex("Gelding"); setDateOfBirth(""); setAvatar(""); setDescription("");
      onRefresh();
    } catch (err: any) { setMsg("❌ " + (err.message || "Failed to submit horse registration.")); }
  };

  const startEdit = (item: any) => {
    setEditingHorse(item.horse);
    setEditName(item.horse.name || "");
    setEditBreed(item.horse.breed || "");
    setEditSex(item.horse.sex || "Gelding");
    setEditDob(item.horse.dateOfBirth ? formatDateTime(item.horse.dateOfBirth).split(" ")[0] : "");
    setEditRating(item.horse.currentRating || 52);
    setEditAvatar(item.horse.avatar || "");
    setEditDescription(item.horse.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingHorse) return;
    if (!validateAgeAndSex(editDob, editSex)) return;
    try {
      await api.put(`/horses/${editingHorse.id}`, { name: editName, breed: editBreed, sex: editSex, dateOfBirth: formatDobForApi(editDob), currentRating: editRating, avatar: editAvatar, description: editDescription });
      setEditingHorse(null); onRefresh();
    } catch (err: any) { setMsg("❌ " + (err.message || "Failed to update horse.")); }
  };

  const handleRequestRetirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retiringHorse) return;
    setMsg("");
    try {
      await api.post("/retirement/request", { horseId: retiringHorse.id, reason: retireReason });
      setMsg("✅ Retirement request submitted for horse " + retiringHorse.name);
      setRetiringHorse(null);
      setRetireReason("");
      fetchRetireRequests();
      onRefresh();
    } catch (err: any) {
      setMsg("❌ " + (err.message || "Failed to submit retirement request."));
    }
  };

  const activeHorses = stable.filter((item: any) => item.horse.status !== "RETIRED" && item.horse.status !== "REJECTED");
  const rejectedHorses = stable.filter((item: any) => item.horse.status === "REJECTED");
  const retiredHorses = stable.filter((item: any) => item.horse.status === "RETIRED");

  const renderHorseCard = (item: any) => {
    const h = item.horse;
    return (
      <div key={h.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {h.avatar
          ? <img src={h.avatar} alt={h.name} style={{ width: "100%", height: "8rem", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "8rem", background: "#0e0c09", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3835", fontWeight: 700, fontFamily: "monospace", fontSize: "0.7rem" }}>NO IMAGE</div>}
        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</h4>
          <p style={{ fontSize: "0.65rem", color: "#a0a0a0" }}>Breed: {h.breed} · Sex: {h.sex || "Gelding"} · Status: <span style={{ color: h.status === "ACTIVE" ? "#4ade80" : h.status === "RETIRED" ? "#ef4444" : h.status === "REJECTED" ? "#f87171" : "#fbbf24", fontWeight: 700 }}>{h.status}</span></p>
          <div style={{ borderTop: "1px solid #2a2825", paddingTop: "0.4rem", display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#a0a0a0" }}>
            <span>Rating: <strong style={{ color: "#c9a227" }}>{h.currentRating}</strong></span>
            <span>Wins: <strong>{item.totalWins ?? 0}</strong>/{item.totalRaces ?? 0}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", flexDirection: "column" }}>
            <button type="button" onClick={() => setSelectedHorse({ id: h.id, name: h.name })} style={{ width: "100%", padding: "0.45rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "#c9a227", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>📈 History</button>
            {h.status !== "RETIRED" && h.status !== "REJECTED" && (
              <>
                <button type="button" onClick={() => startEdit(item)} style={{ width: "100%", padding: "0.45rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.375rem", color: "#f4f2ec", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer" }}>Edit Details</button>
                <button type="button" onClick={() => setRetiringHorse(h)} style={{ width: "100%", padding: "0.45rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.375rem", color: "#f87171", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer" }}>Request Retirement</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {msg && <p style={{ fontSize: "0.8rem", color: msg.startsWith("✅") ? "#4ade80" : "#ef4444", marginBottom: "0.5rem" }}>{msg}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(260px,320px)", gap: "2rem", alignItems: "start" }}>
        
        {/* Three Lanes stacked vertically */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Lane 1: Active & Pending */}
          <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.3)", border: "1px solid rgba(255,255,255,0.04)", padding: "1.25rem" }}>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#4ade80", borderBottom: "1px solid rgba(74,222,128,0.2)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>🟢 Active & Pending</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(74,222,128,0.1)", padding: "0.05rem 0.4rem", borderRadius: "0.25rem" }}>{activeHorses.length}</span>
            </h4>
            {activeHorses.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.7rem" }}>No active or pending horses.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {activeHorses.map(item => renderHorseCard(item))}
              </div>
            )}
          </div>

          {/* Lane 2: Rejected */}
          <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.3)", border: "1px solid rgba(255,255,255,0.04)", padding: "1.25rem" }}>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f87171", borderBottom: "1px solid rgba(248,113,113,0.2)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>🔴 Rejected Declarations</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(248,113,113,0.1)", padding: "0.05rem 0.4rem", borderRadius: "0.25rem" }}>{rejectedHorses.length}</span>
            </h4>
            {rejectedHorses.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.7rem" }}>No rejected declarations.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {rejectedHorses.map(item => renderHorseCard(item))}
              </div>
            )}
          </div>

          {/* Lane 3: Retired */}
          <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.3)", border: "1px solid rgba(255,255,255,0.04)", padding: "1.25rem" }}>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#ef4444", borderBottom: "1px solid rgba(239,68,68,0.2)", paddingBottom: "0.5rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>⚪ Retired</span>
              <span style={{ fontSize: "0.75rem", background: "rgba(239,68,68,0.1)", padding: "0.05rem 0.4rem", borderRadius: "0.25rem" }}>{retiredHorses.length}</span>
            </h4>
            {retiredHorses.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.7rem" }}>No retired horses.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {retiredHorses.map(item => renderHorseCard(item))}
              </div>
            )}
          </div>

        </div>

        {/* Declare Horse Form */}
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Declare New Horse</h3>
          <form onSubmit={handleRegisterHorse} style={{ background: "rgba(21,19,16,0.6)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { lbl: "Horse Name", val: horseName, set: setHorseName, type: "text", ph: "E.g., Shadow Fax" },
              { lbl: "Breed",      val: breed,     set: setBreed,     type: "text", ph: "E.g., Arabian Thoroughbred" },
            ].map(f => (
              <div key={f.lbl}>
                <label style={labelStyle}>{f.lbl}</label>
                <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
              </div>
            ))}          <div>
            <label style={labelStyle}>Gender / Sex</label>
            <select value={sex} onChange={e => setSex(e.target.value)} style={inputStyle}>
              <option value="Gelding">Gelding (Thiến)</option>
              <option value="Colt">Colt (Đực non)</option>
              <option value="Horse">Horse (Đực trưởng thành)</option>
              <option value="Filly">Filly (Cái non)</option>
              <option value="Mare">Mare (Cái trưởng thành)</option>
            </select>
          </div>
            <InlineDatePicker label="Date of Birth" value={dateOfBirth} onChange={setDateOfBirth} />
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

      </div>

      {/* Retirement Request History */}
      <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "1rem" }}>Retirement Request History</h3>
        {retireRequests.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.75rem" }}>No retirement requests submitted yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", fontFamily: "monospace", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0" }}>
                  <th style={{ padding: "0.5rem" }}>Horse Name</th>
                  <th style={{ padding: "0.5rem" }}>Reason</th>
                  <th style={{ padding: "0.5rem" }}>Status</th>
                  <th style={{ padding: "0.5rem" }}>Admin Remarks</th>
                  <th style={{ padding: "0.5rem" }}>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {retireRequests.map((req: any) => (
                  <tr key={req.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.5rem", color: "#f4f2ec", fontWeight: "bold" }}>{req.horseName}</td>
                    <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.reason}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <span style={{
                        padding: "0.15rem 0.4rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.65rem",
                        fontWeight: "bold",
                        background: req.status === "APPROVED" ? "rgba(74,222,128,0.1)" : req.status === "REJECTED" ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.1)",
                        color: req.status === "APPROVED" ? "#4ade80" : req.status === "REJECTED" ? "#ef4444" : "#fbbf24"
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.adminRemarks || "—"}</td>
                    <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{formatDate(req.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              ].map(f => (
                <div key={f.lbl}>
                  <label style={labelStyle}>{f.lbl}</label>
                  <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Gender / Sex</label>
                <select value={editSex} onChange={e => setEditSex(e.target.value)} style={inputStyle}>
                  <option value="Gelding">Gelding (Thiến)</option>
                  <option value="Colt">Colt (Đực non)</option>
                  <option value="Horse">Horse (Đực trưởng thành)</option>
                  <option value="Filly">Filly (Cái non)</option>
                  <option value="Mare">Mare (Cái trưởng thành)</option>
                </select>
              </div>
              <InlineDatePicker label="Date of Birth" value={editDob} onChange={setEditDob} />
              <div>
                <label style={labelStyle}>Horse Photo / Avatar</label>
                <input type="file" accept="image/*" onChange={e => handleAvatarChange(e, true)} style={inputStyle} />
                {editAvatar && (
                  <img src={editAvatar} alt="Preview" style={{ width: "100%", height: "8rem", objectFit: "cover", marginTop: "0.5rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)" }} />
                )}
              </div>
              <div>
                <label style={labelStyle}>Rating</label>
                <input type="number" value={editRating} disabled style={{ ...inputStyle, opacity: 0.5 }} />
                <span style={{ fontSize: "0.65rem", color: "#a0a0a0" }}>* Horse rating is officially managed by System/Admin.</span>
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

      {/* Request Retirement Modal */}
      {retiringHorse && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#121010", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "26rem", position: "relative" }}>
            <button onClick={() => setRetiringHorse(null)} style={{ position: "absolute", right: "1rem", top: "1rem", background: "transparent", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", marginBottom: "1rem" }}>Request Retirement</h3>
            <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>
              Are you sure you want to request retirement for <strong>{retiringHorse.name}</strong>? Once approved, this horse will be marked as <strong>RETIRED</strong> and cannot be registered for any future races.
            </p>
            <form onSubmit={handleRequestRetirement} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Reason for Retirement</label>
                <textarea required value={retireReason} onChange={e => setRetireReason(e.target.value)} placeholder="Please explain why this horse is retiring (e.g. voluntary retirement, age, health)..." style={{ ...inputStyle, height: "5rem", resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setRetiringHorse(null)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedHorse && (
        <HorsePerformanceModal
          horseId={selectedHorse.id}
          horseName={selectedHorse.name}
          onClose={() => setSelectedHorse(null)}
        />
      )}
    </div>
  );
}

// ── CalendarView ───────────────────────────────────────────────────────────
function CalendarView({ meetings, allRaces, seasons, dashboard, invitations, onSendInvitation, onViewProfile }: {
  meetings: any[]; allRaces: any[]; seasons: any[]; dashboard: any; invitations: any[];
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number }) => void;
  onViewProfile: (id: number) => void;
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
                      const bookedHorseIds = dashboard?.bookedHorsesMap?.[race.id] || [];
                      const eligibleHorses = meetingHorses.filter((h: any) => {
                        if (bookedHorseIds.includes(h.id)) return false;
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
                          bookedJockeysMap={dashboard?.bookedJockeysMap}
                          invitations={invitations}
                          onSendInvitation={onSendInvitation}
                          onViewProfile={onViewProfile}
                        />
                      );
                    })}
              </div>
            );
          })}
    </div>
  );
}

function RaceRow({ race, isReg, eligibleHorses, jockeys, bookedJockeysMap, invitations, onSendInvitation, onViewProfile }: {
  race: any; isReg: boolean; eligibleHorses: any[]; jockeys: any[]; bookedJockeysMap?: Record<number, number[]>; invitations: any[];
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number }) => void;
  onViewProfile: (id: number) => void;
}) {
  const [horseId, setHorseId] = useState("");
  const [jockeyId, setJockeyId] = useState("");

  const filteredJockeys = jockeys.filter((j: any) => {
    const bookedIds = bookedJockeysMap?.[race.id] || [];
    if (bookedIds.includes(j.id)) return false;

    if (!horseId) return true;
    const hasPending = (invitations || []).some(
      (inv: any) =>
        Number(inv.raceId) === Number(race.id) &&
        Number(inv.horseId) === Number(horseId) &&
        Number(inv.jockeyId) === Number(j.id) &&
        (inv.status || "").trim().toUpperCase() === "PENDING"
    );
    return !hasPending;
  });

  const filteredHorses = eligibleHorses.filter((h: any) => {
    if (!jockeyId) return true;
    const hasPending = (invitations || []).some(
      (inv: any) =>
        Number(inv.raceId) === Number(race.id) &&
        Number(inv.horseId) === Number(h.id) &&
        Number(inv.jockeyId) === Number(jockeyId) &&
        (inv.status || "").trim().toUpperCase() === "PENDING"
    );
    return !hasPending;
  });

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
          <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.9rem" }}>{formatClassLevel(race.classLevel)}</span>
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
                  {filteredHorses.map((h: any) => <option key={h.id} value={h.id}>{h.name} (Rating: {h.currentRating})</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Select Jockey</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <select value={jockeyId} onChange={e => setJockeyId(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">-- Select Jockey --</option>
                    {filteredJockeys.map((j: any) => <option key={j.id} value={j.id}>{j.fullName || j.username} ({j.weight}kg)</option>)}
                  </select>
                  {jockeyId && (
                    <button type="button" onClick={() => onViewProfile(parseInt(jockeyId))} style={{ background: "none", border: "none", color: "#fbbf24", fontSize: "0.65rem", fontFamily: "monospace", textDecoration: "underline", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}>
                      🔍 View Jockey Profile
                    </button>
                  )}
                </div>
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
function InvitationsView({ invitations, onViewProfile, onResubmit }: { invitations: any[]; onViewProfile: (id: number) => void; onResubmit: (entryId: number) => void }) {
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
                : invitations.map((inv: any) => {
                  const displayStatus = (inv.status === "ACCEPTED" && inv.entryStatus) ? inv.entryStatus : inv.status;
                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>#{inv.id}</td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#f4f2ec" }}>{inv.meetingName ?? `Meeting #${inv.raceId}`}</td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                        {inv.classLevel ? `${inv.classLevel} · ${formatDate(inv.startTime)}` : `Race #${inv.raceId}`}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#f4f2ec" }}>{inv.horseName ?? `Horse #${inv.horseId}`}</td>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", color: "#f4f2ec" }}>
                        <button 
                          type="button" 
                          onClick={() => onViewProfile(inv.jockeyId)} 
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontSize: "0.8rem", fontFamily: "monospace" }}
                        >
                          {inv.jockeyName ?? `Jockey #${inv.jockeyId}`}
                        </button>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <StatusBadge status={displayStatus} />
                          {inv.status === "ACCEPTED" && inv.entryStatus === "REJECTED" && (
                            <button
                              type="button"
                              onClick={() => onResubmit(inv.entryId)}
                              style={{
                                padding: "0.2rem 0.5rem",
                                background: "rgba(201,162,39,0.15)",
                                border: "1px solid rgba(201,162,39,0.3)",
                                borderRadius: "0.25rem",
                                color: "#c9a227",
                                fontSize: "0.6rem",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
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
      // Automatically register owner if not registered yet
      const isOwnerReg = dashboard?.registeredMeetingIds?.includes(meetingId);
      if (!isOwnerReg && user) {
        await api.post("/registrations/owner", { meetingId, ownerId: user.id });
      }
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

  const handleResubmitEntry = async (entryId: number) => {
    const lang = localStorage.getItem("app-lang") || "vi";
    try {
      setErrorMsg(""); setSuccessMsg("");
      await api.post(`/invitations/entry/${entryId}/resubmit`);
      setSuccessMsg(lang === "vi" ? "Gửi lại đăng ký chạy thành công." : "Successfully resubmitted race entry.");
      fetchData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "";
      if (errMsg.includes("REGISTRATION_CLOSED")) {
        setErrorMsg(lang === "vi" 
          ? "Hạn đăng ký cho trận đấu này đã kết thúc, không thể nộp lại đăng ký." 
          : "Registration period for this race has closed.");
      } else if (errMsg.includes("REGISTRATION_NOT_STARTED")) {
        setErrorMsg(lang === "vi" 
          ? "Thời gian đăng ký cho trận đấu này chưa bắt đầu." 
          : "Registration period for this race has not started yet.");
      } else {
        setErrorMsg(err.message || (lang === "vi" ? "Không thể gửi lại đăng ký chạy." : "Failed to resubmit race entry."));
      }
    }
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
        return <CalendarView meetings={meetings} allRaces={allRaces} seasons={seasons} dashboard={dashboard} invitations={invitations} onSendInvitation={handleSendInvitation} onViewProfile={setSelectedProfileId} />;
      case "invitations":
        return <InvitationsView invitations={invitations} onViewProfile={setSelectedProfileId} onResubmit={handleResubmitEntry} />;
      case "results":
        return <ResultsView results={results} totalEarnings={totalEarnings} />;
      case "profile":
        return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Horse Owner" />;
      default:
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} />;
    }
  };

  return (
    <>
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
      {selectedProfileId !== null && (
        <ProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
    </>
  );
}

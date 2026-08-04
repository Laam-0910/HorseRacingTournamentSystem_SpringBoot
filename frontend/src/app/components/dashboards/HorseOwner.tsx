import { Pagination } from "../common/Pagination";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, getErrMsg } from "../../../lib/api";
import { parseSafeDate, formatDateTime, formatClassLevel } from "../../utils/dateTimeHelper";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";
import ProfileModal from "./components/ProfileModal";
import HorsePerformanceModal from "./components/HorsePerformanceModal";
import ViewLive from "./components/ViewLive";
import UserWalletView from "./components/UserWalletView";
import NotificationCenterView from "./components/NotificationCenterView";
import ActionModal, { ActionModalState } from "../common/ActionModal";
import { ViolationsView } from "./Jockey";

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


type OwnerTab = "hub" | "stable" | "calendar" | "invitations" | "results" | "violations" | "live" | "wallet" | "profile" | "notifications";

const ROLE_COLOR = "#4a9d6f";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Owner Hub",           view: "hub"         },
  { index: "02", icon: "wallet",           label: "Wallet & Transactions", view: "wallet"      },
  { index: "03", icon: "bell",             label: "Notifications",      view: "notifications"},
  { index: "04", icon: "book-open",         label: "My Stable",          view: "stable"      },
  { index: "05", icon: "calendar",          label: "Race Calendar",      view: "calendar"    },
  { index: "06", icon: "mail",              label: "Invitations",        view: "invitations" },
  { index: "07", icon: "award",             label: "Stable Race History", view: "results"     },
  { index: "08", icon: "alert-triangle",   label: "Rule Violations",    view: "violations"  },
  { index: "09", icon: "tv",                label: "Live Stream Arena",  view: "live"        },
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
    PENDING_ADMIN: "rgba(245,158,11,0.15)",
    REJECTED: "rgba(239,91,91,0.15)", DECLINED: "rgba(239,91,91,0.15)",
    CLOSED: "rgba(255,255,255,0.08)", DECLARATION_OPEN: "rgba(201,162,39,0.15)",
  };
  const tc: Record<string, string> = {
    APPROVED: "#4a9d6f", ACTIVE: "#4a9d6f",
    PENDING: "#c9a227", ACCEPTED: "#4a9d6f",
    PENDING_ADMIN: "#f59e0b",
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
function HubView({ dashboard, meetings, stable, onRegisterOwner, onRegisterHorses, user, onSwitchTab }: {
  dashboard: any; meetings: any[]; stable: any[];
  onRegisterOwner: (id: number) => void;
  onRegisterHorses: (meetingId: number, horseIds: number[]) => Promise<void>;
  user: any;
  onSwitchTab?: (tab: OwnerTab) => void;
}) {
  const [selectedHorses, setSelectedHorses] = useState<Record<number, number[]>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const walletBal = dashboard?.walletBalance !== undefined && dashboard?.walletBalance !== null
    ? Number(dashboard.walletBalance)
    : (user?.walletBalance !== undefined && user?.walletBalance !== null ? Number(user.walletBalance) : 0);

  const totalItems = meetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMeetings = meetings.slice(startIndex, startIndex + pageSize);

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
            { label: "💰 Wallet Balance", value: `${walletBal.toLocaleString('en-US')} VND`, color: "#fbbf24" },
            { label: "Total Horses",          value: dashboard.totalHorses ?? 0,           color: ROLE_COLOR },
            { label: "Stable Avg Rank",       value: dashboard.averagePlace ? Number(dashboard.averagePlace).toFixed(1) : "N/A" },
            { label: "Races Completed",       value: dashboard.racesCompleted ?? 0,         color: "#c9a227" },
            { label: "Pending Registrations", value: dashboard.pendingRegistrations ?? 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", display: "block", marginBottom: "0.25rem" }}>{s.label}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color ?? "#f4f2ec" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dedicated Wallet & Financial Rules Card */}
      <div className="rounded-2xl border p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(15,13,10,0.8))", borderColor: "rgba(251, 191, 36, 0.25)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.75rem", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", fontSize: "1.5rem" }}>
              💰
            </div>
            <div>
              <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#fbbf24" }}>Owner Wallet & Financial Breakdown</h4>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>Real-time available balance & automatic financial distribution rules</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Wallet</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fbbf24", fontFamily: "monospace", lineHeight: "1.2" }}>
                {walletBal.toLocaleString('en-US')} VND
              </div>
            </div>
            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab("wallet")}
                style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace", border: "none", cursor: "pointer", transition: "all 0.2s" }}
              >
                💳 Manage Wallet
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", borderTop: "1px solid rgba(251, 191, 36, 0.15)", paddingTop: "1rem" }}>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: ROLE_COLOR, fontWeight: 600 }}>🏆 Prize Money Allocation:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Owner receives major share of official race purse distribution minus agreed jockey prize share.</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: ROLE_COLOR, fontWeight: 600 }}>🏇 Jockey Mount Fee:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Mount hire fee specified per invitation paid to jockey upon invitation acceptance.</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: ROLE_COLOR, fontWeight: 600 }}>🏷️ Entry Fee & Refunds:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Full refund issued automatically if race is cancelled or entry is rejected by stewards.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Available Race Meetings</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>Register your stable for upcoming race day events.</p>
        {meetings.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No upcoming meetings available.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
              {paginatedMeetings.map((m: any) => {
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
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontFamily: "monospace", marginTop: "0.25rem", background: "rgba(251,191,36,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid rgba(251,191,36,0.2)" }}>
                      💰 <strong>Total Meeting Budget:</strong> {Number(m.totalBudget || m.total_budget || 500000).toLocaleString('en-US')} VND
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                        Place Prizes: 1st (50%), 2nd (30%), 3rd (20%)
                      </div>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#34d399", fontFamily: "monospace", background: "rgba(52,211,153,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid rgba(52,211,153,0.2)" }}>
                      🎟️ <strong>Race Meeting Registration Fee:</strong> {Number(m.ticketPrice || m.ticket_price || 0).toLocaleString('en-US')} VND
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                        Fee will be held in Escrow Vault upon registration. Refunded if rejected or meeting deactivated.
                      </div>
                    </div>

                    {/* Register button: only show when NOT registered (no entry at all) */}
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
                                      {h.name} (Rating: {h.currentRating ?? 0})
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

                    {/* PENDING / APPROVED: show info badge, hide register button */}
                    {isReg && (regStatus === "PENDING" || regStatus === "APPROVED") && (
                      <div style={{ fontSize: "0.65rem", color: regStatus === "APPROVED" ? "#34d399" : "#fbbf24", fontFamily: "monospace", fontStyle: "italic", background: regStatus === "APPROVED" ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: `1px solid ${regStatus === "APPROVED" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}>
                        {regStatus === "APPROVED" ? "✅ Registration approved. You are registered for this event." : "⏳ Registration is pending approval. You cannot register again until reviewed."}
                      </div>
                    )}

                    {isReg && regStatus === "REJECTED" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <p style={{ fontSize: "0.65rem", color: "#ef4444", fontFamily: "monospace", fontStyle: "italic" }}>
                          ⚠️ Your registration for this meeting was rejected. You can select horse(s) from your stable to re-register below:
                        </p>
                        
                        {/* Horse Selection List for Re-Registration */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          <p style={{ ...labelStyle, marginBottom: "0.25rem", color: "#f87171" }}>Select Horse(s) to Re-Register:</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "120px", overflowY: "auto", background: "rgba(0,0,0,0.3)", borderRadius: "0.5rem", padding: "0.5rem", border: "1px solid rgba(239,68,68,0.2)" }}>
                            {stable && stable.length > 0 ? (
                              stable.map((item: any) => {
                                const h = item.horse || item;
                                if (h.status === "RETIRED" || h.status === "REJECTED") return null;
                                return (
                                  <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                                    <input type="checkbox" checked={sel.includes(h.id)} onChange={() => handleCheckbox(m.id, h.id)} style={{ accentColor: "#ef4444" }} />
                                    <span>🐎 {h.name} (Rating: {h.currentRating ?? 0})</span>
                                  </label>
                                );
                              })
                            ) : (
                              <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontStyle: "italic" }}>No active horses in stable.</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => sel.length > 0 ? handleBulkRegister(m.id) : onRegisterOwner(m.id)}
                          style={{ width: "100%", marginTop: "0.25rem", padding: "0.5rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
                        >
                          <span>🔄</span>
                          <span>{sel.length > 0 ? `Re-Register ${sel.length} Selected Horse(s)` : "Re-Register for Event"}</span>
                        </button>
                      </div>
                    ) : isReg && (
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
                            <p style={labelStyle}>{regHorses.length > 0 ? "Register Additional Horses:" : "Select Horses to Register:"}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "100px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "0.5rem", padding: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                              {unregHorses.map((h: any) => (
                                <label key={h.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.7rem", color: "#f4f2ec", cursor: "pointer", fontFamily: "monospace" }}>
                                  <input type="checkbox" checked={sel.includes(h.id)} onChange={() => handleCheckbox(m.id, h.id)} style={{ accentColor: ROLE_COLOR }} />
                                  {h.name} (Rating: {h.currentRating ?? 0})
                                </label>
                              ))}
                            </div>
                            <button
                              onClick={() => handleBulkRegister(m.id)}
                              disabled={sel.length === 0}
                              style={{ width: "100%", marginTop: "0.5rem", padding: "0.4rem", background: sel.length > 0 ? "rgba(74,157,111,0.2)" : "rgba(255,255,255,0.05)", color: sel.length > 0 ? ROLE_COLOR : "#a0a0a0", border: `1px solid ${sel.length > 0 ? "rgba(74,157,111,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: sel.length > 0 ? "pointer" : "not-allowed" }}
                            >
                              {regHorses.length > 0 ? `Submit Additional Horses (${sel.length})` : `Register ${sel.length} Selected Horse(s)`}
                            </button>
                          </div>
                        )}
                        {unregHorses.length === 0 && regHorses.length > 0 && (
                          <p style={{ fontSize: "0.65rem", color: ROLE_COLOR, fontStyle: "italic", fontFamily: "monospace" }}>✓ All stable horses registered</p>
                        )}
                        {unregHorses.length === 0 && regHorses.length === 0 && (
                          <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No active horses available in stable to register.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={validPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[3, 6, 12, 24]}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── StableView ─────────────────────────────────────────────────────────────
function StableView({ stable, onRefresh }: { stable: any[]; onRefresh: () => void }) {
  const { user } = useAuth();
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
  const [retirePage, setRetirePage] = useState(1);
  const [retirePageSize, setRetirePageSize] = useState(5);

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
    
    if (age < 2 || age > 10) {
      alert("Horse age must be between 2 and 10 years old.");
      return false;
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
    } catch (err: any) { setMsg("❌ " + (getErrMsg(err, "Failed to submit horse registration."))); }
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
    } catch (err: any) { setMsg("❌ " + (getErrMsg(err, "Failed to update horse."))); }
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
      setMsg("❌ " + (getErrMsg(err, "Failed to submit retirement request.")));
    }
  };

  const activeHorses = stable.filter((item: any) => item.horse.status !== "RETIRED" && item.horse.status !== "REJECTED");
  const rejectedHorses = stable.filter((item: any) => item.horse.status === "REJECTED");
  const retiredHorses = stable.filter((item: any) => item.horse.status === "RETIRED");

  const [activePage, setActivePage] = useState(1);
  const [activePageSize, setActivePageSize] = useState(6);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedPageSize, setRejectedPageSize] = useState(6);
  const [retiredPage, setRetiredPage] = useState(1);
  const [retiredPageSize, setRetiredPageSize] = useState(6);

  const paginatedActive = activeHorses.slice((activePage - 1) * activePageSize, activePage * activePageSize);
  const paginatedRejected = rejectedHorses.slice((rejectedPage - 1) * rejectedPageSize, rejectedPage * rejectedPageSize);
  const paginatedRetired = retiredHorses.slice((retiredPage - 1) * retiredPageSize, retiredPage * retiredPageSize);

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
            <span>Wins / Races: <strong style={{ color: "#f4f2ec" }}>{item.totalWins ?? 0}</strong> / <strong>{item.totalRaces ?? 0}</strong></span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", flexDirection: "column" }}>
            <button type="button" onClick={() => setSelectedHorse({ id: h.id, name: h.name })} style={{ width: "100%", padding: "0.45rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "#c9a227", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}>📈 History</button>
            {h.status !== "RETIRED" && h.status !== "REJECTED" && (
              <>
                <button type="button" onClick={() => startEdit(item)} style={{ width: "100%", padding: "0.45rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.375rem", color: "#f4f2ec", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer" }}>Edit Details</button>
                {h.status !== "PENDING" && h.status !== "PENDING_APPROVAL" && (
                  <button type="button" onClick={() => setRetiringHorse(h)} style={{ width: "100%", padding: "0.45rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "0.375rem", color: "#f87171", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer" }}>Request Retirement</button>
                )}
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

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(260px,320px)", gap: "2rem", alignItems: "start" }}>
        
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
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {paginatedActive.map(item => renderHorseCard(item))}
                </div>
                <Pagination
                  currentPage={activePage}
                  totalItems={activeHorses.length}
                  pageSize={activePageSize}
                  onPageChange={setActivePage}
                  onPageSizeChange={setActivePageSize}
                  pageSizeOptions={[6, 12, 24, 48]}
                />
              </>
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
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {paginatedRejected.map(item => renderHorseCard(item))}
                </div>
                <Pagination
                  currentPage={rejectedPage}
                  totalItems={rejectedHorses.length}
                  pageSize={rejectedPageSize}
                  onPageChange={setRejectedPage}
                  onPageSizeChange={setRejectedPageSize}
                  pageSizeOptions={[6, 12, 24, 48]}
                />
              </>
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
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {paginatedRetired.map(item => renderHorseCard(item))}
                </div>
                <Pagination
                  currentPage={retiredPage}
                  totalItems={retiredHorses.length}
                  pageSize={retiredPageSize}
                  onPageChange={setRetiredPage}
                  onPageSizeChange={setRetiredPageSize}
                  pageSizeOptions={[6, 12, 24, 48]}
                />
              </>
            )}
          </div>

        </div>

        {/* Declare Horse Form */}
        <div style={{ order: isMobile ? -1 : undefined }}>
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
              <option value="Gelding">Gelding</option>
              <option value="Colt">Colt</option>
              <option value="Horse">Horse</option>
              <option value="Filly">Filly</option>
              <option value="Mare">Mare</option>
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
      {(() => {
        const totalItems = retireRequests.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / retirePageSize));
        const validPage = Math.min(Math.max(1, retirePage), totalPages);
        const startIndex = (validPage - 1) * retirePageSize;
        const paginatedRetireRequests = retireRequests.slice(startIndex, startIndex + retirePageSize);

        return (
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
                    {paginatedRetireRequests.map((req: any) => (
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
                <Pagination
                  currentPage={validPage}
                  totalItems={totalItems}
                  pageSize={retirePageSize}
                  onPageChange={setRetirePage}
                  onPageSizeChange={setRetirePageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            )}
          </div>
        );
      })()}

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
                  <option value="Gelding">Gelding</option>
                  <option value="Colt">Colt</option>
                  <option value="Horse">Horse</option>
                  <option value="Filly">Filly</option>
                  <option value="Mare">Mare</option>
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
function CalendarView({ meetings, allRaces, seasons, dashboard, invitations, onSendInvitation, onViewProfile, refereesMap }: {
  meetings: any[]; allRaces: any[]; seasons: any[]; dashboard: any; invitations: any[];
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number }) => void;
  onViewProfile: (id: number) => void;
  refereesMap?: Record<number, any[]>;
}) {
  const [seasonFilter, setSeasonFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredMeetings = seasonFilter
    ? meetings.filter(m => String(m.seasonId) === seasonFilter)
    : meetings;

  const totalItems = filteredMeetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMeetings = filteredMeetings.slice(startIndex, startIndex + pageSize);

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
              onChange={e => {
                setSeasonFilter(e.target.value);
                setPage(1);
              }}
              style={{ ...inputStyle, width: "220px", cursor: "pointer" }}
            >
              <option value="">-- All Seasons --</option>
              {seasons.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.status})</option>)}
            </select>
          </div>
        )}
      </div>

      {filteredMeetings.length === 0 ? (
        <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No meetings found.</p>
      ) : (
        <>
          {paginatedMeetings.map((m: any) => {
            const isReg = dashboard?.registeredMeetingIds?.includes(m.id);
            const regStatus = dashboard?.regStatuses?.[m.id];
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
                  {isReg && regStatus === "APPROVED"
                    ? <span style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", borderRadius: "0.25rem", background: "rgba(74,157,111,0.12)", color: "#4a9d6f", border: "1px solid rgba(74,157,111,0.25)" }}>Event Registration Approved</span>
                    : isReg && regStatus === "PENDING"
                    ? <span style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", borderRadius: "0.25rem", background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>Registration Pending Approval</span>
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
                          refereesMap={refereesMap}
                        />
                      );
                    })}
              </div>
            );
          })}
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </>
      )}
    </div>
  );
}

function RaceRow({ race, isReg, eligibleHorses, jockeys, bookedJockeysMap, invitations, onSendInvitation, onViewProfile, refereesMap }: {
  race: any; isReg: boolean; eligibleHorses: any[]; jockeys: any[]; bookedJockeysMap?: Record<number, number[]>; invitations: any[];
  onSendInvitation: (form: { horseId: number; raceId: number; jockeyId: number; jockeyPrizePercentage?: number }) => void;
  onViewProfile: (id: number) => void;
  refereesMap?: Record<number, any[]>;
}) {
  const [horseId, setHorseId] = useState("");
  const [jockeyId, setJockeyId] = useState("");
  const [jockeyPrizePct, setJockeyPrizePct] = useState("20");

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
    const pct = parseFloat(jockeyPrizePct);
    const validPct = isNaN(pct) ? 20 : Math.max(20, Math.min(50, pct));
    onSendInvitation({ horseId: parseInt(horseId), raceId: race.id, jockeyId: parseInt(jockeyId), jockeyPrizePercentage: validPct });
    setHorseId(""); setJockeyId(""); setJockeyPrizePct("20");
  };

  const assignedReferees = refereesMap?.[race.id] || [];

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
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", marginBottom: "0.15rem" }}>{s.label}</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f4f2ec", fontFamily: "monospace" }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <span><strong style={{ color: "rgba(201,162,39,0.8)" }}>Entries Open:</strong> {formatDate(race.registrationStartTime)}</span>
          <span><strong style={{ color: "rgba(201,162,39,0.8)" }}>Close:</strong> {formatDate(race.registrationEndTime)}</span>
        </div>

        {assignedReferees.length > 0 && (
          <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.4rem" }}>
            <span style={{ color: "#c9a227", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
              ⚖️ Assigned Referee:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {assignedReferees.map((ref: any) => (
                <span key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f2ec" }}>
                  {ref.avatar ? (
                    <img src={ref.avatar} alt={ref.fullName || ref.username} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "10px" }}>👤</span>
                  )}
                  <span style={{ fontWeight: 600, color: "#fbbf24" }}>{ref.fullName || ref.username}</span>
                </span>
              ))}
            </div>
          </div>
        )}
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
              <div>
                <label style={labelStyle}>Jockey Prize Share % (20% - 50%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min="20"
                    max="50"
                    step="1"
                    value={jockeyPrizePct}
                    onChange={e => setJockeyPrizePct(e.target.value)}
                    required
                    style={{ ...inputStyle, width: "80px", textAlign: "center" }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontFamily: "monospace", fontWeight: 700 }}>%</span>
                  <span style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace" }}>(Owner: {100 - (parseFloat(jockeyPrizePct) || 20)}%)</span>
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
function InvitationsView({ invitations, onViewProfile, onResubmit, onWithdraw, refereesMap }: { invitations: any[]; onViewProfile: (id: number) => void; onResubmit: (entryId: number) => void; onWithdraw: (invitationId: number) => void; refereesMap?: Record<number, any[]> }) {
  const lang = localStorage.getItem("app-lang") || "en";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACCEPTED" | "REJECTED" | "PENDING">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredInvitations = invitations.filter((inv: any) => {
    const st = (inv.status === "ACCEPTED" && inv.entryStatus) ? inv.entryStatus : inv.status;
    if (statusFilter !== "ALL") {
      if (statusFilter === "ACCEPTED" && inv.status !== "ACCEPTED") return false;
      if (statusFilter === "REJECTED" && inv.status !== "REJECTED" && inv.entryStatus !== "REJECTED") return false;
      if (statusFilter === "PENDING" && inv.status !== "PENDING" && inv.entryStatus !== "PENDING_ADMIN") return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const meetingMatch = (inv.meetingName || "").toLowerCase().includes(q);
    const horseMatch = (inv.horseName || "").toLowerCase().includes(q);
    const jockeyMatch = (inv.jockeyName || "").toLowerCase().includes(q);
    const classMatch = (inv.classLevel || "").toLowerCase().includes(q);
    const idMatch = String(inv.raceId || "").includes(q) || String(inv.id || "").includes(q);
    return meetingMatch || horseMatch || jockeyMatch || classMatch || idMatch;
  });

  const totalItems = filteredInvitations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedInvitations = filteredInvitations.slice(startIndex, startIndex + pageSize);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Sent Invitations & History</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Track jockey invitation responses, mount hire fees, and admin approval records.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Status Filter Pills */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "2px" }}>
            {(["ALL", "ACCEPTED", "REJECTED", "PENDING"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
                style={{
                  padding: "0.3rem 0.6rem",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  fontWeight: statusFilter === tab ? "bold" : "normal",
                  background: statusFilter === tab ? "#c9a227" : "transparent",
                  color: statusFilter === tab ? "#000" : "rgba(255,255,255,0.7)",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tab === "ALL" ? "All" : tab === "ACCEPTED" ? "✓ Accepted" : tab === "REJECTED" ? "✕ Rejected" : "⏳ Pending"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "220px", maxWidth: "300px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search meeting, horse, jockey..."
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2.2rem",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "0.375rem",
                color: "#f4f2ec",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
            <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#c9a227", fontSize: "0.85rem", pointerEvents: "none" }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setPage(1); }}
                style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.75rem" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredInvitations.length === 0 ? (
            <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)", padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>
              No matching invitations found.
            </div>
          ) : (
            paginatedInvitations.map((inv: any) => {
              const displayStatus = (inv.status === "ACCEPTED" && inv.entryStatus) ? inv.entryStatus : inv.status;
              const assignedRefs = refereesMap?.[inv.raceId] || [];
              return (
                <div key={inv.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>#{inv.id}</span>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f4f2ec", marginTop: "2px" }}>
                        {inv.meetingName ?? `Meeting #${inv.raceId}`}
                      </h4>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <StatusBadge status={displayStatus} />
                      {inv.entryStatus === "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => onResubmit(inv.entryId)}
                          style={{
                            padding: "0.2rem 0.5rem",
                            background: "rgba(201,162,39,0.15)",
                            border: "1px solid rgba(201,162,39,0.3)",
                            borderRadius: "0.25rem",
                            color: "#c9a227",
                            fontSize: "0.65rem",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Resubmit
                        </button>
                      )}
                      {(inv.status === "PENDING" || (inv.status === "ACCEPTED" && (inv.entryStatus === "PENDING_ADMIN" || inv.entryStatus === "APPROVED"))) && (
                        <button
                          type="button"
                          onClick={() => onWithdraw(inv.id)}
                          style={{
                            padding: "0.2rem 0.5rem",
                            background: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "0.25rem",
                            color: "#f87171",
                            fontSize: "0.65rem",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Withdraw Registration
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                    {inv.classLevel ? `${inv.classLevel} · ${formatDate(inv.startTime)}` : `Race #${inv.raceId}`}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f4f2ec", display: "flex", flexWrap: "wrap", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Horse: </span>
                      <strong>{inv.horseName ?? `Horse #${inv.horseId}`}</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Jockey: </span>
                      <button 
                        type="button" 
                        onClick={() => onViewProfile(inv.jockeyId)} 
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontSize: "0.8rem", fontFamily: "monospace" }}
                      >
                        {inv.jockeyName ?? `Jockey #${inv.jockeyId}`}
                      </button>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Jockey Share: </span>
                      <strong style={{ color: "#fbbf24", fontFamily: "monospace" }}>{inv.jockeyPrizePercentage ?? 20}%</strong>
                    </div>
                    {assignedRefs.length > 0 && (
                      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>⚖️ Referee: </span>
                        {assignedRefs.map((ref: any) => (
                          <span key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "0.1rem 0.4rem", borderRadius: "0.25rem", color: "#fbbf24", fontSize: "0.75rem", fontWeight: "bold" }}>
                            {ref.avatar ? <img src={ref.avatar} alt={ref.fullName} style={{ width: 14, height: 14, borderRadius: "50%" }} /> : "👤"}
                            {ref.fullName || ref.username}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      ) : (
        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {["ID", "Meeting", "Race", "Horse", "Jockey", "Referee", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.length === 0
                  ? <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No matching invitations found.</td></tr>
                  : paginatedInvitations.map((inv: any) => {
                    const displayStatus = (inv.status === "ACCEPTED" && inv.entryStatus) ? inv.entryStatus : inv.status;
                    const assignedRefs = refereesMap?.[inv.raceId] || [];
                    return (
                      <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "0.875rem 1.25rem", fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>#{inv.id}</td>
                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#f4f2ec" }}>{inv.meetingName ?? `Meeting #${inv.raceId}`}</td>
                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                          {inv.classLevel ? `${inv.classLevel} · ${formatDate(inv.startTime)}` : `Race #${inv.raceId}`}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.8rem", fontWeight: 700, color: "#f4f2ec" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {inv.horseAvatar ? (
                                <img src={inv.horseAvatar} alt={inv.horseName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <span style={{ fontSize: "0.8rem" }}>🐴</span>
                              )}
                            </div>
                            <span>{inv.horseName ?? `Horse #${inv.horseId}`}</span>
                          </div>
                        </td>
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
                          {assignedRefs.length === 0 ? (
                            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>-</span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {assignedRefs.map((ref: any) => (
                                <span key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600 }}>
                                  {ref.avatar ? <img src={ref.avatar} alt={ref.fullName} style={{ width: 16, height: 16, borderRadius: "50%" }} /> : "⚖️"}
                                  {ref.fullName || ref.username}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.875rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <StatusBadge status={displayStatus} />
                            {inv.entryStatus === "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => onResubmit(inv.entryId)}
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  background: "rgba(201,162,39,0.15)",
                                  border: "1px solid rgba(201,162,39,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "#c9a227",
                                  fontSize: "0.65rem",
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                Resubmit
                              </button>
                            )}
                            {(inv.status === "PENDING" || (inv.status === "ACCEPTED" && (inv.entryStatus === "PENDING_ADMIN" || inv.entryStatus === "APPROVED"))) && (
                              <button
                                type="button"
                                onClick={() => onWithdraw(inv.id)}
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  background: "rgba(239,68,68,0.15)",
                                  border: "1px solid rgba(239,68,68,0.3)",
                                  borderRadius: "0.25rem",
                                  color: "#f87171",
                                  fontSize: "0.65rem",
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                Withdraw Registration
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
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}
    </div>
  );
}

// ── ResultsView ────────────────────────────────────────────────────────────
function ResultsView({ results, totalEarnings }: { results: any[]; totalEarnings?: number }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalItems = results.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedResults = results.slice(startIndex, startIndex + pageSize);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab',serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Stable Race History</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>Comprehensive record of all finished races and performance metrics of your stable.</p>
        </div>
      </div>

      <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {results.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No race results available yet.</div>
            ) : (
              paginatedResults.map((r: any, i: number) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                      📅 {formatDate(r.startTime)}
                    </span>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "11px", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", background: r.position === 1 ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.05)", color: r.position === 1 ? "#c9a227" : "#f4f2ec" }}>
                      Pos: {r.position ?? r.finalPosition ?? "—"}
                    </span>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "14px" }}>{r.horseName ?? `Horse #${r.horseId}`}</h4>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{r.meetingName ?? "—"}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)", display: "block" }}>Race Class</span>
                      <span style={{ color: "#f4f2ec" }}>{r.classLevel ?? r.raceName ?? `Race #${r.raceId}`}</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)", display: "block" }}>Finish Time</span>
                      <span style={{ color: "#f4f2ec", fontFamily: "monospace" }}>{r.finishTime ?? "—"}</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)", display: "block" }}>Rating Adj</span>
                      <span style={{ fontFamily: "monospace", color: r.ratingAdjustment > 0 ? "#4a9d6f" : r.ratingAdjustment < 0 ? "#ef5b5b" : "#a0a0a0" }}>
                        {r.ratingAdjustment != null ? (r.ratingAdjustment > 0 ? `+${r.ratingAdjustment}` : r.ratingAdjustment) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={validPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  {["Date", "Meeting", "Race Class", "Horse", "Pos", "Finish Time", "Rating Adj"].map(h => (
                     <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.length === 0
                  ? <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>No race results available yet.</td></tr>
                  : paginatedResults.map((r: any, i: number) => (
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
                    </tr>
                  ))}
              </tbody>
            </table>
            <Pagination
              currentPage={validPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
/**
 * Component HorseOwner - Main Dashboard for Horse Owners.
 */
export default function HorseOwner() {
  const { user, setUser } = useAuth();
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
  const [violations, setViolations] = useState<any[]>([]);
  const [refereesMap, setRefereesMap] = useState<Record<number, any[]>>({});
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [actionModal, setActionModal] = useState<ActionModalState>({ isOpen: false, type: "success", title: "", message: "" });

  const fetchData = async () => {
    if (!user) return;
    try {
      const [stats, stableData, invites, allMeetings, ownerResults, allSeasonsData, racesData, refsData, ownerViols] = await Promise.all([
        api.get<any>(`/owner/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/owner/${user.id}/stable`).catch(() => []),
        api.get<any[]>(`/owner/${user.id}/invitations`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>(`/owner/${user.id}/results`).catch(() => []),
        api.get<any[]>("/races/seasons").catch(() => []),
        api.get<any[]>("/races").catch(() => []),
        api.get<Record<number, any[]>>("/public/races/referees").catch(() => ({})),
        api.get<any[]>(`/owner/${user.id}/violations`).catch(() => []),
      ]);
      setDashboard(stats);
      if (stats?.walletBalance !== undefined && user) {
        const updatedBal = Number(stats.walletBalance);
        if (Number(user.walletBalance) !== updatedBal) {
          setUser({ ...user, walletBalance: updatedBal });
        }
      }
      setStable(Array.isArray(stableData) ? stableData : []);
      setInvitations(Array.isArray(invites) ? invites : []);
      setMeetings(Array.isArray(allMeetings) ? allMeetings : []);
      setResults(Array.isArray(ownerResults) ? ownerResults : []);
      setSeasons(Array.isArray(allSeasonsData) ? allSeasonsData : []);
      setAllRaces(Array.isArray(racesData) ? racesData : []);
      setRefereesMap(refsData || {});
      setViolations(Array.isArray(ownerViols) ? ownerViols : []);
    } catch (err: any) { 
      setErrorMsg(getErrMsg(err, "Failed to load owner data.")); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [user]);

  const handleAcknowledgeViolation = async (violationId: number) => {
    try {
      await api.post(`/owner/violations/${violationId}/confirm`);
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Violation Acknowledged",
        message: "You have acknowledged the violation record. Fine penalty (if applicable) processed successfully."
      });
      fetchData();
    } catch (err: any) {
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Acknowledgment Failed",
        message: getErrMsg(err, "Failed to confirm violation.")
      });
    }
  };

  const handleRegisterOwner = async (meetingId: number) => {
    if (!user) return;
    try {
      await api.post("/registrations/owner", { meetingId, ownerId: user.id });
      setSuccessMsg("Successfully registered as Owner for meeting.");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to register for meeting.")); }
  };

  const handleRegisterHorses = async (meetingId: number, horseIds: number[]) => {
    try {
      setErrorMsg(""); setSuccessMsg("");
      const isOwnerReg = dashboard?.registeredMeetingIds?.includes(meetingId);
      if (!isOwnerReg && user) {
        await api.post("/registrations/owner", { meetingId, ownerId: user.id });
      }
      await Promise.all(horseIds.map(horseId => api.post("/registrations/horse", { meetingId, horseId })));
      setSuccessMsg(`Successfully registered ${horseIds.length} horse(s) for meeting.`);
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to register horse(s).")); }
  };

  const handleSendInvitation = async (form: { horseId: number; raceId: number; jockeyId: number; jockeyPrizePercentage?: number }) => {
    if (!user) return;
    try {
      setErrorMsg(""); setSuccessMsg("");
      await api.post("/invitations", { ...form, ownerId: user.id, status: "PENDING", jockeyPrizePercentage: form.jockeyPrizePercentage ?? 20 });
      setSuccessMsg("Invitation sent to jockey.");
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Invitation Sent Successfully!",
        message: "Your mount invitation has been sent to the jockey. The hire fee has been reserved in Escrow Vault."
      });
      fetchData();
    } catch (err: any) {
      let msg = getErrMsg(err) || "Failed to send invitation.";
      const errMsg = err.response?.data?.error || msg;
      if (errMsg.includes("JOCKEY_NOT_APPROVED")) {
        msg = "This jockey has not been approved for this race meeting yet.";
      } else if (errMsg.includes("HORSE_NOT_ACTIVE")) {
        msg = "The selected horse is not active.";
      } else if (errMsg.includes("HORSE_NOT_APPROVED")) {
        msg = "The selected horse has not been approved for this race meeting yet.";
      }
      setErrorMsg(msg);
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Failed to Send Invitation",
        message: msg
      });
    }
  };

  const handleResubmitEntry = async (entryId: number) => {
    try {
      setErrorMsg(""); setSuccessMsg("");
      await api.post(`/invitations/entry/${entryId}/resubmit`);
      setSuccessMsg("Successfully resubmitted race entry.");
      fetchData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || getErrMsg(err, "");
      if (errMsg.includes("REGISTRATION_CLOSED")) {
        setErrorMsg("Registration period for this race has closed.");
      } else if (errMsg.includes("REGISTRATION_NOT_STARTED")) {
        setErrorMsg("Registration period for this race has not started yet.");
      } else if (errMsg.includes("JOCKEY_ALREADY_BOOKED")) {
        setErrorMsg("This jockey is already booked or has another active entry in this race.");
      } else if (errMsg.includes("HORSE_ALREADY_BOOKED")) {
        setErrorMsg("This horse is already booked or has another active entry in this race.");
      } else {
        setErrorMsg(getErrMsg(err) || "Failed to resubmit race entry.");
      }
    }
  };

  const handleWithdrawInvitation = async (id: number) => {
    if (!user) return;
    try {
      setErrorMsg(""); setSuccessMsg("");
      await api.post(`/invitations/${id}/withdraw?ownerId=${user.id}`);
      setSuccessMsg("Successfully withdrew invitation/entry.");
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Invitation Withdrawn",
        message: "The invitation has been withdrawn and the hire fee refunded to your wallet."
      });
      fetchData();
    } catch (err: any) {
      const msg = getErrMsg(err) || "Failed to withdraw registration.";
      setErrorMsg(msg);
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Failed to Withdraw Invitation",
        message: msg
      });
    }
  };

  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const pendingViolations = violations.filter(v => v.status === "PENDING").length;
  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Owner Hub";
  const navItemsWithBadge = NAV_ITEMS.map(n => {
    if (n.view === "invitations") return { ...n, badge: pendingInvitations };
    if (n.view === "violations") return { ...n, badge: pendingViolations };
    return n;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "hub":
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} user={user} onSwitchTab={setActiveTab} />;
      case "stable":
        return <StableView stable={stable} onRefresh={fetchData} />;
      case "calendar":
        return <CalendarView meetings={meetings} allRaces={allRaces} seasons={seasons} dashboard={dashboard} invitations={invitations} onSendInvitation={handleSendInvitation} onViewProfile={setSelectedProfileId} refereesMap={refereesMap} />;
      case "invitations":
        return <InvitationsView invitations={invitations} onViewProfile={setSelectedProfileId} onResubmit={handleResubmitEntry} onWithdraw={handleWithdrawInvitation} refereesMap={refereesMap} />;
      case "results":
        return <ResultsView results={results} />;
      case "violations":
        return <ViolationsView violations={violations} onAcknowledge={handleAcknowledgeViolation} onViewProfile={setSelectedProfileId} />;
      case "live":
        return <ViewLive />;
      case "wallet":
        return <UserWalletView user={user} roleLabel="Horse Owner" roleColor="#4a9d6f" />;
      case "notifications":
        return <NotificationCenterView userId={user?.id} />;
      case "profile":
        return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Horse Owner" />;
      default:
        return <HubView dashboard={dashboard} meetings={meetings} stable={stable} onRegisterOwner={handleRegisterOwner} onRegisterHorses={handleRegisterHorses} user={user} onSwitchTab={setActiveTab} />;
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
      <ActionModal modal={actionModal} onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
}

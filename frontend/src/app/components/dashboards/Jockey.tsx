import { useState, useEffect } from "react";
import { parseSafeDate, formatDateTime, formatDate } from "../../utils/dateTimeHelper";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";
import ProfileModal from "./components/ProfileModal";
import HorsePerformanceModal from "./components/HorsePerformanceModal";

type JockeyTab = "hub" | "mounts" | "calendar" | "invitations" | "violations" | "profile";

const ROLE_COLOR = "#3b82c4";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Jockey Hub",    view: "hub"         },
  { index: "02", icon: "flag",             label: "My Mounts",     view: "mounts"      },
  { index: "03", icon: "calendar",         label: "Race Calendar", view: "calendar"    },
  { index: "04", icon: "mail",             label: "Invitations",   view: "invitations" },
  { index: "05", icon: "alert-triangle",   label: "Rule Violations", view: "violations" },
];

// ── Sub-views ────────────────────────────────────────────────────────────────

function StatsCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.6)", borderColor: "rgba(255,255,255,0.08)", padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0" }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: color ?? "#f4f2ec" }}>{value ?? 0}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? "PENDING";
  let bg = "rgba(195,162,39,0.12)";
  let fg = "#c9a227";
  let bc = "rgba(195,162,39,0.3)";

  if (s === "APPROVED") {
    bg = "rgba(74,222,128,0.12)";
    fg = "#4ade80";
    bc = "rgba(74,222,128,0.3)";
  } else if (s === "REJECTED") {
    bg = "rgba(239,91,91,0.12)";
    fg = "#ef5b5b";
    bc = "rgba(239,91,91,0.3)";
  } else if (s === "UNREGISTERED") {
    bg = "rgba(255,255,255,0.05)";
    fg = "#a0a0a0";
    bc = "rgba(255,255,255,0.12)";
  }

  return (
    <span style={{
      fontSize: "9px",
      fontFamily: "monospace",
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      padding: "0.25rem 0.5rem",
      borderRadius: "0.375rem",
      background: bg,
      color: fg,
      border: `1px solid ${bc}`
    }}>
      {s}
    </span>
  );
}

function HubView({ dashboard, meetings, onRegister }: { dashboard: any; meetings: any[]; onRegister: (id: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stats row — giống JSP: grid-cols-2 md:grid-cols-5 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
        <StatsCard label="Total Rides"     value={dashboard?.totalRaces} />
        <StatsCard label="Wins (1st)"      value={dashboard?.totalWins}   color="#4ade80" />
        <StatsCard label="Top 3 Finishes"  value={dashboard?.top3Count}   color={ROLE_COLOR} />
        <StatsCard label="Win Rate"        value={dashboard?.winRate ? `${Number(dashboard.winRate).toFixed(1)}%` : "0.0%"} color="#c9a227" />
        <StatsCard label="Total Earnings (10%)" value={dashboard?.totalEarnings ? `$${Number(dashboard.totalEarnings).toLocaleString()}` : "$0"} color="#4ade80" />
      </div>

      {/* Available Race Meetings */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Available Race Meetings</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>Register for race meetings to make yourself available for stable hire invitations.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {meetings.length === 0 ? (
            <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>No upcoming meetings available.</p>
          ) : meetings.map((m: any) => {
            const isReg = dashboard?.registeredMeetingIds?.includes(m.id);
            const regStatus = dashboard?.regStatuses?.[m.id];

            return (
              <div key={m.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                  {isReg ? <StatusBadge status={regStatus ?? "APPROVED"} /> : <StatusBadge status="UNREGISTERED" />}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span>📍 {m.venue}</span>
                  <span>📅 {formatDate(m.startDate || m.date)}</span>
                </div>
                {isReg ? (
                  <button
                    disabled
                    style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "not-allowed" }}
                  >
                    Already Registered
                  </button>
                ) : (
                  <button
                    onClick={() => onRegister(m.id)}
                    style={{ width: "100%", padding: "0.625rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Register as Jockey
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MountsView({ mounts, loading, onViewHorse }: { mounts: any[]; loading: boolean; onViewHorse: (horse: { id: number; name: string }) => void }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>My Mounts</h3>
      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: `rgba(59,130,196,0.08)`, borderBottom: "1px solid #2a2825" }}>
              {["Race ID", "Horse", "Gate", "Weight (kg)", "Status"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>Loading...</td></tr>
            ) : mounts.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontStyle: "italic" }}>No scheduled mounts at the moment.</td></tr>
            ) : mounts.map((m, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#a0a0a0" }}>#{m.raceId}</td>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#f4f2ec" }}>
                  <button
                    type="button"
                    onClick={() => onViewHorse({ id: m.horseId, name: m.horseName || `Horse #${m.horseId}` })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    {m.horseName || `Horse #${m.horseId}`}
                  </button>
                </td>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#c9a227", fontWeight: 700 }}>{m.gateNumber ?? "TBD"}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec" }}>{m.carriedWeight ?? "TBD"} kg</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", background: m.status === "APPROVED" ? "rgba(74,222,128,0.1)" : "rgba(42,40,37,0.5)", color: m.status === "APPROVED" ? "#4ade80" : "#a0a0a0" }}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvitationsView({ invitations, onAccept, onReject, onViewProfile, onViewHorse }: { invitations: any[]; onAccept: (id: number) => void; onReject: (id: number) => void; onViewProfile: (id: number) => void; onViewHorse: (horse: { id: number; name: string }) => void }) {
  const lang = localStorage.getItem("app-lang") || "vi";
  const t = {
    vi: {
      offersTitle: "Lời mời nài ngựa",
      noOffers: "Hiện tại không có lời mời nào dành cho bạn.",
      offerFrom: "Lời mời từ chủ Stable ",
      horse: "Chiến mã",
      race: "Trận đấu",
      meeting: "Ngày đua",
      venue: "Địa điểm",
      startTime: "Khởi tranh",
      status: "Trạng thái",
      accept: "Chấp nhận",
      reject: "Từ chối",
    },
    en: {
      offersTitle: "Pending Ride Offers",
      noOffers: "No pending ride offers currently.",
      offerFrom: "Offer from Stable Owner ",
      horse: "Horse",
      race: "Race ID",
      meeting: "Meeting",
      venue: "Venue",
      startTime: "Start Time",
      status: "Status",
      accept: "Accept Offer",
      reject: "Reject",
    }
  }[lang] || {
    offersTitle: "Pending Ride Offers",
    noOffers: "No pending ride offers currently.",
    offerFrom: "Offer from Stable Owner ",
    horse: "Horse",
    race: "Race ID",
    meeting: "Meeting",
    venue: "Venue",
    startTime: "Start Time",
    status: "Status",
    accept: "Accept Offer",
    reject: "Reject",
  };

  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{t.offersTitle}</h3>
      {invitations.length === 0 ? (
        <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{t.noOffers}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {invitations.map((inv: any) => (
            <div key={inv.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>
                  {t.offerFrom}{" "}
                  <button 
                    type="button" 
                    onClick={() => onViewProfile(inv.ownerId)} 
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    {inv.ownerFullName || inv.ownerName || `#${inv.ownerId}`}
                  </button>
                </h4>
                <p style={{ fontSize: "0.75rem", color: "#f4f2ec", marginTop: "0.5rem" }}>
                  <strong>{t.horse}:</strong>{" "}
                  <button 
                    type="button" 
                    onClick={() => onViewHorse({ id: inv.horseId, name: inv.horseName || `Horse #${inv.horseId}` })} 
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold" }}
                  >
                    {inv.horseName || `#${inv.horseId}`}
                  </button>
                </p>
                {inv.meetingName && (
                  <p style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "0.25rem" }}>
                    🏆 <strong>{inv.meetingName}</strong> ({inv.classLevel})
                  </p>
                )}
                {inv.venue && (
                  <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                    📍 {inv.venue} · 📅 {formatDate(inv.startTime)}
                  </p>
                )}
                <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.25rem" }}>
                  <strong>{t.status}:</strong> {inv.status}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => onAccept(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.accept}</button>
                <button onClick={() => onReject(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "rgba(192,57,43,0.1)", color: "#ef4444", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.reject}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarView({ meetings }: { meetings: any[] }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Race Calendar</h3>
      {meetings.length === 0 ? (
        <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No upcoming race meetings scheduled.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {meetings.map((m: any, i: number) => (
            <div key={i} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue} · 📅 {formatDate(m.startDate || m.date)}</p>
              </div>
              <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: `rgba(59,130,196,0.1)`, color: ROLE_COLOR }}>{m.status ?? "UPCOMING"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ViolationsView({ violations, onAcknowledge }: { violations: any[]; onAcknowledge: (id: number) => void }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Rule Violations</h3>
      {violations.length === 0 ? (
        <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#4ade80", fontFamily: "monospace", fontSize: "0.875rem" }}>✅ No rule violations recorded.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(192,57,43,0.08)", borderBottom: "1px solid #2a2825" }}>
                {["Race", "Date", "Type", "Description", "Penalty", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {violations.map((v: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem" }}>{v.raceName}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.75rem" }}>{v.date}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#ef4444", fontFamily: "monospace", fontSize: "0.75rem" }}>{v.type}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem" }}>{v.description}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#c9a227", fontSize: "0.8rem" }}>{v.penalty}</td>
                  <td style={{ padding: "0.75rem 1rem", color: v.status === "CONFIRMED" ? "#4ade80" : "#f87171", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {v.status === "CONFIRMED" ? "Acknowledged" : "Pending Acknowledgment"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {v.status !== "CONFIRMED" && (
                      <button onClick={() => onAcknowledge(v.id)} style={{ padding: "0.25rem 0.5rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.25rem", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Jockey() {
  const { user } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<{ id: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<JockeyTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as JockeyTab) || "hub";
  });
  const [dashboard, setDashboard] = useState<any>(null);
  const [mounts, setMounts] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stats, mountData, invites, allMeetings, viols] = await Promise.all([
        api.get<any>(`/jockey/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/jockey/${user.id}/mounts`).catch(() => []),
        api.get<any[]>(`/invitations?jockeyId=${user.id}`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>(`/jockey/${user.id}/violations`).catch(() => []),
      ]);
      setDashboard(stats);
      setMounts(mountData);
      setInvitations(Array.isArray(invites) ? invites.filter(i => i.status === "PENDING") : []);
      setMeetings(Array.isArray(allMeetings) ? allMeetings : []);
      setViolations(Array.isArray(viols) ? viols : []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load jockey data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAcceptInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/accept`);
      setSuccessMsg("Invitation accepted and race entry created!");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to accept invitation."); }
  };

  const handleRejectInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/reject`);
      setSuccessMsg("Invitation rejected.");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to reject invitation."); }
  };

  const handleRegisterMeeting = async (meetingId: number) => {
    if (!user) return;
    try {
      await api.post("/registrations/jockey", { meetingId, jockeyId: user.id });
      setSuccessMsg("Successfully registered for meeting!");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to register for meeting."); }
  };

  const handleAcknowledgeViolation = async (violationId: number) => {
    try {
      await api.post(`/jockey/violations/${violationId}/confirm`);
      setSuccessMsg("Violation acknowledged successfully!");
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || "Failed to acknowledge violation."); }
  };

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Jockey Hub";
  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const pendingViolations = violations.filter(v => v.status === "PENDING").length;

  const navItemsWithBadge = NAV_ITEMS.map(n => {
    if (n.view === "invitations") return { ...n, badge: pendingInvitations };
    if (n.view === "violations") return { ...n, badge: pendingViolations };
    return n;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "hub":         return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} />;
      case "mounts":      return <MountsView mounts={mounts} loading={loading} onViewHorse={setSelectedHorse} />;
      case "calendar":    return <CalendarView meetings={meetings} />;
      case "invitations": return <InvitationsView invitations={invitations.filter((i: any) => i.status === "PENDING")} onAccept={handleAcceptInvite} onReject={handleRejectInvite} onViewProfile={setSelectedProfileId} onViewHorse={setSelectedHorse} />;
      case "violations":  return <ViolationsView violations={violations} onAcknowledge={handleAcknowledgeViolation} />;
      case "profile":     return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Jockey" />;
      default:            return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} />;
    }
  };

  return (
    <>
      <DashboardLayout
        roleLabel="Jockey"
        roleColor={ROLE_COLOR}
        activeLabel={activeLabel}
        currentView={activeTab}
        navItems={navItemsWithBadge}
        onViewChange={v => { setActiveTab(v as JockeyTab); setSuccessMsg(""); setErrorMsg(""); }}
        successMsg={successMsg}
        errorMsg={errorMsg}
      >
        {renderContent()}
      </DashboardLayout>
      {selectedProfileId !== null && (
        <ProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
      {selectedHorse !== null && (
        <HorsePerformanceModal horseId={selectedHorse.id} horseName={selectedHorse.name} onClose={() => setSelectedHorse(null)} />
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";

type SpectatorTab = "home" | "racecard" | "results" | "horses" | "stats" | "profile";

const ROLE_COLOR = "#ef4444";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Overview",   view: "home"     },
  { index: "02", icon: "info",             label: "Racecard",   view: "racecard" },
  { index: "03", icon: "award",            label: "Results",    view: "results"  },
  { index: "04", icon: "activity",         label: "Horses",     view: "horses"   },
  { index: "05", icon: "bar-chart-3",      label: "Statistics", view: "stats"    },
  { index: "06", icon: "user-cog",         label: "Profile & 2FA", view: "profile" },
];

export default function Spectator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SpectatorTab>("home");
  const [meetings, setMeetings] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/public/meetings").catch(() => []),
      api.get<any[]>("/public/races").catch(() => []),
      api.get<any[]>("/public/horses").catch(() => []),
    ]).then(([m, r, h]) => {
      setMeetings(Array.isArray(m) ? m : []);
      setRaces(Array.isArray(r) ? r : []);
      setHorses(Array.isArray(h) ? h : []);
    });
  }, []);

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Overview";

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>Welcome to Horse Race Management System</h2>
              <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Select an option from the menu to get started.</p>
            </div>

            {/* Upcoming Meetings */}
            <div>
              <h3 style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.1rem", color: "#c9a227", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #2a2825", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Upcoming Race Meetings</h3>
              {meetings.length === 0
                ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>No upcoming meetings scheduled.</p>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                  {meetings.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", transition: "border-color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.4)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{m.name}</h4>
                        <span style={{ fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", background: "rgba(74,157,111,0.15)", color: "#4a9d6f", whiteSpace: "nowrap" }}>Active</span>
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue}</p>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>📅 {m.startDate || m.date}</p>
                      {m.totalBudget && <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>💰 ${(m.totalBudget).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        );

      case "racecard":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Racecard</h3>
            {races.length === 0
              ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No races available.</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {races.map((r: any, i: number) => (
                  <div key={i} className="rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{r.classLevel ?? `Race #${r.id}`}</h4>
                      <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>{r.distanceMeters}m · {r.trackType} · {r.startTime}</p>
                    </div>
                    <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.25rem", background: r.status === "RUNNING" ? "rgba(239,68,68,0.12)" : r.status === "FINISHED" ? "rgba(74,222,128,0.1)" : "rgba(201,162,39,0.1)", color: r.status === "RUNNING" ? "#ef4444" : r.status === "FINISHED" ? "#4ade80" : "#c9a227" }}>{r.status ?? "SCHEDULED"}</span>
                  </div>
                ))}
              </div>}
          </div>
        );

      case "results":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Race Results</h3>
            <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid #2a2825" }}>
                    {["Race", "Distance", "Track", "Status", "Start Time"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").length === 0
                    ? <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontStyle: "italic" }}>No completed races yet.</td></tr>
                    : races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem", fontWeight: 700 }}>{r.classLevel ?? `Race #${r.id}`}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.75rem" }}>{r.distanceMeters}m</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontSize: "0.75rem" }}>{r.trackType}</td>
                        <td style={{ padding: "0.75rem 1rem" }}><span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>{r.status}</span></td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.7rem" }}>{r.startTime}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "horses":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Horses Directory</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {horses.length === 0
                ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>No horses registered yet.</p>
                : horses.map((h: any) => (
                  <div key={h.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {h.imageUrl
                      ? <img src={h.imageUrl} alt={h.name} style={{ width: "100%", height: "9rem", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "9rem", background: "#0e0c09", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3835", fontFamily: "monospace", fontSize: "0.7rem" }}>NO IMAGE</div>}
                    <div style={{ padding: "0.875rem" }}>
                      <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{h.name}</h4>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{h.breed}</p>
                      <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                        <span style={{ color: "#a0a0a0", fontFamily: "monospace" }}>Rating: <strong style={{ color: "#c9a227" }}>{h.currentRating}</strong></span>
                        <span style={{ color: "#a0a0a0", fontFamily: "monospace" }}>W: {h.totalWins ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "stats":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>Statistics</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Total Meetings", value: meetings.length, color: "#c9a227" },
                { label: "Total Races",    value: races.length,    color: "#ef4444" },
                { label: "Total Horses",   value: horses.length,   color: "#4a9d6f" },
                { label: "Completed Races", value: races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").length, color: "#3b82c4" },
              ].map(s => (
                <div key={s.label} className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", display: "block", marginBottom: "0.25rem" }}>{s.label}</span>
                  <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", textAlign: "center" }}>
              <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>📊 Detailed statistics and charts coming soon.</p>
            </div>
          </div>
        );

      case "profile":
        return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Spectator" />;

      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      roleLabel="Spectator"
      roleColor={ROLE_COLOR}
      activeLabel={activeLabel}
      currentView={activeTab}
      navItems={NAV_ITEMS}
      onViewChange={v => { setActiveTab(v as SpectatorTab); setSuccessMsg(""); setErrorMsg(""); }}
      successMsg={successMsg}
      errorMsg={errorMsg}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

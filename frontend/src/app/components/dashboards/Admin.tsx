import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { api } from "../../../lib/api";
import ProfileTab from "./components/ProfileTab";

// Sub-modules
import Users from "../admin-workflow/Users";
import SystemConfig from "../admin-workflow/SystemConfig";
import Season from "../admin-workflow/Season";
import RaceMeeting from "../admin-workflow/RaceMeeting";
import RaceDaySchedule from "../admin-workflow/RaceDaySchedule";
import RegistrationProcessing from "../admin-workflow/RegistrationProcessing";
import Racecard from "../admin-workflow/Racecard";
import LiveSettings from "../admin-workflow/LiveSettings";
import Race from "../admin-workflow/Race";
import Results from "../admin-workflow/Results";

type AdminTab =
  | "welcome"
  | "season"
  | "race-meeting"
  | "race"
  | "processing"
  | "racecard"
  | "schedule"
  | "results"
  | "users"
  | "config"
  | "live-settings"
  | "profile";

const ROLE_COLOR = "#c9a227";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Dashboard Overview",        view: "welcome"       },
  { index: "02", icon: "layers",           label: "Season Initialization",     view: "season"        },
  { index: "03", icon: "calendar",         label: "Race Meeting Management",   view: "race-meeting"  },
  { index: "04", icon: "flag",             label: "Race Configuration",        view: "race"          },
  { index: "05", icon: "file-check",       label: "Registration Processing",   view: "processing"    },
  { index: "06", icon: "layout",           label: "Racecard Management",       view: "racecard"      },
  { index: "07", icon: "clipboard-list",   label: "Race Day Schedule",         view: "schedule"      },
  { index: "08", icon: "award",            label: "Process Results & Close",   view: "results"       },
  { index: "09", icon: "user-cog",         label: "User & Role Management",    view: "users"         },
  { index: "10", icon: "settings",         label: "System Configuration",      view: "config"        },
  { index: "11", icon: "tv",               label: "Live Setting",              view: "live-settings" },
];

// ─── AdminWelcome Component (matches AdminWelcome.jsp exactly) ────────────────
function AdminWelcome({ onViewChange }: { onViewChange: (view: any) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ seasons: 0, meetings: 0, races: 0, users: 0, pending: 0, activeSeason: "None" });

  useEffect(() => {
    api.get<any>("/admin/stats/overview").then(d => {
      setStats({
        seasons:     d.totalSeasons     ?? 0,
        meetings:    d.totalMeetings    ?? 0,
        races:       d.totalRaces       ?? 0,
        users:       d.totalUsers       ?? 0,
        pending:     d.totalPending     ?? 0,
        activeSeason: d.activeSeasonName ?? "None",
      });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Welcome Header Glass Card ────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(20,24,38,0.7), rgba(11,13,20,0.8))",
        border: "1px solid rgba(201,162,39,0.16)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        borderRadius: "1rem",
        padding: "2rem 2.5rem",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", right: "-5rem", top: "-5rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(201,162,39,0.05)", filter: "blur(3rem)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: "-5rem", bottom: "-5rem", width: "12rem", height: "12rem", borderRadius: "50%", background: "rgba(96,165,250,0.05)", filter: "blur(3rem)", pointerEvents: "none" }} />

        {/* Left: title */}
        <div style={{ flex: 1, minWidth: "16rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c9a227", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.25)" }}>
            👑 ADMINISTRATIVE OVERVIEW
          </span>
          <h1 style={{ fontFamily: "'Roboto Slab', serif", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "0.02em", color: "#f4f2ec", marginTop: "0.75rem" }}>
            Welcome to the Admin Dashboard
          </h1>
          <p style={{ fontSize: "0.8rem", color: "rgba(161,161,170,0.85)", maxWidth: "32rem", lineHeight: 1.7, marginTop: "0.5rem" }}>
            Welcome back, {user?.username ?? "Administrator"}. Use this central management panel to coordinate and run the tournament cycles, configure class rules, manage entries, and publish results.
          </p>
        </div>

        {/* Right: Live System Info */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "1rem", minWidth: "13rem", fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(161,161,170,0.8)", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span>System Status</span>
            <span style={{ color: "#4ade80", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} /> ONLINE
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Active Season:</span>
            <span style={{ color: "#c9a227", fontWeight: 700 }}>{stats.activeSeason}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pending Approvals:</span>
            <span style={{ fontWeight: 700, color: stats.pending > 0 ? "#c9a227" : "rgba(113,113,122,0.8)" }}>{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid (2×2 mobile, 4 desktop) ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Seasons",     value: stats.seasons,  gold: true  },
          { label: "Meetings",    value: stats.meetings, gold: false },
          { label: "Total Races", value: stats.races,    gold: false },
          { label: "Total Users", value: stats.users,    gold: false },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            textAlign: "center",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            cursor: "default",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(201,162,39,0.02)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.25)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLElement).style.transform = "none";
          }}>
            <span style={{ fontSize: "0.55rem", fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(113,113,122,0.8)", display: "block", marginBottom: "0.25rem" }}>{s.label}</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace", color: s.gold ? "#c9a227" : "#f4f2ec" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Quick Navigation ─────────────────────────────── */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#c9a227", paddingLeft: "0.25rem", marginBottom: "1rem" }}>
          System Operations Quick Navigation
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {[
            { icon: "🗂", title: "Season Initialization",     desc: "Initialize tournament seasons, specify date ranges, and configure rating class rules.",               view: "season",        pending: false },
            { icon: "📅", title: "Race Meetings",             desc: "Schedule new race meetings, set track venues, and allocate prize money budgets.",                    view: "race-meeting",  pending: false },
            { icon: "📋", title: "Registration Processing",   desc: "Review, approve, or reject horse registrations, jockey licenses, and race entries.",                view: "processing",    pending: stats.pending > 0 },
            { icon: "⚙️", title: "System Configuration",     desc: "Configure global system variables, settings, and other operational limits.",                        view: "config",        pending: false },
            { icon: "📊", title: "Race Day Scheduling",      desc: "Assign starting gates and jockey-horse weights. Finalize race start times.",                        view: "schedule",      pending: false },
            { icon: "🏁", title: "Racecard & Gate Setup",    desc: "Publish racecards with stall draws, jockey weights, and race specifications.",                      view: "racecard",      pending: false },
            { icon: "🎥", title: "Livestream Settings",      desc: "Configure YouTube live links for race broadcasts and manage live race status.",                       view: "live-settings", pending: false },
            { icon: "👥", title: "User Management",          desc: "View and manage user accounts, roles, and approval status across all roles.",                       view: "users",         pending: false },
          ].map(item => (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                width: "100%",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(201,162,39,0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.35)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 28px rgba(0,0,0,0.5), 0 0 15px rgba(201,162,39,0.05)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              {/* Icon area */}
              <div style={{ padding: "0.625rem", borderRadius: "0.5rem", background: "rgba(39,39,42,0.8)", border: "1px solid rgba(63,63,70,1)", color: "#c9a227", flexShrink: 0, position: "relative", fontSize: "1.125rem" }}>
                {item.icon}
                {item.pending && (
                  <span style={{ position: "absolute", top: "-0.25rem", right: "-0.25rem", width: 10, height: 10, borderRadius: "50%", background: "#c9a227", animation: "pulse 2s infinite" }} />
                )}
              </div>
              {/* Text */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <h4 style={{ fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#e4e4e7" }}>{item.title}</h4>
                <p style={{ fontSize: "0.7rem", color: "rgba(161,161,170,0.75)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as AdminTab) || "welcome";
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Overview";

  const handleViewChange = (view: string) => {
    setActiveTab(view as AdminTab);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "welcome":       return <AdminWelcome onViewChange={setActiveTab} />;
      case "season":        return <Season />;
      case "race-meeting":  return <RaceMeeting />;
      case "race":          return <Race />;
      case "processing":    return <RegistrationProcessing />;
      case "racecard":      return <Racecard />;
      case "schedule":      return <RaceDaySchedule />;
      case "results":       return <Results />;
      case "users":         return <Users />;
      case "config":        return <SystemConfig />;
      case "live-settings": return <LiveSettings />;
      case "profile":       return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Admin" />;
      default:              return <AdminWelcome onViewChange={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout
      roleLabel="Admin"
      roleColor={ROLE_COLOR}
      activeLabel={activeLabel}
      currentView={activeTab}
      navItems={NAV_ITEMS}
      onViewChange={handleViewChange}
      successMsg={successMsg}
      errorMsg={errorMsg}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

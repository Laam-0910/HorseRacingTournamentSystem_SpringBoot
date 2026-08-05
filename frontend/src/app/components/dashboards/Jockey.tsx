import { useState, useEffect } from "react";
import { parseSafeDate, formatDateTime, formatDate } from "../../utils/dateTimeHelper";
import { useAuth } from "../../../context/AuthContext";
import { api, getErrMsg } from "../../../lib/api";
import { $t } from "../../../lib/i18n";
import DashboardLayout from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";
import ProfileModal from "./components/ProfileModal";
import HorsePerformanceModal from "./components/HorsePerformanceModal";
import ViewLive from "./components/ViewLive";
import UserWalletView from "./components/UserWalletView";
import NotificationCenterView from "./components/NotificationCenterView";
import { Pagination } from "../common/Pagination";
import ActionModal, { ActionModalState } from "../common/ActionModal";

type JockeyTab = "hub" | "mounts" | "calendar" | "invitations" | "violations" | "live" | "wallet" | "profile" | "notifications";

const ROLE_COLOR = "#3b82c4";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: $t("Jockey Hub", (localStorage.getItem('app-lang') || 'en')),          view: "hub"         },
  { index: "02", icon: "wallet",           label: $t("Wallet & Transactions", (localStorage.getItem('app-lang') || 'en')), view: "wallet"      },
  { index: "03", icon: "bell",             label: $t("Notifications", (localStorage.getItem('app-lang') || 'en')),     view: "notifications"},
  { index: "04", icon: "flag",             label: $t("My Mounts", (localStorage.getItem('app-lang') || 'en')),           view: "mounts"      },
  { index: "05", icon: "calendar",         label: $t("Race Calendar", (localStorage.getItem('app-lang') || 'en')),       view: "calendar"    },
  { index: "06", icon: "mail",             label: $t("Invitations", (localStorage.getItem('app-lang') || 'en')),         view: "invitations" },
  { index: "07", icon: "alert-triangle",   label: $t("Rule Violations", (localStorage.getItem('app-lang') || 'en')),     view: "violations"  },
  { index: "08", icon: "tv",               label: $t("Live Stream Arena", (localStorage.getItem('app-lang') || 'en')),   view: "live"        },
];


/**
 */
function StatsCard({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.6)", borderColor: "rgba(255,255,255,0.08)", padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0" }}>{label}</p>
      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: color ?? "#f4f2ec" }}>{value ?? 0}</p>
    </div>
  );
}

/**
 */
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? "PENDING";
  let bg = "rgba(195,162,39,0.12)";
  let fg = "#c9a227";
  let bc = "rgba(195,162,39,0.3)";

  if (s === "APPROVED") {
    bg = "rgba(74,222,128,0.12)";
    fg = "#4ade80";
    bc = "rgba(74,222,128,0.3)";
  } else if (s === "ACCEPTED") {
    bg = "rgba(45,212,191,0.12)";
    fg = "#2dd4bf";
    bc = "rgba(45,212,191,0.3)";
  } else if (s === "PENDING_ADMIN") {
    bg = "rgba(245,158,11,0.12)";
    fg = "#f59e0b";
    bc = "rgba(245,158,11,0.3)";
  } else if (s === "REJECTED" || s === "DECLINED" || s === "CANCELLED") {
    bg = "rgba(239,91,91,0.12)";
    fg = "#ef5b5b";
    bc = "rgba(239,91,91,0.3)";
  } else if (s === "ENTRY_REJECTED") {
    bg = "rgba(249,115,22,0.12)";
    fg = "#f97316";
    bc = "rgba(249,115,22,0.3)";
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
      {$t(s, (localStorage.getItem('app-lang') || 'en'))}
    </span>
  );
}

/**
 */
function HubView({ dashboard, meetings, onRegister, user, onSwitchTab, hasUnpaidFine }: { dashboard: any; meetings: any[]; onRegister: (id: number) => void; user: any; onSwitchTab?: (tab: string) => void; hasUnpaidFine?: boolean }) {
  const walletBal = user?.walletBalance !== undefined && user?.walletBalance !== null ? Number(user.walletBalance) : 0;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const totalItems = meetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMeetings = meetings.slice(startIndex, startIndex + pageSize);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
        <StatsCard label="💰 Wallet Balance" value={`${walletBal.toLocaleString('en-US')} VND`} color="#fbbf24" />
        <StatsCard label={$t("Total Rides", (localStorage.getItem('app-lang') || 'en'))}     value={dashboard?.jockeyStats?.totalRaces} />
        <StatsCard label={$t("Wins (1st)", (localStorage.getItem('app-lang') || 'en'))}      value={dashboard?.jockeyStats?.totalWins}   color="#4ade80" />
        <StatsCard label={$t("Top 3 Finishes", (localStorage.getItem('app-lang') || 'en'))}  value={dashboard?.jockeyStats?.top3}   color={ROLE_COLOR} />
        <StatsCard label={$t("Win Rate", (localStorage.getItem('app-lang') || 'en'))}        value={dashboard?.jockeyStats?.winRate ? `${Number(dashboard.jockeyStats.winRate).toFixed(1)}%` : "0.0%"} color="#c9a227" />
      </div>

      {/* Dedicated Wallet & Financial Rules Card */}
      <div className="rounded-xl border p-4" style={{ background: "rgba(251, 191, 36, 0.05)", borderColor: "rgba(251, 191, 36, 0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>💰</span>
            <div>
              <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#fbbf24" }}>Jockey Wallet & Earnings Breakdown</h4>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>Current available balance & automatic financial earnings rules</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>Available Wallet</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fbbf24", fontFamily: "monospace" }}>
                {walletBal.toLocaleString('en-US')} VND
              </div>
            </div>
            {onSwitchTab && (
              <button
                type="button"
                onClick={() => onSwitchTab("wallet")}
                style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.75rem", fontWeight: 700, fontFamily: "monospace", border: "none", cursor: "pointer", transition: "all 0.2s" }}
              >
                💳 Manage Wallet
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", borderTop: "1px solid rgba(251, 191, 36, 0.15)", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>🏆 Prize Money Share:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Jockey receives agreed prize share percentage of place prize money won in official races.</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>🏇 Jockey Hire Fee:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Mount hire fee specified per invitation is credited directly to your wallet upon accepting.</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>🏇 Jockey Hire Fee:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Mount hire fee (500,000 VND) is credited directly to your wallet upon accepting an invitation.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>{$t("Available Race Meetings", (localStorage.getItem('app-lang') || 'en'))}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>{$t("Register for race meetings to make yourself available for stable hire invitations.", (localStorage.getItem('app-lang') || 'en'))}</p>
        {meetings.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>{$t("No upcoming meetings available.", (localStorage.getItem('app-lang') || 'en'))}</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
              {paginatedMeetings.map((m: any) => {
                const isReg = dashboard?.registeredMeetingIds?.includes(m.id);
                const regStatus = dashboard?.regStatuses?.[m.id];
                const isMeetingInactive = m.status === 'INACTIVE' || m.status === 'CANCELLED' || m.status === 'DEACTIVE';
                const isSeasonInactive = m.seasonStatus === 'INACTIVE' || m.seasonStatus === 'CLOSED' || m.seasonStatus === 'CANCELLED' || m.seasonStatus === 'DEACTIVE';
                const isLocked = isMeetingInactive || isSeasonInactive;

                return (
                  <div key={m.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                      {isLocked ? (
                        <StatusBadge status="INACTIVE" />
                      ) : isReg ? (
                        <StatusBadge status={regStatus ?? "APPROVED"} />
                      ) : (
                        <StatusBadge status="UNREGISTERED" />
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span>📍 {m.venue}</span>
                      <span>📅 {formatDate(m.startDate || m.date)}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#34d399", fontFamily: "monospace", background: "rgba(52,211,153,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid rgba(52,211,153,0.2)" }}>
                      🎟️ <strong>Race Meeting Registration Fee:</strong> <span style={{ color: "#4ade80", fontWeight: "bold" }}>FREE (0 VND - Jockey)</span>
                    </div>
                    {isLocked ? (
                      <div style={{ fontSize: "0.65rem", color: "#f87171", fontFamily: "monospace", fontStyle: "italic", background: "rgba(239,68,68,0.1)", padding: "0.6rem 0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.9rem" }}>🔒</span>
                        <span>This Race Meeting or Season is currently deactivated/locked by Admin. Jockey registration is suspended until reactivated by Admin.</span>
                      </div>
                    ) : isReg && regStatus === "REJECTED" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <p style={{ fontSize: "0.65rem", color: "#ef4444", fontFamily: "monospace", fontStyle: "italic" }}>
                          ⚠️ {$t("Your registration for this meeting was rejected. You can re-register again below.", (localStorage.getItem('app-lang') || 'en'))}
                        </p>
                        <button
                          onClick={() => onRegister(m.id)}
                          style={{ width: "100%", padding: "0.625rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                        >
                          🔄 {$t("Register Again as Jockey", (localStorage.getItem('app-lang') || 'en'))}
                        </button>
                      </div>
                    ) : isReg && regStatus === "PENDING" ? (
                      <div style={{ fontSize: "0.65rem", color: "#fbbf24", fontFamily: "monospace", fontStyle: "italic", background: "rgba(251,191,36,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid rgba(251,191,36,0.2)" }}>
                        ⏳ {$t("Registration is pending approval. You cannot register again until reviewed.", (localStorage.getItem('app-lang') || 'en'))}
                      </div>
                    ) : isReg ? (
                      <div style={{ fontSize: "0.65rem", color: "#34d399", fontFamily: "monospace", fontStyle: "italic", background: "rgba(52,211,153,0.08)", padding: "0.4rem 0.6rem", borderRadius: "0.375rem", border: "1px solid rgba(52,211,153,0.2)" }}>
                        ✅ {$t("Registration approved. You are registered for this event.", (localStorage.getItem('app-lang') || 'en'))}
                      </div>
                    ) : hasUnpaidFine ? (
                      <button
                        onClick={() => onSwitchTab && onSwitchTab('violations')}
                        style={{ width: "100%", padding: "0.625rem", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        🔒 Pay Fine First to Register
                      </button>
                    ) : (
                      <button
                        onClick={() => onRegister(m.id)}
                        style={{ width: "100%", padding: "0.625rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                      >{$t("Register as Jockey", (localStorage.getItem('app-lang') || 'en'))}</button>
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
              pageSizeOptions={[3, 6, 12]}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 */
function MountsView({ mounts, loading, onViewHorse }: { mounts: any[]; loading: boolean; onViewHorse: (horse: { id: number; name: string }) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lang = localStorage.getItem("app-lang") || "en";
  const title = $t("My Mounts", (localStorage.getItem('app-lang') || 'en'));
  const loadingText = $t("Loading...", (localStorage.getItem('app-lang') || 'en'));
  const emptyText = $t("No scheduled mounts at the moment.", (localStorage.getItem('app-lang') || 'en'));

  const totalItems = mounts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMounts = mounts.slice(startIndex, startIndex + pageSize);

  if (isMobile) {
    return (
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{title}</h3>
        {loading ? (
          <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem" }}>{loadingText}</p>
        ) : mounts.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>{emptyText}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {paginatedMounts.map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{$t("Race #", (localStorage.getItem('app-lang') || 'en'))}{m.raceId}</span>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#f4f2ec", marginTop: "2px" }}>
                      <button
                        type="button"
                        onClick={() => onViewHorse({ id: m.horseId, name: m.horseName || `Horse #${m.horseId}` })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold", textAlign: "left" }}
                      >
                        {m.horseName || `Horse #${m.horseId}`}
                      </button>
                    </h4>
                  </div>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", background: m.status === "APPROVED" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", color: m.status === "APPROVED" ? "#4ade80" : "#a0a0a0" }}>
                    {m.status}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#f4f2ec", fontFamily: "monospace" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Gate: </span>
                      <span style={{ color: "#c9a227", fontWeight: "bold" }}>{m.gateNumber ?? "TBD"}</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Weight: </span>
                      <span>{m.carriedWeight ?? "TBD"} kg</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewHorse({ id: m.horseId, name: m.horseName || `Horse #${m.horseId}` })}
                    style={{ padding: "0.3rem 0.6rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "#c9a227", fontSize: "0.7rem", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}
                  >
                    📈 {$t("Race History", (localStorage.getItem('app-lang') || 'en'))}
                  </button>
                </div>
              </div>
            ))}
            <Pagination
              currentPage={validPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{title}</h3>
      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: `rgba(59,130,196,0.08)`, borderBottom: "1px solid #2a2825" }}>
              {["Race ID", "Horse", "Gate", "Weight (kg)", "Status", "Race History"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{$t(h, (localStorage.getItem('app-lang') || 'en'))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{loadingText}</td></tr>
            ) : mounts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontStyle: "italic" }}>{emptyText}</td></tr>
            ) : paginatedMounts.map((m, i) => (
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
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", background: m.status === "APPROVED" ? "rgba(74,222,128,0.1)" : "rgba(42,40,37,0.5)", color: m.status === "APPROVED" ? "#4ade80" : "#a0a0a0" }}>{$t(m.status || '', (localStorage.getItem('app-lang') || 'en'))}</span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <button
                    type="button"
                    onClick={() => onViewHorse({ id: m.horseId, name: m.horseName || `Horse #${m.horseId}` })}
                    style={{ padding: "0.35rem 0.75rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "#c9a227", fontSize: "0.7rem", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}
                  >
                    📈 {$t("Race History", (localStorage.getItem('app-lang') || 'en'))}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mounts.length > 0 && (
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        )}
      </div>
    </div>
  );
}

/**
 */
function InvitationsView({ invitations, onAccept, onReject, onViewProfile, onViewHorse, refereesMap, hasUnpaidFine, onGoToViolations }: { 
  invitations: any[]; 
  onAccept: (id: number) => void; 
  onReject: (id: number) => void; 
  onViewProfile: (id: number) => void; 
  onViewHorse: (horse: { id: number; name: string }) => void;
  refereesMap?: Record<number, any[]>;
  hasUnpaidFine?: boolean;
  onGoToViolations?: () => void;
}) {
  const lang = localStorage.getItem("app-lang") || "en";
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const getItemStatus = (inv: any) => {
    if (inv.status === "PENDING") return "PENDING";
    if (inv.status === "REJECTED") return "REJECTED";
    if (inv.status === "ACCEPTED") {
      if (inv.entryStatus) {
        const es = inv.entryStatus.toUpperCase();
        if (es === "REJECTED") return "ENTRY_REJECTED";
        return es;
      }
      return "ACCEPTED";
    }
    return inv.status ? inv.status.toUpperCase() : "OTHER";
  };

  const sortedInvitations = [...invitations].sort((a, b) => {
    const statusA = getItemStatus(a);
    const statusB = getItemStatus(b);
    const isPriA = statusA === "PENDING" || statusA === "PENDING_ADMIN";
    const isPriB = statusB === "PENDING" || statusB === "PENDING_ADMIN";
    if (isPriA && !isPriB) return -1;
    if (!isPriA && isPriB) return 1;
    return (b.id || 0) - (a.id || 0);
  });

  const counts = {
    ALL: sortedInvitations.length,
    PENDING: sortedInvitations.filter(i => getItemStatus(i) === "PENDING").length,
    PENDING_ADMIN: sortedInvitations.filter(i => getItemStatus(i) === "PENDING_ADMIN").length,
    APPROVED: sortedInvitations.filter(i => getItemStatus(i) === "APPROVED" || getItemStatus(i) === "ACCEPTED").length,
    REJECTED: sortedInvitations.filter(i => getItemStatus(i) === "REJECTED" || getItemStatus(i) === "ENTRY_REJECTED").length,
    FINISHED: sortedInvitations.filter(i => getItemStatus(i) === "FINISHED" || getItemStatus(i) === "OFFICIAL").length,
  };

  const filteredList = sortedInvitations.filter((inv: any) => {
    const st = getItemStatus(inv);
    let matchesStatus = true;
    if (filter === "PENDING") matchesStatus = st === "PENDING";
    else if (filter === "PENDING_ADMIN") matchesStatus = st === "PENDING_ADMIN";
    else if (filter === "APPROVED") matchesStatus = st === "APPROVED" || st === "ACCEPTED";
    else if (filter === "REJECTED") matchesStatus = st === "REJECTED" || st === "ENTRY_REJECTED";
    else if (filter === "FINISHED") matchesStatus = st === "FINISHED" || st === "OFFICIAL";

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const meetingMatch = (inv.meetingName || "").toLowerCase().includes(q);
    const ownerMatch = (inv.ownerFullName || inv.ownerName || "").toLowerCase().includes(q);
    const horseMatch = (inv.horseName || "").toLowerCase().includes(q);
    const venueMatch = (inv.venue || "").toLowerCase().includes(q);
    const classMatch = (inv.classLevel || "").toLowerCase().includes(q);
    const idMatch = String(inv.raceId || "").includes(q) || String(inv.id || "").includes(q);

    return meetingMatch || ownerMatch || horseMatch || venueMatch || classMatch || idMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIndex = (pageIndex - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const t = {
    title: $t("Jockey Ride Invitations & Applications", (localStorage.getItem('app-lang') || 'en')),
    subTitle: $t("Manage incoming ride offers from stable owners and track your accepted race registration status.", (localStorage.getItem('app-lang') || 'en')),
    noOffers: lang === "vi" ? "No invitations or entries found matching the selected filter." : "No invitations found matching the selected filter.",
    offerFrom: $t("Offer from Stable Owner ", (localStorage.getItem('app-lang') || 'en')),
    horse: $t("Horse", (localStorage.getItem('app-lang') || 'en')),
    status: $t("Status", (localStorage.getItem('app-lang') || 'en')),
    entryStatus: lang === "vi" ? "Entry Status:" : "Entry Status:",
    accept: $t("Accept Offer", (localStorage.getItem('app-lang') || 'en')),
    reject: $t("Reject", (localStorage.getItem('app-lang') || 'en')),
  };

  const filterTabs = [
    { key: "ALL", label: `All (${counts.ALL})` },
    { key: "PENDING", label: `Pending (${counts.PENDING})` },
    { key: "PENDING_ADMIN", label: `Pending Admin (${counts.PENDING_ADMIN})` },
    { key: "APPROVED", label: `Approved (${counts.APPROVED})` },
    { key: "REJECTED", label: `Rejected (${counts.REJECTED})` },
    { key: "FINISHED", label: `Finished (${counts.FINISHED})` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>{t.title}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>{t.subTitle}</p>
      </div>

      {hasUnpaidFine && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "1rem 1.25rem", borderRadius: "0.85rem", color: "#f87171", fontSize: "12px", fontFamily: "monospace", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "16px" }}>🚨</span>
            <span><strong>UNPAID RULE VIOLATIONS:</strong> You have unpaid rule violation fines. You are restricted from accepting invitations or joining race meetings until all fines are paid.</span>
          </div>
          {onGoToViolations && (
            <button onClick={onGoToViolations} style={{ padding: "0.35rem 0.85rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.4rem", fontWeight: "bold", fontSize: "11px", cursor: "pointer" }}>
              💳 Go to Pay Fines
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", fontWeight: 700 }}>
            {lang === "vi" ? "Filter:" : "Filter:"}
          </span>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              background: "#161513",
              color: "#f4f2ec",
              border: `1px solid ${ROLE_COLOR}`,
              fontSize: "0.75rem",
              fontFamily: "monospace",
              fontWeight: 700,
              cursor: "pointer",
              outline: "none"
            }}
          >
            {filterTabs.map(tab => (
              <option key={tab.key} value={tab.key} style={{ background: "#1a1917", color: "#f4f2ec" }}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ position: "relative", minWidth: "260px", flex: "1", maxWidth: "340px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={$t("Search meeting, owner, horse name...", (localStorage.getItem('app-lang') || 'en'))}
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
          <span style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "#fbbf24", fontSize: "0.85rem", pointerEvents: "none" }}>
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
              style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.75rem" }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {paginatedList.length === 0 ? (
        <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)", padding: "3rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>
          {t.noOffers}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {paginatedList.map((inv: any) => {
            const isPending = inv.status === "PENDING";
            const displayStatus = getItemStatus(inv);
            const hireFeeVal = Number(inv.hireFee ?? 500000);

            return (
              <div key={inv.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {inv.horseAvatar ? (
                          <img src={inv.horseAvatar} alt={inv.horseName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "1.25rem" }}>🐴</span>
                        )}
                      </div>
                      <div>
                        <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", margin: 0, fontSize: "0.95rem" }}>
                          {t.offerFrom}{" "}
                          <button 
                            type="button" 
                            onClick={() => onViewProfile(inv.ownerId)} 
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold" }}
                          >
                            {inv.ownerFullName || inv.ownerName || `#${inv.ownerId}`}
                          </button>
                        </h4>
                        <p style={{ fontSize: "0.8rem", color: "#f4f2ec", margin: "2px 0 0 0" }}>
                          <strong>{t.horse}:</strong>{" "}
                          <button 
                            type="button" 
                            onClick={() => onViewHorse({ id: inv.horseId, name: inv.horseName || `Horse #${inv.horseId}` })} 
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fbbf24", textDecoration: "underline", fontWeight: "bold" }}
                          >
                            {inv.horseName || `#${inv.horseId}`}
                          </button>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={displayStatus} />
                  </div>

                  {inv.meetingName && (
                    <p style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "0.25rem" }}>
                      🏆 <strong>{inv.meetingName}</strong> {inv.classLevel ? `(${inv.classLevel})` : ''}
                    </p>
                  )}
                  {inv.venue && (
                    <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                      📍 {inv.venue} {inv.startTime ? `· 📅 ${formatDate(inv.startTime)}` : ''}
                    </p>
                  )}

                  {refereesMap && refereesMap[inv.raceId] && refereesMap[inv.raceId].length > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#c9a227", fontWeight: 700 }}>⚖️ {$t("Assigned Referee:", (localStorage.getItem('app-lang') || 'en'))}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                        {refereesMap[inv.raceId].map((ref: any) => (
                          <span key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.08)", color: "#f4f2ec" }}>
                            {ref.avatar ? <img src={ref.avatar} alt={ref.fullName || ref.username} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} /> : "👤"}
                            <span style={{ fontWeight: 600, color: "#fbbf24" }}>{ref.fullName || ref.username}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", fontFamily: "monospace" }}>
                    <span style={{ color: "#a0a0a0" }}>{$t("Prize Share Offered:", (localStorage.getItem('app-lang') || 'en'))} <strong style={{ color: "#fbbf24", fontSize: "0.85rem" }}>{inv.jockeyPrizePercentage ?? 20}%</strong></span>
                    <span style={{ color: "#a0a0a0" }}>{$t("Hire Fee:", (localStorage.getItem('app-lang') || 'en'))} <strong style={{ color: "#4ade80", fontSize: "0.85rem" }}>{hireFeeVal.toLocaleString('en-US')} VND</strong></span>
                  </div>
                </div>

                {isPending ? (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {hasUnpaidFine ? (
                      <button onClick={onGoToViolations} style={{ flex: 1, padding: "0.5rem", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                        🔒 Pay Fine First to Accept
                      </button>
                    ) : (
                      <button onClick={() => onAccept(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.accept}</button>
                    )}
                    <button onClick={() => onReject(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "rgba(192,57,43,0.1)", color: "#ef4444", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.reject}</button>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>
                    {inv.status === "ACCEPTED" ? "✓ Accepted mount offer for this race" : "✕ Invitation declined"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredList.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
            {lang === "vi" 
              ? `Showing ${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredList.length)} of ${filteredList.length} results`
              : `Showing ${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredList.length)} of ${filteredList.length} items`}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <button
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                background: pageIndex <= 1 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                color: pageIndex <= 1 ? "rgba(255,255,255,0.2)" : "#f4f2ec",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                cursor: pageIndex <= 1 ? "not-allowed" : "pointer",
                fontWeight: 700
              }}
            >
              ‹ {lang === "vi" ? "Prev" : "Prev"}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "0.375rem",
                  background: p === pageIndex ? ROLE_COLOR : "rgba(255,255,255,0.04)",
                  color: p === pageIndex ? "#fff" : "#a0a0a0",
                  border: p === pageIndex ? `1px solid ${ROLE_COLOR}` : "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {p}
              </button>
            ))}

            <button
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "0.375rem",
                background: pageIndex >= totalPages ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                color: pageIndex >= totalPages ? "rgba(255,255,255,0.2)" : "#f4f2ec",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                cursor: pageIndex >= totalPages ? "not-allowed" : "pointer",
                fontWeight: 700
              }}
            >
              {lang === "vi" ? "Sau" : "Next"} ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 */
function RaceRow({ race, refereesMap }: { race: any; refereesMap?: Record<number, any[]> }) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded && entries.length === 0) {
      setLoading(true);
      api.get<any[]>(`/public/results?raceId=${race.id}`)
        .then(data => {
          const approved = data.filter((e: any) => e.entry?.status && e.entry?.status !== "REJECTED" && e.entry?.status !== "PENDING_ADMIN");
          setEntries(approved);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [expanded, race.id]);

  const assignedReferees = refereesMap?.[race.id] || [];

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "1rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", color: "#3b82c4" }}>{$t("Race #", (localStorage.getItem('app-lang') || 'en'))}{race.id}</span>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>{$t(race.classLevel || "", (localStorage.getItem('app-lang') || 'en'))}</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
            {$t("Time:", (localStorage.getItem('app-lang') || 'en'))} {formatDateTime(race.startTime)} | {$t("Distance:", (localStorage.getItem('app-lang') || 'en'))} {race.distanceMeters}m | {$t("Track:", (localStorage.getItem('app-lang') || 'en'))} {race.trackType}
          </p>
          {assignedReferees.length > 0 && (
            <div style={{ fontSize: "10px", color: "#a0a0a0", fontFamily: "monospace", marginTop: "4px", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ color: "#c9a227", fontWeight: 700 }}>⚖️ {$t("Referee:", (localStorage.getItem('app-lang') || 'en'))}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {assignedReferees.map((ref: any) => (
                  <span key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#fbbf24", fontWeight: 600 }}>
                    {ref.avatar ? <img src={ref.avatar} alt={ref.fullName || ref.username} style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} /> : "👤"}
                    {ref.fullName || ref.username}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <button style={{ background: "none", border: "none", color: "#3b82c4", fontSize: "0.7rem", fontFamily: "monospace", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
          {expanded ? "▲ " + $t("Collapse", (localStorage.getItem('app-lang') || 'en')) : "▼ " + $t("View Entries", (localStorage.getItem('app-lang') || 'en'))}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: "0.75rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.75rem" }}>
          <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>{$t("Approved Race Entries", (localStorage.getItem('app-lang') || 'en'))}</p>
          {loading ? (
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("Loading entries...", (localStorage.getItem('app-lang') || 'en'))}</p>
          ) : entries.length === 0 ? (
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("No approved entries for this race yet.", (localStorage.getItem('app-lang') || 'en'))}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0", textAlign: "left" }}>
                  <th style={{ padding: "0.25rem" }}>{$t("Gate", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Horse", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Jockey", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Owner", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Weight", (localStorage.getItem('app-lang') || 'en'))}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "0.375rem 0.25rem", fontFamily: "monospace", color: "#c9a227", fontWeight: "bold" }}>{e.entry?.gateNumber != null ? `#${e.entry.gateNumber}` : "TBD"}</td>
                    <td style={{ padding: "0.375rem 0.25rem", fontWeight: "bold", color: "#f4f2ec" }}>{e.horse?.name}</td>
                    <td style={{ padding: "0.375rem 0.25rem", color: "rgba(255,255,255,0.8)" }}>{e.jockey?.fullName || e.jockey?.username}</td>
                    <td style={{ padding: "0.375rem 0.25rem", color: "rgba(255,255,255,0.6)" }}>{e.owner?.fullName || e.owner?.username}</td>
                    <td style={{ padding: "0.375rem 0.25rem", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{e.entry?.carriedWeight != null ? `${e.entry.carriedWeight} kg` : "TBD"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/**
 */
function CalendarView({ meetings, allRaces, refereesMap }: { meetings: any[]; allRaces: any[]; refereesMap?: Record<number, any[]> }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalItems = meetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMeetings = meetings.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Race Calendar", (localStorage.getItem('app-lang') || 'en'))}</h3>
      {meetings.length === 0 ? (
        <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("No upcoming race meetings scheduled.", (localStorage.getItem('app-lang') || 'en'))}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {paginatedMeetings.map((m: any, i: number) => {
            const meetingRaces = allRaces.filter(r => r.raceMeetingId === m.id);

            return (
              <div key={i} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                    <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue} · 📅 {formatDate(m.startDate || m.date)}</p>
                  </div>
                  <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: `rgba(59,130,196,0.1)`, color: ROLE_COLOR }}>{ $t(m.status ?? "UPCOMING", (localStorage.getItem('app-lang') || 'en')) }</span>
                </div>

                <div style={{ padding: "0.75rem 1.25rem" }}>
                  {meetingRaces.length === 0 ? (
                    <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", padding: "0.5rem 0" }}>{$t("No races scheduled for this meeting.", (localStorage.getItem('app-lang') || 'en'))}</p>
                  ) : (
                    meetingRaces.map((race: any) => (
                      <RaceRow key={race.id} race={race} refereesMap={refereesMap} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[3, 5, 10]}
          />
        </div>
      )}
    </div>
  );
}

/**
 */
export function ViolationsView({ violations, onAcknowledge, onViewProfile }: { violations: any[]; onAcknowledge: (id: number) => void; onViewProfile?: (id: number) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lang = localStorage.getItem("app-lang") || "en";
  const title = $t("Rule Violations", (localStorage.getItem('app-lang') || 'en'));
  const emptyText = "✅ " + $t("No rule violations recorded.", (localStorage.getItem('app-lang') || 'en'));

  const totalItems = violations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedViolations = violations.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{title}</h3>
      {violations.length === 0 ? (
        <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#4ade80", fontFamily: "monospace", fontSize: "0.875rem" }}>{emptyText}</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {paginatedViolations.map((v: any, i: number) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f4f2ec" }}>{v.raceName}</h4>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", display: "block", marginTop: "2px" }}>📅 {v.date}</span>
                </div>
                <span style={{ fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontWeight: "bold", fontFamily: "monospace" }}>
                  {v.type}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#f4f2ec", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase" }}>Description:</span>
                {v.description}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem" }}>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "10px", fontFamily: "monospace" }}>{$t("Referee:", (localStorage.getItem('app-lang') || 'en'))}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <button
                      type="button"
                      onClick={() => v.refereeId && onViewProfile && onViewProfile(v.refereeId)}
                      style={{ background: "none", border: "none", padding: 0, cursor: v.refereeId ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {v.refereeAvatar ? (
                        <img src={v.refereeAvatar} alt={v.refereeName} style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "11px" }}>⚖️</span>
                      )}
                      <span style={{ color: "#fbbf24", fontWeight: "bold", textDecoration: v.refereeId ? "underline" : "none" }}>{v.refereeName || "System Referee"}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Penalty:", (localStorage.getItem('app-lang') || 'en'))}</span>
                  <div style={{ color: "#c9a227", fontWeight: "bold", marginTop: "2px" }}>{v.penalty}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Status:", (localStorage.getItem('app-lang') || 'en'))}</span>
                <span style={{ color: v.status === "CONFIRMED" ? "#4ade80" : "#f87171", fontWeight: "bold" }}>
                  {v.status === "CONFIRMED" ? $t("Acknowledged", (localStorage.getItem('app-lang') || 'en')) : $t("Pending Acknowledgment", (localStorage.getItem('app-lang') || 'en'))}
                </span>
              </div>
              {v.status !== "CONFIRMED" && (
                <button onClick={() => onAcknowledge(v.id)} style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                  Acknowledge
                </button>
              )}
            </div>
          ))}
          <Pagination
            currentPage={validPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(192,57,43,0.08)", borderBottom: "1px solid #2a2825" }}>
                {["Race", "Date", "Type", "Description", "Referee", "Penalty", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444" }}>{$t(h, lang)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedViolations.map((v: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem" }}>{v.raceName}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.75rem" }}>{v.date}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#ef4444", fontFamily: "monospace", fontSize: "0.75rem" }}>{v.type}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem" }}>{v.description}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <button
                      type="button"
                      onClick={() => v.refereeId && onViewProfile && onViewProfile(v.refereeId)}
                      style={{ background: "none", border: "none", padding: 0, cursor: v.refereeId ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {v.refereeAvatar ? (
                        <img src={v.refereeAvatar} alt={v.refereeName} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(201,162,39,0.3)" }} />
                      ) : (
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,162,39,0.2)", color: "#c9a227", fontSize: "11px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {v.refereeName ? v.refereeName.charAt(0).toUpperCase() : '⚖️'}
                        </div>
                      )}
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fbbf24", textDecoration: v.refereeId ? "underline" : "none" }}>{v.refereeName || "System Referee"}</span>
                    </button>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#c9a227", fontSize: "0.8rem" }}>{v.penalty}</td>
                  <td style={{ padding: "0.75rem 1rem", color: (v.fineStatus === "PAID" || v.status === "CONFIRMED") ? "#4ade80" : "#f87171", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {(v.fineStatus === "PAID" || v.status === "CONFIRMED") ? $t("PAID", (localStorage.getItem('app-lang') || 'en')) : $t("UNPAID", (localStorage.getItem('app-lang') || 'en'))}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {(v.fineStatus !== "PAID" && v.status !== "CONFIRMED") ? (
                      <button onClick={() => onAcknowledge(v.id)} style={{ padding: "0.35rem 0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.35rem", fontSize: "11px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        💳 Pay Fine
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#4ade80", fontFamily: "monospace", fontWeight: "bold" }}>
                        ✅ Fine Paid
                      </span>
                    )}
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
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
/**
 */
export default function Jockey() {
  const { user, setUser } = useAuth();
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
  const [allRaces, setAllRaces] = useState<any[]>([]);
  const [refereesMap, setRefereesMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [actionModal, setActionModal] = useState<ActionModalState>({ isOpen: false, type: "success", title: "", message: "" });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stats, mountData, invites, allMeetings, viols, racesData, refsData, walletRes] = await Promise.all([
        api.get<any>(`/jockey/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/jockey/${user.id}/mounts`).catch(() => []),
        api.get<any[]>(`/invitations?jockeyId=${user.id}`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>(`/jockey/${user.id}/violations`).catch(() => []),
        api.get<any[]>("/public/races").catch(() => []),
        api.get<Record<number, any[]>>("/public/races/referees").catch(() => ({})),
        api.get<any>(`/admin/users/${user.id}/wallet`).catch(() => null),
      ]);
      setDashboard(stats);
      if (walletRes?.walletBalance !== undefined && user) {
        setUser({ ...user, walletBalance: Number(walletRes.walletBalance) });
      }
      setMounts(mountData);
      setInvitations(Array.isArray(invites) ? invites : []);
      setMeetings(Array.isArray(allMeetings) ? allMeetings : []);
      setViolations(Array.isArray(viols) ? viols : []);
      setAllRaces(Array.isArray(racesData) ? racesData : []);
      setRefereesMap(refsData || {});
    } catch (err: any) {
      setErrorMsg(getErrMsg(err, "Failed to load jockey data."));
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
  }, [user]);

  const handleAcceptInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/accept`);
      setSuccessMsg("Invitation accepted and race entry created!");
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Invitation Accepted Successfully!",
        message: "You have accepted this mount invitation! Any conflicting invitations scheduled at the same date & time have been automatically rejected."
      });
      fetchData();
    } catch (err: any) {
      const msg = getErrMsg(err, "Failed to accept invitation.");
      setErrorMsg(msg);
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Failed to Accept Invitation",
        message: msg
      });
    }
  };

  const handleRejectInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/reject`);
      setSuccessMsg("Invitation rejected.");
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Invitation Rejected",
        message: "You have rejected this mount invitation."
      });
      fetchData();
    } catch (err: any) {
      const msg = getErrMsg(err, "Failed to reject invitation.");
      setErrorMsg(msg);
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Failed to Reject Invitation",
        message: msg
      });
    }
  };

  const handleRegisterMeeting = async (meetingId: number) => {
    if (!user) return;
    try {
      await api.post("/registrations/jockey", { meetingId, jockeyId: user.id });
      setSuccessMsg("Successfully registered for meeting!");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to register for meeting.")); }
  };

  const hasUnpaidFine = violations?.some((v: any) => (v.fineStatus === "UNPAID" || !v.fineStatus) && v.status !== "DISMISSED");

  const handleAcknowledgeViolation = async (violationId: number) => {
    try {
      const res = await api.post<any>(`/jockey/violations/${violationId}/pay`);
      setSuccessMsg(res.message || "Violation fine paid successfully!");
      setActionModal({
        isOpen: true,
        type: "success",
        title: "Penalty Fine Paid!",
        message: "Your violation fine has been paid successfully. You are now cleared to accept invitations and participate in race meetings."
      });
      fetchData();
    } catch (err: any) {
      const msg = getErrMsg(err, "Failed to pay violation fine.");
      setErrorMsg(msg);
      setActionModal({
        isOpen: true,
        type: "error",
        title: "Fine Payment Failed",
        message: msg
      });
    }
  };

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Jockey Hub";
  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const pendingViolations = violations.filter(v => (v.fineStatus === "UNPAID" || !v.fineStatus) && v.status !== "DISMISSED").length;

  const navItemsWithBadge = NAV_ITEMS.map(n => {
    if (n.view === "invitations") return { ...n, badge: pendingInvitations };
    if (n.view === "violations") return { ...n, badge: pendingViolations };
    return n;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "hub":         return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} user={user} onSwitchTab={t => setActiveTab(t as JockeyTab)} hasUnpaidFine={hasUnpaidFine} />;
      case "mounts":      return <MountsView mounts={mounts} loading={loading} onViewHorse={setSelectedHorse} />;
      case "calendar":    return <CalendarView meetings={meetings} allRaces={allRaces} refereesMap={refereesMap} />;
      case "invitations": return <InvitationsView invitations={invitations} onAccept={handleAcceptInvite} onReject={handleRejectInvite} onViewProfile={setSelectedProfileId} onViewHorse={setSelectedHorse} refereesMap={refereesMap} hasUnpaidFine={hasUnpaidFine} onGoToViolations={() => setActiveTab("violations")} />;
      case "violations":  return <ViolationsView violations={violations} onAcknowledge={handleAcknowledgeViolation} onViewProfile={setSelectedProfileId} />;
      case "live":        return <ViewLive />;
      case "wallet":      return <UserWalletView user={user} roleLabel="Jockey" roleColor="#3b82c4" />;
      case "notifications": return <NotificationCenterView userId={user?.id} />;
      case "profile":     return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Jockey" />;
      default:            return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} user={user} onSwitchTab={t => setActiveTab(t as JockeyTab)} />;
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
      <ActionModal modal={actionModal} onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))} />
    </>
  );
}

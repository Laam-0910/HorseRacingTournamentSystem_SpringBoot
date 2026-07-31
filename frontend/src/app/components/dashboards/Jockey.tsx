// Import các hook useState và useEffect từ React
import { useState, useEffect } from "react";
// Import các hàm hỗ trợ định dạng ngày tháng
import { parseSafeDate, formatDateTime, formatDate } from "../../utils/dateTimeHelper";
// Import hook useAuth từ ngữ cảnh AuthContext
import { useAuth } from "../../../context/AuthContext";
// Import api client và hàm lấy thông báo lỗi getErrMsg
import { api, getErrMsg } from "../../../lib/api";
// Import hàm đa ngôn ngữ $t
import { $t } from "../../../lib/i18n";
// Import khung bố cục DashboardLayout
import DashboardLayout from "../layout/DashboardLayout";
// Import ProfileTab hiển thị thông tin cá nhân
import ProfileTab from "./components/ProfileTab";
// Import ProfileModal hiển thị popup thông tin người dùng
import ProfileModal from "./components/ProfileModal";
// Import HorsePerformanceModal hiển thị thông số thành tích ngựa
import HorsePerformanceModal from "./components/HorsePerformanceModal";
import ViewLive from "./components/ViewLive";

// Định nghĩa các Tab giao diện khả dụng trong Dashboard của Jockey
type JockeyTab = "hub" | "mounts" | "calendar" | "invitations" | "violations" | "live" | "profile";

// Mã màu xanh đặc trưng làm giao diện chủ đạo cho kỵ sĩ Jockey
const ROLE_COLOR = "#3b82c4";

// Cấu hình các nút điều hướng sidebar dành cho Jockey
const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Jockey Hub",    view: "hub"         },
  { index: "02", icon: "flag",             label: "My Mounts",     view: "mounts"      },
  { index: "03", icon: "calendar",         label: "Race Calendar", view: "calendar"    },
  { index: "04", icon: "mail",             label: "Invitations",   view: "invitations" },
  { index: "05", icon: "alert-triangle",   label: "Rule Violations", view: "violations" },
  { index: "06", icon: "tv",               label: "Live Stream Arena", view: "live" },
];

// ── Sub-views (Các Component hiển thị giao diện con) ──────────────────────────

/**
 * Component StatsCard - Thẻ thống kê số lượng đơn giản
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
 * Component StatusBadge - Huy hiệu hiển thị trạng thái phê duyệt (Đã duyệt, Từ chối, Đang chờ...)
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
      {$t(s, (localStorage.getItem('app-lang') || 'vi'))}
    </span>
  );
}

/**
 * Component HubView - Tab Tổng quan chính của Jockey.
 * Hiển thị số liệu hiệu suất thi đấu cá nhân (số lượt cưỡi, số trận thắng, top 3, tỉ lệ thắng)
 * và danh sách đăng ký tham gia các Ngày hội đua sắp tới.
 */
function HubView({ dashboard, meetings, onRegister, user }: { dashboard: any; meetings: any[]; onRegister: (id: number) => void; user: any }) {
  const walletBal = user?.walletBalance !== undefined && user?.walletBalance !== null ? Number(user.walletBalance) : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Khối Thẻ Thống kê hiệu suất & Ví Tiền */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
        <StatsCard label="💰 Wallet Balance" value={`$${walletBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} color="#fbbf24" />
        <StatsCard label={$t("Total Rides", (localStorage.getItem('app-lang') || 'vi'))}     value={dashboard?.jockeyStats?.totalRaces} />
        <StatsCard label={$t("Wins (1st)", (localStorage.getItem('app-lang') || 'vi'))}      value={dashboard?.jockeyStats?.totalWins}   color="#4ade80" />
        <StatsCard label={$t("Top 3 Finishes", (localStorage.getItem('app-lang') || 'vi'))}  value={dashboard?.jockeyStats?.top3}   color={ROLE_COLOR} />
        <StatsCard label={$t("Win Rate", (localStorage.getItem('app-lang') || 'vi'))}        value={dashboard?.jockeyStats?.winRate ? `${Number(dashboard.jockeyStats.winRate).toFixed(1)}%` : "0.0%"} color="#c9a227" />
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
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>Available Wallet</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fbbf24", fontFamily: "monospace" }}>
              ${walletBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", borderTop: "1px solid rgba(251, 191, 36, 0.15)", paddingTop: "0.75rem" }}>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>🏆 Prize Money Share:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}>Jockey receives <strong>20%</strong> of place prize money (1st: 50%, 2nd: 30%, 3rd: 20%).</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>🏇 Jockey Hire Fee:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}><strong>+$500.00</strong> credited directly to your wallet upon accepting race invitation.</p>
          </div>
          <div style={{ fontSize: "0.75rem" }}>
            <span style={{ color: "#fbbf24", fontWeight: 600 }}>🤝 Referral Bonus:</span>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", marginTop: "2px" }}><strong>5% commission</strong> credited for accepted invitation referrals.</p>
          </div>
        </div>
      </div>

      {/* Danh sách ngày hội đua đang mở đăng ký */}
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>{$t("Available Race Meetings", (localStorage.getItem('app-lang') || 'vi'))}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>{$t("Register for race meetings to make yourself available for stable hire invitations.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {meetings.length === 0 ? (
            <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>{$t("No upcoming meetings available.", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
                {/* Hiển thị nút đăng ký hoặc dòng trạng thái đã đăng ký */}
                {isReg ? (
                  <button
                    disabled
                    style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "not-allowed" }}
                  >
                    {$t("Already Registered", (localStorage.getItem('app-lang') || 'vi'))}
                  </button>
                ) : (
                  <button
                    onClick={() => onRegister(m.id)}
                    style={{ width: "100%", padding: "0.625rem", background: ROLE_COLOR, color: "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >{$t("Register as Jockey", (localStorage.getItem('app-lang') || 'vi'))}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Component MountsView - Quản lý hiển thị lịch trình các lượt cưỡi ngựa của Jockey.
 * Hiển thị mã lượt đua, chiến mã sẽ điều khiển, số cổng xuất phát và cân nặng mang theo.
 */
function MountsView({ mounts, loading, onViewHorse }: { mounts: any[]; loading: boolean; onViewHorse: (horse: { id: number; name: string }) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lang = localStorage.getItem("app-lang") || "vi";
  const title = $t("My Mounts", (localStorage.getItem('app-lang') || 'vi'));
  const loadingText = $t("Loading...", (localStorage.getItem('app-lang') || 'vi'));
  const emptyText = $t("No scheduled mounts at the moment.", (localStorage.getItem('app-lang') || 'vi'));

  // Hiển thị bố cục dạng thẻ (card) trên Mobile
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
            {mounts.map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{$t("Race #", (localStorage.getItem('app-lang') || 'vi'))}{m.raceId}</span>
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
                    📈 {$t("Lịch sử đua", (localStorage.getItem('app-lang') || 'vi'))}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Hiển thị bố cục dạng Bảng (table) trên màn hình lớn Desktop
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{title}</h3>
      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: `rgba(59,130,196,0.08)`, borderBottom: "1px solid #2a2825" }}>
              {["Race ID", "Horse", "Gate", "Weight (kg)", "Status", "Race History"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{loadingText}</td></tr>
            ) : mounts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontStyle: "italic" }}>{emptyText}</td></tr>
            ) : mounts.map((m, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", color: "#a0a0a0" }}>#{m.raceId}</td>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#f4f2ec" }}>
                  {/* Click mở modal thông tin chi tiết của Horse */}
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
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.6rem", fontFamily: "monospace", fontWeight: 700, textTransform: "uppercase", background: m.status === "APPROVED" ? "rgba(74,222,128,0.1)" : "rgba(42,40,37,0.5)", color: m.status === "APPROVED" ? "#4ade80" : "#a0a0a0" }}>{$t(m.status || '', (localStorage.getItem('app-lang') || 'vi'))}</span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <button
                    type="button"
                    onClick={() => onViewHorse({ id: m.horseId, name: m.horseName || `Horse #${m.horseId}` })}
                    style={{ padding: "0.35rem 0.75rem", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.375rem", color: "#c9a227", fontSize: "0.7rem", fontFamily: "monospace", cursor: "pointer", fontWeight: 700 }}
                  >
                    📈 {$t("Lịch sử đua", (localStorage.getItem('app-lang') || 'vi'))}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Component InvitationsView - Danh sách các Lời mời thuê nài ngựa từ phía các Chủ chuồng.
 * Hỗ trợ Jockey chấp nhận (Accept) hoặc từ chối (Reject) các lời mời này.
 */
function InvitationsView({ invitations, onAccept, onReject, onViewProfile, onViewHorse, refereesMap }: { 
  invitations: any[]; 
  onAccept: (id: number) => void; 
  onReject: (id: number) => void; 
  onViewProfile: (id: number) => void; 
  onViewHorse: (horse: { id: number; name: string }) => void;
  refereesMap?: Record<number, any[]>;
}) {
  const lang = localStorage.getItem("app-lang") || "vi";
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Helper xác định trạng thái thực tế của bản ghi
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

  // Tính số lượng từng trạng thái
  const counts = {
    ALL: invitations.length,
    PENDING: invitations.filter(i => getItemStatus(i) === "PENDING").length,
    PENDING_ADMIN: invitations.filter(i => getItemStatus(i) === "PENDING_ADMIN").length,
    APPROVED: invitations.filter(i => getItemStatus(i) === "APPROVED" || getItemStatus(i) === "ACCEPTED").length,
    REJECTED: invitations.filter(i => getItemStatus(i) === "REJECTED" || getItemStatus(i) === "ENTRY_REJECTED").length,
    FINISHED: invitations.filter(i => getItemStatus(i) === "FINISHED" || getItemStatus(i) === "OFFICIAL").length,
  };

  // Filter dữ liệu theo trạng thái và từ khóa tìm kiếm (tên giải đấu, chủ ngựa, tên ngựa, venue...)
  const filteredList = invitations.filter((inv: any) => {
    // 1. Kiểm tra bộ lọc trạng thái
    const st = getItemStatus(inv);
    let matchesStatus = true;
    if (filter === "PENDING") matchesStatus = st === "PENDING";
    else if (filter === "PENDING_ADMIN") matchesStatus = st === "PENDING_ADMIN";
    else if (filter === "APPROVED") matchesStatus = st === "APPROVED" || st === "ACCEPTED";
    else if (filter === "REJECTED") matchesStatus = st === "REJECTED" || st === "ENTRY_REJECTED";
    else if (filter === "FINISHED") matchesStatus = st === "FINISHED" || st === "OFFICIAL";

    if (!matchesStatus) return false;

    // 2. Kiểm tra tìm kiếm theo từ khóa
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

  // Phân trang
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIndex = (pageIndex - 1) * pageSize;
  const paginatedList = filteredList.slice(startIndex, startIndex + pageSize);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const t = {
    title: $t("Jockey Ride Invitations & Applications", (localStorage.getItem('app-lang') || 'vi')),
    subTitle: $t("Manage incoming ride offers from stable owners and track your accepted race registration status.", (localStorage.getItem('app-lang') || 'vi')),
    noOffers: lang === "vi" ? "Không tìm thấy lời mời hoặc đơn đăng ký phù hợp với bộ lọc." : "No invitations found matching the selected filter.",
    offerFrom: $t("Offer from Stable Owner ", (localStorage.getItem('app-lang') || 'vi')),
    horse: $t("Horse", (localStorage.getItem('app-lang') || 'vi')),
    status: $t("Status", (localStorage.getItem('app-lang') || 'vi')),
    entryStatus: lang === "vi" ? "Trạng thái đơn:" : "Entry Status:",
    accept: $t("Accept Offer", (localStorage.getItem('app-lang') || 'vi')),
    reject: $t("Reject", (localStorage.getItem('app-lang') || 'vi')),
  };

  const filterTabs = [
    { key: "ALL", label: lang === "vi" ? `Tất cả (${counts.ALL})` : `All (${counts.ALL})` },
    { key: "PENDING", label: lang === "vi" ? `Lời mời đang chờ (${counts.PENDING})` : `Pending (${counts.PENDING})` },
    { key: "PENDING_ADMIN", label: lang === "vi" ? `Chờ Admin duyệt (${counts.PENDING_ADMIN})` : `Pending Admin (${counts.PENDING_ADMIN})` },
    { key: "APPROVED", label: lang === "vi" ? `Đã duyệt (${counts.APPROVED})` : `Approved (${counts.APPROVED})` },
    { key: "REJECTED", label: lang === "vi" ? `Từ chối (${counts.REJECTED})` : `Rejected (${counts.REJECTED})` },
    { key: "FINISHED", label: lang === "vi" ? `Đã đua xong (${counts.FINISHED})` : `Finished (${counts.FINISHED})` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>{t.title}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>{t.subTitle}</p>
      </div>

      {/* Thanh tìm kiếm và Bộ lọc trạng thái (Search & Filter Bar) */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.75rem" }}>
        {/* Bộ lọc trạng thái trỏ xuống (Dropdown Filter) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", fontWeight: 700 }}>
            {lang === "vi" ? "Bộ lọc:" : "Filter:"}
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

        {/* Ô tìm kiếm tên giải đấu (Spring Grand Prix 2026...), tên chủ ngựa, tên ngựa */}
        <div style={{ position: "relative", minWidth: "260px", flex: "1", maxWidth: "340px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={$t("Search meeting, owner, horse name...", (localStorage.getItem('app-lang') || 'vi'))}
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
                        {/* Tên chủ chuồng click để xem Profile */}
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
                        {/* Ngựa được mời điều khiển click để xem chi tiết thông số */}
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

                  {/* Trọng tài phân công cho trận đua */}
                  {refereesMap && refereesMap[inv.raceId] && refereesMap[inv.raceId].length > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#c9a227", fontWeight: 700 }}>⚖️ {$t("Assigned Referee:", (localStorage.getItem('app-lang') || 'vi'))}</span>
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

                  <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem" }}>
                    <span style={{ color: "#a0a0a0" }}>Invitation: <strong style={{ color: "#f4f2ec" }}>{inv.status}</strong></span>
                    {inv.status === "ACCEPTED" && inv.entryStatus && (
                      <span style={{ color: "#a0a0a0" }}>{t.entryStatus} <StatusBadge status={inv.entryStatus} /></span>
                    )}
                  </div>
                </div>

                {/* Nút chấp nhận hoặc từ chối lời mời nếu đang ở trạng thái PENDING */}
                {isPending ? (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => onAccept(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.accept}</button>
                    <button onClick={() => onReject(inv.id)} style={{ flex: 1, padding: "0.5rem", background: "rgba(192,57,43,0.1)", color: "#ef4444", border: "1px solid rgba(192,57,43,0.2)", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{t.reject}</button>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>
                    {inv.status === "ACCEPTED" ? "✓ Accepted mount offer for this race" : "✕ Invitation declined"}
                  </div>
                )}
                {inv.venue && (
                  <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                    📍 {inv.venue} · 📅 {formatDate(inv.startTime)}
                  </p>
                )}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(251,191,36,0.2)" }}>
                    🤝 <strong>Jockey Hire Fee:</strong> ${Number(inv.hireFee || 500).toLocaleString('en-US')}
                  </div>
                  {inv.commissionAmount && (
                    <div style={{ fontSize: "0.75rem", color: "#4ade80", fontFamily: "monospace", background: "rgba(16,185,129,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(16,185,129,0.2)" }}>
                      💰 <strong>Invitation Commission:</strong> ${Number(inv.commissionAmount).toLocaleString('en-US')} ({inv.commissionRate || 5}%)
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.25rem" }}>
                  <strong>{t.status}:</strong> {inv.status}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Thanh phân trang (Pagination controls) */}
      {filteredList.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
            {lang === "vi" 
              ? `Hiển thị ${startIndex + 1} - ${Math.min(startIndex + pageSize, filteredList.length)} trong tổng số ${filteredList.length} kết quả`
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
              ‹ {lang === "vi" ? "Trước" : "Prev"}
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
 * Component hiển thị thông tin từng dòng cuộc đua (RaceRow) để hiển thị danh sách ngựa đã duyệt
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
          // Hiển thị các lượt đăng ký hợp lệ (APPROVED, RUNNING, FINISHED, STOPPED, OFFICIAL)
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
            <span style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", color: "#3b82c4" }}>{$t("Race #", (localStorage.getItem('app-lang') || 'vi'))}{race.id}</span>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>{$t(race.classLevel || "", (localStorage.getItem('app-lang') || 'vi'))}</span>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
            {$t("Time:", (localStorage.getItem('app-lang') || 'vi'))} {formatDateTime(race.startTime)} | {$t("Distance:", (localStorage.getItem('app-lang') || 'vi'))} {race.distanceMeters}m | {$t("Track:", (localStorage.getItem('app-lang') || 'vi'))} {race.trackType}
          </p>
          {assignedReferees.length > 0 && (
            <div style={{ fontSize: "10px", color: "#a0a0a0", fontFamily: "monospace", marginTop: "4px", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ color: "#c9a227", fontWeight: 700 }}>⚖️ {$t("Referee:", (localStorage.getItem('app-lang') || 'vi'))}</span>
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
          {expanded ? "▲ " + $t("Collapse", (localStorage.getItem('app-lang') || 'vi')) : "▼ " + $t("View Entries", (localStorage.getItem('app-lang') || 'vi'))}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: "0.75rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.75rem" }}>
          <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>{$t("Approved Race Entries", (localStorage.getItem('app-lang') || 'vi'))}</p>
          {loading ? (
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("Loading entries...", (localStorage.getItem('app-lang') || 'vi'))}</p>
          ) : entries.length === 0 ? (
            <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("No approved entries for this race yet.", (localStorage.getItem('app-lang') || 'vi'))}</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0", textAlign: "left" }}>
                  <th style={{ padding: "0.25rem" }}>{$t("Gate", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Horse", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Jockey", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Owner", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th style={{ padding: "0.25rem" }}>{$t("Weight", (localStorage.getItem('app-lang') || 'vi'))}</th>
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
 * Component CalendarView - Biểu diễn lịch thi đấu công khai cho Jockey theo dõi
 */
function CalendarView({ meetings, allRaces, refereesMap }: { meetings: any[]; allRaces: any[]; refereesMap?: Record<number, any[]> }) {
  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Race Calendar", (localStorage.getItem('app-lang') || 'vi'))}</h3>
      {meetings.length === 0 ? (
        <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{$t("No upcoming race meetings scheduled.", (localStorage.getItem('app-lang') || 'vi'))}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {meetings.map((m: any, i: number) => {
            const meetingRaces = allRaces.filter(r => r.raceMeetingId === m.id);

            return (
              <div key={i} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                {/* Tiêu đề Ngày hội đua */}
                <div style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec" }}>{m.name}</h4>
                    <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue} · 📅 {formatDate(m.startDate || m.date)}</p>
                  </div>
                  <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: `rgba(59,130,196,0.1)`, color: ROLE_COLOR }}>{ $t(m.status ?? "UPCOMING", (localStorage.getItem('app-lang') || 'vi')) }</span>
                </div>

                {/* Danh sách các cuộc đua thuộc Ngày hội đua đó */}
                <div style={{ padding: "0.75rem 1.25rem" }}>
                  {meetingRaces.length === 0 ? (
                    <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", padding: "0.5rem 0" }}>{$t("No races scheduled for this meeting.", (localStorage.getItem('app-lang') || 'vi'))}</p>
                  ) : (
                    meetingRaces.map((race: any) => (
                      <RaceRow key={race.id} race={race} refereesMap={refereesMap} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Component ViolationsView - Khung quản lý hồ sơ vi phạm luật thi đấu của kỵ sĩ do trọng tài báo cáo.
 * Yêu cầu Jockey bấm "Acknowledge" (Xác nhận lỗi) để hoàn tất quy trình vi phạm.
 */
function ViolationsView({ violations, onAcknowledge, onViewProfile }: { violations: any[]; onAcknowledge: (id: number) => void; onViewProfile?: (id: number) => void }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lang = localStorage.getItem("app-lang") || "vi";
  const title = $t("Rule Violations", (localStorage.getItem('app-lang') || 'vi'));
  const emptyText = "✅ " + $t("No rule violations recorded.", (localStorage.getItem('app-lang') || 'vi'));

  return (
    <div>
      <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{title}</h3>
      {violations.length === 0 ? (
        <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#4ade80", fontFamily: "monospace", fontSize: "0.875rem" }}>{emptyText}</p>
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {violations.map((v: any, i: number) => (
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
                  <span style={{ color: "rgba(255,255,255,0.4)", display: "block", fontSize: "10px", fontFamily: "monospace" }}>{$t("Referee:", (localStorage.getItem('app-lang') || 'vi'))}</span>
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
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Penalty:", (localStorage.getItem('app-lang') || 'vi'))}</span>
                  <div style={{ color: "#c9a227", fontWeight: "bold", marginTop: "2px" }}>{v.penalty}</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Status:", (localStorage.getItem('app-lang') || 'vi'))}</span>
                <span style={{ color: v.status === "CONFIRMED" ? "#4ade80" : "#f87171", fontWeight: "bold" }}>
                  {v.status === "CONFIRMED" ? $t("Acknowledged", (localStorage.getItem('app-lang') || 'vi')) : $t("Pending Acknowledgment", (localStorage.getItem('app-lang') || 'vi'))}
                </span>
              </div>
              {v.status !== "CONFIRMED" && (
                <button onClick={() => onAcknowledge(v.id)} style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>
                  Acknowledge
                </button>
              )}
            </div>
          ))}
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
              {violations.map((v: any, i: number) => (
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
                  <td style={{ padding: "0.75rem 1rem", color: v.status === "CONFIRMED" ? "#4ade80" : "#f87171", fontFamily: "monospace", fontSize: "0.75rem" }}>
                    {v.status === "CONFIRMED" ? $t("Acknowledged", (localStorage.getItem('app-lang') || 'vi')) : $t("Pending Acknowledgment", (localStorage.getItem('app-lang') || 'vi'))}
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
/**
 * Component Jockey - Bảng điều khiển chính của Nài Ngựa (Jockey).
 * Quản lý lịch trình cưỡi ngựa, chấp nhận/từ chối lời mời từ các chủ ngựa,
 * xác nhận vi phạm luật thi đấu và cập nhật thông tin kỵ sĩ cá nhân.
 */
export default function Jockey() {
  const { user } = useAuth();
  // State quản lý Modal xem hồ sơ cá nhân và Modal xem chỉ số ngựa
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedHorse, setSelectedHorse] = useState<{ id: number; name: string } | null>(null);
  
  // Tab đang hoạt động, mặc định là "hub"
  const [activeTab, setActiveTab] = useState<JockeyTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as JockeyTab) || "hub";
  });
  
  // Các state lưu trữ dữ liệu API
  const [dashboard, setDashboard] = useState<any>(null);      // Chỉ số hiệu suất tổng hợp
  const [mounts, setMounts] = useState<any[]>([]);            // Lịch trình các lượt cưỡi ngựa
  const [invitations, setInvitations] = useState<any[]>([]);  // Lời mời đang chờ từ chủ ngựa
  const [meetings, setMeetings] = useState<any[]>([]);        // Thông tin các ngày hội đua
  const [violations, setViolations] = useState<any[]>([]);    // Sự cố vi phạm luật bị ghi nhận
  const [allRaces, setAllRaces] = useState<any[]>([]);        // Lịch đua chung hệ thống
  const [refereesMap, setRefereesMap] = useState<Record<number, any[]>>({}); // Trọng tài được phân công
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Tải đồng bộ dữ liệu của Jockey từ API backend
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [stats, mountData, invites, allMeetings, viols, racesData, refsData] = await Promise.all([
        api.get<any>(`/jockey/${user.id}/dashboard`).catch(() => null),
        api.get<any[]>(`/jockey/${user.id}/mounts`).catch(() => []),
        api.get<any[]>(`/invitations?jockeyId=${user.id}`).catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>(`/jockey/${user.id}/violations`).catch(() => []),
        api.get<any[]>("/public/races").catch(() => []),
        api.get<Record<number, any[]>>("/public/races/referees").catch(() => ({})),
      ]);
      setDashboard(stats);
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

  // Hàm xử lý chấp thuận lời mời thuê cưỡi ngựa từ Chủ ngựa
  const handleAcceptInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/accept`);
      setSuccessMsg("Invitation accepted and race entry created!");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to accept invitation.")); }
  };

  // Hàm xử lý từ chối lời mời thuê cưỡi ngựa
  const handleRejectInvite = async (id: number) => {
    try {
      await api.post(`/invitations/${id}/reject`);
      setSuccessMsg("Invitation rejected.");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to reject invitation.")); }
  };

  // Đăng ký tham gia Ngày hội đua đua ngựa
  const handleRegisterMeeting = async (meetingId: number) => {
    if (!user) return;
    try {
      await api.post("/registrations/jockey", { meetingId, jockeyId: user.id });
      setSuccessMsg("Successfully registered for meeting!");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to register for meeting.")); }
  };

  // Xác nhận lỗi vi phạm quy chế thi đấu do Trọng tài ghi nhận
  const handleAcknowledgeViolation = async (violationId: number) => {
    try {
      await api.post(`/jockey/violations/${violationId}/confirm`);
      setSuccessMsg("Violation acknowledged successfully!");
      fetchData();
    } catch (err: any) { setErrorMsg(getErrMsg(err, "Failed to acknowledge violation.")); }
  };

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Jockey Hub";
  const pendingInvitations = invitations.filter(i => i.status === "PENDING").length;
  const pendingViolations = violations.filter(v => v.status === "PENDING").length;

  // Lồng ghép thêm badge đếm số lượng thông báo đang chờ ở các mục sidebar tương ứng
  const navItemsWithBadge = NAV_ITEMS.map(n => {
    if (n.view === "invitations") return { ...n, badge: pendingInvitations };
    if (n.view === "violations") return { ...n, badge: pendingViolations };
    return n;
  });

  const renderContent = () => {
    switch (activeTab) {
      case "hub":         return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} user={user} />;
      case "mounts":      return <MountsView mounts={mounts} loading={loading} onViewHorse={setSelectedHorse} />;
      case "calendar":    return <CalendarView meetings={meetings} allRaces={allRaces} refereesMap={refereesMap} />;
      case "invitations": return <InvitationsView invitations={invitations} onAccept={handleAcceptInvite} onReject={handleRejectInvite} onViewProfile={setSelectedProfileId} onViewHorse={setSelectedHorse} refereesMap={refereesMap} />;
      case "violations":  return <ViolationsView violations={violations} onAcknowledge={handleAcknowledgeViolation} onViewProfile={setSelectedProfileId} />;
      case "live":        return <ViewLive />;
      case "profile":     return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Jockey" />;
      default:            return <HubView dashboard={dashboard} meetings={meetings} onRegister={handleRegisterMeeting} user={user} />;
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
      
      {/* Các Modal phụ trợ xem thông tin Profile hoặc Ngựa */}
      {selectedProfileId !== null && (
        <ProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
      {selectedHorse !== null && (
        <HorsePerformanceModal horseId={selectedHorse.id} horseName={selectedHorse.name} onClose={() => setSelectedHorse(null)} />
      )}
    </>
  );
}

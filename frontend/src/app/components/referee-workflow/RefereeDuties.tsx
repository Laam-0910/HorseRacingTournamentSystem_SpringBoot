import { $t } from '@/lib/i18n';
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { formatDateTime, formatClassLevel } from "../../utils/dateTimeHelper";
import { Pagination } from "../common/Pagination";

// Bản dịch Anh hóa nhãn hiển thị cho từng trạng thái trận đấu
const statusLabels: Record<string, string> = {
  SCHEDULED:          "Scheduled",
  DECLARATION_OPEN:   "Declaration Open",
  DECLARATION_CLOSED: "Declaration Closed",
  RACE_ASSIGNED:      "Race Assigned",
  RUNNING:            "Running",
  FINISHED:           "Finished",
  OFFICIAL:           "Official",
  STEWARDS_INQUIRY:   "Stewards Inquiry",
  CANCELLED:          "Cancelled"
};

/**
 * Hàm sinh nhãn trạng thái (Status Badge) được định dạng kiểu CSS & phối màu tùy biến theo trạng thái cuộc đua
 */
function statusBadge(status: string) {
  const s = (status ?? "").toUpperCase();
  
  // Định nghĩa màu nền, màu chữ và nội dung nhãn dịch cho mỗi trạng thái
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.SCHEDULED },
    DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_OPEN },
    DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_CLOSED },
    RACE_ASSIGNED:      { bg: "rgba(139,92,246,0.1)",  color: "#a08cf6", label: statusLabels.RACE_ASSIGNED },
    RUNNING:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.RUNNING },
    FINISHED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.FINISHED },
    OFFICIAL:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.OFFICIAL },
    STEWARDS_INQUIRY:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.STEWARDS_INQUIRY },
    CANCELLED:          { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.CANCELLED },
  };
  const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "#a0a0a0", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
}

// Từ điển tiếng Anh bổ trợ dịch giao diện
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    refereeSchedule: "Referee Schedule",
    scheduleSub: "List of upcoming and past races where you are assigned as a steward.",
    scheduleHeader: "Schedule",
    meetingVenue: "Meeting & Venue",
    raceDetails: "Race & Details",
    status: "Status",
    loadingSchedule: "Loading schedule...",
    noDuties: "No duties assigned to your schedule."
  }
};

/**
 * Component RefereeDuties - Lịch làm việc/phân công nhiệm vụ của Trọng tài.
 * Liệt kê toàn bộ các cuộc đua (races) mà trọng tài hiện tại được Ban tổ chức (Admin)
 * chỉ định giám sát trong mùa giải.
 */
export default function RefereeDuties() {
  const { user } = useAuth();
  // State lưu danh sách cuộc đua được phân công giám sát
  const [schedule, setSchedule] = useState<any[]>([]);
  // Trạng thái chờ khi gọi API
  const [loading, setLoading] = useState(true);
  // Trạng thái Responsive Mobile
  const [isMobile, setIsMobile] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const t = TRANSLATIONS.en;

  // Lắng nghe thay đổi kích thước màn hình để tự động điều chỉnh bố cục UI
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gọi API lấy thông tin phân công của Trọng tài dựa trên mã user ID
  useEffect(() => {
    if (!user) return;
    api.get<any>(`/referee/${user.id}/dashboard`)
      .then(res => setSchedule(res.assignedRaces || []))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
      {/* Khối tiêu đề */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{$t("Lịch trình trọng tài", (localStorage.getItem('app-lang') || 'en'))}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>
          {$t("Danh sách các cuộc đua sắp diễn ra và đã diễn ra mà bạn được phân công làm trọng tài.", (localStorage.getItem('app-lang') || 'en'))}
        </p>
      </div>

      {/* Hiển thị giao diện danh sách thẻ (card) trên Mobile */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
          {loading ? (
            <p style={{ color: "#a0a0a0", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>{$t("Đang tải lịch trình...", (localStorage.getItem('app-lang') || 'en'))}</p>
          ) : schedule.length === 0 ? (
            <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem", textAlign: "center", padding: "1rem" }}>{$t("Không có nhiệm vụ nào được phân công cho lịch trình của bạn.", (localStorage.getItem('app-lang') || 'en'))}</p>
          ) : schedule.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item: any, i: number) => {
            const race    = item.race    ?? item;
            const meeting = item.meeting ?? {};
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.9rem" }}>
                      {meeting.name ?? item.meetingName ?? "—"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "2px" }}>
                      📍 {meeting.venue ?? item.venue ?? "—"}
                    </div>
                  </div>
                  {statusBadge(race.status ?? item.status)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                  📅 {formatDateTime(race.startTime ?? item.startTime) || "—"}
                </div>
                <div style={{ paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8rem", color: "#f4f2ec" }}>
                  <span style={{ fontWeight: 600 }}>Race #{race.id ?? item.raceId}</span>
                  <span style={{ color: "#a0a0a0", fontFamily: "monospace", marginLeft: "0.5rem" }}>
                    {formatClassLevel(race.classLevel)} · {race.distanceMeters}m · {race.trackType}
                  </span>
                </div>
              </div>
            );
          })}
          {!loading && schedule.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={schedule.length}
              pageSize={pageSize}
              onPageChange={(p: number) => setCurrentPage(p)}
              onPageSizeChange={(s: number) => { setPageSize(s); setCurrentPage(1); }}
            />
          )}
        </div>
      ) : (
        /* Hiển thị giao diện dạng Bảng (table) trên Desktop */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {[$t("Lịch trình", (localStorage.getItem('app-lang') || 'en')), $t("Giải đua & Địa điểm", (localStorage.getItem('app-lang') || 'en')), $t("Trận đấu & Chi tiết", (localStorage.getItem('app-lang') || 'en')), $t("Trạng thái", (localStorage.getItem('app-lang') || 'en'))].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{$t("Đang tải lịch trình...", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
              ) : schedule.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {$t("Không có nhiệm vụ nào được phân công cho lịch trình của bạn.", (localStorage.getItem('app-lang') || 'en'))}
                  </td>
                </tr>
              ) : schedule.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item: any, i: number) => {
                const race    = item.race    ?? item;
                const meeting = item.meeting ?? {};
                return (
                  <tr key={i}
                    style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    {/* Cột 1: Thời gian bắt đầu trận đấu */}
                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#f4f2ec" }}>
                      {formatDateTime(race.startTime ?? item.startTime) || "—"}
                    </td>
                    {/* Cột 2: Giải hội đua & địa danh diễn ra */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{meeting.name ?? item.meetingName ?? "—"}</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                        📍 {meeting.venue ?? item.venue ?? "—"}
                      </div>
                    </td>
                    {/* Cột 3: Mã cuộc đua và chi tiết thể loại */}
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>Race #{race.id ?? item.raceId}</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                        {formatClassLevel(race.classLevel)} · {race.distanceMeters}m · {race.trackType}
                      </div>
                    </td>
                    {/* Cột 4: Badge trạng thái cuộc đua */}
                    <td style={{ padding: "1rem" }}>{statusBadge(race.status ?? item.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && schedule.length > 0 && (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Pagination
                currentPage={currentPage}
                totalItems={schedule.length}
                pageSize={pageSize}
                onPageChange={(p: number) => setCurrentPage(p)}
                onPageSizeChange={(s: number) => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

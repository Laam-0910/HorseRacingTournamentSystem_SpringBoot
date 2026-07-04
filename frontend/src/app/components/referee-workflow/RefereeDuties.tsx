import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

const statusLabels: Record<string, Record<string, string>> = {
  SCHEDULED:          { vi: "Lịch trình", en: "Scheduled", zh: "已排程", ja: "予定" },
  DECLARATION_OPEN:   { vi: "Mở đăng ký", en: "Declaration Open", zh: "开启报名", ja: "登録受付中" },
  DECLARATION_CLOSED: { vi: "Đóng đăng ký", en: "Declaration Closed", zh: "截止报名", ja: "登録終了" },
  RACE_ASSIGNED:      { vi: "Đã phân công", en: "Race Assigned", zh: "已分派", ja: "担当決定" },
  RUNNING:            { vi: "Đang diễn ra", en: "Running", zh: "进行中", ja: "進行中" },
  FINISHED:           { vi: "Đã kết thúc", en: "Finished", zh: "已结束", ja: "終了" },
  OFFICIAL:           { vi: "Chính thức", en: "Official", zh: "官方确认", ja: "確定" },
  STEWARDS_INQUIRY:   { vi: "Trọng tài xem xét", en: "Stewards Inquiry", zh: "裁判审查", ja: "審判調査中" },
  CANCELLED:          { vi: "Đã hủy", en: "Cancelled", zh: "已取消", ja: "中止" }
};

function statusBadge(status: string) {
  const s = (status ?? "").toUpperCase();
  const lang = localStorage.getItem("app-lang") || "vi";
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.SCHEDULED[lang] || statusLabels.SCHEDULED.vi },
    DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_OPEN[lang] || statusLabels.DECLARATION_OPEN.vi },
    DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_CLOSED[lang] || statusLabels.DECLARATION_CLOSED.vi },
    RACE_ASSIGNED:      { bg: "rgba(139,92,246,0.1)",  color: "#a08cf6", label: statusLabels.RACE_ASSIGNED[lang] || statusLabels.RACE_ASSIGNED.vi },
    RUNNING:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.RUNNING[lang] || statusLabels.RUNNING.vi },
    FINISHED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.FINISHED[lang] || statusLabels.FINISHED.vi },
    OFFICIAL:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.OFFICIAL[lang] || statusLabels.OFFICIAL.vi },
    STEWARDS_INQUIRY:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.STEWARDS_INQUIRY[lang] || statusLabels.STEWARDS_INQUIRY.vi },
    CANCELLED:          { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.CANCELLED[lang] || statusLabels.CANCELLED.vi },
  };
  const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "#a0a0a0", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
      {c.label}
    </span>
  );
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  vi: {
    refereeSchedule: "Lịch trình trọng tài",
    scheduleSub: "Danh sách các cuộc đua sắp diễn ra và đã diễn ra mà bạn được phân công làm trọng tài.",
    scheduleHeader: "Lịch trình",
    meetingVenue: "Giải đua & Địa điểm",
    raceDetails: "Trận đấu & Chi tiết",
    status: "Trạng thái",
    loadingSchedule: "Đang tải lịch trình...",
    noDuties: "Không có nhiệm vụ nào được phân công cho lịch trình của bạn."
  },
  en: {
    refereeSchedule: "Referee Schedule",
    scheduleSub: "List of upcoming and past races where you are assigned as a steward.",
    scheduleHeader: "Schedule",
    meetingVenue: "Meeting & Venue",
    raceDetails: "Race & Details",
    status: "Status",
    loadingSchedule: "Loading schedule...",
    noDuties: "No duties assigned to your schedule."
  },
  ja: {
    refereeSchedule: "審判スケジュール",
    scheduleSub: "あなたが審判員として割り当てられている、今後および過去のレースの一覧。",
    scheduleHeader: "スケジュール",
    meetingVenue: "開催日と会場",
    raceDetails: "レースと詳細",
    status: "ステータス",
    loadingSchedule: "スケジュールを読み込み中...",
    noDuties: "スケジュールに割り当てられた任務はありません。"
  },
  zh: {
    refereeSchedule: "裁判日程表",
    scheduleSub: "指派您担任裁判的未来和历史赛事列表。",
    scheduleHeader: "日程",
    meetingVenue: "赛事与场地",
    raceDetails: "比赛与详情",
    status: "状态",
    loadingSchedule: "正在加载日程表...",
    noDuties: "您的日程表中没有指派...职责。"
  }
};

export default function RefereeDuties() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  useEffect(() => {
    if (!user) return;
    api.get<any>(`/referee/${user.id}/dashboard`)
      .then(res => setSchedule(res.assignedRaces || []))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{t.refereeSchedule}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>
          {t.scheduleSub}
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {[t.scheduleHeader, t.meetingVenue, t.raceDetails, t.status].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{t.loadingSchedule}</td></tr>
            ) : schedule.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>
                  {t.noDuties}
                </td>
              </tr>
            ) : schedule.map((item: any, i: number) => {
              const race    = item.race    ?? item;
              const meeting = item.meeting ?? {};
              return (
                <tr key={i}
                  style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#f4f2ec" }}>
                    {race.startTime ?? item.startTime ?? "—"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{meeting.name ?? item.meetingName ?? "—"}</div>
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                      📍 {meeting.venue ?? item.venue ?? "—"}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>Race #{race.id ?? item.raceId}</div>
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                      {race.classLevel} · {race.distanceMeters}m · {race.trackType}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>{statusBadge(race.status ?? item.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

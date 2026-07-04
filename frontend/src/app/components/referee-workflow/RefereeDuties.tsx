import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

export default function RefereeDuties() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const lang = localStorage.getItem("app-lang") || "vi";

  const t: Record<string, any> = {
    vi: {
      title: "Lịch phân công nhiệm vụ",
      sub: "Danh sách các trận đấu sắp tới và đã qua mà bạn được phân công làm trọng tài giám sát.",
      loading: "Đang tải lịch trình...",
      noDuties: "Hiện tại không có lịch phân công nhiệm vụ nào cho bạn.",
      hSchedule: "Thời gian",
      hMeeting: "Ngày hội & Địa điểm",
      hRace: "ID Trận & Chi tiết",
      hStatus: "Trạng thái",
      statusLabels: {
        SCHEDULED: "Đã lên lịch",
        DECLARATION_OPEN: "Mở khai báo",
        DECLARATION_CLOSED: "Đóng khai báo",
        RACE_ASSIGNED: "Đã phân công",
        RUNNING: "Đang diễn ra",
        FINISHED: "Hoàn thành",
        OFFICIAL: "Kết quả chính thức",
        STEWARDS_INQUIRY: "Đang thanh tra"
      }
    },
    en: {
      title: "Referee Schedule",
      sub: "List of upcoming and past races where you are assigned as a steward.",
      loading: "Loading schedule...",
      noDuties: "No duties assigned to your schedule.",
      hSchedule: "Schedule",
      hMeeting: "Meeting & Venue",
      hRace: "Race ID & Details",
      hStatus: "Status",
      statusLabels: {
        SCHEDULED: "Scheduled",
        DECLARATION_OPEN: "Declaration Open",
        DECLARATION_CLOSED: "Declaration Closed",
        RACE_ASSIGNED: "Race Assigned",
        RUNNING: "Running",
        FINISHED: "Finished",
        OFFICIAL: "Official",
        STEWARDS_INQUIRY: "Stewards Inquiry"
      }
    }
  }[lang] || {
    title: "Referee Schedule",
    sub: "List of upcoming and past races where you are assigned as a steward.",
    loading: "Loading schedule...",
    noDuties: "No duties assigned to your schedule.",
    hSchedule: "Schedule",
    hMeeting: "Meeting & Venue",
    hRace: "Race ID & Details",
    hStatus: "Status",
    statusLabels: {
      SCHEDULED: "Scheduled",
      DECLARATION_OPEN: "Declaration Open",
      DECLARATION_CLOSED: "Declaration Closed",
      RACE_ASSIGNED: "Race Assigned",
      RUNNING: "Running",
      FINISHED: "Finished",
      OFFICIAL: "Official",
      STEWARDS_INQUIRY: "Stewards Inquiry"
    }
  };

  function statusBadge(status: string) {
    const s = (status ?? "").toUpperCase();
    const label = t.statusLabels[s] || status;
    const cfg: Record<string, { bg: string; color: string }> = {
      SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa" },
      DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa" },
      DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa" },
      RACE_ASSIGNED:      { bg: "rgba(139,92,246,0.1)",  color: "#a08cf6" },
      RUNNING:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308" },
      FINISHED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80" },
      OFFICIAL:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80" },
      STEWARDS_INQUIRY:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444" },
    };
    const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "#a0a0a0" };
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
        {label}
      </span>
    );
  }

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
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{t.title}</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>
          {t.sub}
        </p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {[t.hSchedule, t.hMeeting, t.hRace, t.hStatus].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{t.loading}</td></tr>
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


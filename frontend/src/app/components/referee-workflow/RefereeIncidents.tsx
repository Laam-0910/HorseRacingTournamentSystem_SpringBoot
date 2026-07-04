import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

export default function RefereeIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Steward report modal state
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

  const lang = localStorage.getItem("app-lang") || "vi";
  const t: Record<string, any> = {
    vi: {
      title: "Nhật ký sự cố cuộc đua",
      sub: "Danh sách lịch sử các vi phạm quy tắc và hình phạt đã được bạn ghi nhận.",
      loading: "Đang tải dữ liệu...",
      noViolations: "Bạn chưa ghi nhận vi phạm nào.",
      hId: "ID",
      hRace: "Trận đấu & Ngày hội đua",
      hHorse: "Chiến mã",
      hJockey: "Nài ngựa",
      hDetails: "Chi tiết vi phạm",
      hPenalty: "Hình phạt áp dụng",
      hReport: "Báo cáo cuộc đua",
      viewReport: "Xem báo cáo",
      close: "Đóng",
      stewardReportTitle: "📄 Báo cáo giám sát chính thức",
    },
    en: {
      title: "Steward Incident Log",
      sub: "Historical list of rule violations and penalties issued by you.",
      loading: "Loading incidents...",
      noViolations: "No violations logged by you yet.",
      hId: "ID",
      hRace: "Race & Meeting",
      hHorse: "Horse",
      hJockey: "Jockey",
      hDetails: "Violation Details",
      hPenalty: "Assessed Penalty",
      hReport: "Steward Report",
      viewReport: "View Report",
      close: "Close",
      stewardReportTitle: "📄 Steward's Official Report",
    }
  }[lang] || {
    title: "Steward Incident Log",
    sub: "Historical list of rule violations and penalties issued by you.",
    loading: "Loading incidents...",
    noViolations: "No violations logged by you yet.",
    hId: "ID",
    hRace: "Race & Meeting",
    hHorse: "Horse",
    hJockey: "Jockey",
    hDetails: "Violation Details",
    hPenalty: "Assessed Penalty",
    hReport: "Steward Report",
    viewReport: "View Report",
    close: "Close",
    stewardReportTitle: "📄 Steward's Official Report",
  };

  useEffect(() => {
    if (!user) return;
    api.get<any>(`/referee/${user.id}/dashboard`)
      .then(res => {
        const allViolations: any[] = [];
        (res.assignedRaces || []).forEach((race: any) => {
          (race.violations || []).forEach((viol: any) => {
            allViolations.push({
              violation: viol,
              meetingName: race.meetingName,
              raceId: race.id,
              classLevel: race.classLevel,
              horseName: viol.horseName,
              jockeyName: viol.jockeyName,
              stewardReport: race.stewardReport
            });
          });
        });
        setIncidents(allViolations);
      })
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{t.title}</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{t.sub}</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {[t.hId, t.hRace, t.hHorse, t.hJockey, t.hDetails, t.hPenalty, t.hReport].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{t.loading}</td></tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "2rem" }}>🛡️</span>
                      <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>{t.noViolations}</span>
                    </div>
                  </td>
                </tr>
              ) : incidents.map((item: any) => (
                <tr key={item.violation?.id ?? item.id}
                  style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.875rem", color: "#f4f2ec" }}>#{item.violation?.id ?? item.id}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{item.meetingName}</div>
                    <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>
                      Race #{item.raceId} · {item.classLevel}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{item.horseName}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#a0a0a0" }}>{item.jockeyName}</td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#f4f2ec", maxWidth: "16rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={item.violation?.description}>
                    {item.violation?.description ?? item.description}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: 700, color: "#ef4444", fontFamily: "monospace" }}>
                    {item.violation?.penalty ?? item.penalty}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {item.stewardReport ? (
                      <button
                        onClick={() => { setSelectedReport(item.stewardReport); setSelectedRaceId(item.raceId); }}
                        style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}
                      >
                        📄 {t.viewReport}
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "#666", fontFamily: "monospace" }}>N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Steward Report Modal */}
      {selectedReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} className="flex items-center justify-center">
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {t.stewardReportTitle}
              </h3>
              <button onClick={() => setSelectedReport(null)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#a0a0a0", marginBottom: "0.5rem" }}>Race ID: #{selectedRaceId}</p>
              <div style={{ fontSize: "13px", color: "#fff", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                {selectedReport}
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedReport(null)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

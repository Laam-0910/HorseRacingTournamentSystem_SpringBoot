import { $t } from '@/lib/i18n';
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  vi: {
    stewardIncidentLog: "Nhật ký sự cố cuộc đua",
    incidentSub: "Danh sách lịch sử các vi phạm quy tắc và hình phạt đã được bạn ghi nhận.",
    id: "ID",
    raceMeeting: "Trận đấu & Ngày hội đua",
    horse: "Chiến mã",
    jockey: "Nài ngựa",
    violationDetails: "Chi tiết vi phạm",
    assessedPenalty: "Hình phạt áp dụng",
    loadingIncidents: "Đang tải dữ liệu...",
    noViolations: "Bạn chưa ghi nhận vi phạm nào.",
    hReport: "Báo cáo cuộc đua",
    viewReport: "Xem báo cáo",
    close: "Đóng",
    stewardReportTitle: "📄 Báo cáo giám sát chính thức",
  },
  en: {
    stewardIncidentLog: "Steward Incident Log",
    incidentSub: "Historical list of rule violations and penalties issued by you.",
    id: "ID",
    raceMeeting: "Race & Meeting",
    horse: "Horse",
    jockey: "Jockey",
    violationDetails: "Violation Details",
    assessedPenalty: "Assessed Penalty",
    loadingIncidents: "Loading incidents...",
    noViolations: "No violations logged by you yet.",
    hReport: "Steward Report",
    viewReport: "View Report",
    close: "Close",
    stewardReportTitle: "📄 Steward's Official Report",
  },
  ja: {
    stewardIncidentLog: "審判インシデントログ",
    incidentSub: "あなたが発行したルール違反およびペナルティの履歴リスト。",
    id: "ID",
    raceMeeting: "レースと開催",
    horse: "競走馬",
    jockey: "騎手",
    violationDetails: "違反詳細",
    assessedPenalty: "適用されたペナルティ",
    loadingIncidents: "インシデントを読み込み中...",
    noViolations: "あなたが記録した違反はまだありません。",
    hReport: "報告書",
    viewReport: "報告書を表示",
    close: "閉じる",
    stewardReportTitle: "📄 審判公式報告書",
  },
  zh: {
    stewardIncidentLog: "裁判事件日志",
    incidentSub: "您所记录的违反规则行为及处罚的历史列表。",
    id: "ID",
    raceMeeting: "比赛与赛事",
    horse: "马匹",
    jockey: "骑师",
    violationDetails: "违规详情",
    assessedPenalty: "所处处罚",
    loadingIncidents: "正在加载事件...",
    noViolations: "您尚未记录 any 违规行为。",
    hReport: "裁判报告",
    viewReport: "查看报告",
    close: "关闭",
    stewardReportTitle: "📄 裁判官方报告",
  }
};

export default function RefereeIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Steward report modal state
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{$t("Nhật ký sự cố cuộc đua", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{$t("Danh sách lịch sử các vi phạm quy tắc và hình phạt đã được bạn ghi nhận.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        {/* Table / Cards content */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <p style={{ color: "#a0a0a0", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>{$t("Đang tải dữ liệu...", (localStorage.getItem('app-lang') || 'vi'))}</p>
            ) : incidents.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "2rem" }}>
                <span style={{ fontSize: "2rem" }}>🛡️</span>
                <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>{$t("Bạn chưa ghi nhận vi phạm nào.", (localStorage.getItem('app-lang') || 'vi'))}</span>
              </div>
            ) : (
              incidents.map((item: any) => (
                <div key={item.violation?.id ?? item.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>#{item.violation?.id ?? item.id}</span>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#f4f2ec", marginTop: "2px" }}>
                        {item.meetingName}
                      </h4>
                      <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginTop: "2px" }}>
                        Race #{item.raceId} · {item.classLevel}
                      </span>
                    </div>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontFamily: "monospace" }}>
                      {item.violation?.penalty ?? item.penalty}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#f4f2ec", display: "flex", flexWrap: "wrap", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Chiến mã", (localStorage.getItem('app-lang') || 'vi'))}: </span>
                      <strong>{item.horseName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Nài ngựa", (localStorage.getItem('app-lang') || 'vi'))}: </span>
                      <span style={{ color: "#fbbf24" }}>{item.jockeyName}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#a0a0a0", background: "rgba(255,255,255,0.01)", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <strong>{$t("Chi tiết vi phạm", (localStorage.getItem('app-lang') || 'vi'))}: </strong>
                    {item.violation?.description ?? item.description}
                  </div>
                  {item.stewardReport && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                      <button
                        onClick={() => { setSelectedReport(item.stewardReport); setSelectedRaceId(item.raceId); }}
                        style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}
                      >
                        📄 {$t("Xem báo cáo", (localStorage.getItem('app-lang') || 'vi'))}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {[$t("ID", (localStorage.getItem('app-lang') || 'vi')), $t("Trận đấu & Ngày hội đua", (localStorage.getItem('app-lang') || 'vi')), $t("Chiến mã", (localStorage.getItem('app-lang') || 'vi')), $t("Nài ngựa", (localStorage.getItem('app-lang') || 'vi')), $t("Chi tiết vi phạm", (localStorage.getItem('app-lang') || 'vi')), $t("Hình phạt áp dụng", (localStorage.getItem('app-lang') || 'vi')), $t("Báo cáo cuộc đua", (localStorage.getItem('app-lang') || 'vi'))].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{$t("Đang tải dữ liệu...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "3rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "2rem" }}>🛡️</span>
                        <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>{$t("Bạn chưa ghi nhận vi phạm nào.", (localStorage.getItem('app-lang') || 'vi'))}</span>
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
                          📄 {$t("Xem báo cáo", (localStorage.getItem('app-lang') || 'vi'))}
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
        )}
      </div>

      {/* Steward Report Modal */}
      {selectedReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} className="flex items-center justify-center">
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden", margin: "auto" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {$t("📄 Báo cáo giám sát chính thức", (localStorage.getItem('app-lang') || 'vi'))}
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
              <button onClick={() => setSelectedReport(null)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Đóng", (localStorage.getItem('app-lang') || 'vi'))}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { Pagination } from "../common/Pagination";

/**
 * Component RefereeIncidents - Steward Incident Log for Referees.
 */
export default function RefereeIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);

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
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>Steward Incident Log</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>Historical list of rule violations and penalties issued by you.</p>
        </div>

        {/* Content */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <p style={{ color: "#a0a0a0", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "2rem" }}>
                <span style={{ fontSize: "2rem" }}>🛡️</span>
                <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>No violations logged by you yet.</span>
              </div>
            ) : (
              incidents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item: any) => (
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
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Horse: </span>
                      <strong>{item.horseName}</strong>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Jockey: </span>
                      <span style={{ color: "#fbbf24" }}>{item.jockeyName}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#a0a0a0", background: "rgba(255,255,255,0.01)", padding: "0.625rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <strong>Violation Details: </strong>
                    {item.violation?.description ?? item.description}
                  </div>
                  {item.stewardReport && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                      <button
                        onClick={() => { setSelectedReport(item.stewardReport); setSelectedRaceId(item.raceId); }}
                        style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}
                      >
                        📄 View Report
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {!loading && incidents.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={incidents.length}
                pageSize={pageSize}
                onPageChange={(p: number) => setCurrentPage(p)}
                onPageSizeChange={(s: number) => { setPageSize(s); setCurrentPage(1); }}
              />
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["ID", "Race & Meeting", "Horse", "Jockey", "Violation Details", "Assessed Penalty", "Steward Report"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>Loading incidents...</td></tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "3rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "2rem" }}>🛡️</span>
                        <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>No violations logged by you yet.</span>
                      </div>
                    </td>
                  </tr>
                ) : incidents.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item: any) => (
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
                          📄 View Report
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "#666", fontFamily: "monospace" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && incidents.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={incidents.length}
                  pageSize={pageSize}
                  onPageChange={(p: number) => setCurrentPage(p)}
                  onPageSizeChange={(s: number) => { setPageSize(s); setCurrentPage(1); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steward Report Modal */}
      {selectedReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }} className="flex items-center justify-center">
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden", margin: "auto" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📄 Steward's Official Report
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
              <button onClick={() => setSelectedReport(null)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

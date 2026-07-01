import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

export default function RefereeIncidents() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
              jockeyName: viol.jockeyName
            });
          });
        });
        setIncidents(allViolations);
      })
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>Steward Incident Log</h3>
        <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>Historical list of rule violations and penalties issued by you.</p>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["ID", "Race & Meeting", "Horse", "Jockey", "Violation Details", "Assessed Penalty"].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>Loading incidents...</td></tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "2rem" }}>🛡️</span>
                    <span style={{ color: "#4ade80", fontSize: "0.875rem", fontFamily: "monospace" }}>No violations logged by you yet.</span>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

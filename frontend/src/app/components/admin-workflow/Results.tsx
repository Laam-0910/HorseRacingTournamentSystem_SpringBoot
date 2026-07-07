import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface Meeting {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  totalBudget: number;
}

interface Race {
  id: number;
  raceMeetingId: number;
  startTime: string;
  purse: number;
  status: string;
  classLevel: string;
  distanceMeters: number;
}

interface ClassRule {
  id: number;
  classLevel: string;
  className: string;
  minRating: number;
  maxRating?: number;
  minPrize: number;
  maxPrize: number;
}

interface RaceEntry {
  entryId: number;
  gateNumber: number;
  carriedWeight: number;
  handicapWeight: number;
  status: string;
  horseName: string;
  jockeyName: string;
  jockeyWeight: number;
}

export default function Results() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [classRules, setClassRules] = useState<ClassRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Processing mode
  const [processingRace, setProcessingRace] = useState<Race | null>(null);
  const [entries, setEntries] = useState<RaceEntry[]>([]);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, string>>({});
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({});
  const [stewardReport, setStewardReport] = useState("");
  const [procLoading, setProcLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, racesData, rulesData] = await Promise.all([
        api.get<Meeting[]>("/public/meetings").catch(() => []),
        api.get<Race[]>("/races").catch(() => []),
        // Fetch rules for season 1 or active season, let's fallback to get first season rules or default empty
        api.get<ClassRule[]>("/races/seasons/1/rules").catch(() => []),
      ]);
      setMeetings(meetingsData);
      // Filter races to process (only show races that have run/finished/inquiry; filter out pre-race and official/cancelled statuses)
      const ineligibleStatuses = ["SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED", "RACE_ASSIGNED", "OFFICIAL", "CANCELLED"];
      setRaces((racesData || []).filter(r => !ineligibleStatuses.includes(r.status)));
      setClassRules(rulesData);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartProcess = async (race: Race) => {
    setError("");
    setSuccess("");
    setProcLoading(true);
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${race.id}`);
      const mapped = (data || []).map(d => ({
        entryId: d.entry?.id,
        gateNumber: d.entry?.gateNumber,
        carriedWeight: d.entry?.carriedWeight || 0,
        handicapWeight: d.entry?.handicapWeight || 0,
        status: d.entry?.status || "APPROVED",
        horseName: d.horse?.name || "Unknown",
        jockeyName: d.jockey?.username || "Unknown",
        jockeyWeight: d.jockey?.weight || 0,
      }));
      setEntries(mapped);
      setProcessingRace(race);
      setStewardReport("");

      // Initialize values
      const initialPos: Record<number, string> = {};
      const initialTimes: Record<number, string> = {};
      const initialWeights: Record<number, string> = {};
      mapped.forEach(e => {
        initialPos[e.entryId] = "";
        initialTimes[e.entryId] = "";
        // Default weighIn weight matches carried weight
        initialWeights[e.entryId] = e.carriedWeight.toString();
      });
      setPositions(initialPos);
      setTimes(initialTimes);
      setWeighInWeights(initialWeights);
    } catch (err: any) {
      setError("Failed to load race entries: " + err.message);
    } finally {
      setProcLoading(false);
    }
  };

  const handleConfirmResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingRace) return;
    setError("");
    setSuccess("");
    setProcLoading(true);

    try {
      const resultsPayload = entries.map(e => {
        const pos = parseInt(positions[e.entryId]);
        const time = times[e.entryId];
        const wIn = parseFloat(weighInWeights[e.entryId]);

        if (isNaN(pos) || pos <= 0) {
          throw new Error(`Invalid position for horse ${e.horseName}`);
        }
        const isVi = (localStorage.getItem("app-lang") || "vi") === "vi";
        if (!time) {
          throw new Error(`Finish time is required for horse ${e.horseName}`);
        }
        if (e.status !== "DISQUALIFIED" && !/^\d+:\d+(\.\d+)?$/.test(time.trim())) {
          throw new Error(isVi 
            ? `Thời gian của ngựa "${e.horseName}" phải nhập đúng định dạng phút:giây (ví dụ 1:48.35 hoặc 1:48), không được nhập số thường hay có dấu phẩy.`
            : `Finishing time for horse "${e.horseName}" must be in the format MM:SS or MM:SS.ms (e.g. 1:48.35 or 1:48).`);
        }
        if (isNaN(wIn) || wIn <= 0) {
          throw new Error(`Invalid weigh-in weight for horse ${e.horseName}`);
        }

        return {
          entryId: e.entryId,
          finalPosition: pos,
          finishTime: time,
          weighInWeight: wIn,
        };
      });

      const res = await api.post<any>("/results/confirm", {
        raceId: processingRace.id,
        stewardReport,
        results: resultsPayload,
      });

      if (res.success) {
        setSuccess("Results successfully processed and race is closed.");
        setProcessingRace(null);
        fetchData();
      } else {
        throw new Error(res.error || "Failed to process results.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit results.");
    } finally {
      setProcLoading(false);
    }
  };

  if (processingRace) {
    return (
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.1)" }}>
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>Process Results: Race #{processingRace.id} ({processingRace.classLevel})</h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Enter final position, finish times, and weigh-in weights for each horse.</p>
          </div>
          <button onClick={() => setProcessingRace(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <form onSubmit={handleConfirmResults} style={{ padding: "1.5rem" }}>
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px", marginBottom: "1rem" }}>{error}</div>}

          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                  {["Gate", "Horse Name", "Jockey Name", "Carried Wt", "Weigh-In Wt (kg)", "Final Position", "Finish Time"].map(h => (
                    <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.entryId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem", fontSize: "12px", fontFamily: "monospace", color: "#c9a227" }}>{e.gateNumber}</td>
                    <td style={{ padding: "0.75rem", fontSize: "12px", color: "#f4f2ec", fontWeight: "bold" }}>{e.horseName}</td>
                    <td style={{ padding: "0.75rem", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{e.jockeyName}</td>
                    <td style={{ padding: "0.75rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{e.carriedWeight} kg</td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <input type="number" step="0.1" value={weighInWeights[e.entryId] || ""} onChange={val => setWeighInWeights(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <input type="number" min="1" value={positions[e.entryId] || ""} onChange={val => setPositions(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <input type="text" placeholder="e.g. 1:12.45" value={times[e.entryId] || ""} onChange={val => setTimes(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Steward Report / Notes</label>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} placeholder="Enter details of any race incidents, track conditions, or steward decisions..." style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "12px", height: "5rem", resize: "none", outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setProcessingRace(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={procLoading} style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: procLoading ? "not-allowed" : "pointer" }}>
              {procLoading ? "Processing..." : "Verify & Confirm Results"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Process Results */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)" }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>Process Results & Close Races</h3>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Select a Race Meeting and process the outcomes of scheduled races.</p>
        </div>

        {error && <div style={{ margin: "1rem 1.5rem 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px" }}>{error}</div>}
        {success && <div style={{ margin: "1rem 1.5rem 0", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px" }}>{success}</div>}

        {/* Meetings */}
        <div style={{ padding: "1.5rem" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>Race Meetings List</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                  {["Meeting Name", "Venue", "Total Budget"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
                ) : meetings.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No Race Meetings Found.</td></tr>
                ) : meetings.map(meeting => (
                  <tr key={meeting.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{meeting.name}</td>
                    <td style={{ padding: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{meeting.venue}</td>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: "#4a9d6f", fontSize: "13px" }}>${meeting.totalBudget.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Races to Process */}
        <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>Races To Process</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                  {["Meeting ID", "Class Level", "Start Time", "Purse", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
                ) : races.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No Races Found.</td></tr>
                ) : races.map(race => (
                  <tr key={race.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{race.raceMeetingId}</td>
                    <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{race.classLevel}</td>
                    <td style={{ padding: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontFamily: "monospace" }}>{race.startTime}</td>
                    <td style={{ padding: "1rem", fontFamily: "monospace", color: "#4a9d6f", fontSize: "13px" }}>${race.purse.toLocaleString()}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "#c9a227", background: "rgba(201,162,39,0.15)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>{race.status}</span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button onClick={() => handleStartProcess(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>Process</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Class Rules */}
        {classRules.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
            <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>Season Class Rules Reference</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {classRules.map(rule => (
                <div key={rule.id} style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", width: "230px" }}>
                  <p style={{ fontWeight: "bold", fontSize: "13px", color: "#f4f2ec" }}>{rule.classLevel}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{rule.className}</p>
                  <div style={{ marginTop: "8px", fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                    Rating: {rule.minRating} - {rule.maxRating ?? "Max"}<br />
                    Prize: ${rule.minPrize.toLocaleString()} - ${rule.maxPrize.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.375rem 0.5rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.375rem",
  color: "#f4f2ec",
  fontSize: "12px",
  outline: "none",
};

import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { showToast } from "../../../lib/confirm";

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

/**
 */
export default function Results() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [classRules, setClassRules] = useState<ClassRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [processingRace, setProcessingRace] = useState<Race | null>(null);
  const [entries, setEntries] = useState<RaceEntry[]>([]);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, string>>({});
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({});
  const [stewardReport, setStewardReport] = useState("");
  const [procLoading, setProcLoading] = useState(false);
  const [confirmCloseRaceId, setConfirmCloseRaceId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, racesData, rulesData] = await Promise.all([
        api.get<Meeting[]>("/public/meetings").catch(() => []),
        api.get<Race[]>("/races").catch(() => []),
        api.get<ClassRule[]>("/races/seasons/1/rules").catch(() => []),
      ]);
      setMeetings(meetingsData);
      
      const ineligibleStatuses = ["SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED", "RACE_ASSIGNED", "CANCELLED"];
      setRaces((racesData || []).filter(r => !ineligibleStatuses.includes(r.status)));
      setClassRules(rulesData);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load data."));
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

      const initialPos: Record<number, string> = {};
      const initialTimes: Record<number, string> = {};
      const initialWeights: Record<number, string> = {};
      mapped.forEach(e => {
        initialPos[e.entryId] = "";
        initialTimes[e.entryId] = "";
        initialWeights[e.entryId] = e.carriedWeight.toString();
      });
      setPositions(initialPos);
      setTimes(initialTimes);
      setWeighInWeights(initialWeights);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load race entries: "));
    } finally {
      setProcLoading(false);
    }
  };

  const handleCloseRace = async (raceId: number) => {
    setError("");
    setSuccess("");
    setProcLoading(true);
    try {
      const res = await api.post<any>(`/admin/races/${raceId}/close`, {});
      if (res?.success) {
        setSuccess("Race closed successfully. Horses and jockeys have been released.");
        fetchData();
      } else {
        throw new Error(res?.message || "Failed to close race.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to close race."));
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
        if (!time) {
          throw new Error(`Finish time is required for horse ${e.horseName}`);
        }
        
        if (e.status !== "DISQUALIFIED" && !/^\d+:\d+(\.\d+)?$/.test(time.trim())) {
          throw new Error(`Finishing time for horse "${e.horseName}" must be in the format MM:SS or MM:SS.ms (e.g. 1:48.35 or 1:48).`);
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
      setError(getErrMsg(err, "Failed to submit results."));
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
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{$t("Enter final position, finish times, and weigh-in weights for each horse.", (localStorage.getItem('app-lang') || 'en'))}</p>
          </div>
          <button onClick={() => setProcessingRace(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <form onSubmit={handleConfirmResults} style={{ padding: "1.5rem" }}>

          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {entries.map(e => (
                <div key={e.entryId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,162,39,0.14)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#c9a227", background: "rgba(201,162,39,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>Gate {e.gateNumber}</span>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>Carried: {e.carriedWeight} kg</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.horseName}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>Jockey: {e.jockeyName}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "0.5rem" }}>
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Weigh-In (kg)", (localStorage.getItem('app-lang') || 'en'))}</label>
                      <input type="number" step="0.1" value={weighInWeights[e.entryId] || ""} onChange={val => setWeighInWeights(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Pos", (localStorage.getItem('app-lang') || 'en'))}</label>
                      <input type="number" min="1" value={positions[e.entryId] || ""} onChange={val => setPositions(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Finish Time", (localStorage.getItem('app-lang') || 'en'))}</label>
                      <input type="text" placeholder={$t("1:12.45", (localStorage.getItem('app-lang') || 'en'))} value={times[e.entryId] || ""} onChange={val => setTimes(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                    {["Gate", "Horse Name", "Jockey Name", "Carried Wt", "Weigh-In Wt (kg)", "Final Position", "Finish Time"].map(h => (
                      <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'en'))}</th>
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
                        <input type="text" placeholder={$t("e.g. 1:12.45", (localStorage.getItem('app-lang') || 'en'))} value={times[e.entryId] || ""} onChange={val => setTimes(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>{$t("Steward Report / Notes", (localStorage.getItem('app-lang') || 'en'))}</label>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} placeholder={$t("Enter details of any race incidents, track conditions, or steward decisions...", (localStorage.getItem('app-lang') || 'en'))} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "12px", height: "5rem", resize: "none", outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setProcessingRace(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'en'))}</button>
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
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)" }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>{$t("Process Results & Close Races", (localStorage.getItem('app-lang') || 'en'))}</h3>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{$t("Select a Race Meeting and process the outcomes of scheduled races.", (localStorage.getItem('app-lang') || 'en'))}</p>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Race Meetings List", (localStorage.getItem('app-lang') || 'en'))}</h4>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {meetings.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", padding: "1.5rem" }}>{$t("No Race Meetings Found.", (localStorage.getItem('app-lang') || 'en'))}</p>
              ) : meetings.map(meeting => (
                <div key={meeting.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem" }}>
                  <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{meeting.name}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>📍 {meeting.venue}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                    {["Meeting Name", "Venue"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'en'))}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                  ) : meetings.length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No Race Meetings Found.", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                  ) : meetings.map(meeting => (
                    <tr key={meeting.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{meeting.name}</td>
                      <td style={{ padding: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{meeting.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Races To Process", (localStorage.getItem('app-lang') || 'en'))}</h4>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {races.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", padding: "1.5rem" }}>{$t("No Races Found.", (localStorage.getItem('app-lang') || 'en'))}</p>
              ) : races.map(race => (
                <div key={race.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,162,39,0.14)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{race.classLevel}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: "2px" }}>Meeting ID: #{race.raceMeetingId}</div>
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#c9a227", background: "rgba(201,162,39,0.15)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>{race.status}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                    📅 {race.startTime}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                    {race.status === "OFFICIAL" ? (
                      <button onClick={() => setConfirmCloseRaceId(race.id)} disabled={procLoading} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: procLoading ? "not-allowed" : "pointer" }}>🏁 {$t("Close Race", (localStorage.getItem('app-lang') || 'en'))}</button>
                    ) : (
                      <button onClick={() => handleStartProcess(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{$t("Process", (localStorage.getItem('app-lang') || 'en'))}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                    {["Meeting ID", "Class Level", "Start Time", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'en'))}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                  ) : races.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No Races Found.", (localStorage.getItem('app-lang') || 'en'))}</td></tr>
                  ) : races.map(race => (
                    <tr key={race.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem", fontFamily: "monospace", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{race.raceMeetingId}</td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{race.classLevel}</td>
                      <td style={{ padding: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontFamily: "monospace" }}>{race.startTime}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#c9a227", background: "rgba(201,162,39,0.15)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>{race.status}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {race.status === "OFFICIAL" ? (
                          <button onClick={() => setConfirmCloseRaceId(race.id)} disabled={procLoading} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: procLoading ? "not-allowed" : "pointer" }}>🏁 {$t("Close Race", (localStorage.getItem('app-lang') || 'en'))}</button>
                        ) : (
                          <button onClick={() => handleStartProcess(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{$t("Process", (localStorage.getItem('app-lang') || 'en'))}</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {classRules.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
            <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Season Class Rules Reference", (localStorage.getItem('app-lang') || 'en'))}</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {classRules.map(rule => (
                <div key={rule.id} style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", width: "230px" }}>
                  <p style={{ fontWeight: "bold", fontSize: "13px", color: "#f4f2ec" }}>{rule.classLevel}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>{rule.className}</p>
                  <div style={{ marginTop: "8px", fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                    Rating: {rule.minRating} - {rule.maxRating ?? "Max"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmCloseRaceId !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#181614",
            border: "1px solid rgba(201,162,39,0.3)",
            borderRadius: "1rem",
            padding: "2rem",
            maxWidth: "450px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🏁</div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "0.75rem" }}>
              {$t("Confirm Close Race", (localStorage.getItem('app-lang') || 'en'))}
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              {$t("Are you sure you want to close this OFFICIAL race? This will release all horses and jockeys from the event.", (localStorage.getItem('app-lang') || 'en'))}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button 
                type="button" 
                onClick={() => setConfirmCloseRaceId(null)}
                style={{ padding: "0.5rem 1.25rem", background: "#2e2a24", border: "1px solid #423b32", color: "#dcd6cd", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer", fontWeight: "bold" }}
              >
                {$t("Cancel", (localStorage.getItem('app-lang') || 'en'))}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (confirmCloseRaceId !== null) {
                    handleCloseRace(confirmCloseRaceId);
                    setConfirmCloseRaceId(null);
                  }
                }}
                style={{ padding: "0.5rem 1.25rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}
              >
                {$t("Close Race", (localStorage.getItem('app-lang') || 'en'))}
              </button>
            </div>
          </div>
        </div>
      )}
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

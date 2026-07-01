import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

const PURPLE = "#8b5cf6";

// SVG Icon Helper
const ICONS: Record<string, JSX.Element> = {
  "arrow-left": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  "alert-triangle": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  "map-pin": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  "calendar": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  "activity": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  "check-square": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  "eye": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  "file-text": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  "gavel": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5 5 3 3 5-5z"/><path d="m16 16 5 5"/><path d="m9 18 5 5"/><path d="m14 13-9-9 3-3 9 9z"/></svg>,
  "thumbs-up": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3l3.15-4.57a2.11 2.11 0 0 1 2.2-.83 2 2 0 0 1 1.65 1.62z"/></svg>,
};

function Icon({ name, color }: { name: string; color?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return <span style={{ display: "inline-flex", color: color || "currentColor" }}>{icon}</span>;
}

function statusBadge(status: string) {
  if (!status) return null;
  const s = status.toUpperCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED:         { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: "Scheduled" },
    DECLARATION_OPEN:  { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: "Declaration Open" },
    DECLARATION_CLOSED:{ bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: "Declaration Closed" },
    RUNNING:           { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: "Running" },
    FINISHED:          { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: "Finished" },
    OFFICIAL:          { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: "Official" },
  };
  const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "#a0a0a0", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
      {c.label}
    </span>
  );
}

export default function RefereeHub() {
  const { user } = useAuth();
  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sub-view state
  const [activeView, setActiveView] = useState<"list" | "check" | "supervise" | "confirm">("list");
  const [selectedRace, setSelectedRace] = useState<any | null>(null);
  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);

  // Pre-Check State
  const [weighedWeights, setWeighedWeights] = useState<Record<number, string>>({});
  const [vetChecks, setVetChecks] = useState<Record<number, string>>({});

  // Confirm Results State
  const [finalPositions, setFinalPositions] = useState<Record<number, string>>({});
  const [finishTimes, setFinishTimes] = useState<Record<number, string>>({});
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({});
  const [disqualifiedList, setDisqualifiedList] = useState<Record<number, boolean>>({});
  const [stewardReport, setStewardReport] = useState("");

  // Record Violation Modal State
  const [showViolModal, setShowViolModal] = useState(false);
  const [violRunner, setViolRunner] = useState("");
  const [violDesc, setViolDesc] = useState("");
  const [violPenalty, setViolPenalty] = useState("");

  // Steward Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalContent, setReportModalContent] = useState("");
  const [reportModalRaceId, setReportModalRaceId] = useState("");

  const fetchDashboard = () => {
    if (!user) return;
    setLoading(true);
    api.get<any>(`/referee/${user.id}/dashboard`)
      .then(res => {
        setAssignedRaces(res.assignedRaces || []);
        setCompletedCount(res.completedCount || 0);
        setPendingCount(res.pendingCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleStartCheck = async (race: any) => {
    setSelectedRace(race);
    setLoading(true);
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${race.id}`);
      setRaceEntries(data || []);
      // Initialize states
      const wMap: Record<number, string> = {};
      const vMap: Record<number, string> = {};
      data.forEach((item: any) => {
        wMap[item.entry.id] = (item.entry.carriedWeight || item.jockey?.weight || 52.0).toString();
        vMap[item.entry.id] = "CLEARED";
      });
      setWeighedWeights(wMap);
      setVetChecks(vMap);
      setActiveView("check");
    } catch (err) {
      alert("Failed to load race entries.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheck = async () => {
    if (!selectedRace) return;
    setLoading(true);
    try {
      const payloadEntries = raceEntries.map((item: any) => ({
        entryId: item.entry.id,
        carriedWeight: parseFloat(weighedWeights[item.entry.id]),
        status: vetChecks[item.entry.id] === "SCRATCH" ? "SCRATCHED" : "APPROVED",
      }));
      await api.post("/referee/pre-check", {
        raceId: selectedRace.id,
        entries: payloadEntries,
      });
      alert("Pre-race check completed. Race is now RUNNING.");
      // Go directly to live supervision
      handleStartSupervise(selectedRace);
    } catch (err: any) {
      alert("Pre-check failed: " + err.message);
      setLoading(false);
    }
  };

  const handleStartSupervise = async (race: any) => {
    setSelectedRace(race);
    setLoading(true);
    try {
      const [entriesData, violationsData] = await Promise.all([
        api.get<any[]>(`/public/results?raceId=${race.id}`),
        api.get<any[]>(`/public/incidents`).then(res => res.filter(v => v.violation?.raceId === race.id)).catch(() => []),
      ]);
      setRaceEntries(entriesData || []);
      setViolations(violationsData || []);
      setActiveView("supervise");
    } catch (err) {
      alert("Failed to load supervision data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRace || !violRunner) return;
    const [horseId, jockeyId] = violRunner.split("-").map(Number);
    try {
      await api.post("/referee/violations", {
        raceId: selectedRace.id,
        horseId,
        jockeyId,
        refereeId: user?.id,
        description: violDesc,
        penalty: violPenalty,
        status: "PENDING",
      });
      alert("Incident violation logged successfully.");
      setShowViolModal(false);
      setViolDesc("");
      setViolPenalty("");
      // Refresh supervision details
      handleStartSupervise(selectedRace);
    } catch (err: any) {
      alert("Failed to log violation: " + err.message);
    }
  };

  const handleStartConfirmResults = () => {
    if (!selectedRace) return;
    const posMap: Record<number, string> = {};
    const tMap: Record<number, string> = {};
    const wMap: Record<number, string> = {};
    const dqMap: Record<number, boolean> = {};
    raceEntries.forEach((item: any, idx: number) => {
      posMap[item.entry.id] = (idx + 1).toString();
      tMap[item.entry.id] = "";
      wMap[item.entry.id] = (item.entry.carriedWeight || 52.0).toString();
      dqMap[item.entry.id] = false;
    });
    setFinalPositions(posMap);
    setFinishTimes(tMap);
    setWeighInWeights(wMap);
    setDisqualifiedList(dqMap);
    setStewardReport("");
    setActiveView("confirm");
  };

  const handleConfirmResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRace) return;
    setLoading(true);
    try {
      const resultsPayload = raceEntries.map((item: any) => {
        const entryId = item.entry.id;
        const isDq = disqualifiedList[entryId];
        return {
          entryId,
          finalPosition: isDq ? null : parseInt(finalPositions[entryId]),
          finishTime: isDq ? "DQ" : finishTimes[entryId],
          weighInWeight: parseFloat(weighInWeights[entryId]),
        };
      });

      await api.post("/referee/results", {
        raceId: selectedRace.id,
        stewardReport,
        results: resultsPayload,
      });

      alert("Results verified and submitted officially. Race closed.");
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openStewardReportModal = (raceId: string, report: string) => {
    setReportModalRaceId(raceId);
    setReportModalContent(report && report.trim() !== "null" ? report : "No report was compiled for this race.");
    setShowReportModal(true);
  };

  if (activeView === "check" && selectedRace) {
    const isGatesFullySet = selectedRace.gatesFullySet;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Referee Hub
          </button>
        </div>

        {!isGatesFullySet && (
          <div style={{ padding: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "0.5rem", color: "#f87171", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="alert-triangle" />
            <span><strong>Cảnh báo:</strong> Cổng xuất phát chưa được thiết lập đầy đủ cho tất cả nài/ngựa. Hãy yêu cầu Admin cấu hình cổng trước khi bắt đầu cuộc đua.</span>
          </div>
        )}

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pre-Race inspection for</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <span>📍 {selectedRace.venue}</span>
              <span>📅 {selectedRace.startTime}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "11px", fontFamily: "monospace" }}>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Class Level</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.classLevel}</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Distance</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.distanceMeters}m</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Track Type</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.trackType}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Horse & Jockey Weight Check</h3>
            <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Verify carried weights, horse breeding, and equipment checks before opening the gates.</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Gate", "Horse Details", "Jockey Details", "Jockey Weight (kg)", "Required Weight", "Vet & Safety Check", "Status"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {raceEntries.map(item => {
                  const entryId = item.entry.id;
                  const reqWeight = item.entry.carriedWeight || 52.0;
                  const weighed = parseFloat(weighedWeights[entryId]);
                  const diff = weighed - reqWeight;
                  let badgeText = "Verified";
                  let badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                  if (vetChecks[entryId] === "SCRATCH") {
                    badgeText = "SCRATCHED";
                    badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                  } else if (diff > 1.0) {
                    badgeText = "Critical Overweight (Max +1.0kg)";
                    badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                  } else if (diff > 0) {
                    badgeText = `Overweight +${diff.toFixed(1)}kg (Approved)`;
                    badgeStyle = { bg: "rgba(245,158,11,0.1)", color: "#fbbf24" };
                  } else if (diff < 0) {
                    badgeText = `Requires Lead Weight: +${Math.abs(diff).toFixed(1)}kg`;
                    badgeStyle = { bg: "rgba(59,130,246,0.1)", color: "#60a5fa" };
                  } else {
                    badgeText = "Perfect Weight";
                    badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                  }

                  return (
                    <tr key={entryId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: vetChecks[entryId] === "SCRATCH" ? 0.4 : 1 }}>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                          {item.entry.gateNumber || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</div>
                        <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · Rating: {item.horse?.currentRating}</div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px" }}>{item.jockey?.username}</div>
                        <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Base weight: {item.jockey?.weight || "52.0"} kg</div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <input type="number" step="0.1" value={weighedWeights[entryId] || ""} disabled={vetChecks[entryId] === "SCRATCH"} onChange={e => setWeighedWeights(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ width: 80, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                      </td>
                      <td style={{ padding: "1rem", fontSize: "12px", fontFamily: "monospace", color: "#a855f7", fontWeight: "bold" }}>
                        {reqWeight} kg
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <select value={vetChecks[entryId]} onChange={e => setVetChecks(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ padding: "0.25rem 0.5rem", fontSize: "11px", width: 140, outline: "none" }}>
                          <option value="CLEARED">Cleared (Passed)</option>
                          <option value="SCRATCH">Scratch (Medical)</option>
                        </select>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.color}20`, fontWeight: "bold" }}>
                          {badgeText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>Safety Checklist Complete?</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Ensure veterinarians have cleared all horses, jockeys are weighed out, and starting boxes are safe.</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => setActiveView("list")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleConfirmCheck} disabled={!isGatesFullySet} style={{ padding: "0.5rem 1rem", background: isGatesFullySet ? "#10b981" : "#1f1f22", color: isGatesFullySet ? "#fff" : "#555", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: isGatesFullySet ? "pointer" : "not-allowed" }}>
              Confirm Pre-Race Check & Open Gates
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === "supervise" && selectedRace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Referee Hub
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live supervision for</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem", alignItems: "center" }}>
              <span>📍 {selectedRace.venue}</span>
              <span style={{ color: "#eab308", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="activity" /> Race in Progress
              </span>
            </p>
          </div>
          <div>
            <button onClick={() => setShowViolModal(true)} style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⚠️ Record Rules Violation
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          {/* Active Runners */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Active Runners</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Competitors currently running on the track.</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Gate", "Horse", "Jockey", "Carried Weight", "Action"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raceEntries.map(item => (
                    <tr key={item.entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                          {item.entry.gateNumber || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</td>
                      <td style={{ padding: "1rem", color: "#a0a0a0", fontSize: "12px" }}>{item.jockey?.username}</td>
                      <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "12px", color: "#f4f2ec" }}>{item.entry.carriedWeight} kg</td>
                      <td style={{ padding: "1rem" }}>
                        <button onClick={() => { setViolRunner(`${item.horse.id}-${item.jockey.id}`); setShowViolModal(true); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incidents Recorded */}
          <div className="rounded-xl flex flex-col overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Incidents Recorded</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Violations logged by stewards for this race.</p>
            </div>
            <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", maxHeight: "350px" }}>
              {violations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "#a0a0a0" }}>
                  <Icon name="thumbs-up" color="#10b981" />
                  <p style={{ fontSize: "12px", marginTop: "0.5rem" }}>No incidents recorded. Clean race so far.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {violations.map((v, i) => (
                    <div key={i} style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <h4 style={{ fontWeight: "bold", color: "#f87171", fontSize: "12px" }}>{v.horseName}</h4>
                        <span style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>Violated</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Jockey: <span style={{ color: "#fff" }}>{v.jockeyName}</span></p>
                      <p style={{ fontSize: "11px", background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "0.25rem", margin: "0.5rem 0", fontFamily: "monospace", color: "#f4f2ec" }}>{v.violation?.description}</p>
                      <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon name="gavel" /> Penalty: {v.violation?.penalty}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Finalization Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>Race Completed?</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Transition to the final results sheet to enter positions, race times, and submit your official report.</p>
          </div>
          <button onClick={handleStartConfirmResults} style={{ padding: "0.625rem 1.25rem", background: "#fbbf24", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="check-square" /> Finish Race & Enter Results
          </button>
        </div>

        {/* Log Violation Modal */}
        {showViolModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
            <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "28rem", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon name="alert-triangle" color="#ef4444" /> Log Rules Violation
                </h3>
                <button onClick={() => setShowViolModal(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
              </div>
              <form onSubmit={handleSaveViolation} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Runner (Horse / Jockey)</label>
                  <select value={violRunner} onChange={e => setViolRunner(e.target.value)} required style={{ width: "100%", padding: "0.5rem", outline: "none" }}>
                    <option value="">-- Select Runner --</option>
                    {raceEntries.map(item => (
                      <option key={item.entry.id} value={`${item.horse.id}-${item.jockey.id}`}>
                        {item.horse?.name} ({item.jockey?.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Violation Description</label>
                  <textarea value={violDesc} onChange={e => setViolDesc(e.target.value)} required placeholder="Describe what happened (e.g. Jockey cut off lane at turn 3)..." style={{ width: "100%", padding: "0.5rem", height: 80, resize: "none", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Assessed Penalty</label>
                  <input type="text" value={violPenalty} onChange={e => setViolPenalty(e.target.value)} required placeholder="e.g. Fine $500, Suspended 3 Days..." style={{ width: "100%", padding: "0.5rem", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button type="button" onClick={() => setShowViolModal(false)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>Save Violation</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === "confirm" && selectedRace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("supervise")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Live Supervision
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Final Result entry for</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
          <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "0.25rem" }}>Submit official positions, timings, disqualifications and compile the Steward's Report to distribute prizes and update ratings.</p>
        </div>

        <form onSubmit={handleConfirmResults} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Official Finishing Sheet</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Verify each horse's position and timing. Check the DQ column to disqualify a runner.</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Gate", "Horse Details", "Jockey Details", "Final Position", "Weigh-In Weight (kg)", "Finish Time", "DQ"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: h === "DQ" ? "center" : "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raceEntries.map((item, idx) => {
                    const entryId = item.entry.id;
                    const isDq = disqualifiedList[entryId] || false;
                    const weighedOut = item.entry.carriedWeight || 52.0;
                    const weighedIn = parseFloat(weighInWeights[entryId]) || 0;
                    const diff = weighedIn - weighedOut;
                    let wiText = "Weigh-In Passed";
                    let wiColor = "#34d399";
                    if (diff < -0.5) {
                      wiText = `UNDERWEIGHT DISCREPANCY: ${diff.toFixed(1)} kg (Fails!)`;
                      wiColor = "#f87171";
                    } else {
                      wiText = `Weigh-In Passed (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} kg)`;
                    }

                    return (
                      <tr key={entryId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: isDq ? 0.4 : 1 }}>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                            {item.entry.gateNumber || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</div>
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · Rating: {item.horse?.currentRating}</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px" }}>{item.jockey?.username}</div>
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Weighed Out: {item.entry.carriedWeight || "52.0"} kg</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <input type="number" required={!isDq} disabled={isDq} value={isDq ? "" : finalPositions[entryId] || ""} onChange={e => setFinalPositions(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ width: 70, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input type="number" step="0.1" required value={weighInWeights[entryId] || ""} disabled={isDq} onChange={e => {
                              const v = parseFloat(e.target.value);
                              setWeighInWeights(prev => ({ ...prev, [entryId]: e.target.value }));
                              if (!isNaN(v) && v - weighedOut < -0.5) {
                                setDisqualifiedList(prev => ({ ...prev, [entryId]: true }));
                              }
                            }} style={{ width: 75, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                            <span style={{ fontSize: "11px", color: "#a0a0a0" }}>kg</span>
                          </div>
                          {!isDq && <div style={{ fontSize: "10px", fontWeight: "bold", color: wiColor, marginTop: "4px" }}>{wiText}</div>}
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <input type="text" required={!isDq} placeholder="e.g. 1:48.35" value={isDq ? "DQ" : finishTimes[entryId] || ""} disabled={isDq} onChange={e => setFinishTimes(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ width: 120, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <input type="checkbox" checked={isDq} onChange={e => setDisqualifiedList(prev => ({ ...prev, [entryId]: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Steward's Official Report</h3>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginBottom: "0.75rem" }}>Provide a written summary of the race, detailing any incident inquiries, warnings, or vet notes.</p>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} required rows={5} placeholder="Insert race description and official notes here... e.g. Clean jump. Inquiries were held and action taken..." style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "0.5rem", color: "#fff", fontSize: "12px", resize: "none", outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setActiveView("supervise")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>
              Approve & Declare Official
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {[
          { label: "Total Assignments",       value: completedCount + pendingCount, color: PURPLE,    bg: `rgba(139,92,246,0.1)`,  icon: "📋" },
          { label: "Pending Check/Supervision", value: pendingCount,   color: "#eab308",  bg: "rgba(234,179,8,0.1)",   icon: "⏱" },
          { label: "Completed Races",          value: completedCount,  color: "#4ade80",  bg: "rgba(74,222,128,0.1)",  icon: "✅" },
        ].map(s => (
          <div key={s.label} className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", background: "rgba(21,19,16,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0", marginBottom: "0.375rem" }}>{s.label}</p>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Races Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>Assigned Races & Duties</h3>
            <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>Inspect, monitor, and finalize results for races assigned to you.</p>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Race ID", "Race Meeting & Venue", "Start Time", "Details", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: i === 5 ? "right" : "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>Loading assigned races...</td></tr>
              ) : assignedRaces.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "2rem" }}>📭</span>
                      <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>No races assigned to you at the moment.</span>
                    </div>
                  </td>
                </tr>
              ) : assignedRaces.map((race: any) => {
                const isPending = !["OFFICIAL", "FINISHED", "CANCELLED"].includes(race.status ?? "");
                const isRunning = race.status === "RUNNING";
                const isOfficial = race.status === "OFFICIAL";

                return (
                  <tr key={race.id} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.875rem", color: "#f4f2ec" }}>#{race.id}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{race.meetingName}</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>📍 {race.venue}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "#a0a0a0", fontFamily: "monospace" }}>{race.startTime}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.875rem", color: "#f4f2ec" }}>{race.classLevel}</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>{race.distanceMeters}m · {race.trackType}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>{statusBadge(race.status)}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {isPending && !isRunning && (
                        race.gatesFullySet ? (
                          <button onClick={() => handleStartCheck(race)} style={{ padding: "0.375rem 0.75rem", background: PURPLE, color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                            ☑ Start Pre-Race Check
                          </button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                            <span style={{ fontSize: "8px", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>Chưa thiết lập Cổng (Gate)</span>
                            <button disabled style={{ padding: "0.375rem 0.75rem", background: "#1f1d1a", color: "#555", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "not-allowed", border: "none" }}>
                              🔒 Start Pre-Race Check
                            </button>
                          </div>
                        )
                      )}
                      {isRunning && (
                        <button onClick={() => handleStartSupervise(race)} style={{ padding: "0.375rem 0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                          👁 Monitor & Record
                        </button>
                      )}
                      {isOfficial && (
                        <button onClick={() => openStewardReportModal(race.id, race.stewardReport)} style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}>
                          📄 Steward Report
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Steward Report Modal */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📄 Steward's Official Report
              </h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#a0a0a0", marginBottom: "0.5rem" }}>Race ID: #{reportModalRaceId}</p>
              <div style={{ fontSize: "13px", color: "#fff", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                {reportModalContent}
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowReportModal(false)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

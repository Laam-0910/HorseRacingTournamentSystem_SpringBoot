import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface Meeting {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  totalBudget: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  roleId: number;
}

interface Race {
  id: number;
  raceMeetingId: number;
  startTime: string;
  registrationStartTime: string;
  registrationEndTime: string;
  status: string;
  classLevel: string;
  minRating: number;
  maxRating: number;
  distanceMeters: number;
  trackType: string;
  purse: number;
  maxEntries: number;
  youtubeLiveUrl?: string;
  raceMeetingName?: string;
}

export default function Race() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [referees, setReferees] = useState<User[]>([]);
  const [refereesMap, setRefereesMap] = useState<Record<number, User[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Form State
  const [meetingId, setMeetingId] = useState("");
  const [classLevel, setClassLevel] = useState("1");
  const [trackType, setTrackType] = useState("Turf");
  const [startTime, setStartTime] = useState("");
  const [regStartTime, setRegStartTime] = useState("");
  const [regEndTime, setRegEndTime] = useState("");
  const [distance, setDistance] = useState("1200");
  const [maxEntries, setMaxEntries] = useState("12");
  const [minEntries, setMinEntries] = useState("3");
  const [purse, setPurse] = useState("100000");

  // Edit Modal State
  const [editingRace, setEditingRace] = useState<Race | null>(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editRegStartTime, setEditRegStartTime] = useState("");
  const [editRegEndTime, setEditRegEndTime] = useState("");
  const [editDistance, setEditDistance] = useState("1200");
  const [editTrackType, setEditTrackType] = useState("Turf");
  const [editPurse, setEditPurse] = useState("100000");
  const [editMaxEntries, setEditMaxEntries] = useState("12");
  const [editMinEntries, setEditMinEntries] = useState("3");

  // Livestream states
  const [liveUrls, setLiveUrls] = useState<Record<number, string>>({});
  // Referee assignment selections
  const [assignRefSelection, setAssignRefSelection] = useState<Record<number, string>>({});

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}-${minutes}-${seconds}`;
    } catch {
      return dateStr;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, racesData, usersData, refsMapData] = await Promise.all([
        api.get<Meeting[]>("/public/meetings").catch(() => []),
        api.get<Race[]>("/races").catch(() => []),
        api.get<User[]>("/public/users?roleId=5").catch(() => []),
        api.get<Record<number, User[]>>("/admin/races/referees").catch(() => ({})),
      ]);
      setMeetings(meetingsData);
      setRaces(racesData);
      setReferees(usersData);
      setRefereesMap(refsMapData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const minVal = parseInt(minEntries, 10);
    const maxVal = parseInt(maxEntries, 10);
    if (isNaN(minVal) || minVal <= 0) {
      setError("Min entries must be a positive integer greater than 0.");
      return;
    }
    if (isNaN(maxVal) || maxVal <= 0) {
      setError("Max entries must be a positive integer greater than 0.");
      return;
    }
    if (maxVal < minVal) {
      setError("Max entries must be greater than or equal to Min entries.");
      return;
    }

    try {
      const res = await api.post<any>("/races", {
        raceMeetingId: parseInt(meetingId),
        classLevel,
        trackType,
        startTime: startTime.replace("T", " ") + (startTime.length === 16 ? ":00" : ""),
        registrationStartTime: regStartTime.replace("T", " ") + (regStartTime.length === 16 ? ":00" : ""),
        registrationEndTime: regEndTime.replace("T", " ") + (regEndTime.length === 16 ? ":00" : ""),
        distanceMeters: parseInt(distance),
        maxEntries: parseInt(maxEntries),
        purse: parseFloat(purse),
      });
      if (res.success) {
        setSuccess("Race created successfully.");
        // reset form
        setMeetingId("");
        setStartTime("");
        setRegStartTime("");
        setRegEndTime("");
        fetchData();
      } else {
        throw new Error(res.error || "Failed to create race.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create race.");
    }
  };

  const handleOpenEdit = (race: Race) => {
    setEditingRace(race);
    setEditStartTime(race.startTime ? race.startTime.replace(" ", "T").substring(0, 16) : "");
    setEditRegStartTime(race.registrationStartTime ? race.registrationStartTime.replace(" ", "T").substring(0, 16) : "");
    setEditRegEndTime(race.registrationEndTime ? race.registrationEndTime.replace(" ", "T").substring(0, 16) : "");
    setEditDistance(race.distanceMeters.toString());
    setEditTrackType(race.trackType);
    setEditPurse(race.purse.toString());
    setEditMaxEntries(race.maxEntries.toString());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRace) return;
    setError("");
    setSuccess("");

    const minVal = parseInt(editMinEntries, 10);
    const maxVal = parseInt(editMaxEntries, 10);
    if (isNaN(minVal) || minVal <= 0) {
      alert("Min entries must be a positive integer greater than 0.");
      return;
    }
    if (isNaN(maxVal) || maxVal <= 0) {
      alert("Max entries must be a positive integer greater than 0.");
      return;
    }
    if (maxVal < minVal) {
      alert("Max entries must be greater than or equal to Min entries.");
      return;
    }

    try {
      const res = await api.post<any>(`/races/${editingRace.id}`, {
        startTime: editStartTime,
        registrationStartTime: editRegStartTime,
        registrationEndTime: editRegEndTime,
        distanceMeters: parseInt(editDistance),
        trackType: editTrackType,
        purse: parseFloat(editPurse),
        maxEntries: parseInt(editMaxEntries),
      });
      if (res.success) {
        setSuccess("Race details updated successfully.");
        setEditingRace(null);
        fetchData();
      } else {
        throw new Error(res.error || "Failed to update race.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update race.");
    }
  };

  const handleGoLive = async (raceId: number) => {
    const url = liveUrls[raceId];
    if (!url) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${raceId}/live`, { youtubeLiveUrl: url });
      if (res.success) {
        setSuccess("Livestream URL updated.");
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to set live URL.");
    }
  };

  const handleEndLive = async (raceId: number) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${raceId}/live/remove`);
      if (res.success) {
        setSuccess("Livestream ended.");
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to end live.");
    }
  };

  const handleAssignReferee = async (raceId: number) => {
    const refId = assignRefSelection[raceId];
    if (!refId) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${raceId}/referee`, { refereeId: parseInt(refId) });
      if (res.success) {
        setSuccess("Referee assigned successfully.");
        setAssignRefSelection(prev => ({ ...prev, [raceId]: "" }));
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign referee.");
    }
  };

  const handleRemoveReferee = async (raceId: number, refId: number) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${raceId}/referee/remove`, { refereeId: refId });
      if (res.success) {
        setSuccess("Referee removed.");
        fetchData();
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove referee.");
    }
  };

  const statusBadge = (status: string) => {
    const s = (status ?? "").toUpperCase();
    const cfg: Record<string, { bg: string; color: string; label: string }> = {
      SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", label: "Scheduled" },
      DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", label: "Scheduled" },
      DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", label: "Scheduled" },
      RUNNING:            { bg: "rgba(245,158,11,0.1)",  color: "#fbbf24", label: "Running" },
      OFFICIAL:           { bg: "rgba(16,185,129,0.1)",  color: "#34d399", label: "Official" },
      CANCELLED:          { bg: "rgba(239,91,91,0.1)",   color: "#ef5b5b", label: "Cancelled" },
    };
    const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", label: status };
    return (
      <span style={{ display: "inline-flex", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
        {c.label}
      </span>
    );
  };

  const meetingMap = new Map(meetings.map(m => [m.id, m.name]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Create New Race */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)" }}>
          <div>
            <p style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>Create New Race</p>
            <p style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "2px", color: "rgba(255,255,255,0.4)" }}>Add a race to a scheduled race meeting</p>
          </div>
        </div>
        <div style={{ padding: "1.5rem" }}>
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px", marginBottom: "1rem" }}>{error}</div>}
          {success && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px", marginBottom: "1rem" }}>{success}</div>}

          <form onSubmit={handleCreateRace}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Select Race Meeting</label>
                <select value={meetingId} onChange={e => setMeetingId(e.target.value)} required style={{ width: "100%", padding: "0.75rem", background: "#c9a22712", border: "1px solid #c9a22740", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.875rem", outline: "none" }}>
                  <option value="" style={{ background: "#12141a", color: "#fff" }}>-- Choose Meeting --</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id} style={{ background: "#12141a", color: "#fff" }}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Class Level</label>
                <select value={classLevel} onChange={e => setClassLevel(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }}>
                  <option value="1" style={{ background: "#12141a", color: "#fff" }}>Class 1 (Rating 95+)</option>
                  <option value="2" style={{ background: "#12141a", color: "#fff" }}>Class 2 (Rating 80-94)</option>
                  <option value="3" style={{ background: "#12141a", color: "#fff" }}>Class 3 (Rating 60-79)</option>
                  <option value="4" style={{ background: "#12141a", color: "#fff" }}>Class 4 (Rating 40-59)</option>
                  <option value="5" style={{ background: "#12141a", color: "#fff" }}>Class 5 (Rating 0-39)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Track Type</label>
                <select value={trackType} onChange={e => setTrackType(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }}>
                  <option value="Turf" style={{ background: "#12141a", color: "#fff" }}>Turf</option>
                  <option value="Dirt" style={{ background: "#12141a", color: "#fff" }}>Dirt</option>
                  <option value="Synthetic" style={{ background: "#12141a", color: "#fff" }}>Synthetic</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Start Time</label>
                <input type="datetime-local" step="1" value={startTime} onChange={e => setStartTime(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "#c9a227" }}>Registration Start</label>
                <input type="datetime-local" step="1" value={regStartTime} onChange={e => setRegStartTime(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "#c9a227" }}>Registration End</label>
                <input type="datetime-local" step="1" value={regEndTime} onChange={e => setRegEndTime(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Distance (Meters)</label>
                <input type="number" value={distance} onChange={e => setDistance(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Min Entries</label>
                <input type="number" min="1" value={minEntries} onChange={e => setMinEntries(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Max Entries</label>
                <input type="number" min="1" value={maxEntries} onChange={e => setMaxEntries(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>Purse Amount (USD)</label>
                <input type="number" value={purse} onChange={e => setPurse(e.target.value)} required style={{ width: "100%", padding: "0.625rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.5rem", fontSize: "0.75rem", outline: "none" }} />
              </div>
            </div>
            <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: "0.5rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, border: "none", background: "#c9a227", color: "#0b0d11", cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
              Create Race
            </button>
          </form>
        </div>
      </div>

      {/* Races Database */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)" }}>
          <p style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>Races Database</p>
          <p style={{ fontSize: "10px", fontFamily: "monospace", marginTop: "2px", color: "rgba(255,255,255,0.4)" }}>List of all scheduled races across active meetings</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                {["Race ID", "Race Meeting", "Class", "Track", "Distance", "Start Time", "Min-Max Rating", "Purse", "Status", "Livestream", "Assigned Referee", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1.5rem", textAlign: h === "Purse" || h === "Status" ? "right" : h === "Livestream" || h === "Assigned Referee" || h === "Actions" ? "center" : "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "monospace" }}>Loading races database...</td></tr>
              ) : races.length === 0 ? (
                <tr><td colSpan={12} style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "monospace" }}>No races found.</td></tr>
              ) : races.map(race => {
                const assigned = refereesMap[race.id] || [];
                return (
                  <tr key={race.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1rem 1.5rem" }}><span style={{ fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>R-{race.id}</span></td>
                    <td style={{ padding: "1rem 1.5rem" }}><p style={{ fontSize: "12px", color: "#f4f2ec" }}>{meetingMap.get(race.raceMeetingId) || race.raceMeetingName}</p></td>
                    <td style={{ padding: "1rem 1.5rem" }}><span style={{ fontSize: "12px", fontFamily: "monospace", color: "#c9a227", fontWeight: 600 }}>{race.classLevel}</span></td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{race.trackType}</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{race.distanceMeters}m</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{formatDateTime(race.startTime)}</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{race.minRating} – {race.maxRating}</td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}><span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#4a9d6f" }}>${race.purse.toLocaleString()}</span></td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>{statusBadge(race.status)}</td>

                    {/* Livestream */}
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      {race.youtubeLiveUrl ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "center" }}>
                          <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.1em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }}></span>LIVE
                          </span>
                          <button onClick={() => handleEndLive(race.id)} style={{ fontSize: "9px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#f87171", fontWeight: "bold", cursor: "pointer" }}>End Live</button>
                        </div>
                      ) : (
                        race.status === "RUNNING" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                            <input type="text" placeholder="YouTube URL" value={liveUrls[race.id] || ""} onChange={e => setLiveUrls(prev => ({ ...prev, [race.id]: e.target.value }))} style={{ fontSize: "10px", padding: "0.25rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#f4f2ec", width: 110 }} />
                            <button onClick={() => handleGoLive(race.id)} style={{ fontSize: "9px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "#ef4444", color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer" }}>Go Live</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>-</span>
                        )
                      )}
                    </td>

                    {/* Referee */}
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", alignItems: "center" }}>
                        {assigned.map(ref => (
                          <div key={ref.id} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#1f1f22", color: "#f4f2ec", fontSize: "10px", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", border: "1px solid #2e2e33" }}>
                            <span>{ref.username}</span>
                            <button onClick={() => handleRemoveReferee(race.id, ref.id)} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: "bold", cursor: "pointer", marginLeft: "4px", fontSize: "10px" }} title="Remove referee">×</button>
                          </div>
                        ))}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <select value={assignRefSelection[race.id] || ""} onChange={e => setAssignRefSelection(prev => ({ ...prev, [race.id]: e.target.value }))} style={{ fontSize: "10px", padding: "0.25rem", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#f4f2ec", outline: "none" }}>
                            <option value="">-- Assign Referee --</option>
                            {referees.filter(r => !assigned.some(a => a.id === r.id)).map(rUser => (
                              <option key={rUser.id} value={rUser.id}>{rUser.username}</option>
                            ))}
                          </select>
                          <button onClick={() => handleAssignReferee(race.id)} style={{ fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "#c9a227", color: "#0c0a09", border: "none", fontWeight: "bold", cursor: "pointer" }}>Assign</button>
                        </div>
                      </div>
                    </td>

                    {/* Edit button */}
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                      <button onClick={() => handleOpenEdit(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.25rem", background: "#c9a227", color: "#0c0a09", border: "none", fontFamily: "monospace", fontSize: "10px", fontWeight: "bold", cursor: "pointer" }}>Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.012)" }}>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{races.length} races total inside current active season meetings.</p>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRace && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "32rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,162,39,0.1)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>Edit Race Schedule</h3>
              <button onClick={() => setEditingRace(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Start Time</label>
                  <input type="datetime-local" step="1" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: "#c9a227" }}>Registration Start</label>
                  <input type="datetime-local" step="1" value={editRegStartTime} onChange={e => setEditRegStartTime(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: "#c9a227" }}>Registration End</label>
                  <input type="datetime-local" step="1" value={editRegEndTime} onChange={e => setEditRegEndTime(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Distance (m)</label>
                  <input type="number" value={editDistance} onChange={e => setEditDistance(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Track Type</label>
                  <select value={editTrackType} onChange={e => setEditTrackType(e.target.value)} required style={inputStyle}>
                    <option value="Turf">Turf</option>
                    <option value="Dirt">Dirt</option>
                    <option value="Synthetic">Synthetic</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Purse ($)</label>
                  <input type="number" value={editPurse} onChange={e => setEditPurse(e.target.value)} required style={inputStyle} />
                </div>
                 <div>
                  <label style={labelStyle}>Min Entries</label>
                  <input type="number" min="1" value={editMinEntries} onChange={e => setEditMinEntries(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Max Entries</label>
                  <input type="number" min="1" value={editMaxEntries} onChange={e => setEditMaxEntries(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(201,162,39,0.1)", paddingTop: "1rem" }}>
                <button type="button" onClick={() => setEditingRace(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "0.375rem",
  color: "rgba(255,255,255,0.4)",
};

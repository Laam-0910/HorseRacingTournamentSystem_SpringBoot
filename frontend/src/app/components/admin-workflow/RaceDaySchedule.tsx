import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { formatDateTime, formatDate, formatForApi, parseSafeDate } from "../../utils/dateTimeHelper";
import InlineDateTimePicker from "../ui/InlineDateTimePicker";

export default function RaceDaySchedule() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [enrichedRaces, setEnrichedRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [classLevel, setClassLevel] = useState("Class 1 (Rating 95+)");
  const [trackType, setTrackType] = useState("Turf");
  const [startTime, setStartTime] = useState("");
  const [distance, setDistance] = useState("1200");
  const [minEntries, setMinEntries] = useState("3");
  const [maxEntries, setMaxEntries] = useState("12");
  const [purse, setPurse] = useState("100000");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [meetingsData, seasonsData] = await Promise.all([
        api.get<any[]>("/races/meetings").catch(() => []),
        api.get<any[]>("/races/seasons").catch(() => []),
      ]);
      setMeetings(meetingsData);
      setSeasons(seasonsData);
      if (meetingsData.length > 0) {
        setSelectedMeetingId(meetingsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load schedule data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRacesDetails = async (meetingId: number) => {
    setLoadingRaces(true);
    try {
      const racesData = await api.get<any[]>(`/public/races?meetingId=${meetingId}`);
      const enriched = await Promise.all(
        racesData.map(async (race) => {
          const [entries, referees] = await Promise.all([
            api.get<any[]>(`/public/races/${race.id}/entries`).catch(() => []),
            api.get<any[]>(`/admin/races/${race.id}/referees`).catch(() => []),
          ]);
          return { race, entries, referees };
        })
      );
      setEnrichedRaces(enriched);
    } catch (err: any) {
      console.error("Failed to load race details:", err);
    } finally {
      setLoadingRaces(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMeetingId !== null) {
      fetchRacesDetails(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);
  const activeSeason = selectedMeeting
    ? seasons.find((s) => s.id === selectedMeeting.seasonId)
    : seasons.find((s) => s.status === "ACTIVE");


  const handleScheduleRaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId) {
      alert("Please select a race meeting first.");
      return;
    }
    const minVal = parseInt(minEntries);
    const maxVal = parseInt(maxEntries);
    if (isNaN(minVal) || minVal <= 0 || isNaN(maxVal) || maxVal <= 0) {
      alert("Min entries and Max entries must be positive integers.");
      return;
    }
    if (maxVal < minVal) {
      alert("Max entries cannot be less than Min entries.");
      return;
    }

    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (selectedMeeting) {
      const meetDate = parseSafeDate(selectedMeeting.startDate);
      const raceDate = parseSafeDate(startTime);
      if (meetDate && raceDate) {
        if (meetDate.getFullYear() !== raceDate.getFullYear() ||
            meetDate.getMonth() !== raceDate.getMonth() ||
            meetDate.getDate() !== raceDate.getDate()) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const formattedMeetDate = `${pad(meetDate.getDate())}-${pad(meetDate.getMonth() + 1)}-${meetDate.getFullYear()}`;
          alert(`Race start time must be on the same date as the selected Race Meeting (${formattedMeetDate}).`);
          return;
        }
      }
    }

    try {
      await api.post("/races", {
        raceMeetingId: selectedMeetingId,
        classLevel,
        trackType,
        startTime: startTime,
        distanceMeters: parseInt(distance),
        minEntries: minVal,
        maxEntries: maxVal,
        purse: parseFloat(purse),
      });
      setShowScheduleModal(false);
      setStartTime("");
      fetchRacesDetails(selectedMeetingId);
    } catch (err: any) {
      alert("Failed to schedule race: " + err.message);
    }
  };

  const handleOpenScheduleModal = () => {
    if (!selectedMeetingId) {
      alert("Please select a race meeting first.");
      return;
    }
    const meeting = meetings.find(m => m.id === selectedMeetingId);
    if (meeting) {
      const dt = parseSafeDate(meeting.startDate);
      if (dt) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateStr = `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()}`;
        setStartTime(`${dateStr} 13:00:00`);
      }
    }
    setShowScheduleModal(true);
  };

  const handleCancelRace = async (raceId: number) => {
    if (!confirm("Are you sure you want to cancel this race?")) return;
    try {
      await api.post(`/admin/races/${raceId}/cancel`);
      if (selectedMeetingId) {
        fetchRacesDetails(selectedMeetingId);
      }
    } catch (err: any) {
      alert("Failed to cancel race: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "#f4f2ec" }}>
      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards (JSP Style) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div style={cardStyle}>
          <p style={cardLabelStyle}>Season</p>
          <p style={cardValStyle} title={activeSeason?.name}>
            {activeSeason?.name || "Championship Season"}
          </p>
          <p style={cardSubStyle}>Active Tournament</p>
        </div>

        <div style={{ ...cardStyle, borderColor: "rgba(201,162,39,0.22)" }}>
          <p style={cardLabelStyle}>Race Meeting</p>
          <p style={cardValStyle} title={selectedMeeting?.name}>
            {selectedMeeting?.name || "No Meeting Selected"}
          </p>
          <p style={{ ...cardSubStyle, color: "#c9a227" }}>● Scheduled Day</p>
        </div>

        <div style={cardStyle}>
          <p style={cardLabelStyle}>Track Venue</p>
          <p style={cardValStyle} title={selectedMeeting?.venue}>
            {selectedMeeting?.venue || "Main Course"}
          </p>
          <p style={cardSubStyle}>Track Venue type</p>
        </div>

        <div style={cardStyle}>
          <p style={cardLabelStyle}>Race Date</p>
          <p style={{ ...cardValStyle, fontFamily: "monospace" }}>
            {selectedMeeting ? formatDate(selectedMeeting.startDate || selectedMeeting.date) : "N/A"}
          </p>
          <p style={cardSubStyle}>
            Total Events: {enrichedRaces.length}
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.012)", borderColor: "rgba(255,255,255,0.05)" }}>
        
        {/* Header with selector */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>Race Day Schedule</h4>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>Official operational timeline for the upcoming race fixture</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={handleOpenScheduleModal}
              style={{
                padding: "0.5rem 1rem",
                background: "#c9a227",
                color: "#0b0d11",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.1s"
              }}
            >
              + Schedule a Race
            </button>
            <select
              value={selectedMeetingId || ""}
              onChange={(e) => setSelectedMeetingId(parseInt(e.target.value, 10))}
              style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "12px", fontFamily: "monospace", outline: "none", cursor: "pointer" }}
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "#12141a" }}>
                  {m.name} {m.id === selectedMeetingId ? "(Current)" : ""}
                </option>
              ))}
              {meetings.length === 0 && (
                <option value="">No meetings available</option>
              )}
            </select>
          </div>
        </div>

        {/* Content list */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {loadingRaces ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "2rem" }}>Loading schedule timeline...</p>
          ) : enrichedRaces.length > 0 ? (
            enrichedRaces.map((item) => {
              const r = item.race;
              return (
                <div key={r.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.04)", padding: "1.25rem" }}>
                  
                  {/* Race header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", color: "#c9a227" }}>Race #{r.id}</span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#f4f2ec" }}>{r.classLevel}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        Time: {formatDateTime(r.startTime)} | Distance: {r.distanceMeters}m | Track: {r.trackType} | Purse: ${r.purse.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "9px",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        background: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "rgba(16,185,129,0.1)" : r.status === "RUNNING" ? "rgba(239,68,68,0.1)" : r.status === "CANCELLED" ? "rgba(156,163,175,0.1)" : "rgba(245,158,11,0.1)",
                        color: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "#10b981" : r.status === "RUNNING" ? "#ef4444" : r.status === "CANCELLED" ? "#9ca3af" : "#f59e0b",
                        border: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "1px solid rgba(16,185,129,0.2)" : r.status === "RUNNING" ? "1px solid rgba(239,68,68,0.2)" : r.status === "CANCELLED" ? "1px solid rgba(156,163,175,0.2)" : "1px solid rgba(245,158,11,0.2)"
                      }}>
                        {r.status}
                      </span>
                      {r.status !== "CANCELLED" && r.status !== "OFFICIAL" && r.status !== "RACE_EVENT_ENDED" && (
                        <button
                          onClick={() => handleCancelRace(r.id)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "0.25rem",
                            fontSize: "10px",
                            fontFamily: "monospace",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Race detail grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="lg:grid-cols-3">
                    
                    {/* Referees */}
                    <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "1rem" }}>
                      <h5 style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>Assigned Referees</h5>
                      {item.referees && item.referees.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {item.referees.map((ref: any) => (
                            <div key={ref.id} style={{ padding: "0.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.25rem", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                              {ref.username}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>No referees assigned.</p>
                      )}
                    </div>

                    {/* Entries */}
                    <div className="lg:col-span-2">
                      <h5 style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>Racecard Entries</h5>
                      {item.entries && item.entries.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                                <th style={{ padding: "0.5rem 0.25rem", textAlign: "left" }}>Gate</th>
                                <th style={{ padding: "0.5rem", textAlign: "left" }}>Horse (Rating)</th>
                                <th style={{ padding: "0.5rem", textAlign: "left" }}>Jockey (Weight)</th>
                                <th style={{ padding: "0.5rem", textAlign: "right" }}>Carried Wt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.entries.map((entryInfo: any) => (
                                <tr key={entryInfo.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                  <td style={{ padding: "0.5rem 0.25rem", fontSize: "12px", fontFamily: "monospace", color: "#fff", fontWeight: "bold" }}>{entryInfo.gateNumber}</td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px" }}>
                                    <span style={{ color: "#fff", fontWeight: 500 }}>{entryInfo.horseName}</span>
                                    <span style={{ color: "#c9a227", fontSize: "10px", fontFamily: "monospace", marginLeft: "4px" }}>({entryInfo.horseRating})</span>
                                  </td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                                    <span>{entryInfo.jockeyName}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontFamily: "monospace", marginLeft: "4px" }}>({entryInfo.jockeyWeight}kg)</span>
                                  </td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px", fontFamily: "monospace", color: "#fff", textAlign: "right" }}>{entryInfo.carriedWeight} kg</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>No entries declared for this race yet.</p>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "2rem", fontSize: "12px", fontFamily: "monospace" }}>No scheduled events found for this meeting date.</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.005)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></span>
            <span>Timeline operational and scheduler enabled</span>
          </div>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>Last updated: Just now</p>
        </div>

      </div>

      {/* Schedule Race Modal */}
      {showScheduleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ background: "#111217", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "1rem", width: "100%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "16px", color: "#f4f2ec" }}>Schedule New Race</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleScheduleRaceSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Class Level</label>
                <select value={classLevel} onChange={e => setClassLevel(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }}>
                  <option value="Class 1 (Rating 95+)">Class 1 (Rating 95+)</option>
                  <option value="Class 2 (Rating 80-94)">Class 2 (Rating 80-94)</option>
                  <option value="Class 3 (Rating 60-79)">Class 3 (Rating 60-79)</option>
                  <option value="Class 4 (Rating 40-59)">Class 4 (Rating 40-59)</option>
                  <option value="Class 5 (Rating 0-39)">Class 5 (Rating 0-39)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Track Type</label>
                <select value={trackType} onChange={e => setTrackType(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }}>
                  <option value="Turf">Turf</option>
                  <option value="Dirt">Dirt</option>
                  <option value="Artificial">Artificial</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Start Time</label>
                <InlineDateTimePicker value={startTime} onChange={setStartTime} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Distance (Meters)</label>
                <input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Min Entries</label>
                  <input type="number" min="1" value={minEntries} onChange={e => setMinEntries(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Max Entries</label>
                  <input type="number" min="1" value={maxEntries} onChange={e => setMaxEntries(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>Purse Amount (USD)</label>
                <input type="number" min="1" value={purse} onChange={e => setPurse(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.375rem", color: "#a0a0a0", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0b0d11", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "11px", fontFamily: "monospace", fontWeight: 700 }}>Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.015)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "0.75rem",
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.4)",
};

const cardValStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#f4f2ec",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  marginTop: "0.25rem",
};

const cardSubStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.3)",
  marginTop: "0.5rem",
};

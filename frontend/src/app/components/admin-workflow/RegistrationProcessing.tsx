import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { parseSafeDate } from "../../utils/dateTimeHelper";

export default function RegistrationProcessing() {
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [pendingHorseRegs, setPendingHorseRegs] = useState<any[]>([]);
  const [pendingJockeyRegs, setPendingJockeyRegs] = useState<any[]>([]);
  const [pendingSystemHorses, setPendingSystemHorses] = useState<any[]>([]);

  const [awaitingDecisionCount, setAwaitingDecisionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatSimpleDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = parseSafeDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any>("/admin/pending-registrations");
      setPendingEntries(data.entriesData || []);
      setPendingHorseRegs(data.pendingHorseRegsData || []);
      setPendingJockeyRegs(data.pendingJockeyRegsData || []);
      setPendingSystemHorses(data.pendingSystemHorsesData || []);
      setAwaitingDecisionCount(data.awaitingDecisionCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // 1. Race Entries
  const handleEntryApprove = async (id: number) => {
    try {
      await api.post(`/admin/entries/${id}/approve`);
      showSuccess(`Approved race entry #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleEntryReject = async (id: number) => {
    try {
      await api.post(`/admin/entries/${id}/reject`);
      showSuccess(`Rejected race entry #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Reject failed: " + err.message);
    }
  };

  // 2. Horse Meeting Regs
  const handleHorseRegApprove = async (id: number) => {
    try {
      await api.post(`/admin/horse-reg/${id}/approve`);
      showSuccess(`Approved horse meeting registration #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleHorseRegReject = async (id: number) => {
    try {
      await api.post(`/admin/horse-reg/${id}/reject`);
      showSuccess(`Rejected horse meeting registration #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Reject failed: " + err.message);
    }
  };

  // 3. Jockey Meeting Regs
  const handleJockeyRegApprove = async (id: number) => {
    try {
      await api.post(`/admin/jockey-reg/${id}/approve`);
      showSuccess(`Approved jockey meeting registration #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleJockeyRegReject = async (id: number) => {
    try {
      await api.post(`/admin/jockey-reg/${id}/reject`);
      showSuccess(`Rejected jockey meeting registration #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Reject failed: " + err.message);
    }
  };

  // 4. System Horse Approvals (New Horses)
  const handleSystemHorseApprove = async (id: number) => {
    try {
      await api.post(`/admin/system-horse/${id}/approve`);
      showSuccess(`Approved system horse activation #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleSystemHorseReject = async (id: number) => {
    try {
      await api.post(`/admin/system-horse/${id}/reject`);
      showSuccess(`Rejected system horse activation #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Reject failed: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.5)", borderColor: "rgba(201,162,39,0.14)", padding: "1.25rem" }}>
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>Awaiting Decision</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#c9a227" }}>{awaitingDecisionCount}</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>pending review</p>
        </div>
        <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.5)", borderColor: "rgba(74,157,111,0.14)", padding: "1.25rem" }}>
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>Approved</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#4ade80" }}>-</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>cleared to race</p>
        </div>
        <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.5)", borderColor: "rgba(239,68,68,0.14)", padding: "1.25rem" }}>
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>Rejected</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#f87171" }}>-</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>entry denied</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "13px" }}>
          ✓ {success}
        </div>
      )}

      {/* 1. Pending Race Entries */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>Pending Race Entries & Predictions</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>Race meeting entry submissions awaiting steward approval</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Ref", "Horse & Rating", "Owner", "Assigned Jockey", "Target Race", "Carried Weight", "AI Win Chance", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 7 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
              ) : pendingEntries.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>No pending race entries found.</td></tr>
              ) : pendingEntries.map((e) => (
                <tr key={e.id} className="hover:bg-white/[0.015] transition-colors">
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>REG-{e.id}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.horseName}</div>
                    <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#c9a227", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", padding: "2px 6px", borderRadius: "3px", display: "inline-block", marginTop: "4px" }}>
                      ⭐ Rating: {e.rating}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{e.ownerName || `Owner #${e.ownerId}`}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "12px", fontWeight: "semibold", color: "#3b82c4" }}>{e.jockeyName}</div>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Weight: {e.carriedWeight} kg</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: "12px", color: "#fff", fontWeight: "semibold" }}>{e.meetingName || `Race #${e.raceId}`}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Distance: {e.distanceMeters}m ({e.trackType})</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{e.carriedWeight} kg</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: parseFloat(e.predictionScore) >= 70 ? "rgba(16,185,129,0.1)" : parseFloat(e.predictionScore) >= 40 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", color: parseFloat(e.predictionScore) >= 70 ? "#34d399" : parseFloat(e.predictionScore) >= 40 ? "#fbbf24" : "rgba(255,255,255,0.6)", border: `1px solid ${parseFloat(e.predictionScore) >= 70 ? "#34d39940" : parseFloat(e.predictionScore) >= 40 ? "#fbbf2440" : "transparent"}` }}>
                      {e.predictionScore}%
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button onClick={() => handleEntryReject(e.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                      <button onClick={() => handleEntryApprove(e.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Pending Horse Meeting Registrations */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>Pending Horse Meeting Registrations</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>Horse event entry submissions awaiting steward approval</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Ref", "Horse", "Owner", "Target Meeting", "Submitted", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 5 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
              ) : pendingHorseRegs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>No pending horse meeting registrations found.</td></tr>
              ) : pendingHorseRegs.map((e) => (
                <tr key={e.registration.id} className="hover:bg-white/[0.015] transition-colors">
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>REG-H-{e.registration.id}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.horse?.name}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Rating: {e.horse?.currentRating} | Breed: {e.horse?.breed}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{e.owner?.username}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>{e.meeting?.name}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{e.registration?.registeredAt}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button onClick={() => handleHorseRegReject(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                      <button onClick={() => handleHorseRegApprove(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Pending Jockey Meeting Registrations */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>Pending Jockey Meeting Registrations</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>Jockey availability sign-up submissions awaiting steward approval</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Ref", "Jockey", "Target Meeting", "Submitted", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 4 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
              ) : pendingJockeyRegs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>No pending jockey meeting registrations found.</td></tr>
              ) : pendingJockeyRegs.map((e) => (
                <tr key={e.registration.id} className="hover:bg-white/[0.015] transition-colors">
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>REG-J-{e.registration.id}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.jockey?.username}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Base weight: {e.jockey?.weight} kg</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>{e.meeting?.name}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{e.registration?.registeredAt}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button onClick={() => handleJockeyRegReject(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                      <button onClick={() => handleJockeyRegApprove(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Pending System Horse Approvals (New Horses) */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>Pending System Horse Approvals</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>New stable horses registered by Owners awaiting system activation</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Horse ID", "Horse Name", "Breed", "Owner", "Date of Birth", "Actions"].map((h, idx) => (
                  <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 5 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</td></tr>
              ) : pendingSystemHorses.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>No pending system horses found.</td></tr>
              ) : pendingSystemHorses.map((e) => (
                <tr key={e.horse.id} className="hover:bg-white/[0.015] transition-colors">
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>HORSE-{e.horse.id}</td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.horse.name}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{e.horse.breed}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{e.owner?.username}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{formatSimpleDate(e.horse.dateOfBirth)}</td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button onClick={() => handleSystemHorseReject(e.horse.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                      <button onClick={() => handleSystemHorseApprove(e.horse.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

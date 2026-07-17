import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { parseSafeDate } from "../../utils/dateTimeHelper";

export default function RegistrationProcessing() {
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [pendingHorseRegs, setPendingHorseRegs] = useState<any[]>([]);
  const [pendingJockeyRegs, setPendingJockeyRegs] = useState<any[]>([]);
  const [pendingOwnerRegs, setPendingOwnerRegs] = useState<any[]>([]);
  const [pendingSystemHorses, setPendingSystemHorses] = useState<any[]>([]);

  const [awaitingDecisionCount, setAwaitingDecisionCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
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
      setPendingOwnerRegs(data.pendingOwnerRegsData || []);
      setPendingSystemHorses(data.pendingSystemHorsesData || []);
      setAwaitingDecisionCount(data.awaitingDecisionCount || 0);
      setApprovedCount(data.approvedCount || 0);
      setRejectedCount(data.rejectedCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

  // 3.5. Owner Meeting Regs
  const handleOwnerRegApprove = async (id: number) => {
    try {
      await api.post(`/admin/owner-reg/${id}/approve`);
      showSuccess(`Approved owner meeting registration #${id}`);
      fetchData();
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handleOwnerRegReject = async (id: number) => {
    try {
      await api.post(`/admin/owner-reg/${id}/reject`);
      showSuccess(`Rejected owner meeting registration #${id}`);
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
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>{$t("Awaiting Decision", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#c9a227" }}>{awaitingDecisionCount}</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>{$t("pending review", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.5)", borderColor: "rgba(74,157,111,0.14)", padding: "1.25rem" }}>
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>{$t("Approved", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#4ade80" }}>{approvedCount}</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>{$t("cleared to race", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.5)", borderColor: "rgba(239,68,68,0.14)", padding: "1.25rem" }}>
          <p style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>{$t("Rejected", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <h3 style={{ fontSize: "1.75rem", fontWeight: "bold", fontFamily: "monospace", color: "#f87171" }}>{rejectedCount}</h3>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>{$t("entry denied", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Pending Race Entries & Predictions", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Race meeting entry submissions awaiting steward approval", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingEntries.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '12px' }}>{$t("No pending race entries found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingEntries.map((e) => (
              <div key={e.entry?.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* top row: ref + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a227' }}>REG-{e.entry?.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEntryReject(e.entry?.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✕ Reject</button>
                    <button onClick={() => handleEntryApprove(e.entry?.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✓ Approve</button>
                  </div>
                </div>
                {/* horse name + rating */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#f4f2ec', fontSize: '14px' }}>{e.horse?.name}</div>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#c9a227', background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', padding: '2px 6px', borderRadius: '3px', display: 'inline-block', marginTop: '4px' }}>⭐ Rating: {e.horse?.currentRating}</span>
                </div>
                {/* owner + jockey */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{$t("Owner:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{e.owner?.username || `Owner #${e.horse?.ownerId}`}</span></span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{$t("Jockey:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: '#3b82c4' }}>{e.jockey?.username}</span> <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>({e.jockey?.weight} kg)</span></span>
                </div>
                {/* race info */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span>{e.meeting?.name || `Race #${e.race?.id}`}</span>
                    {e.race?.classLevel && (
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 5px', borderRadius: '3px' }}>{e.race.classLevel}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Distance: {e.race?.distanceMeters}m ({e.race?.trackType})</div>
                </div>
                {/* weight + prediction */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>Carried: {e.entry?.carriedWeight} kg</span>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', background: parseFloat(e.predictionScore) >= 70 ? 'rgba(16,185,129,0.1)' : parseFloat(e.predictionScore) >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', color: parseFloat(e.predictionScore) >= 70 ? '#34d399' : parseFloat(e.predictionScore) >= 40 ? '#fbbf24' : 'rgba(255,255,255,0.6)', border: `1px solid ${parseFloat(e.predictionScore) >= 70 ? '#34d39940' : parseFloat(e.predictionScore) >= 40 ? '#fbbf2440' : 'transparent'}` }}>AI: {e.predictionScore}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Ref", "Horse & Rating", "Owner", "Assigned Jockey", "Target Race", "Carried Weight", "AI Win Chance", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 7 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingEntries.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No pending race entries found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingEntries.map((e) => (
                  <tr key={e.entry?.id} className="hover:bg-white/[0.015] transition-colors">
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>REG-{e.entry?.id}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.horse?.name}</div>
                      <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#c9a227", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", padding: "2px 6px", borderRadius: "3px", display: "inline-block", marginTop: "4px" }}>
                        ⭐ Rating: {e.horse?.currentRating}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{e.owner?.username || `Owner #${e.horse?.ownerId}`}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: "12px", fontWeight: "semibold", color: "#3b82c4" }}>{e.jockey?.username}</div>
                      <div style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Weight: {e.jockey?.weight} kg</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontSize: "12px", color: "#fff", fontWeight: "semibold", display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
                        <span>{e.meeting?.name || `Race #${e.race?.id}`}</span>
                        {e.race?.classLevel && (
                          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#fbbf24", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", padding: "1px 5px", borderRadius: "3px" }}>
                            {e.race.classLevel}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "3px" }}>Distance: {e.race?.distanceMeters}m ({e.race?.trackType})</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{e.entry?.carriedWeight} kg</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "10px", fontWeight: "bold", fontFamily: "monospace", background: parseFloat(e.predictionScore) >= 70 ? "rgba(16,185,129,0.1)" : parseFloat(e.predictionScore) >= 40 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)", color: parseFloat(e.predictionScore) >= 70 ? "#34d399" : parseFloat(e.predictionScore) >= 40 ? "#fbbf24" : "rgba(255,255,255,0.6)", border: `1px solid ${parseFloat(e.predictionScore) >= 70 ? "#34d39940" : parseFloat(e.predictionScore) >= 40 ? "#fbbf2440" : "transparent"}` }}>
                        {e.predictionScore}%
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => handleEntryReject(e.entry?.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                        <button onClick={() => handleEntryApprove(e.entry?.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Pending Horse Meeting Registrations */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Pending Horse Meeting Registrations", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Horse event entry submissions awaiting steward approval", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingHorseRegs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '12px' }}>{$t("No pending horse meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingHorseRegs.map((e) => (
              <div key={e.registration.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* top row: ref + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a227' }}>REG-H-{e.registration.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleHorseRegReject(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✕ Reject</button>
                    <button onClick={() => handleHorseRegApprove(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✓ Approve</button>
                  </div>
                </div>
                {/* horse name + rating/breed */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#f4f2ec', fontSize: '14px' }}>{e.horse?.name}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Rating: {e.horse?.currentRating} | Breed: {e.horse?.breed}</div>
                </div>
                {/* owner */}
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{$t("Owner:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{e.owner?.username}</span></div>
                {/* meeting */}
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f2ec', marginBottom: '0.25rem' }}>{e.meeting?.name}</div>
                {/* submitted */}
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>Submitted: {e.registration?.registeredAt}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Ref", "Horse", "Owner", "Target Meeting", "Submitted", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 5 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingHorseRegs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No pending horse meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
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
        )}
      </div>

      {/* 2.5. Pending Owner Meeting Registrations */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Pending Owner Meeting Registrations", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Horse Owner event registration requests awaiting steward approval", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingOwnerRegs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '12px' }}>{$t("No pending owner meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingOwnerRegs.map((e) => (
              <div key={e.registration.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* top row: ref + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a227' }}>REG-O-{e.registration.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOwnerRegReject(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✕ Reject</button>
                    <button onClick={() => handleOwnerRegApprove(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✓ Approve</button>
                  </div>
                </div>
                {/* owner username + email */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#f4f2ec', fontSize: '14px' }}>{e.owner?.username}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Email: {e.owner?.email}</div>
                </div>
                {/* meeting */}
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f2ec', marginBottom: '0.25rem' }}>{e.meeting?.name}</div>
                {/* submitted */}
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>Submitted: {e.registration?.registeredAt}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Ref", "Owner", "Target Meeting", "Submitted", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 4 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingOwnerRegs.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No pending owner meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingOwnerRegs.map((e) => (
                  <tr key={e.registration.id} className="hover:bg-white/[0.015] transition-colors">
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "12px", color: "#c9a227" }}>REG-O-{e.registration.id}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{e.owner?.username}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Email: {e.owner?.email}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>{e.meeting?.name}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{e.registration?.registeredAt}</td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button onClick={() => handleOwnerRegReject(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✕ Reject</button>
                        <button onClick={() => handleOwnerRegApprove(e.registration.id)} style={{ padding: "0.25rem 0.5rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>✓ Approve</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Pending Jockey Meeting Registrations */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Pending Jockey Meeting Registrations", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Jockey availability sign-up submissions awaiting steward approval", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingJockeyRegs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '12px' }}>{$t("No pending jockey meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingJockeyRegs.map((e) => (
              <div key={e.registration.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* top row: ref + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a227' }}>REG-J-{e.registration.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleJockeyRegReject(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✕ Reject</button>
                    <button onClick={() => handleJockeyRegApprove(e.registration.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✓ Approve</button>
                  </div>
                </div>
                {/* jockey username + weight */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#f4f2ec', fontSize: '14px' }}>{e.jockey?.username}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Base weight: {e.jockey?.weight} kg</div>
                </div>
                {/* meeting */}
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f2ec', marginBottom: '0.25rem' }}>{e.meeting?.name}</div>
                {/* submitted */}
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>Submitted: {e.registration?.registeredAt}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Ref", "Jockey", "Target Meeting", "Submitted", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 4 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingJockeyRegs.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No pending jockey meeting registrations found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
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
        )}
      </div>

      {/* 4. Pending System Horse Approvals (New Horses) */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(21,19,16,0.6)" }}>
          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Pending System Horse Approvals", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("New stable horses registered by Owners awaiting system activation", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingSystemHorses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '12px' }}>{$t("No pending system horses found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : pendingSystemHorses.map((e) => (
              <div key={e.horse.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
                {/* top row: ref + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#c9a227' }}>HORSE-{e.horse.id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleSystemHorseReject(e.horse.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✕ Reject</button>
                    <button onClick={() => handleSystemHorseApprove(e.horse.id)} style={{ padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '10px', fontFamily: 'monospace', borderRadius: '0.25rem', cursor: 'pointer' }}>✓ Approve</button>
                  </div>
                </div>
                {/* horse name */}
                <div style={{ fontWeight: 'bold', color: '#f4f2ec', fontSize: '14px', marginBottom: '0.5rem' }}>{e.horse.name}</div>
                {/* breed + owner */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '12px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{$t("Breed:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{e.horse.breed}</span></span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{$t("Owner:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: 'rgba(255,255,255,0.8)' }}>{e.owner?.username}</span></span>
                </div>
                {/* DOB */}
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>DOB: {formatSimpleDate(e.horse.dateOfBirth)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Horse ID", "Horse Name", "Breed", "Owner", "Date of Birth", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 5 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : pendingSystemHorses.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "12px" }}>{$t("No pending system horses found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
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
        )}
      </div>
    </div>
  );
}

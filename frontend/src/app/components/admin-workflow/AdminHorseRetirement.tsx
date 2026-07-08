import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface Request {
  id: number;
  horseId: number;
  horseName: string;
  ownerId: number;
  ownerName: string;
  reason: string;
  status: string;
  adminRemarks: string;
  createdAt: string;
  processedAt: string;
}

interface Horse {
  id: number;
  name: string;
  breed: string;
  ownerName: string;
  status: string;
}

export default function AdminHorseRetirement() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [requests, setRequests] = useState<Request[]>([]);
  const [activeHorses, setActiveHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Compulsory Retirement Form state
  const [selectedHorseId, setSelectedHorseId] = useState("");
  const [compulsoryReason, setCompulsoryReason] = useState("");

  // Process modal state
  const [processingRequest, setProcessingRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [reqList, horseList] = await Promise.all([
        api.get<Request[]>("/retirement/requests").catch(() => []),
        api.get<Horse[]>("/horses?status=ACTIVE").catch(() => []),
      ]);
      setRequests(reqList);
      setActiveHorses(horseList);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompulsoryRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHorseId || !compulsoryReason.trim()) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>("/retirement/compulsory", {
        horseId: parseInt(selectedHorseId),
        reason: compulsoryReason,
      });
      if (res.success) {
        setSuccess("Horse retired compulsorily successfully.");
        setSelectedHorseId("");
        setCompulsoryReason("");
        fetchData();
      } else {
        throw new Error(res.error || "Failed to retire horse.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to retire horse.");
    }
  };

  const handleProcessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingRequest || !actionType) return;
    setError("");
    setSuccess("");
    try {
      const endpoint = `/retirement/requests/${processingRequest.id}/${actionType === "APPROVE" ? "approve" : "reject"}`;
      const res = await api.post<any>(endpoint, { adminRemarks });
      if (res.success) {
        setSuccess(`Retirement request ${actionType.toLowerCase()}d successfully.`);
        setProcessingRequest(null);
        setActionType(null);
        setAdminRemarks("");
        fetchData();
      } else {
        throw new Error(res.error || "Failed to process request.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request.");
    }
  };

  const pendingRequests = requests.filter(r => r.status === "PENDING");
  const processedRequests = requests.filter(r => r.status !== "PENDING");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,162,39,0.22)",
    color: "#f4f2ec",
    borderRadius: "0.5rem",
    fontSize: "0.75rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.7rem",
    fontFamily: "monospace",
    textTransform: "uppercase",
    color: "#a0a0a0",
    marginBottom: "0.25rem",
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", fontFamily: "monospace" }}>❌ {error}</p>}
      {success && <p style={{ color: "#4ade80", fontSize: "0.8rem", fontFamily: "monospace" }}>✅ {success}</p>}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(260px,360px)", gap: "2rem", alignItems: "start" }}>
        {/* Left Column: Retirement Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", order: isMobile ? 2 : undefined }}>
          {/* Pending Requests */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>Pending Retirement Requests</h3>
            {loading ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem" }}>Loading requests...</p>
            ) : pendingRequests.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>No pending retirement requests.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingRequests.map(req => (
                  <div key={req.id} className="rounded-lg border" style={{ borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.02)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div>
                      <h4 style={{ color: "#f4f2ec", fontWeight: "bold", fontSize: "0.9rem" }}>{req.horseName}</h4>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.15rem" }}>Owner: <strong>{req.ownerName}</strong></p>
                      <p style={{ fontSize: "0.75rem", color: "#f4f2ec", marginTop: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "0.375rem" }}>
                        Reason: {req.reason}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => { setProcessingRequest(req); setActionType("APPROVE"); }} style={{ padding: "0.4rem 0.8rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>Approve</button>
                      <button onClick={() => { setProcessingRequest(req); setActionType("REJECT"); }} style={{ padding: "0.4rem 0.8rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Requests History */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "1rem" }}>Retirement History</h3>
            {processedRequests.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>No processed requests found.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left", fontFamily: "monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0" }}>
                      <th style={{ padding: "0.5rem" }}>Horse Name</th>
                      <th style={{ padding: "0.5rem" }}>Owner</th>
                      <th style={{ padding: "0.5rem" }}>Reason</th>
                      <th style={{ padding: "0.5rem" }}>Status</th>
                      <th style={{ padding: "0.5rem" }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map(req => (
                      <tr key={req.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.5rem", color: "#f4f2ec", fontWeight: "bold" }}>{req.horseName}</td>
                        <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.ownerName}</td>
                        <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.reason}</td>
                        <td style={{ padding: "0.5rem" }}>
                          <span style={{
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.65rem",
                            fontWeight: "bold",
                            background: req.status === "APPROVED" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                            color: req.status === "APPROVED" ? "#4ade80" : "#ef4444"
                          }}>{req.status}</span>
                        </td>
                        <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.adminRemarks || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Compulsory Retirement */}
        <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem", order: isMobile ? 1 : undefined }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>Compulsory Retirement</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1.25rem" }}>
            Forcibly retire any active horse from the HKJC circuit due to age (11+), rating limit (&le;25), injury, or behavioral safety issues.
          </p>
          <form onSubmit={handleCompulsoryRetire} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Select Active Horse</label>
              <select required value={selectedHorseId} onChange={e => setSelectedHorseId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">-- Select Horse --</option>
                {activeHorses.map(h => (
                  <option key={h.id} value={String(h.id)}>{h.name} ({h.breed}) - Owner: {h.ownerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Retirement Reason / Report</label>
              <textarea required value={compulsoryReason} onChange={e => setCompulsoryReason(e.target.value)} placeholder="E.g., Enforced retirement: Horse reached 11 years of age, or Rating dropped below 25 at end of season." style={{ ...inputStyle, height: "6rem", resize: "none" }} />
            </div>
            <button type="submit" disabled={!selectedHorseId || !compulsoryReason.trim()} style={{ width: "100%", padding: "0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer" }}>Enforce Retirement</button>
          </form>
        </div>
      </div>

      {/* Review Modal */}
      {processingRequest && actionType && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#121010", border: `1px solid ${actionType === "APPROVE" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "26rem", position: "relative" }}>
            <button onClick={() => { setProcessingRequest(null); setActionType(null); setAdminRemarks(""); }} style={{ position: "absolute", right: "1rem", top: "1rem", background: "transparent", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", marginBottom: "0.5rem" }}>
              {actionType === "APPROVE" ? "Approve Retirement" : "Reject Retirement"}
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1rem" }}>
              {actionType === "APPROVE"
                ? `Are you sure you want to approve the retirement for ${processingRequest.horseName}? This horse will be permanently marked as RETIRED.`
                : `Are you sure you want to reject the retirement for ${processingRequest.horseName}? The horse will remain active.`}
            </p>
            <form onSubmit={handleProcessRequest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Admin Remarks</label>
                <textarea required value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} placeholder="Provide any comments or instructions..." style={{ ...inputStyle, height: "5rem", resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setProcessingRequest(null); setActionType(null); setAdminRemarks(""); }} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: actionType === "APPROVE" ? "#4ade80" : "#ef4444", color: actionType === "APPROVE" ? "#0e0c09" : "#fff", border: "none", borderRadius: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                  Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

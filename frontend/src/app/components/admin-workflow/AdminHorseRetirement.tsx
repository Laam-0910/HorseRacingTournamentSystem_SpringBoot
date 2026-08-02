import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

// Định nghĩa cấu trúc dữ liệu yêu cầu giải nghệ ngựa của Chủ ngựa
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

// Định nghĩa cấu trúc dữ liệu thô của Chiến mã
interface Horse {
  id: number;
  name: string;
  breed: string;
  ownerName: string;
  status: string;
}

/**
 * Component AdminHorseRetirement - Phân hệ giải nghệ ngựa dành cho Admin.
 * Hỗ trợ Admin duyệt các đơn đề xuất giải nghệ do chủ ngựa nộp lên (chấp thuận/từ chối),
 * hoặc thực hiện giải nghệ bắt buộc (compulsory retirement) đối với các ngựa quá tuổi (11+ tuổi),
 * rating quá thấp (<25), hoặc gặp chấn thương nghiêm trọng.
 */
export default function AdminHorseRetirement() {
  // Trạng thái Responsive Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // State lưu danh sách đơn giải nghệ từ API
  const [requests, setRequests] = useState<Request[]>([]);
  // State lưu danh sách tất cả ngựa đang hoạt động (ACTIVE) để điền vào select box của form bắt buộc giải nghệ
  const [activeHorses, setActiveHorses] = useState<Horse[]>([]);
  // Trạng thái chờ gọi API
  const [loading, setLoading] = useState(true);
  // Banner thông báo lỗi / thành công
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State quản lý Form giải nghệ bắt buộc
  const [selectedHorseId, setSelectedHorseId] = useState(""); // ID chiến mã bị bắt buộc giải nghệ
  const [compulsoryReason, setCompulsoryReason] = useState(""); // Lý do bắt buộc (quá tuổi, chấn thương...)

  // State quản lý Modal xử lý phê duyệt đơn giải nghệ đang chọn
  const [processingRequest, setProcessingRequest] = useState<Request | null>(null); // Đơn đang xử lý
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null); // Hành động duyệt hay từ chối
  const [adminRemarks, setAdminRemarks] = useState(""); // Lời ghi chú phê duyệt của Admin

  // Hàm tải dữ liệu yêu cầu giải nghệ và danh sách ngựa ACTIVE từ API backend
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
      setError(getErrMsg(err, "Failed to load data."));
    } finally {
      setLoading(false);
    }
  };

  // effect tự động chạy 1 lần khi component được render
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý gửi biểu mẫu cưỡng chế giải nghệ ngựa
  const handleCompulsoryRetire = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt reload trang
    if (!selectedHorseId || !compulsoryReason.trim()) return;
    setError("");
    setSuccess("");
    try {
      // Gọi API gửi yêu cầu giải nghệ bắt buộc
      const res = await api.post<any>("/retirement/compulsory", {
        horseId: parseInt(selectedHorseId),
        reason: compulsoryReason,
      });
      if (res.success) {
        setSuccess("Horse retired compulsorily successfully.");
        setSelectedHorseId("");
        setCompulsoryReason("");
        fetchData(); // Tải lại danh sách
      } else {
        throw new Error(res.error || "Failed to retire horse.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to retire horse."));
    }
  };

  // Xử lý gửi biểu mẫu Phê duyệt / Từ chối đơn giải nghệ tự nguyện của chủ ngựa
  const handleProcessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingRequest || !actionType) return;
    setError("");
    setSuccess("");
    try {
      // Đường dẫn API động thay đổi tùy theo duyệt APPROVE hay từ chối REJECT
      const endpoint = `/retirement/requests/${processingRequest.id}/${actionType === "APPROVE" ? "approve" : "reject"}`;
      const res = await api.post<any>(endpoint, { adminRemarks });
      if (res.success) {
        setSuccess(`Retirement request ${actionType.toLowerCase()}d successfully.`);
        setProcessingRequest(null);
        setActionType(null);
        setAdminRemarks("");
        fetchData(); // Tải lại danh sách cập nhật mới nhất
      } else {
        throw new Error(res.error || "Failed to process request.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to process request."));
    }
  };

  // Lọc tách đơn đang chờ xử lý (PENDING) và đơn đã xử lý xong
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
      {/* Thông báo lỗi nếu có */}
      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", fontFamily: "monospace" }}>❌ {error}</p>}
      
      {/* Thông báo thành công nếu có */}
      {success && <p style={{ color: "#4ade80", fontSize: "0.8rem", fontFamily: "monospace" }}>✅ {success}</p>}

      {/* Grid chia làm 2 cột: Danh sách đơn giải nghệ (Trái) & Form cưỡng chế giải nghệ (Phải) */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(260px,360px)", gap: "2rem", alignItems: "start" }}>
        
        {/* Cột trái: Quản lý các đơn yêu cầu giải nghệ từ Chủ ngựa */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", order: isMobile ? 2 : undefined }}>
          
          {/* Card: Các đơn yêu cầu giải nghệ ĐANG CHỜ PHÊ DUYỆT */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Pending Retirement Requests", (localStorage.getItem('app-lang') || 'en'))}</h3>
            {loading ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem" }}>{$t("Loading requests...", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : pendingRequests.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>{$t("No pending retirement requests.", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingRequests.map(req => (
                  <div key={req.id} className="rounded-lg border" style={{ borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.02)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div>
                      <h4 style={{ color: "#f4f2ec", fontWeight: "bold", fontSize: "0.9rem" }}>{req.horseName}</h4>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.15rem" }}>{$t("Owner:", (localStorage.getItem('app-lang') || 'en'))}<strong>{req.ownerName}</strong></p>
                      <p style={{ fontSize: "0.75rem", color: "#f4f2ec", marginTop: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "0.375rem" }}>
                        Reason: {req.reason}
                      </p>
                    </div>
                    {/* Cặp nút phê duyệt / từ chối đơn giải nghệ */}
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => { setProcessingRequest(req); setActionType("APPROVE"); }} style={{ padding: "0.4rem 0.8rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>{$t("Approve", (localStorage.getItem('app-lang') || 'en'))}</button>
                      <button onClick={() => { setProcessingRequest(req); setActionType("REJECT"); }} style={{ padding: "0.4rem 0.8rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>{$t("Reject", (localStorage.getItem('app-lang') || 'en'))}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Lịch sử các đơn giải nghệ ĐÃ ĐƯỢC DUYỆT / TỪ CHỐI */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Retirement History", (localStorage.getItem('app-lang') || 'en'))}</h3>
            {processedRequests.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>{$t("No processed requests found.", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left", fontFamily: "monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0" }}>
                      <th style={{ padding: "0.5rem" }}>{$t("Horse Name", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Owner", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Reason", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Status", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Remarks", (localStorage.getItem('app-lang') || 'en'))}</th>
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

        {/* Cột phải: Form cưỡng chế giải nghệ ngựa (Compulsory Retirement) */}
        <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem", order: isMobile ? 1 : undefined }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Compulsory Retirement", (localStorage.getItem('app-lang') || 'en'))}</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1.25rem" }}>
            Forcibly retire any active horse from the HKJC circuit due to age (11+), rating limit (&le;25), injury, or behavioral safety issues.
          </p>
          <form onSubmit={handleCompulsoryRetire} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Mục chọn ngựa đang hoạt động (ACTIVE) */}
            <div>
              <label style={labelStyle}>{$t("Select Active Horse", (localStorage.getItem('app-lang') || 'en'))}</label>
              <select required value={selectedHorseId} onChange={e => setSelectedHorseId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">{$t("-- Select Horse --", (localStorage.getItem('app-lang') || 'en'))}</option>
                {activeHorses.map(h => (
                  <option key={h.id} value={String(h.id)}>{h.name} ({h.breed}) - Owner: {h.ownerName}</option>
                ))}
              </select>
            </div>
            {/* Nhập lý do cưỡng chế giải nghệ */}
            <div>
              <label style={labelStyle}>{$t("Retirement Reason / Report", (localStorage.getItem('app-lang') || 'en'))}</label>
              <textarea required value={compulsoryReason} onChange={e => setCompulsoryReason(e.target.value)} placeholder={$t("E.g., Enforced retirement: Horse reached 11 years of age, or Rating dropped below 25 at end of season.", (localStorage.getItem('app-lang') || 'en'))} style={{ ...inputStyle, height: "6rem", resize: "none" }} />
            </div>
            <button type="submit" disabled={!selectedHorseId || !compulsoryReason.trim()} style={{ width: "100%", padding: "0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer" }}>{$t("Enforce Retirement", (localStorage.getItem('app-lang') || 'en'))}</button>
          </form>
        </div>
      </div>

      {/* Modal xác nhận phê duyệt đơn (Review Modal) */}
      {processingRequest && actionType && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#121010", border: `1px solid ${actionType === "APPROVE" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "1rem", padding: "1.5rem", width: "100%", maxWidth: "26rem", position: "relative" }}>
            {/* Nút đóng Modal */}
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
              {/* Nhập nhận xét phê duyệt của Admin */}
              <div>
                <label style={labelStyle}>{$t("Admin Remarks", (localStorage.getItem('app-lang') || 'en'))}</label>
                <textarea required value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} placeholder={$t("Provide any comments or instructions...", (localStorage.getItem('app-lang') || 'en'))} style={{ ...inputStyle, height: "5rem", resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => { setProcessingRequest(null); setActionType(null); setAdminRemarks(""); }} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'en'))}</button>
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

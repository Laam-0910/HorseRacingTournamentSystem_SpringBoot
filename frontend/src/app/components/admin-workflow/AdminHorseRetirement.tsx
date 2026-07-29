import { $t } from "../../../lib/i18n"; // Import hàm đa ngôn ngữ $t
import { useState, useEffect } from "react"; // Import các hook của React
import { api } from "../../../lib/api"; // Import đối tượng api để gọi HTTP request

interface Request { // Khai báo interface cho Yêu cầu giải nghệ
  id: number; // ID của yêu cầu
  horseId: number; // ID của ngựa
  horseName: string; // Tên ngựa
  ownerId: number; // ID của chủ ngựa
  ownerName: string; // Tên chủ ngựa
  reason: string; // Lý do giải nghệ
  status: string; // Trạng thái của yêu cầu
  adminRemarks: string; // Ghi chú của quản trị viên
  createdAt: string; // Thời gian tạo
  processedAt: string; // Thời gian xử lý
}

interface Horse { // Khai báo interface cho Ngựa
  id: number; // ID ngựa
  name: string; // Tên ngựa
  breed: string; // Giống ngựa
  ownerName: string; // Tên chủ ngựa
  status: string; // Trạng thái của ngựa
}

export default function AdminHorseRetirement() { // Component chính quản lý giải nghệ ngựa cho Admin
  const [isMobile, setIsMobile] = useState(false); // State kiểm tra màn hình mobile
  useEffect(() => { // Hook chạy 1 lần khi component mount
    const handleResize = () => { // Hàm xử lý khi thay đổi kích thước màn hình
      setIsMobile(window.innerWidth < 768); // Cập nhật state isMobile nếu chiều rộng nhỏ hơn 768px
    };
    handleResize(); // Gọi hàm lần đầu để set giá trị ban đầu
    window.addEventListener("resize", handleResize); // Lắng nghe sự kiện thay đổi kích thước cửa sổ
    return () => window.removeEventListener("resize", handleResize); // Dọn dẹp sự kiện khi component unmount
  }, []); // Mảng rỗng đảm bảo chỉ chạy 1 lần

  const [requests, setRequests] = useState<Request[]>([]); // State lưu danh sách yêu cầu giải nghệ
  const [activeHorses, setActiveHorses] = useState<Horse[]>([]); // State lưu danh sách ngựa đang hoạt động
  const [loading, setLoading] = useState(true); // State theo dõi trạng thái tải dữ liệu
  const [error, setError] = useState(""); // State lưu thông báo lỗi
  const [success, setSuccess] = useState(""); // State lưu thông báo thành công

  // Compulsory Retirement Form state
  const [selectedHorseId, setSelectedHorseId] = useState(""); // State lưu ID ngựa được chọn để bắt buộc giải nghệ
  const [compulsoryReason, setCompulsoryReason] = useState(""); // State lưu lý do bắt buộc giải nghệ

  // Process modal state
  const [processingRequest, setProcessingRequest] = useState<Request | null>(null); // State lưu yêu cầu đang được duyệt
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null); // State lưu loại hành động: Duyệt hoặc Từ chối
  const [adminRemarks, setAdminRemarks] = useState(""); // State lưu ghi chú của admin khi duyệt/từ chối

  const fetchData = async () => { // Hàm gọi API lấy dữ liệu
    setLoading(true); // Đặt trạng thái đang tải
    setError(""); // Xóa lỗi cũ
    try {
      const [reqList, horseList] = await Promise.all([ // Gọi 2 API song song
        api.get<Request[]>("/retirement/requests").catch(() => []), // Lấy danh sách yêu cầu, nếu lỗi trả về mảng rỗng
        api.get<Horse[]>("/horses?status=ACTIVE").catch(() => []), // Lấy danh sách ngựa đang hoạt động, nếu lỗi trả về mảng rỗng
      ]);
      setRequests(reqList); // Cập nhật state danh sách yêu cầu
      setActiveHorses(horseList); // Cập nhật state danh sách ngựa
    } catch (err: any) { // Bắt lỗi nếu có
      setError(err.message || "Failed to load data."); // Hiển thị lỗi
    } finally { // Luôn thực thi phần này
      setLoading(false); // Tắt trạng thái đang tải
    }
  };

  useEffect(() => { // Hook để gọi fetchData khi component hiển thị
    fetchData(); // Gọi hàm lấy dữ liệu
  }, []); // Chạy 1 lần duy nhất

  const handleCompulsoryRetire = async (e: React.FormEvent) => { // Hàm xử lý khi submit form ép buộc giải nghệ
    e.preventDefault(); // Chặn hành vi mặc định của form
    if (!selectedHorseId || !compulsoryReason.trim()) return; // Dừng lại nếu chưa chọn ngựa hoặc thiếu lý do
    setError(""); // Xóa lỗi cũ
    setSuccess(""); // Xóa thông báo thành công cũ
    try {
      const res = await api.post<any>("/retirement/compulsory", { // Gửi request ép buộc giải nghệ
        horseId: parseInt(selectedHorseId), // Truyền ID ngựa đã chọn (chuyển sang số)
        reason: compulsoryReason, // Truyền lý do
      });
      if (res.success) { // Nếu API báo thành công
        setSuccess("Horse retired compulsorily successfully."); // Hiển thị thông báo thành công
        setSelectedHorseId(""); // Reset ID ngựa đã chọn
        setCompulsoryReason(""); // Reset lý do
        fetchData(); // Lấy lại dữ liệu mới nhất
      } else { // Nếu API báo thất bại
        throw new Error(res.error || "Failed to retire horse."); // Ném ra lỗi
      }
    } catch (err: any) { // Bắt lỗi
      setError(err.message || "Failed to retire horse."); // Cập nhật state lỗi
    }
  };

  const handleProcessRequest = async (e: React.FormEvent) => { // Hàm xử lý duyệt hoặc từ chối yêu cầu
    e.preventDefault(); // Ngăn hành vi reload trang của form
    if (!processingRequest || !actionType) return; // Nếu chưa có dữ liệu yêu cầu hoặc hành động, dừng lại
    setError(""); // Xóa lỗi cũ
    setSuccess(""); // Xóa thông báo thành công cũ
    try {
      const endpoint = `/retirement/requests/${processingRequest.id}/${actionType === "APPROVE" ? "approve" : "reject"}`; // Tạo đường dẫn API tương ứng với hành động
      const res = await api.post<any>(endpoint, { adminRemarks }); // Gửi request kèm theo ghi chú của admin
      if (res.success) { // Nếu thành công
        setSuccess(`Retirement request ${actionType.toLowerCase()}d successfully.`); // Báo thành công
        setProcessingRequest(null); // Đóng modal
        setActionType(null); // Reset hành động
        setAdminRemarks(""); // Reset ghi chú
        fetchData(); // Load lại dữ liệu
      } else { // Nếu thất bại
        throw new Error(res.error || "Failed to process request."); // Ném ra lỗi
      }
    } catch (err: any) { // Xử lý lỗi
      setError(err.message || "Failed to process request."); // Hiển thị lỗi
    }
  };

  const pendingRequests = requests.filter(r => r.status === "PENDING"); // Lọc ra các yêu cầu đang chờ xử lý
  const processedRequests = requests.filter(r => r.status !== "PENDING"); // Lọc ra các yêu cầu đã xử lý

  const inputStyle: React.CSSProperties = { // Khai báo style dùng chung cho các input/textarea
    width: "100%", // Rộng 100%
    padding: "0.625rem", // Căn lề trong
    background: "rgba(255,255,255,0.05)", // Màu nền mờ
    border: "1px solid rgba(201,162,39,0.22)", // Viền màu vàng
    color: "#f4f2ec", // Màu chữ trắng sáng
    borderRadius: "0.5rem", // Bo góc
    fontSize: "0.75rem", // Kích thước chữ
    outline: "none", // Bỏ viền outline mặc định
  };

  const labelStyle: React.CSSProperties = { // Khai báo style dùng chung cho các label
    fontSize: "0.7rem", // Kích thước chữ
    fontFamily: "monospace", // Phông chữ monospace
    textTransform: "uppercase", // In hoa
    color: "#a0a0a0", // Màu chữ xám
    marginBottom: "0.25rem", // Cách dưới 1 chút
    display: "block", // Hiển thị dạng khối
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Hiển thị lỗi hoặc thành công nếu có */}
      {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", fontFamily: "monospace" }}>❌ {error}</p>}
      {success && <p style={{ color: "#4ade80", fontSize: "0.8rem", fontFamily: "monospace" }}>✅ {success}</p>}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr minmax(260px,360px)", gap: "2rem", alignItems: "start" }}>
        {/* Left Column: Retirement Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", order: isMobile ? 2 : undefined }}>
          {/* Pending Requests */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Pending Retirement Requests", (localStorage.getItem('app-lang') || 'vi'))}</h3>
            {loading ? ( // Nếu đang load
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem" }}>{$t("Loading requests...", (localStorage.getItem('app-lang') || 'vi'))}</p>
            ) : pendingRequests.length === 0 ? ( // Nếu không có yêu cầu nào
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>{$t("No pending retirement requests.", (localStorage.getItem('app-lang') || 'vi'))}</p>
            ) : ( // Nếu có yêu cầu, lặp qua mảng pendingRequests
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingRequests.map(req => (
                  <div key={req.id} className="rounded-lg border" style={{ borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.02)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div>
                      <h4 style={{ color: "#f4f2ec", fontWeight: "bold", fontSize: "0.9rem" }}>{req.horseName}</h4>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.15rem" }}>{$t("Owner:", (localStorage.getItem('app-lang') || 'vi'))}<strong>{req.ownerName}</strong></p>
                      <p style={{ fontSize: "0.75rem", color: "#f4f2ec", marginTop: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.5rem", borderRadius: "0.375rem" }}>
                        Reason: {req.reason}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {/* Nút Chấp thuận */}
                      <button onClick={() => { setProcessingRequest(req); setActionType("APPROVE"); }} style={{ padding: "0.4rem 0.8rem", background: "#4ade80", color: "#0e0c09", border: "none", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>{$t("Approve", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      {/* Nút Từ chối */}
                      <button onClick={() => { setProcessingRequest(req); setActionType("REJECT"); }} style={{ padding: "0.4rem 0.8rem", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.375rem", fontSize: "0.7rem", fontWeight: "bold", cursor: "pointer" }}>{$t("Reject", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed Requests History */}
          <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Retirement History", (localStorage.getItem('app-lang') || 'vi'))}</h3>
            {processedRequests.length === 0 ? ( // Nếu không có lịch sử
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.75rem", fontFamily: "monospace" }}>{$t("No processed requests found.", (localStorage.getItem('app-lang') || 'vi'))}</p>
            ) : ( // Hiển thị bảng lịch sử
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left", fontFamily: "monospace" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0" }}>
                      <th style={{ padding: "0.5rem" }}>{$t("Horse Name", (localStorage.getItem('app-lang') || 'vi'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Owner", (localStorage.getItem('app-lang') || 'vi'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Reason", (localStorage.getItem('app-lang') || 'vi'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Status", (localStorage.getItem('app-lang') || 'vi'))}</th>
                      <th style={{ padding: "0.5rem" }}>{$t("Remarks", (localStorage.getItem('app-lang') || 'vi'))}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRequests.map(req => ( // Lặp qua danh sách đã xử lý
                      <tr key={req.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.5rem", color: "#f4f2ec", fontWeight: "bold" }}>{req.horseName}</td>
                        <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.ownerName}</td>
                        <td style={{ padding: "0.5rem", color: "#a0a0a0" }}>{req.reason}</td>
                        <td style={{ padding: "0.5rem" }}>
                          <span style={{ // Đổi màu status tùy theo trạng thái
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
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.2rem", color: "#f4f2ec", marginBottom: "1rem" }}>{$t("Compulsory Retirement", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginBottom: "1.25rem" }}>
            Forcibly retire any active horse from the HKJC circuit due to age (11+), rating limit (&le;25), injury, or behavioral safety issues.
          </p>
          <form onSubmit={handleCompulsoryRetire} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>{$t("Select Active Horse", (localStorage.getItem('app-lang') || 'vi'))}</label>
              <select required value={selectedHorseId} onChange={e => setSelectedHorseId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">{$t("-- Select Horse --", (localStorage.getItem('app-lang') || 'vi'))}</option>
                {activeHorses.map(h => ( // Hiển thị danh sách ngựa hoạt động
                  <option key={h.id} value={String(h.id)}>{h.name} ({h.breed}) - Owner: {h.ownerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{$t("Retirement Reason / Report", (localStorage.getItem('app-lang') || 'vi'))}</label>
              {/* Textarea để nhập lý do ép buộc */}
              <textarea required value={compulsoryReason} onChange={e => setCompulsoryReason(e.target.value)} placeholder={$t("E.g., Enforced retirement: Horse reached 11 years of age, or Rating dropped below 25 at end of season.", (localStorage.getItem('app-lang') || 'vi'))} style={{ ...inputStyle, height: "6rem", resize: "none" }} />
            </div>
            <button type="submit" disabled={!selectedHorseId || !compulsoryReason.trim()} style={{ width: "100%", padding: "0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: "bold", fontSize: "0.75rem", cursor: "pointer" }}>{$t("Enforce Retirement", (localStorage.getItem('app-lang') || 'vi'))}</button>
          </form>
        </div>
      </div>

      {/* Review Modal - Hiển thị popup để duyệt/từ chối */}
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
                <label style={labelStyle}>{$t("Admin Remarks", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <textarea required value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} placeholder={$t("Provide any comments or instructions...", (localStorage.getItem('app-lang') || 'vi'))} style={{ ...inputStyle, height: "5rem", resize: "none" }} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                {/* Nút hủy */}
                <button type="button" onClick={() => { setProcessingRequest(null); setActionType(null); setAdminRemarks(""); }} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid #2a2825", borderRadius: "0.5rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
                {/* Nút xác nhận */}
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

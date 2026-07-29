import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

// Cấu trúc dữ liệu của Ngày hội đua
interface Meeting {
  id: number;
  name: string;
  venue: string;
  startDate: string;
  totalBudget: number;
}

// Cấu trúc dữ liệu của Cuộc đua
interface Race {
  id: number;
  raceMeetingId: number;
  startTime: string;
  purse: number;
  status: string;
  classLevel: string;
  distanceMeters: number;
}

// Cấu trúc dữ liệu Quy chế phân hạng và tiền thưởng
interface ClassRule {
  id: number;
  classLevel: string;
  className: string;
  minRating: number;
  maxRating?: number;
  minPrize: number;
  maxPrize: number;
}

// Cấu trúc dữ liệu lượt đăng ký thi đấu của ngựa đua
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
 * Component Results - Phân hệ Xử lý và công bố kết quả trận đua dành cho Admin.
 * - Hiển thị danh sách các trận đua đã chạy xong (FINISHED, STEWARDS_INQUIRY...) cần được đóng biên bản.
 * - Cho phép nhập cân đo sau trận (Weigh-In), thứ tự về đích (Final Position), thời gian hoàn thành (Finish Time),
 *   và biên bản ghi nhận của trọng tài.
 * - Gửi xác nhận đóng kết quả chính thức và phân phối tiền thưởng (Prize money) thông qua API /results/confirm.
 */
export default function Results() {
  // Trạng thái Responsive Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Các state lưu dữ liệu tổng quát kéo về khi mount
  const [meetings, setMeetings] = useState<Meeting[]>([]); // Các ngày hội đua
  const [races, setRaces] = useState<Race[]>([]); // Danh sách cuộc đua cần xử lý đóng biên bản
  const [classRules, setClassRules] = useState<ClassRule[]>([]); // Quy tắc phân hạng mùa giải
  const [loading, setLoading] = useState(true);
  // Banner thông báo lỗi / thành công
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Chế độ Xử lý kết quả (Processing Mode) ---
  const [processingRace, setProcessingRace] = useState<Race | null>(null); // Trận đua đang được xử lý nhập kết quả
  const [entries, setEntries] = useState<RaceEntry[]>([]); // Danh sách ngựa tham gia trận đua đang xử lý
  const [positions, setPositions] = useState<Record<number, string>>({}); // Thứ hạng về đích tương ứng của từng ngựa
  const [times, setTimes] = useState<Record<number, string>>({}); // Thời gian về đích tương ứng
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({}); // Cân nặng đo lại sau trận tương ứng
  const [stewardReport, setStewardReport] = useState(""); // Ghi chú sự cố của Trọng tài
  const [procLoading, setProcLoading] = useState(false); // Đợi xử lý API results/confirm

  // Tải đồng bộ danh sách ngày hội đua, tất cả các cuộc đua, và luật phân hạng của mùa giải
  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsData, racesData, rulesData] = await Promise.all([
        api.get<Meeting[]>("/public/meetings").catch(() => []),
        api.get<Race[]>("/races").catch(() => []),
        // Tạm thời lấy luật phân hạng của mùa giải số 1 làm tham chiếu mặc định
        api.get<ClassRule[]>("/races/seasons/1/rules").catch(() => []),
      ]);
      setMeetings(meetingsData);
      
      // Chỉ giữ lại các cuộc đua có trạng thái đã kết thúc hoặc đang thẩm vấn (không hiển thị các trận chưa chạy hoặc đã khóa kết quả chính thức)
      const ineligibleStatuses = ["SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED", "RACE_ASSIGNED", "OFFICIAL", "CANCELLED"];
      setRaces((racesData || []).filter(r => !ineligibleStatuses.includes(r.status)));
      setClassRules(rulesData);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // effect gọi API tải dữ liệu thô ban đầu
  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý khi Admin nhấn nút "Process" để bắt đầu nhập bảng kết quả về đích của một trận đấu
  const handleStartProcess = async (race: Race) => {
    setError("");
    setSuccess("");
    setProcLoading(true);
    try {
      // Tải danh sách ngựa tham gia và thông tin cân đo ban đầu của trận đua
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
      setStewardReport(""); // Reset báo cáo sự cố

      // Khởi tạo các ô nhập liệu (mặc định cân nặng sau trận bằng cân nặng trước trận)
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
      setError("Failed to load race entries: " + err.message);
    } finally {
      setProcLoading(false);
    }
  };

  // Xử lý gửi biểu mẫu xác nhận và chốt kết quả cuộc đua lên máy chủ
  const handleConfirmResults = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt reload trang
    if (!processingRace) return;
    setError("");
    setSuccess("");
    setProcLoading(true);

    try {
      // Chuẩn bị payload danh sách kết quả sau khi kiểm tra ràng buộc đầu vào
      const resultsPayload = entries.map(e => {
        const pos = parseInt(positions[e.entryId]);
        const time = times[e.entryId];
        const wIn = parseFloat(weighInWeights[e.entryId]);

        // Kiểm tra vị trí về đích hợp lệ
        if (isNaN(pos) || pos <= 0) {
          throw new Error(`Invalid position for horse ${e.horseName}`);
        }
        const isVi = (localStorage.getItem("app-lang") || "vi") === "vi";
        
        // Kiểm tra thời gian về đích bắt buộc phải nhập
        if (!time) {
          throw new Error(`Finish time is required for horse ${e.horseName}`);
        }
        
        // Ràng buộc định dạng thời gian về đích phải ở dạng MM:SS hoặc MM:SS.ms (phút:giây.mili)
        if (e.status !== "DISQUALIFIED" && !/^\d+:\d+(\.\d+)?$/.test(time.trim())) {
          throw new Error(isVi 
            ? `Thời gian của ngựa "${e.horseName}" phải nhập đúng định dạng phút:giây (ví dụ 1:48.35 hoặc 1:48), không được nhập số thường hay có dấu phẩy.`
            : `Finishing time for horse "${e.horseName}" must be in the format MM:SS or MM:SS.ms (e.g. 1:48.35 or 1:48).`);
        }
        
        // Kiểm tra cân nặng đo lại sau trận
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

      // Gửi POST xác nhận kết quả cuối cùng lên endpoint /results/confirm
      const res = await api.post<any>("/results/confirm", {
        raceId: processingRace.id,
        stewardReport,
        results: resultsPayload,
      });

      if (res.success) {
        setSuccess("Results successfully processed and race is closed.");
        setProcessingRace(null); // Thoát chế độ nhập kết quả
        fetchData(); // Tải lại danh sách
      } else {
        throw new Error(res.error || "Failed to process results.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit results.");
    } finally {
      setProcLoading(false);
    }
  };

  // --- GIAO DIỆN 1: ĐANG NHẬP BẢNG KẾT QUẢ CHO TRẬN ĐUA (Processing Mode) ---
  if (processingRace) {
    return (
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        {/* Header nhập liệu */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.1)" }}>
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>Process Results: Race #{processingRace.id} ({processingRace.classLevel})</h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{$t("Enter final position, finish times, and weigh-in weights for each horse.", (localStorage.getItem('app-lang') || 'vi'))}</p>
          </div>
          <button onClick={() => setProcessingRace(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <form onSubmit={handleConfirmResults} style={{ padding: "1.5rem" }}>
          {/* Banner lỗi nếu xảy ra sự cố */}
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px", marginBottom: "1rem" }}>{error}</div>}

          {isMobile ? (
            // Layout dạng thẻ cho thiết bị di động
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
                    {/* Ô nhập cân nặng đo lại */}
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Weigh-In (kg)", (localStorage.getItem('app-lang') || 'vi'))}</label>
                      <input type="number" step="0.1" value={weighInWeights[e.entryId] || ""} onChange={val => setWeighInWeights(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                    {/* Ô nhập thứ hạng */}
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Pos", (localStorage.getItem('app-lang') || 'vi'))}</label>
                      <input type="number" min="1" value={positions[e.entryId] || ""} onChange={val => setPositions(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                    {/* Ô nhập thời gian chạy */}
                    <div>
                      <label style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: "4px" }}>{$t("Finish Time", (localStorage.getItem('app-lang') || 'vi'))}</label>
                      <input type="text" placeholder={$t("1:12.45", (localStorage.getItem('app-lang') || 'vi'))} value={times[e.entryId] || ""} onChange={val => setTimes(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Bố cục Bảng biểu chi tiết cho màn hình lớn Desktop
            <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                    {["Gate", "Horse Name", "Jockey Name", "Carried Wt", "Weigh-In Wt (kg)", "Final Position", "Finish Time"].map(h => (
                      <th key={h} style={{ padding: "0.75rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
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
                        <input type="text" placeholder={$t("e.g. 1:12.45", (localStorage.getItem('app-lang') || 'vi'))} value={times[e.entryId] || ""} onChange={val => setTimes(prev => ({ ...prev, [e.entryId]: val.target.value }))} required style={inputStyle} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vùng viết Báo cáo sự cố của trọng tài */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem", color: "rgba(255,255,255,0.4)" }}>{$t("Steward Report / Notes", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} placeholder={$t("Enter details of any race incidents, track conditions, or steward decisions...", (localStorage.getItem('app-lang') || 'vi'))} style={{ width: "100%", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "12px", height: "5rem", resize: "none", outline: "none" }} />
          </div>

          {/* Cặp nút lưu và thoát */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setProcessingRace(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
            <button type="submit" disabled={procLoading} style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: procLoading ? "not-allowed" : "pointer" }}>
              {procLoading ? "Processing..." : "Verify & Confirm Results"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- GIAO DIỆN 2: DANH SÁCH CÁC TRẬN ĐUA ĐANG CHỜ CHỐT KẾT QUẢ ---
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        {/* Header danh sách */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(201,162,39,0.10)" }}>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f4f2ec" }}>{$t("Process Results & Close Races", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{$t("Select a Race Meeting and process the outcomes of scheduled races.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        {/* Thông báo thành công / lỗi nếu có */}
        {error && <div style={{ margin: "1rem 1.5rem 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px" }}>{error}</div>}
        {success && <div style={{ margin: "1rem 1.5rem 0", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", padding: "0.75rem", borderRadius: "0.25rem", fontSize: "12px" }}>{success}</div>}

        {/* Bảng 1: Lịch Ngày hội đua (Meetings List) */}
        <div style={{ padding: "1.5rem" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Race Meetings List", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {meetings.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", padding: "1.5rem" }}>{$t("No Race Meetings Found.", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={2} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                  ) : meetings.length === 0 ? (
                    <tr><td colSpan={2} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No Race Meetings Found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
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

        {/* Bảng 2: Danh sách các trận đua đang chờ xác nhận kết quả (Races to Process) */}
        <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
          <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Races To Process", (localStorage.getItem('app-lang') || 'vi'))}</h4>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {races.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", textAlign: "center", padding: "1.5rem" }}>{$t("No Races Found.", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
                    <button onClick={() => handleStartProcess(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{$t("Process", (localStorage.getItem('app-lang') || 'vi'))}</button>
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
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                  ) : races.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "1.5rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No Races Found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                  ) : races.map(race => (
                    <tr key={race.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem", fontFamily: "monospace", color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{race.raceMeetingId}</td>
                      <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{race.classLevel}</td>
                      <td style={{ padding: "1rem", color: "rgba(255,255,255,0.55)", fontSize: "12px", fontFamily: "monospace" }}>{race.startTime}</td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#c9a227", background: "rgba(201,162,39,0.15)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>{race.status}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button onClick={() => handleStartProcess(race)} style={{ padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "none", background: "#c9a227", color: "#0c0a09", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{$t("Process", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Khối tham khảo Quy chế phân hạng mùa giải (Season Class Rules) */}
        {classRules.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid rgba(201,162,39,0.10)" }}>
            <h4 style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem", color: "#c9a227" }}>{$t("Season Class Rules Reference", (localStorage.getItem('app-lang') || 'vi'))}</h4>
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
    </div>
  );
}

// Bảng định kiểu cho các ô input số lượng
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

import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { $t } from '@/lib/i18n';
import { confirm } from "../../../lib/confirm";

/**
 * Component Racecard - Phân hệ cấu hình Thẻ đua (Racecard Setup) dành cho Admin.
 * Cho phép thiết lập số cổng xuất phát (gateNumber) và trọng lượng carriedWeight của ngựa đua,
 * tự động xếp cổng (Auto Gates), tự động tính trọng lượng gánh dựa trên rating (Auto Weights),
 * hoặc hủy bỏ trận đấu (Cancel Race).
 */
export default function Racecard() {
  // Các state chứa dữ liệu từ API
  const [meetings, setMeetings] = useState<any[]>([]); // Danh sách ngày hội đua
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null); // Mã ngày hội đua được lựa chọn
  const [races, setRaces] = useState<any[]>([]); // Danh sách cuộc đua thuộc ngày hội đua đã chọn
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null); // Mã cuộc đua được lựa chọn
  const [entries, setEntries] = useState<any[]>([]); // Danh sách lượt đăng ký ngựa đua đã duyệt của cuộc đua đó

  // Các state quản lý trạng thái hệ thống
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lang = localStorage.getItem("app-lang") || "en";
  const [isMobile, setIsMobile] = useState(false);

  // Lắng nghe kích thước màn hình để hỗ trợ Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tải danh sách ngày hội đua từ endpoint /races/meetings
  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/meetings");
      setMeetings(data);
      if (data.length > 0 && selectedMeetingId === null) {
        setSelectedMeetingId(data[0].id);
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load meetings."));
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách các cuộc đua thuộc ngày hội đua
  const fetchRaces = async (meetingId: number) => {
    try {
      const data = await api.get<any[]>(`/public/races?meetingId=${meetingId}`);
      setRaces(data);
      if (data.length > 0) {
        setSelectedRaceId(data[0].id);
      } else {
        setSelectedRaceId(null);
        setEntries([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch races", err);
    }
  };

  // Tải danh sách lượt đăng ký thi đấu của cuộc đua (results API dùng chung)
  const fetchEntries = async (raceId: number) => {
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
      setEntries(data);
    } catch (err: any) {
      console.error("Failed to load entries", err);
    }
  };

  // Tải danh sách hội đua khi component mount
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Tải danh sách các trận đua khi đổi Ngày hội đua
  useEffect(() => {
    if (selectedMeetingId !== null) {
      fetchRaces(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Tải danh sách ngựa chạy khi đổi trận đua
  useEffect(() => {
    if (selectedRaceId !== null) {
      fetchEntries(selectedRaceId);
    }
  }, [selectedRaceId]);

  // Gọi API tự động phân cổng ngẫu nhiên cho ngựa chạy (Auto Assign Gates)
  const handleAutoAssignGates = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/auto-assign-gates`);
      if (res.success) {
        setSuccess("Gates auto-assigned successfully.");
        fetchEntries(selectedRaceId); // Tải lại danh sách
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to auto-assign gates."));
    }
  };

  // Gọi API tự động tính toán trọng lượng carriedWeight của ngựa chạy (Auto Calculate Weights)
  const handleAutoCalculateWeights = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/auto-calculate-weights`);
      if (res.success) {
        setSuccess("Handicap weights auto-calculated successfully.");
        fetchEntries(selectedRaceId); // Tải lại danh sách
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to calculate weights."));
    }
  };

  // Hủy bỏ cuộc đua (Cancel Race)
  const handleCancelRace = async () => {
    if (selectedRaceId === null) return;
    // Cảnh báo xác nhận trước khi thực hiện hủy
    if (!await confirm("Are you sure you want to delete this race meeting? This action cannot be undone.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/cancel`);
      if (res.success) {
        setSuccess("Race has been CANCELLED.");
        fetchEntries(selectedRaceId);
        // Tải lại danh sách cuộc đua để cập nhật trạng thái CANCELLED
        if (selectedMeetingId !== null) {
          fetchRaces(selectedMeetingId);
        }
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to cancel race."));
    }
  };

  // Cập nhật tạm số cổng xuất phát được nhập thủ công vào State
  const handleGateChange = (idx: number, val: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx].entry.gateNumber = val ? parseInt(val) : null;
      return copy;
    });
  };

  // Cập nhật tạm trọng lượng gánh được nhập thủ công vào State
  const handleWeightChange = (idx: number, val: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx].entry.carriedWeight = val ? parseFloat(val) : null;
      return copy;
    });
  };

  // Gửi mảng danh sách cổng xuất phát và trọng lượng gánh đã chỉnh sửa lên API để lưu trữ
  const handleSaveRacecard = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const payload = entries.map((e) => ({
        id: e.entry.id,
        gateNumber: e.entry.gateNumber,
        carriedWeight: e.entry.carriedWeight,
      }));
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/racecard`, payload);
      if (res.success) {
        setSuccess($t("Racecard information saved successfully."));
        fetchEntries(selectedRaceId);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || getErrMsg(err, "");
      // Handle DUPLICATE_GATE_NUMBER error message
      if (errMsg.includes("DUPLICATE_GATE_NUMBER")) {
        setError($t("Gate numbers must be unique within the same race."));
      } else {
        setError(getErrMsg(err, ($t("Failed to save racecard."))));
      }
    }
  };

  // Tìm đối tượng trận đua hiện tại và kiểm tra xem đã khóa biên bản kết quả (FINISHED / CANCELLED...) hay chưa
  const selectedRace = races.find((r) => r.id === selectedRaceId);
  const isCompleted = selectedRace && (selectedRace.status === "OFFICIAL" || selectedRace.status === "FINISHED" || selectedRace.status === "CANCELLED");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Khối bên trái: Bộ chọn dropdown giải đấu và danh sách cuộc đua */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-1.5">{$t("Select Meeting", (localStorage.getItem('app-lang') || 'en'))}</label>
          <select
            value={selectedMeetingId || ""}
            onChange={(e) => setSelectedMeetingId(parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-1.5">{$t("Select Race", (localStorage.getItem('app-lang') || 'en'))}</label>
          {races.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {races.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRaceId(r.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition text-left ${selectedRaceId === r.id ? "bg-amber-500/10 border-amber-500 text-white" : "bg-white/[0.02] border-white/10 text-white/80 hover:border-white/5"}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{r.classLevel}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${r.status === "CANCELLED" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 mt-2">🏁 Distance: {r.distanceMeters}m ({r.trackType})</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">{$t("No scheduled races for this meeting.", (localStorage.getItem('app-lang') || 'en'))}</p>
          )}
        </div>
      </div>

      {/* Khối bên phải: Bảng điều chỉnh Racecard và các nút thao tác nhanh */}
      <div className="lg:col-span-2 space-y-6">
        {selectedRaceId !== null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white">{$t("Racecard Customization", (localStorage.getItem('app-lang') || 'en'))}</h3>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAutoAssignGates}
                  disabled={isCompleted}
                  className={`px-3.5 py-2 text-black text-xs font-bold rounded-lg transition ${isCompleted ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400"}`}
                >{$t("Auto Gates", (localStorage.getItem('app-lang') || 'en'))}</button>
                <button
                  onClick={handleAutoCalculateWeights}
                  disabled={isCompleted}
                  className={`px-3.5 py-2 text-black text-xs font-bold rounded-lg transition ${isCompleted ? "bg-white/10 text-white/40 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400"}`}
                >{$t("Auto Weights", (localStorage.getItem('app-lang') || 'en'))}</button>
                <button
                  onClick={handleCancelRace}
                  disabled={isCompleted}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition ${isCompleted ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}
                >{$t("Cancel Race", (localStorage.getItem('app-lang') || 'en'))}</button>
              </div>
            </div>

            {/* Banner lỗi */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Banner thành công */}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
                {success}
              </div>
            )}

            {isMobile ? (
              // Bố cục dạng thẻ (card) trên Mobile
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {entries.length > 0 ? (
                  entries.map((e, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{e.horse?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{$t("Rating", (localStorage.getItem('app-lang') || 'en'))}: {e.horse?.currentRating}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>🏇 {e.jockey?.username || 'Unknown'}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>{$t("Gate", (localStorage.getItem('app-lang') || 'en'))}</label>
                          <input type="number" min="1" max="12" disabled={isCompleted} value={e.entry.gateNumber || ''} onChange={event => handleGateChange(idx, event.target.value)} style={{ width: '100%', padding: '0.375rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.375rem', color: '#fff', fontSize: '12px', textAlign: 'center' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>{$t("Weight (kg)", (localStorage.getItem('app-lang') || 'en'))}</label>
                          <input type="number" step="0.1" disabled={isCompleted} value={e.entry.carriedWeight || ''} onChange={event => handleWeightChange(idx, event.target.value)} style={{ width: '100%', padding: '0.375rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.375rem', color: '#fff', fontSize: '12px', textAlign: 'center' }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>{$t("No approved entries for this race.", (localStorage.getItem('app-lang') || 'en'))}</div>
                )}
              </div>
            ) : (
              // Bố cục Bảng trên Desktop
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                      <th className="px-6 py-4">{$t("Horse", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th className="px-6 py-4">{$t("Jockey", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th className="px-6 py-4 w-28">{$t("Gate", (localStorage.getItem('app-lang') || 'en'))}</th>
                      <th className="px-6 py-4 w-28">{$t("Carried Weight (kg)", (localStorage.getItem('app-lang') || 'en'))}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {entries.length > 0 ? (
                      entries.map((e, idx) => (
                        <tr key={idx} className="hover:bg-[#151310]/10 transition">
                          <td className="px-6 py-4">
                            <h5 className="font-semibold text-white">{e.horse?.name || "Unknown"}</h5>
                            <p className="text-[10px] text-white/40 mt-0.5">{$t("Rating", (localStorage.getItem('app-lang') || 'en'))}: {e.horse?.currentRating}</p>
                          </td>
                          <td className="px-6 py-4 text-white/80">
                            {e.jockey?.username || "Unknown"}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="1"
                              max="12"
                              disabled={isCompleted}
                              value={e.entry.gateNumber || ""}
                              onChange={(event) => handleGateChange(idx, event.target.value)}
                              className="w-16 px-2 py-1 bg-black/60 border border-white/5 rounded text-center text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.1"
                              disabled={isCompleted}
                              value={e.entry.carriedWeight || ""}
                              onChange={(event) => handleWeightChange(idx, event.target.value)}
                              className="w-20 px-2 py-1 bg-black/60 border border-white/5 rounded text-center text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-white/40">{$t("No approved entries for this race.", (localStorage.getItem('app-lang') || 'en'))}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {entries.length > 0 && !isCompleted && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRacecard}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >{$t("Save Custom Changes", (localStorage.getItem('app-lang') || 'en'))}</button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-white/40">{$t("Please select a race to configure the racecard.", (localStorage.getItem('app-lang') || 'en'))}</p>
        )}
      </div>
    </div>
  );
}

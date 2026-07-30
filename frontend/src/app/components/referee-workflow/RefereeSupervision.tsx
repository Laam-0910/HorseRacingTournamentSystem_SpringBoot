import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { confirm } from "../../../lib/confirm";

// Cấu trúc thuộc tính truyền vào component RefereeSupervision
interface RefereeSupervisionProps {
  raceId: number; // Mã trận đua đang chạy cần giám sát
  onBack: () => void; // Hàm callback quay lại danh sách
}

/**
 * Component RefereeSupervision - Phân hệ giám sát trực tiếp trận đấu của Trọng tài.
 * Thực hiện 2 nhiệm vụ chính trong quá trình trận đua đang diễn ra:
 * 1. Ghi nhận vi phạm luật (Log Race Violation) của kỵ sĩ/chiến mã và áp dụng hình phạt (phạt tiền, cấm thi đấu...).
 * 2. Dừng khẩn cấp cuộc đua (Emergency Stop) khi điều kiện thời tiết xấu hoặc xảy ra tai nạn nghiêm trọng trên đường đua.
 */
export default function RefereeSupervision({ raceId, onBack }: RefereeSupervisionProps) {
  // State lưu danh sách ngựa chạy và kỵ sĩ trong cuộc đua để gán vi phạm
  const [entries, setEntries] = useState<any[]>([]);
  // Lưu ID của kỵ sĩ vi phạm đang lựa chọn trong select box
  const [selectedJockeyId, setSelectedJockeyId] = useState("");
  // Chi tiết mô tả lỗi vi phạm (ví dụ: lấn làn xuất phát sớm, va chạm kỵ sĩ khác)
  const [description, setDescription] = useState("");
  // Hình phạt áp dụng (phạt tiền, đình chỉ thi đấu...)
  const [penalty, setPenalty] = useState("");
  // Báo cáo của trọng tài khi cần dừng khẩn cấp trận đua
  const [stewardReport, setStewardReport] = useState("");
  
  // Các state trạng thái hệ thống
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tải danh sách ngựa chạy của cuộc đua
  const fetchEntries = async () => {
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load entries.");
    }
  };

  // Tải dữ liệu ban đầu khi mount component
  useEffect(() => {
    fetchEntries();
  }, [raceId]);

  // Xử lý gửi biểu mẫu ghi nhận vi phạm luật thi đấu
  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn reload trang mặc định
    setError("");
    setSuccess("");

    // Tìm thông tin ngựa đua đi kèm dựa trên Jockey ID được chọn
    const selectedEntry = entries.find((en) => en.jockey?.id === parseInt(selectedJockeyId));
    if (!selectedEntry) {
      setError("Please select a jockey.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        raceId,
        jockeyId: selectedEntry.jockey.id,
        horseId: selectedEntry.horse.id,
        description,
        penalty,
        status: "RESOLVED", // Thiết lập trạng thái vi phạm mặc định là đã giải quyết
      };

      // Gửi yêu cầu ghi nhận vi phạm lên máy chủ
      const res = await api.post<any>("/referee/violations", payload);
      if (res.success) {
        setSuccess("Violation logged successfully.");
        // Làm sạch form nhập
        setDescription("");
        setPenalty("");
        setSelectedJockeyId("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log violation.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý dừng khẩn cấp trận đua
  const handleEmergencyStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stewardReport.trim()) {
      setError("Steward report is required for emergency stop.");
      return;
    }
    // Hiện cảnh báo nguy hiểm trước khi dừng trận đua
    if (!await confirm("CRITICAL: Are you sure you want to stop this race?")) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Gửi yêu cầu dừng cuộc đua lên API trọng tài kèm báo cáo lý do dừng
      const res = await api.post<any>(`/referee/races/${raceId}/stop`, {
        stewardReport,
      });
      if (res.success) {
        alert("Emergency stop executed. Race status set to STOPPED.");
        onBack(); // Quay lại trang nhiệm vụ
      }
    } catch (err: any) {
      setError(err.message || "Emergency stop failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Khối bên trái: Ghi nhận vi phạm luật (Log Race Violation) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Log Race Violation</span>
        </h3>

        {/* Thông báo ghi nhận vi phạm thành công */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogViolation} className="bg-white/[0.015] border border-white/10 p-5 rounded-2xl space-y-4">
          {/* Lựa chọn kỵ sĩ - chiến mã vi phạm */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Jockey & Horse</label>
            <select
              value={selectedJockeyId}
              required
              onChange={(e) => setSelectedJockeyId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="">-- Select Violator --</option>
              {entries.map((en, idx) => (
                <option key={idx} value={en.jockey?.id}>
                  Jockey: {en.jockey?.username} (Horse: {en.horse?.name})
                </option>
              ))}
            </select>
          </div>

          {/* Nhập mô tả chi tiết hành vi phạm luật */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Violation Detail</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs h-24 resize-none"
              placeholder="Describe the incident (e.g. crossing track early)"
            />
          </div>

          {/* Nhập mức hình phạt bổ sung */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Penalty Applied</label>
            <input
              type="text"
              required
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder="E.g. $200 Fine & 1 Race Ban"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
          >
            Log Violation
          </button>
        </form>
      </div>

      {/* Khối bên phải: Dừng khẩn cấp cuộc đua (Emergency Stop) */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-rose-500 flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          <span>Emergency Stop Control</span>
        </h3>

        {/* Thông báo lỗi nếu cuộc đua gặp trục trặc khi dừng */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmergencyStop} className="bg-rose-950/5 border border-rose-900/20 p-5 rounded-2xl space-y-4">
          {/* Nhập lý do bắt buộc dừng khẩn cấp */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">Emergency Reason</label>
            <textarea
              required
              value={stewardReport}
              onChange={(e) => setStewardReport(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs h-24 resize-none"
              placeholder="State why the race must be stopped (e.g. dangerous track conditions)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/15"
          >
            Execute Emergency Stop
          </button>
        </form>

        {/* Nút quay trở về màn hình nhiệm vụ chính của trọng tài */}
        <div className="pt-8">
          <button
            onClick={onBack}
            className="w-full py-2.5 border border-white/5 hover:bg-[#151310]/50 text-xs font-semibold rounded-xl transition"
          >
            Back to Duties
          </button>
        </div>
      </div>
    </div>
  );
}

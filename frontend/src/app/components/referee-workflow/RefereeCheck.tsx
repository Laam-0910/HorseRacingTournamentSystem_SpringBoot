import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

// Cấu trúc thuộc tính truyền vào component
interface RefereeCheckProps {
  raceId: number; // Mã trận đua cần thực hiện kiểm tra trước giờ chạy
  onBack: () => void; // Hàm callback quay lại màn hình trước đó
}

/**
 * Component RefereeCheck - Phân hệ kiểm tra trước trận đấu của Trọng tài.
 * Thực hiện công tác cân đo kiểm tra kỵ sĩ trước giờ xuất phát (Weigh-Out Weight)
 * và kiểm tra y tế/thể chất ngựa đua (Veterinary Status).
 * Xác minh thành công sẽ đổi trạng thái cuộc đua thành đang chạy (RUNNING).
 */
export default function RefereeCheck({ raceId, onBack }: RefereeCheckProps) {
  // State lưu danh sách ngựa chạy đăng ký trong trận đấu
  const [entries, setEntries] = useState<any[]>([]);
  // Lưu trạng thái y tế ngựa đua theo mã lượt đăng ký (APPROVED: Đủ điều kiện, REJECTED: Chấn thương/Loại bỏ)
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  // Lưu cân nặng thực tế cân đo trước trận của kỵ sĩ theo mã lượt đăng ký
  const [weighOutWeights, setWeighOutWeights] = useState<Record<number, string>>({});
  // Trạng thái chờ gọi API
  const [loading, setLoading] = useState(false);
  // State lưu thông tin lỗi
  const [error, setError] = useState("");

  // Tải danh sách lượt đăng ký của trận đua khi mount hoặc đổi raceId
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
        setEntries(data);
        
        // Khởi tạo trạng thái mặc định: Cấp phép cho chạy và gán cân nặng dự kiến
        const initialStatuses: Record<number, string> = {};
        const initialWeights: Record<number, string> = {};
        data.forEach((e) => {
          initialStatuses[e.entry.id] = "APPROVED"; // Mặc định là thông qua y tế
          initialWeights[e.entry.id] = e.entry.carriedWeight ? e.entry.carriedWeight.toString() : "52.0";
        });
        setStatuses(initialStatuses);
        setWeighOutWeights(initialWeights);
      } catch (err: any) {
        setError(getErrMsg(err, "Failed to load race entries."));
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [raceId]);

  // Đồng bộ thay đổi trạng thái y tế của ngựa đua
  const handleStatusChange = (entryId: number, status: string) => {
    setStatuses((prev) => ({
      ...prev,
      [entryId]: status,
    }));
  };

  // Đồng bộ thay đổi cân nặng cân đo trước trận của kỵ sĩ
  const handleWeightChange = (entryId: number, val: string) => {
    setWeighOutWeights((prev) => ({
      ...prev,
      [entryId]: val,
    }));
  };

  // Xử lý submit lưu kết quả cân đo kiểm tra và chính thức mở cổng xuất phát (Start Race)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn việc reload trang
    setError("");
    setLoading(true);

    try {
      // Map các cặp key-value thô từ State thành mảng DTO gửi lên API
      const payload = entries.map((e) => ({
        entryId: e.entry.id,
        status: statuses[e.entry.id] || "APPROVED",
        weighOutWeight: weighOutWeights[e.entry.id] ? parseFloat(weighOutWeights[e.entry.id]) : 52.0,
      }));

      // Gọi API gửi biểu mẫu kiểm tra trước giờ chạy
      const res = await api.post<any>("/referee/pre-check", {
        raceId,
        entries: payload,
      });

      if (res.success) {
        alert("Pre-race check completed. Race is now RUNNING.");
        onBack(); // Quay lại bảng điều khiển trọng tài
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to submit check."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner thông báo lỗi nếu có */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Khung Bảng chứa danh sách kỵ sĩ - chiến mã tham gia */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4">Horse</th>
                <th className="px-6 py-4">Jockey</th>
                <th className="px-6 py-4">Gate</th>
                <th className="px-6 py-4">Weigh-Out Weight</th>
                <th className="px-6 py-4 w-44">Veterinary Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-[#151310]/10 transition">
                    <td className="px-6 py-4 font-semibold text-white">{e.horse?.name}</td>
                    <td className="px-6 py-4 text-white/80">{e.jockey?.username}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-500">{e.entry.gateNumber || "N/A"}</td>
                    {/* Cột cân nặng cân đo trước trận */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={weighOutWeights[e.entry.id] || ""}
                          onChange={(event) => handleWeightChange(e.entry.id, event.target.value)}
                          className="w-20 px-2 py-1.5 bg-black/60 border border-white/5 rounded-lg text-center text-white text-xs"
                          placeholder="52.0"
                        />
                        <span className="text-xs text-white/40">kg</span>
                      </div>
                    </td>
                    {/* Cột trạng thái y tế ngựa */}
                    <td className="px-6 py-4">
                      <select
                        value={statuses[e.entry.id] || "APPROVED"}
                        onChange={(event) => handleStatusChange(e.entry.id, event.target.value)}
                        className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="APPROVED">Cleared to Race</option>
                        <option value="REJECTED">Scratched (Injured)</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Khối nút thao tác chân trang */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 border border-white/5 hover:bg-[#151310]/50 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || entries.length === 0}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
          >
            {loading ? "Submitting..." : "Clear and Start Race"}
          </button>
        </div>
      </form>
    </div>
  );
}

import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import CameraBroadcasterModal from "../livestream/CameraBroadcasterModal";

/**
 * Component LiveSettings - Phân hệ cấu hình Livestream buổi đua dành cho Admin.
 * Cho phép Admin phát livestream trực tiếp từ Camera điện thoại / WebCam hoặc chèn đường dẫn YouTube
 * cho các trận đấu đang diễn ra (RUNNING).
 */
export default function LiveSettings() {
  // Trạng thái Responsive Mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Các state quản lý dữ liệu giải đua và trạng thái input
  const [meetings, setMeetings] = useState<any[]>([]); // Danh sách ngày hội đua
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null); // Ngày hội đua đang được lựa chọn
  const [races, setRaces] = useState<any[]>([]); // Danh sách cuộc đua thuộc ngày hội đua
  const [youtubeUrls, setYoutubeUrls] = useState<Record<number, string>>({}); // Lưu trữ tạm các url youtube theo mã raceId
  const [broadcasterRace, setBroadcasterRace] = useState<any | null>(null); // Trận đua đang phát bằng Camera
  const [loading, setLoading] = useState(false);
  // Banner thông báo lỗi / thành công
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tải danh sách ngày hội đua từ endpoint /races/meetings
  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/meetings");
      setMeetings(data);
      // Mặc định chọn ngày hội đua đầu tiên nếu chưa chọn gì
      if (data.length > 0 && selectedMeetingId === null) {
        setSelectedMeetingId(data[0].id);
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load meetings."));
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách các trận đấu đua thuộc một ngày hội đua
  const fetchRaces = async (meetingId: number) => {
    try {
      const data = await api.get<any[]>(`/public/races?meetingId=${meetingId}`);
      setRaces(data);
      // Ánh xạ dữ liệu link livestream youtube sẵn có của các trận đua vào state input tương ứng
      const urls: Record<number, string> = {};
      data.forEach((r) => {
        urls[r.id] = r.youtubeLiveUrl || "";
      });
      setYoutubeUrls(urls);
    } catch (err: any) {
      console.error("Failed to load races", err);
    }
  };

  // Tải danh sách hội đua khi component mount
  useEffect(() => {
    fetchMeetings();
  }, []);

  // Tải lại danh sách cuộc đua mỗi khi Admin chuyển đổi dropdown Ngày hội đua
  useEffect(() => {
    if (selectedMeetingId !== null) {
      fetchRaces(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Đồng bộ giá trị input thay đổi của ô link youtube
  const handleUrlChange = (raceId: number, val: string) => {
    setYoutubeUrls((prev) => ({
      ...prev,
      [raceId]: val,
    }));
  };

  // Hàm xử lý lưu (cập nhật) link livestream cho một cuộc đua đang RUNNING
  const handleSave = async (raceId: number) => {
    setError("");
    setSuccess("");
    const url = (youtubeUrls[raceId] || "").trim();

    // Ràng buộc kiểm tra định dạng URL cơ bản
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    try {
      // Gửi yêu cầu lưu link livestream youtube lên máy chủ
      await api.post(`/admin/races/${raceId}/live`, { youtubeLiveUrl: url });
      setSuccess("Livestream URL updated successfully.");
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId); // Tải lại danh sách để đồng bộ trạng thái mới
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to update livestream link."));
    }
  };

  // Hàm xử lý xóa bỏ link livestream đã cấu hình cho cuộc đua
  const handleRemove = async (raceId: number) => {
    setError("");
    setSuccess("");
    try {
      // Gọi API xóa bỏ link livestream của trận đua
      await api.post(`/admin/races/${raceId}/live/remove`);
      setSuccess("Livestream URL removed.");
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId); // Tải lại danh sách
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to remove livestream link."));
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner thông báo lỗi */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Banner thông báo thành công */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Dòng điều hướng chọn Ngày hội đua */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Race Livestream Broadcasting", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">{$t("Select Meeting:", (localStorage.getItem('app-lang') || 'vi'))}</span>
          <select
            value={selectedMeetingId || ""}
            onChange={(e) => setSelectedMeetingId(parseInt(e.target.value))}
            className="bg-black/60 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Khu vực bảng hoặc danh sách cuộc đua */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-white/40 text-center">{$t("Loading races...", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : races.length > 0 ? (
          isMobile ? (
            // Layout thẻ cho thiết bị di động
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
              {races.map((r) => (
                <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#fff", fontSize: "14px" }}>{r.classLevel}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                      {r.status}
                    </span>
                  </div>
                  <div>
                    <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>{$t("YouTube Broadcast URL", (localStorage.getItem('app-lang') || 'vi'))}</label>
                    <input
                      type="text"
                      disabled={r.status !== "RUNNING"} // Chỉ cho phép nhập link khi trận đang RUNNING
                      value={youtubeUrls[r.id] || ""}
                      onChange={(e) => handleUrlChange(r.id, e.target.value)}
                      className={`w-full px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={r.status === "RUNNING" ? "Enter YouTube link" : "Only running races can broadcast"}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button
                      disabled={r.status !== "RUNNING"}
                      onClick={() => window.dispatchEvent(new CustomEvent("OPEN_BROADCASTER", { detail: r }))}
                      className={`px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1 ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>📱</span> {$t("Mobile Camera Broadcast", (localStorage.getItem('app-lang') || 'en'))}
                    </button>
                    <button
                      disabled={r.status !== "RUNNING"}
                      onClick={() => handleSave(r.id)}
                      className={`px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >{$t("Save", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    {r.youtubeLiveUrl && (
                      <button
                        disabled={r.status !== "RUNNING"}
                        onClick={() => handleRemove(r.id)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}
                      >{$t("Remove", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Bố cục Bảng trên thiết bị màn hình rộng Desktop
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">{$t("Class Level", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Race Status", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("YouTube Broadcast URL", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4 text-right">{$t("Actions", (localStorage.getItem('app-lang') || 'vi'))}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {races.map((r) => (
                  <tr key={r.id} className="hover:bg-[#151310]/10 transition">
                    <td className="px-6 py-4 font-semibold text-white">{r.classLevel}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        disabled={r.status !== "RUNNING"}
                        value={youtubeUrls[r.id] || ""}
                        onChange={(e) => handleUrlChange(r.id, e.target.value)}
                        className={`w-full px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                        placeholder={r.status === "RUNNING" ? "Enter YouTube link" : "Only running races can broadcast"}
                      />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        disabled={r.status !== "RUNNING"}
                        onClick={() => window.dispatchEvent(new CustomEvent("OPEN_BROADCASTER", { detail: r }))}
                        className={`px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-lg transition inline-flex items-center gap-1 ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span>📱</span> {$t("Mobile Camera Broadcast", (localStorage.getItem('app-lang') || 'en'))}
                      </button>
                      <button
                        disabled={r.status !== "RUNNING"}
                        onClick={() => handleSave(r.id)}
                        className={`px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >{$t("Save", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      {r.youtubeLiveUrl && (
                        <button
                          disabled={r.status !== "RUNNING"}
                          onClick={() => handleRemove(r.id)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}
                        >{$t("Remove", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          <p className="p-6 text-sm text-white/40 text-center">{$t("No races scheduled for this meeting.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        )}
      </div>

      {/* Modal Phát Livestream bằng Camera Điện thoại / WebCam */}
      {broadcasterRace && (
        <CameraBroadcasterModal
          raceId={broadcasterRace.id}
          raceTitle={broadcasterRace.classLevel}
          onClose={() => {
            setBroadcasterRace(null);
            if (selectedMeetingId !== null) fetchRaces(selectedMeetingId);
          }}
        />
      )}
    </div>
  );
}

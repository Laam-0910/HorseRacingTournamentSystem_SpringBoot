import { $t } from "../../../lib/i18n"; // Import hàm hỗ trợ đa ngôn ngữ
import { useState, useEffect } from "react"; // Import các hook của React
import { api } from "../../../lib/api"; // Import đối tượng gọi API

export default function LiveSettings() { // Component chính quản lý cài đặt phát sóng trực tiếp (Livestream)
  const [isMobile, setIsMobile] = useState(false); // State kiểm tra thiết bị có phải mobile không
  useEffect(() => { // Hook xử lý sự kiện resize cửa sổ để cập nhật giao diện
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Chạy lần đầu khi render
    window.addEventListener("resize", handleResize); // Đăng ký lắng nghe sự kiện
    return () => window.removeEventListener("resize", handleResize); // Hủy lắng nghe khi component unmount
  }, []);

  const [meetings, setMeetings] = useState<any[]>([]); // State lưu danh sách các giải đua (Meetings)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null); // State lưu ID giải đua đang được chọn
  const [races, setRaces] = useState<any[]>([]); // State lưu danh sách các vòng đua (Races) thuộc giải đấu
  const [youtubeUrls, setYoutubeUrls] = useState<Record<number, string>>({}); // State dạng key-value lưu URL Youtube cho từng vòng đua
  const [loading, setLoading] = useState(false); // State quản lý trạng thái tải dữ liệu
  const [error, setError] = useState(""); // State hiển thị thông báo lỗi
  const [success, setSuccess] = useState(""); // State hiển thị thông báo thành công

  const fetchMeetings = async () => { // Hàm lấy danh sách các giải đua từ API
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/meetings"); // Gửi request GET
      setMeetings(data); // Cập nhật danh sách giải đua
      if (data.length > 0 && selectedMeetingId === null) {
        setSelectedMeetingId(data[0].id); // Mặc định chọn giải đua đầu tiên nếu có
      }
    } catch (err: any) {
      setError(err.message || "Failed to load meetings."); // Hiển thị lỗi nếu thất bại
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  const fetchRaces = async (meetingId: number) => { // Hàm lấy danh sách các vòng đua dựa trên ID giải đua
    try {
      const data = await api.get<any[]>(`/public/races?meetingId=${meetingId}`); // Gọi API lấy vòng đua
      setRaces(data); // Cập nhật state
      const urls: Record<number, string> = {};
      data.forEach((r) => { // Duyệt qua các vòng đua để trích xuất URL livestream hiện có
        urls[r.id] = r.youtubeLiveUrl || "";
      });
      setYoutubeUrls(urls); // Lưu vào state youtubeUrls
    } catch (err: any) {
      console.error("Failed to load races", err); // Ghi lỗi ra console nếu thất bại
    }
  };

  useEffect(() => { // Hook gọi fetchMeetings khi component được mount lần đầu
    fetchMeetings();
  }, []);

  useEffect(() => { // Hook tự động gọi fetchRaces mỗi khi người dùng đổi giải đua (selectedMeetingId thay đổi)
    if (selectedMeetingId !== null) {
      fetchRaces(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  const handleUrlChange = (raceId: number, val: string) => { // Hàm cập nhật state URL khi người dùng gõ vào input
    setYoutubeUrls((prev) => ({
      ...prev,
      [raceId]: val, // Cập nhật URL mới cho vòng đua tương ứng
    }));
  };

  const handleSave = async (raceId: number) => { // Hàm xử lý lưu URL livestream
    setError("");
    setSuccess("");
    const url = (youtubeUrls[raceId] || "").trim(); // Lấy URL và loại bỏ khoảng trắng thừa

    // Kiểm tra tính hợp lệ của URL (phải bắt đầu bằng http:// hoặc https://)
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return; // Dừng thực thi nếu URL không hợp lệ
    }

    try {
      await api.post(`/admin/races/${raceId}/live`, { youtubeLiveUrl: url }); // Gửi request lưu URL
      setSuccess("Livestream URL updated successfully."); // Thông báo thành công
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId); // Load lại dữ liệu vòng đua
    } catch (err: any) {
      setError(err.message || "Failed to update livestream link."); // Hiển thị lỗi
    }
  };

  const handleRemove = async (raceId: number) => { // Hàm xóa URL livestream hiện tại
    setError("");
    setSuccess("");
    try {
      await api.post(`/admin/races/${raceId}/live/remove`); // Gửi request xóa
      setSuccess("Livestream URL removed."); // Báo thành công
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId); // Tải lại danh sách
    } catch (err: any) {
      setError(err.message || "Failed to remove livestream link."); // Hiển thị lỗi
    }
  };

  return (
    <div className="space-y-6">
      {/* Hiển thị thông báo lỗi */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Hiển thị thông báo thành công */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* Phần tiêu đề và bộ lọc */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Race Livestream Broadcasting", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">{$t("Select Meeting:", (localStorage.getItem('app-lang') || 'vi'))}</span>
          {/* Dropdown chọn giải đua */}
          <select
            value={selectedMeetingId || ""}
            onChange={(e) => setSelectedMeetingId(parseInt(e.target.value))}
            className="bg-black/60 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {meetings.map((m) => ( // Render danh sách giải đua
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vùng hiển thị danh sách các vòng đua và khung nhập link Live */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? ( // Đang load dữ liệu
          <p className="p-6 text-sm text-white/40 text-center">{$t("Loading races...", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : races.length > 0 ? ( // Nếu có vòng đua
          isMobile ? ( // Giao diện dạng khối (card) cho di động
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
              {races.map((r) => (
                <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#fff", fontSize: "14px" }}>{r.classLevel}</span>
                    {/* Hiển thị trạng thái của vòng đua (đang diễn ra thì đổi màu khác) */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                      {r.status}
                    </span>
                  </div>
                  <div>
                    <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>{$t("YouTube Broadcast URL", (localStorage.getItem('app-lang') || 'vi'))}</label>
                    {/* Input nhập link YouTube (Bị disabled nếu trạng thái không phải là RUNNING) */}
                    <input
                      type="text"
                      disabled={r.status !== "RUNNING"}
                      value={youtubeUrls[r.id] || ""}
                      onChange={(e) => handleUrlChange(r.id, e.target.value)}
                      className={`w-full px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={r.status === "RUNNING" ? "Enter YouTube link" : "Only running races can broadcast"}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {/* Nút lưu */}
                    <button
                      disabled={r.status !== "RUNNING"}
                      onClick={() => handleSave(r.id)}
                      className={`px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >{$t("Save", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    {/* Nút xóa (chỉ hiện khi đã có URL trước đó) */}
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
          ) : ( // Giao diện dạng bảng (table) cho màn hình lớn
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
                      {/* Trạng thái vòng đua */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* Cột nhập link YouTube */}
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
                      {/* Nút lưu */}
                      <button
                        disabled={r.status !== "RUNNING"}
                        onClick={() => handleSave(r.id)}
                        className={`px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >{$t("Save", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      {/* Nút xóa */}
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
        ) : ( // Không có vòng đua nào
          <p className="p-6 text-sm text-white/40 text-center">{$t("No races scheduled for this meeting.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        )}
      </div>
    </div>
  );
}

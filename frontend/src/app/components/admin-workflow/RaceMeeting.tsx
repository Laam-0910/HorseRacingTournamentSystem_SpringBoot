import { $t } from "../../../lib/i18n"; // Import hàm hỗ trợ dịch đa ngôn ngữ
import { useState, useEffect } from "react"; // Import hook cơ bản của React
import { api } from "../../../lib/api"; // Import module gọi API
import { formatDate, formatDateTime, formatForDateTimeLocal, formatForApi } from "../../utils/dateTimeHelper"; // Import các hàm xử lý ngày tháng
import InlineDatePicker from "../ui/InlineDatePicker"; // Import component chọn ngày
import { confirm } from "../../../lib/confirm"; // Import hàm hiển thị popup xác nhận

export default function RaceMeeting() { // Component quản lý danh sách các giải đua (Race Meeting)
  const [meetings, setMeetings] = useState<any[]>([]); // State lưu danh sách giải đua
  const [seasons, setSeasons] = useState<any[]>([]); // State lưu danh sách các mùa giải
  const [name, setName] = useState(""); // State lưu tên giải đua
  const [date, setDate] = useState(""); // State lưu ngày tổ chức
  const [venue, setVenue] = useState(""); // State lưu địa điểm tổ chức
  const [seasonId, setSeasonId] = useState(""); // State lưu ID của mùa giải liên kết
  const [loading, setLoading] = useState(false); // State trạng thái đang tải dữ liệu
  const [error, setError] = useState(""); // State thông báo lỗi
  const [success, setSuccess] = useState(""); // State thông báo thành công
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null); // State lưu trữ giải đua đang được chỉnh sửa
  const [isMobile, setIsMobile] = useState(false); // State kiểm tra màn hình thiết bị di động

  const fetchData = async () => { // Hàm lấy danh sách giải đua và mùa giải từ API
    setLoading(true);
    setError("");
    try {
      const ms = await api.get<any[]>("/races/meetings"); // Lấy danh sách giải đua
      setMeetings(ms); // Cập nhật danh sách giải đua vào state

      const ss = await api.get<any[]>("/races/seasons"); // Lấy danh sách mùa giải
      setSeasons(ss); // Cập nhật danh sách mùa giải vào state
      if (ss.length > 0 && !seasonId) {
        setSeasonId(ss[0].id.toString());
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { // Hook xử lý tự động cập nhật state khi màn hình thay đổi kích thước
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { // Hook gọi hàm fetchData ngay sau khi component mount
    fetchData();
  }, []);

  const handleEdit = (m: any) => { // Hàm xử lý khi nhấn nút Sửa một giải đua
    setEditingMeeting(m); // Điền dữ liệu của giải đua vào form

    setName(m.name || "");
    setVenue(m.venue || "");
    setSeasonId(m.seasonId ? m.seasonId.toString() : "");
    setDate(formatDate(m.startDate || m.date));
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => { // Hàm hủy bỏ chế độ chỉnh sửa, reset lại form
    setEditingMeeting(null);

    setName("");
    setVenue("");
    setDate("");
    if (seasons.length > 0) {
      setSeasonId(seasons[0].id.toString());
    }
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => { // Hàm xử lý khi nhấn nút Xóa giải đua
    if (!await confirm("Are you sure you want to delete this race meeting? This action cannot be undone.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.delete(`/races/meetings/${id}`); // Gọi API xóa giải đua
      setSuccess("Race meeting deleted successfully.");
      fetchData(); // Load lại dữ liệu sau khi xóa thành công
      if (editingMeeting?.id === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete meeting.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => { // Hàm xử lý lưu giải đua (Thêm mới hoặc Cập nhật)
    e.preventDefault(); // Ngăn hành vi reload trang mặc định của form
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        startDate: formatDateTime(date),
        venue,
        seasonId: parseInt(seasonId),
      };

      if (editingMeeting) {
        await api.post(`/races/meetings/${editingMeeting.id}`, payload); // Nếu đang sửa, gọi API cập nhật
        setSuccess("Race meeting updated successfully.");
        setEditingMeeting(null); // Tắt chế độ sửa
      } else {
        await api.post("/races/meetings", payload); // Nếu thêm mới, gọi API tạo mới
        setSuccess("Race meeting created successfully.");
      }

      setName("");
      setDate("");
      setVenue("");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save meeting.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Meetings List */}
      <div className="lg:col-span-2 space-y-4 order-last lg:order-first">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Race Meetings Directory", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>

        {loading ? (
          <p className="text-sm text-white/40">{$t("Loading meetings...", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : isMobile ? (
          /* Mobile: stacked cards */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {meetings.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "1rem" }}>{$t("No meetings found.", (localStorage.getItem('app-lang') || 'vi'))}</p>
            ) : meetings.map((m) => (
              <div key={m.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>#{m.id}</span>
                      <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: "4px" }}>Season #{m.seasonId}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "4px", fontFamily: "monospace" }}>
                      📅 {formatDate(m.startDate || m.date)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                      📍 {m.venue}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(m)}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition"
                    >{$t("Edit", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md transition"
                    >{$t("Delete", (localStorage.getItem('app-lang') || 'vi'))}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">{$t("ID", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Meeting Name", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Date", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Venue", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Season ID", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4 text-right">{$t("Actions", (localStorage.getItem('app-lang') || 'vi'))}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-[#151310]/15 transition">
                    <td className="px-6 py-4 font-mono text-white/40">#{m.id}</td>
                    <td className="px-6 py-4 font-semibold text-white">{m.name}</td>
                    <td className="px-6 py-4 text-white/80">{formatDate(m.startDate || m.date)}</td>
                    <td className="px-6 py-4 text-white/60">📍 {m.venue}</td>
                    <td className="px-6 py-4 text-white/40">Season #{m.seasonId}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(m)}
                        className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition"
                      >{$t("Edit", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md transition"
                      >{$t("Delete", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation form */}
      <div className="space-y-4 order-first lg:order-last">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{editingMeeting ? `${$t("Edit Meeting", (localStorage.getItem('app-lang') || 'vi'))} #${editingMeeting.id}` : $t("Add New Meeting", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Meeting Name", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("E.g., Grand Prix Sunday", (localStorage.getItem('app-lang') || 'vi'))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Date", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <InlineDatePicker
              value={date ? date.split(" ")[0] : ""}
              onChange={(v) => setDate(v + " 00:00:00")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Venue", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("E.g., Epsom Downs Track", (localStorage.getItem('app-lang') || 'vi'))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Season Association", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
          >
            {editingMeeting ? $t("Save Changes", (localStorage.getItem('app-lang') || 'vi')) : $t("Create Meeting", (localStorage.getItem('app-lang') || 'vi'))}
          </button>
          {editingMeeting && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition mt-2"
            >{$t("Cancel Edit", (localStorage.getItem('app-lang') || 'vi'))}</button>
          )}
        </form>
      </div>
    </div>
  );
}

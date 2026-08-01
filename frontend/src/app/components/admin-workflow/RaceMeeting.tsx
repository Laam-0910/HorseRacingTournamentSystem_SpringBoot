import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { formatDate, formatDateTime, formatForDateTimeLocal, formatForApi } from "../../utils/dateTimeHelper";
import InlineDatePicker from "../ui/InlineDatePicker";
import { confirm } from "../../../lib/confirm";

/**
 * Component RaceMeeting - Phân hệ cấu hình Ngày hội đua (Race Meeting) dành cho Admin.
 * Cho phép xem danh sách, tạo mới, chỉnh sửa và xóa bỏ các Ngày hội đua ngựa trong hệ thống,
 * đồng thời gắn Ngày hội đua đó vào một Mùa giải (Season) tương ứng.
 */
export default function RaceMeeting() {
  // Các state lưu trữ dữ liệu kéo về từ API
  const [meetings, setMeetings] = useState<any[]>([]); // Danh sách ngày hội đua
  const [seasons, setSeasons] = useState<any[]>([]);   // Danh sách các mùa giải trong hệ thống

  // Các state lưu giá trị input phục vụ Form tạo mới/chỉnh sửa
  const [name, setName] = useState(""); // Tên ngày hội đua
  const [date, setDate] = useState(""); // Ngày tổ chức
  const [venue, setVenue] = useState(""); // Địa điểm (Trường đua)
  const [seasonId, setSeasonId] = useState(""); // ID mùa giải gắn kết
  const [totalBudget, setTotalBudget] = useState(""); // Ngân sách tổng của Race Meeting

  // Trạng thái hệ thống
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // State lưu trữ dữ liệu ngày hội đua đang trong chế độ chỉnh sửa (nếu có)
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Hàm tải danh sách ngày hội đua và mùa giải từ API
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const ms = await api.get<any[]>("/races/meetings");
      setMeetings(ms);

      const ss = await api.get<any[]>("/races/seasons");
      setSeasons(ss);
      // Mặc định chọn mùa giải đầu tiên nếu chưa có mùa giải nào được chọn
      if (ss.length > 0 && !seasonId) {
        setSeasonId(ss[0].id.toString());
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load data."));
    } finally {
      setLoading(false);
    }
  };

  // Lắng nghe kích thước màn hình để tự động căn chỉnh responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tải dữ liệu ban đầu khi mount component
  useEffect(() => {
    fetchData();
  }, []);

  // Kích hoạt chế độ chỉnh sửa ngày hội đua (Edit mode), chuyển dữ liệu cũ lên Form
  const handleEdit = (m: any) => {
    setEditingMeeting(m);
    setName(m.name || "");
    setVenue(m.venue || "");
    setSeasonId(m.seasonId ? m.seasonId.toString() : "");
    setDate(formatDate(m.startDate || m.date));
    setTotalBudget(m.totalBudget ? m.totalBudget.toString() : "");
    setError("");
    setSuccess("");
  };

  // Hủy bỏ chế độ chỉnh sửa, làm sạch Form
  const handleCancelEdit = () => {
    setEditingMeeting(null);
    setName("");
    setVenue("");
    setDate("");
    setTotalBudget("");
    if (seasons.length > 0) {
      setSeasonId(seasons[0].id.toString());
    }
    setError("");
    setSuccess("");
  };

  // Xử lý xóa một Ngày hội đua bằng mã ID
  const handleDelete = async (id: number) => {
    // Hiện hộp thoại xác nhận tùy biến trước khi xóa
    if (!await confirm("Are you sure you want to delete this race meeting? This action cannot be undone.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.delete(`/races/meetings/${id}`);
      setSuccess("Race meeting deleted successfully.");
      fetchData(); // Tải lại danh sách
      // Nếu đang sửa chính ngày hội đua vừa bị xóa, thoát chế độ sửa
      if (editingMeeting?.id === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to delete meeting."));
    }
  };

  // Xử lý gửi Form để lưu dữ liệu (Tạo mới hoặc Cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn việc reload trang
    setError("");
    setSuccess("");

    try {
      const selectedSeason = seasons.find(s => s.id === parseInt(seasonId));
      if (selectedSeason && date) {
        const meetingTime = new Date(date).getTime();
        if (selectedSeason.startDate && meetingTime < new Date(selectedSeason.startDate).getTime()) {
          setError($t("Ngày của Race Meeting không được trước ngày bắt đầu Mùa giải", (localStorage.getItem('app-lang') || 'vi')) + ` (${selectedSeason.startDate} - ${selectedSeason.endDate})`);
          return;
        }
        if (selectedSeason.endDate) {
          const endDate = new Date(selectedSeason.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (meetingTime > endDate.getTime()) {
            setError($t("Ngày của Race Meeting không được sau ngày kết thúc Mùa giải", (localStorage.getItem('app-lang') || 'vi')) + ` (${selectedSeason.startDate} - ${selectedSeason.endDate})`);
            return;
          }
        }
      }

      // Validate budget: min 10,000,000 (10 triệu) và max 1,000,000,000 (1 tỷ)
      const budgetValue = totalBudget ? parseFloat(totalBudget) : 0;
      if (budgetValue < 10000000) {
        setError($t("Ngân sách tổng (Total budget) phải tối thiểu là 10,000,000 (10 triệu). Không được nhập số âm hoặc bé hơn 10 triệu.", (localStorage.getItem('app-lang') || 'vi')));
        return;
      }
      if (budgetValue > 1000000000) {
        setError($t("Ngân sách tổng (Total budget) không được vượt quá 1,000,000,000 (1 tỷ).", (localStorage.getItem('app-lang') || 'vi')));
        return;
      }

      const payload = {
        name,
        startDate: formatDateTime(date), // Định dạng lại chuỗi thời gian phù hợp API
        venue,
        seasonId: parseInt(seasonId),
        totalBudget: budgetValue,
      };

      if (editingMeeting) {
        // Gửi POST cập nhật nếu đang chỉnh sửa
        await api.post(`/races/meetings/${editingMeeting.id}`, payload);
        setSuccess("Race meeting updated successfully.");
        setEditingMeeting(null);
      } else {
        // Gửi POST tạo mới nếu không ở chế độ sửa
        await api.post("/races/meetings", payload);
        setSuccess("Race meeting created successfully.");
      }

      // Làm sạch Form và tải lại danh sách mới
      setName("");
      setDate("");
      setVenue("");
      setTotalBudget("");
      fetchData();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to save meeting."));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cột hiển thị Danh sách các Ngày hội đua */}
      <div className="lg:col-span-2 space-y-4 order-last lg:order-first">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Race Meetings Directory", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>

        {loading ? (
          <p className="text-sm text-white/40">{$t("Loading meetings...", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : isMobile ? (
          /* Bố cục dạng danh sách thẻ xếp chồng trên di động */
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
                    <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "4px", fontFamily: "monospace", fontWeight: "bold" }}>
                      💰 Budget: ${Number(m.totalBudget || 0).toLocaleString('en-US')}
                    </div>
                  </div>
                  {/* Nút sửa / xóa nhanh */}
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
          /* Bố cục dạng Bảng chi tiết cho màn hình lớn Desktop */
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">{$t("ID", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Meeting Name", (localStorage.getItem('app-lang') || 'vi'))}</th>
                  <th className="px-6 py-4">{$t("Total Budget ($)", (localStorage.getItem('app-lang') || 'vi'))}</th>
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
                    <td className="px-6 py-4 font-mono font-bold text-amber-400">${Number(m.totalBudget || 0).toLocaleString('en-US')}</td>
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

      {/* Cột hiển thị Biểu mẫu Tạo mới / Cập nhật Ngày hội đua */}
      <div className="space-y-4 order-first lg:order-last">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{editingMeeting ? `${$t("Edit Meeting", (localStorage.getItem('app-lang') || 'vi'))} #${editingMeeting.id}` : $t("Add New Meeting", (localStorage.getItem('app-lang') || 'vi'))}</span>
        </h3>

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

        <form onSubmit={handleSubmit} className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
          {/* Nhập Tên buổi đua */}
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

          {/* Nhập Ngân sách tổng (Total Budget) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Total Budget ($USD)", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <input
              type="number"
              min="10000000"
              max="1000000000"
              step="1000000"
              required
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("Min: 10,000,000 — Max: 1,000,000,000", (localStorage.getItem('app-lang') || 'vi'))}
            />
            <p className="text-[10px] text-white/30 mt-1 font-mono">{$t("Tối thiểu: 10,000,000 (10 triệu) — Tối đa: 1,000,000,000 (1 tỷ)", (localStorage.getItem('app-lang') || 'vi'))}</p>
          </div>

          {/* Chọn ngày tổ chức thông qua bộ chọn ngày InlineDatePicker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Date", (localStorage.getItem('app-lang') || 'vi'))}</label>
            <InlineDatePicker
              value={date ? date.split(" ")[0] : ""}
              onChange={(v) => setDate(v + " 00:00:00")}
            />
          </div>

          {/* Nhập địa điểm trường đua */}
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

          {/* Chọn mùa giải tương ứng để phân bổ */}
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

          {/* Nút gửi hoặc hủy */}
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

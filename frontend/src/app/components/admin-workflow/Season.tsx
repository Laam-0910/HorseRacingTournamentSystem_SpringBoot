import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { formatDateTime, parseSafeDate } from "../../utils/dateTimeHelper";

// Cấu trúc thuộc tính truyền vào component InlineDatePicker
interface InlineDatePickerProps {
  label: string;
  value: string; // format: dd-MM-yyyy
  onChange: (val: string) => void;
}

/**
 * Component InlineDatePicker - Bộ chọn ngày tùy biến thả xuống.
 * Hỗ trợ chọn ngày bắt đầu/ngày kết thúc của Mùa giải.
 */
function InlineDatePicker({ label, value, onChange }: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });

  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = value.match(datePattern);
  const selectedDay = match ? parseInt(match[1]) : null;
  const selectedMonth = match ? parseInt(match[2]) - 1 : null;
  const selectedYear = match ? parseInt(match[3]) : null;

  useEffect(() => {
    if (isOpen && selectedMonth !== null && selectedYear !== null) {
      setCurrentDate({ month: selectedMonth, year: selectedYear });
    }
  }, [isOpen, selectedMonth, selectedYear]);

  const daysInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate();
  let firstDay = new Date(currentDate.year, currentDate.month, 1).getDay();
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handlePrevMonth = () => {
    setCurrentDate(prev =>
      prev.month === 0 ? { month: 11, year: prev.year - 1 } : { month: prev.month - 1, year: prev.year }
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(prev =>
      prev.month === 11 ? { month: 0, year: prev.year + 1 } : { month: prev.month + 1, year: prev.year }
    );
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(currentDate.month + 1).padStart(2, "0");
    onChange(`${formattedDay}-${formattedMonth}-${currentDate.year}`);
    setIsOpen(false);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="relative">
      <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          value={value}
          placeholder={$t("dd-mm-yyyy", (localStorage.getItem('app-lang') || 'en'))}
          className="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none cursor-pointer font-mono"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)" }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-500 transition text-sm focus:outline-none"
        >
          📅
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-[110%] left-0 w-64 bg-[#100f0c] border border-[#2a2825] rounded-xl p-3.5 shadow-2xl z-50 space-y-3 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <button type="button" onClick={handlePrevMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">◀</button>
              <div className="flex items-center gap-1">
                <select
                  value={currentDate.month}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold uppercase tracking-wider border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {months.map((m, idx) => (
                    <option key={m} value={idx} className="bg-[#100f0c] text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={currentDate.year}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map(yr => (
                    <option key={yr} value={yr} className="bg-[#100f0c] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">▶</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-white/40 uppercase font-mono">
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => <div key={`blank-${b}`} className="h-7 w-7"></div>)}
              {daysArray.map(day => {
                const isSelected = selectedDay === day && selectedMonth === currentDate.month && selectedYear === currentDate.year;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 text-[10px] font-mono rounded-lg flex items-center justify-center transition ${
                      isSelected ? "bg-amber-500 text-black font-bold" : "text-white/80 hover:bg-white/5 hover:text-amber-500"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Luật cấu hình hạng mặc định của hệ thống
const DEFAULT_TEMPLATE_RULES = [
  { classLevelName: "Class 1", minRating: 95, maxRating: null as number | null, minPrize: 300000, maxPrize: 1000000 },
  { classLevelName: "Class 2", minRating: 80, maxRating: 94, minPrize: 200000, maxPrize: 299999 },
  { classLevelName: "Class 3", minRating: 60, maxRating: 79, minPrize: 100000, maxPrize: 199999 },
  { classLevelName: "Class 4", minRating: 40, maxRating: 59, minPrize: 50000, maxPrize: 99999 },
  { classLevelName: "Class 5", minRating: 0,  maxRating: 39, minPrize: 20000, maxPrize: 49999 },
];

/**
 * Component Season - Phân hệ Thiết lập và Quản lý Mùa giải (Season Management) dành cho Admin.
 * - Khởi tạo mùa giải đua mới (Initialize Season), cho phép chọn cấu hình tự động (AUTOMATIC)
 *   hoặc nhập thủ công ngưỡng rating cho 5 hạng Class 1 - Class 5 (MANUAL).
 * - Hiển thị danh sách các mùa giải trong hệ thống.
 * - Cho phép chuyển đổi trạng thái Kích hoạt/Vô hiệu hóa (Activate/Deactivate) để cài làm mùa giải chính.
 * - Cho phép Gia hạn ngày bắt đầu/kết thúc mùa giải (Extend Season).
 */
export default function Season() {
  const [seasons, setSeasons] = useState<any[]>([]); // Danh sách mùa giải đua
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null); // Mùa giải đang được chọn để xem luật
  const [seasonRules, setSeasonRules] = useState<any[]>([]); // Danh sách luật hạng của mùa giải đang chọn
  
  // Trạng thái hệ thống
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Các State phục vụ Biểu mẫu Tạo Mùa giải mới ---
  const [newSeasonName, setNewSeasonName] = useState("2026–2027 Grand Prix Season");
  const [newSeasonStartDate, setNewSeasonStartDate] = useState("");
  const [newSeasonEndDate, setNewSeasonEndDate] = useState("");
  const [classRuleMethod, setClassRuleMethod] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC"); // Lựa chọn phương thức phân hạng
  const [manualRules, setManualRules] = useState(DEFAULT_TEMPLATE_RULES.map(r => ({ ...r }))); // Bộ luật nhập thủ công

  // --- Các State phục vụ hộp thoại Gia hạn Mùa giải ---
  const [extendingSeason, setExtendingSeason] = useState<any | null>(null); // Lưu thông tin mùa giải đang gia hạn
  const [extendStartDateInput, setExtendStartDateInput] = useState("");
  const [extendDateInput, setExtendDateInput] = useState("");
  const [extendError, setExtendError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Quy đổi chuỗi ngày dd-MM-yyyy sang chuỗi timestamp API yêu cầu (yyyy-MM-dd 00:00:00)
  const toDbFormat = (d: string) => d ? `${d} 00:00:00` : "";

  // Quy đổi ngược từ chuỗi ngày API sang dd-MM-yyyy để hiển thị ở date picker
  const toDisplayFormat = (d: string) => {
    if (!d) return "";
    const parts = d.substring(0, 10).replace(/\//g, "-").split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    return d;
  };

  // Tải danh sách mùa giải
  const fetchSeasons = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/seasons");
      setSeasons(data);
      // Mặc định chọn mùa giải đầu tiên nếu chưa chọn gì
      if (data.length > 0 && selectedSeasonId === null) setSelectedSeasonId(data[0].id);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to fetch seasons."));
    } finally {
      setLoading(false);
    }
  };

  // --- State cho chỉnh sửa Quy tắc Class Rules ---
  const [editableRules, setEditableRules] = useState<any[]>([]);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesError, setRulesError] = useState("");
  const [rulesSuccess, setRulesSuccess] = useState("");

  // Tải quy chế phân hạng Class Rules của một mùa giải cụ thể
  const fetchRules = async (seasonId: number) => {
    try {
      const rules = await api.get<any[]>(`/races/seasons/${seasonId}/rules`);
      setSeasonRules(rules);
      setEditableRules(rules.map((r: any) => ({ ...r })));
    } catch (err: any) {
      console.error("Failed to load rules", err);
    }
  };

  const handleSaveRules = async () => {
    if (!selectedSeasonId) return;
    setRulesError("");
    setRulesSuccess("");
    try {
      await api.post(`/races/seasons/${selectedSeasonId}/rules`, editableRules);
      setRulesSuccess("Season class prize rules updated successfully.");
      setIsEditingRules(false);
      fetchRules(selectedSeasonId);
    } catch (err: any) {
      setRulesError(getErrMsg(err, "Failed to save season rules."));
    }
  };

  // Lắng nghe kích thước Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Tải danh sách khi khởi chạy
  useEffect(() => { fetchSeasons(); }, []);
  
  // Tải luật tương ứng khi thay đổi mùa giải đang chọn
  useEffect(() => { if (selectedSeasonId !== null) fetchRules(selectedSeasonId); }, [selectedSeasonId]);

  // Kích hoạt/Vô hiệu hóa mùa giải (chuyển đổi status ACTIVE/INACTIVE)
  const handleToggle = async (id: number) => {
    try {
      await api.post(`/races/seasons/${id}/toggle`);
      fetchSeasons();
    } catch (err: any) {
      alert(getErrMsg(err, "Failed to toggle status: "));
    }
  };

  // Mở modal gia hạn mùa giải và gán thông số cũ lên ô nhập liệu
  const handleExtend = (season: any) => {
    setExtendingSeason(season);
    
    const rawStart = season.startDate ? season.startDate.substring(0, 10) : "";
    const rawEnd = season.endDate ? season.endDate.substring(0, 10) : "";

    setExtendStartDateInput(toDisplayFormat(rawStart));
    setExtendDateInput(toDisplayFormat(rawEnd));
    setExtendError("");
  };

  // Gửi thông số gia hạn mùa giải đua lên máy chủ
  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtendError("");
    
    if (!extendStartDateInput || !extendDateInput) {
      setExtendError("Please select both start and end dates.");
      return;
    }

    const dbStart = toDbFormat(extendStartDateInput);
    const dbEnd = toDbFormat(extendDateInput);

    // Ràng buộc thời gian: Ngày bắt đầu phải đứng trước ngày kết thúc
    const startD = parseSafeDate(dbStart);
    const endD = parseSafeDate(dbEnd);
    if (startD && endD && startD >= endD) {
      setExtendError("Start Date must be before End Date.");
      return;
    }

    try {
      await api.post(`/races/seasons/${extendingSeason.id}/extend`, { startDate: dbStart, endDate: dbEnd });
      fetchSeasons();
      setExtendingSeason(null); // Đóng Modal
    } catch (err: any) {
      setExtendError(getErrMsg(err, "Failed to extend season: "));
    }
  };

  // Xử lý Gửi biểu mẫu Tạo Mùa giải đua mới
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!newSeasonStartDate || !newSeasonEndDate) {
      setError("Please select both start and end dates.");
      return;
    }

    const dbStart = toDbFormat(newSeasonStartDate);
    const dbEnd = toDbFormat(newSeasonEndDate);

    const startD = parseSafeDate(dbStart);
    const endD = parseSafeDate(dbEnd);
    if (startD && endD && startD >= endD) {
      setError("Start Date must be before End Date.");
      return;
    }

    // Thiết lập payload tạo mùa giải mới
    const payload: any = { name: newSeasonName, startDate: dbStart, endDate: dbEnd, classRuleMethod, status: "PENDING" };
    // Đính kèm danh sách Class rules tùy biến nếu chọn phương pháp thiết lập MANUAL
    if (classRuleMethod === "MANUAL") {
      payload.manualClasses = manualRules;
    }

    try {
      await api.post("/races/seasons", payload);
      setSuccess("Season initialized successfully!");
      // Reset biểu mẫu nhập liệu
      setNewSeasonName("2026–2027 Grand Prix Season");
      setNewSeasonStartDate("");
      setNewSeasonEndDate("");
      setClassRuleMethod("AUTOMATIC");
      setManualRules(DEFAULT_TEMPLATE_RULES.map(r => ({ ...r })));
      fetchSeasons();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to create season: "));
    }
  };

  // Cập nhật giá trị nhập của bảng Class rules (chỉ áp dụng ở chế độ MANUAL)
  const updateManualRule = (index: number, field: string, value: string) => {
    setManualRules(prev => prev.map((r, i) =>
      i === index ? { ...r, [field]: field === "classLevelName" ? value : (value === "" ? null : Number(value)) } : r
    ));
  };

  return (
    <div className="space-y-6">
      {/* Banner báo lỗi */}
      {error && (
        <div className="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style={{ backgroundColor: "rgba(239,91,91,0.15)", color: "#ef5b5b", border: "1px solid rgba(239,91,91,0.3)" }}>
          ⚠ {error}
        </div>
      )}
      
      {/* Banner báo thành công */}
      {success && (
        <div className="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style={{ backgroundColor: "rgba(74,157,111,0.15)", color: "#4a9d6f", border: "1px solid rgba(74,157,111,0.3)" }}>
          ✓ {success}
        </div>
      )}

      {/* KHỐI 1: KHỞI TẠO MÙA GIẢI MỚI (Create Season Form) */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(201,162,39,0.10)" }}>
          <div>
            <p className="font-bold text-sm text-[#f4f2ec]" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Initialize New Racing Season", (localStorage.getItem('app-lang') || 'en'))}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Configure the season framework and choose rule initialization method.", (localStorage.getItem('app-lang') || 'en'))}</p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreateSeason} className="space-y-6">
            {/* Nhập Tên, Ngày bắt đầu, Ngày kết thúc */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Season Name", (localStorage.getItem('app-lang') || 'en'))}</label>
                <input
                  type="text"
                  required
                  value={newSeasonName}
                  onChange={e => setNewSeasonName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)" }}
                  placeholder={$t("e.g. 2026–2027 Grand Prix Season", (localStorage.getItem('app-lang') || 'en'))}
                />
              </div>
              <InlineDatePicker label={$t("Season Start Date", (localStorage.getItem('app-lang') || 'en'))} value={newSeasonStartDate} onChange={setNewSeasonStartDate} />
              <InlineDatePicker label={$t("Season End Date", (localStorage.getItem('app-lang') || 'en'))} value={newSeasonEndDate} onChange={setNewSeasonEndDate} />
            </div>

            {/* Chọn phương thức phân hạng cho mùa giải */}
            <div className="space-y-3">
              <label className="block text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Class Rule Setup Method", (localStorage.getItem('app-lang') || 'en'))}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lựa chọn Tự động (AUTOMATIC) */}
                <div
                  onClick={() => setClassRuleMethod("AUTOMATIC")}
                  className="p-4 rounded-xl border cursor-pointer transition-all"
                  style={{
                    background: classRuleMethod === "AUTOMATIC" ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.01)",
                    borderColor: classRuleMethod === "AUTOMATIC" ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.08)"
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="classRuleMethod"
                      value="AUTOMATIC"
                      checked={classRuleMethod === "AUTOMATIC"}
                      onChange={() => setClassRuleMethod("AUTOMATIC")}
                      className="mt-0.5 accent-[#c9a227]"
                      onClick={e => e.stopPropagation()}
                    />
                    <div>
                      <span className="block text-xs font-mono font-bold text-[#f4f2ec]">{$t("Automatic Class Rules", (localStorage.getItem('app-lang') || 'en'))}</span>
                      <span className="block text-[10px] font-mono mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        AUTOMATIC: System automatically configures and applies all default rating classes (Class 1 - Class 5) to this season.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lựa chọn Thủ công (MANUAL) */}
                <div
                  onClick={() => setClassRuleMethod("MANUAL")}
                  className="p-4 rounded-xl border cursor-pointer transition-all"
                  style={{
                    background: classRuleMethod === "MANUAL" ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.01)",
                    borderColor: classRuleMethod === "MANUAL" ? "rgba(201,162,39,0.4)" : "rgba(255,255,255,0.08)"
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="classRuleMethod"
                      value="MANUAL"
                      checked={classRuleMethod === "MANUAL"}
                      onChange={() => setClassRuleMethod("MANUAL")}
                      className="mt-0.5 accent-[#c9a227]"
                      onClick={e => e.stopPropagation()}
                    />
                    <div>
                      <span className="block text-xs font-mono font-bold text-[#f4f2ec]">{$t("Manual Setup", (localStorage.getItem('app-lang') || 'en'))}</span>
                      <span className="block text-[10px] font-mono mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        MANUAL: Manually configure and adjust rating boundaries for all 5 classes (Class 1 - Class 5) for this season.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng nhập Class rules thủ công (chỉ hiện khi chọn MANUAL) */}
            {classRuleMethod === "MANUAL" && (
              <div className="rounded-xl p-5 border space-y-3" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(201,162,39,0.15)" }}>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-[#c9a227]">{$t("Configure Season Classes (Manual Mode)", (localStorage.getItem('app-lang') || 'en'))}</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Adjust ratings for the 5 season classes before initialization:", (localStorage.getItem('app-lang') || 'en'))}</p>
                </div>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs font-mono text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                        <th className="py-2 pr-4 text-left">{$t("Class Level", (localStorage.getItem('app-lang') || 'en'))}</th>
                        <th className="py-2 px-4 text-left">{$t("Min Rating", (localStorage.getItem('app-lang') || 'en'))}</th>
                        <th className="py-2 px-4 text-left">{$t("Max Rating", (localStorage.getItem('app-lang') || 'en'))}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      {manualRules.map((rule, index) => (
                        <tr key={index}>
                          <td className="py-3 pr-4 font-bold text-[#c9a227]">{rule.classLevelName}</td>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              value={rule.minRating ?? ""}
                              onChange={e => updateManualRule(index, "minRating", e.target.value)}
                              required
                              className="rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] w-24"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              value={rule.maxRating ?? ""}
                              onChange={e => updateManualRule(index, "maxRating", e.target.value)}
                              placeholder={$t("No limit", (localStorage.getItem('app-lang') || 'en'))}
                              className="rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] w-24"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                style={{ background: "#c9a227", color: "#0b0d11" }}
              >{$t("Initialize Season", (localStorage.getItem('app-lang') || 'en'))}</button>
            </div>
          </form>
        </div>
      </div>

      {/* KHỐI 2: DANH SÁCH LỊCH SỬ MÙA GIẢI (Historical Seasons Table) */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(201,162,39,0.10)" }}>
          <div>
            <p className="font-bold text-sm text-[#f4f2ec]" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Historical Seasons", (localStorage.getItem('app-lang') || 'en'))}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{$t("Previously completed and active racing seasons", (localStorage.getItem('app-lang') || 'en'))}</p>
          </div>
        </div>

        {isMobile ? (
          // Bố cục Mobile (dạng thẻ)
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "1rem" }}>{$t("Loading seasons...", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : seasons.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "1rem" }}>{$t("No seasons found.", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : seasons.map(season => (
              <div
                key={season.id}
                onClick={() => setSelectedSeasonId(season.id)}
                style={{
                  background: selectedSeasonId === season.id ? 'rgba(201,162,39,0.04)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(201,162,39,0.14)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#c9a227' }}>S-{season.id}</span>
                    <p style={{ fontSize: '13px', color: '#f4f2ec', fontWeight: 600, marginTop: '2px' }}>{season.name}</p>
                    <p style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                      {formatDateTime(season.startDate).split(' ')[0]} – {formatDateTime(season.endDate).split(' ')[0]}
                    </p>
                  </div>
                  {season.status === 'ACTIVE' ? (
                    <span style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.625rem', borderRadius: '0.25rem', border: '1px solid #4a9d6f40', background: '#4a9d6f18', color: '#4a9d6f', whiteSpace: 'nowrap' }}>{$t("Active", (localStorage.getItem('app-lang') || 'en'))}</span>
                  ) : (
                    <span style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.25rem 0.625rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{$t("Closed", (localStorage.getItem('app-lang') || 'en'))}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleToggle(season.id); }}
                    style={season.status === 'ACTIVE'
                      ? { background: 'rgba(239,91,91,0.12)', color: '#ef5b5b', border: '1px solid rgba(239,91,91,0.35)', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }
                      : { background: 'rgba(74,157,111,0.12)', color: '#4a9d6f', border: '1px solid rgba(74,157,111,0.35)', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}
                  >
                    {season.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleExtend(season); }}
                    style={{ background: 'rgba(201,162,39,0.10)', color: '#c9a227', border: '1px solid rgba(201,162,39,0.30)', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}
                  >{$t("Extend", (localStorage.getItem('app-lang') || 'en'))}</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Bố cục Desktop (Bảng biểu)
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>{$t("Season ID", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>{$t("Season Name", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>{$t("Date Range", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{$t("Status / Actions", (localStorage.getItem('app-lang') || 'en'))}</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map(season => (
                  <tr
                    key={season.id}
                    onClick={() => setSelectedSeasonId(season.id)}
                    className="cursor-pointer transition-colors hover:bg-white/[0.025]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: selectedSeasonId === season.id ? "rgba(201,162,39,0.04)" : "" }}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs" style={{ color: "#c9a227" }}>S-{season.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#f4f2ec]">{season.name}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {formatDateTime(season.startDate).split(" ")[0]} – {formatDateTime(season.endDate).split(" ")[0]}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {season.status === "ACTIVE" ? (
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style={{ background: "#4a9d6f18", color: "#4a9d6f", borderColor: "#4a9d6f40" }}>{$t("Active", (localStorage.getItem('app-lang') || 'en'))}</span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>{$t("Closed", (localStorage.getItem('app-lang') || 'en'))}</span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleToggle(season.id); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition hover:brightness-90"
                          style={season.status === "ACTIVE"
                            ? { background: "rgba(239,91,91,0.12)", color: "#ef5b5b", border: "1px solid rgba(239,91,91,0.35)" }
                            : { background: "rgba(74,157,111,0.12)", color: "#4a9d6f", border: "1px solid rgba(74,157,111,0.35)" }}
                        >
                          {season.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleExtend(season); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition hover:brightness-90"
                          style={{ background: "rgba(201,162,39,0.10)", color: "#c9a227", border: "1px solid rgba(201,162,39,0.30)" }}
                        >{$t("Extend", (localStorage.getItem('app-lang') || 'en'))}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Khối hiển thị & chỉnh sửa Class rules tương ứng dưới bảng */}
        {selectedSeasonId !== null && seasonRules.length > 0 && (
          <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(201,162,39,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                Class Prize Rules & Rating Limits — Season S-{selectedSeasonId}
              </p>
              {!isEditingRules ? (
                <button
                  type="button"
                  onClick={() => { setIsEditingRules(true); setRulesError(""); setRulesSuccess(""); }}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-mono font-semibold transition cursor-pointer"
                >
                  ✏️ Edit Class Rules
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditingRules(false); setRulesError(""); setEditableRules(seasonRules.map(r => ({ ...r }))); }}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded text-xs font-mono transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRules}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded text-xs font-mono font-bold transition cursor-pointer"
                  >
                    💾 Save Rules
                  </button>
                </div>
              )}
            </div>

            {rulesError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-3">⚠️ {rulesError}</p>
            )}
            {rulesSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl mb-3">✓ {rulesSuccess}</p>
            )}

            {!isEditingRules ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {seasonRules.map(rule => (
                  <div key={rule.id} className="rounded-lg p-3 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(201,162,39,0.12)" }}>
                    <p className="text-[11px] font-mono font-bold text-amber-400">{rule.classLevel}</p>
                    <p className="text-[10px] font-mono text-white/50 mt-1">Rating: {rule.minRating} – {rule.maxRating ?? "∞"}</p>
                    <p className="text-[10px] font-mono text-emerald-400 font-semibold mt-1">
                      Min Prize: ${rule.minPrize ? rule.minPrize.toLocaleString() : '0'}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400/80 mt-0.5">
                      Max Prize: ${rule.maxPrize ? rule.maxPrize.toLocaleString() : '0'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {editableRules.map((rule, idx) => (
                  <div key={rule.id || idx} className="rounded-lg p-3 border space-y-2" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(201,162,39,0.25)" }}>
                    <p className="text-[11px] font-mono font-bold text-amber-400">{rule.classLevel}</p>
                    <div>
                      <label className="text-[9px] font-mono text-white/40 block">Min Prize ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={rule.minPrize ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const updated = [...editableRules];
                          updated[idx] = { ...updated[idx], minPrize: isNaN(val) ? 0 : val };
                          setEditableRules(updated);
                        }}
                        className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono text-white/40 block">Max Prize ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={rule.maxPrize ?? ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const updated = [...editableRules];
                          updated[idx] = { ...updated[idx], maxPrize: isNaN(val) ? 0 : val };
                          setEditableRules(updated);
                        }}
                        className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL GIA HẠN MÙA GIẢI (Extend Season Modal) */}
      {extendingSeason && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" style={{ background: "#151310", borderColor: "#2a2825" }}>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>{$t("Extend Season", (localStorage.getItem('app-lang') || 'en'))}</h4>
              <button type="button" onClick={() => setExtendingSeason(null)} className="text-white/40 hover:text-white/80 text-lg transition">✕</button>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">{$t("Season Name", (localStorage.getItem('app-lang') || 'en'))}</span>
              <p className="text-white text-sm font-semibold">{extendingSeason.name}</p>
            </div>
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InlineDatePicker label={$t("New Start Date", (localStorage.getItem('app-lang') || 'en'))} value={extendStartDateInput} onChange={setExtendStartDateInput} />
                <InlineDatePicker label={$t("New End Date", (localStorage.getItem('app-lang') || 'en'))} value={extendDateInput} onChange={setExtendDateInput} />
              </div>
              {extendError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">⚠️ {extendError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setExtendingSeason(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-lg transition">{$t("Cancel", (localStorage.getItem('app-lang') || 'en'))}</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition">{$t("Extend Season", (localStorage.getItem('app-lang') || 'en'))}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

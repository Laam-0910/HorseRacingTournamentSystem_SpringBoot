import { $t } from "../../../lib/i18n"; // Import hàm hỗ trợ đa ngôn ngữ
import { useState, useEffect } from "react"; // Import các hook của React
import { createPortal } from "react-dom"; // Import createPortal để hiển thị modal ngoài DOM tree hiện tại
import { api } from "../../../lib/api"; // Import đối tượng gọi API
import { parseSafeDate, formatDateTime } from "../../utils/dateTimeHelper"; // Import các hàm xử lý ngày tháng

interface InlineDatePickerProps { // Khai báo interface cho Component chọn ngày inline
  label: string; // Tên nhãn hiển thị
  value: string; // Giá trị ngày (format: dd-MM-yyyy)
  onChange: (val: string) => void; // Hàm callback khi thay đổi ngày
}

function InlineDatePicker({ label, value, onChange }: InlineDatePickerProps) { // Component chọn ngày tháng
  const [isOpen, setIsOpen] = useState(false); // State quản lý trạng thái đóng/mở của bảng chọn ngày
  const [currentDate, setCurrentDate] = useState(() => { // State lưu trữ tháng, năm hiện tại đang xem
    const today = new Date();
    return { month: today.getMonth(), year: today.getFullYear() };
  });

  const datePattern = /^(\d{2})-(\d{2})-(\d{4})$/; // Biểu thức chính quy kiểm tra định dạng ngày
  const match = value.match(datePattern); // So khớp giá trị truyền vào
  const selectedDay = match ? parseInt(match[1]) : null; // Lấy ngày được chọn
  const selectedMonth = match ? parseInt(match[2]) - 1 : null; // Lấy tháng được chọn (tháng trong Date tính từ 0)
  const selectedYear = match ? parseInt(match[3]) : null; // Lấy năm được chọn

  useEffect(() => { // Hook đồng bộ bảng lịch với ngày đang được chọn khi mở
    if (isOpen && selectedMonth !== null && selectedYear !== null) {
      setCurrentDate({ month: selectedMonth, year: selectedYear });
    }
  }, [isOpen, selectedMonth, selectedYear]);

  const daysInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate(); // Tính số ngày trong tháng hiện tại
  let firstDay = new Date(currentDate.year, currentDate.month, 1).getDay(); // Xác định thứ của ngày mùng 1
  firstDay = firstDay === 0 ? 6 : firstDay - 1; // Điều chỉnh để thứ Hai là 0, Chủ nhật là 6

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; // Mảng tên các tháng

  const handlePrevMonth = () => { // Hàm chuyển sang tháng trước
    setCurrentDate(prev =>
      prev.month === 0 ? { month: 11, year: prev.year - 1 } : { month: prev.month - 1, year: prev.year }
    );
  };

  const handleNextMonth = () => { // Hàm chuyển sang tháng sau
    setCurrentDate(prev =>
      prev.month === 11 ? { month: 0, year: prev.year + 1 } : { month: prev.month + 1, year: prev.year }
    );
  };

  const handleSelectDay = (day: number) => { // Hàm xử lý khi chọn 1 ngày
    const formattedDay = String(day).padStart(2, "0"); // Định dạng ngày 2 chữ số
    const formattedMonth = String(currentDate.month + 1).padStart(2, "0"); // Định dạng tháng 2 chữ số
    onChange(`${formattedDay}-${formattedMonth}-${currentDate.year}`); // Gọi hàm callback truyền dữ liệu ra ngoài
    setIsOpen(false); // Đóng bảng lịch
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1); // Tạo mảng các ngày trong tháng
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i); // Tạo mảng khoảng trống cho những ngày đầu tháng

  return (
    <div className="relative">
      <label style={labelStyle}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          onClick={() => setIsOpen(!isOpen)} // Nhấp vào input để mở bảng lịch
          value={value}
          placeholder={$t("dd-mm-yyyy", (localStorage.getItem('app-lang') || 'vi'))}
          style={inputStyle}
          className="cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)} // Nhấp vào biểu tượng lịch để mở
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-500 transition text-sm focus:outline-none"
        >
          📅
        </button>
      </div>

      {isOpen && ( // Nếu đang mở thì hiển thị popup lịch
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div> {/* Overlay để click ra ngoài đóng lịch */}
          <div className="absolute top-[110%] left-0 w-64 bg-[#100f0c] border border-[#2a2825] rounded-xl p-3.5 shadow-2xl z-50 space-y-3 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <button type="button" onClick={handlePrevMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">◀</button>
              <div className="flex items-center gap-1">
                {/* Dropdown chọn tháng */}
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
                {/* Dropdown chọn năm */}
                <select
                  value={currentDate.year}
                  onChange={(e) => setCurrentDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="bg-transparent text-white font-bold border border-[#2a2825] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-amber-500 hover:text-amber-500 transition text-[10px]"
                  style={{ colorScheme: "dark" }}
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 25 + i).map(yr => (
                    <option key={yr} value={yr} className="bg-[#100f0c] text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={handleNextMonth} className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition">▶</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-white/40 uppercase font-mono">
              {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => <span key={d}>{d}</span>)} {/* Tiêu đề các ngày trong tuần */}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => <div key={`blank-${b}`} className="h-7 w-7"></div>)} {/* Khoảng trống đầu tháng */}
              {daysArray.map(day => {
                const isSelected = selectedDay === day && selectedMonth === currentDate.month && selectedYear === currentDate.year; // Kiểm tra ngày có đang được chọn không
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)} // Chọn ngày
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

export default function Horses() { // Component chính hiển thị trang Quản lý Ngựa
  const [isMobile, setIsMobile] = useState(false); // State kiểm tra kích thước màn hình
  useEffect(() => { // Hook xử lý giao diện cho mobile/desktop
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Chạy lần đầu
    window.addEventListener("resize", handleResize); // Lắng nghe khi resize
    return () => window.removeEventListener("resize", handleResize); // Dọn dẹp sự kiện
  }, []);

  const [horses, setHorses] = useState<any[]>([]); // State lưu trữ danh sách ngựa
  const [loading, setLoading] = useState(false); // State trạng thái loading
  const [error, setError] = useState(""); // State báo lỗi
  const [success, setSuccess] = useState(""); // State báo thành công
  const [searchQuery, setSearchQuery] = useState(""); // State từ khóa tìm kiếm
  const [filterStatus, setFilterStatus] = useState("ALL"); // State bộ lọc trạng thái ngựa

  // Edit Horse State (các state phục vụ việc chỉnh sửa thông tin ngựa)
  const [editingHorse, setEditingHorse] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editBreed, setEditBreed] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editRating, setEditRating] = useState<number>(52);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editSex, setEditSex] = useState("Gelding");
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchData = async () => { // Hàm lấy danh sách ngựa từ API
    setLoading(true); // Bật loading
    setError(""); // Xóa lỗi
    try {
      const allHorses = await api.get<any[]>("/public/horses"); // Gọi API
      setHorses(allHorses); // Cập nhật danh sách
    } catch (err: any) {
      setError(err.message || "Failed to load horse directory."); // Xử lý lỗi
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  useEffect(() => { // Hook gọi API lấy dữ liệu lần đầu
    fetchData();
  }, []);

  const showSuccess = (msg: string) => { // Hàm hiển thị thông báo thành công và tự tắt sau 4s
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Hàm xử lý khi chọn ảnh đại diện
    setError("");
    const file = e.target.files?.[0]; // Lấy file đầu tiên
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // Kiểm tra dung lượng (tối đa 1.5MB)
        setError("Avatar image size must be less than 1.5MB");
        return;
      }
      const reader = new FileReader(); // Sử dụng FileReader để đọc ảnh
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditAvatar(event.target.result as string); // Lưu ảnh dạng chuỗi Base64
        }
      };
      reader.readAsDataURL(file); // Đọc file thành data URL
    }
  };

  const handleOpenEdit = (h: any) => { // Hàm mở popup chỉnh sửa
    setEditingHorse(h); // Set đối tượng ngựa đang chỉnh sửa
    setEditName(h.name || ""); // Khởi tạo dữ liệu tên
    setEditBreed(h.breed || ""); // Khởi tạo dữ liệu giống
    setEditSex(h.sex || "Gelding"); // Khởi tạo dữ liệu giới tính
    setEditDob(h.dateOfBirth ? formatDateTime(h.dateOfBirth).split(" ")[0] : ""); // Định dạng lại ngày sinh
    setEditRating(h.currentRating || 52); // Khởi tạo rating
    setEditStatus(h.status || "ACTIVE"); // Khởi tạo trạng thái
    setEditAvatar(h.avatar || ""); // Khởi tạo ảnh đại diện
    setEditDescription(h.description || ""); // Khởi tạo mô tả
  };

  const validateAgeAndSex = (dobStr: string, sexVal: string): boolean => { // Hàm xác thực tuổi và giới tính của ngựa
    if (!dobStr || !sexVal) return true; // Bỏ qua nếu thiếu dữ liệu
    const parts = dobStr.split("-"); // Tách ngày tháng năm
    if (parts.length !== 3) return true;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const birthDate = new Date(year, month, day); // Tạo đối tượng Date của ngày sinh
    const today = new Date(); // Lấy ngày hiện tại
    
    let age = today.getFullYear() - birthDate.getFullYear(); // Tính số tuổi
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--; // Trừ 1 tuổi nếu chưa qua sinh nhật năm nay
    }
    
    // Kiểm tra quy tắc phân loại giới tính theo tuổi của ngựa đua
    if (age >= 4) { // Nếu từ 4 tuổi trở lên
      if (sexVal === "Colt") {
        alert("A Colt must be under 4 years old. For uncastrated male horses 4 years or older, please select 'Horse'.");
        return false;
      }
      if (sexVal === "Filly") {
        alert("A Filly must be under 4 years old. For female horses 4 years or older, please select 'Mare'.");
        return false;
      }
    } else { // Nếu dưới 4 tuổi
      if (sexVal === "Horse") {
        alert("A Horse (uncastrated male) must be 4 years or older. For uncastrated male horses under 4 years, please select 'Colt'.");
        return false;
      }
      if (sexVal === "Mare") {
        alert("A Mare must be 4 years or older. For female horses under 4 years, please select 'Filly'.");
        return false;
      }
    }
    return true; // Hợp lệ
  };

  const handleSaveEdit = async (e: React.FormEvent) => { // Hàm lưu thông tin sau khi chỉnh sửa
    e.preventDefault(); // Chặn hành vi submit mặc định
    if (!editingHorse) return;
    if (!validateAgeAndSex(editDob, editSex)) return; // Gọi xác thực
    setError("");
    setSuccess("");
    try {
      const formattedDob = editDob ? `${editDob} 00:00:00` : ""; // Chuẩn hóa chuỗi ngày
      const body = { // Tạo payload
        name: editName,
        breed: editBreed,
        sex: editSex,
        dateOfBirth: formattedDob,
        currentRating: editRating,
        status: editStatus,
        avatar: editAvatar,
        description: editDescription
      };

      await api.put(`/horses/${editingHorse.id}`, body); // Gọi API update
      showSuccess(`Horse "${editName}" updated successfully.`); // Báo thành công
      setEditingHorse(null); // Đóng form
      fetchData(); // Lấy lại dữ liệu mới nhất
    } catch (err: any) {
      setError(err.message || "Failed to update horse."); // Báo lỗi
    }
  };

  const filteredHorses = horses.filter(h => { // Lọc danh sách ngựa theo bộ lọc
    let matchesStatus = true;
    if (filterStatus !== "ALL") {
      matchesStatus = (h.status === filterStatus); // So sánh trạng thái
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim(); // Chuyển chuỗi tìm kiếm về chữ thường
      const nameMatch = (h.name || "").toLowerCase().includes(q); // Tìm theo tên
      const breedMatch = (h.breed || "").toLowerCase().includes(q); // Tìm theo giống
      const ownerIdMatch = String(h.ownerId || "").includes(q); // Tìm theo ID chủ
      matchesSearch = nameMatch || breedMatch || ownerIdMatch;
    }

    return matchesStatus && matchesSearch; // Kết hợp điều kiện lọc
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Alert Banners hiển thị lỗi và thành công */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-mono text-red-400">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-400">
          ✓ {success}
        </div>
      )}

      {/* Header and filters */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec" }}>{$t("Horse Registry Directory", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{$t("View, edit ratings, status, and information of all stable horses", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Ô nhập tìm kiếm */}
          <input
            type="text"
            placeholder={$t("Search horse name or breed...", (localStorage.getItem('app-lang') || 'vi'))}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, width: "14rem" }}
          />

          {/* Chọn bộ lọc trạng thái */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ ...selectStyle, width: "8rem" }}
          >
            <option value="ALL">{$t("All Status", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="ACTIVE">{$t("Active", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="PENDING">{$t("Pending", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="INJURED">{$t("Injured", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="INACTIVE">{$t("Inactive", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="REJECTED">{$t("Rejected", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="SUSPENDED">{$t("Suspended", (localStorage.getItem('app-lang') || 'vi'))}</option>
            <option value="RETIRED">{$t("Retired", (localStorage.getItem('app-lang') || 'vi'))}</option>
          </select>
        </div>
      </div>

      {/* Horses Table hiển thị danh sách ngựa */}
      <div className="rounded-xl border" style={{ background: "rgba(21,19,16,0.3)", borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {isMobile ? ( // Giao diện dạng thẻ (card) trên di động
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading horses data...", (localStorage.getItem('app-lang') || 'vi'))}</div>
            ) : filteredHorses.length > 0 ? (
              filteredHorses.map((h) => {
                let statusColor = "#a0a0a0"; // Đặt màu sắc theo trạng thái
                if (h.status === "ACTIVE") statusColor = "#4ade80";
                else if (h.status === "PENDING") statusColor = "#fbbf24";
                else if (h.status === "REJECTED" || h.status === "SUSPENDED") statusColor = "#f87171";

                return (
                  <div key={h.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {h.avatar ? ( // Nếu có avatar thì hiển thị ảnh
                          <img src={h.avatar} alt={h.name} style={{ width: "2.25rem", height: "2.25rem", objectFit: "cover", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.1)" }} />
                        ) : ( // Nếu không có avatar thì hiển thị biểu tượng mặc định
                          <div style={{ width: "2.25rem", height: "2.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>🐴</div>
                        )}
                        <div>
                          <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "14px" }}>{h.name}</div>
                          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>ID: #{h.id}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                        <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", color: statusColor, background: `${statusColor}15`, padding: "0.15rem 0.45rem", borderRadius: "0.25rem", border: `1px solid ${statusColor}25` }}>
                          {h.status}
                        </span>
                        <span style={{ fontWeight: "bold", color: "#fbbf24", fontSize: "13px" }}>⭐ {h.currentRating}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                      <span>{$t("Breed:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: "rgba(255,255,255,0.8)" }}>{h.breed}</span></span>
                      <span>|</span>
                      <span>{$t("Sex:", (localStorage.getItem('app-lang') || 'vi'))}<span style={{ color: "rgba(255,255,255,0.8)" }}>{h.sex || "Gelding"}</span></span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      <span>Owner #{h.ownerId}</span>
                      <span>•</span>
                      <span>{h.totalRaces || 0} races run</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                      {/* Nút sửa thông tin */}
                      <button onClick={() => handleOpenEdit(h)} style={{ padding: "0.375rem 0.75rem", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#c9a227", fontSize: "11px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>{$t("Edit Details", (localStorage.getItem('app-lang') || 'vi'))}</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No registered horses found.", (localStorage.getItem('app-lang') || 'vi'))}</div>
            )}
          </div>
        ) : ( // Giao diện dạng bảng cho desktop
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {["Horse", "Breed", "Sex", "Current Rating", "Owner ID", "Status", "Races Run", "Actions"].map((h, idx) => (
                    <th key={idx} style={{ padding: "0.75rem 1.5rem", textTransform: "uppercase", fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.35)", textAlign: idx === 7 ? "right" : "left" }}>{$t(h, (localStorage.getItem('app-lang') || 'vi'))}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("Loading horses data...", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                ) : filteredHorses.length > 0 ? (
                  filteredHorses.map((h) => {
                    let statusColor = "#a0a0a0";
                    if (h.status === "ACTIVE") statusColor = "#4ade80";
                    else if (h.status === "PENDING") statusColor = "#fbbf24";
                    else if (h.status === "REJECTED" || h.status === "SUSPENDED") statusColor = "#f87171";

                    return (
                      <tr key={h.id} className="hover:bg-white/[0.015] transition-colors">
                        <td style={{ padding: "0.75rem 1.5rem", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {h.avatar ? (
                            <img src={h.avatar} alt={h.name} style={{ width: "2.25rem", height: "2.25rem", objectFit: "cover", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.1)" }} />
                          ) : (
                            <div style={{ width: "2.25rem", height: "2.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.375rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>🐴</div>
                          )}
                          <div>
                            <div>{h.name}</div>
                            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>ID: #{h.id}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>{h.breed}</td>
                        <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>{h.sex || "Gelding"}</td>
                        <td style={{ padding: "0.75rem 1.5rem", fontWeight: "bold", color: "#fbbf24" }}>{h.currentRating}</td>
                        <td style={{ padding: "0.75rem 1.5rem", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>Owner #{h.ownerId}</td>
                        <td style={{ padding: "0.75rem 1.5rem" }}>
                          <span style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", color: statusColor, background: `${statusColor}15`, padding: "0.15rem 0.45rem", borderRadius: "0.25rem", border: `1px solid ${statusColor}25` }}>
                            {h.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1.5rem", color: "rgba(255,255,255,0.5)" }}>{h.totalRaces || 0} races</td>
                        <td style={{ padding: "0.75rem 1.5rem", textAlign: "right" }}>
                          <button onClick={() => handleOpenEdit(h)} style={{ padding: "0.375rem 0.75rem", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", color: "#c9a227", fontSize: "10px", fontFamily: "monospace", borderRadius: "0.25rem", cursor: "pointer" }}>{$t("Edit Details", (localStorage.getItem('app-lang') || 'vi'))}</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{$t("No registered horses found.", (localStorage.getItem('app-lang') || 'vi'))}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Horse Modal hiển thị sử dụng Portal */}
      {editingHorse && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "28rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,162,39,0.1)", paddingBottom: "0.75rem", marginBottom: "1.25rem" }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.875rem", color: "#f4f2ec" }}>{$t("Edit Horse Registry Details", (localStorage.getItem('app-lang') || 'vi'))}</h3>
              <button onClick={() => setEditingHorse(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }}>&times;</button>
            </div>
            {/* Form chỉnh sửa thông tin ngựa */}
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>{$t("Horse Name", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{$t("Breed", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="text" required value={editBreed} onChange={e => setEditBreed(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>{$t("Gender / Sex", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <select value={editSex} onChange={e => setEditSex(e.target.value)} style={selectStyle}>
                    <option value="Gelding">{$t("Gelding", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="Colt">{$t("Colt", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="Horse">{$t("Horse", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="Filly">{$t("Filly", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="Mare">{$t("Mare", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  </select>
                </div>
                <InlineDatePicker label={$t("Date of Birth", (localStorage.getItem('app-lang') || 'vi'))} value={editDob} onChange={setEditDob} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>{$t("Current Rating", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="number" required value={editRating} onChange={e => setEditRating(parseInt(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{$t("Status", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={selectStyle}>
                    <option value="PENDING">{$t("PENDING", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="ACTIVE">{$t("ACTIVE", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="INJURED">{$t("INJURED", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="INACTIVE">{$t("INACTIVE", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="REJECTED">{$t("REJECTED", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="SUSPENDED">{$t("SUSPENDED", (localStorage.getItem('app-lang') || 'vi'))}</option>
                    <option value="RETIRED">{$t("RETIRED", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>{$t("Horse Photo / Avatar", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>{$t("Biography / Description", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ ...inputStyle, height: "4.5rem", resize: "none" }} />
              </div>
              
              {editAvatar && ( // Hiển thị hình thu nhỏ (preview) nếu có ảnh
                <div>
                  <label style={labelStyle}>{$t("Photo Preview", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <img src={editAvatar} alt="Preview" style={{ width: "100%", height: "8rem", objectFit: "cover", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid rgba(201,162,39,0.1)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                {/* Nút hủy */}
                <button type="button" onClick={() => setEditingHorse(null)} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2e2e33", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
                {/* Nút lưu */}
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0c0a09", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: 700, cursor: "pointer" }}>{$t("Save Changes", (localStorage.getItem('app-lang') || 'vi'))}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Khai báo các style tái sử dụng
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: "0.5rem",
  color: "rgba(255,255,255,0.4)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  background: "#12141a",
  border: "1px solid rgba(201,162,39,0.22)",
  borderRadius: "0.5rem",
  color: "#f4f2ec",
  fontSize: "0.75rem",
  outline: "none",
};

import { useState, useRef, useEffect } from "react";

// Định nghĩa Props đầu vào cho bộ chọn ngày giờ
interface Props {
  value: string; // Chuỗi giá trị ngày giờ, định dạng: "dd-MM-yyyy HH:mm:ss"
  onChange: (val: string) => void; // Hàm callback kích hoạt khi thay đổi giá trị
  placeholder?: string; // Gợi ý nhập liệu
}

// Mảng hiển thị các thứ và tháng trong năm
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Hàm phân tích cú pháp chuỗi ngày giờ sang đối tượng Date và giờ, phút, giây cụ thể
function parseDMYHMS(val: string): { date: Date; hh: number; mm: number; ss: number } | null {
  const m = val.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const date = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  if (isNaN(date.getTime())) return null;
  return { date, hh: parseInt(m[4]), mm: parseInt(m[5]), ss: parseInt(m[6]) };
}

// Tiện ích đệm thêm số 0 ở trước nếu số nhỏ hơn 10 (ví dụ: 9 -> "09")
function fmt2(n: number) { return String(n).padStart(2, "0"); }

// Hàm chuyển đổi đối tượng Date và giờ, phút, giây sang chuỗi dạng dd-MM-yyyy HH:mm:ss để lưu
function toDMYHMS(d: Date, hh: number, mm: number, ss: number) {
  return `${fmt2(d.getDate())}-${fmt2(d.getMonth() + 1)}-${d.getFullYear()} ${fmt2(hh)}:${fmt2(mm)}:${fmt2(ss)}`;
}

/**
 * Component InlineDateTimePicker - Bộ chọn ngày và giờ (DateTimePicker) tùy biến.
 * - Cho phép chọn ngày trong tháng và thay đổi trực tiếp giờ, phút, giây bằng phím tăng/giảm hoặc nhập số.
 * - Lắng nghe các thay đổi bên ngoài để tự động đồng bộ hóa nội dung (Sync state).
 * - Tự động đóng lịch popup khi click chuột ra bên ngoài.
 */
export default function InlineDateTimePicker({ value, onChange, placeholder = "dd-MM-yyyy HH:mm:ss" }: Props) {
  const parsed = parseDMYHMS(value);
  const today = new Date();
  const [open, setOpen] = useState(false); // Trạng thái đóng/mở lịch popup
  const [view, setView] = useState<Date>(parsed?.date ?? today); // Tháng/năm hiện tại đang xem trên lịch
  const [pickedDate, setPickedDate] = useState<Date | null>(parsed?.date ?? null); // Ngày được chọn
  const [hh, setHh] = useState(parsed?.hh ?? 0); // Giờ
  const [mm, setMm] = useState(parsed?.mm ?? 0); // Phút
  const [ss, setSs] = useState(parsed?.ss ?? 0); // Giây
  const ref = useRef<HTMLDivElement>(null); // Trỏ đến container chính để bắt click bên ngoài

  // Đồng bộ hóa trạng thái bên trong khi chuỗi giá trị (value) thay đổi từ bên ngoài
  useEffect(() => {
    const p = parseDMYHMS(value);
    if (p) {
      setPickedDate(p.date);
      setHh(p.hh);
      setMm(p.mm);
      setSs(p.ss);
      setView(p.date);
    }
  }, [value]);

  // Đóng popup khi click chuột ra ngoài vùng lịch chọn
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Xác định thứ của ngày đầu tiên trong tháng (0: Chủ Nhật, 1: Thứ Hai,...)
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  // Xác định tổng số ngày trong tháng đang xem
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  // Tạo mảng các ô lịch (grid cells)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Kích hoạt khi người dùng click chọn ngày cụ thể
  const selectDay = (day: number) => {
    const d = new Date(view.getFullYear(), view.getMonth(), day);
    setPickedDate(d);
    onChange(toDMYHMS(d, hh, mm, ss));
  };

  // Cập nhật và lưu lại thông tin thời gian (giờ, phút, giây) đã chọn
  const applyTime = (h: number, m: number, s: number) => {
    const d = pickedDate ?? today;
    onChange(toDMYHMS(d, h, m, s));
  };

  // Xem tháng trước đó
  const prevMonth = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  // Xem tháng tiếp theo
  const nextMonth = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  // Kiểm tra xem ô ngày đó có trùng với ngày đang được chọn (active) hay không
  const isSelected = (day: number) => {
    if (!pickedDate) return false;
    return pickedDate.getFullYear() === view.getFullYear() &&
      pickedDate.getMonth() === view.getMonth() &&
      pickedDate.getDate() === day;
  };

  // Kiểm tra xem ô ngày đó có phải là ngày hôm nay (today) hay không
  const isToday = (day: number) =>
    today.getFullYear() === view.getFullYear() &&
    today.getMonth() === view.getMonth() &&
    today.getDate() === day;

  // Render ra bộ nhập số (Input Number) đi kèm phím mũi tên tăng/giảm giờ/phút/giây
  const numInput = (val: number, max: number, setter: (n: number) => void, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Nút bấm tăng trị số */}
        <button type="button" onClick={() => { const n = (val + 1) % (max + 1); setter(n); applyTime(label === "HH" ? n : hh, label === "MM" ? n : mm, label === "SS" ? n : ss); }}
          style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "0.7rem", lineHeight: 1, padding: "1px 4px" }}>▲</button>
        <input
          type="number"
          min={0}
          max={max}
          value={fmt2(val)}
          onChange={e => {
            const n = Math.min(max, Math.max(0, parseInt(e.target.value) || 0));
            setter(n);
            applyTime(label === "HH" ? n : hh, label === "MM" ? n : mm, label === "SS" ? n : ss);
          }}
          style={{ width: "36px", textAlign: "center", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "0.25rem", color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.75rem", outline: "none", padding: "2px 0" }}
        />
        {/* Nút bấm giảm trị số */}
        <button type="button" onClick={() => { const n = (val - 1 + max + 1) % (max + 1); setter(n); applyTime(label === "HH" ? n : hh, label === "MM" ? n : mm, label === "SS" ? n : ss); }}
          style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "0.7rem", lineHeight: 1, padding: "1px 4px" }}>▼</button>
      </div>
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Vùng nhập liệu và nút bấm */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: "0.5rem 0.75rem",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,162,39,0.22)",
            borderRadius: "0.5rem",
            color: "#f4f2ec",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => { setOpen(o => !o); }}
          style={{
            padding: "0.5rem",
            background: "rgba(201,162,39,0.15)",
            border: "1px solid rgba(201,162,39,0.3)",
            borderRadius: "0.5rem",
            color: "#c9a227",
            cursor: "pointer",
            fontSize: "1rem",
            lineHeight: 1,
          }}
          title="Open calendar"
        >
          📅
        </button>
      </div>

      {/* Lịch chọn ngày giờ thả xuống (Calendar popup) */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 999,
          background: "#1a1c24",
          border: "1px solid rgba(201,162,39,0.25)",
          borderRadius: "0.75rem",
          padding: "0.875rem",
          minWidth: "260px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Thanh chuyển đổi tháng nhanh */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>‹</button>
            <span style={{ color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>›</button>
          </div>

          {/* Tiêu đề các thứ trong tuần */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "0.375rem" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontWeight: 600, padding: "0.125rem 0" }}>{d}</div>
            ))}
          </div>

          {/* Grid hiển thị các ngày */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => (
              <div key={i}>
                {day === null ? <div /> : (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      cursor: "pointer",
                      background: isSelected(day) ? "#c9a227" : isToday(day) ? "rgba(201,162,39,0.15)" : "transparent",
                      color: isSelected(day) ? "#0c0a09" : isToday(day) ? "#c9a227" : "#f4f2ec",
                      fontWeight: isSelected(day) || isToday(day) ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (!isSelected(day)) (e.target as HTMLButtonElement).style.background = "rgba(201,162,39,0.2)"; }}
                    onMouseLeave={e => { if (!isSelected(day)) (e.target as HTMLButtonElement).style.background = isToday(day) ? "rgba(201,162,39,0.15)" : "transparent"; }}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Phân hệ điều khiển Giờ : Phút : Giây */}
          <div style={{ marginTop: "0.75rem", paddingTop: "0.625rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", textAlign: "center", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Time</p>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
              {numInput(hh, 23, setHh, "HH")}
              <span style={{ color: "#c9a227", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", marginTop: "8px" }}>:</span>
              {numInput(mm, 59, setMm, "MM")}
              <span style={{ color: "#c9a227", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", marginTop: "8px" }}>:</span>
              {numInput(ss, 59, setSs, "SS")}
            </div>
          </div>

          {/* Phím tắt Chọn ngày giờ hiện tại */}
          <div style={{ marginTop: "0.625rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => {
                const n = new Date();
                setPickedDate(n);
                setHh(n.getHours()); setMm(n.getMinutes()); setSs(n.getSeconds());
                onChange(toDMYHMS(n, n.getHours(), n.getMinutes(), n.getSeconds()));
                setOpen(false);
              }}
              style={{ background: "none", border: "none", color: "#c9a227", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer", textDecoration: "underline" }}
            >
              Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

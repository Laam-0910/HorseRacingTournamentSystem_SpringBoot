import { useState, useRef, useEffect } from "react";

// Định nghĩa Props đầu vào cho bộ chọn ngày
interface Props {
  value: string; // Chuỗi giá trị ngày, định dạng: "dd-MM-yyyy"
  onChange: (val: string) => void; // Hàm callback kích hoạt khi thay đổi ngày
  placeholder?: string; // Gợi ý nhập liệu
}

// Mảng hiển thị các thứ và tháng trong năm
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Hàm chuyển đổi chuỗi ngày định dạng dd-MM-yyyy sang đối tượng Date của Javascript
function parseDMY(val: string): Date | null {
  const m = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  if (isNaN(d.getTime())) return null;
  return d;
}

// Tiện ích đệm thêm số 0 ở trước nếu số nhỏ hơn 10 (ví dụ: 9 -> "09")
function fmt2(n: number) { return String(n).padStart(2, "0"); }

// Hàm chuyển đổi đối tượng Date sang chuỗi dd-MM-yyyy để đẩy lên form
function toDMY(d: Date) {
  return `${fmt2(d.getDate())}-${fmt2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/**
 * Component InlineDatePicker - Bộ chọn ngày (DatePicker) tùy biến giao diện phẳng, mượt mà.
 * - Hiển thị ô nhập ngày đi kèm nút bấm hiển thị lịch thả xuống.
 * - Hỗ trợ lắng nghe click bên ngoài để tự động đóng lịch popup.
 * - Cho phép di chuyển nhanh giữa các tháng/năm bằng dropdown select hoặc nút điều hướng.
 * - Cung cấp phím tắt "Today" để chọn nhanh ngày hiện tại.
 */
export default function InlineDatePicker({ value, onChange, placeholder = "dd-MM-yyyy" }: Props) {
  const parsed = parseDMY(value);
  const today = new Date();
  const [open, setOpen] = useState(false); // Trạng thái đóng/mở lịch popup
  const [view, setView] = useState<Date>(parsed ?? today); // Tháng/năm hiện tại đang xem trên lịch
  const ref = useRef<HTMLDivElement>(null); // Trỏ đến container chính để bắt click bên ngoài

  // Effect: Đóng popup chọn ngày khi người dùng click chuột ra ngoài vùng lịch chọn
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Xác định thứ của ngày đầu tiên trong tháng (0: Chủ Nhật, 1: Thứ Hai,...)
  // Đồng thời đổi mốc từ Chủ Nhật làm đầu sang Thứ Hai làm đầu nếu cần thiết
  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  // Xác định tổng số ngày trong tháng đang xem
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  // Tạo mảng các ô lịch (grid cells)
  const cells: (number | null)[] = [];
  // Thêm các ô trống (null) tượng trưng cho những ngày trống ở đầu tuần
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Điền các ngày từ ngày 1 đến ngày cuối tháng
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Chọn ngày thi đấu cụ thể, kích hoạt onChange để truyền giá trị lên cha
  const select = (day: number) => {
    const picked = new Date(view.getFullYear(), view.getMonth(), day);
    onChange(toDMY(picked));
    setOpen(false); // Đóng lịch
  };

  // Xem tháng trước đó
  const prevMonth = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  // Xem tháng tiếp theo
  const nextMonth = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  // Kiểm tra xem ô ngày đó có trùng với ngày đang được chọn (active) hay không
  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getFullYear() === view.getFullYear() &&
      parsed.getMonth() === view.getMonth() &&
      parsed.getDate() === day;
  };

  // Kiểm tra xem ô ngày đó có phải là ngày hôm nay (today) hay không
  const isToday = (day: number) =>
    today.getFullYear() === view.getFullYear() &&
    today.getMonth() === view.getMonth() &&
    today.getDate() === day;

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
          onClick={() => { setOpen(o => !o); if (!open && parsed) setView(parsed); }}
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

      {/* Lịch thả xuống khi bấm mở (Calendar popup) */}
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
          minWidth: "240px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Dòng chuyển hướng nhanh tháng/năm */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>‹</button>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {/* Menu dropdown chọn tháng */}
              <select
                value={view.getMonth()}
                onChange={(e) => setView(new Date(view.getFullYear(), parseInt(e.target.value), 1))}
                style={{
                  background: "transparent",
                  color: "#f4f2ec",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  border: "1px solid rgba(201,162,39,0.25)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  colorScheme: "dark",
                }}
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx} style={{ background: "#1a1c24", color: "#f4f2ec" }}>
                    {m}
                  </option>
                ))}
              </select>
              {/* Menu dropdown chọn năm */}
              <select
                value={view.getFullYear()}
                onChange={(e) => setView(new Date(parseInt(e.target.value), view.getMonth(), 1))}
                style={{
                  background: "transparent",
                  color: "#f4f2ec",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  border: "1px solid rgba(201,162,39,0.25)",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  outline: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  colorScheme: "dark",
                }}
              >
                {Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 50 + i).map(yr => (
                  <option key={yr} value={yr} style={{ background: "#1a1c24", color: "#f4f2ec" }}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>›</button>
          </div>

          {/* Dòng tiêu đề các thứ trong tuần */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "0.375rem" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontWeight: 600, padding: "0.125rem 0" }}>{d}</div>
            ))}
          </div>

          {/* Ô biểu diễn các ngày trong tháng */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => (
              <div key={i}>
                {day === null ? <div /> : (
                  <button
                    type="button"
                    onClick={() => select(day)}
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
                      transition: "background 0.15s",
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

          {/* Phím tắt Chọn ngày hôm nay */}
          <div style={{ marginTop: "0.625rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => { onChange(toDMY(today)); setOpen(false); }}
              style={{ background: "none", border: "none", color: "#c9a227", fontSize: "0.65rem", fontFamily: "monospace", cursor: "pointer", textDecoration: "underline" }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

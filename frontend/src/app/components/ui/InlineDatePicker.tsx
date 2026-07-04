import { useState, useRef, useEffect } from "react";

interface Props {
  value: string; // "dd-MM-yyyy"
  onChange: (val: string) => void;
  placeholder?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDMY(val: string): Date | null {
  const m = val.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return null;
  const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  if (isNaN(d.getTime())) return null;
  return d;
}

function fmt2(n: number) { return String(n).padStart(2, "0"); }

function toDMY(d: Date) {
  return `${fmt2(d.getDate())}-${fmt2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export default function InlineDatePicker({ value, onChange, placeholder = "dd-MM-yyyy" }: Props) {
  const parsed = parseDMY(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(parsed ?? today);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const select = (day: number) => {
    const picked = new Date(view.getFullYear(), view.getMonth(), day);
    onChange(toDMY(picked));
    setOpen(false);
  };

  const prevMonth = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const nextMonth = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getFullYear() === view.getFullYear() &&
      parsed.getMonth() === view.getMonth() &&
      parsed.getDate() === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === view.getFullYear() &&
    today.getMonth() === view.getMonth() &&
    today.getDate() === day;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Input + button */}
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

      {/* Calendar popup */}
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
          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>‹</button>
            <span style={{ color: "#f4f2ec", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "1rem", padding: "0.125rem 0.375rem" }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "0.375rem" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontWeight: 600, padding: "0.125rem 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
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

          {/* Today shortcut */}
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

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface InlineDatePickerProps {
  label: string;
  value: string; // format: dd-mm-yyyy
  onChange: (val: string) => void;
}

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
          placeholder="dd-mm-yyyy"
          className="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none cursor-pointer"
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
              <span className="font-bold text-white uppercase tracking-wider">{months[currentDate.month]} {currentDate.year}</span>
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

const DEFAULT_TEMPLATE_RULES = [
  { classLevelName: "Class 1", minRating: 95, maxRating: null as number | null, minPrize: 300000, maxPrize: 1000000 },
  { classLevelName: "Class 2", minRating: 80, maxRating: 94, minPrize: 200000, maxPrize: 299999 },
  { classLevelName: "Class 3", minRating: 60, maxRating: 79, minPrize: 100000, maxPrize: 199999 },
  { classLevelName: "Class 4", minRating: 40, maxRating: 59, minPrize: 50000, maxPrize: 99999 },
  { classLevelName: "Class 5", minRating: 0,  maxRating: 39, minPrize: 20000, maxPrize: 49999 },
];

export default function Season() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [seasonRules, setSeasonRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form states
  const [newSeasonName, setNewSeasonName] = useState("2026–2027 Grand Prix Season");
  const [newSeasonStartDate, setNewSeasonStartDate] = useState("");
  const [newSeasonEndDate, setNewSeasonEndDate] = useState("");
  const [classRuleMethod, setClassRuleMethod] = useState<"AUTOMATIC" | "MANUAL">("AUTOMATIC");
  const [manualRules, setManualRules] = useState(DEFAULT_TEMPLATE_RULES.map(r => ({ ...r })));

  // Extend modal states
  const [extendingSeason, setExtendingSeason] = useState<any | null>(null);
  const [extendStartDateInput, setExtendStartDateInput] = useState("");
  const [extendDateInput, setExtendDateInput] = useState("");
  const [extendError, setExtendError] = useState("");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return dateStr;
      return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    } catch { return dateStr; }
  };

  const toDbFormat = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const toDisplayFormat = (d: string) => {
    if (!d) return "";
    const parts = d.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  };

  const fetchSeasons = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/seasons");
      setSeasons(data);
      if (data.length > 0 && selectedSeasonId === null) setSelectedSeasonId(data[0].id);
    } catch (err: any) {
      setError(err.message || "Failed to fetch seasons.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async (seasonId: number) => {
    try {
      const rules = await api.get<any[]>(`/races/seasons/${seasonId}/rules`);
      setSeasonRules(rules);
    } catch (err: any) {
      console.error("Failed to load rules", err);
    }
  };

  useEffect(() => { fetchSeasons(); }, []);
  useEffect(() => { if (selectedSeasonId !== null) fetchRules(selectedSeasonId); }, [selectedSeasonId]);

  const handleToggle = async (id: number) => {
    try {
      await api.post(`/races/seasons/${id}/toggle`);
      fetchSeasons();
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleExtend = (season: any) => {
    setExtendingSeason(season);
    setExtendStartDateInput(toDisplayFormat(season.startDate || ""));
    setExtendDateInput(toDisplayFormat(season.endDate || ""));
    setExtendError("");
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtendError("");
    if (!extendStartDateInput || !extendDateInput) { setExtendError("Please select both start and end dates."); return; }
    const dbStart = toDbFormat(extendStartDateInput);
    const dbEnd = toDbFormat(extendDateInput);
    if (new Date(dbStart) >= new Date(dbEnd)) { setExtendError("Start Date must be before End Date."); return; }
    try {
      await api.post(`/races/seasons/${extendingSeason.id}/extend`, { startDate: dbStart, endDate: dbEnd });
      fetchSeasons();
      setExtendingSeason(null);
    } catch (err: any) {
      setExtendError("Failed to extend season: " + err.message);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!newSeasonStartDate || !newSeasonEndDate) { setError("Please select both start and end dates."); return; }
    const dbStart = toDbFormat(newSeasonStartDate);
    const dbEnd = toDbFormat(newSeasonEndDate);
    if (new Date(dbStart) >= new Date(dbEnd)) { setError("Start Date must be before End Date."); return; }

    const payload: any = { name: newSeasonName, startDate: dbStart, endDate: dbEnd, classRuleMethod };
    if (classRuleMethod === "MANUAL") payload.manualClasses = manualRules;

    try {
      await api.post("/races/seasons", payload);
      setSuccess("Season initialized successfully!");
      setNewSeasonName("2026–2027 Grand Prix Season");
      setNewSeasonStartDate("");
      setNewSeasonEndDate("");
      setClassRuleMethod("AUTOMATIC");
      setManualRules(DEFAULT_TEMPLATE_RULES.map(r => ({ ...r })));
      fetchSeasons();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError("Failed to create season: " + err.message);
    }
  };

  const updateManualRule = (index: number, field: string, value: string) => {
    setManualRules(prev => prev.map((r, i) =>
      i === index ? { ...r, [field]: field === "classLevelName" ? value : (value === "" ? null : Number(value)) } : r
    ));
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style={{ backgroundColor: "rgba(239,91,91,0.15)", color: "#ef5b5b", border: "1px solid rgba(239,91,91,0.3)" }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style={{ backgroundColor: "rgba(74,157,111,0.15)", color: "#4a9d6f", border: "1px solid rgba(74,157,111,0.3)" }}>
          ✓ {success}
        </div>
      )}

      {/* Create Season Form */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(201,162,39,0.10)" }}>
          <div>
            <p className="font-bold text-sm text-[#f4f2ec]" style={{ fontFamily: "'Roboto Slab', serif" }}>Initialize New Racing Season</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Configure the season framework and choose rule initialization method.</p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleCreateSeason} className="space-y-6">
            {/* Season basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Season Name</label>
                <input
                  type="text"
                  required
                  value={newSeasonName}
                  onChange={e => setNewSeasonName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)" }}
                  placeholder="e.g. 2026–2027 Grand Prix Season"
                />
              </div>
              <InlineDatePicker label="Season Start Date" value={newSeasonStartDate} onChange={setNewSeasonStartDate} />
              <InlineDatePicker label="Season End Date" value={newSeasonEndDate} onChange={setNewSeasonEndDate} />
            </div>

            {/* Class Rule Method */}
            <div className="space-y-3">
              <label className="block text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Class Rule Setup Method</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Automatic */}
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
                      <span className="block text-xs font-mono font-bold text-[#f4f2ec]">Automatic Class Rules</span>
                      <span className="block text-[10px] font-mono mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        TỰ ĐỘNG: Máy tự động thiết lập và áp dụng toàn bộ các Class mặc định (Class 1 - Class 5) vào Season này.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manual */}
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
                      <span className="block text-xs font-mono font-bold text-[#f4f2ec]">Manual Setup</span>
                      <span className="block text-[10px] font-mono mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                        THỦ CÔNG: Tự tay điều chỉnh trực tiếp điểm số và tiền thưởng cho cả 5 Class (Class 1 - Class 5) cho Season này.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Class Rules Table */}
            {classRuleMethod === "MANUAL" && (
              <div className="rounded-xl p-5 border space-y-3" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(201,162,39,0.15)" }}>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-[#c9a227]">Configure Season Classes (Manual Mode)</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Adjust ratings and prize ranges for the 5 season classes before initialization:</p>
                </div>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs font-mono text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                        <th className="py-2 pr-4 text-left">Class Level</th>
                        <th className="py-2 px-4 text-left">Min Rating</th>
                        <th className="py-2 px-4 text-left">Max Rating</th>
                        <th className="py-2 px-4 text-left">Min Prize ($)</th>
                        <th className="py-2 pl-4 text-left">Max Prize ($)</th>
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
                              placeholder="No limit"
                              className="rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] w-24"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="number"
                              step="0.01"
                              value={rule.minPrize ?? ""}
                              onChange={e => updateManualRule(index, "minPrize", e.target.value)}
                              required
                              className="rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] w-32"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                          </td>
                          <td className="py-2 pl-4">
                            <input
                              type="number"
                              step="0.01"
                              value={rule.maxPrize ?? ""}
                              onChange={e => updateManualRule(index, "maxPrize", e.target.value)}
                              required
                              className="rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] w-32"
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
              >
                ✓ Initialize Season
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Historical Seasons Table */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.028)", borderColor: "rgba(201,162,39,0.14)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(201,162,39,0.10)" }}>
          <div>
            <p className="font-bold text-sm text-[#f4f2ec]" style={{ fontFamily: "'Roboto Slab', serif" }}>Historical Seasons</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Previously completed and active racing seasons</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="p-8 text-sm text-center font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>Loading seasons...</p>
          ) : seasons.length === 0 ? (
            <p className="p-8 text-sm text-center font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>No seasons found.</p>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.10)", background: "rgba(255,255,255,0.018)" }}>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>Season ID</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>Season Name</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style={{ color: "rgba(255,255,255,0.35)" }}>Date Range</th>
                  <th className="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style={{ color: "rgba(255,255,255,0.35)" }}>Status / Actions</th>
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
                      {formatDate(season.startDate)} – {formatDate(season.endDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {season.status === "ACTIVE" ? (
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style={{ background: "#4a9d6f18", color: "#4a9d6f", borderColor: "#4a9d6f40" }}>Active</span>
                        ) : (
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>Closed</span>
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
                        >
                          Extend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Season Class Rules Footer */}
        {selectedSeasonId !== null && seasonRules.length > 0 && (
          <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(201,162,39,0.08)" }}>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Class Rules — Season S-{selectedSeasonId}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {seasonRules.map(rule => (
                <div key={rule.id} className="rounded-lg p-3 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(201,162,39,0.12)" }}>
                  <p className="text-[10px] font-mono font-bold" style={{ color: "#c9a227" }}>{rule.classLevel}</p>
                  <p className="text-[9px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Rating: {rule.minRating} – {rule.maxRating ?? "∞"}</p>
                  <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>Prize: ${rule.minPrize?.toLocaleString()} – ${rule.maxPrize?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Extend Season Modal */}
      {extendingSeason && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" style={{ background: "#151310", borderColor: "#2a2825" }}>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                Extend Season
              </h4>
              <button type="button" onClick={() => setExtendingSeason(null)} className="text-white/40 hover:text-white/80 text-lg transition">✕</button>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Season Name</span>
              <p className="text-white text-sm font-semibold">{extendingSeason.name}</p>
            </div>
            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InlineDatePicker label="New Start Date" value={extendStartDateInput} onChange={setExtendStartDateInput} />
                <InlineDatePicker label="New End Date" value={extendDateInput} onChange={setExtendDateInput} />
              </div>
              {extendError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">⚠️ {extendError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setExtendingSeason(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-lg transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition">Extend Season</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

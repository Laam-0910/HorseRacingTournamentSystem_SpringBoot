import { useState, useEffect, useRef } from "react";
import { api } from "../../../lib/api";
import { formatDateTime, parseSafeDate } from "../../utils/dateTimeHelper";

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

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { month: prev.month - 1, year: prev.year };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { month: prev.month + 1, year: prev.year };
    });
  };

  const handleSelectDay = (day: number) => {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(currentDate.month + 1).padStart(2, '0');
    onChange(`${formattedDay}-${formattedMonth}-${currentDate.year}`);
    setIsOpen(false);
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="relative">
      <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5 font-mono">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          value={value}
          placeholder="dd-mm-yyyy"
          className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:border-amber-500/50 focus:outline-none cursor-pointer transition font-mono"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-500 transition text-sm focus:outline-none"
        >
          📅
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-[110%] left-0 w-64 bg-[#100f0c] border border-[#2a2825] rounded-xl p-3.5 shadow-2xl z-50 space-y-3 select-none">
            <div className="flex items-center justify-between text-xs font-mono">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition"
              >
                ◀
              </button>
              <span className="font-bold text-white uppercase tracking-wider">
                {months[currentDate.month]} {currentDate.year}
              </span>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="text-white/60 hover:text-amber-500 p-1 rounded hover:bg-white/5 transition"
              >
                ▶
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[9px] font-semibold text-white/40 uppercase font-mono">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blanksArray.map(b => (
                <div key={`blank-${b}`} className="h-7 w-7"></div>
              ))}
              {daysArray.map(day => {
                const isSelected = 
                  selectedDay === day && 
                  selectedMonth === currentDate.month && 
                  selectedYear === currentDate.year;

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`h-7 w-7 text-[10px] font-mono rounded-lg flex items-center justify-center transition ${
                      isSelected 
                        ? "bg-amber-500 text-black font-bold" 
                        : "text-white/80 hover:bg-white/5 hover:text-amber-500"
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

export default function Season() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [seasonRules, setSeasonRules] = useState<any[]>([]);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStartDate, setNewSeasonStartDate] = useState("");
  const [newSeasonEndDate, setNewSeasonEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // States for Extend Season Modal
  const [extendingSeason, setExtendingSeason] = useState<any | null>(null);
  const [extendStartDateInput, setExtendStartDateInput] = useState<string>("");
  const [extendDateInput, setExtendDateInput] = useState<string>("");
  const [extendError, setExtendError] = useState<string>("");

  const fetchSeasons = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/seasons");
      setSeasons(data);
      if (data.length > 0 && selectedSeasonId === null) {
        setSelectedSeasonId(data[0].id);
      }
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

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeasonId !== null) {
      fetchRules(selectedSeasonId);
    }
  }, [selectedSeasonId]);

  const handleToggle = async (id: number) => {
    try {
      await api.post(`/races/seasons/${id}/toggle`);
      fetchSeasons();
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleExtend = (season: any) => {
    const rawStartDate = season.startDate ? season.startDate.substring(0, 10) : "";
    const rawEndDate = season.endDate ? season.endDate.substring(0, 10) : "";
    
    const toDisplay = (d: string) => {
      if (!d) return "";
      const parts = d.split("-");
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return d;
    };

    setExtendingSeason(season);
    setExtendStartDateInput(toDisplay(rawStartDate));
    setExtendDateInput(toDisplay(rawEndDate));
    setExtendError("");
  };

  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtendError("");
    
    if (!extendStartDateInput || !extendDateInput) {
      setExtendError("Please select both start and end dates.");
      return;
    }

    const toDbFormat = (d: string) => d ? `${d} 00:00:00` : "";

    const dbStartDate = toDbFormat(extendStartDateInput);
    const dbEndDate = toDbFormat(extendDateInput);

    const startD = parseSafeDate(dbStartDate);
    const endD = parseSafeDate(dbEndDate);
    if (startD && endD && startD >= endD) {
      setExtendError("Start Date must be before End Date.");
      return;
    }

    try {
      await api.post(`/races/seasons/${extendingSeason.id}/extend`, {
        startDate: dbStartDate,
        endDate: dbEndDate
      });
      fetchSeasons();
      setExtendingSeason(null);
    } catch (err: any) {
      setExtendError("Failed to extend season: " + err.message);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!newSeasonStartDate || !newSeasonEndDate) {
      setError("Please select both start and end dates.");
      return;
    }

    const toDbFormat = (d: string) => d ? `${d} 00:00:00` : "";

    const dbStartDate = toDbFormat(newSeasonStartDate);
    const dbEndDate = toDbFormat(newSeasonEndDate);

    const startD = parseSafeDate(dbStartDate);
    const endD = parseSafeDate(dbEndDate);
    if (startD && endD && startD >= endD) {
      setError("Start Date must be before End Date.");
      return;
    }

    try {
      await api.post("/races/seasons", {
        name: newSeasonName,
        startDate: dbStartDate,
        endDate: dbEndDate,
        status: "PENDING",
      });
      setNewSeasonName("");
      setNewSeasonStartDate("");
      setNewSeasonEndDate("");
      fetchSeasons();
    } catch (err: any) {
      setError("Failed to create season: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Seasons list & creation */}
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Seasons Management</span>
        </h3>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          {loading ? (
            <p className="p-6 text-sm text-white/40 text-center">Loading seasons...</p>
          ) : seasons.length > 0 ? (
            seasons.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSeasonId(s.id)}
                className={`p-4 flex items-center justify-between hover:bg-[#151310]/10 transition cursor-pointer ${selectedSeasonId === s.id ? "bg-amber-500/5" : ""}`}
              >
                <div>
                  <h4 className="font-bold text-white">{s.name}</h4>
                  <p className="text-xs text-white/60 mt-1">
                    📅 {formatDateTime(s.startDate)} to {formatDateTime(s.endDate)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase ${s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/10 text-white/60"}`}>
                    {s.status}
                  </span>
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(s.id);
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition ${s.status === "ACTIVE" ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"}`}
                  >
                    {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExtend(s);
                    }}
                    className="px-3 py-1.5 border border-amber-500/20 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition"
                  >
                    Extend
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-white/40 text-center">No seasons found.</p>
          )}
        </div>

        {/* Create Season Form */}
        <form onSubmit={handleCreateSeason} className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-white text-sm">Create New Season</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">Season Name</label>
              <input
                type="text"
                required
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-white text-xs"
                placeholder="E.g., Winter Season 2026"
              />
            </div>
            <InlineDatePicker
              label="Start Date"
              value={newSeasonStartDate}
              onChange={setNewSeasonStartDate}
            />
            <InlineDatePicker
              label="End Date"
              value={newSeasonEndDate}
              onChange={setNewSeasonEndDate}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
            >
              Add Season
            </button>
          </div>
        </form>
      </div>

      {/* Rules Column */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Class Rating Rules</span>
        </h3>
        {selectedSeasonId !== null ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-4">
            <div className="divide-y divide-white/5 text-xs">
              {seasonRules.map((rule) => (
                <div key={rule.id} className="py-2.5 flex justify-between">
                  <span className="font-bold text-amber-500">{rule.classLevel}</span>
                  <span className="text-white/80">Min: {rule.minRating} | Max: {rule.maxRating}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/40">Select a season to view its rules.</p>
        )}
      </div>

      {/* Extend Season Modal */}
      {extendingSeason && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151310] border border-[#2a2825] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in-fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white font-serif flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span>Extend Season End Date</span>
              </h4>
              <button 
                type="button"
                onClick={() => setExtendingSeason(null)}
                className="text-white/40 hover:text-white/80 text-lg transition focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Season Name</span>
              <p className="text-white text-sm font-semibold">{extendingSeason.name}</p>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InlineDatePicker
                  label="New Start Date"
                  value={extendStartDateInput}
                  onChange={setExtendStartDateInput}
                />
                <InlineDatePicker
                  label="New End Date"
                  value={extendDateInput}
                  onChange={setExtendDateInput}
                />
              </div>

              {extendError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                  ⚠️ {extendError}
                </p>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingSeason(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >
                  Extend Season
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

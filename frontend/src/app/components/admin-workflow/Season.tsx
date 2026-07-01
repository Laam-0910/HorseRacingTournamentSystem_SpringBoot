import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

export default function Season() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [seasonRules, setSeasonRules] = useState<any[]>([]);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonStartDate, setNewSeasonStartDate] = useState("");
  const [newSeasonEndDate, setNewSeasonEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}-${minutes}-${seconds}`;
    } catch {
      return dateStr;
    }
  };

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

  const handleExtend = async (season: any) => {
    const defaultDate = season.endDate ? season.endDate.substring(0, 10) : "";
    const newDate = prompt("Enter new End Date (yyyy-MM-dd):", defaultDate);
    if (!newDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      alert("Invalid date format. Please use yyyy-MM-dd.");
      return;
    }
    try {
      await api.post(`/races/seasons/${season.id}/extend`, { endDate: newDate });
      fetchSeasons();
    } catch (err: any) {
      alert("Failed to extend season: " + err.message);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/races/seasons", {
        name: newSeasonName,
        startDate: newSeasonStartDate,
        endDate: newSeasonEndDate,
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
            <div>
              <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">Start Date</label>
              <input
                type="datetime-local"
                step="1"
                required
                value={newSeasonStartDate}
                onChange={(e) => setNewSeasonStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">End Date</label>
              <input
                type="datetime-local"
                step="1"
                required
                value={newSeasonEndDate}
                onChange={(e) => setNewSeasonEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-white text-xs"
              />
            </div>
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
    </div>
  );
}

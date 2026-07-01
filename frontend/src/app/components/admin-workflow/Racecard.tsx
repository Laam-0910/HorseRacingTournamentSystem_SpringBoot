import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

export default function Racecard() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMeetings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<any[]>("/races/meetings");
      setMeetings(data);
      if (data.length > 0 && selectedMeetingId === null) {
        setSelectedMeetingId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRaces = async (meetingId: number) => {
    try {
      const data = await api.get<any[]>(`/public/races?meetingId=${meetingId}`);
      setRaces(data);
      if (data.length > 0) {
        setSelectedRaceId(data[0].id);
      } else {
        setSelectedRaceId(null);
        setEntries([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch races", err);
    }
  };

  const fetchEntries = async (raceId: number) => {
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
      setEntries(data);
    } catch (err: any) {
      console.error("Failed to load entries", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeetingId !== null) {
      fetchRaces(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  useEffect(() => {
    if (selectedRaceId !== null) {
      fetchEntries(selectedRaceId);
    }
  }, [selectedRaceId]);

  const handleAutoAssignGates = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/auto-assign-gates`);
      if (res.success) {
        setSuccess("Gates auto-assigned successfully.");
        fetchEntries(selectedRaceId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to auto-assign gates.");
    }
  };

  const handleAutoCalculateWeights = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/auto-calculate-weights`);
      if (res.success) {
        setSuccess("Handicap weights auto-calculated successfully.");
        fetchEntries(selectedRaceId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to calculate weights.");
    }
  };

  const handleCancelRace = async () => {
    if (selectedRaceId === null) return;
    if (!window.confirm("Are you sure you want to cancel this race? This will reset all entries.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/cancel`);
      if (res.success) {
        setSuccess("Race has been CANCELLED.");
        fetchEntries(selectedRaceId);
        // Refresh races list
        if (selectedMeetingId !== null) {
          fetchRaces(selectedMeetingId);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel race.");
    }
  };

  const handleGateChange = (idx: number, val: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx].entry.gateNumber = val ? parseInt(val) : null;
      return copy;
    });
  };

  const handleWeightChange = (idx: number, val: string) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[idx].entry.carriedWeight = val ? parseFloat(val) : null;
      return copy;
    });
  };

  const handleSaveRacecard = async () => {
    if (selectedRaceId === null) return;
    setError("");
    setSuccess("");
    try {
      const payload = entries.map((e) => ({
        id: e.entry.id,
        gateNumber: e.entry.gateNumber,
        carriedWeight: e.entry.carriedWeight,
      }));
      const res = await api.post<any>(`/admin/races/${selectedRaceId}/racecard`, payload);
      if (res.success) {
        setSuccess("Racecard saved successfully.");
        fetchEntries(selectedRaceId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save racecard.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Selector Area */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
            Select Meeting
          </label>
          <select
            value={selectedMeetingId || ""}
            onChange={(e) => setSelectedMeetingId(parseInt(e.target.value))}
            className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
            Select Race
          </label>
          {races.length > 0 ? (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {races.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRaceId(r.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition text-left ${selectedRaceId === r.id ? "bg-amber-500/10 border-amber-500 text-white" : "bg-white/[0.02] border-white/10 text-white/80 hover:border-white/5"}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{r.classLevel}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${r.status === "CANCELLED" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 mt-2">🏁 Distance: {r.distanceMeters}m ({r.trackType})</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">No scheduled races for this meeting.</p>
          )}
        </div>
      </div>

      {/* Racecard grid and actions */}
      <div className="lg:col-span-2 space-y-6">
        {selectedRaceId !== null ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-base font-bold text-white">Racecard Customization</h3>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAutoAssignGates}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >
                  Auto Gates
                </button>
                <button
                  onClick={handleAutoCalculateWeights}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >
                  Auto Weights
                </button>
                <button
                  onClick={handleCancelRace}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition"
                >
                  Cancel Race
                </button>
              </div>
            </div>

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

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                    <th className="px-6 py-4">Horse</th>
                    <th className="px-6 py-4">Jockey</th>
                    <th className="px-6 py-4 w-28">Gate</th>
                    <th className="px-6 py-4 w-28">Carried Weight (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {entries.length > 0 ? (
                    entries.map((e, idx) => (
                      <tr key={idx} className="hover:bg-[#151310]/10 transition">
                        <td className="px-6 py-4">
                          <h5 className="font-semibold text-white">{e.horse?.name || "Unknown"}</h5>
                          <p className="text-[10px] text-white/40 mt-0.5">Rating: {e.horse?.currentRating}</p>
                        </td>
                        <td className="px-6 py-4 text-white/80">
                          {e.jockey?.username || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={e.entry.gateNumber || ""}
                            onChange={(event) => handleGateChange(idx, event.target.value)}
                            className="w-16 px-2 py-1 bg-black/60 border border-white/5 rounded text-center text-white text-xs"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.1"
                            value={e.entry.carriedWeight || ""}
                            onChange={(event) => handleWeightChange(idx, event.target.value)}
                            className="w-20 px-2 py-1 bg-black/60 border border-white/5 rounded text-center text-white text-xs"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-white/40">
                        No approved entries for this race.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {entries.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRacecard}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >
                  Save Custom Changes
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-white/40">Please select a race to configure the racecard.</p>
        )}
      </div>
    </div>
  );
}

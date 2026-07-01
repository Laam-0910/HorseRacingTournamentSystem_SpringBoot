import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface RefereeConfirmProps {
  raceId: number;
  onBack: () => void;
}

export default function RefereeConfirm({ raceId, onBack }: RefereeConfirmProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [times, setTimes] = useState<Record<number, string>>({});
  const [stewardReport, setStewardReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
        setEntries(data);
        const initialPos: Record<number, string> = {};
        const initialTimes: Record<number, string> = {};
        data.forEach((e) => {
          initialPos[e.entry.id] = e.entry.finalPosition ? e.entry.finalPosition.toString() : "";
          initialTimes[e.entry.id] = e.entry.finishTime || "";
        });
        setPositions(initialPos);
        setTimes(initialTimes);
      } catch (err: any) {
        setError(err.message || "Failed to load race entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [raceId]);

  const handlePositionChange = (entryId: number, val: string) => {
    setPositions((prev) => ({
      ...prev,
      [entryId]: val,
    }));
  };

  const handleTimeChange = (entryId: number, val: string) => {
    setTimes((prev) => ({
      ...prev,
      [entryId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resultsPayload = entries.map((e) => ({
        id: e.entry.id,
        finalPosition: positions[e.entry.id] ? parseInt(positions[e.entry.id]) : null,
        finishTime: times[e.entry.id] || null,
      }));

      const res = await api.post<any>("/referee/results", {
        raceId,
        stewardReport,
        results: resultsPayload,
      });

      if (res.success) {
        alert("Results successfully verified and released!");
        onBack();
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify results.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4">Horse</th>
                <th className="px-6 py-4">Jockey</th>
                <th className="px-6 py-4 w-28">Gate</th>
                <th className="px-6 py-4 w-32">Final Position</th>
                <th className="px-6 py-4 w-40">Finish Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length > 0 ? (
                entries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-[#151310]/10 transition">
                    <td className="px-6 py-4 font-semibold text-white">{e.horse?.name}</td>
                    <td className="px-6 py-4 text-white/80">{e.jockey?.username}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-500">{e.entry.gateNumber || "N/A"}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="1"
                        required
                        value={positions[e.entry.id] || ""}
                        onChange={(event) => handlePositionChange(e.entry.id, event.target.value)}
                        className="w-20 px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-center text-white text-xs"
                        placeholder="E.g., 1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        required
                        value={times[e.entry.id] || ""}
                        onChange={(event) => handleTimeChange(e.entry.id, event.target.value)}
                        className="w-32 px-2.5 py-1.5 bg-black/60 border border-white/5 rounded-lg text-center text-white text-xs font-mono"
                        placeholder="E.g., 1:14.23"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    No entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Steward Incident Report</label>
          <textarea
            value={stewardReport}
            onChange={(e) => setStewardReport(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/[0.015] border border-white/10 rounded-2xl text-white text-xs h-24 resize-none"
            placeholder="Log any incidents, disqualifications, or comments about the race outcome..."
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 border border-white/5 hover:bg-[#151310]/50 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || entries.length === 0}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition"
          >
            {loading ? "Verifying..." : "Verify & Release Results"}
          </button>
        </div>
      </form>
    </div>
  );
}

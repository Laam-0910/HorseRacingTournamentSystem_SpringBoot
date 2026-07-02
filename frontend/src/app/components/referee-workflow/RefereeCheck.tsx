import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

interface RefereeCheckProps {
  raceId: number;
  onBack: () => void;
}

export default function RefereeCheck({ raceId, onBack }: RefereeCheckProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [weighOutWeights, setWeighOutWeights] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
        setEntries(data);
        const initialStatuses: Record<number, string> = {};
        const initialWeights: Record<number, string> = {};
        data.forEach((e) => {
          initialStatuses[e.entry.id] = "APPROVED"; // Default clear
          initialWeights[e.entry.id] = e.entry.carriedWeight ? e.entry.carriedWeight.toString() : "52.0";
        });
        setStatuses(initialStatuses);
        setWeighOutWeights(initialWeights);
      } catch (err: any) {
        setError(err.message || "Failed to load race entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [raceId]);

  const handleStatusChange = (entryId: number, status: string) => {
    setStatuses((prev) => ({
      ...prev,
      [entryId]: status,
    }));
  };

  const handleWeightChange = (entryId: number, val: string) => {
    setWeighOutWeights((prev) => ({
      ...prev,
      [entryId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = entries.map((e) => ({
        entryId: e.entry.id,
        status: statuses[e.entry.id] || "APPROVED",
        weighOutWeight: weighOutWeights[e.entry.id] ? parseFloat(weighOutWeights[e.entry.id]) : 52.0,
      }));

      const res = await api.post<any>("/referee/pre-check", {
        raceId,
        entries: payload,
      });

      if (res.success) {
        alert("Pre-race check completed. Race is now RUNNING.");
        onBack();
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit check.");
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
                <th className="px-6 py-4">Gate</th>
                <th className="px-6 py-4">Weigh-Out Weight</th>
                <th className="px-6 py-4 w-44">Veterinary Status</th>
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
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={weighOutWeights[e.entry.id] || ""}
                          onChange={(event) => handleWeightChange(e.entry.id, event.target.value)}
                          className="w-20 px-2 py-1.5 bg-black/60 border border-white/5 rounded-lg text-center text-white text-xs"
                          placeholder="52.0"
                        />
                        <span className="text-xs text-white/40">kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={statuses[e.entry.id] || "APPROVED"}
                        onChange={(event) => handleStatusChange(e.entry.id, event.target.value)}
                        className="bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="APPROVED">Cleared to Race</option>
                        <option value="REJECTED">Scratched (Injured)</option>
                      </select>
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
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
          >
            {loading ? "Submitting..." : "Clear and Start Race"}
          </button>
        </div>
      </form>
    </div>
  );
}

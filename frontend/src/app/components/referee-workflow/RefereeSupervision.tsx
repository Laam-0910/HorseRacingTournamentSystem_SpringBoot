import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { confirm } from "../../../lib/confirm";

interface RefereeSupervisionProps {
  raceId: number;
  onBack: () => void;
}

export default function RefereeSupervision({ raceId, onBack }: RefereeSupervisionProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedJockeyId, setSelectedJockeyId] = useState("");
  const [description, setDescription] = useState("");
  const [penalty, setPenalty] = useState("");
  const [stewardReport, setStewardReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEntries = async () => {
    try {
      const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || "Failed to load entries.");
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [raceId]);

  const handleLogViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const selectedEntry = entries.find((en) => en.jockey?.id === parseInt(selectedJockeyId));
    if (!selectedEntry) {
      setError("Please select a jockey.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        raceId,
        jockeyId: selectedEntry.jockey.id,
        horseId: selectedEntry.horse.id,
        description,
        penalty,
        status: "RESOLVED",
      };

      const res = await api.post<any>("/referee/violations", payload);
      if (res.success) {
        setSuccess("Violation logged successfully.");
        setDescription("");
        setPenalty("");
        setSelectedJockeyId("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log violation.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stewardReport.trim()) {
      setError("Steward report is required for emergency stop.");
      return;
    }
    if (!await confirm("CRITICAL: Are you sure you want to stop this race?")) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await api.post<any>(`/referee/races/${raceId}/stop`, {
        stewardReport,
      });
      if (res.success) {
        alert("Emergency stop executed. Race status set to STOPPED.");
        onBack();
      }
    } catch (err: any) {
      setError(err.message || "Emergency stop failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Log Violation */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Log Race Violation</span>
        </h3>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleLogViolation} className="bg-white/[0.015] border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Jockey & Horse</label>
            <select
              value={selectedJockeyId}
              required
              onChange={(e) => setSelectedJockeyId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="">-- Select Violator --</option>
              {entries.map((en, idx) => (
                <option key={idx} value={en.jockey?.id}>
                  Jockey: {en.jockey?.username} (Horse: {en.horse?.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Violation Detail</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs h-24 resize-none"
              placeholder="Describe the incident (e.g. crossing track early)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Penalty Applied</label>
            <input
              type="text"
              required
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder="E.g. $200 Fine & 1 Race Ban"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
          >
            Log Violation
          </button>
        </form>
      </div>

      {/* Emergency Stop */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-rose-500 flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          <span>Emergency Stop Control</span>
        </h3>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmergencyStop} className="bg-rose-950/5 border border-rose-900/20 p-5 rounded-2xl space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">Emergency Reason</label>
            <textarea
              required
              value={stewardReport}
              onChange={(e) => setStewardReport(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs h-24 resize-none"
              placeholder="State why the race must be stopped (e.g. dangerous track conditions)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/15"
          >
            Execute Emergency Stop
          </button>
        </form>

        <div className="pt-8">
          <button
            onClick={onBack}
            className="w-full py-2.5 border border-white/5 hover:bg-[#151310]/50 text-xs font-semibold rounded-xl transition"
          >
            Back to Duties
          </button>
        </div>
      </div>
    </div>
  );
}

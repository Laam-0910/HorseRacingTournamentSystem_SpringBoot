import { useState, useEffect } from "react";
import { api } from "../../../lib/api";

export default function LiveSettings() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [youtubeUrls, setYoutubeUrls] = useState<Record<number, string>>({});
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
      const urls: Record<number, string> = {};
      data.forEach((r) => {
        urls[r.id] = r.youtubeLiveUrl || "";
      });
      setYoutubeUrls(urls);
    } catch (err: any) {
      console.error("Failed to load races", err);
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

  const handleUrlChange = (raceId: number, val: string) => {
    setYoutubeUrls((prev) => ({
      ...prev,
      [raceId]: val,
    }));
  };

  const handleSave = async (raceId: number) => {
    setError("");
    setSuccess("");
    const url = (youtubeUrls[raceId] || "").trim();

    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    try {
      await api.post(`/admin/races/${raceId}/live`, { youtubeLiveUrl: url });
      setSuccess("Livestream URL updated successfully.");
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId);
    } catch (err: any) {
      setError(err.message || "Failed to update livestream link.");
    }
  };

  const handleRemove = async (raceId: number) => {
    setError("");
    setSuccess("");
    try {
      await api.post(`/admin/races/${raceId}/live/remove`);
      setSuccess("Livestream URL removed.");
      if (selectedMeetingId !== null) fetchRaces(selectedMeetingId);
    } catch (err: any) {
      setError(err.message || "Failed to remove livestream link.");
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Race Livestream Broadcasting</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">Select Meeting:</span>
          <select
            value={selectedMeetingId || ""}
            onChange={(e) => setSelectedMeetingId(parseInt(e.target.value))}
            className="bg-black/60 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-white/40 text-center">Loading races...</p>
        ) : races.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4">Class Level</th>
                <th className="px-6 py-4">Race Status</th>
                <th className="px-6 py-4">YouTube Broadcast URL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {races.map((r) => (
                <tr key={r.id} className="hover:bg-[#151310]/10 transition">
                  <td className="px-6 py-4 font-semibold text-white">{r.classLevel}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      disabled={r.status !== "RUNNING"}
                      value={youtubeUrls[r.id] || ""}
                      onChange={(e) => handleUrlChange(r.id, e.target.value)}
                      className={`w-full px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-white text-xs ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                      placeholder={r.status === "RUNNING" ? "Enter YouTube link" : "Only running races can broadcast"}
                    />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      disabled={r.status !== "RUNNING"}
                      onClick={() => handleSave(r.id)}
                      className={`px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      Save
                    </button>
                    {r.youtubeLiveUrl && (
                      <button
                        disabled={r.status !== "RUNNING"}
                        onClick={() => handleRemove(r.id)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${r.status !== "RUNNING" ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed" : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"}`}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-white/40 text-center">No races scheduled for this meeting.</p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { formatDateTime, formatForDateTimeLocal, formatForApi } from "../../utils/dateTimeHelper";

export default function RaceMeeting() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const ms = await api.get<any[]>("/races/meetings");
      setMeetings(ms);

      const ss = await api.get<any[]>("/races/seasons");
      setSeasons(ss);
      if (ss.length > 0 && !seasonId) {
        setSeasonId(ss[0].id.toString());
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (m: any) => {
    setEditingMeeting(m);
    setName(m.name || "");
    setVenue(m.venue || "");
    setSeasonId(m.seasonId ? m.seasonId.toString() : "");
    setDate(m.startDate || m.date || "");
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingMeeting(null);
    setName("");
    setVenue("");
    setDate("");
    if (seasons.length > 0) {
      setSeasonId(seasons[0].id.toString());
    }
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this race meeting? This action cannot be undone.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.delete(`/races/meetings/${id}`);
      setSuccess("Race meeting deleted successfully.");
      fetchData();
      if (editingMeeting?.id === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete meeting.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        startDate: date,
        venue,
        seasonId: parseInt(seasonId),
      };

      if (editingMeeting) {
        await api.post(`/races/meetings/${editingMeeting.id}`, payload);
        setSuccess("Race meeting updated successfully.");
        setEditingMeeting(null);
      } else {
        await api.post("/races/meetings", payload);
        setSuccess("Race meeting created successfully.");
      }

      setName("");
      setDate("");
      setVenue("");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save meeting.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Meetings List */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>Race Meetings Directory</span>
        </h3>

        {loading ? (
          <p className="text-sm text-white/40">Loading meetings...</p>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Meeting Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Season ID</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-[#151310]/15 transition">
                    <td className="px-6 py-4 font-mono text-white/40">#{m.id}</td>
                    <td className="px-6 py-4 font-semibold text-white">{m.name}</td>
                    <td className="px-6 py-4 text-white/80">{formatDateTime(m.startDate || m.date)}</td>
                    <td className="px-6 py-4 text-white/60">📍 {m.venue}</td>
                    <td className="px-6 py-4 text-white/40">Season #{m.seasonId}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(m)}
                        className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{editingMeeting ? `Edit Meeting #${editingMeeting.id}` : "Add New Meeting"}</span>
        </h3>

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

        <form onSubmit={handleSubmit} className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Meeting Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder="E.g., Grand Prix Sunday"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Date</label>
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="dd-mm-yyyy hh:mm:ss"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Venue</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder="E.g., Epsom Downs Track"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">Season Association</label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
          >
            {editingMeeting ? "Save Changes" : "Create Meeting"}
          </button>
          {editingMeeting && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition mt-2"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

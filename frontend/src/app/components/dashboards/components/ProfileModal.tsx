import { useState, useEffect } from "react";
import { api } from "../../../../lib/api";

interface ProfileModalProps {
  userId: number;
  onClose: () => void;
}

export default function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<any>(`/public/users/${userId}/profile`);
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const formatDateString = (dStr: string) => {
    if (!dStr) return "—";
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
      <div 
        className="w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        style={{ background: "#100f0d", border: "1px solid rgba(201,162,39,0.18)" }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-white/50 hover:text-white transition z-10 text-xl font-mono p-1 rounded-full hover:bg-white/5"
        >
          ✕
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <span className="animate-spin text-2xl text-amber-500">⏳</span>
            <p className="text-white/60 text-xs font-mono">Retrieving HKJC registry profile...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-rose-400 font-mono text-sm">⚠️ {error}</p>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-semibold rounded-lg text-white hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header section */}
            <div 
              className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-b"
              style={{ borderColor: "rgba(201,162,39,0.10)", background: "linear-gradient(to bottom, rgba(201,162,39,0.04), transparent)" }}
            >
              {profile.avatar ? (
                <img 
                  src={profile.avatar} 
                  alt={profile.fullName || profile.username} 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-amber-500/30"
                />
              ) : (
                <div 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl font-bold font-mono border-2 border-amber-500/20"
                  style={{ background: "rgba(255,255,255,0.02)", color: "#c9a227" }}
                >
                  {(profile.fullName || profile.username)?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-[#f4f2ec]" style={{ fontFamily: "'Roboto Slab', serif" }}>
                    {profile.fullName || profile.username}
                  </h2>
                  <span 
                    className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded border inline-block"
                    style={profile.roleId === 3 
                      ? { background: "rgba(59,130,246,0.1)", color: "#60a5fa", borderColor: "#60a5fa30" }
                      : { background: "rgba(74,157,111,0.1)", color: "#4a9d6f", borderColor: "#4a9d6f30" }
                    }
                  >
                    {profile.roleId === 3 ? "Jockey" : "Horse Owner"}
                  </span>
                </div>
                <p className="text-xs text-white/40 font-mono">{profile.email}</p>
                <p className="text-xs text-white/70 italic max-w-xl leading-relaxed">
                  {profile.biography || "No professional biography registered in registry profile database."}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Stats column */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-3">Registry Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {profile.roleId === 3 ? (
                      <>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Body Weight</p>
                          <p className="text-lg font-bold font-mono text-white mt-1">{profile.weight} kg</p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Total Rides</p>
                          <p className="text-lg font-bold font-mono text-white mt-1">{profile.totalRides}</p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Wins</p>
                          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">{profile.wins}</p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Top 3 Finish</p>
                          <p className="text-lg font-bold font-mono text-amber-400 mt-1">{profile.top3}</p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center col-span-2">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Win / Top 3 Rates</p>
                          <p className="text-sm font-bold font-mono text-white mt-1">
                            {profile.winRate.toFixed(1)}% / {profile.top3Rate.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Active Stable</p>
                          <p className="text-lg font-bold font-mono text-white mt-1">{profile.stableSize} Horses</p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Avg Finish Position</p>
                          <p className="text-lg font-bold font-mono text-white mt-1">
                            {profile.avgPosition > 0 ? `#${profile.avgPosition.toFixed(1)}` : "N/A"}
                          </p>
                        </div>
                        <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl text-center col-span-2">
                          <p className="text-[9px] font-mono text-white/40 uppercase">Total Prize Earnings</p>
                          <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                            ${profile.totalEarnings.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Owner active horses list */}
                {profile.roleId === 2 && profile.activeHorses && profile.activeHorses.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-3">Owned Stable Horses</h4>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {profile.activeHorses.map((h: any) => (
                        <div 
                          key={h.id} 
                          className="flex justify-between items-center p-2.5 rounded-lg border border-white/5"
                          style={{ background: "rgba(255,255,255,0.01)" }}
                        >
                          <div>
                            <p className="text-xs font-semibold text-white">{h.name}</p>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">{h.breed}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-500">Rating {h.currentRating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent History Table column */}
              <div className="lg:col-span-2 flex flex-col">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-3">Recent Performance (Last 10 Races)</h4>
                <div className="flex-1 overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full border-collapse text-left min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.01] text-[9px] font-mono uppercase text-white/40">
                        <th className="px-4 py-3">Meeting</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3">Horse</th>
                        <th className="px-4 py-3 text-center">Pos</th>
                        <th className="px-4 py-3 text-right">Prize</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-mono">
                      {profile.history?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-white/40 italic">
                            No recent race records found.
                          </td>
                        </tr>
                      ) : (
                        profile.history?.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-white/90">{r.meetingName}</p>
                              <p className="text-[9px] text-white/40 mt-0.5">{formatDateString(r.startTime)}</p>
                            </td>
                            <td className="px-4 py-3 text-white/80">{r.classLevel}</td>
                            <td className="px-4 py-3 text-white/80">{r.horseName}</td>
                            <td className="px-4 py-3 text-center">
                              <span 
                                className={`px-2 py-0.5 rounded font-bold ${
                                  r.position === "1" ? "bg-amber-500/20 text-amber-500" :
                                  ["2","3"].includes(r.position) ? "bg-emerald-500/20 text-emerald-400" :
                                  r.position === "DQ" ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-white/60"
                                }`}
                              >
                                {r.position === "1" ? "1st" : r.position === "2" ? "2nd" : r.position === "3" ? "3rd" : r.position}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                              {r.prizeMoney > 0 ? `$${r.prizeMoney.toLocaleString()}` : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

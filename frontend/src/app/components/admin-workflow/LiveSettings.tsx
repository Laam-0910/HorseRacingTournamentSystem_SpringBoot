import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import CameraBroadcasterModal from "../livestream/CameraBroadcasterModal";

/**
 */
export default function LiveSettings() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [camRes, setCamRes] = useState(() => localStorage.getItem("cam_res") || "480p");
  const [camFps, setCamFps] = useState(() => localStorage.getItem("cam_fps") || "15");
  const [camQuality, setCamQuality] = useState(() => localStorage.getItem("cam_quality") || "0.5");

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
      setError(getErrMsg(err, "Failed to load meetings."));
    } finally {
      setLoading(false);
    }
  };

  const fetchRaces = async (meetingId: number) => {
    try {
      const data = await api.get<any[]>(`/public/races?meetingId=${meetingId}`);
      setRaces(data);
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Camera Live Setting", (localStorage.getItem('app-lang') || 'en'))}</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">{$t("Select Meeting:", (localStorage.getItem('app-lang') || 'en'))}</span>
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

      {/* Configuration Panel for FPS, Resolution, and Graphics Quality */}
      <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span>⚙️</span> Camera Quality & Hardware Configuration
          </h4>
          <span className="text-[10px] text-white/50 font-mono">Real-time Stream Encoder Settings</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase text-white/50 mb-1">
              Stream Resolution
            </label>
            <select
              value={camRes}
              onChange={(e) => {
                setCamRes(e.target.value);
                localStorage.setItem("cam_res", e.target.value);
              }}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="360p">360p (640x360 - Low Bandwidth)</option>
              <option value="480p">480p (854x480 - Recommended)</option>
              <option value="720p">720p (1280x720 - HD)</option>
              <option value="1080p">1080p (1920x1080 - Full HD)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-white/50 mb-1">
              Frame Rate (FPS)
            </label>
            <select
              value={camFps}
              onChange={(e) => {
                setCamFps(e.target.value);
                localStorage.setItem("cam_fps", e.target.value);
              }}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="5">5 FPS (Ultra Low Bandwidth)</option>
              <option value="10">10 FPS (Low Latency)</option>
              <option value="15">15 FPS (Standard Smooth)</option>
              <option value="24">24 FPS (Cinematic)</option>
              <option value="30">30 FPS (High Performance)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-white/50 mb-1">
              JPEG Quality / Compression
            </label>
            <select
              value={camQuality}
              onChange={(e) => {
                setCamQuality(e.target.value);
                localStorage.setItem("cam_quality", e.target.value);
              }}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="0.3">30% - Low Quality (Fastest)</option>
              <option value="0.5">50% - Balanced (Recommended)</option>
              <option value="0.75">75% - High Quality</option>
              <option value="0.9">90% - Ultra Quality</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inactive Meeting/Season Warning Banner */}
      {(() => {
        const currentM = meetings.find(m => m.id === selectedMeetingId);
        const isInactive = currentM && (
          currentM.status === "INACTIVE" ||
          currentM.status === "CANCELLED" ||
          (currentM as any).seasonStatus === "CLOSED" ||
          (currentM as any).seasonStatus === "INACTIVE" ||
          (currentM as any).seasonStatus === "CANCELLED"
        );
        if (!isInactive) return null;
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>Livestreaming features are disabled because Race Meeting "{currentM?.name}" or its parent Season is currently INACTIVE. Re-activate the Meeting and Season to enable broadcasting.</span>
          </div>
        );
      })()}

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-white/40 text-center">{$t("Loading races...", (localStorage.getItem('app-lang') || 'en'))}</p>
        ) : races.length > 0 ? (
          (() => {
            const currentM = meetings.find(m => m.id === selectedMeetingId);
            const isMeetingInactive = !!(currentM && (
              currentM.status === "INACTIVE" ||
              currentM.status === "CANCELLED" ||
              (currentM as any).seasonStatus === "CLOSED" ||
              (currentM as any).seasonStatus === "INACTIVE" ||
              (currentM as any).seasonStatus === "CANCELLED"
            ));

            return isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {races.map((r) => (
                  <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontWeight: "bold", color: "#fff", fontSize: "14px" }}>{r.classLevel}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase w-fit ${r.status === "RUNNING" ? "bg-rose-500/10 text-rose-400" : "bg-white/10 text-white/60"}`}>
                        {r.status}
                      </span>
                    </div>
                    <button
                      disabled={r.status !== "RUNNING" || isMeetingInactive}
                      onClick={() => window.dispatchEvent(new CustomEvent("OPEN_BROADCASTER", { detail: r }))}
                      className={`px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${(r.status !== "RUNNING" || isMeetingInactive) ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <span>📷</span> {$t("Camera Broadcast", (localStorage.getItem('app-lang') || 'en'))}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                    <th className="px-6 py-4">{$t("Class Level", (localStorage.getItem('app-lang') || 'en'))}</th>
                    <th className="px-6 py-4">{$t("Race Status", (localStorage.getItem('app-lang') || 'en'))}</th>
                    <th className="px-6 py-4 text-right">{$t("Actions", (localStorage.getItem('app-lang') || 'en'))}</th>
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
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={r.status !== "RUNNING" || isMeetingInactive}
                          onClick={() => window.dispatchEvent(new CustomEvent("OPEN_BROADCASTER", { detail: r }))}
                          className={`px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 ${(r.status !== "RUNNING" || isMeetingInactive) ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <span>📷</span> {$t("Camera Broadcast", (localStorage.getItem('app-lang') || 'en'))}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()
        ) : (
          <p className="p-6 text-sm text-white/40 text-center">{$t("No races scheduled for this meeting.", (localStorage.getItem('app-lang') || 'en'))}</p>
        )}
      </div>
    </div>
  );
}

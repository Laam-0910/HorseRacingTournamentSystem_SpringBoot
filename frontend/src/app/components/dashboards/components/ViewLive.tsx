import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";
import WebCamLiveViewer, { BroadcasterInfo } from "../../livestream/WebCamLiveViewer";
import VietQRPaywallModal from "../../livestream/VietQRPaywallModal";

interface Race {
  id: number;
  classLevel: string;
  status: string;
  distanceMeters: number;
  trackType: string;
  startTime: string;
  youtubeLiveUrl: string;
  streamMode?: string;
  meetingName: string;
  raceMeetingId?: number;
}

interface ViewLiveProps {
  preselectedRaceId?: number | null;
  onClearPreselect?: () => void;
}

export default function ViewLive({ preselectedRaceId, onClearPreselect }: ViewLiveProps) {
  const { user } = useAuth(); // Current user info

  // State management for live races and selection
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Paywall & Subscription state
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  
  // State management for Referee / Camera broadcasters and selected camera
  const [broadcasterList, setBroadcasterList] = useState<BroadcasterInfo[]>([]);
  const [selectedBroadcasterId, setSelectedBroadcasterId] = useState<string | null>(null);

  // State management for Chat
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Generate or retrieve persistent guest username
  const [username] = useState<string>(() => {
    if (user?.username) return user.username;
    const cached = sessionStorage.getItem("chat-guest-username");
    if (cached) return cached;
    const newGuest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("chat-guest-username", newGuest);
    return newGuest;
  });

  const fetchLiveRaces = async () => {
    try {
      const data = await api.get<Race[]>("/races/live");
      const activeRaces = Array.isArray(data) ? data : [];
      setLiveRaces(activeRaces);
      
      if (activeRaces.length > 0) {
        if (preselectedRaceId) {
          const found = activeRaces.find(r => r.id === preselectedRaceId);
          if (found) {
            setSelectedRace(found);
            if (onClearPreselect) onClearPreselect();
            return;
          }
        }
        setSelectedRace(prev => {
          if (prev && activeRaces.some(r => r.id === prev.id)) {
            return activeRaces.find(r => r.id === prev.id) || activeRaces[0];
          }
          return activeRaces[0];
        });
      } else {
        setSelectedRace(null);
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load live broadcasts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setChatMessages([
      { user: "User_881", text: "Horse #3 is accelerating insanely fast!", time: "14:15" },
      { user: "SpectatorX", text: "Jockey Ryan is riding very strategically.", time: "14:16" },
      { user: "RaceAnalyst", text: "Amazing! Final lap is here guys!", time: "14:17" }
    ]);
  }, []);

  useEffect(() => {
    fetchLiveRaces();
    const interval = setInterval(fetchLiveRaces, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Check subscription access for spectator role
  useEffect(() => {
    if (!user || user.roleId !== 4 || !selectedRace) {
      setHasAccess(true); // Admins, Referees, Owners, Jockeys have free access
      return;
    }
    api.get<any>(`/public/livestream/access?userId=${user.id}&meetingId=${selectedRace.raceMeetingId || ""}`)
      .then(res => {
        setHasAccess(res.hasAccess);
        if (!res.hasAccess) {
          setShowPaywallModal(true); // Auto popup VietQR payment modal on entry
        }
      })
      .catch(() => {
        setHasAccess(false);
        setShowPaywallModal(true);
      });
  }, [user, selectedRace?.id, selectedRace?.raceMeetingId]);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!selectedRace) {
      setSocket(null);
      setConnectionState("disconnected");
      return;
    }

    // Reset messages for the new race
    setChatMessages([
      { user: "System", text: `Welcome to the live chat for Race #${selectedRace.id}!`, time: "" }
    ]);
    setConnectionState("connecting");

    let ws: WebSocket | null = null;
    let reconnectTimeout: number;
    let isComponentMounted = true;

    const connect = () => {
      const hostname = window.location.hostname || "localhost";
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${hostname}:8080/ws/chat/${selectedRace.id}`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to dashboard race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connected");
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.user && data.text) {
            setChatMessages(prev => [
              ...prev,
              {
                user: data.user,
                text: data.text,
                time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed for dashboard race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connecting");
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket dashboard chat connection error", err);
        if (isComponentMounted) {
          setConnectionState("disconnected");
        }
        if (ws) ws.close();
      };

      setSocket(ws);
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [selectedRace?.id]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      user: username,
      text: newMsg.trim(),
      time
    };
    
    socket.send(JSON.stringify(payload));
    setNewMsg("");
  };

  const embedUrl = selectedRace ? getYouTubeEmbedUrl(selectedRace.youtubeLiveUrl) : null;

  return (
    <div className="space-y-6">
      {/* Stewards' Inquiry Flashing Banner */}
      {selectedRace && selectedRace.status === "STEWARDS_INQUIRY" && (
        <div 
          className="bg-rose-950/40 border border-rose-500/20 text-rose-500 font-bold uppercase tracking-wider text-xs px-4 py-3 rounded-xl flex items-center space-x-2.5 animate-pulse"
          style={{ animationDuration: "1.5s" }}
        >
          <span className="text-base">⚠️</span>
          <span>
            Stewards' Inquiry - Race under inquiry by referees for possible violation (Official results pending)
          </span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Live Stream Arena</span>
        </h3>
        {selectedRace && (
          <button
            onClick={() => setIsTheaterMode(prev => !prev)}
            className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/20 text-white text-xs font-mono px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5"
          >
            <span>🎭</span>
            <span>{isTheaterMode ? "Default Mode" : "Theater Mode"}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white/[0.01] border border-white/5 rounded-2xl">
          <p className="text-sm text-white/40 font-mono">Loading live screen...</p>
        </div>
      ) : selectedRace ? (
        <div className={`gap-6 ${isTheaterMode ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3"}`}>
          
          {/* Player & Stats */}
          <div className={`${isTheaterMode ? "w-full" : "lg:col-span-2"} space-y-4`}>
            {/* Multi-Camera Angle Selector Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              {broadcasterList.length > 0 ? (
                broadcasterList.map((b) => {
                  const isSelected = selectedRace?.streamMode !== "YOUTUBE" && (selectedBroadcasterId === b.id || (!selectedBroadcasterId && broadcasterList[broadcasterList.length - 1]?.id === b.id));
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBroadcasterId(b.id);
                        setSelectedRace(prev => prev ? { ...prev, streamMode: "WEBCAM" } : prev);
                      }}
                      style={{
                        padding: "0.4rem 0.85rem",
                        fontSize: "11px",
                        borderRadius: "0.5rem",
                        fontWeight: "bold",
                        background: isSelected ? "#ef4444" : "rgba(255,255,255,0.05)",
                        color: "#fff",
                        border: isSelected ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span>📱</span> Ref Cam {b.name}
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={() => setSelectedRace(prev => prev ? { ...prev, streamMode: "WEBCAM" } : prev)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    fontSize: "11px",
                    borderRadius: "0.5rem",
                    fontWeight: "bold",
                    background: selectedRace?.streamMode === "WEBCAM" ? "#ef4444" : "rgba(255,255,255,0.05)",
                    color: "#fff",
                    border: selectedRace?.streamMode === "WEBCAM" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>📱</span> Referee Camera Angle (Awaiting Connection)
                </button>
              )}

              {/* YouTube Button */}
              {selectedRace?.youtubeLiveUrl && (
                <button
                  onClick={() => setSelectedRace(prev => prev ? { ...prev, streamMode: "YOUTUBE" } : prev)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    fontSize: "11px",
                    borderRadius: "0.5rem",
                    fontWeight: "bold",
                    background: selectedRace?.streamMode === "YOUTUBE" ? "#ef4444" : "rgba(255,255,255,0.05)",
                    color: "#fff",
                    border: selectedRace?.streamMode === "YOUTUBE" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>📺</span> Main YouTube Channel
                </button>
              )}
            </div>

            {/* Embedded Stream */}
            <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
              {selectedRace.streamMode !== "YOUTUBE" ? (
                <WebCamLiveViewer
                  raceId={selectedRace.id}
                  selectedBroadcasterId={selectedBroadcasterId}
                  onBroadcastersFound={list => setBroadcasterList(list)}
                />
              ) : selectedRace.youtubeLiveUrl && (
                selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".mp4") ||
                selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".webm") ||
                selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".ogg") ||
                selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".m3u8") ||
                selectedRace.youtubeLiveUrl.toLowerCase().includes("/stream") ||
                selectedRace.youtubeLiveUrl.toLowerCase().includes(".mp4?")
              ) ? (
                <video
                  className="absolute top-0 left-0 w-full h-full border-none"
                  src={selectedRace.youtubeLiveUrl}
                  controls={hasAccess}
                  autoPlay
                  muted
                />
              ) : (
                <iframe
                  className="absolute top-0 left-0 w-full h-full border-none"
                  src={embedUrl && embedUrl.includes("?") ? embedUrl : `${embedUrl}?autoplay=1&mute=1&rel=0`}
                  title={selectedRace.classLevel}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              )}

              {/* Paywall Locked Overlay */}
              {!hasAccess && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(10,9,8,0.88)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "1.5rem", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                    🔒
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginBottom: "0.25rem" }}>
                    PPV Pass Required
                  </h3>
                  <p style={{ fontSize: "12px", color: "#a0a0a0", maxWidth: "24rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                    Subscribe to a RaceMeeting Pass (15,000 VND) or Season Pass (79,000 VND) via VietQR to unlock HD live stream broadcasting.
                  </p>
                  <button
                    onClick={() => setShowPaywallModal(true)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "linear-gradient(135deg, #c9a227 0%, #a37f1c 100%)",
                      color: "#000",
                      fontWeight: "bold",
                      borderRadius: "0.5rem",
                      fontSize: "13px",
                      cursor: "pointer",
                      border: "none",
                      boxShadow: "0 4px 15px rgba(201,162,39,0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <span>💳</span> Unlock Stream via VietQR
                  </button>
                </div>
              )}
            </div>

            {/* VietQR Paywall Modal */}
            {showPaywallModal && user && (
              <VietQRPaywallModal
                userId={user.id}
                seasonId={null}
                raceMeetingId={selectedRace.raceMeetingId}
                raceMeetingName={selectedRace.meetingName}
                onSuccess={() => {
                  setHasAccess(true);
                  setShowPaywallModal(false);
                }}
                onClose={() => setShowPaywallModal(false)}
              />
            )}

            {/* Info details */}
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h4 className="text-base font-bold text-white font-serif">
                  {selectedRace.classLevel} · Race #{selectedRace.id}
                </h4>
                <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-lg font-mono font-semibold">
                  {selectedRace.meetingName}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/5 text-xs font-mono text-white/60">
                <div>
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">Distance</span>
                  <span className="text-white font-semibold">{selectedRace.distanceMeters}m</span>
                </div>
                <div>
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">Track Type</span>
                  <span className="text-white font-semibold">{selectedRace.trackType}</span>
                </div>
                <div>
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">Start Time</span>
                  <span className="text-white font-semibold">{selectedRace.startTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Switcher Directory + Chat) */}
          <div className={isTheaterMode ? "grid grid-cols-1 md:grid-cols-2 gap-6 w-full" : "space-y-4 flex flex-col h-auto"}>
            
            {/* Active Streams Directory switcher */}
            {liveRaces.length > 0 && (
              <div className="bg-white/[0.015] border border-white/5 p-4 rounded-2xl space-y-3">
                <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  Live Streams ({liveRaces.length})
                </h5>
                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-hide">
                  {liveRaces.map((r) => {
                    const isCurrent = r.id === selectedRace?.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRace(r)}
                        className={`w-full p-2.5 border rounded-xl text-left transition flex items-center justify-between gap-2 text-xs ${
                          isCurrent 
                            ? "bg-amber-500/10 border-amber-500/30 text-white" 
                            : "bg-black/20 border-white/5 hover:border-white/10 text-white/70"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block truncate">{r.classLevel}</span>
                          <span className="text-[9px] text-white/40 block truncate mt-0.5 font-mono">{r.meetingName}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap ${
                          isCurrent 
                            ? "bg-amber-500/20 text-amber-400" 
                            : "bg-rose-500/10 text-rose-400 animate-pulse"
                        }`}>
                          {isCurrent ? "WATCHING" : "WATCH"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Box */}
            <div className="flex flex-col h-[280px] bg-white/[0.015] border border-white/5 rounded-2xl overflow-hidden flex-grow">
              <div className="px-4 py-3 bg-[#151310] border-b border-white/5 flex items-center justify-between">
                <h5 className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                  Live Chat
                </h5>
                {connectionState === "connected" ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-mono uppercase flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                ) : connectionState === "connecting" ? (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-mono uppercase flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-500 animate-bounce"></span>
                    Connecting
                  </span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[9px] font-mono uppercase flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                    Offline
                  </span>
                )}
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-hide text-xs">
                {chatMessages.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${m.user === "You" ? "text-amber-500" : "text-white/80"}`}>
                        {m.user}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono">{m.time}</span>
                    </div>
                    <p className="text-white/60 bg-black/20 p-2 rounded-lg border border-white/5 leading-snug">
                      {m.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Reactions Bar */}
              <div style={{ display: "flex", gap: "0.25rem", padding: "0.35rem 0.5rem", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {["🔥", "🏇", "👏", "🏆", "❤️", "😮"].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      if (!socket || socket.readyState !== WebSocket.OPEN) return;
                      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      socket.send(JSON.stringify({ user: username, text: emoji, time }));
                    }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "0.25rem", padding: "2px 6px", cursor: "pointer", fontSize: "0.85rem" }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="p-2 border-t border-white/5 bg-[#151310] flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Chat here..."
                  className="flex-1 bg-black/40 border border-white/5 focus:border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-white/20"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 rounded-lg transition"
                >
                  Send
                </button>
              </form>
            </div>

          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-3">
          <div className="text-3xl">📺</div>
          <h4 className="text-sm font-bold text-white font-serif">No Active Live Streams</h4>
          <p className="text-xs text-white/40 max-w-sm">
            Admin has not started a livestream yet or no race is currently running. Please check back later!
          </p>
        </div>
      )}
    </div>
  );
}

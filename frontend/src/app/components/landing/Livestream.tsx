import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, getWebSocketUrl } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { $t } from '@/lib/i18n';
import WebCamLiveViewer, { BroadcasterInfo } from "../livestream/WebCamLiveViewer";
import HorseRacingSimulator from "./HorseRacingSimulator";

interface Race {
  id: number;
  classLevel: string;
  status: string;
  distanceMeters: number;
  trackType: string;       // Track Type (Turf/Dirt...)
  startTime: string;
  youtubeLiveUrl: string;
  streamMode?: string;
  meetingName: string;
}

const TRANSLATIONS: Record<string, any> = {
  en: {
    home: "Home",
    title: "Livestream Arena",
    liveNow: "LIVE NOW",
    noLive: "No Active Live Streams",
    noLiveSub: "There are no races running right now or the admin has not set the stream link. Please check back later!",
    trackDistance: "Distance",
    trackType: "Track Type",
    startTime: "Start Time",
    backToHome: "Back to Home",
    otherLive: "Other Live Streams",
    watching: "WATCHING",
    watch: "WATCH",
    chatHeader: "Live Chat",
    chatInputPlaceholder: "Type a message...",
    chatSend: "SEND",
    online: "Online",
    activeStreams: "Live Stream Directory",
    activeStreamsDesc: "Select a race to switch streams",
    loadingStream: "Loading live broadcast details...",
    secondsAgo: "s ago",
    chatMock1: "Stunning start! Horse #3 is pulling ahead!",
    chatMock2: "The turf condition is perfect for runners today.",
    chatMock3: "Who do you think will win this round?",
    chatMock4: "Thunder King is looking exceptionally strong.",
    theaterMode: "Theater Mode",
    defaultMode: "Default Mode",
  }
};

/**
 */
export default function Livestream() {
  const { raceId } = useParams<{ raceId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const t = TRANSLATIONS.en;
  
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [raceEntries, setRaceEntries] = useState<any[]>([]);

  const [broadcasterList, setBroadcasterList] = useState<BroadcasterInfo[]>([]);
  const [selectedBroadcasterId, setSelectedBroadcasterId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRace?.id) {
      setRaceEntries([]);
      return;
    }
    api.get<any[]>(`/public/results?raceId=${selectedRace.id}`)
      .then(data => {
        if (Array.isArray(data)) setRaceEntries(data);
      })
      .catch(() => setRaceEntries([]));
  }, [selectedRace?.id]);
  
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const [username] = useState<string>(() => {
    if (user?.username) return user.username;
    const cached = sessionStorage.getItem("chat-guest-username");
    if (cached) return cached;
    const newGuest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("chat-guest-username", newGuest);
    return newGuest;
  });

  useEffect(() => {
    setChatMessages([
      { user: "RaceFan_99", text: $t("Impressive start! Horse #3 is sprinting ahead!", (localStorage.getItem('app-lang') || 'en')), time: `1 ${$t("seconds ago", (localStorage.getItem('app-lang') || 'en'))}` },
      { user: "GoldenJockey", text: $t("The Turf track today looks great."), time: `45 ${$t("seconds ago", (localStorage.getItem('app-lang') || 'en'))}` },
      { user: "TurfKing", text: $t("Who do you think will finish first this round?", (localStorage.getItem('app-lang') || 'en')), time: `2 ${$t("seconds ago", (localStorage.getItem('app-lang') || 'en'))}` },
      { user: "BetMaster", text: $t("Thunder King is running strong today."), time: `10 ${$t("seconds ago", (localStorage.getItem('app-lang') || 'en'))}` },
    ]);
  }, []);

  useEffect(() => {
    const fetchLiveRaces = async () => {
      try {
        const data = await api.get<Race[]>("/races/live");
        const activeRaces = (Array.isArray(data) ? data : []).filter(r => r.status !== "CANCELLED");
        setLiveRaces(activeRaces);
        
        if (activeRaces.length > 0) {
          if (raceId) {
            const found = activeRaces.find(r => r.id === parseInt(raceId));
            setSelectedRace(found || activeRaces[0]);
          } else {
            setSelectedRace(activeRaces[0]);
          }
        } else {
          setSelectedRace(null);
        }
      } catch (err) {
        console.error("Failed to fetch live streams", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRaces();
    const interval = setInterval(fetchLiveRaces, 15000);
    return () => clearInterval(interval);
  }, [raceId]);

  useEffect(() => {
    if (!selectedRace) {
      setSocket(null);
      setConnectionState("disconnected");
      return;
    }

    let isComponentMounted = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: number;

    setConnectionState("connecting");

    // Reset messages for the new race and fetch chat history from REST API
    setChatMessages([
      { user: "System", text: `Welcome to the live chat for Race #${selectedRace.id}!`, time: "" }
    ]);

    api.get<any[]>(`/public/chat/${selectedRace.id}`)
      .then(history => {
        if (history && history.length > 0 && isComponentMounted) {
          setChatMessages([
            { user: "System", text: `Welcome to the live chat for Race #${selectedRace.id}!`, time: "" },
            ...history
          ]);
        }
      })
      .catch(() => {});

    const connect = () => {
      const wsUrl = getWebSocketUrl(`/ws/chat/${selectedRace.id}`);
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connected");
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.user && data.text) {
            setChatMessages(prev => {
              const exists = prev.some(m => m.user === data.user && m.text === data.text);
              if (exists) return prev;
              return [
                ...prev,
                {
                  user: data.user,
                  text: data.text,
                  time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ];
            });
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed for race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connecting");
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket chat connection error", err);
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
    const msgText = newMsg.trim();
    if (!msgText || !selectedRace?.id) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      user: username,
      text: msgText,
      time
    };
    
    setChatMessages(prev => [...prev, payload]);
    setNewMsg("");

    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(payload));
      } catch (err) {}
    }

    api.post("/public/chat/send", {
      raceId: selectedRace.id,
      user: username,
      text: msgText
    }).catch(() => {});
  };

  const embedUrl = selectedRace ? getYouTubeEmbedUrl(selectedRace.youtubeLiveUrl) : null;
  const videoId = embedUrl ? embedUrl.split("/").pop()?.split("?")[0] : "";
  const iframeSrc = embedUrl ? (embedUrl.includes("youtube.com") ? `${embedUrl}?autoplay=1&mute=0&rel=0&modestbranding=1&playlist=${videoId}&loop=1` : embedUrl) : "";

  return (
    <div className="min-h-screen bg-[#0e0c09] text-[#f0f0f0] font-sans">
      <header className="border-b border-[#2a2825] bg-[#100f0c] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate("/")} 
            className="text-amber-500 hover:text-amber-400 font-mono text-sm flex items-center space-x-1 transition"
          >
            <span>←</span> <span>{$t("Home", (localStorage.getItem('app-lang') || 'en'))}</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2825]"></div>
          <h1 className="text-lg font-bold text-white tracking-wide font-serif">
            🔴 {$t("Livestream Arena", (localStorage.getItem('app-lang') || 'en'))}
          </h1>
        </div>
        
        {selectedRace && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTheaterMode(prev => !prev)}
              className="bg-[#151310] hover:bg-[#1a1815] border border-[#2a2825] hover:border-amber-500/30 text-white text-xs font-mono px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <span>🎭</span>
              <span>{isTheaterMode ? $t("Default", (localStorage.getItem('app-lang') || 'en')) : $t("Theater", (localStorage.getItem('app-lang') || 'en'))}</span>
            </button>
            <div className="uiverse-live-badge">
              <span className="dot"></span>
              <span>{$t("LIVE", (localStorage.getItem('app-lang') || 'en'))}</span>
            </div>
          </div>
        )}
      </header>

      {selectedRace && selectedRace.status === "STEWARDS_INQUIRY" && (
        <div 
          className="bg-rose-950/40 border-b border-rose-500/30 px-6 py-3 flex items-center justify-center space-x-3 text-rose-500 font-bold uppercase tracking-wider text-sm text-center animate-pulse"
          style={{ animationDuration: "1.5s" }}
        >
          <span className="text-xl">⚠️</span>
          <span>
            {$t("Stewards' Inquiry - Race under inquiry by Referees (Results Unofficial)", (localStorage.getItem('app-lang') || 'en'))}
          </span>
        </div>
      )}

      <main className={`max-w-7xl mx-auto p-4 md:p-6 gap-6 ${isTheaterMode ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3"}`}>
        
        <div className={`${isTheaterMode ? "w-full" : "lg:col-span-2"} space-y-6`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-white/60 font-mono text-sm">{$t("Loading livestream data...", (localStorage.getItem('app-lang') || 'en'))}</p>
            </div>
          ) : selectedRace ? (
            <div className="space-y-4">
              {/* Live Class / Race Switcher Bar (For Spectator, Horse Owner, Jockey) */}
              {liveRaces.filter(r => r.status !== "CANCELLED").length > 0 && (
                <div className="bg-[#151310] border border-amber-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                      Live Stream Switcher ({liveRaces.filter(r => r.status !== "CANCELLED").length} Active Classes):
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {liveRaces
                      .filter((r) => r.status !== "CANCELLED")
                      .map((r) => {
                        const isSelected = selectedRace?.id === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRace(r)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/20 border border-rose-400 ring-2 ring-rose-500/30"
                                : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                            }`}
                          >
                            <span>🏁</span>
                            <span>{r.classLevel}</span>
                            {r.meetingName && (
                              <span className="text-[10px] opacity-75 font-normal">({r.meetingName})</span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 2D JavaScript Simulation Model Demo */}
              <HorseRacingSimulator selectedRace={selectedRace} entries={raceEntries} />

              {/* Callout Box to Enter Dashboard to Watch Real Live Broadcast */}
              <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 font-serif uppercase tracking-wide">
                      Real-Time Camera Stream & Interactive Live Chat
                    </h4>
                    <p className="text-xs text-white/70 font-mono mt-0.5">
                      You are watching the AI Statistical Performance Simulation preview on the landing page. To access the actual real-time referee camera broadcasts, YouTube streams, and live chat, please enter your Dashboard!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => {
                      if (user) {
                        const role = user.roleId === 1 ? "admin" : user.roleId === 2 ? "owner" : user.roleId === 3 ? "jockey" : user.roleId === 5 ? "referee" : "spectator";
                        navigate(`/dashboard/${role}`);
                      } else {
                        navigate("/login");
                      }
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-mono font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <span>🔑</span>
                    <span>{user ? "Go to Dashboard to Watch Real Live Stream" : "Sign In to Watch Real Live Stream"}</span>
                  </button>

                  {!user && (
                    <button
                      onClick={() => navigate("/register")}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs rounded-xl border border-white/15 transition cursor-pointer"
                    >
                      Register New Account
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#151310] border border-[#2a2825] p-5 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-white font-serif">
                    {selectedRace.classLevel} - Race #{selectedRace.id}
                  </h2>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    {selectedRace.meetingName}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#2a2825] text-xs md:text-sm font-mono text-white/60">
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Race Distance", (localStorage.getItem('app-lang') || 'en'))}</span>
                    <span className="text-white font-semibold">{selectedRace.distanceMeters} Meters</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Track Type", (localStorage.getItem('app-lang') || 'en'))}</span>
                    <span className="text-white font-semibold">{selectedRace.trackType}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Start Time", (localStorage.getItem('app-lang') || 'en'))}</span>
                    <span className="text-white font-semibold">{selectedRace.startTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl p-6 text-center space-y-4">
              <div className="text-4xl">📺</div>
              <h3 className="text-lg font-bold text-white font-serif">{$t("No Live Stream Available", (localStorage.getItem('app-lang') || 'en'))}</h3>
              <p className="text-white/60 text-sm max-w-md font-sans leading-relaxed">
                {$t("Currently no live race is running or admin has not set up live stream link. Please check back later!", (localStorage.getItem('app-lang') || 'en'))}
              </p>
              <button 
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs rounded-xl transition font-mono uppercase tracking-wider"
              >
                {$t("Back to Home", (localStorage.getItem('app-lang') || 'en'))}
              </button>
            </div>
          )}
        </div>

        <div className={isTheaterMode ? "grid grid-cols-1 md:grid-cols-2 gap-6 w-full" : "space-y-6 flex flex-col h-auto"}>
          
          {liveRaces.length > 0 && (
            <div className="bg-[#151310] border border-[#2a2825] rounded-2xl p-4 flex flex-col space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                  {$t("Livestream List", (localStorage.getItem('app-lang') || 'en'))}
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{$t("Select a race to switch stream", (localStorage.getItem('app-lang') || 'en'))}</p>
              </div>
              
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-hide">
                {liveRaces.map((r) => {
                  const isCurrent = r.id === selectedRace?.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/livestream/${r.id}`)}
                      className={`w-full p-3 border rounded-xl text-left transition flex items-center justify-between gap-2 ${
                        isCurrent 
                          ? "bg-amber-500/10 border-amber-500/40 text-white" 
                          : "bg-black/35 border-[#2a2825] hover:border-white/10 text-white/80"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs truncate block">{r.classLevel}</span>
                          <span className="text-[9px] font-mono text-white/40 whitespace-nowrap">#{r.id}</span>
                        </div>
                        <span className="text-[10px] text-white/40 block truncate mt-0.5 font-mono">{r.meetingName}</span>
                      </div>
                      
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase whitespace-nowrap ${
                        isCurrent 
                          ? "bg-amber-500/20 text-amber-400" 
                          : "bg-rose-500/15 text-rose-400 animate-pulse"
                      }`}>
                        {isCurrent ? $t("WATCHING NOW", (localStorage.getItem('app-lang') || 'en')) : $t("XEM NGAY", (localStorage.getItem('app-lang') || 'en'))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col h-[350px] lg:h-[350px] bg-[#151310] border border-[#2a2825] rounded-2xl overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1a1815] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                {$t("Live Chat", (localStorage.getItem('app-lang') || 'en'))}
              </h3>
              {connectionState === "connected" ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {$t("Online", (localStorage.getItem('app-lang') || 'en'))}
                </span>
              ) : connectionState === "connecting" ? (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                  Connecting
                </span>
              ) : (
                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Offline
                </span>
              )}
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3.5 scrollbar-hide">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${msg.user === "You" ? "text-amber-500" : "text-white/80"}`}>
                      {msg.user}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">{msg.time}</span>
                  </div>
                  <p className="text-white/70 bg-black/25 p-2 rounded-xl border border-white/5 font-sans leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-2 border-t border-[#2a2825] bg-[#1a1815] flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder={$t("Type a message...", (localStorage.getItem('app-lang') || 'en'))}
                className="flex-1 bg-[#0e0c09] border border-[#2a2825] focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-white/30"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs px-3 rounded-lg transition font-mono"
              >
                {$t("SEND", (localStorage.getItem('app-lang') || 'en'))}
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}

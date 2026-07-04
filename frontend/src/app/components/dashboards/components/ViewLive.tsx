import { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../../lib/utils";
import { useAuth } from "../../../../context/AuthContext";

interface Race {
  id: number;
  classLevel: string;
  status: string;
  distanceMeters: number;
  trackType: string;
  startTime: string;
  youtubeLiveUrl: string;
  meetingName: string;
}

const TRANSLATIONS: Record<string, any> = {
  vi: {
    title: "Phòng xem trực tiếp",
    selectRace: "Chọn trận đấu:",
    loading: "Đang tải dữ liệu...",
    noLive: "Hiện tại không có trận đấu nào livestream",
    noLiveSub: "Admin chưa khởi chạy livestream hoặc không có trận đấu nào đang diễn ra. Vui lòng quay lại sau!",
    distance: "Cự ly",
    trackType: "Đường đua",
    startTime: "Khởi tranh",
    activeStreams: "Luồng Phát Trực Tiếp",
    watching: "ĐANG XEM",
    watch: "XEM",
    chatHeader: "Trò chuyện",
    chatPlaceholder: "Chat ở đây...",
    send: "Gửi",
    online: "Online",
    chatMock1: "Ngựa số 3 tăng tốc kinh quá!",
    chatMock2: "Jockey nài ngựa Ryan chạy rất thông minh.",
    chatMock3: "Quá hay! Vòng cuối rồi anh em ơi!",
    theaterMode: "Rạp phim",
    defaultMode: "Mặc định",
  },
  en: {
    title: "Live Arena Watch",
    selectRace: "Select Race:",
    loading: "Loading live screen...",
    noLive: "No Active Live Streams",
    noLiveSub: "No live broadcast currently running or stream link is empty. Please check back later!",
    distance: "Distance",
    trackType: "Track Type",
    startTime: "Start Time",
    activeStreams: "Live Streams",
    watching: "WATCHING",
    watch: "WATCH",
    chatHeader: "Live Chat",
    chatPlaceholder: "Chat here...",
    send: "Send",
    online: "Online",
    chatMock1: "Horse #3 is accelerating insanely fast!",
    chatMock2: "Jockey Ryan is riding very strategically.",
    chatMock3: "Amazing! Final lap is here guys!",
    theaterMode: "Theater Mode",
    defaultMode: "Default Mode",
  },
  zh: {
    title: "直播监控室",
    selectRace: "选择比赛:",
    loading: "正在加载直播画面...",
    noLive: "暂无直播",
    noLiveSub: "目前没有比赛在直播，请稍后再试！",
    distance: "赛程距离",
    trackType: "赛道类型",
    startTime: "开赛时间",
    activeStreams: "直播列表",
    watching: "观看中",
    watch: "观看",
    chatHeader: "实时聊天",
    chatPlaceholder: "在此聊聊...",
    send: "发送",
    online: "在线",
    chatMock1: "3号马加速得太猛了！",
    chatMock2: "骑师 Ryan 骑得很聪明。",
    chatMock3: "精彩！各位，最后一圈了！",
    theaterMode: "剧场模式",
    defaultMode: "普通模式",
  },
  ja: {
    title: "ライブアリーナ観戦",
    selectRace: "レース選択:",
    loading: "ライブ画面を読み込み中...",
    noLive: "現在ライブ配信はありません",
    noLiveSub: "ライブ配信が開始されていないか、レースがありません。後で再試行してください！",
    distance: "距離",
    trackType: "馬場状態",
    startTime: "発走時刻",
    activeStreams: "ライブ配信中",
    watching: "視聴中",
    watch: "観戦",
    chatHeader: "チャット",
    chatPlaceholder: "チャットを入力...",
    send: "送信",
    online: "オンライン",
    chatMock1: "3番の馬の加速がヤバい！",
    chatMock2: "ジョッキー of Ryanが素晴らしい騎乗をしています。", // Wait, let's keep it as is, or fix "ジョッキーのRyan"
    chatMock3: "すごい！ラスト一周です！",
    theaterMode: "シアターモード",
    defaultMode: "デフォルト",
  }
};

interface ViewLiveProps {
  preselectedRaceId?: number | null;
  onClearPreselect?: () => void;
}

export default function ViewLive({ preselectedRaceId, onClearPreselect }: ViewLiveProps) {
  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const { user } = useAuth();

  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
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
      setError(err.message || "Failed to load live broadcasts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setChatMessages([
      { user: "User_881", text: t.chatMock1, time: "14:15" },
      { user: "SpectatorX", text: t.chatMock2, time: "14:16" },
      { user: "RaceAnalyst", text: t.chatMock3, time: "14:17" }
    ]);
  }, [lang]);

  useEffect(() => {
    fetchLiveRaces();
    const interval = setInterval(fetchLiveRaces, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

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
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const hostPart = apiBase.replace(/^https?:\/\//, "").split("/")[0];
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${hostPart}/ws/chat/${selectedRace.id}`;
      
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
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span>{t.title}</span>
        </h3>
        {selectedRace && (
          <button
            onClick={() => setIsTheaterMode(prev => !prev)}
            className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/20 text-white text-xs font-mono px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5"
          >
            <span>🎭</span>
            <span>{isTheaterMode ? t.defaultMode : t.theaterMode}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 bg-white/[0.01] border border-white/5 rounded-2xl">
          <p className="text-sm text-white/40 font-mono">{t.loading}</p>
        </div>
      ) : selectedRace && embedUrl ? (
        <div className={`gap-6 ${isTheaterMode ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3"}`}>
          
          {/* Player & Stats */}
          <div className={`${isTheaterMode ? "w-full" : "lg:col-span-2"} space-y-4`}>
            {/* Embedded Stream */}
            <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
              {selectedRace.youtubeLiveUrl && (
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
                  controls
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
            </div>

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
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">{t.distance}</span>
                  <span className="text-white font-semibold">{selectedRace.distanceMeters}m</span>
                </div>
                <div>
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">{t.trackType}</span>
                  <span className="text-white font-semibold">{selectedRace.trackType}</span>
                </div>
                <div>
                  <span className="block text-white/40 text-[10px] uppercase mb-0.5">{t.startTime}</span>
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
                  {t.activeStreams} ({liveRaces.length})
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
                          {isCurrent ? t.watching : t.watch}
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
                  {t.chatHeader}
                </h5>
                {connectionState === "connected" ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-mono uppercase flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t.online}
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

              <form onSubmit={handleSendChat} className="p-2 border-t border-white/5 bg-[#151310] flex gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder={t.chatPlaceholder}
                  className="flex-1 bg-black/40 border border-white/5 focus:border-amber-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-white/20"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 rounded-lg transition"
                >
                  {t.send}
                </button>
              </form>
            </div>

          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-3">
          <div className="text-3xl">📺</div>
          <h4 className="text-sm font-bold text-white font-serif">{t.noLive}</h4>
          <p className="text-xs text-white/40 max-w-sm">
            {t.noLiveSub}
          </p>
        </div>
      )}
    </div>
  );
}

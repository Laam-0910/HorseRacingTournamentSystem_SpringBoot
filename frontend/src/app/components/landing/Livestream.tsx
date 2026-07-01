import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";

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
    home: "Trang chủ",
    title: "Đấu Trường Livestream",
    liveNow: "ĐANG PHÁT",
    noLive: "Không có livestream trực tiếp nào",
    noLiveSub: "Hiện tại không có trận đấu nào đang chạy hoặc Admin chưa thiết lập đường link phát trực tiếp. Vui lòng quay lại sau!",
    trackDistance: "Cự ly đua",
    trackType: "Loại đường đua",
    startTime: "Thời gian bắt đầu",
    backToHome: "Về Trang chủ",
    otherLive: "Các luồng trực tiếp khác",
    watching: "ĐANG XEM",
    watch: "XEM NGAY",
    chatHeader: "Trò chuyện trực tiếp",
    chatInputPlaceholder: "Nhập tin nhắn...",
    chatSend: "GỬI",
    online: "Trực tuyến",
    activeStreams: "Danh Sách Livestream",
    activeStreamsDesc: "Chọn trận đấu để chuyển đổi luồng phát",
    loadingStream: "Đang tải dữ liệu livestream...",
    secondsAgo: "giây trước",
    chatMock1: "Khởi đầu ấn tượng quá! Ngựa số 3 đang bứt tốc!",
    chatMock2: "Đường đua Turf hôm nay rất đẹp, chim ưng quá.",
    chatMock3: "Theo các bác ai sẽ về nhất vòng này?",
    chatMock4: "Thunder King chạy khỏe quá, tạ gánh vừa khít.",
    theaterMode: "Rạp phim",
    defaultMode: "Mặc định",
  },
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
  },
  zh: {
    home: "首页",
    title: "直播赛场",
    liveNow: "正在直播",
    noLive: "暂无直播",
    noLiveSub: "目前没有正在进行的比赛，或者管理员尚未设置直播链接。请稍后再试！",
    trackDistance: "赛程距离",
    trackType: "赛道类型",
    startTime: "开始时间",
    backToHome: "返回首页",
    otherLive: "其他直播",
    watching: "正在观看",
    watch: "立即观看",
    chatHeader: "现场聊天",
    chatInputPlaceholder: "输入消息...",
    chatSend: "发送",
    online: "在线",
    activeStreams: "直播列表",
    activeStreamsDesc: "选择比赛切换直播流",
    loadingStream: "正在加载直播信息...",
    secondsAgo: "秒前",
    chatMock1: "起点太棒了！3号马正在加速！",
    chatMock2: "今天的草地跑道状态真好。",
    chatMock3: "大家觉得这局谁会拿第一？",
    chatMock4: "Thunder King 看起来确实实力雄厚。",
    theaterMode: "剧场模式",
    defaultMode: "普通模式",
  },
  ja: {
    home: "ホーム",
    title: "ライブアリーナ",
    liveNow: "ライブ中",
    noLive: "現在ライブはありません",
    noLiveSub: "現在実行中のレースがないか、管理者がストリームリンクを設定していません。後ほどご確認ください！",
    trackDistance: "レース距離",
    trackType: "コースタイプ",
    startTime: "開始時間",
    backToHome: "ホームに戻る",
    otherLive: "他のライブストリーム",
    watching: "視聴中",
    watch: "見る",
    chatHeader: "ライブチャット",
    chatInputPlaceholder: "メッセージを入力...",
    chatSend: "送信",
    online: "オンライン",
    activeStreams: "ライブ一覧",
    activeStreamsDesc: "レースを選択して配信を切り替え",
    loadingStream: "ライブ詳細を読み込み中...",
    secondsAgo: "秒前",
    chatMock1: "素晴らしいスタート！3番の馬が抜け出しました！",
    chatMock2: "今日の芝生コースは最高ですね。",
    chatMock3: "このラウンドは誰が勝つと思いますか？",
    chatMock4: "Thunder King はやはり圧倒的な強さです。",
    theaterMode: "シアターモード",
    defaultMode: "デフォルト",
  }
};

export default function Livestream() {
  const { raceId } = useParams<{ raceId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Read current language setting
  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
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

  // Set initial localized mock chat messages
  useEffect(() => {
    setChatMessages([
      { user: "RaceFan_99", text: t.chatMock1, time: `1 ${t.secondsAgo}` },
      { user: "GoldenJockey", text: t.chatMock2, time: `45 ${t.secondsAgo}` },
      { user: "TurfKing", text: t.chatMock3, time: `2 ${t.secondsAgo}` },
      { user: "BetMaster", text: t.chatMock4, time: `10 ${t.secondsAgo}` },
    ]);
  }, [lang]);

  // Handle active races list loading
  useEffect(() => {
    const fetchLiveRaces = async () => {
      try {
        const data = await api.get<Race[]>("/races/live");
        const activeRaces = Array.isArray(data) ? data : [];
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

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!selectedRace) {
      setSocket(null);
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: number;
    let isComponentMounted = true;

    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//localhost:8080/ws/chat/${selectedRace.id}`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to race chat: " + selectedRace.id);
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
        console.log("WebSocket connection closed for race chat: " + selectedRace.id);
        if (isComponentMounted) {
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket chat connection error", err);
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
    <div className="min-h-screen bg-[#0e0c09] text-[#f0f0f0] font-sans">
      {/* Header */}
      <header className="border-b border-[#2a2825] bg-[#100f0c] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate("/")} 
            className="text-amber-500 hover:text-amber-400 font-mono text-sm flex items-center space-x-1 transition"
          >
            <span>←</span> <span>{t.home}</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2825]"></div>
          <h1 className="text-lg font-bold text-white tracking-wide font-serif">
            🔴 {t.title}
          </h1>
        </div>
        
        {selectedRace && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTheaterMode(prev => !prev)}
              className="bg-[#151310] hover:bg-[#1a1815] border border-[#2a2825] hover:border-amber-500/30 text-white text-xs font-mono px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <span>🎭</span>
              <span>{isTheaterMode ? t.defaultMode : t.theaterMode}</span>
            </button>
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3 py-1 rounded-full text-xs font-semibold uppercase animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>{t.liveNow}</span>
            </div>
          </div>
        )}
      </header>

      {/* Content Container */}
      <main className={`max-w-7xl mx-auto p-4 md:p-6 gap-6 ${isTheaterMode ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3"}`}>
        
        {/* Main Stream Area */}
        <div className={`${isTheaterMode ? "w-full" : "lg:col-span-2"} space-y-6`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-white/60 font-mono text-sm">{t.loadingStream}</p>
            </div>
          ) : selectedRace && embedUrl ? (
            <div className="space-y-4">
              {/* Embed Player */}
              <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
                <iframe
                  className="absolute top-0 left-0 w-full h-full border-none"
                  src={`${embedUrl}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                  title={selectedRace.classLevel}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Race Info */}
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
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{t.trackDistance}</span>
                    <span className="text-white font-semibold">{selectedRace.distanceMeters} Meters</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{t.trackType}</span>
                    <span className="text-white font-semibold">{selectedRace.trackType}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{t.startTime}</span>
                    <span className="text-white font-semibold">{selectedRace.startTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl p-6 text-center space-y-4">
              <div className="text-4xl">📺</div>
              <h3 className="text-lg font-bold text-white font-serif">{t.noLive}</h3>
              <p className="text-white/60 text-sm max-w-md font-sans leading-relaxed">
                {t.noLiveSub}
              </p>
              <button 
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs rounded-xl transition font-mono uppercase tracking-wider"
              >
                {t.backToHome}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Container */}
        <div className={isTheaterMode ? "grid grid-cols-1 md:grid-cols-2 gap-6 w-full" : "space-y-6 flex flex-col h-auto"}>
          
          {/* Active Races Directory / Switcher */}
          {liveRaces.length > 0 && (
            <div className="bg-[#151310] border border-[#2a2825] rounded-2xl p-4 flex flex-col space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                  {t.activeStreams}
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{t.activeStreamsDesc}</p>
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
                        {isCurrent ? t.watching : t.watch}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Chat */}
          <div className="flex flex-col h-[350px] lg:h-[350px] bg-[#151310] border border-[#2a2825] rounded-2xl overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1a1815] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                {t.chatHeader}
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                {t.online}
              </span>
            </div>

            {/* Chat Messages */}
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

            {/* Chat Form */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-[#2a2825] bg-[#1a1815] flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder={t.chatInputPlaceholder}
                className="flex-1 bg-[#0e0c09] border border-[#2a2825] focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-white/30"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs px-3 rounded-lg transition font-mono"
              >
                {t.chatSend}
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}

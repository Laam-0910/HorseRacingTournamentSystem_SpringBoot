import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import { $t } from '@/lib/i18n';
import WebCamLiveViewer from "../livestream/WebCamLiveViewer";

// Khai báo kiểu dữ liệu cấu trúc cho một Trận Đấu (Race) trong livestream
interface Race {
  id: number;              // ID duy nhất của cuộc đua
  classLevel: string;      // Phân hạng/Cấp độ cuộc đua (ví dụ: Class A, Class B)
  status: string;          // Trạng thái hiện tại (ví dụ: RUNNING, STEWARDS_INQUIRY, OFFICIAL)
  distanceMeters: number;  // Cự ly đường đua (mét)
  trackType: string;       // Loại đường đua (Turf/Dirt...)
  startTime: string;       // Giờ bắt đầu định dạng chuỗi
  youtubeLiveUrl: string;  // Đường dẫn phát trực tiếp (YouTube hoặc tệp tin video .mp4)
  streamMode?: string;     // YOUTUBE hoặc WEBCAM
  meetingName: string;     // Tên ngày hội đua chứa cuộc đua này
}

// Từ điển dịch thuật tiếng Anh hỗ trợ giao diện livestream
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
 * Component Livestream - Trang phát sóng trực tiếp các cuộc đua đang diễn ra.
 * Tích hợp trình phát video, danh sách kênh đua và khung trò chuyện trực tiếp qua WebSocket.
 */
export default function Livestream() {
  // Lấy ID cuộc đua từ đường dẫn URL nếu có (ví dụ: /livestream/12)
  const { raceId } = useParams<{ raceId?: string }>();
  const navigate = useNavigate();
  // Lấy thông tin user hiện tại đang đăng nhập
  const { user } = useAuth();

  const t = TRANSLATIONS.en;
  
  // State lưu danh sách các cuộc đua có luồng trực tiếp đang diễn ra
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  // State lưu cuộc đua hiện tại đang được người dùng chọn xem
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  // State lưu trạng thái đang tải dữ liệu ban đầu
  const [loading, setLoading] = useState(true);
  
  // State lưu danh sách các tin nhắn trong box chat trực tiếp
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  // State lưu trữ nội dung tin nhắn chat mới đang viết trong ô nhập
  const [newMsg, setNewMsg] = useState("");
  // Ref lưu đối tượng WebSocket kết nối tới chat server
  const [socket, setSocket] = useState<WebSocket | null>(null);
  // State lưu trạng thái kết nối WebSocket ('connecting' | 'connected' | 'disconnected')
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  // State lưu trạng thái giao diện có phóng to dạng rạp phim (theater mode) không
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Tạo hoặc lấy lại tên Guest ngẫu nhiên nếu người dùng chưa đăng nhập tài khoản
  const [username] = useState<string>(() => {
    if (user?.username) return user.username; // Nếu đã đăng nhập, lấy username thật
    const cached = sessionStorage.getItem("chat-guest-username");
    if (cached) return cached;
    const newGuest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    sessionStorage.setItem("chat-guest-username", newGuest);
    return newGuest;
  });

  // Effect thiết lập các tin nhắn mồi (mock) ban đầu theo ngôn ngữ đã chọn
  useEffect(() => {
    setChatMessages([
      { user: "RaceFan_99", text: $t("Khởi đầu ấn tượng quá! Ngựa số 3 đang bứt tốc!", (localStorage.getItem('app-lang') || 'vi')), time: `1 ${$t("giây trước", (localStorage.getItem('app-lang') || 'vi'))}` },
      { user: "GoldenJockey", text: $t("Đường đua Turf hôm nay rất đẹp, chim ưng quá."), time: `45 ${$t("giây trước", (localStorage.getItem('app-lang') || 'vi'))}` },
      { user: "TurfKing", text: $t("Theo các bác ai sẽ về nhất vòng này?", (localStorage.getItem('app-lang') || 'vi')), time: `2 ${$t("giây trước", (localStorage.getItem('app-lang') || 'vi'))}` },
      { user: "BetMaster", text: $t("Thunder King chạy khỏe quá, tạ gánh vừa khít."), time: `10 ${$t("giây trước", (localStorage.getItem('app-lang') || 'vi'))}` },
    ]);
  }, []);

  // Effect tải danh sách các trận đấu đang phát trực tiếp và tự động chạy lại sau mỗi 15 giây
  useEffect(() => {
    const fetchLiveRaces = async () => {
      try {
        const data = await api.get<Race[]>("/races/live");
        const activeRaces = Array.isArray(data) ? data : [];
        setLiveRaces(activeRaces);
        
        if (activeRaces.length > 0) {
          if (raceId) {
            // Nếu URL có tham số raceId, tìm cuộc đua khớp
            const found = activeRaces.find(r => r.id === parseInt(raceId));
            setSelectedRace(found || activeRaces[0]);
          } else {
            // Ngược lại, mặc định chọn cuộc đua đầu tiên trong danh sách hoạt động
            setSelectedRace(activeRaces[0]);
          }
        } else {
          setSelectedRace(null);
        }
      } catch (err) {
        console.error("Failed to fetch live streams", err);
      } finally {
        setLoading(false); // Kết thúc tải dữ liệu
      }
    };

    fetchLiveRaces();
    const interval = setInterval(fetchLiveRaces, 15000); // Polling định kỳ
    return () => clearInterval(interval); // Dọn dẹp khi unmount
  }, [raceId]);

  // Effect quản lý vòng đời kết nối WebSocket chat cho trận đấu được chọn
  useEffect(() => {
    if (!selectedRace) {
      setSocket(null);
      setConnectionState("disconnected");
      return;
    }

    let isComponentMounted = true;

    // Tải lịch sử tin nhắn chat cũ từ cơ sở dữ liệu trước khi kết nối socket mới
    api.get<any[]>(`/public/chat/history?raceId=${selectedRace.id}`)
      .then(history => {
        if (isComponentMounted) {
          setChatMessages([
            { user: "System", text: `Welcome to the live chat for Race #${selectedRace.id}!`, time: "" },
            ...(history || []).map(h => ({
              user: h.user,
              text: h.text,
              time: h.time
            }))
          ]);
        }
      })
      .catch(() => {
        if (isComponentMounted) {
          setChatMessages([
            { user: "System", text: `Welcome to the live chat for Race #${selectedRace.id}!`, time: "" }
          ]);
        }
      });

    setConnectionState("connecting");

    let ws: WebSocket | null = null;
    let reconnectTimeout: number;

    // Hàm thiết lập kết nối WebSocket
    const connect = () => {
      // Phân tích cấu hình địa chỉ API cơ sở để sinh ra URL ws:// hoặc wss:// tương ứng
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
      const hostPart = apiBase.replace(/^https?:\/\//, "").split("/")[0];
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${hostPart}/ws/chat/${selectedRace.id}`;
      
      ws = new WebSocket(wsUrl);

      // Khi kết nối thành công
      ws.onopen = () => {
        console.log("WebSocket connected to race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connected");
        }
      };

      // Nhận tin nhắn chat từ server WebSocket và đẩy vào danh sách hiển thị
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

      // Khi kết nối bị đóng, tự động kích hoạt tính năng kết nối lại sau 3 giây
      ws.onclose = () => {
        console.log("WebSocket connection closed for race chat: " + selectedRace.id);
        if (isComponentMounted) {
          setConnectionState("connecting");
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      // Xử lý khi kết nối socket gặp lỗi
      ws.onerror = (err) => {
        console.error("WebSocket chat connection error", err);
        if (isComponentMounted) {
          setConnectionState("disconnected");
        }
        if (ws) ws.close();
      };

      setSocket(ws);
    };

    connect(); // Thực hiện kết nối khi mount hoặc đổi selectedRace.id

    // Cleanup function để đóng kết nối socket cũ tránh rò rỉ bộ nhớ
    return () => {
      isComponentMounted = false;
      if (ws) {
        ws.onclose = null; // Gỡ bỏ handler close để tránh lặp reconnect vô tận khi cố ý unmount
        ws.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [selectedRace?.id]);

  // Hàm xử lý gửi tin nhắn của kịch bản chat trực tiếp lên WebSocket
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      user: username,
      text: newMsg.trim(),
      time
    };
    
    // Gửi payload tin nhắn dưới dạng chuỗi JSON
    socket.send(JSON.stringify(payload));
    setNewMsg(""); // Reset ô nhập chat
  };

  // Phân tích và chuyển đổi URL video YouTube hoặc video cục bộ để render
  const embedUrl = selectedRace ? getYouTubeEmbedUrl(selectedRace.youtubeLiveUrl) : null;
  const videoId = embedUrl ? embedUrl.split("/").pop()?.split("?")[0] : "";
  const iframeSrc = embedUrl ? (embedUrl.includes("youtube.com") ? `${embedUrl}?autoplay=1&mute=0&rel=0&modestbranding=1&playlist=${videoId}&loop=1` : embedUrl) : "";

  return (
    <div className="min-h-screen bg-[#0e0c09] text-[#f0f0f0] font-sans">
      {/* Header - Thanh công cụ đầu trang */}
      <header className="border-b border-[#2a2825] bg-[#100f0c] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          {/* Nút quay về trang chủ */}
          <button 
            onClick={() => navigate("/")} 
            className="text-amber-500 hover:text-amber-400 font-mono text-sm flex items-center space-x-1 transition"
          >
            <span>←</span> <span>{$t("Trang chủ", (localStorage.getItem('app-lang') || 'vi'))}</span>
          </button>
          <div className="h-4 w-[1px] bg-[#2a2825]"></div>
          <h1 className="text-lg font-bold text-white tracking-wide font-serif">
            🔴 {$t("Đấu Trường Livestream", (localStorage.getItem('app-lang') || 'vi'))}
          </h1>
        </div>
        
        {/* Các nút chuyển đổi chế độ xem rạp phim và nhãn "ĐANG PHÁT" */}
        {selectedRace && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTheaterMode(prev => !prev)}
              className="bg-[#151310] hover:bg-[#1a1815] border border-[#2a2825] hover:border-amber-500/30 text-white text-xs font-mono px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <span>🎭</span>
              <span>{isTheaterMode ? $t("Mặc định", (localStorage.getItem('app-lang') || 'vi')) : $t("Rạp phim", (localStorage.getItem('app-lang') || 'vi'))}</span>
            </button>
            <div className="flex items-center space-x-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3 py-1 rounded-full text-xs font-semibold uppercase animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span>{$t("ĐANG PHÁT", (localStorage.getItem('app-lang') || 'vi'))}</span>
            </div>
          </div>
        )}
      </header>

      {/* Banner cảnh báo nhấp nháy màu đỏ khi trận đấu đang bị trọng tài điều tra (Inquiry) */}
      {selectedRace && selectedRace.status === "STEWARDS_INQUIRY" && (
        <div 
          className="bg-rose-950/40 border-b border-rose-500/30 px-6 py-3 flex items-center justify-center space-x-3 text-rose-500 font-bold uppercase tracking-wider text-sm text-center animate-pulse"
          style={{ animationDuration: "1.5s" }}
        >
          <span className="text-xl">⚠️</span>
          <span>
            {$t("Stewards' Inquiry - Trận đấu đang được Trọng tài thẩm vấn vi phạm (Kết quả chưa chính thức)", (localStorage.getItem('app-lang') || 'vi'))}
          </span>
        </div>
      )}

      {/* Vùng bố cục giao diện chính */}
      <main className={`max-w-7xl mx-auto p-4 md:p-6 gap-6 ${isTheaterMode ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-3"}`}>
        
        {/* Cột chính bên trái: Trình phát video livestream */}
        <div className={`${isTheaterMode ? "w-full" : "lg:col-span-2"} space-y-6`}>
          {loading ? (
            // Vòng quay đang tải
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-white/60 font-mono text-sm">{$t("Đang tải dữ liệu livestream...", (localStorage.getItem('app-lang') || 'vi'))}</p>
            </div>
          ) : selectedRace ? (
            <div className="space-y-4">
              {/* Vùng chứa Iframe / Video Player / WebCam theo tỷ lệ chuẩn 16:9 */}
              <div className="relative w-full pb-[56.25%] h-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black">
                {selectedRace.streamMode === "WEBCAM" ? (
                  /* Trình phát WebCam Stream truyền từ Điện thoại / Camera */
                  <WebCamLiveViewer raceId={selectedRace.id} />
                ) : selectedRace.youtubeLiveUrl && (
                  selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".mp4") ||
                  selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".webm") ||
                  selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".ogg") ||
                  selectedRace.youtubeLiveUrl.toLowerCase().endsWith(".m3u8") ||
                  selectedRace.youtubeLiveUrl.toLowerCase().includes("/stream") ||
                  selectedRace.youtubeLiveUrl.toLowerCase().includes(".mp4?")
                ) ? (
                  // Trình phát HTML5 Video nếu link là tệp tin video trực tiếp (.mp4...)
                  <video
                    className="absolute top-0 left-0 w-full h-full border-none"
                    src={selectedRace.youtubeLiveUrl}
                    controls
                    autoPlay
                  />
                ) : embedUrl ? (
                  <>
                    {/* Trình phát Iframe cho các nguồn YouTube embed */}
                    <iframe
                      className="absolute top-0 left-0 w-full h-full border-none"
                      src={iframeSrc}
                      title={selectedRace.classLevel}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                    {/* Lớp che mờ bảo vệ ở chân trình phát ngăn các click tương tác ngoài ý muốn của YouTube */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "14%", zIndex: 10, background: "transparent", cursor: "default" }} onClick={e => e.stopPropagation()} />
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-sm font-mono">
                    <span>{$t("Không tìm thấy luồng phát", (localStorage.getItem('app-lang') || 'vi'))}</span>
                  </div>
                )}
              </div>

              {/* Hộp hiển thị Thông tin Chi tiết Trận đấu */}
              <div className="bg-[#151310] border border-[#2a2825] p-5 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-white font-serif">
                    {selectedRace.classLevel} - Race #{selectedRace.id}
                  </h2>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-lg text-xs font-mono font-bold">
                    {selectedRace.meetingName}
                  </span>
                </div>
                
                {/* Thông số kỹ thuật của đường đua */}
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#2a2825] text-xs md:text-sm font-mono text-white/60">
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Cự ly đua", (localStorage.getItem('app-lang') || 'vi'))}</span>
                    <span className="text-white font-semibold">{selectedRace.distanceMeters} Meters</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Loại đường đua", (localStorage.getItem('app-lang') || 'vi'))}</span>
                    <span className="text-white font-semibold">{selectedRace.trackType}</span>
                  </div>
                  <div>
                    <span className="block text-white/40 text-[10px] uppercase tracking-wider mb-1">{$t("Thời gian bắt đầu", (localStorage.getItem('app-lang') || 'vi'))}</span>
                    <span className="text-white font-semibold">{selectedRace.startTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Khung hiển thị lỗi khi không tìm thấy luồng trực tiếp
            <div className="flex flex-col items-center justify-center h-[450px] bg-[#151310] border border-[#2a2825] rounded-2xl p-6 text-center space-y-4">
              <div className="text-4xl">📺</div>
              <h3 className="text-lg font-bold text-white font-serif">{$t("Không có livestream trực tiếp nào", (localStorage.getItem('app-lang') || 'vi'))}</h3>
              <p className="text-white/60 text-sm max-w-md font-sans leading-relaxed">
                {$t("Hiện tại không có trận đấu nào đang chạy hoặc Admin chưa thiết lập đường link phát trực tiếp. Vui lòng quay lại sau!", (localStorage.getItem('app-lang') || 'vi'))}
              </p>
              <button 
                onClick={() => navigate("/")}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs rounded-xl transition font-mono uppercase tracking-wider"
              >
                {$t("Về Trang chủ", (localStorage.getItem('app-lang') || 'vi'))}
              </button>
            </div>
          )}
        </div>

        {/* Cột bên phải: Chuyển đổi kênh livestream và Khung Live Chat */}
        <div className={isTheaterMode ? "grid grid-cols-1 md:grid-cols-2 gap-6 w-full" : "space-y-6 flex flex-col h-auto"}>
          
          {/* Thư mục danh sách các luồng đang phát (Kênh livestream khác) */}
          {liveRaces.length > 0 && (
            <div className="bg-[#151310] border border-[#2a2825] rounded-2xl p-4 flex flex-col space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                  {$t("Danh Sách Livestream", (localStorage.getItem('app-lang') || 'vi'))}
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">{$t("Chọn trận đấu để chuyển đổi luồng phát", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
                        {isCurrent ? $t("ĐANG XEM", (localStorage.getItem('app-lang') || 'vi')) : $t("XEM NGAY", (localStorage.getItem('app-lang') || 'vi'))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hộp thoại trò chuyện trực tiếp (Live Chat Widget) */}
          <div className="flex flex-col h-[350px] lg:h-[350px] bg-[#151310] border border-[#2a2825] rounded-2xl overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-[#2a2825] bg-[#1a1815] flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                {$t("Trò chuyện trực tiếp", (localStorage.getItem('app-lang') || 'vi'))}
              </h3>
              {/* Badge chỉ định trạng thái kết nối socket thực tế */}
              {connectionState === "connected" ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {$t("Trực tuyến", (localStorage.getItem('app-lang') || 'vi'))}
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

            {/* Vùng cuộn hiển thị tin nhắn chat */}
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

            {/* Form gửi tin nhắn chat */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-[#2a2825] bg-[#1a1815] flex gap-2">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder={$t("Nhập tin nhắn...", (localStorage.getItem('app-lang') || 'vi'))}
                className="flex-1 bg-[#0e0c09] border border-[#2a2825] focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none placeholder-white/30"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-[#0e0c09] font-bold text-xs px-3 rounded-lg transition font-mono"
              >
                {$t("GỬI", (localStorage.getItem('app-lang') || 'vi'))}
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}

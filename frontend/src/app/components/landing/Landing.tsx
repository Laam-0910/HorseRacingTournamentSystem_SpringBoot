import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { parseSafeDate, formatDate } from "../../utils/dateTimeHelper";
import { parseMarkdownToHtml } from "../../utils/markdownParser";


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type SubView = "home" | "live" | "racecard" | "results" | "fixtures" | "statistics" | "horses" | "jockeys_owners" | "incident" | "about" | "search";

interface Season { id: number; name: string; startDate: string; endDate: string; status?: string; }
interface Meeting { id: number; name: string; venue: string; startDate: string; totalBudget: number; }
interface Horse { id: number; name: string; age: number; breed: string; ownerName: string; rating: number; wins: number; races: number; }
interface Jockey { id: number; name: string; wins: number; races: number; winRate: number; }
interface Result { id: number; raceName: string; meetingName: string; date: string; entries: ResultEntry[]; }
interface ResultEntry { position: number; horseName: string; jockeyName: string; finishTime: string; prize: number; }
interface Fixture { id: number; name: string; venue: string; date: string; numRaces: number; status: string; }
interface Stat { jockeyName: string; horseName: string; wins: number; races: number; winRate: number; top3Rate: number; earnings: number; }
interface Incident { id: number; raceName: string; date: string; horseName: string; jockeyName: string; type: string; description: string; penalty: string; }
interface RacecardEntry { position: number; horseName: string; jockeyName: string; ownerName: string; age: number; weight: string; rating: number; }
interface Racecard { id: number; name: string; class: string; distance: string; going: string; prize: number; entries: RacecardEntry[]; }

const TRANSLATIONS: Record<string, any> = {
  vi: {
    home: "Trang chủ",
    live: "Trực tiếp",
    racecard: "Bảng đua",
    results: "Kết quả",
    fixtures: "Lịch thi đấu",
    statistics: "Thống kê",
    horses: "Danh sách Ngựa",
    jockeys_owners: "Nài & Chủ ngựa",
    incident: "Báo cáo sự cố",
    welcome: "Chào mừng đến với Hệ thống Quản lý Đua ngựa",
    welcomeSub: "Chọn một chức năng bên dưới để bắt đầu.",
    activeSeasons: "Mùa giải đang hoạt động",
    noActiveSeasons: "Hiện chưa có mùa giải nào hoạt động.",
    upcomingMeetings: "Các Ngày hội đua sắp tới",
    noUpcomingMeetings: "Chưa lên lịch ngày hội đua nào.",
    watchLive: "XEM TRỰC TIẾP",
    viewRacecard: "Xem Bảng đua",
    about: "Giới thiệu",
    signin: "Đăng nhập",
    register: "Đăng ký",
    signout: "Đăng xuất",
    dashboard: "Trang quản trị",
    searchPlaceholder: "Tìm kiếm ngựa, nài, chủ ngựa, trận đua...",
    notifications: "Thông báo",
    clearAll: "Xóa tất cả",
    noNotifications: "Không có thông báo mới",
  },
  en: {
    home: "Home",
    live: "Live",
    racecard: "Racecard",
    results: "Results",
    fixtures: "Fixtures",
    statistics: "Statistics",
    horses: "Horses",
    jockeys_owners: "Jockeys & Owners",
    incident: "Incident Report",
    welcome: "Welcome to Horse Race Management System",
    welcomeSub: "Select an option from the menu to get started.",
    activeSeasons: "Active Seasons",
    noActiveSeasons: "No active seasons currently available.",
    upcomingMeetings: "Upcoming Race Meetings",
    noUpcomingMeetings: "No upcoming meetings scheduled.",
    watchLive: "WATCH LIVE",
    viewRacecard: "View Racecard",
    about: "About",
    signin: "Sign In",
    register: "Register",
    signout: "Sign out",
    dashboard: "Dashboard",
    searchPlaceholder: "Search horse, jockey, horse owner, race…",
    notifications: "Notifications",
    clearAll: "Clear All",
    noNotifications: "No more notifications",
  },
  zh: {
    home: "首页",
    live: "直播",
    racecard: "排位表",
    results: "比赛结果",
    fixtures: "赛程安排",
    statistics: "统计数据",
    horses: "马匹登记",
    jockeys_owners: "骑师与马主",
    incident: "事故报告",
    welcome: "欢迎来到赛马管理系统",
    welcomeSub: "从菜单中选择一个选项以开始。",
    activeSeasons: "进行中的赛季",
    noActiveSeasons: "当前没有进行中的赛季。",
    upcomingMeetings: "即将进行的赛事",
    noUpcomingMeetings: "没有安排即将进行的赛事。",
    watchLive: "观看直播",
    viewRacecard: "查看排位表",
    about: "关于",
    signin: "登录",
    register: "注册",
    signout: "退出登录",
    dashboard: "管理面板",
    searchPlaceholder: "搜索马匹、骑师、马主、比赛...",
    notifications: "通知",
    clearAll: "清除全部",
    noNotifications: "没有更多通知",
  },
  ja: {
    home: "ホーム",
    live: "ライブ",
    racecard: "レースカード",
    results: "レース結果",
    fixtures: "日程・スケジュール",
    statistics: "統計データ",
    horses: "競走馬一覧",
    jockeys_owners: "騎手＆馬主",
    incident: "インシデント報告",
    welcome: "競馬管理システムへようこそ",
    welcomeSub: "メニューからオプションを選択して開始します。",
    activeSeasons: "アクティブなシーズン",
    noActiveSeasons: "現在開催中のシーズンはありません。",
    upcomingMeetings: "開催予定のレースミーティング",
    noUpcomingMeetings: "開催予定のレースはありません。",
    watchLive: "ライブを見る",
    viewRacecard: "レースカードを見る",
    about: "概要",
    signin: "ログイン",
    register: "会員登録",
    signout: "ログアウト",
    dashboard: "管理ダッシュボード",
    searchPlaceholder: "馬、騎手、馬主、レースを検索...",
    notifications: "通知",
    clearAll: "すべてクリア",
    noNotifications: "新しい通知はありません",
  }
};

// ─────────────────────────────────────────────
// Chatbot
// ─────────────────────────────────────────────
const CHAT_LANG: Record<string, any> = {
  vi: { label: "AI Horse Racing", placeholder: "Nhập câu hỏi...", typing: "Đang phân tích...", welcome: "Xin chào! Hỏi tôi về ngựa, nài, race, dự đoán kết quả nhé.", error: "Lỗi: ", noconn: "Không kết nối được server AI.", quick: ["Rating cao nhất","Dự đoán race","Nài xuất sắc","Mùa giải"], quickQ: ["Ngựa nào rating cao nhất?","Dự đoán kết quả race mới nhất","Nài ngựa xuất sắc nhất?","Mùa giải hiện tại"] },
  en: { label: "AI Horse Racing", placeholder: "Ask a question...", typing: "Analyzing...", welcome: "Hello! Ask me about horses, jockeys, races, or predictions.", error: "Error: ", noconn: "Cannot connect to AI server.", quick: ["Top Rating","Predict Race","Best Jockey","Season"], quickQ: ["Which horse has the highest rating?","Predict the latest race result","Which jockey has the best top-3 rate?","Current season summary"] },
  ja: { label: "AI競馬アシスタント", placeholder: "質問を入力...", typing: "分析中...", welcome: "こんにちは！馬・騎手・レース・予測について聞いてください。", error: "エラー：", noconn: "AIサーバーに接続できません。", quick: ["最高レーティング","レース予測","優秀騎手","シーズン"], quickQ: ["最もレーティングが高い馬は？","最新レースを予測","トップ3率が最も高い騎手は？","今シーズンのまとめ"] },
  zh: { label: "AI赛马助手", placeholder: "输入问题...", typing: "分析中...", welcome: "你好！请问关于马匹、骑师、比赛或预测的问题。", error: "错误：", noconn: "无法连接AI服务器。", quick: ["最高评分","预测赛事","优秀骑师","赛季"], quickQ: ["哪匹马评分最高？","预测最新比赛结果","哪位骑师前三率最高？","本赛季总结"] },
};

function ChatBot({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: "welcome", type: "bot", text: CHAT_LANG[lang] ? CHAT_LANG[lang].welcome : CHAT_LANG.vi.welcome }]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? { ...m, text: CHAT_LANG[lang] ? CHAT_LANG[lang].welcome : CHAT_LANG.vi.welcome } : m));
  }, [lang]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const changeLang = (l: string) => {
    setLang(l);
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || waiting) return;
    setInput("");
    const userMsg = { id: `u-${Date.now()}`, type: "user", text: msg };
    const typingMsg = { id: `t-${Date.now()}`, type: "typing", text: CHAT_LANG[lang].typing };
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setWaiting(true);
    try {
      const data = await api.post<any>("/ai/chat", { message: msg, lang, sessionId });
      const rawText = data.success ? data.reply : CHAT_LANG[lang].error + (data.error || "");
      
      const botMsgId = `b-${Date.now()}`;
      setMessages(prev => prev.filter(m => m.type !== "typing").concat({ id: botMsgId, type: "bot", text: "" }));
      
      let currentText = "";
      let charIdx = 0;
      const timer = setInterval(() => {
        if (charIdx < rawText.length) {
          currentText += rawText.substring(charIdx, charIdx + 5);
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: currentText } : m));
          charIdx += 5;
        } else {
          clearInterval(timer);
          setWaiting(false);
        }
      }, 10); // Very fast and smooth typing (5 characters every 10ms)
    } catch {
      setMessages(prev => prev.filter(m => m.type !== "typing").concat({ id: `b-${Date.now()}`, type: "bot", text: CHAT_LANG[lang].noconn }));
      setWaiting(false);
    }
  };

  const L = CHAT_LANG[lang];

  return (
    <>
      {/* Toggle Button */}
      <button onClick={() => setOpen(o => !o)} style={{ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: "#C9A84C", color: "#111", border: "none", cursor: "pointer", fontSize: 22, zIndex: 9999, boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
        🤖
      </button>

      {/* Chat Widget */}
      {open && (
        <div style={{ position: "fixed", bottom: 88, right: 24, width: 370, height: 530, background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 12, display: "flex", flexDirection: "column", zIndex: 9998, overflow: "hidden", boxShadow: "0 6px 28px rgba(0,0,0,0.75)" }}>
          {/* Header */}
          <div style={{ background: "#111", color: "#C9A84C", padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(201,168,76,0.2)", flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>🤖 {L.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select value={lang} onChange={e => changeLang(e.target.value)} style={{ background: "#1e1e1e", border: "1px solid rgba(201,168,76,0.33)", color: "#C9A84C", borderRadius: 5, fontSize: 11, padding: "3px 5px", cursor: "pointer", outline: "none" }}>
                <option value="vi">🇻🇳 VI</option>
                <option value="en">🇺🇸 EN</option>
                <option value="ja">🇯🇵 JA</option>
                <option value="zh">🇨🇳 ZH</option>
              </select>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#777", fontSize: 17, cursor: "pointer", padding: "2px 4px" }}>✕</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #222", display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0, background: "#141414" }}>
            {L.quick.map((q: string, i: number) => (
              <button key={i} onClick={() => sendMessage(L.quickQ[i])} style={{ fontSize: 11, padding: "4px 11px", border: "1px solid rgba(201,168,76,0.33)", borderRadius: 20, background: "#241f00", color: "#C9A84C", cursor: "pointer", whiteSpace: "nowrap" }}>{q}</button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#1a1a1a" }}>
            {messages.map(m => {
              const isUser = m.type === "user";
              const isTyping = m.type === "typing";
              return (
                <div
                  key={m.id}
                  style={{
                    maxWidth: "86%",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: 1.55,
                    wordBreak: "break-word",
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    background: isUser ? "#C9A84C" : "#242424",
                    color: isUser ? "#111" : (isTyping ? "#666" : "#ddd"),
                    fontWeight: isUser ? 500 : 400,
                    fontStyle: isTyping ? "italic" : "normal",
                    border: !isUser ? "1px solid #2e2e2e" : "none"
                  }}
                >
                  {isUser || isTyping ? (
                    m.text
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(m.text) }} />
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #222", display: "flex", gap: 8, flexShrink: 0, background: "#141414" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={L.placeholder} style={{ flex: 1, padding: "8px 13px", border: "1px solid #333", borderRadius: 20, fontSize: 13, outline: "none", background: "#222", color: "#e0e0e0" }} />
            <button onClick={() => sendMessage()} disabled={waiting} style={{ width: 36, height: 36, borderRadius: "50%", background: waiting ? "#3a3a3a" : "#C9A84C", color: waiting ? "#666" : "#111", border: "none", cursor: waiting ? "not-allowed" : "pointer", fontSize: 16, flexShrink: 0 }}>▶</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Sub-view components
// ─────────────────────────────────────────────
const SEARCH_TRANSLATIONS: Record<string, any> = {
  vi: {
    title: "Kết quả tìm kiếm",
    foundResults: (count: number, query: string) => `Tìm thấy ${count} kết quả cho từ khóa "${query}"`,
    closeSearch: "✕ Đóng tìm kiếm",
    tabAll: "Tất cả",
    tabHorses: "Ngựa đua",
    tabPeople: "Nài & Chủ ngựa",
    tabRaces: "Ngày hội & Trận đấu",
    noHorses: "Không tìm thấy chiến mã nào.",
    noPeople: "Không tìm thấy nài ngựa hay chủ ngựa nào.",
    noRaces: "Không tìm thấy ngày hội hay cuộc đua nào.",
    labelBreed: "Giống",
    labelOwner: "Chủ ngựa",
    labelRaces: "Số trận",
    labelWins: "thắng",
    labelEmail: "Email",
    labelWeight: "Cân nặng",
    labelVenue: "Địa điểm",
    labelTime: "Thời gian",
    labelTrack: "Đường chạy",
    labelMaxEntries: "Số ngựa tối đa",
    labelPurse: "Purse",
    labelMeetingHeader: "📅 Ngày hội đua",
    labelRaceHeader: "🏁 Trận đấu / Cuộc đua",
    labelUnknown: "Không rõ"
  },
  en: {
    title: "Search Results",
    foundResults: (count: number, query: string) => `Found ${count} results for keyword "${query}"`,
    closeSearch: "✕ Close Search",
    tabAll: "All",
    tabHorses: "Horses",
    tabPeople: "Jockeys & Owners",
    tabRaces: "Meetings & Races",
    noHorses: "No horses found.",
    noPeople: "No jockeys or owners found.",
    noRaces: "No meetings or races found.",
    labelBreed: "Breed",
    labelOwner: "Owner",
    labelRaces: "Races",
    labelWins: "wins",
    labelEmail: "Email",
    labelWeight: "Weight",
    labelVenue: "Venue",
    labelTime: "Time",
    labelTrack: "Track",
    labelMaxEntries: "Max Entries",
    labelPurse: "Purse",
    labelMeetingHeader: "📅 Race Meetings",
    labelRaceHeader: "🏁 Races / Matches",
    labelUnknown: "Unknown"
  },
  zh: {
    title: "搜索结果",
    foundResults: (count: number, query: string) => `找到关于 "${query}" 的 ${count} 条结果`,
    closeSearch: "✕ 关闭搜索",
    tabAll: "全部",
    tabHorses: "马匹",
    tabPeople: "骑师与马主",
    tabRaces: "赛事与赛马日",
    noHorses: "未找到马匹。",
    noPeople: "未找到骑师或马主。",
    noRaces: "未找到赛事或赛马日。",
    labelBreed: "品种",
    labelOwner: "马主",
    labelRaces: "出赛次数",
    labelWins: "胜出",
    labelEmail: "电子邮箱",
    labelWeight: "体重",
    labelVenue: "场地",
    labelTime: "时间",
    labelTrack: "跑道",
    labelMaxEntries: "最大参赛马匹数",
    labelPurse: "奖金",
    labelMeetingHeader: "赛马日",
    labelRaceHeader: "赛事 / 比赛",
    labelUnknown: "未知"
  },
  ja: {
    title: "検索結果",
    foundResults: (count: number, query: string) => `キーワード "${query}" に対して ${count} 件の結果が見つかりました`,
    closeSearch: "✕ 検索を閉じる",
    tabAll: "すべて",
    tabHorses: "競走馬",
    tabPeople: "騎手 & 馬主",
    tabRaces: "開催日 & レース",
    noHorses: "競走馬が見つかりませんでした。",
    noPeople: "騎手または馬主が見つかりませんでした。",
    noRaces: "開催日またはレースが見つかりませんでした。",
    labelBreed: "品種",
    labelOwner: "馬主",
    labelRaces: "出走回数",
    labelWins: "勝利",
    labelEmail: "メール",
    labelWeight: "体重",
    labelVenue: "開催地",
    labelTime: "時間",
    labelTrack: "馬場",
    labelMaxEntries: "最大出走頭数",
    labelPurse: "賞金",
    labelMeetingHeader: "レース開催日",
    labelRaceHeader: "レース / 競走",
    labelUnknown: "不明"
  }
};

interface SearchViewProps {
  query: string;
  horses: any[];
  people: any[];
  meetings: any[];
  races: any[];
  t: any;
  setView: (v: SubView) => void;
  lang: string;
}

function SearchView({ query, horses, people, meetings, races, t, setView, lang }: SearchViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "horses" | "people" | "races">("all");

  const st = SEARCH_TRANSLATIONS[lang] || SEARCH_TRANSLATIONS.vi;
  const totalMatches = horses.length + people.length + meetings.length + races.length;

  return (
    <div style={{ color: "#f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>
            {st.title}
          </h2>
          <p style={{ color: "#a0a0a0", fontSize: "0.875rem", fontFamily: "monospace", marginTop: "0.25rem" }}>
            {st.foundResults(totalMatches, query)}
          </p>
        </div>
        <button 
          onClick={() => { setView("home"); }} 
          style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", cursor: "pointer", fontFamily: "monospace" }}
        >
          {st.closeSearch}
        </button>
      </div>

      {/* Categories Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #2a2825", marginBottom: "2rem", gap: "1rem" }}>
        {[
          { id: "all", label: st.tabAll, count: totalMatches },
          { id: "horses", label: st.tabHorses, count: horses.length },
          { id: "people", label: st.tabPeople, count: people.length },
          { id: "races", label: st.tabRaces, count: meetings.length + races.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #c9a227" : "2px solid transparent",
              color: activeTab === tab.id ? "#c9a227" : "#a0a0a0",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              fontSize: "0.825rem",
              fontFamily: "monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              transition: "all 0.2s"
            }}
          >
            {tab.label} <span style={{ fontSize: "0.7rem", background: activeTab === tab.id ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.05)", padding: "0.1rem 0.4rem", borderRadius: "999px" }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Results Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* HORSES SECTION */}
        {(activeTab === "all" || activeTab === "horses") && (
          <div>
            {(activeTab === "all") && <h3 style={{ color: "#c9a227", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "monospace" }}>{st.tabHorses} ({horses.length})</h3>}
            {horses.length === 0 ? (
              activeTab === "horses" && <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "13px" }}>{st.noHorses}</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {horses.map(h => (
                  <div key={h.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "1.25rem", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <h4 style={{ fontWeight: "bold", fontSize: "1rem", color: "#f0f0f0" }}>🐴 {h.name}</h4>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>Rating {h.currentRating || h.rating}</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <p>🧬 {st.labelBreed}: <span style={{ color: "#fff" }}>{h.breed}</span></p>
                      <p>👤 {st.labelOwner}: <span style={{ color: "#fff" }}>{h.ownerName || st.labelUnknown}</span></p>
                      <p>📊 {st.labelRaces}: <span style={{ color: "#fff" }}>{h.totalRaces || h.races || 0} {st.labelRaces.toLowerCase()} ({h.totalWins || h.wins || 0} {st.labelWins})</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEOPLE SECTION */}
        {(activeTab === "all" || activeTab === "people") && (
          <div>
            {(activeTab === "all") && <h3 style={{ color: "#c9a227", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "monospace" }}>{st.tabPeople} ({people.length})</h3>}
            {people.length === 0 ? (
              activeTab === "people" && <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "13px" }}>{st.noPeople}</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {people.map(p => (
                  <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h4 style={{ fontWeight: "bold", fontSize: "1rem", color: "#f0f0f0" }}>👤 {p.fullName || p.username}</h4>
                      <span style={{ fontSize: "0.65rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: p.roleId === 3 ? "#34d399" : p.roleId === 2 ? "#60a5fa" : "#fb7171", background: p.roleId === 3 ? "rgba(52,211,153,0.1)" : p.roleId === 2 ? "rgba(96,165,250,0.1)" : "rgba(251,113,113,0.1)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                        {p.roleId === 3 ? "Jockey" : p.roleId === 2 ? "Owner" : "Referee"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>
                      <p>✉️ {st.labelEmail}: <span style={{ color: "#fff" }}>{p.email}</span></p>
                      {p.roleId === 3 && <p>⚖️ {st.labelWeight}: <span style={{ color: "#fff" }}>{p.weight || "N/A"} kg</span></p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEETINGS & RACES SECTION */}
        {(activeTab === "all" || activeTab === "races") && (
          <div>
            {(activeTab === "all") && <h3 style={{ color: "#c9a227", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "monospace" }}>{st.tabRaces} ({meetings.length + races.length})</h3>}
            {meetings.length === 0 && races.length === 0 ? (
              activeTab === "races" && <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "13px" }}>{st.noRaces}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Meetings */}
                {meetings.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "0.75rem" }}>{st.labelMeetingHeader} ({meetings.length})</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                      {meetings.map(m => (
                        <div key={m.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                          <h4 style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f0f0f0", marginBottom: "0.5rem" }}>🏆 {m.name}</h4>
                          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>📍 {st.labelVenue}: <span style={{ color: "#fff" }}>{m.venue}</span></p>
                          <p style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>📅 {st.labelTime}: <span style={{ color: "#fff" }}>{formatDate(m.startDate || m.date)}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Races */}
                {races.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", textTransform: "uppercase", marginBottom: "0.75rem" }}>{st.labelRaceHeader} ({races.length})</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                      {races.map(r => (
                        <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <h4 style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f0f0f0" }}>🏁 {st.labelRaceHeader.split(" ")[1]} #{r.id} ({r.classLevel})</h4>
                            <span style={{ fontSize: "0.65rem", fontWeight: "bold", textTransform: "uppercase", color: r.status === "OFFICIAL" ? "#34d399" : "#fbbf24", background: r.status === "OFFICIAL" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                              {r.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#a0a0a0" }}>
                            <p>🛣️ {st.labelTrack}: <span style={{ color: "#fff" }}>{r.trackType} ({r.distanceMeters}m)</span></p>
                            <p>🐎 {st.labelMaxEntries}: <span style={{ color: "#fff" }}>{r.maxEntries}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function HomeView({ seasons, meetings, t }: { seasons: Season[]; meetings: Meeting[]; t: any }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "0.5rem" }}>{t.welcome}</h2>
      <p style={{ color: "#a0a0a0", marginBottom: "2rem" }}>{t.welcomeSub}</p>

      {/* Active Seasons */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ color: "#c9a227", fontWeight: 700, fontFamily: "monospace", fontSize: "1.25rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.5rem", borderBottom: "1px solid #2a2825" }}>{t.activeSeasons}</h3>
        {seasons.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontSize: "0.875rem", fontFamily: "monospace", fontStyle: "italic" }}>{t.noActiveSeasons}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {seasons.map(s => {
              const formatSeasonDate = (rawStr: string) => {
                if (!rawStr) return "";
                const d = parseSafeDate(rawStr);
                if (!d || isNaN(d.getTime())) return rawStr;
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
              };

              return (
                <div key={s.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f0f0f0" }}>{s.name}</h4>
                    <span style={{ fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "rgba(74,157,111,0.15)", color: "#4a9d6f" }}>Active</span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                    📅 {formatSeasonDate(s.startDate)} → {formatSeasonDate(s.endDate)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ color: "#c9a227", fontWeight: 700, fontFamily: "monospace", fontSize: "1.25rem", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: "0.5rem", borderBottom: "1px solid #2a2825" }}>{t.upcomingMeetings}</h3>
        {meetings.length === 0 ? (
          <p style={{ color: "#a0a0a0", fontSize: "0.875rem", fontFamily: "monospace", fontStyle: "italic" }}>{t.noUpcomingMeetings}</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {meetings.map(m => {
              const formatDateTime = (rawStr: string) => {
                if (!rawStr) return { date: "", time: "" };
                const d = parseSafeDate(rawStr);
                if (!d || isNaN(d.getTime())) return { date: rawStr, time: "" };
                const pad = (n: number) => String(n).padStart(2, '0');
                const dateFormatted = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
                const timeFormatted = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                return { date: dateFormatted, time: timeFormatted };
              };
              const { date, time } = formatDateTime(m.startDate);

              return (
                <div key={m.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.25rem" }}>
                  <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f0f0f0", marginBottom: "0.75rem" }}>{m.name}</h4>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginBottom: "0.375rem" }}>📍 Venue: {m.venue}</p>
                  <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginBottom: "0.375rem" }}>📅 Date: {date}</p>
                  {time && (
                    <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginBottom: "0.375rem" }}>🕒 Time: {time}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GenericTableView({ title, data, columns }: { title: string; data: any[]; columns: { key: string; label: string }[] }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatValue = (cKey: string, val: any) => {
    if (val === null || val === undefined) return "-";
    if (cKey === "totalBudget" && typeof val === "number") {
      return `$${val.toLocaleString()}`;
    }
    if (cKey === "startDate" || cKey === "date" || cKey.toLowerCase().includes("date")) {
      return formatDate(val);
    }
    return String(val);
  };

  if (isMobile) {
    return (
      <div>
        <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "1.5rem" }}>{title}</h2>
        {data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem" }}>
            <p style={{ color: "#a0a0a0", fontFamily: "monospace" }}>No data available.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.map((row, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {columns.map((c, colIdx) => {
                  const val = row[c.key];
                  if (colIdx === 0) {
                    return (
                      <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#c9a227" }}>
                          {c.label}: {formatValue(c.key, val)}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={c.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#f0f0f0", paddingBottom: "0.25rem", borderBottom: colIdx < columns.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</span>
                      <span style={{ fontWeight: 600 }}>
                        {formatValue(c.key, val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "1.5rem" }}>{title}</h2>
      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.75rem" }}>
          <p style={{ color: "#a0a0a0", fontFamily: "monospace" }}>No data available.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(201,162,39,0.08)", borderBottom: "1px solid #2a2825" }}>
                {columns.map(c => (
                  <th key={c.key} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", fontWeight: 600 }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#f0f0f0" }}>{formatValue(c.key, row[c.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AboutView() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.75rem", color: "#f0f0f0", marginBottom: "0.5rem" }}>About Horse Race Management System</h2>
      <p style={{ color: "#c9a227", fontFamily: "monospace", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2rem" }}>The Complete Racing Management Platform</p>
      
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
        <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#c9a227", marginBottom: "0.75rem" }}>Our Mission</h3>
        <p style={{ color: "#a0a0a0", fontSize: "0.9rem", lineHeight: 1.7 }}>
          The Horse Race Management System is a comprehensive platform designed to streamline and modernize horse racing tournament management. From season initialization to race-day operations, our system provides administrators, horse owners, jockeys, and referees with the tools they need to conduct fair, exciting, and well-organized race events.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {[
          { icon: "🏆", title: "Season Management", desc: "Full tournament lifecycle from setup to results" },
          { icon: "🐎", title: "Horse Registry", desc: "Track horses, ratings, and performance" },
          { icon: "🏇", title: "Jockey Management", desc: "Manage jockey profiles and invitations" },
          { icon: "📋", title: "Race Operations", desc: "Racecard, schedule, live supervision" },
          { icon: "📊", title: "Statistics", desc: "Win rates, earnings, performance analytics" },
          { icon: "⚠️", title: "Incident Reports", desc: "Rule violation tracking and penalties" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{item.icon}</div>
            <h4 style={{ fontWeight: 700, color: "#f0f0f0", fontSize: "0.875rem", marginBottom: "0.25rem" }}>{item.title}</h4>
            <p style={{ color: "#a0a0a0", fontSize: "0.75rem" }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN LANDING COMPONENT
// ─────────────────────────────────────────────
export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<SubView>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const [lang, setLangRaw] = useState(() => localStorage.getItem('app-lang') || 'vi');
  const setLang = (code: string) => { setLangRaw(code); localStorage.setItem('app-lang', code); };
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const langLabel = lang.toUpperCase();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [showNoLiveToast, setShowNoLiveToast] = useState(false);
  const [noLiveTimer, setNoLiveTimer] = useState<any>(null);

  // Data states
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Resolve jockey/owner details
  const [violations, setViolations] = useState<any[]>([]);
  const [liveRaces, setLiveRaces] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);

  // Selected states for Racecard & Results
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [selectedRaceEntries, setSelectedRaceEntries] = useState<any[]>([]);
  const [meetingRaces, setMeetingRaces] = useState<any[]>([]);

  const [clearedNotifications, setClearedNotifications] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cleared-notifications") || "[]");
    } catch {
      return [];
    }
  });

  const getDynamicNotifications = () => {
    const list: any[] = [];
    const lang = localStorage.getItem("app-lang") || "vi";

    // Common/Fallback Notification: Active Season
    const activeSeason = seasons.find(s => s.status === "ACTIVE");
    if (activeSeason) {
      list.push({
        id: `season-${activeSeason.id}`,
        icon: "🏆",
        color: "#c9a227",
        bg: "rgba(201,162,39,0.1)",
        title: lang === "vi" ? "Mùa Giải Hoạt Động" : "Active Tournament Season",
        desc: lang === "vi" 
          ? `Mùa giải ${activeSeason.name} đang diễn ra! Đăng ký tham gia ngay.`
          : `Season ${activeSeason.name} is currently active! Register now.`,
        time: lang === "vi" ? "Đang diễn ra" : "Ongoing"
      });
    }

    if (!user) {
      // 1. GUEST: Upcoming Meetings Notification
      const now = new Date();
      const upcomingMeeting = meetings
        .filter(m => {
          const mDate = parseSafeDate(m.startDate);
          return mDate && mDate > now;
        })
        .sort((a, b) => {
          const da = parseSafeDate(a.startDate)?.getTime() || 0;
          const db = parseSafeDate(b.startDate)?.getTime() || 0;
          return da - db;
        })[0];

      if (upcomingMeeting) {
        list.push({
          id: `meeting-${upcomingMeeting.id}`,
          icon: "📅",
          color: "#60a5fa",
          bg: "rgba(96,165,250,0.1)",
          title: lang === "vi" ? "Sự kiện sắp khởi tranh" : "Upcoming Race Meeting",
          desc: lang === "vi"
            ? `${upcomingMeeting.name} sẽ bắt đầu tại ${upcomingMeeting.venue}.`
            : `${upcomingMeeting.name} starts soon at ${upcomingMeeting.venue}.`,
          time: formatDate(upcomingMeeting.startDate)
        });
      }
    } else if (user.roleId === 1) {
      // 2. ADMIN: Pending violations decision
      const pendingViolations = violations.filter((v: any) => !v.violation?.penalty || v.violation?.status === "PENDING");
      if (pendingViolations.length > 0) {
        list.push({
          id: `admin-viol-pending`,
          icon: "🛡",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          title: lang === "vi" ? "Sự cố chờ quyết định" : "Pending Violation Decision",
          desc: lang === "vi"
            ? `Có ${pendingViolations.length} sự cố vi phạm đang chờ xử lý quyết định phạt.`
            : `There are ${pendingViolations.length} violation reports awaiting penalty decision.`,
          time: "Admin Alert"
        });
      }
      // - Races that are finished but not official yet
      const unprocessRaces = races.filter(r => r.status === "FINISHED" || r.status === "RACE_EVENT_ENDED");
      if (unprocessRaces.length > 0) {
        list.push({
          id: `admin-races-unprocessed`,
          icon: "⚙️",
          color: "#fbbf24",
          bg: "rgba(251,191,36,0.1)",
          title: lang === "vi" ? "Trận đua cần xử lý kết quả" : "Races to Process",
          desc: lang === "vi"
            ? `Có ${unprocessRaces.length} trận đua đã kết thúc cần được duyệt kết quả chính thức.`
            : `There are ${unprocessRaces.length} finished races awaiting official results processing.`,
          time: "Action Required"
        });
      }
    } else if (user.roleId === 2) {
      // 3. HORSE OWNER: If owner's horses are involved in a violation
      const ownerViolations = violations.filter((v: any) => 
        (v.ownerName === user.fullName || v.ownerName === user.username || v.violation?.ownerId === user.id)
      );
      if (ownerViolations.length > 0) {
        const latestOwnerViol = ownerViolations[ownerViolations.length - 1];
        list.push({
          id: `owner-viol-${latestOwnerViol.violation?.id || latestOwnerViol.id}`,
          icon: "⚠️",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          title: lang === "vi" ? "Cảnh báo vi phạm của Ngựa" : "Horse Violation Warning",
          desc: lang === "vi"
            ? `Ngựa ${latestOwnerViol.horseName || "của bạn"} bị báo cáo lỗi: ${latestOwnerViol.violation?.description || "Vi phạm luật chạy"}`
            : `Your horse ${latestOwnerViol.horseName || ""} was reported for: ${latestOwnerViol.violation?.description || "Rule violation"}`,
          time: "Alert"
        });
      }

      // - General upcoming meeting notification
      const now = new Date();
      const upcomingMeeting = meetings
        .filter(m => {
          const mDate = parseSafeDate(m.startDate);
          return mDate && mDate > now;
        })
        .sort((a, b) => {
          const da = parseSafeDate(a.startDate)?.getTime() || 0;
          const db = parseSafeDate(b.startDate)?.getTime() || 0;
          return da - db;
        })[0];
      if (upcomingMeeting) {
        list.push({
          id: `owner-meeting-${upcomingMeeting.id}`,
          icon: "📅",
          color: "#60a5fa",
          bg: "rgba(96,165,250,0.1)",
          title: lang === "vi" ? "Sự kiện sắp khởi tranh" : "Upcoming Race Meeting",
          desc: lang === "vi"
            ? `Đăng ký ngựa của bạn cho sự kiện ${upcomingMeeting.name} tại ${upcomingMeeting.venue}.`
            : `Register your horses for ${upcomingMeeting.name} at ${upcomingMeeting.venue}.`,
          time: formatDate(upcomingMeeting.startDate)
        });
      }
    } else if (user.roleId === 3) {
      // 4. JOCKEY: Violation where this jockey is involved
      const jockeyViolations = violations.filter((v: any) => 
        (v.jockeyName === user.fullName || v.jockeyName === user.username || v.violation?.jockeyId === user.id)
      );
      if (jockeyViolations.length > 0) {
        const latestJockeyViol = jockeyViolations[jockeyViolations.length - 1];
        list.push({
          id: `jockey-viol-${latestJockeyViol.violation?.id || latestJockeyViol.id}`,
          icon: "⚠️",
          color: "#ef4444",
          bg: "rgba(239,68,68,0.1)",
          title: lang === "vi" ? "Bạn có báo cáo vi phạm" : "Violation Warning",
          desc: lang === "vi"
            ? `Bạn bị báo cáo vi phạm: ${latestJockeyViol.violation?.description || "Vi phạm luật thi đấu"}`
            : `You have been reported for: ${latestJockeyViol.violation?.description || "Rule violation"}`,
          time: "Alert"
        });
      }

      // - General upcoming race alert for jockey
      const now = new Date();
      const upcomingMeeting = meetings
        .filter(m => {
          const mDate = parseSafeDate(m.startDate);
          return mDate && mDate > now;
        })
        .sort((a, b) => {
          const da = parseSafeDate(a.startDate)?.getTime() || 0;
          const db = parseSafeDate(b.startDate)?.getTime() || 0;
          return da - db;
        })[0];
      if (upcomingMeeting) {
        list.push({
          id: `jockey-meeting-${upcomingMeeting.id}`,
          icon: "🏃‍♂️",
          color: "#60a5fa",
          bg: "rgba(96,165,250,0.1)",
          title: lang === "vi" ? "Sự kiện sắp khởi tranh" : "Upcoming Race Meeting",
          desc: lang === "vi"
            ? `Buổi đua ${upcomingMeeting.name} sắp diễn ra. Hãy kiểm tra các lượt đăng ký cưỡi ngựa.`
            : `Meeting ${upcomingMeeting.name} starts soon. Check available rides.`,
          time: formatDate(upcomingMeeting.startDate)
        });
      }
    } else if (user.roleId === 4) {
      // 5. REFEREE: Races assigned to this referee that are upcoming
      const assignedRaces = races.filter(r => 
        (r.refereeId === user.id || r.assignedReferee === user.username || r.assignedReferee === user.fullName) &&
        r.status === "SCHEDULED"
      );
      if (assignedRaces.length > 0) {
        list.push({
          id: `referee-races-assigned`,
          icon: "🏁",
          color: "#38bdf8",
          bg: "rgba(56,189,248,0.1)",
          title: lang === "vi" ? "Lượt đua được phân công" : "Assigned Races Today",
          desc: lang === "vi"
            ? `Bạn được phân công làm trọng tài cho ${assignedRaces.length} lượt đua sắp tới.`
            : `You are assigned as referee for ${assignedRaces.length} upcoming races.`,
          time: "Referee Assignment"
        });
      }
    }

    return list.filter(n => !clearedNotifications.includes(n.id));
  };

  // Fetch initial background data
  const fetchData = async () => {
    try {
      const [seasonsData, meetingsData, usersData, horsesData, violationsData, racesData] = await Promise.all([
        api.get<any[]>("/races/seasons").catch(() => []),
        api.get<any[]>("/public/meetings").catch(() => []),
        api.get<any[]>("/public/users").catch(() => []),
        api.get<any[]>("/public/horses").catch(() => []),
        api.get<any[]>("/public/violations").catch(() => []),
        api.get<any[]>("/public/races").catch(() => []),
      ]);
      setSeasons(seasonsData);
      setMeetings(meetingsData);
      setUsers(usersData);
      setHorses(horsesData);
      setViolations(violationsData);
      setRaces(racesData);
      if (meetingsData.length > 0) {
        setSelectedMeetingId(meetingsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load landing data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch races when selected meeting changes
  useEffect(() => {
    if (selectedMeetingId) {
      api.get<any[]>(`/public/races?meetingId=${selectedMeetingId}`)
        .then(data => {
          setMeetingRaces(data);
          if (data.length > 0) {
            setSelectedRaceId(data[0].id);
          } else {
            setSelectedRaceId(null);
            setSelectedRaceEntries([]);
          }
        })
        .catch(() => {});
    }
  }, [selectedMeetingId]);

  // Fetch entries when selected race changes
  useEffect(() => {
    if (selectedRaceId) {
      api.get<any[]>(`/public/results?raceId=${selectedRaceId}`)
        .then(setSelectedRaceEntries)
        .catch(() => {});
    }
  }, [selectedRaceId]);

  // Poll live races when live view is selected
  useEffect(() => {
    if (view === "live") {
      api.get<any[]>("/races/live")
        .then(setLiveRaces)
        .catch(() => {});
    }
  }, [view]);

  const getRoleLabel = (roleId: number) => {
    const map: Record<number, string> = { 1: "ADMIN", 2: "OWNER", 3: "JOCKEY", 4: "SPECTATOR", 5: "REFEREE" };
    return map[roleId] || "MEMBER";
  };

  const getRoleColor = (roleId?: number) => {
    const map: Record<number, string> = { 1: "#c0392b", 2: "#2980b9", 3: "#27ae60", 4: "#8e44ad", 5: "#d35400" };
    return map[roleId ?? 0] || "#c9a227";
  };

  const handleDashboard = () => {
    if (!user) return;
    if (user.roleId === 1) navigate("/dashboard/admin");
    else if (user.roleId === 2) navigate("/dashboard/owner");
    else if (user.roleId === 3) navigate("/dashboard/jockey");
    else if (user.roleId === 5) navigate("/dashboard/referee");
    else navigate("/dashboard/spectator");
  };

  const handleLiveBtnClick = () => {
    navigate("/livestream");
  };

  const SUB_NAV: { key: SubView; label: string; icon: string }[] = [
    { key: "live", label: t.live, icon: "📺" },
    { key: "home", label: lang === "vi" ? "Đua ngựa" : "Racing", icon: "🏇" },
    { key: "racecard", label: t.racecard, icon: "ℹ️" },
    { key: "results", label: t.results, icon: "🏆" },
    { key: "fixtures", label: t.fixtures, icon: "📅" },
    { key: "statistics", label: t.statistics, icon: "📊" },
    { key: "horses", label: t.horses, icon: "🐎" },
    { key: "jockeys_owners", label: t.jockeys_owners, icon: "👤" },
    { key: "incident", label: t.incident, icon: "⚠️" },
    { key: "about", label: t.about, icon: "ℹ️" },
  ];

  // Helper date formatter for Landing views
  const formatLandingDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(" ", "T"));
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}-${minutes}-${seconds}`;
    } catch {
      return dateStr;
    }
  };

  const renderSubView = () => {
    switch (view) {
      case "home":
        return <HomeView seasons={seasons.filter(s => s.status === "ACTIVE")} meetings={meetings} t={t} />;
      case "live":
        return (
          <div>
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "1rem" }}>{t.live}</h2>
            {liveRaces.length === 0 ? (
              <div style={{ padding: "4rem 2rem", border: "1px solid #2a2825", borderRadius: "0.75rem", background: "rgba(255,255,255,0.01)", textAlign: "center" }}>
                <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "14px" }}>No live broadcast currently. There are no races running right now.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {liveRaces.map((r, i) => {
                  const embedUrl = r.youtubeLiveUrl ? getYouTubeEmbedUrl(r.youtubeLiveUrl) : "";
                  return (
                    <div key={i} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(201,162,39,0.2)", padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <h4 style={{ fontWeight: 700, color: "#f0f0f0" }}>{r.classLevel} - Race #{r.id}</h4>
                        <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }}></span>LIVE
                        </span>
                      </div>
                      {embedUrl ? (
                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "0.5rem", border: "1px solid #2a2825" }}>
                          {r.youtubeLiveUrl && (
                            r.youtubeLiveUrl.toLowerCase().endsWith(".mp4") ||
                            r.youtubeLiveUrl.toLowerCase().endsWith(".webm") ||
                            r.youtubeLiveUrl.toLowerCase().endsWith(".ogg") ||
                            r.youtubeLiveUrl.toLowerCase().endsWith(".m3u8") ||
                            r.youtubeLiveUrl.toLowerCase().includes("/stream") ||
                            r.youtubeLiveUrl.toLowerCase().includes(".mp4?")
                          ) ? (
                            <video
                              src={r.youtubeLiveUrl}
                              controls
                              autoPlay
                              muted
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                            />
                          ) : (
                            <iframe src={embedUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen></iframe>
                          )}
                        </div>
                      ) : (
                        <div style={{ height: 260, background: "#111", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2a2825" }}>
                          <p style={{ color: "#a0a0a0", fontSize: "12px", fontFamily: "monospace" }}>Video broadcast stream not linked yet.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case "racecard":
        return (
          <div>
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "1rem" }}>{t.racecard}</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h5 style={{ fontFamily: "monospace", fontSize: "11px", color: "#c9a227", textTransform: "uppercase" }}>Select Meeting</h5>
                {isMobile ? (
                  <select
                    value={selectedMeetingId || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedMeetingId(val ? parseInt(val) : null);
                      setSelectedRaceId(null);
                      setSelectedRaceEntries([]);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid #2a2825",
                      borderRadius: "0.5rem",
                      color: "#f0f0f0",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="" style={{ background: "#12141a", color: "#fff" }}>-- Choose Meeting --</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id} style={{ background: "#12141a", color: "#fff" }}>
                        {m.name} ({m.venue})
                      </option>
                    ))}
                  </select>
                ) : (
                  meetings.map(m => (
                    <button key={m.id} onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} style={{ width: "100%", padding: "0.75rem", background: selectedMeetingId === m.id ? "rgba(201,162,39,0.1)" : "rgba(255,255,255,0.02)", border: selectedMeetingId === m.id ? "1px solid #c9a227" : "1px solid #2a2825", borderRadius: "0.5rem", color: "#f0f0f0", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}>
                      <strong>{m.name}</strong>
                      <p style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "2px" }}>📍 {m.venue}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {meetingRaces.map(r => (
                        <button key={r.id} onClick={() => setSelectedRaceId(r.id)} style={{ padding: "0.5rem 1rem", background: selectedRaceId === r.id ? "#c9a227" : "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.375rem", color: selectedRaceId === r.id ? "#0e0c09" : "#f0f0f0", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                          R-{r.id} ({r.classLevel})
                        </button>
                      ))}
                      {meetingRaces.length === 0 && <p style={{ color: "#a0a0a0", fontSize: "13px" }}>No races scheduled for this meeting.</p>}
                    </div>
                    {selectedRaceId && (
                      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.015)", borderColor: "#2a2825", padding: "1.25rem" }}>
                        <h4 style={{ fontWeight: 700, color: "#f0f0f0", marginBottom: "1rem" }}>Gate Entries</h4>
                        {isMobile ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {selectedRaceEntries.map((e, idx) => (
                              <div key={idx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.75rem", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(201,162,39,0.15)", border: "1px solid #c9a227", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: "bold", color: "#c9a227", fontSize: "13px", flexShrink: 0 }}>
                                    {e.entry?.gateNumber || idx + 1}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: "bold", color: "#f0f0f0", fontSize: "14px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{e.horse?.name}</div>
                                    <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                      J: {e.jockey?.fullName || e.jockey?.username} | O: {e.owner?.fullName || e.owner?.username}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0, fontSize: "12px", fontFamily: "monospace", color: "#f0f0f0" }}>
                                  <div>Rating: {e.horse?.currentRating}</div>
                                  <div style={{ color: "#a0a0a0", marginTop: "2px" }}>{e.entry?.carriedWeight} kg</div>
                                </div>
                              </div>
                            ))}
                            {selectedRaceEntries.length === 0 && (
                              <p style={{ textAlign: "center", color: "#a0a0a0", padding: "1rem" }}>No horses registered for this race card yet.</p>
                            )}
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid #2a2825", color: "#c9a227", textAlign: "left" }}>
                                  <th style={{ padding: "0.5rem" }}>Gate</th>
                                  <th style={{ padding: "0.5rem" }}>Horse</th>
                                  <th style={{ padding: "0.5rem" }}>Jockey</th>
                                  <th style={{ padding: "0.5rem" }}>Owner</th>
                                  <th style={{ padding: "0.5rem" }}>Rating</th>
                                  <th style={{ padding: "0.5rem" }}>Weight</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedRaceEntries.map((e, idx) => (
                                  <tr key={idx} style={{ borderBottom: "1px solid rgba(42,40,37,0.3)" }}>
                                    <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>#{e.entry?.gateNumber || idx + 1}</td>
                                    <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{e.horse?.name}</td>
                                    <td style={{ padding: "0.5rem" }}>{e.jockey?.fullName || e.jockey?.username}</td>
                                    <td style={{ padding: "0.5rem" }}>{e.owner?.fullName || e.owner?.username}</td>
                                    <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{e.horse?.currentRating}</td>
                                    <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{e.entry?.carriedWeight} kg</td>
                                  </tr>
                                ))}
                                {selectedRaceEntries.length === 0 && (
                                  <tr><td colSpan={6} style={{ padding: "1rem", textAlign: "center", color: "#a0a0a0" }}>No horses registered for this race card yet.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#a0a0a0", fontSize: "14px", fontStyle: "italic" }}>Please select a race meeting from the sidebar.</p>
                )}
              </div>
            </div>
          </div>
        );
      case "results":
        return (
          <div>
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0", marginBottom: "1rem" }}>{t.results}</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h5 style={{ fontFamily: "monospace", fontSize: "11px", color: "#c9a227", textTransform: "uppercase" }}>Select Meeting</h5>
                {isMobile ? (
                  <select
                    value={selectedMeetingId || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedMeetingId(val ? parseInt(val) : null);
                      setSelectedRaceId(null);
                      setSelectedRaceEntries([]);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid #2a2825",
                      borderRadius: "0.5rem",
                      color: "#f0f0f0",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="" style={{ background: "#12141a", color: "#fff" }}>-- Choose Meeting --</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id} style={{ background: "#12141a", color: "#fff" }}>
                        {m.name} ({m.venue})
                      </option>
                    ))}
                  </select>
                ) : (
                  meetings.map(m => (
                    <button key={m.id} onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} style={{ width: "100%", padding: "0.75rem", background: selectedMeetingId === m.id ? "rgba(201,162,39,0.1)" : "rgba(255,255,255,0.02)", border: selectedMeetingId === m.id ? "1px solid #c9a227" : "1px solid #2a2825", borderRadius: "0.5rem", color: "#f0f0f0", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}>
                      <strong>{m.name}</strong>
                      <p style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "2px" }}>📍 {m.venue}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").map(r => (
                        <button key={r.id} onClick={() => setSelectedRaceId(r.id)} style={{ padding: "0.5rem 1rem", background: selectedRaceId === r.id ? "#c9a227" : "rgba(255,255,255,0.02)", border: "1px solid #2a2825", borderRadius: "0.375rem", color: selectedRaceId === r.id ? "#0e0c09" : "#f0f0f0", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                          R-{r.id} ({r.classLevel})
                        </button>
                      ))}
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").length === 0 && <p style={{ color: "#a0a0a0", fontSize: "13px" }}>No official finished results for this meeting yet.</p>}
                    </div>
                    {selectedRaceId && (
                      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.015)", borderColor: "#2a2825", padding: "1.25rem" }}>
                        <h4 style={{ fontWeight: 700, color: "#f0f0f0", marginBottom: "1rem" }}>Leaderboard / Final Standings</h4>
                        {isMobile ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {selectedRaceEntries.map((e, idx) => {
                              const isWinner = e.entry?.finalPosition === 1;
                              return (
                                <div key={idx} style={{ background: isWinner ? "rgba(201,162,39,0.05)" : "rgba(255,255,255,0.02)", border: isWinner ? "1px solid rgba(201,162,39,0.3)" : "1px solid #2a2825", borderRadius: "0.75rem", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                                      {e.entry?.finalPosition === 1
                                        ? "🥇"
                                        : e.entry?.finalPosition === 2
                                          ? "🥈"
                                          : e.entry?.finalPosition === 3
                                            ? "🥉"
                                            : (e.entry?.status === "DISQUALIFIED" || e.entry?.finishTime === "DQ" || !e.entry?.finalPosition)
                                              ? "DQ"
                                              : `${e.entry?.finalPosition}`}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: "bold", color: "#f0f0f0", fontSize: "14px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{e.horse?.name}</div>
                                      <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                        J: {e.jockey?.fullName || e.jockey?.username} | O: {e.owner?.fullName || e.owner?.username}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ textAlign: "right", flexShrink: 0, fontSize: "12px", fontFamily: "monospace" }}>
                                    <div style={{ color: "#f0f0f0", fontWeight: "bold" }}>{e.entry?.finishTime || "--:--"}</div>
                                    <div style={{ color: "#4a9d6f", fontWeight: "bold", marginTop: "2px" }}>
                                      ${e.entry?.prizeMoney?.toLocaleString() || "0"}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {selectedRaceEntries.length === 0 && (
                              <p style={{ textAlign: "center", color: "#a0a0a0", padding: "1rem" }}>No entry logs available.</p>
                            )}
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid #2a2825", color: "#c9a227", textAlign: "left" }}>
                                  <th style={{ padding: "0.5rem" }}>Pos</th>
                                  <th style={{ padding: "0.5rem" }}>Horse</th>
                                  <th style={{ padding: "0.5rem" }}>Jockey</th>
                                  <th style={{ padding: "0.5rem" }}>Owner</th>
                                  <th style={{ padding: "0.5rem" }}>Finish Time</th>
                                  <th style={{ padding: "0.5rem" }}>Prize Money</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedRaceEntries.map((e, idx) => (
                                  <tr key={idx} style={{ borderBottom: "1px solid rgba(42,40,37,0.3)", background: e.entry?.finalPosition === 1 ? "rgba(201,162,39,0.05)" : "transparent" }}>
                                    <td style={{ padding: "0.5rem", fontWeight: "bold" }}>
                                      {e.entry?.finalPosition === 1
                                        ? "🥇 1st"
                                        : e.entry?.finalPosition === 2
                                          ? "🥈 2nd"
                                          : e.entry?.finalPosition === 3
                                            ? "🥉 3rd"
                                            : (e.entry?.status === "DISQUALIFIED" || e.entry?.finishTime === "DQ" || !e.entry?.finalPosition)
                                              ? "DQ"
                                              : `${e.entry?.finalPosition}th`}
                                    </td>
                                    <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{e.horse?.name}</td>
                                    <td style={{ padding: "0.5rem" }}>{e.jockey?.fullName || e.jockey?.username}</td>
                                    <td style={{ padding: "0.5rem" }}>{e.owner?.fullName || e.owner?.username}</td>
                                    <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{e.entry?.finishTime || "--:--"}</td>
                                    <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "#4a9d6f", fontWeight: "bold" }}>${e.entry?.prizeMoney?.toLocaleString() || "0"}</td>
                                  </tr>
                                ))}
                                {selectedRaceEntries.length === 0 && (
                                  <tr><td colSpan={6} style={{ padding: "1rem", textAlign: "center", color: "#a0a0a0" }}>No entry logs available.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#a0a0a0", fontSize: "14px", fontStyle: "italic" }}>Please select a race meeting from the sidebar.</p>
                )}
              </div>
            </div>
          </div>
        );
      case "fixtures":
        return (
          <GenericTableView 
            title="Race Fixtures / Meetings" 
            data={meetings.map(m => ({
              ...m,
              startDate: formatDate(m.startDate)
            }))} 
            columns={[{ key: "id", label: "ID" }, { key: "name", label: "Meeting" }, { key: "venue", label: "Venue" }, { key: "startDate", label: "Start Date" }]} 
          />
        );
      case "statistics":
        return (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
            <GenericTableView title="Leading Horses (Top Rating)" data={[...horses].sort((a,b) => (b.currentRating - a.currentRating)).slice(0, 10)} columns={[{ key: "name", label: "Horse Name" }, { key: "breed", label: "Breed" }, { key: "currentRating", label: "Rating" }]} />
            <GenericTableView 
              title="Leading Jockeys" 
              data={[...users]
                .filter(u => u.roleId === 3)
                .map(u => {
                  const races = u.totalRacesParticipated || 0;
                  const top3 = u.totalTop3Finishes || 0;
                  const rate = races > 0 ? `${Math.round((top3 / races) * 100)}%` : "0%";
                  return {
                    ...u,
                    racesRun: races,
                    top3Finishes: top3,
                    top3Rate: rate
                  };
                })
                .sort((a, b) => b.top3Finishes - a.top3Finishes || b.racesRun - a.racesRun)
                .slice(0, 10)} 
              columns={[
                { key: "fullName", label: "Jockey Name" },
                { key: "racesRun", label: "Races Run" },
                { key: "top3Finishes", label: "Top-3 Finishes" },
                { key: "top3Rate", label: "Top-3 Rate" }
              ]} 
            />
          </div>
        );
      case "horses":
        return <GenericTableView title="Registered Horse Registry" data={horses} columns={[{ key: "id", label: "ID" }, { key: "name", label: "Horse Name" }, { key: "breed", label: "Breed" }, { key: "currentRating", label: "Current Rating" }]} />;
      case "jockeys_owners":
        return (
          <div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button onClick={() => setView("jockeys_owners")} style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0e0c09", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontWeight: "bold" }}>Directories Overview</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
              <GenericTableView 
                title="Jockeys" 
                data={users
                  .filter(u => u.roleId === 3)
                  .map(u => {
                    const races = u.totalRacesParticipated || 0;
                    const top3 = u.totalTop3Finishes || 0;
                    const rate = races > 0 ? `${Math.round((top3 / races) * 100)}%` : "0%";
                    return {
                      ...u,
                      racesRun: races,
                      top3Finishes: top3,
                      top3Rate: rate,
                      jockeyWeight: u.weight ? `${u.weight} kg` : "—"
                    };
                  })
                  .sort((a, b) => b.top3Finishes - a.top3Finishes || b.racesRun - a.racesRun)} 
                columns={[
                  { key: "id", label: "ID" },
                  { key: "fullName", label: "Jockey" },
                  { key: "email", label: "Email" },
                  { key: "jockeyWeight", label: "Weight" },
                  { key: "racesRun", label: "Races Run" },
                  { key: "top3Finishes", label: "Top-3 Finishes" },
                  { key: "top3Rate", label: "Top-3 Rate" }
                ]} 
              />
              <GenericTableView title="Horse Owners" data={users.filter(u => u.roleId === 2)} columns={[{ key: "id", label: "ID" }, { key: "fullName", label: "Owner" }, { key: "email", label: "Email" }]} />
            </div>
          </div>
        );
      case "incident":
        return (
          <GenericTableView 
            title="Violation Incident Reports" 
            data={violations.map((v: any) => ({
              id: v.violation?.id,
              raceId: v.violation?.raceId,
              horseName: v.horseName || `Horse #${v.violation?.horseId}`,
              jockeyName: v.jockeyName || `Jockey #${v.violation?.jockeyId}`,
              description: v.violation?.description || "—",
              penalty: v.violation?.penalty || "Pending Decision",
              status: v.violation?.status || "PENDING"
            }))} 
            columns={[
              { key: "id", label: "Report ID" },
              { key: "raceId", label: "Race ID" },
              { key: "horseName", label: "Horse" },
              { key: "jockeyName", label: "Jockey" },
              { key: "description", label: "Description" },
              { key: "penalty", label: "Penalty" },
              { key: "status", label: "Status" }
            ]} 
          />
        );
      case "search": {
        const q = searchQuery.toLowerCase().trim();
        const matchedHorses = horses.filter(h =>
          (h.name || "").toLowerCase().includes(q) ||
          (h.breed || "").toLowerCase().includes(q)
        );
        const matchedPeople = users.filter(u =>
          (u.roleId === 2 || u.roleId === 3 || u.roleId === 5) && (
            (u.username || "").toLowerCase().includes(q) ||
            (u.email || "").toLowerCase().includes(q)
          )
        );
        const matchedMeetings = meetings.filter(m =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.venue || "").toLowerCase().includes(q)
        );
        const matchedRaces = races.filter(r =>
          (r.classLevel || "").toLowerCase().includes(q) ||
          (r.trackType || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
        );
        return (
          <SearchView
            query={searchQuery}
            horses={matchedHorses}
            people={matchedPeople}
            meetings={matchedMeetings}
            races={matchedRaces}
            t={t}
            setView={setView}
            lang={lang}
          />
        );
      }
      case "about":
        return <AboutView />;
      default:
        return <HomeView seasons={seasons.filter(s => s.status === "ACTIVE")} meetings={meetings} t={t} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0907", color: "#f0f0f0", fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>

      {/* ── TOP TICKER BAR ─────────────────────── */}
      <div style={{ background: "#0a0907", borderBottom: "1px solid #2a2825" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "2rem", display: "flex", alignItems: "center", fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0" }}>
          <span>Welcome to HorseRace · Royal Ascot meeting in progress</span>
        </div>
      </div>

      {/* ── HEADER ─────────────────────────────── */}
      <header style={{ background: "#151310", position: "relative", zIndex: 50 }}>
        <div style={{ 
          maxWidth: "80rem", 
          margin: "0 auto", 
          padding: "0 1rem", 
          height: isMobile ? "auto" : "4rem", 
          paddingTop: isMobile ? "0.75rem" : "0",
          paddingBottom: isMobile ? "0.75rem" : "0",
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center", 
          justifyContent: "space-between", 
          gap: isMobile ? "0.75rem" : "1.5rem" 
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: isMobile ? "100%" : "auto" }}>
            {/* Logo */}
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: "0.25rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              </div>
              <div>
                <p style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1rem", color: "#f0f0f0", lineHeight: 1.2 }}>HorseRace</p>
                {!isMobile && <p style={{ fontSize: "0.6rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</p>}
              </div>
            </a>

            {/* If mobile, we put right controls next to logo to save space */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Language Switcher */}
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowLangMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontFamily: "monospace", fontSize: "0.7rem" }}>
                    🌐 {langLabel} ▾
                  </button>
                  {showLangMenu && (
                    <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.25rem", width: "7rem", background: "#151310", border: "1px solid #2a2825", borderRadius: "0.375rem", zIndex: 9999 }}>
                      {[["en","EN","English"],["vi","VI","Tiếng Việt"],["zh","ZH","简体中文"],["ja","JA","日本語"]].map(([code, label, name]) => (
                        <button key={code} onClick={() => { setLang(code); setShowLangMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.375rem 0.75rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.65rem", fontFamily: "monospace" }}>{name}</button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ flex: isMobile ? "none" : 1, width: "100%", maxWidth: isMobile ? "100%" : "28rem", position: "relative" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a0a0a0" strokeWidth="2" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              value={searchQuery}
              onChange={e => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim()) {
                  setView("search");
                } else {
                  setView("home");
                }
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setView("search");
                }
              }}
              placeholder={t.searchPlaceholder}
              style={{ width: "100%", paddingLeft: "2.25rem", paddingRight: "1.75rem", paddingTop: "0.375rem", paddingBottom: "0.375rem", fontSize: "0.75rem", background: "rgba(21,19,16,0.8)", borderRadius: "0.375rem", color: "#f0f0f0", border: "1px solid rgba(255,255,255,0.08)", outline: "none" }}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setView("home"); }}
                style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "10px" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls (Desktop Only) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0" }}>
              {/* Language */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontFamily: "monospace", fontSize: "0.7rem" }}>
                  🌐 {langLabel} ▾
                </button>
                {showLangMenu && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.25rem", width: "7rem", background: "#151310", border: "1px solid #2a2825", borderRadius: "0.375rem", zIndex: 50 }}>
                    {[["en","EN","English"],["vi","VI","Tiếng Việt"],["zh","ZH","简体中文"],["ja","JA","日本語"]].map(([code, label, name]) => (
                      <button key={code} onClick={() => { setLang(code); setShowLangMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.375rem 0.75rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.65rem", fontFamily: "monospace" }}>{name}</button>
                    ))}
                  </div>
                )}
              </div>



              {/* Auth Controls */}
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "0.75rem", borderLeft: "1px solid #2a2825" }}>
                  {/* Avatar circle with role-color ring */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: `2px solid ${getRoleColor(user.roleId)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700,
                    color: user.avatar ? undefined : "#fff",
                    background: user.avatar ? "transparent" : getRoleColor(user.roleId),
                    overflow: "hidden", flexShrink: 0
                  }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (user.fullName || user.username)?.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "#f0f0f0" }}>{user.fullName || user.username}</p>
                    <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: getRoleColor(user.roleId) }}>{getRoleLabel(user.roleId)}</p>
                  </div>
                  <button onClick={() => { logout(); }} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.65rem", paddingLeft: "0.75rem", borderLeft: "1px solid #2a2825" }}>{t.signout}</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "0.75rem", borderLeft: "1px solid #2a2825" }}>
                  <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", borderRadius: "0.25rem", background: "#c9a227", color: "#0e0c09", textDecoration: "none", fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    👤 {t.signin}
                  </Link>
                  <Link to="/register" style={{ padding: "0.375rem 0.75rem", borderRadius: "0.25rem", border: "1px solid rgba(201,162,39,0.5)", color: "#c9a227", textDecoration: "none", fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {t.register}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SUB NAV BAR */}
        <div style={{ background: "#0e0c09", borderBottom: "1px solid #2a2825", position: "relative" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1rem", height: "48px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            
            {/* Hamburger Dropdown Menu (Always Visible) */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setShowDashboardMenu(v => !v)}
                style={{
                  background: "rgba(201,162,39,0.05)",
                  border: "1px solid rgba(201,162,39,0.2)",
                  color: "#c9a227",
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "0.375rem",
                  transition: "all 0.2s"
                }}
                className="hover-scale"
              >
                ☰
              </button>
              
              {showDashboardMenu && (
                <>
                  {/* Backdrop to close click */}
                  <div 
                    style={{ position: "fixed", inset: 0, zIndex: 40 }}
                    onClick={() => setShowDashboardMenu(false)}
                  />
                  
                  {/* Dropdown Menu */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: "110%",
                    width: isMobile ? "12.5rem" : "10rem",
                    background: "#151310",
                    border: "1px solid #2a2825",
                    borderRadius: "0.5rem",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    zIndex: 50,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    padding: "0.25rem 0"
                  }}>
                    {isMobile && (
                      <>
                        <div style={{ padding: "0.5rem 1rem", fontSize: "0.6rem", fontFamily: "monospace", color: "#c9a227", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "0.25rem" }}>
                          Navigation
                        </div>
                        {SUB_NAV.map(n => {
                          const active = view === n.key;
                          return (
                            <button
                              key={n.key}
                              onClick={() => {
                                setView(n.key);
                                setShowDashboardMenu(false);
                              }}
                              style={{
                                background: active ? "rgba(201,162,39,0.08)" : "none",
                                border: "none",
                                padding: "0.6rem 1rem",
                                color: active ? "#c9a227" : "#f0f0f0",
                                textAlign: "left",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                transition: "background 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem"
                              }}
                            >
                              <span>{n.icon}</span> <span>{n.label}</span>
                            </button>
                          );
                        })}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "0.25rem 0", height: 1 }} />
                      </>
                    )}
                    {!isMobile && (user ? (
                      <>
                        <button
                          onClick={() => {
                            setShowDashboardMenu(false);
                            handleDashboard();
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0.75rem 1rem",
                            color: "#f0f0f0",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201,162,39,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          💼 {t.dashboard}
                        </button>
                        <button
                          onClick={() => {
                            setShowDashboardMenu(false);
                            const roleId = user.roleId;
                            if (roleId === 1) navigate("/dashboard/admin?tab=profile");
                            else if (roleId === 2) navigate("/dashboard/owner?tab=profile");
                            else if (roleId === 3) navigate("/dashboard/jockey?tab=profile");
                            else if (roleId === 5) navigate("/dashboard/referee?tab=profile");
                            else navigate("/dashboard/spectator?tab=profile");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0.75rem 1rem",
                            color: "#f0f0f0",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201,162,39,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          👤 {lang === "vi" ? "Hồ sơ" : lang === "zh" ? "个人中心" : lang === "ja" ? "プロフィール" : "Profile"}
                        </button>
                        <button
                          onClick={() => {
                            setShowDashboardMenu(false);
                            logout();
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0.75rem 1rem",
                            color: "#ef4444",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            borderTop: "1px solid rgba(255,255,255,0.05)"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          🚪 {t.signout}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setShowDashboardMenu(false)}
                          style={{
                            padding: "0.75rem 1rem",
                            color: "#c9a227",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(201,162,39,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          👤 {t.signin}
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setShowDashboardMenu(false)}
                          style={{
                            padding: "0.75rem 1rem",
                            color: "#a0a0a0",
                            textAlign: "left",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          📝 {t.register}
                        </Link>
                      </>
                    ))}
                  </div>
                </>
              )}
            </div>

            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flex: 1, justifyContent: "flex-end" }}>
                {user ? (
                  <>
                    <button
                      onClick={handleDashboard}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        color: "#f0f0f0",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0
                      }}
                    >
                      💼 {t.dashboard}
                    </button>
                    <button
                      onClick={() => {
                        const roleId = user.roleId;
                        if (roleId === 1) navigate("/dashboard/admin?tab=profile");
                        else if (roleId === 2) navigate("/dashboard/owner?tab=profile");
                        else if (roleId === 3) navigate("/dashboard/jockey?tab=profile");
                        else if (roleId === 5) navigate("/dashboard/referee?tab=profile");
                        else navigate("/dashboard/spectator?tab=profile");
                      }}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        color: "#f0f0f0",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0
                      }}
                    >
                      👤 {lang === "vi" ? "Hồ sơ" : lang === "zh" ? "个人中心" : lang === "ja" ? "プロフィール" : "Profile"}
                    </button>
                    <button
                      onClick={logout}
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        color: "#f87171",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0
                      }}
                    >
                      🚪 {t.signout}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      style={{
                        background: "rgba(201,162,39,0.15)",
                        border: "1px solid rgba(201,162,39,0.3)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        color: "#c9a227",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0
                      }}
                    >
                      👤 {t.signin}
                    </Link>
                    <Link
                      to="/register"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        color: "#a0a0a0",
                        fontSize: "10px",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        flexShrink: 0
                      }}
                    >
                      📝 {t.register}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Scrollable Nav Items */}
            {!isMobile && (
              <div className="scrollbar-hide" style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingRight: "0.5rem" }}>
                {SUB_NAV.map(n => {
                  const active = view === n.key;
                  return (
                    <button
                      key={n.key}
                      onClick={() => {
                        setView(n.key);
                      }}
                      className="hover-lift hover-scale"
                      style={{
                        padding: "0.35rem 0.65rem", borderRadius: "0.375rem", fontSize: "0.72rem", fontFamily: "monospace", cursor: "pointer",
                        border: active ? "1px solid rgba(201,162,39,0.4)" : "1px solid rgba(201,162,39,0.05)",
                        background: active ? "rgba(201,162,39,0.15)" : "rgba(21,19,16,0.4)",
                        color: active ? "#c9a227" : "#a0a0a0",
                        fontWeight: active ? 700 : 400,
                        transform: active ? "scale(1.02) translateY(-1px)" : "none",
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid #2a2825" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/anhngua1-1.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #0e0c09, rgba(14,12,9,0.8), transparent)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0e0c09, transparent, transparent)" }} />
        </div>
        <div style={{ position: "relative", maxWidth: "80rem", margin: "0 auto", padding: "3.5rem 1rem 5rem" }}>
          <div style={{ maxWidth: "50rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", padding: "0.25rem 0.625rem", borderRadius: "0.25rem", background: "rgba(201,162,39,0.13)", color: "#c9a227" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c0392b", display: "inline-block" }} />
              Meeting in progress
            </span>
            <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "clamp(1.75rem, 4vw, 3rem)", color: "#f0f0f0", marginTop: "1rem", lineHeight: 1.25 }}>
              Royal Ascot · Spring Gold Cup Day
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={handleLiveBtnClick} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontFamily: "monospace", background: "rgba(21,19,16,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(192,57,43,0.3)", color: "#ef4444", borderRadius: "0.375rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🔴 {t.watchLive}
              </button>
              <button onClick={() => setView("racecard")} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontFamily: "monospace", background: "rgba(21,19,16,0.6)", backdropFilter: "blur(8px)", border: "1px solid #2a2825", color: "#f0f0f0", borderRadius: "0.375rem", cursor: "pointer" }}>
                {t.viewRacecard}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ───────────────────── */}
      <section style={{ maxWidth: "80rem", margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>
        {renderSubView()}
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #2a2825", padding: "2rem 1rem", textAlign: "center" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: 28, height: 28, borderRadius: "0.25rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>🏆</div>
            <span style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f0f0f0" }}>HorseRace</span>
            <span style={{ color: "#a0a0a0", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Management System</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>© 2026 HorseRace Management System. All rights reserved.</p>
        </div>
      </footer>

      {/* ── NO LIVE TOAST ───────────────────────── */}
      {showNoLiveToast && (
        <div style={{ position: "fixed", top: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 99999 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(201,162,39,0.2)", background: "#1a1715", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <span style={{ fontSize: "1.25rem" }}>📺</span>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f4f2ec" }}>No Live Broadcast</p>
              <p style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0", marginTop: "0.25rem" }}>No races are currently taking place.</p>
            </div>
            <button onClick={() => setShowNoLiveToast(false)} style={{ marginLeft: "0.75rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}


      {/* ── CHATBOT ─────────────────────────────── */}
      <ChatBot lang={lang} setLang={setLang} />

    </div>

  );
}

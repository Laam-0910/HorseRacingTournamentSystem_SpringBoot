import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { parseSafeDate, formatDate } from "../../utils/dateTimeHelper";
import { parseMarkdownToHtml } from "../../utils/markdownParser";
import { $t } from '@/lib/i18n';


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
    startDate: "Ngày bắt đầu",
    endDate: "Ngày kết thúc",
    activeStatus: "Đang diễn ra",
    countdownTo: "Đếm ngược đến: ",
    days: "Ngày",
    hours: "Giờ",
    minutes: "Phút",
    seconds: "Giây",
    raceFixtures: "Lịch thi đấu",
    noFixtures: "Không có lịch thi đấu nào.",
    statsAndLeaderboards: "Thống kê & Bảng xếp hạng",
    leadingHorses: "Ngựa dẫn đầu (Top Rating)",
    leadingJockeys: "Nài ngựa dẫn đầu (Top 3)",
    ratingTitle: "Đánh giá",
    racesTitle: "Trận",
    noHorseData: "Không có dữ liệu ngựa.",
    noJockeyData: "Không có dữ liệu nài ngựa.",
    horseRegistry: "Danh sách Đăng ký Ngựa",
    directoriesOverview: "Tổng quan Danh bạ",
    jockeysTitle: "Danh sách Nài ngựa",
    horseOwnersTitle: "Danh sách Chủ ngựa",
    incidentReports: "Báo cáo Sự cố & Vi phạm",
    pendingDecision: "Đang chờ xử lý",
    idTitle: "Mã (ID)",
    horseNameTitle: "Tên Ngựa",
    breedTitle: "Giống loài",
    currentRatingTitle: "Đánh giá",
    jockeyTitle: "Nài ngựa",
    emailTitle: "Email",
    weightTitle: "Cân nặng",
    racesRunTitle: "Số trận tham gia",
    top3FinishesTitle: "Số lần Top 3",
    top3RateTitle: "Tỉ lệ Top 3",
    ownerTitle: "Chủ ngựa",
    reportIdTitle: "Mã Báo cáo",
    raceIdTitle: "Mã Trận đua",
    horseTitle: "Ngựa",
    descriptionTitle: "Mô tả sự cố",
    penaltyTitle: "Hình phạt",
    statusTitle: "Trạng thái",
    aboutTitle: "Giới thiệu Hệ thống",
    aboutSubtitle: "Nền tảng Quản lý Đua ngựa Toàn diện",
    ourMission: "Sứ mệnh của chúng tôi",
    missionDesc: "Hệ thống Quản lý Đua ngựa là một nền tảng toàn diện được thiết kế để hợp lý hóa và hiện đại hóa công tác quản lý giải đua ngựa. Từ khâu khởi tạo mùa giải đến khâu vận hành ngày đua, hệ thống của chúng tôi cung cấp cho các quản trị viên, chủ ngựa, nài ngựa và trọng tài những công cụ cần thiết để tổ chức các sự kiện đua ngựa công bằng, hấp dẫn và chuyên nghiệp.",
    feat1Title: "Quản lý Mùa giải",
    feat1Desc: "Toàn bộ vòng đời giải đấu từ thiết lập đến kết quả",
    feat2Title: "Hồ sơ Ngựa",
    feat2Desc: "Theo dõi ngựa, đánh giá rating và thành tích",
    feat3Title: "Quản lý Nài ngựa",
    feat3Desc: "Quản lý hồ sơ nài ngựa và lịch đăng ký",
    feat4Title: "Vận hành Ngày đua",
    feat4Desc: "Bảng đua, lịch trình, giám sát trực tiếp",
    feat5Title: "Thống kê",
    feat5Desc: "Tỷ lệ thắng, tiền thưởng, phân tích thành tích",
    feat6Title: "Báo cáo Sự cố",
    feat6Desc: "Theo dõi vi phạm luật và hình phạt",
    awardRecipients: "Danh sách nhận giải (Top 3)",
    jockeyLabel: "Kỵ sĩ",
    ownerLabel: "Chủ ngựa",
    achievement: "Thành tích",
    otherPositions: "Các thứ hạng khác",
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
    startDate: "Start Date",
    endDate: "End Date",
    activeStatus: "Active",
    countdownTo: "Countdown to: ",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",
    awardRecipients: "Award Recipients (Top 3)",
    jockeyLabel: "Jockey",
    ownerLabel: "Owner",
    achievement: "Result",
    otherPositions: "Other Positions",
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
    startDate: "开始日期",
    endDate: "结束日期",
    activeStatus: "进行中",
    countdownTo: "倒计时至：",
    days: "天",
    hours: "小时",
    minutes: "分钟",
    seconds: "秒",
    awardRecipients: "领奖名单 (前 3 名)",
    jockeyLabel: "骑师",
    ownerLabel: "马主",
    achievement: "成绩",
    otherPositions: "其他排名",
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
    startDate: "開始日",
    endDate: "終了日",
    activeStatus: "開催中",
    countdownTo: "カウントダウン: ",
    days: "日",
    hours: "時間",
    minutes: "分",
    seconds: "秒",
    awardRecipients: "受賞者リスト (トップ 3)",
    jockeyLabel: "騎手",
    ownerLabel: "馬主",
    achievement: "成績",
    otherPositions: "その他の順位",
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? { ...m, text: CHAT_LANG[lang] ? CHAT_LANG[lang].welcome : CHAT_LANG.vi.welcome } : m));
  }, [lang]);

  useEffect(() => { 
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

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
          <div ref={chatContainerRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#1a1a1a" }}>
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
            {$t("Kết quả tìm kiếm", (localStorage.getItem('app-lang') || 'vi'))}
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
function Countdown({ targetDate, t }: { targetDate: string; t: any }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate.replace(" ", "T")).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 md:gap-4 justify-center mt-6 mb-8 animate-fade-in">
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-white bg-black/60 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227]/40 backdrop-blur-md min-w-[3rem] md:min-w-[4rem]">{String(timeLeft.d).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{$t("Ngày", (localStorage.getItem('app-lang') || 'vi'))}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-white bg-black/60 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227]/40 backdrop-blur-md min-w-[3rem] md:min-w-[4rem]">{String(timeLeft.h).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{$t("Giờ", (localStorage.getItem('app-lang') || 'vi'))}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-white bg-black/60 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227]/40 backdrop-blur-md min-w-[3rem] md:min-w-[4rem]">{String(timeLeft.m).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{$t("Phút", (localStorage.getItem('app-lang') || 'vi'))}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-[#c9a227] bg-[#c9a227]/10 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227] backdrop-blur-md min-w-[3rem] md:min-w-[4rem] shadow-[0_0_15px_rgba(201,162,39,0.3)]">{String(timeLeft.s).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-[#c9a227] mt-2 uppercase tracking-widest font-bold">{$t("Giây", (localStorage.getItem('app-lang') || 'vi'))}</div>
      </div>
    </div>
  );
}

function HomeView({ seasons, meetings, t, onWatchLive, onViewRacecard }: { seasons: Season[]; meetings: Meeting[]; t: any; onWatchLive?: () => void; onViewRacecard?: () => void; }) {
  // Find the closest upcoming meeting
  const now = new Date().getTime();
  const upcomingMeetings = meetings
    .filter(m => new Date(m.startDate.replace(" ", "T")).getTime() > now)
    .sort((a, b) => new Date(a.startDate.replace(" ", "T")).getTime() - new Date(b.startDate.replace(" ", "T")).getTime());
  
  const nextMeeting = upcomingMeetings[0];

  return (
    <div className="w-full">
      {/* Spectacular Hero Section matching screenshot with Horse Image */}
      <div className="relative w-full rounded-[2rem] overflow-hidden mb-12 flex flex-col items-center justify-center text-center px-4 py-20 border border-[#1a1815]">
        
        {/* Background Image & Gradient */}
        <div className="absolute inset-0 bg-[url('/anhngua1-1.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c09] via-[#0e0c09]/90 to-[#0e0c09]/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0c09]/80 via-transparent to-[#0e0c09]/80"></div>

        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="inline-block px-6 py-2 mb-6 rounded-full bg-black/40 backdrop-blur-md border border-[#c9a227]/40 text-[#c9a227] text-[0.65rem] font-bold uppercase tracking-widest">
            {t.welcomeSub}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-[#c9a227] max-w-4xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]" style={{ fontFamily: "'Roboto Slab', serif" }}>
            {t.welcome}
          </h1>
          
          {nextMeeting && (
            <div className="mb-10 flex flex-col items-center">
              <div className="text-[#c9a227] text-sm font-bold tracking-widest uppercase mb-2">{t.countdownTo}{nextMeeting.name}</div>
              <Countdown targetDate={nextMeeting.startDate} t={t} />
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={onWatchLive} className="px-8 py-3 bg-[#c9a227] text-[#0e0c09] font-bold rounded-lg hover:bg-[#d6af35] transition-all uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(201,162,39,0.3)]">
              {t.watchLive}
            </button>
            <button onClick={onViewRacecard} className="px-8 py-3 bg-black/60 backdrop-blur-md border border-[#2a2825] text-white font-medium rounded-lg hover:border-[#c9a227]/50 hover:bg-black/80 transition-all text-sm shadow-lg shadow-black/50">
              {t.viewRacecard}
            </button>
          </div>
        </div>
      </div>

      {/* Active Seasons */}
      <div className="mb-14 animate-fade-in-up delay-300">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Mùa giải đang hoạt động", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
        </div>
        
        {seasons.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono italic p-8 glass-panel rounded-2xl text-center border-dashed border-[#2a2825]">{$t("Hiện chưa có mùa giải nào hoạt động.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seasons.map(s => {
              const formatSeasonDate = (rawStr: string) => {
                if (!rawStr) return "";
                const d = parseSafeDate(rawStr);
                if (!d || isNaN(d.getTime())) return rawStr;
                const pad = (n: number) => String(n).padStart(2, '0');
                return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
              };

              return (
                <div key={s.id} className="bg-[#181613] rounded-2xl p-7 hover:-translate-y-1 transition-transform border border-[#2a2825] hover:border-[#c9a227]/50 shadow-lg relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-bl from-[#c9a227] to-transparent opacity-10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <h4 className="font-bold text-2xl text-white group-hover:text-[#c9a227] transition-colors drop-shadow-md" style={{ fontFamily: "'Roboto Slab', serif" }}>{s.name}</h4>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]">{$t("Đang diễn ra", (localStorage.getItem('app-lang') || 'vi'))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300 font-mono relative z-10 bg-[#0e0c09]/50 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 mb-1">{$t("Ngày bắt đầu", (localStorage.getItem('app-lang') || 'vi'))}</span>
                      <span className="opacity-90 font-semibold">{formatSeasonDate(s.startDate)}</span>
                    </div>
                    <span className="text-[#c9a227]/50 font-sans px-2 text-xl">→</span>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-gray-500 mb-1">{$t("Ngày kết thúc", (localStorage.getItem('app-lang') || 'vi'))}</span>
                      <span className="opacity-90 font-semibold">{formatSeasonDate(s.endDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      <div className="mb-14 animate-fade-in-up delay-400">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Các Ngày hội đua sắp tới", (localStorage.getItem('app-lang') || 'vi'))}</h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
        </div>
        
        {meetings.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono italic p-8 glass-panel rounded-2xl text-center border-dashed border-[#2a2825]">{$t("Chưa lên lịch ngày hội đua nào.", (localStorage.getItem('app-lang') || 'vi'))}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div key={m.id} className="bg-[#181613] rounded-2xl p-7 hover:-translate-y-1 transition-transform border border-[#2a2825] hover:border-[#c9a227]/50 shadow-lg relative overflow-hidden group">
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-500 to-transparent opacity-10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
                  <h4 className="font-bold text-2xl text-white mb-6 group-hover:text-blue-400 transition-colors relative z-10 drop-shadow-md" style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</h4>
                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#0e0c09]/50 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-blue-400 text-lg">📍</span> 
                      <span className="truncate font-medium">{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#0e0c09]/50 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[#c9a227] text-lg">📅</span> 
                      <span className="font-medium">{date}</span>
                    </div>
                    {time && (
                      <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#0e0c09]/50 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-[#c9a227] text-lg">🕒</span> 
                        <span className="font-medium">{time}</span>
                      </div>
                    )}
                  </div>
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
    if (cKey === "status") {
      const s = String(val).toUpperCase();
      let colorClass = "text-gray-400";
      if (s === "ACTIVE" || s === "OFFICIAL") colorClass = "text-green-400";
      if (s === "PENDING") colorClass = "text-yellow-400";
      if (s === "REJECTED" || s === "DISQUALIFIED") colorClass = "text-red-400";
      return <span className={colorClass + " font-bold text-xs tracking-wider"}>{s}</span>;
    }
    return String(val);
  };

  if (isMobile) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-bold text-white tracking-wide uppercase drop-shadow-lg mb-6" style={{ fontFamily: "'Roboto Slab', serif" }}>{title}</h2>
        {data.length === 0 ? (
          <div className="py-12 text-center glass-panel rounded-2xl border-dashed border-[#2a2825]">
            <p className="text-gray-500 font-mono text-sm">No data available.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((row, i) => (
              <div key={i} className="glass-panel rounded-xl p-4 border border-[#2a2825] hover:border-[#c9a227]/30 transition-colors">
                {columns.map((c, colIdx) => {
                  const val = row[c.key];
                  if (colIdx === 0) {
                    return (
                      <div key={c.key} className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                        <span className="text-sm font-bold text-[#c9a227]">
                          {c.label}: <span className="text-white">{formatValue(c.key, val)}</span>
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={c.key} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-gray-400 font-mono text-xs">{c.label}</span>
                      <span className="font-semibold text-gray-200 text-right max-w-[60%] truncate">
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
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-white tracking-wide uppercase drop-shadow-lg mb-6" style={{ fontFamily: "'Roboto Slab', serif" }}>{title}</h2>
      {data.length === 0 ? (
        <div className="py-12 text-center glass-panel rounded-2xl border-dashed border-[#2a2825]">
          <p className="text-gray-500 font-mono text-sm">No data available.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-[#2a2825]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#1a1815]/80 border-b border-[#2a2825]">
                  {columns.map(c => (
                    <th key={c.key} className="py-4 px-6 text-xs font-mono text-[#c9a227] tracking-widest uppercase font-bold whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2825]/50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    {columns.map((c, colIdx) => (
                      <td key={c.key} className={`py-4 px-6 text-sm text-gray-300 ${colIdx === 0 ? 'font-bold text-white' : ''}`}>
                        {formatValue(c.key, row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AboutView({ t }: { t: any }) {
  return (
    <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase drop-shadow-lg mb-2" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Giới thiệu Hệ thống", (localStorage.getItem('app-lang') || 'vi')) || "About Horse Race System"}</h2>
      <p className="text-[#c9a227] font-mono text-xs uppercase tracking-widest mb-12">{$t("Nền tảng Quản lý Đua ngựa Toàn diện", (localStorage.getItem('app-lang') || 'vi')) || "The Complete Racing Management Platform"}</p>
      
      <div className="glass-panel rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#c9a227]/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold text-gold-gradient mb-6 relative z-10" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Sứ mệnh của chúng tôi", (localStorage.getItem('app-lang') || 'vi')) || "Our Mission"}</h3>
        <p className="text-gray-300 text-base md:text-lg leading-relaxed relative z-10 font-light max-w-2xl mx-auto">
          {$t("Hệ thống Quản lý Đua ngựa là một nền tảng toàn diện được thiết kế để hợp lý hóa và hiện đại hóa công tác quản lý giải đua ngựa. Từ khâu khởi tạo mùa giải đến khâu vận hành ngày đua, hệ thống của chúng tôi cung cấp cho các quản trị viên, chủ ngựa, nài ngựa và trọng tài những công cụ cần thiết để tổ chức các sự kiện đua ngựa công bằng, hấp dẫn và chuyên nghiệp.", (localStorage.getItem('app-lang') || 'vi')) || "The Horse Race Management System is a comprehensive platform designed to streamline and modernize horse racing tournament management. From season initialization to race-day operations, our system provides administrators, horse owners, jockeys, and referees with the tools they need to conduct fair, exciting, and well-organized race events."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "🏆", title: $t("Quản lý Mùa giải", (localStorage.getItem('app-lang') || 'vi')) || "Season Management", desc: $t("Toàn bộ vòng đời giải đấu từ thiết lập đến kết quả", (localStorage.getItem('app-lang') || 'vi')) || "Full tournament lifecycle from setup to results" },
          { icon: "🐎", title: $t("Hồ sơ Ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Horse Registry", desc: $t("Theo dõi ngựa, đánh giá rating và thành tích", (localStorage.getItem('app-lang') || 'vi')) || "Track horses, ratings, and performance" },
          { icon: "🏇", title: $t("Quản lý Nài ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Jockey Management", desc: $t("Quản lý hồ sơ nài ngựa và lịch đăng ký", (localStorage.getItem('app-lang') || 'vi')) || "Manage jockey profiles and invitations" },
          { icon: "📋", title: $t("Vận hành Ngày đua", (localStorage.getItem('app-lang') || 'vi')) || "Race Operations", desc: $t("Bảng đua, lịch trình, giám sát trực tiếp", (localStorage.getItem('app-lang') || 'vi')) || "Racecard, schedule, live supervision" },
          { icon: "📊", title: $t("Thống kê", (localStorage.getItem('app-lang') || 'vi')) || "Statistics", desc: $t("Tỷ lệ thắng, tiền thưởng, phân tích thành tích", (localStorage.getItem('app-lang') || 'vi')) || "Win rates, earnings, performance analytics" },
          { icon: "⚠️", title: $t("Báo cáo Sự cố", (localStorage.getItem('app-lang') || 'vi')) || "Incident Reports", desc: $t("Theo dõi vi phạm luật và hình phạt", (localStorage.getItem('app-lang') || 'vi')) || "Rule violation tracking and penalties" },
        ].map((item, i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 hover-lift hover-glow transition-all group border border-[#2a2825]" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
            <h4 className="font-bold text-white text-lg mb-2" style={{ fontFamily: "'Roboto Slab', serif" }}>{item.title}</h4>
            <p className="text-gray-400 text-sm font-light leading-relaxed">{item.desc}</p>
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
  const setLang = (code: string) => { setLangRaw(code); localStorage.setItem('app-lang', code); window.location.reload(); };
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
        title: $t("Mùa Giải Hoạt Động", (localStorage.getItem('app-lang') || 'vi')),
        desc: lang === "vi" 
          ? `Mùa giải ${activeSeason.name} đang diễn ra! Đăng ký tham gia ngay.`
          : `Season ${activeSeason.name} is currently active! Register now.`,
        time: $t("Đang diễn ra", (localStorage.getItem('app-lang') || 'vi'))
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
          title: $t("Sự kiện sắp khởi tranh", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Sự cố chờ quyết định", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Trận đua cần xử lý kết quả", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Cảnh báo vi phạm của Ngựa", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Sự kiện sắp khởi tranh", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Bạn có báo cáo vi phạm", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Sự kiện sắp khởi tranh", (localStorage.getItem('app-lang') || 'vi')),
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
          title: $t("Lượt đua được phân công", (localStorage.getItem('app-lang') || 'vi')),
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
    return $t(map[roleId] || "MEMBER", (localStorage.getItem('app-lang') || 'vi'));
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
    { key: "live", label: $t("Trực tiếp", (localStorage.getItem('app-lang') || 'vi')), icon: "📺" },
    { key: "home", label: $t("Đua ngựa", (localStorage.getItem('app-lang') || 'vi')), icon: "🏇" },
    { key: "racecard", label: $t("Bảng đua", (localStorage.getItem('app-lang') || 'vi')), icon: "ℹ️" },
    { key: "results", label: $t("Kết quả", (localStorage.getItem('app-lang') || 'vi')), icon: "🏆" },
    { key: "fixtures", label: $t("Lịch thi đấu", (localStorage.getItem('app-lang') || 'vi')), icon: "📅" },
    { key: "statistics", label: $t("Thống kê", (localStorage.getItem('app-lang') || 'vi')), icon: "📊" },
    { key: "horses", label: $t("Danh sách Ngựa", (localStorage.getItem('app-lang') || 'vi')), icon: "🐎" },
    { key: "jockeys_owners", label: $t("Nài & Chủ ngựa", (localStorage.getItem('app-lang') || 'vi')), icon: "👤" },
    { key: "incident", label: $t("Báo cáo sự cố", (localStorage.getItem('app-lang') || 'vi')), icon: "⚠️" },
    { key: "about", label: $t("Giới thiệu", (localStorage.getItem('app-lang') || 'vi')), icon: "ℹ️" },
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
        return <HomeView seasons={seasons.filter(s => s.status === "ACTIVE")} meetings={meetings} t={t} onWatchLive={handleLiveBtnClick} onViewRacecard={() => setView("racecard")} />;
      case "live":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Trực tiếp", (localStorage.getItem('app-lang') || 'vi'))}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500/60 to-transparent"></div>
            </div>
            
            {liveRaces.length === 0 ? (
              <div className="glass-panel rounded-2xl flex flex-col items-center justify-center min-h-[40vh] border-dashed border-[#2a2825]">
                <span className="text-5xl block mb-4 opacity-50 grayscale">📺</span>
                <p className="text-gray-400 font-mono text-sm max-w-sm text-center">{$t("No live broadcast currently. There are no races running right now.", (localStorage.getItem('app-lang') || 'vi'))}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {liveRaces.map((r, i) => {
                  const embedUrl = r.youtubeLiveUrl ? getYouTubeEmbedUrl(r.youtubeLiveUrl) : "";
                  return (
                    <div key={i} className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-[#2a2825] hover:border-red-500/50 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-5 rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between mb-6 relative z-10">
                        <h4 className="font-bold text-xl text-white" style={{ fontFamily: "'Roboto Slab', serif" }}>{r.classLevel} - Race #{r.id}</h4>
                        <span className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          LIVE
                        </span>
                      </div>
                      
                      {embedUrl ? (
                        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black">
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
                              className="absolute top-0 left-0 w-full h-full border-none"
                            />
                          ) : (
                            <iframe src={embedUrl} className="absolute top-0 left-0 w-full h-full border-none" allowFullScreen></iframe>
                          )}
                        </div>
                      ) : (
                        <div className="h-[300px] bg-[#1a1815]/80 rounded-xl flex flex-col items-center justify-center border border-[#2a2825] relative overflow-hidden">
                          <span className="text-4xl mb-4 opacity-30 animate-pulse">📡</span>
                          <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">{$t("Video stream not linked", (localStorage.getItem('app-lang') || 'vi'))}</p>
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
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Bảng đua", (localStorage.getItem('app-lang') || 'vi'))}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar: Meetings Selection */}
              <div className="flex flex-col gap-4">
                <h5 className="font-mono text-xs text-[#c9a227] uppercase tracking-widest pl-2 border-l-2 border-[#c9a227]">{$t("Select Meeting", (localStorage.getItem('app-lang') || 'vi'))}</h5>
                
                {isMobile ? (
                  <select
                    value={selectedMeetingId || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedMeetingId(val ? parseInt(val) : null);
                      setSelectedRaceId(null);
                      setSelectedRaceEntries([]);
                    }}
                    className="w-full p-4 bg-[#1a1815]/80 border border-[#2a2825] rounded-xl text-white outline-none focus:border-[#c9a227] transition-colors"
                  >
                    <option value="">-- Choose Meeting --</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.venue})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-3">
                    {meetings.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} 
                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedMeetingId === m.id ? 'glass-panel glowing-border !border-[#c9a227]/50 shadow-[0_0_15px_rgba(201,162,39,0.15)]' : 'bg-[#1a1815]/40 border border-[#2a2825] hover:bg-[#1a1815] hover:border-[#c9a227]/30 hover-lift'}`}
                      >
                        <strong className={`block text-[15px] ${selectedMeetingId === m.id ? 'text-gold-gradient' : 'text-gray-200'}`} style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</strong>
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-gray-500">
                          <span className="text-blue-400">📍</span> {m.venue}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Main Content: Races & Entries */}
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div className="animate-fade-in delay-100">
                    <div className="flex flex-wrap gap-3 mb-8">
                      {meetingRaces.map(r => (
                        <button 
                          key={r.id} 
                          onClick={() => setSelectedRaceId(r.id)} 
                          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover-lift ${selectedRaceId === r.id ? 'bg-gradient-to-r from-[#c9a227] to-[#e6c153] text-[#0e0c09] shadow-[0_0_15px_rgba(201,162,39,0.3)]' : 'glass-panel text-gray-300 hover:text-white hover:border-[#c9a227]/50'}`}
                        >
                          RACE {r.id} <span className="opacity-70 font-mono text-xs ml-1">({r.classLevel})</span>
                        </button>
                      ))}
                      {meetingRaces.length === 0 && <p className="text-gray-500 text-sm italic py-2">No races scheduled for this meeting.</p>}
                    </div>

                    {selectedRaceId && (
                      <div className="glass-panel rounded-2xl p-6 md:p-8 animate-fade-in-up delay-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#c9a227] to-transparent opacity-5 rounded-bl-full pointer-events-none"></div>
                        
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                          <span className="text-2xl">🐎</span>
                          <h4 className="font-bold text-xl text-white tracking-wide" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Runners & Riders", (localStorage.getItem('app-lang') || 'vi'))}</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                          {selectedRaceEntries.map((e, idx) => (
                            <div key={idx} className="bg-[#1a1815]/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 hover-lift hover-glow transition-all group">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1815] to-[#2a2825] border border-[#c9a227]/30 flex items-center justify-center font-mono font-bold text-[#c9a227] text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] flex-shrink-0 group-hover:scale-110 transition-transform">
                                {e.entry?.gateNumber || idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-base truncate group-hover:text-gold-gradient transition-colors" style={{ fontFamily: "'Roboto Slab', serif" }}>
                                  {e.horse?.name}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 truncate">
                                  <span className="text-gray-500">{$t("J:", (localStorage.getItem('app-lang') || 'vi'))}</span> <span className="text-gray-300">{e.jockey?.fullName || e.jockey?.username}</span>
                                  <span className="mx-2 opacity-30">|</span>
                                  <span className="text-gray-500">{$t("O:", (localStorage.getItem('app-lang') || 'vi'))}</span> <span className="text-gray-300">{e.owner?.fullName || e.owner?.username}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-mono">
                                  <span className="text-gray-500">{$t("RTG", (localStorage.getItem('app-lang') || 'vi'))} </span>
                                  <span className="text-blue-400 font-bold">{e.horse?.currentRating}</span>
                                </div>
                                <div className="text-xs font-mono mt-1 text-[#c9a227]">
                                  {e.entry?.carriedWeight} kg
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {selectedRaceEntries.length === 0 && (
                          <div className="py-12 text-center border border-dashed border-[#2a2825] rounded-xl mt-4 bg-[#1a1815]/30">
                            <span className="text-4xl mb-4 block opacity-50">🏇</span>
                            <p className="text-gray-500 font-mono text-sm">No horses registered for this race yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl flex items-center justify-center min-h-[40vh] border-dashed border-[#2a2825]">
                    <div className="text-center">
                      <span className="text-4xl block mb-4 opacity-30 animate-float">👆</span>
                      <p className="text-gray-500 text-sm font-mono italic">Please select a race meeting from the sidebar.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "results":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Kết quả", (localStorage.getItem('app-lang') || 'vi'))}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar: Meetings Selection */}
              <div className="flex flex-col gap-4">
                <h5 className="font-mono text-xs text-[#c9a227] uppercase tracking-widest pl-2 border-l-2 border-[#c9a227]">{$t("Select Meeting", (localStorage.getItem('app-lang') || 'vi'))}</h5>
                {isMobile ? (
                  <select
                    value={selectedMeetingId || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedMeetingId(val ? parseInt(val) : null);
                      setSelectedRaceId(null);
                      setSelectedRaceEntries([]);
                    }}
                    className="w-full p-4 bg-[#1a1815]/80 border border-[#2a2825] rounded-xl text-white outline-none focus:border-[#c9a227] transition-colors"
                  >
                    <option value="">-- Choose Meeting --</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.venue})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-3">
                    {meetings.map(m => (
                      <button 
                        key={m.id} 
                        onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} 
                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedMeetingId === m.id ? 'glass-panel glowing-border !border-[#c9a227]/50 shadow-[0_0_15px_rgba(201,162,39,0.15)]' : 'bg-[#1a1815]/40 border border-[#2a2825] hover:bg-[#1a1815] hover:border-[#c9a227]/30 hover-lift'}`}
                      >
                        <strong className={`block text-[15px] ${selectedMeetingId === m.id ? 'text-gold-gradient' : 'text-gray-200'}`} style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</strong>
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-gray-500">
                          <span className="text-blue-400">📍</span> {m.venue}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div className="animate-fade-in delay-100">
                    <div className="flex flex-wrap gap-3 mb-8">
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").map(r => (
                        <button 
                          key={r.id} 
                          onClick={() => setSelectedRaceId(r.id)} 
                          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover-lift ${selectedRaceId === r.id ? 'bg-gradient-to-r from-[#c9a227] to-[#e6c153] text-[#0e0c09] shadow-[0_0_15px_rgba(201,162,39,0.3)]' : 'glass-panel text-gray-300 hover:text-white hover:border-[#c9a227]/50'}`}
                        >
                          RACE {r.id} <span className="opacity-70 font-mono text-xs ml-1">({r.classLevel})</span>
                        </button>
                      ))}
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").length === 0 && <p className="text-gray-500 text-sm italic py-2">No official finished results for this meeting yet.</p>}
                    </div>
                    
                    {selectedRaceId && (
                      <div className="glass-panel rounded-2xl p-6 md:p-8 animate-fade-in-up delay-200 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                          <span className="text-3xl drop-shadow-md">🏆</span>
                          <h4 className="font-bold text-2xl text-white tracking-wide text-gold-gradient" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Final Standings", (localStorage.getItem('app-lang') || 'vi'))}</h4>
                        </div>
                        
                        <div className="flex flex-col gap-4 relative z-10">
                          {(() => {
                            const top3 = selectedRaceEntries.filter(e => [1,2,3].includes(e.entry?.finalPosition)).sort((a,b) => (a.entry?.finalPosition || 0) - (b.entry?.finalPosition || 0));
                            const rest = selectedRaceEntries.filter(e => ![1,2,3].includes(e.entry?.finalPosition)).sort((a,b) => (a.entry?.finalPosition || 999) - (b.entry?.finalPosition || 999));
                            
                            const renderPodiumItem = (e: any, place: number) => {
                              if (!e) return <div className="flex-1"></div>;
                              
                              let hClass = "h-40";
                              let bgClass = "bg-gradient-to-t from-[#c9a227]/30 to-[#1a1815] border-[#c9a227]";
                              let medal = "🥇";
                              let rankColor = "text-[#c9a227]";
                              
                              if (place === 2) {
                                hClass = "h-32";
                                bgClass = "bg-gradient-to-t from-gray-400/30 to-[#1a1815] border-gray-400";
                                medal = "🥈";
                                rankColor = "text-gray-300";
                              } else if (place === 3) {
                                hClass = "h-24";
                                bgClass = "bg-gradient-to-t from-[#cd7f32]/30 to-[#1a1815] border-[#cd7f32]";
                                medal = "🥉";
                                rankColor = "text-[#cd7f32]";
                              }
                              
                              return (
                                <div className="flex-1 flex flex-col items-center justify-end">
                                  {/* Floating Horse Name above Podium */}
                                  <div className="mb-3 flex flex-col items-center animate-float">
                                    <div className="text-4xl mb-1 filter drop-shadow-lg">{medal}</div>
                                    <div className={`font-bold text-sm md:text-lg ${rankColor} truncate max-w-[120px] md:max-w-[160px] text-center`} style={{ fontFamily: "'Roboto Slab', serif" }}>
                                      {e.horse?.name}
                                    </div>
                                  </div>
                                  {/* The actual physical podium step */}
                                  <div className={`w-full max-w-[160px] rounded-t-xl border-t-4 border-x border-x-white/10 flex flex-col items-center justify-end p-3 text-center ${bgClass} ${hClass} shadow-[0_-10px_30px_rgba(0,0,0,0.6)]`}>
                                    <div className="text-3xl font-extrabold text-white/20 mb-2">{place}</div>
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <>
                                {/* Podium Ceremony Area */}
                                {top3.length > 0 && (
                                  <div className="relative mb-8 pt-8">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#c9a227]/5 blur-2xl pointer-events-none"></div>
                                    <div className="flex justify-center items-end gap-2 md:gap-4 px-2 border-b-2 border-[#c9a227]/20 pb-0 relative z-10">
                                      {renderPodiumItem(top3.find(e => e.entry?.finalPosition === 2), 2)}
                                      {renderPodiumItem(top3.find(e => e.entry?.finalPosition === 1), 1)}
                                      {renderPodiumItem(top3.find(e => e.entry?.finalPosition === 3), 3)}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Award Recipients List */}
                                {top3.length > 0 && (
                                  <div className="mb-6 mt-4">

                                    <div className="flex flex-col gap-3">
                                      {top3.map((e, idx) => (
                                        <div key={`top-${idx}`} className="bg-gradient-to-r from-[#c9a227]/10 to-transparent border border-[#c9a227]/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 hover-lift">
                                          <div className="flex items-center gap-4 flex-1">
                                            <div className="text-3xl">{e.entry?.finalPosition === 1 ? "🥇" : e.entry?.finalPosition === 2 ? "🥈" : "🥉"}</div>
                                            <div>
                                              <div className="text-lg font-bold text-white" style={{ fontFamily: "'Roboto Slab', serif" }}>{e.horse?.name}</div>
                                              <div className="text-sm text-gray-400 mt-1 flex flex-wrap gap-4">

                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">

                                            <div className="text-lg font-mono font-bold text-[#c9a227]">{e.entry?.finishTime}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Rest of the List */}
                                {rest.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4 border-l-4 border-gray-500 pl-3">{t.otherPositions}</h5>
                                    <div className="flex flex-col gap-3">
                                      {rest.map((e, idx) => {
                                        const pos = e.entry?.finalPosition;
                                        let cardStyle = "bg-[#1a1815]/50 border border-white/5 hover:border-gray-500/50";
                                        let rankStyle = "text-gray-500 bg-[#1a1815]";
                                        
                                        if (e.entry?.status === "DISQUALIFIED" || e.entry?.finishTime === "DQ" || !pos) {
                                          rankStyle = "text-red-500 bg-red-500/10 border border-red-500/30 text-xs";
                                        }

                                        return (
                                          <div key={idx} className={`rounded-xl p-3 md:p-4 flex items-center gap-4 transition-all hover-lift ${cardStyle}`}>
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] flex-shrink-0 ${rankStyle}`}>
                                              {(e.entry?.status === "DISQUALIFIED" || e.entry?.finishTime === "DQ" || !pos) ? "DQ" : pos}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="truncate text-gray-300 font-bold" style={{ fontFamily: "'Roboto Slab', serif" }}>
                                                {e.horse?.name}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                                                <span>J: {e.jockey?.fullName || e.jockey?.username}</span>
                                                <span>O: {e.owner?.fullName || e.owner?.username}</span>
                                              </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <div className="text-sm font-mono font-bold text-gray-400 bg-black/40 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/5">
                                                {e.entry?.finishTime || "--:--"}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {selectedRaceEntries.length === 0 && (
                                  <div className="py-12 text-center border border-dashed border-[#2a2825] rounded-xl mt-4 bg-[#1a1815]/30">
                                    <span className="text-4xl mb-4 block opacity-50">🏁</span>
                                    <p className="text-gray-500 font-mono text-sm">No entry logs available.</p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl flex items-center justify-center min-h-[40vh] border-dashed border-[#2a2825]">
                    <div className="text-center">
                      <span className="text-4xl block mb-4 opacity-30 animate-float">👆</span>
                      <p className="text-gray-500 text-sm font-mono italic">Please select a race meeting from the sidebar.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "fixtures":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Lịch thi đấu", (localStorage.getItem('app-lang') || 'vi')) || "Race Fixtures"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((m, idx) => (
                <div key={m.id} className="glass-panel rounded-2xl p-6 hover-lift glowing-border relative overflow-hidden group border border-[#2a2825]" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-bl-full pointer-events-none"></div>
                  <h4 className="font-bold text-xl text-white mb-4 group-hover:text-blue-400 transition-colors" style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#1a1815]/50 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[#c9a227]">ID</span>
                      <span className="font-bold text-white">#{m.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#1a1815]/50 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-blue-400">📍</span>
                      <span className="truncate">{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#1a1815]/50 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[#c9a227]">📅</span>
                      <span>{formatDate(m.startDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && (
                <div className="col-span-full py-12 text-center glass-panel rounded-2xl border-dashed border-[#2a2825]">
                  <p className="text-gray-500 font-mono text-sm">{$t("Không có lịch thi đấu nào.", (localStorage.getItem('app-lang') || 'vi')) || "No fixtures scheduled."}</p>
                </div>
              )}
            </div>
          </div>
        );
      case "statistics":
        const topHorses = [...horses].sort((a,b) => (b.currentRating - a.currentRating)).slice(0, 10);
        const topJockeys = [...users]
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
          .slice(0, 10);

        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Thống kê & Bảng xếp hạng", (localStorage.getItem('app-lang') || 'vi')) || "Statistics & Leaderboards"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Horses */}
              <div className="glass-panel rounded-2xl p-6 border border-[#2a2825] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#c9a227] to-transparent opacity-10 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl">🐎</span>
                  <h4 className="font-bold text-xl text-white tracking-wide text-gold-gradient" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Ngựa dẫn đầu (Top Rating)", (localStorage.getItem('app-lang') || 'vi')) || "Leading Horses (Top Rating)"}</h4>
                </div>
                <div className="space-y-3 relative z-10">
                  {topHorses.map((h, idx) => (
                    <div key={h.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1815]/50 border border-white/5 hover:border-[#c9a227]/30 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/50' : 'bg-[#2a2825] text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-200 truncate">{h.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">{h.breed}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{$t("Đánh giá", (localStorage.getItem('app-lang') || 'vi')) || "Rating"}</div>
                        <div className="font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 inline-block">{h.currentRating}</div>
                      </div>
                    </div>
                  ))}
                  {topHorses.length === 0 && <p className="text-gray-500 text-sm text-center py-4 italic">{$t("Không có dữ liệu ngựa.", (localStorage.getItem('app-lang') || 'vi')) || "No horse data available."}</p>}
                </div>
              </div>

              {/* Top Jockeys */}
              <div className="glass-panel rounded-2xl p-6 border border-[#2a2825] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500 to-transparent opacity-10 rounded-bl-full pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl">👤</span>
                  <h4 className="font-bold text-xl text-white tracking-wide text-blue-400" style={{ fontFamily: "'Roboto Slab', serif" }}>{$t("Nài ngựa dẫn đầu (Top 3)", (localStorage.getItem('app-lang') || 'vi')) || "Leading Jockeys (Top-3)"}</h4>
                </div>
                <div className="space-y-3 relative z-10">
                  {topJockeys.map((j, idx) => (
                    <div key={j.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1815]/50 border border-white/5 hover:border-blue-500/30 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#2a2825] text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-200 truncate">{j.fullName || j.username}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {j.racesRun} {$t("Trận", (localStorage.getItem('app-lang') || 'vi')) || "Races"}
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Top 3</div>
                          <div className="font-mono font-bold text-white">{j.top3Finishes}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Rate</div>
                          <div className="font-mono font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">{j.top3Rate}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topJockeys.length === 0 && <p className="text-gray-500 text-sm text-center py-4 italic">No jockey data available.</p>}
                </div>
              </div>
            </div>
          </div>
        );
      case "horses":
        return <GenericTableView title={$t("Danh sách Đăng ký Ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Registered Horse Registry"} data={horses} columns={[{ key: "id", label: $t("Mã (ID)", (localStorage.getItem('app-lang') || 'vi')) || "ID" }, { key: "name", label: $t("Tên Ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Horse Name" }, { key: "breed", label: $t("Giống loài", (localStorage.getItem('app-lang') || 'vi')) || "Breed" }, { key: "currentRating", label: $t("Đánh giá", (localStorage.getItem('app-lang') || 'vi')) || "Current Rating" }]} />;
      case "jockeys_owners":
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
              <GenericTableView 
                title={$t("Danh sách Nài ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Jockeys"} 
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
                  { key: "id", label: $t("Mã (ID)", (localStorage.getItem('app-lang') || 'vi')) || "ID" },
                  { key: "fullName", label: $t("Nài ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Jockey" },
                  { key: "email", label: $t("Email", (localStorage.getItem('app-lang') || 'vi')) || "Email" },
                  { key: "jockeyWeight", label: $t("Cân nặng", (localStorage.getItem('app-lang') || 'vi')) || "Weight" },
                  { key: "racesRun", label: $t("Số trận tham gia", (localStorage.getItem('app-lang') || 'vi')) || "Races Run" },
                  { key: "top3Finishes", label: $t("Số lần Top 3", (localStorage.getItem('app-lang') || 'vi')) || "Top-3 Finishes" },
                  { key: "top3Rate", label: $t("Tỉ lệ Top 3", (localStorage.getItem('app-lang') || 'vi')) || "Top-3 Rate" }
                ]} 
              />
              <GenericTableView title={$t("Danh sách Chủ ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Horse Owners"} data={users.filter(u => u.roleId === 2)} columns={[{ key: "id", label: $t("Mã (ID)", (localStorage.getItem('app-lang') || 'vi')) || "ID" }, { key: "fullName", label: $t("Chủ ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Owner" }, { key: "email", label: $t("Email", (localStorage.getItem('app-lang') || 'vi')) || "Email" }]} />
            </div>
          </div>
        );
      case "incident":
        return (
          <GenericTableView 
            title={$t("Báo cáo Sự cố & Vi phạm", (localStorage.getItem('app-lang') || 'vi')) || "Violation Incident Reports"} 
            data={violations.map((v: any) => ({
              id: v.violation?.id,
              raceId: v.violation?.raceId,
              horseName: v.horseName || `Horse #${v.violation?.horseId}`,
              jockeyName: v.jockeyName || `Jockey #${v.violation?.jockeyId}`,
              description: v.violation?.description || "—",
              penalty: v.violation?.penalty || $t("Đang chờ xử lý", (localStorage.getItem('app-lang') || 'vi')) || "Pending Decision",
              status: v.violation?.status || "PENDING"
            }))} 
            columns={[
              { key: "id", label: $t("Mã Báo cáo", (localStorage.getItem('app-lang') || 'vi')) || "Report ID" },
              { key: "raceId", label: $t("Mã Trận đua", (localStorage.getItem('app-lang') || 'vi')) || "Race ID" },
              { key: "horseName", label: $t("Ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Horse" },
              { key: "jockeyName", label: $t("Nài ngựa", (localStorage.getItem('app-lang') || 'vi')) || "Jockey" },
              { key: "description", label: $t("Mô tả sự cố", (localStorage.getItem('app-lang') || 'vi')) || "Description" },
              { key: "penalty", label: $t("Hình phạt", (localStorage.getItem('app-lang') || 'vi')) || "Penalty" },
              { key: "status", label: $t("Trạng thái", (localStorage.getItem('app-lang') || 'vi')) || "Status" }
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
        return <AboutView t={t} />;
      default:
        return <HomeView seasons={seasons.filter(s => s.status === "ACTIVE")} meetings={meetings} t={t} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c09", color: "#f0f0f0", fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>

      {/* ── HEADER ─────────────────────────────── */}
      <header className="sticky top-0" style={{ zIndex: 50, background: "#0e0c09", borderBottom: "1px solid #1a1815" }}>
        <div style={{ 
          maxWidth: "85rem", 
          margin: "0 auto", 
          padding: "0 1.5rem", 
          height: isMobile ? "auto" : "5rem", 
          paddingTop: isMobile ? "1rem" : "0",
          paddingBottom: isMobile ? "1rem" : "0",
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center", 
          justifyContent: "space-between", 
          gap: isMobile ? "1rem" : "2rem" 
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: isMobile ? "100%" : "auto" }}>
            {/* Logo */}
            <a href="/" style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: "0.375rem", background: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0e0c09" strokeWidth="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              </div>
              <div>
                <p style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f0f0f0", lineHeight: 1.1 }}>HorseRace</p>
                {!isMobile && <p style={{ fontSize: "0.55rem", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: "2px" }}>Management System</p>}
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
          <div style={{ flex: isMobile ? "none" : 1, width: "100%", maxWidth: isMobile ? "100%" : "36rem", position: "relative", marginLeft: isMobile ? "0" : "2rem" }}>
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

              style={{ width: "100%", paddingLeft: "2.5rem", paddingRight: "1.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.85rem", background: "#111111", borderRadius: "0.5rem", color: "#f0f0f0", border: "1px solid #1f1f1f", outline: "none" }}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setView("home"); }}
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "12px" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls (Desktop Only) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0" }}>
              {/* Language */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700 }}>
                  🌐 {langLabel} ▾
                </button>
                {showLangMenu && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.5rem", width: "8rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: "0.5rem", zIndex: 50 }}>
                    {[["en","EN","English"],["vi","VI","Tiếng Việt"],["zh","ZH","简体中文"],["ja","JA","日本語"]].map(([code, label, name]) => (
                      <button key={code} onClick={() => { setLang(code); setShowLangMenu(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.75rem", fontFamily: "monospace" }}>{name}</button>
                    ))}
                  </div>
                )}
              </div>



              {/* Auth Controls */}
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1rem" }}>
                  {/* Avatar circle */}
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.9rem", fontFamily: "monospace", fontWeight: 700,
                    color: "#fff",
                    background: user.avatar ? "transparent" : "#a855f7",
                    overflow: "hidden", flexShrink: 0
                  }}>
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : (user.fullName || user.username)?.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: "0.85rem", color: "#f0f0f0", fontWeight: 600, fontFamily: "sans-serif" }}>{user.fullName || user.username}</p>
                    <p style={{ fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", color: "#c9a227", marginTop: "2px" }}>{getRoleLabel(user.roleId)}</p>
                  </div>
                  <button onClick={() => { logout(); }} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.75rem", paddingLeft: "1rem", borderLeft: "1px solid #2a2825", marginLeft: "0.25rem", fontFamily: "sans-serif" }}>{$t("Đăng xuất", (localStorage.getItem('app-lang') || 'vi'))}</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "0.75rem", borderLeft: "1px solid #2a2825" }}>
                  <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", borderRadius: "0.25rem", background: "#c9a227", color: "#0e0c09", textDecoration: "none", fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    👤 {$t("Đăng nhập", (localStorage.getItem('app-lang') || 'vi'))}
                  </Link>
                  <Link to="/register" style={{ padding: "0.375rem 0.75rem", borderRadius: "0.25rem", border: "1px solid rgba(201,162,39,0.5)", color: "#c9a227", textDecoration: "none", fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {$t("Đăng ký", (localStorage.getItem('app-lang') || 'vi'))}
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
                              className="landing-nav-btn"
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
                          💼 {$t("Trang quản trị", (localStorage.getItem('app-lang') || 'vi'))}
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
                          👤 {$t("Hồ sơ", (localStorage.getItem('app-lang') || 'vi'))}
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
                          🚪 {$t("Đăng xuất", (localStorage.getItem('app-lang') || 'vi'))}
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
                          👤 {$t("Đăng nhập", (localStorage.getItem('app-lang') || 'vi'))}
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
                          📝 {$t("Đăng ký", (localStorage.getItem('app-lang') || 'vi'))}
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
                      💼 {$t("Trang quản trị", (localStorage.getItem('app-lang') || 'vi'))}
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
                      👤 {$t("Hồ sơ", (localStorage.getItem('app-lang') || 'vi'))}
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
                      🚪 {$t("Đăng xuất", (localStorage.getItem('app-lang') || 'vi'))}
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
                      👤 {$t("Đăng nhập", (localStorage.getItem('app-lang') || 'vi'))}
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
                      📝 {$t("Đăng ký", (localStorage.getItem('app-lang') || 'vi'))}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Scrollable Nav Items */}
            {!isMobile && (
              <div className="scrollbar-hide" style={{ display: "flex", alignItems: "center", gap: "1.5rem", overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingRight: "0.5rem" }}>
                {SUB_NAV.map(n => {
                  const active = view === n.key;
                  return (
                    <button
                      key={n.key}
                      className="landing-nav-btn"
                      onClick={() => {
                        setView(n.key);
                      }}
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.85rem",
                        fontFamily: "sans-serif",
                        cursor: "pointer",
                        border: active ? "1px solid rgba(201,162,39,0.5)" : "1px solid transparent",
                        background: active ? "rgba(201,162,39,0.06)" : "transparent",
                        color: active ? "#c9a227" : "#a0a0a0",
                        fontWeight: active ? 600 : 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
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

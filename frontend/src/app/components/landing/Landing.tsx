import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import { parseSafeDate, formatDate } from "../../utils/dateTimeHelper";
import { parseMarkdownToHtml } from "../../utils/markdownParser";
import ProfileModal from "../dashboards/components/ProfileModal";
import HorsePerformanceModal from "../dashboards/components/HorsePerformanceModal";
import { PaginationControls } from "../admin-workflow/PaginationControls";
import WebCamLiveViewer from "../livestream/WebCamLiveViewer";
import HorseRacingSimulator from "./HorseRacingSimulator";


// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
type SubView = "home" | "live" | "betting" | "racecard" | "results" | "fixtures" | "statistics" | "horses" | "jockeys_owners" | "incident" | "about" | "search";

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
  }
};

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
const CHAT_LANG: Record<string, any> = {
  vi: { label: "HorseRaceManagementSystem AI", placeholder: "Ask a question...", typing: "Analyzing...", welcome: "Hello! Ask me about horses, jockeys, races, or predictions.", error: "Error: ", noconn: "Cannot connect to AI server.", quick: ["Top Rating","Predict Race","Best Jockey","Season"], quickQ: ["Which horse has the highest rating?","Predict the latest race result","Which jockey has the best top-3 rate?","Current season summary"] },
  en: { label: "HorseRaceManagementSystem AI", placeholder: "Ask a question...", typing: "Analyzing...", welcome: "Hello! Ask me about horses, jockeys, races, or predictions.", error: "Error: ", noconn: "Cannot connect to AI server.", quick: ["Top Rating","Predict Race","Best Jockey","Season"], quickQ: ["Which horse has the highest rating?","Predict the latest race result","Which jockey has the best top-3 rate?","Current season summary"] },
  ja: { label: "HorseRaceManagementSystem AI", placeholder: "Ask a question...", typing: "Analyzing...", welcome: "Hello! Ask me about horses, jockeys, races, or predictions.", error: "Error: ", noconn: "Cannot connect to AI server.", quick: ["Top Rating","Predict Race","Best Jockey","Season"], quickQ: ["Which horse has the highest rating?","Predict the latest race result","Which jockey has the best top-3 rate?","Current season summary"] },
  zh: { label: "HorseRaceManagementSystem AI", placeholder: "Ask a question...", typing: "Analyzing...", welcome: "Hello! Ask me about horses, jockeys, races, or predictions.", error: "Error: ", noconn: "Cannot connect to AI server.", quick: ["Top Rating","Predict Race","Best Jockey","Season"], quickQ: ["Which horse has the highest rating?","Predict the latest race result","Which jockey has the best top-3 rate?","Current season summary"] },
};

/**
 */
function ChatBot({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: "welcome", type: "bot", text: CHAT_LANG.en.welcome }]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? { ...m, text: CHAT_LANG.en.welcome } : m));
  }, []);

  useEffect(() => { 
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || waiting) return;
    setInput("");
    const userMsg = { id: `u-${Date.now()}`, type: "user", text: msg };
    const typingMsg = { id: `t-${Date.now()}`, type: "typing", text: CHAT_LANG.en.typing };
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setWaiting(true);
    try {
      const data = await api.post<any>("/ai/chat", { message: msg, lang: "en", sessionId });
      const rawText = data.success ? data.reply : CHAT_LANG.en.error + (data.error || "");
      
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
      setMessages(prev => prev.filter(m => m.type !== "typing").concat({ id: `b-${Date.now()}`, type: "bot", text: CHAT_LANG.en.noconn }));
      setWaiting(false);
    }
  };

  const L = CHAT_LANG.en;

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

  const st = SEARCH_TRANSLATIONS.en;
  const totalMatches = horses.length + people.length + meetings.length + races.length;

  return (
    <div style={{ color: "#f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f0f0f0" }}>
            {"Search Results"}
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
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{"Days"}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-white bg-black/60 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227]/40 backdrop-blur-md min-w-[3rem] md:min-w-[4rem]">{String(timeLeft.h).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{"Hours"}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-white bg-black/60 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227]/40 backdrop-blur-md min-w-[3rem] md:min-w-[4rem]">{String(timeLeft.m).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">{"Minutes"}</div>
      </div>
      <div className="text-xl md:text-2xl text-[#c9a227] pb-4 font-bold">:</div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-mono font-bold text-[#c9a227] bg-[#c9a227]/10 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#c9a227] backdrop-blur-md min-w-[3rem] md:min-w-[4rem] shadow-[0_0_15px_rgba(201,162,39,0.3)]">{String(timeLeft.s).padStart(2, '0')}</div>
        <div className="text-[10px] md:text-xs text-[#c9a227] mt-2 uppercase tracking-widest font-bold">{"Seconds"}</div>
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
            <button onClick={onWatchLive} className="uiverse-watch-live-btn">
              {t.watchLive}
            </button>
            <button onClick={onViewRacecard} className="uiverse-hover-btn px-8 py-3 bg-black/60 backdrop-blur-md border border-[#2a2825] text-white font-medium rounded-lg hover:border-[#c9a227]/50 hover:bg-black/80 transition-all text-sm shadow-lg shadow-black/50">
              {t.viewRacecard}
            </button>
          </div>
        </div>
      </div>

      {/* Active Seasons */}
      <div className="mb-14 animate-fade-in-up delay-300">
        <div className="flex items-center gap-4 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>Active Seasons</h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
        </div>
        
        {seasons.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono italic p-8 glass-panel rounded-2xl text-center border-dashed border-[#2a2825]">No active seasons currently.</p>
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
                <div key={s.id} className="glow-cyber-card rounded-2xl p-7 transition-all duration-300 border border-[#c9a227]/30 shadow-xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-5 relative z-10 w-full">
                    <h4 className="font-bold text-2xl text-white group-hover:text-[#c9a227] transition-colors drop-shadow-md" style={{ fontFamily: "'Roboto Slab', serif" }}>{s.name}</h4>
                    <span className="text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/40 shadow-[0_0_15px_rgba(74,222,128,0.25)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block"></span>
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300 font-mono relative z-10 bg-[#14120f]/80 p-3.5 rounded-xl border border-white/5 w-full">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Start Date</span>
                      <span className="opacity-90 font-semibold text-white">{formatSeasonDate(s.startDate)}</span>
                    </div>
                    <span className="text-[#c9a227] font-sans px-2 text-xl font-bold">→</span>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">End Date</span>
                      <span className="opacity-90 font-semibold text-white">{formatSeasonDate(s.endDate)}</span>
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
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Upcoming Race Meetings"}</h3>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
        </div>
        
        {meetings.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono italic p-8 glass-panel rounded-2xl text-center border-dashed border-[#2a2825]">{"No upcoming race meetings."}</p>
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
                <div key={m.id} className="glow-cyber-card rounded-2xl p-7 transition-all duration-300 border border-[#c9a227]/30 shadow-xl relative overflow-hidden group">
                  <h4 className="font-bold text-2xl text-white mb-5 group-hover:text-[#c9a227] transition-colors relative z-10 drop-shadow-md" style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</h4>
                  <div className="space-y-2.5 relative z-10 w-full">
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-blue-400 text-lg">📍</span> 
                      <span className="truncate font-medium text-white">{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-4 py-2.5 rounded-xl border border-white/5">
                      <span className="text-[#c9a227] text-lg">📅</span> 
                      <span className="font-medium text-white">{date}</span>
                    </div>
                    {time && (
                      <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-4 py-2.5 rounded-xl border border-white/5">
                        <span className="text-[#c9a227] text-lg">🕒</span> 
                        <span className="font-medium text-white">{time}</span>
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

function GenericTableView({ title, data, columns, onRowClick }: { title: string; data: any[]; columns: { key: string; label: string }[]; onRowClick?: (row: any) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatValue = (cKey: string, val: any) => {
    if (val === null || val === undefined) return "-";
    if (cKey === "totalBudget" && typeof val === "number") {
      return `${val.toLocaleString()} VND`;
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
          <>
            <div className="flex flex-col gap-4">
              {paginatedData.map((row, i) => (
                <div 
                  key={i} 
                  className={`glass-panel rounded-xl p-4 border border-[#2a2825] hover:border-[#c9a227]/40 transition-all ${onRowClick ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
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
                        <span className={`font-semibold text-right max-w-[60%] truncate ${colIdx === 1 ? 'text-[#c9a227]' : 'text-gray-200'}`}>
                          {formatValue(c.key, val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={data.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl font-bold text-white tracking-wide uppercase drop-shadow-lg mb-6 flex items-center gap-3" style={{ fontFamily: "'Roboto Slab', serif" }}>
        <span className="w-2 h-6 bg-[#c9a227] rounded-full inline-block"></span>
        {title}
      </h2>
      {data.length === 0 ? (
        <div className="py-12 text-center glass-panel rounded-2xl border-dashed border-[#2a2825]">
          <p className="text-gray-500 font-mono text-sm">No data available.</p>
        </div>
      ) : (
        <>
          <div className="glow-cyber-card rounded-2xl overflow-hidden p-3 border border-[#c9a227]/30 transition-all duration-300 shadow-xl relative">
            <div className="overflow-x-auto relative z-10 w-full rounded-xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#14120f] border-b border-white/10">
                    {columns.map(c => (
                      <th key={c.key} className="py-4 px-6 text-xs font-mono text-[#c9a227] tracking-widest uppercase font-bold whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#14120f]/60">
                  {paginatedData.map((row, i) => (
                    <tr 
                      key={i} 
                      className={`hover:bg-[#c9a227]/[0.1] hover:shadow-[inset_0_0_15px_rgba(201,162,39,0.15)] transition-all duration-200 group ${onRowClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((c, colIdx) => (
                        <td 
                          key={c.key} 
                          className={`py-4 px-6 text-sm whitespace-nowrap ${
                            colIdx === 1 
                              ? 'font-bold text-[#c9a227] group-hover:text-[#ffe270] group-hover:translate-x-1 transition-all' 
                              : colIdx === 0 
                                ? 'font-bold text-gray-300 group-hover:text-white' 
                                : 'text-gray-300'
                          }`}
                        >
                          {formatValue(c.key, row[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={data.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AboutView({ t }: { t: any }) {
  return (
    <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
      <h2 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase drop-shadow-lg mb-2" style={{ fontFamily: "'Roboto Slab', serif" }}>{"About the System"}</h2>
      <p className="text-[#c9a227] font-mono text-xs uppercase tracking-widest mb-12">{"Comprehensive Horse Racing Management Platform"}</p>
      
      <div className="glass-panel rounded-3xl p-8 md:p-12 mb-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#c9a227]/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold text-gold-gradient mb-6 relative z-10" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Our Mission"}</h3>
        <p className="text-gray-300 text-base md:text-lg leading-relaxed relative z-10 font-light max-w-2xl mx-auto">
          The Horse Race Management System is a comprehensive platform designed to streamline and modernize horse racing tournament management. From season initialization to race-day operations, our system provides administrators, horse owners, jockeys, and referees with the tools they need to conduct fair, exciting, and well-organized race events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "🏆", title: "Season Management", desc: "Full tournament lifecycle from setup to results" },
          { icon: "🐎", title: "Horse Profiles", desc: "Track horses, ratings and performance records" },
          { icon: "🏇", title: "Jockey Management", desc: "Manage jockey profiles and schedules" },
          { icon: "📋", title: "Race Day Operations", desc: "Race cards, schedules, live monitoring" },
          { icon: "📊", title: "Statistics", desc: "Win rates, prize money, performance analysis" },
          { icon: "⚠️", title: "Incident Reports", desc: "Track rule violations and penalties" },
        ].map((item, i) => (
          <div key={i} className="uiverse-cyber-card glass-panel rounded-2xl p-6 transition-all group border border-[#2a2825]" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="card-glare"></div>
            <div className="scan-line"></div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">{item.icon}</div>
            <h4 className="font-bold text-white text-lg mb-2 relative z-10" style={{ fontFamily: "'Roboto Slab', serif" }}>{item.title}</h4>
            <p className="text-gray-400 text-sm font-light leading-relaxed relative z-10">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingBettingContainer({ user, navigate, races }: { user: any; navigate: any; races: any[] }) {
  const [scheduledRaces, setScheduledRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [oddsList, setOddsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any[]>("/public/races").then(all => {
      const scheduled = (Array.isArray(all) ? all : []).filter(r => r.status === "SCHEDULED" || r.status === "DECLARATION_CLOSED");
      setScheduledRaces(scheduled);
      if (scheduled.length > 0) setSelectedRaceId(scheduled[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);
    api.get<any[]>(`/betting/odds/${selectedRaceId}`).then(data => {
      setOddsList(Array.isArray(data) ? data : []);
    }).catch(() => setOddsList([])).finally(() => setLoading(false));
  }, [selectedRaceId]);

  const handleBetNow = () => {
    if (user?.roleId === 5) {
      navigate("/dashboard/spectator?tab=betting");
    } else if (user) {
      navigate("/dashboard/spectator");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>
          🎲 Live Betting Odds
        </h2>
        <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(20,20,20,0.9) 100%)", border: "1px solid rgba(201,162,39,0.3)", padding: "1.5rem", borderRadius: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f4f2ec" }}>Real-Time Race Odds & AI Win Probability</h3>
          <p style={{ color: "#a0a0a0", fontSize: "0.85rem", marginTop: "0.2rem", fontStyle: "italic" }}>"In gambling, those who don't play are the winners, but those who don't play will never win."</p>
        </div>
        <button onClick={handleBetNow} style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(45deg, #c9a227, #f3d06c)", color: "#110f0e", border: "none", borderRadius: "0.5rem", fontWeight: 800, cursor: "pointer", fontFamily: "monospace" }}>
          💥 PLACE BETS IN DASHBOARD →
        </button>
      </div>

      {scheduledRaces.length === 0 ? (
        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center min-h-[30vh] border-dashed border-[#2a2825]">
          <span className="text-5xl block mb-4 opacity-50 grayscale">🎲</span>
          <p className="text-gray-400 font-mono text-sm max-w-sm text-center">No scheduled races currently open for betting.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }} className="betting-responsive-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#c9a227", textTransform: "uppercase" }}>Scheduled Races:</span>
            {scheduledRaces.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRaceId(r.id)}
                style={{ padding: "1rem", borderRadius: "0.75rem", background: r.id === selectedRaceId ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.02)", border: r.id === selectedRaceId ? "1px solid #c9a227" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}
              >
                <div style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{r.classLevel ?? `Race #${r.id}`}</div>
                <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.25rem" }}>📏 {r.distanceMeters}m · {r.trackType}</div>
              </div>
            ))}
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#c9a227", textTransform: "uppercase" }}>Runner Odds:</span>
            {loading ? (
              <p style={{ color: "#a0a0a0", fontFamily: "monospace", marginTop: "1rem" }}>Calculating runner odds...</p>
            ) : oddsList.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", marginTop: "1rem" }}>No entries for this race.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                {oddsList.map(item => (
                  <div key={item.horseId} style={{ padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>#{item.gateNumber ?? "-"} {item.horseName}</span>
                      <span style={{ display: "block", fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>Jockey: {item.jockeyName} · Rating: {item.horseRating}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#c9a227", fontFamily: "monospace" }}>{item.odds.toFixed(2)}x</span>
                      <span style={{ display: "block", fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace" }}>Prob: {item.probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
/**
 */
export default function Landing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState<SubView>("home");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  
  const [lang, setLangRaw] = useState(() => localStorage.getItem('app-lang') || 'en');
  const setLang = (code: string) => { 
    setLangRaw(code); 
    localStorage.setItem('app-lang', code); 
    window.location.reload(); 
  };
  
  const t = TRANSLATIONS.en;
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

  // Selected states for Profile & Horse modals
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [selectedHorseName, setSelectedHorseName] = useState<string>("");

  const [clearedNotifications, setClearedNotifications] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cleared-notifications") || "[]");
    } catch {
      return [];
    }
  });

  const [dashboardNotifs, setDashboardNotifs] = useState<any[]>([]);
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  const fetchUserNotifications = async () => {
    if (!user?.id) return;
    try {
      const res: any = await api.get(`/notifications?userId=${user.id}`);
      if (res && res.notifications && Array.isArray(res.notifications)) {
        setDbNotifications(res.notifications);
        setUnreadNotifCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch user notifications:", err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserNotifications();
      const interval = setInterval(fetchUserNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setDbNotifications([]);
      setUnreadNotifCount(0);
    }
  }, [user]);

  const handleMarkNotifRead = async (notifId: number) => {
    try {
      await api.post(`/notifications/${notifId}/read`);
      fetchUserNotifications();
    } catch {}
  };

  const handleMarkAllNotifsRead = async () => {
    if (!user?.id) return;
    try {
      await api.post(`/notifications/read-all?userId=${user.id}`);
      fetchUserNotifications();
    } catch {}
  };

  const getDynamicNotifications = () => {
    const list: any[] = [];
    const lang = localStorage.getItem("app-lang") || "en";

    if (dashboardNotifs.length > 0) {
      dashboardNotifs.forEach((n: any) => {
        let icon = "🔔";
        let color = "#3b82f6";
        let bg = "rgba(59,130,246,0.1)";
        if (n.type === "approved") {
          icon = "✅";
          color = "#10b981";
          bg = "rgba(16,185,129,0.1)";
        } else if (n.type === "rejected") {
          icon = "❌";
          color = "#ef4444";
          bg = "rgba(239,68,68,0.1)";
        } else if (n.type === "pending") {
          icon = "⏳";
          color = "#f59e0b";
          bg = "rgba(245,158,11,0.1)";
        }
        list.push({
          id: n.id,
          icon,
          color,
          bg,
          title: n.title,
          desc: n.message,
          time: "Notification"
        });
      });
    }

    // Common/Fallback Notification: Active Season
    const activeSeason = seasons.find(s => s.status === "ACTIVE");
    if (activeSeason) {
      list.push({
        id: `season-${activeSeason.id}`,
        icon: "🏆",
        color: "#c9a227",
        bg: "rgba(201,162,39,0.1)",
        title: "Active Seasons",
        desc: `Season ${activeSeason.name} is currently active! Register now.`,
        time: "Active"
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
          title: "Upcoming Event",
          desc: `${upcomingMeeting.name} starts soon at ${upcomingMeeting.venue}.`,
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
          title: "Incidents Pending Decision",
          desc: `There are ${pendingViolations.length} violation reports awaiting penalty decision.`,
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
          title: "Races Pending Results",
          desc: `There are ${unprocessRaces.length} finished races awaiting official results processing.`,
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
          title: "Horse Violation Warning",
          desc: `Your horse ${latestOwnerViol.horseName || ""} was reported for: ${latestOwnerViol.violation?.description || "Rule violation"}`,
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
          title: "Upcoming Event",
          desc: lang === "vi"
            ? `Register your horse for event ${upcomingMeeting.name} at ${upcomingMeeting.venue}.`
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
          title: "You have a violation report",
          desc: lang === "vi"
            ? `You were reported for violation: ${latestJockeyViol.violation?.description || "Rules Violation"}`
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
          title: "Upcoming Event",
          desc: lang === "vi"
            ? `Race meeting ${upcomingMeeting.name} is upcoming. Please check mount registrations.`
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
          title: "Race Assignment",
          desc: lang === "vi"
            ? `You are assigned as referee for ${assignedRaces.length} upcoming races.`
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
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.roleId === 1) navigate("/dashboard/admin");
    else if (user.roleId === 2) navigate("/dashboard/owner");
    else if (user.roleId === 3) navigate("/dashboard/jockey");
    else if (user.roleId === 5) navigate("/dashboard/referee");
    else navigate("/dashboard/spectator");
  };

  const SUB_NAV: { key: SubView; label: string; icon: string }[] = [
    { key: "live", label: "Live", icon: "📺" },
    { key: "betting", label: "Betting Odds", icon: "🎲" },
    { key: "home", label: "Racing", icon: "🏇" },
    { key: "racecard", label: "Racecard", icon: "ℹ️" },
    { key: "results", label: "Results", icon: "🏆" },
    { key: "fixtures", label: "Fixtures", icon: "📅" },
    { key: "statistics", label: "Statistics", icon: "📊" },
    { key: "horses", label: "Horses Directory", icon: "🐎" },
    { key: "jockeys_owners", label: "Jockeys & Owners", icon: "👤" },
    { key: "incident", label: "Incident Reports", icon: "⚠️" },
    { key: "about", label: "About", icon: "ℹ️" },
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

  // Component managing Live 2D JavaScript Simulation Model Demo on Landing
  const LandingLiveStreamContainer = ({ r }: { r: any }) => {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 2D Interactive Horse Racing Simulator Model */}
        <HorseRacingSimulator />

        {/* Dashboard CTA Redirection Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h4 className="text-sm font-bold text-amber-400 font-serif uppercase tracking-wide">
                Real HD Camera Stream & Interactive Live Chat
              </h4>
              <p className="text-xs text-white/70 font-mono mt-0.5">
                You are watching the AI Statistical Performance Simulation preview on the landing page. To access real-time referee camera broadcasts, YouTube streams, and live chat, please enter your Dashboard!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              onClick={handleLiveBtnClick}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-mono font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <span>🔑</span>
              <span>Watch Real Live Stream in Dashboard →</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubView = () => {
    switch (view) {
      case "home":
        return <HomeView seasons={seasons.filter(s => s.status === "ACTIVE")} meetings={meetings} t={t} onWatchLive={handleLiveBtnClick} onViewRacecard={() => setView("racecard")} />;
      case "live":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Live"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-red-500/60 to-transparent"></div>
            </div>
            
            {liveRaces.length === 0 ? (
              <div className="glass-panel rounded-2xl flex flex-col items-center justify-center min-h-[40vh] border-dashed border-[#2a2825]">
                <span className="text-5xl block mb-4 opacity-50 grayscale">📺</span>
                <p className="text-gray-400 font-mono text-sm max-w-sm text-center">{"No livestream is currently in progress."}</p>
              </div>
            ) : (() => {
              const r = liveRaces.find(race => race.streamMode === "WEBCAM") || liveRaces[0];
              return <LandingLiveStreamContainer r={r} />;
            })()}
          </div>
        );
      case "betting":
        return <LandingBettingContainer user={user} navigate={navigate} races={races} />;
      case "racecard":
        return (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Racecard"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar: Meetings Selection */}
              <div className="flex flex-col gap-4">
                <h5 className="font-mono text-xs text-[#c9a227] uppercase tracking-widest pl-2 border-l-2 border-[#c9a227]">{"Select Meeting"}</h5>
                
                {isMobile ? (
                  <select
                    value={selectedMeetingId || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedMeetingId(val ? parseInt(val) : null);
                      setSelectedRaceId(null);
                      setSelectedRaceEntries([]);
                    }}
                    className="w-full p-4 bg-[#1a1815]/90 border border-[#c9a227]/30 rounded-xl text-white outline-none focus:border-[#c9a227] transition-colors"
                  >
                    <option value="">-- Choose Meeting --</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.venue})</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-3">
                    {meetings.map(m => {
                      const isSelected = selectedMeetingId === m.id;
                      return (
                        <button 
                          key={m.id} 
                          onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} 
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isSelected ? 'glow-cyber-card border-2 border-[#c9a227] shadow-[0_0_20px_rgba(201,162,39,0.3)] scale-[1.02]' : 'glass-panel bg-[#1a1815]/60 border border-white/10 hover:border-[#c9a227]/40 hover:bg-[#1a1815]'}`}
                        >
                          <strong className={`block text-[15px] ${isSelected ? 'text-[#c9a227] font-extrabold' : 'text-gray-200'}`} style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</strong>
                          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-gray-400">
                            <span className="text-[#c9a227]">📍</span> {m.venue}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Main Content: Races & Entries */}
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div className="animate-fade-in delay-100">
                    <div className="flex flex-wrap gap-3 mb-8">
                      {meetingRaces.map(r => {
                        const isSelected = selectedRaceId === r.id;
                        return (
                          <button 
                            key={r.id} 
                            onClick={() => setSelectedRaceId(r.id)} 
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${isSelected ? 'bg-gradient-to-r from-[#c9a227] via-[#f3d06c] to-[#c9a227] text-[#0e0c09] shadow-[0_0_20px_rgba(201,162,39,0.4)] scale-105 font-extrabold' : 'glass-panel text-gray-300 hover:text-white hover:border-[#c9a227]/50 border border-white/10'}`}
                          >
                            <span>🏁 RACE {r.id}</span>
                            <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/20 text-[#0e0c09]' : 'bg-white/10 text-gray-400'}`}>
                              {r.classLevel}
                            </span>
                          </button>
                        );
                      })}
                      {meetingRaces.length === 0 && <p className="text-gray-500 text-sm italic py-2">No races scheduled for this meeting.</p>}
                    </div>

                    {selectedRaceId && (
                      <div className="glow-cyber-card rounded-2xl p-6 md:p-8 animate-fade-in-up delay-200 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                          <span className="text-2xl">🏇</span>
                          <h4 className="font-bold text-xl text-white tracking-wide" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Runners & Riders"}</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                          {selectedRaceEntries.map((e, idx) => (
                            <div key={idx} className="bg-[#14120f]/80 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:-translate-y-1 hover:border-[#c9a227]/50 transition-all group shadow-md">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a2825] to-[#14120f] border border-[#c9a227]/40 flex items-center justify-center font-mono font-bold text-[#c9a227] text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] flex-shrink-0 group-hover:scale-110 transition-transform">
                                #{e.entry?.gateNumber || idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-white text-base truncate group-hover:text-[#c9a227] transition-colors" style={{ fontFamily: "'Roboto Slab', serif" }}>
                                  {e.horse?.name}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-1 truncate">
                                  <span className="text-gray-500">{"J:"}</span> <span className="text-gray-300">{e.jockey?.fullName || e.jockey?.username}</span>
                                  <span className="mx-2 opacity-30">|</span>
                                  <span className="text-gray-500">{"O:"}</span> <span className="text-gray-300">{e.owner?.fullName || e.owner?.username}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xs font-mono">
                                  <span className="text-gray-500">{"RTG"} </span>
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
                  <div className="glow-cyber-card rounded-2xl flex items-center justify-center min-h-[40vh] border-dashed border-[#2a2825]">
                    <div className="text-center p-8">
                      <span className="text-4xl block mb-4 opacity-50 animate-bounce">👆</span>
                      <p className="text-gray-400 font-mono text-sm">Select a race meeting from the left menu to view racecard details.</p>
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
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Results"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar: Meetings Selection */}
              <div className="flex flex-col gap-4">
                <h5 className="font-mono text-xs text-[#c9a227] uppercase tracking-widest pl-2 border-l-2 border-[#c9a227]">{"Select Meeting"}</h5>
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
                    {meetings.map(m => {
                      const isSelected = selectedMeetingId === m.id;
                      return (
                        <button 
                          key={m.id} 
                          onClick={() => { setSelectedMeetingId(m.id); setSelectedRaceId(null); setSelectedRaceEntries([]); }} 
                          className={`w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isSelected ? 'glow-cyber-card border-2 border-[#c9a227] shadow-[0_0_20px_rgba(201,162,39,0.3)] scale-[1.02]' : 'glass-panel bg-[#1a1815]/60 border border-white/10 hover:border-[#c9a227]/40 hover:bg-[#1a1815]'}`}
                        >
                          <strong className={`block text-[15px] ${isSelected ? 'text-[#c9a227] font-extrabold' : 'text-gray-200'}`} style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</strong>
                          <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-gray-400">
                            <span className="text-[#c9a227]">📍</span> {m.venue}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="lg:col-span-3">
                {selectedMeetingId ? (
                  <div className="animate-fade-in delay-100">
                    <div className="flex flex-wrap gap-3 mb-8">
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").map(r => {
                        const isSelected = selectedRaceId === r.id;
                        return (
                          <button 
                            key={r.id} 
                            onClick={() => setSelectedRaceId(r.id)} 
                            className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${isSelected ? 'bg-gradient-to-r from-[#c9a227] via-[#f3d06c] to-[#c9a227] text-[#0e0c09] shadow-[0_0_20px_rgba(201,162,39,0.4)] scale-105 font-extrabold' : 'glass-panel text-gray-300 hover:text-white hover:border-[#c9a227]/50 border border-white/10'}`}
                          >
                            <span>🏆 RACE {r.id}</span>
                            <span className={`font-mono text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/20 text-[#0e0c09]' : 'bg-white/10 text-gray-400'}`}>
                              {r.classLevel}
                            </span>
                          </button>
                        );
                      })}
                      {meetingRaces.filter(r => r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED").length === 0 && <p className="text-gray-500 text-sm italic py-2">No official finished results for this meeting yet.</p>}
                    </div>
                    
                    {selectedRaceId && (
                      <div className="glow-cyber-card rounded-2xl p-6 md:p-8 animate-fade-in-up delay-200 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 relative z-10">
                          <span className="text-3xl drop-shadow-md">🏆</span>
                          <h4 className="font-bold text-2xl text-white tracking-wide text-gold-gradient" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Final Standings"}</h4>
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
                                              <div 
                                                className="truncate text-[#c9a227] font-bold cursor-pointer hover:underline" 
                                                style={{ fontFamily: "'Roboto Slab', serif" }}
                                                onClick={() => { if (e.horse?.id) { setSelectedHorseId(e.horse.id); setSelectedHorseName(e.horse.name); } }}
                                              >
                                                {e.horse?.name}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                                                <span 
                                                  className="cursor-pointer hover:text-blue-400"
                                                  onClick={() => { if (e.jockey?.id) setSelectedProfileId(e.jockey.id); }}
                                                >
                                                  J: {e.jockey?.fullName || e.jockey?.username || "—"}
                                                </span>
                                                <span 
                                                  className="cursor-pointer hover:text-green-400"
                                                  onClick={() => { if (e.owner?.id) setSelectedProfileId(e.owner.id); }}
                                                >
                                                  O: {e.owner?.fullName || e.owner?.username || "—"}
                                                </span>
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
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Fixtures"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.map((m, idx) => (
                <div key={m.id} className="glow-cyber-card rounded-2xl p-6 relative overflow-hidden group border border-[#c9a227]/30 transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                  <h4 className="font-bold text-xl text-white mb-4 group-hover:text-[#c9a227] transition-colors" style={{ fontFamily: "'Roboto Slab', serif" }}>{m.name}</h4>
                  <div className="space-y-2 relative z-10 w-full">
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[#c9a227] font-bold">ID</span>
                      <span className="font-bold text-white">#{m.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-blue-400">📍</span>
                      <span className="truncate">{m.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300 font-mono bg-[#14120f]/80 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[#c9a227]">📅</span>
                      <span>{formatDate(m.startDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && (
                <div className="col-span-full py-12 text-center glass-panel rounded-2xl border-dashed border-[#2a2825]">
                  <p className="text-gray-500 font-mono text-sm">{"No fixtures scheduled."}</p>
                </div>
              )}
            </div>
          </div>
        );
      case "statistics":
        const getHorseRating = (h: any): number =>
          Number(h.currentRating ?? h.current_rating ?? h.rating ?? 0) || 0;
        const topHorses = [...horses]
          .filter(h => getHorseRating(h) > 0)
          .sort((a, b) => getHorseRating(b) - getHorseRating(a))
          .slice(0, 10);
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
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase drop-shadow-lg" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Statistics & Leaderboards"}</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#c9a227]/60 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Horses */}
              <div className="glow-cyber-card rounded-2xl p-6 relative overflow-hidden border border-[#c9a227]/30">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl">🐎</span>
                  <h4 className="font-bold text-xl text-white tracking-wide text-[#c9a227]" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Leading Horses (Top Rating)"}</h4>
                </div>
                <div className="space-y-3 relative z-10 w-full">
                  {topHorses.map((h, idx) => (
                    <div 
                      key={h.id} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-[#14120f]/80 border border-white/5 hover:border-[#c9a227]/40 transition-colors cursor-pointer hover:bg-white/[0.04]"
                      onClick={() => { setSelectedHorseId(h.id); setSelectedHorseName(h.name); }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/50' : 'bg-[#2a2825] text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-200 truncate hover:text-[#c9a227]">{h.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">{h.breed}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{"Rating"}</div>
                        <div className="font-mono font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20 inline-block">{getHorseRating(h)}</div>
                      </div>
                    </div>
                  ))}
                  {topHorses.length === 0 && <p className="text-gray-500 text-sm text-center py-4 italic">{"No horse data available."}</p>}
                </div>
              </div>

              {/* Top Jockeys */}
              <div className="glow-cyber-card rounded-2xl p-6 relative overflow-hidden border border-[#c9a227]/30">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="text-2xl">👤</span>
                  <h4 className="font-bold text-xl text-white tracking-wide text-blue-400" style={{ fontFamily: "'Roboto Slab', serif" }}>{"Leading Jockeys (Top-3)"}</h4>
                </div>
                <div className="space-y-3 relative z-10">
                  {topJockeys.map((j, idx) => (
                    <div 
                      key={j.id} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-[#1a1815]/50 border border-white/5 hover:border-blue-500/40 transition-colors cursor-pointer hover:bg-white/[0.02]"
                      onClick={() => setSelectedProfileId(j.id)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-[#2a2825] text-gray-400'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-200 truncate hover:text-blue-400">{j.fullName || j.username}</div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {j.racesRun} {"Races"}
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
        return (
          <GenericTableView 
            title={"Registered Horse Registry"} 
            data={horses} 
            columns={[
              { key: "id", label: "ID" }, 
              { key: "name", label: "Horse Name" }, 
              { key: "breed", label: "Breed" }, 
              { key: "currentRating", label: "Rating" }
            ]} 
            onRowClick={(h) => { setSelectedHorseId(h.id); setSelectedHorseName(h.name); }}
          />
        );
      case "jockeys_owners":
        const jockeyList = users.filter(u => u.roleId === 3);
        const ownerList = users.filter(u => u.roleId === 2);

        return (
          <div className="animate-fade-in-up space-y-6">
            {/* Directory Tables */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
              <GenericTableView 
                title={"Jockey Directory"} 
                data={jockeyList
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
                  { key: "jockeyWeight", label: "Weight" },
                  { key: "racesRun", label: "Races" },
                  { key: "top3Finishes", label: "Top 3" },
                  { key: "top3Rate", label: "Top 3 %" }
                ]} 
                onRowClick={(u) => setSelectedProfileId(u.id)}
              />
              <GenericTableView 
                title={"Owner Directory"} 
                data={ownerList.map(u => {
                  const owned = horses.filter(h => h.ownerId === u.id);
                  const totalWins = owned.reduce((sum, h) => sum + (h.totalWins || 0), 0);
                  const maxRating = owned.reduce((max, h) => Math.max(max, h.currentRating || 0), 0);
                  return {
                    ...u,
                    stableSize: owned.length > 0 ? `${owned.length} Horses` : "0 Horses",
                    totalWins: totalWins,
                    maxRating: maxRating > 0 ? maxRating : "—"
                  };
                })} 
                columns={[
                  { key: "id", label: "ID" }, 
                  { key: "fullName", label: "Horse Owner" },
                  { key: "stableSize", label: "Active Stable" },
                  { key: "totalWins", label: "Total Wins" },
                  { key: "maxRating", label: "Max Rating" }
                ]} 
                onRowClick={(u) => setSelectedProfileId(u.id)}
              />
            </div>
          </div>
        );
      case "incident":
        return (
          <GenericTableView 
            title={"Violation Incident Reports"} 
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
          </div>

          {/* Search Bar (Uiverse 0xnihilism Glitch Cyberpunk Input) */}
          <div className="uiverse-glitch-container" style={{ flex: isMobile ? "none" : 1, marginLeft: isMobile ? "0" : "1.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="2.5" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", zIndex: 3, pointerEvents: "none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              className="uiverse-glitch-input"
              type="text"
              placeholder="Search horses, jockeys, owners..."
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
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(""); setView("home"); }}
                style={{ position: "absolute", right: "28px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#c9a227", cursor: "pointer", fontSize: "14px", zIndex: 4, fontWeight: "bold" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls (Desktop Only) */}
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", fontSize: "0.7rem", fontFamily: "monospace", color: "#a0a0a0" }}>
              {/* Auth Controls */}
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingLeft: "1rem" }}>
                  {/* Notification Bell Button with Vertical Downward Hover Dropdown */}
                  <div className="relative group z-50">
                    <button
                      onClick={() => setShowNotifications(v => !v)}
                      title="Notifications"
                      className="relative w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/50 flex items-center justify-center text-amber-400 transition cursor-pointer active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"></path>
                      </svg>
                      {unreadNotifCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-black animate-pulse" />
                      )}
                    </button>

                    {/* Downward Hover Dropdown Drawer Panel */}
                    <div className="absolute right-0 top-[125%] w-80 max-h-96 bg-[#181613] border border-amber-500/35 rounded-xl shadow-2xl shadow-black/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-50 overflow-hidden flex flex-col">
                      {/* Drawer Header */}
                      <div className="p-3 border-b border-white/10 bg-amber-500/10 flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-amber-200 flex items-center gap-1.5">
                          🔔 Notifications ({unreadNotifCount})
                        </span>
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={handleMarkAllNotifsRead}
                            className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Drawer Body */}
                      <div className="p-2 overflow-y-auto max-h-72 space-y-1 divide-y divide-white/5 font-mono">
                        {dbNotifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-white/40 italic">
                            No notifications yet.
                          </div>
                        ) : (
                          dbNotifications.map((noti) => (
                            <div
                              key={noti.id}
                              onClick={() => handleMarkNotifRead(noti.id)}
                              className={`p-2 rounded-lg text-xs transition cursor-pointer ${noti.isRead ? 'bg-transparent opacity-60' : 'bg-amber-500/10 border-l-2 border-amber-500'}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-amber-200 text-xs truncate">{noti.title || "Notification"}</span>
                                <span className="text-[9px] text-white/40">{formatDate(noti.createdAt)}</span>
                              </div>
                              <p className="text-[10px] text-white/70 mt-1 line-clamp-2">{noti.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

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
                  <button onClick={() => { logout(); }} className="uiverse-hover-btn" style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.75rem", paddingLeft: "1rem", borderLeft: "1px solid #2a2825", marginLeft: "0.25rem", fontFamily: "sans-serif" }}>{"Sign Out"}</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "0.75rem", borderLeft: "1px solid #2a2825" }}>
                  <Link to="/login" className="uiverse-hover-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.75rem", borderRadius: "0.25rem", background: "#c9a227", color: "#0e0c09", textDecoration: "none", fontFamily: "monospace", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    👤 {"Sign In"}
                  </Link>
                  <Link to="/register" className="uiverse-styled-register-btn">
                    {"Register"}
                    <div className="inner-button">
                      <svg
                        id="Arrow"
                        viewBox="0 0 32 32"
                        xmlns="http://www.w3.org/2000/svg"
                        className="icon"
                      >
                        <defs>
                          <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient">
                            <stop style={{ stopColor: "#FFFFFF", stopOpacity: 1 }} offset="0%"></stop>
                            <stop style={{ stopColor: "#AAAAAA", stopOpacity: 1 }} offset="100%"></stop>
                          </linearGradient>
                        </defs>
                        <path
                          fill="url(#iconGradient)"
                          d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z"
                        ></path>
                      </svg>
                    </div>
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
                          💼 {"Dashboard"}
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
                          👤 {"Profile"}
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
                          🚪 {"Sign Out"}
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
                          👤 {"Sign In"}
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
                          📝 {"Register"}
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
                      💼 {"Dashboard"}
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
                      👤 {"Profile"}
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
                      🚪 {"Sign Out"}
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
                      👤 {"Sign In"}
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
                      📝 {"Register"}
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Scrollable Nav Items */}
            {!isMobile && (
              <div className="scrollbar-hide" style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingRight: "1.5rem" }}>
                {SUB_NAV.map(n => {
                  const active = view === n.key;
                  return (
                    <button
                      key={n.key}
                      className={`uiverse-tab-btn ${active ? "active" : ""}`}
                      onClick={() => setView(n.key)}
                    >
                      <span className="circle"></span>
                      <span className="tab-text">{n.label}</span>
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


      {/* Profile & Horse performance detail modals */}
      {selectedProfileId !== null && (
        <ProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />
      )}
      {selectedHorseId !== null && (
        <HorsePerformanceModal
          horseId={selectedHorseId}
          horseName={selectedHorseName}
          onClose={() => { setSelectedHorseId(null); setSelectedHorseName(""); }}
        />
      )}

      {/* ── CHATBOT ─────────────────────────────── */}
      <ChatBot lang={lang} setLang={setLang} />

    </div>

  );
}

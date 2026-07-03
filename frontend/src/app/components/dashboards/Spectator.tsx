import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import DashboardLayout, { Icon } from "../layout/DashboardLayout";
import ProfileTab from "./components/ProfileTab";
import ViewLive from "./components/ViewLive";
import ProfileModal from "./components/ProfileModal";
import HorsePerformanceModal from "./components/HorsePerformanceModal";

type SpectatorTab = "home" | "live" | "racecard" | "results" | "horses" | "stats" | "ai-assistant" | "profile";

const ROLE_COLOR = "#ef4444";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Overview",   view: "home"         },
  { index: "02", icon: "tv",               label: "Live Watch", view: "live"         },
  { index: "03", icon: "info",             label: "Racecard",   view: "racecard"     },
  { index: "04", icon: "award",            label: "Results",    view: "results"      },
  { index: "05", icon: "activity",         label: "Horses",     view: "horses"       },
  { index: "06", icon: "bar-chart-3",      label: "Statistics", view: "stats"        },
  { index: "07", icon: "mail",             label: "AI Assistant", view: "ai-assistant" },
];

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  time: string;
}

export default function Spectator() {
  const { user } = useAuth();
  const lang = localStorage.getItem("app-lang") || "vi";

  const [activeTab, setActiveTab] = useState<SpectatorTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as SpectatorTab) || "home";
  });
  
  const [meetings, setMeetings] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Live stream cross-navigation state
  const [selectedLiveRaceId, setSelectedLiveRaceId] = useState<number | null>(null);

  // Profile modal state (for jockey profiles)
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Horse performance modal state
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [selectedHorseName, setSelectedHorseName] = useState<string>("");

  // Expandable Racecard State
  const [expandedRaceId, setExpandedRaceId] = useState<number | null>(null);
  const [raceDetails, setRaceDetails] = useState<Record<number, any[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const welcome = lang === "vi" 
      ? "Chào bạn! Tôi là trợ lý AI. Hỏi tôi về ngựa, nài, xếp hạng rating hoặc dự đoán trận đấu nhé."
      : "Hello! I am your AI Assistant. Ask me about horses, ratings, jockeys, or race predictions!";
    return [{
      sender: "ai",
      text: welcome,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }];
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<any[]>("/public/meetings").catch(() => []),
      api.get<any[]>("/public/races").catch(() => []),
      api.get<any[]>("/public/horses").catch(() => []),
    ]).then(([m, r, h]) => {
      setMeetings(Array.isArray(m) ? m : []);
      setRaces(Array.isArray(r) ? r : []);
      setHorses(Array.isArray(h) ? h : []);
    });
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Overview";

  const handleToggleRaceDetails = async (raceId: number) => {
    if (expandedRaceId === raceId) {
      setExpandedRaceId(null);
      return;
    }
    setExpandedRaceId(raceId);

    if (!raceDetails[raceId]) {
      setLoadingDetails(prev => ({ ...prev, [raceId]: true }));
      try {
        const data = await api.get<any[]>(`/public/results?raceId=${raceId}`);
        setRaceDetails(prev => ({ ...prev, [raceId]: data }));
      } catch (err: any) {
        console.error("Failed to load race details", err);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [raceId]: false }));
      }
    }
  };

  const handleSendChatMessage = async (messageText: string) => {
    if (!messageText.trim() || chatLoading) return;
    
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = { sender: "user", text: messageText.trim(), time };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post<any>("/public/chat", { message: messageText, lang });
      const aiMsg: ChatMessage = {
        sender: "ai",
        text: res.reply || res.data?.reply || "I couldn't process that response.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorReply: ChatMessage = {
        sender: "ai",
        text: lang === "vi" 
          ? "Rất tiếc, đã có lỗi kết nối đến máy chủ AI. Xin vui lòng thử lại sau."
          : "Sorry, I encountered a connection error. Please try again later.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, errorReply]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to calculate AI win probability on the frontend
  const calculateWinProbabilities = (entries: any[]) => {
    if (!entries || entries.length === 0) return [];
    
    // 1. Calculate prediction scores
    const scoredEntries = entries.map(item => {
      const horse = item.horse || {};
      const jockey = item.jockey || {};
      
      const horseWinRate = horse.totalRaces > 0 ? (horse.totalWins / horse.totalRaces) * 100 : 0;
      const jockeySkill = jockey.totalRacesParticipated > 0 ? (jockey.totalTop3Finishes / jockey.totalRacesParticipated) * 100 : 0;
      const ratingScore = horse.currentRating || 52;
      
      // Dynamic weighted prediction score matching server logic
      let score = (horseWinRate * 0.40) + (jockeySkill * 0.30) + (ratingScore * 0.30);
      if (score <= 0) score = 20; // baseline score for new runners
      
      return {
        ...item,
        rawScore: score
      };
    });

    // 2. Sum scores and calculate normalized percentage
    const totalScore = scoredEntries.reduce((sum, item) => sum + item.rawScore, 0);
    
    return scoredEntries.map(item => ({
      ...item,
      probability: totalScore > 0 ? (item.rawScore / totalScore) * 100 : (100 / entries.length)
    })).sort((a, b) => b.probability - a.probability);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>
                {lang === "vi" ? "Chào mừng đến với Hệ Thống Quản Lý Đua Ngựa" : "Welcome to Horse Race Management System"}
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                {lang === "vi" ? "Chọn một mục từ menu bên trái để bắt đầu." : "Select an option from the menu on the left to get started."}
              </p>
            </div>

            {/* Upcoming Meetings */}
            <div>
              <h3 style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "1.1rem", color: "#c9a227", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid #2a2825", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                {lang === "vi" ? "Buổi đua sắp diễn ra" : "Upcoming Race Meetings"}
              </h3>
              {meetings.length === 0
                ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace", fontSize: "0.875rem" }}>{lang === "vi" ? "Không có buổi đua nào được lên lịch." : "No upcoming meetings scheduled."}</p>
                : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
                  {meetings.slice(0, 6).map((m: any) => (
                    <div key={m.id} className="rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", transition: "border-color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.4)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                        <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{m.name}</h4>
                        <span style={{ fontSize: "0.55rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", background: "rgba(74,157,111,0.15)", color: "#4a9d6f", whiteSpace: "nowrap" }}>Active</span>
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>📍 {m.venue}</p>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>📅 {m.startDate || m.date}</p>
                      {m.totalBudget && <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>💰 ${(m.totalBudget).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        );

      case "live":
        return <ViewLive preselectedRaceId={selectedLiveRaceId} onClearPreselect={() => setSelectedLiveRaceId(null)} />;

      case "racecard":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{lang === "vi" ? "Thông tin trận đấu (Racecard)" : "Racecard"}</h3>
            {races.length === 0
              ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{lang === "vi" ? "Chưa có trận đấu nào được tạo." : "No races available."}</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {races.map((r: any) => {
                  const isExpanded = expandedRaceId === r.id;
                  const entries = raceDetails[r.id] || [];
                  const loading = loadingDetails[r.id];
                  const sortedEntries = calculateWinProbabilities(entries);

                  return (
                    <div key={r.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: isExpanded ? "1px solid rgba(201,162,39,0.3)" : "1px solid rgba(255,255,255,0.08)", transition: "all 0.25s" }}>
                      <div 
                        onClick={() => handleToggleRaceDetails(r.id)}
                        style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", cursor: "pointer" }}
                      >
                        <div>
                          <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "1rem" }}>{r.classLevel ?? `Race #${r.id}`}</h4>
                          <p style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.25rem" }}>{r.distanceMeters}m · {r.trackType} · {r.startTime}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", fontWeight: 700, padding: "0.25rem 0.625rem", borderRadius: "0.25rem", background: r.status === "RUNNING" ? "rgba(239,68,68,0.12)" : r.status === "FINISHED" ? "rgba(74,222,128,0.1)" : "rgba(201,162,39,0.1)", color: r.status === "RUNNING" ? "#ef4444" : r.status === "FINISHED" ? "#4ade80" : "#c9a227" }}>
                            {r.status ?? "SCHEDULED"}
                          </span>
                          <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "1.25rem", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          {loading ? (
                            <div style={{ textAlign: "center", color: "#a0a0a0", padding: "1rem", fontSize: "12px", fontFamily: "monospace" }}>
                              {lang === "vi" ? "Đang tải dữ liệu và phân tích tỷ lệ thắng AI..." : "Loading entries and computing AI Win Probabilities..."}
                            </div>
                          ) : sortedEntries.length === 0 ? (
                            <div style={{ textAlign: "center", color: "#a0a0a0", padding: "1rem", fontSize: "12px", fontStyle: "italic" }}>
                              {lang === "vi" ? "Chưa có nài ngựa đăng ký cho trận này." : "No entries registered for this race yet."}
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                              {/* Quick Navigation to Livestream */}
                              {(r.status === "RUNNING" || r.status === "SCHEDULED") && (
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => {
                                      setSelectedLiveRaceId(r.id);
                                      setActiveTab("live");
                                    }}
                                    style={{
                                      padding: "0.45rem 1rem",
                                      background: "#ef4444",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "0.375rem",
                                      fontSize: "11px",
                                      fontWeight: "bold",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.375rem",
                                      fontFamily: "monospace"
                                    }}
                                  >
                                    📺 {lang === "vi" ? "Xem Live Ngay" : "Watch Live stream"}
                                  </button>
                                </div>
                              )}

                              {/* AI Win Probability Header */}
                              <div>
                                <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#c9a227", textTransform: "uppercase", letterSpacing: "0.1rem", display: "block", marginBottom: "0.5rem" }}>
                                  🔮 AI Predictor Win Probability
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  {sortedEntries.map((item: any, idx: number) => {
                                    const prob = item.probability || 0;
                                    return (
                                      <div key={idx} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem", fontSize: "12px" }}>
                                          <span style={{ fontWeight: 600, color: "#f4f2ec" }}>
                                            Gate #{item.entry?.gateNumber || "N/A"} · {item.horse?.name} (
                                            <button
                                              onClick={e => { e.stopPropagation(); setSelectedProfileId(item.jockey?.id); }}
                                              style={{ background: "none", border: "none", cursor: "pointer", color: "#fbbf24", textDecoration: "underline", fontWeight: "bold", padding: 0, fontSize: "inherit" }}
                                            >
                                              {item.jockey?.username}
                                            </button>
                                            )
                                          </span>
                                          <span style={{ fontFamily: "monospace", color: "#c9a227", fontWeight: "bold" }}>
                                            {prob.toFixed(1)}%
                                          </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                                          <div style={{ width: `${prob}%`, height: "100%", background: "linear-gradient(90deg, #c9a227, #f59e0b)", borderRadius: 3 }} />
                                        </div>
                                        {/* Carried weight information */}
                                        <div style={{ marginTop: "0.25rem", fontSize: "10px", color: "#a0a0a0", fontFamily: "monospace", display: "flex", gap: "1rem" }}>
                                          <span>Carried Weight: {item.entry?.carriedWeight} kg</span>
                                          <span>Horse Rating: {item.horse?.currentRating}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
          </div>
        );

      case "results":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{lang === "vi" ? "Kết quả chính thức" : "Race Results"}</h3>
            <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid #2a2825" }}>
                    {["Race", "Distance", "Track", "Status", "Start Time"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.65rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: ROLE_COLOR }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").length === 0
                    ? <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0", fontStyle: "italic" }}>{lang === "vi" ? "Chưa có trận đấu nào hoàn thành." : "No completed races yet."}</td></tr>
                    : races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").map((r: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontSize: "0.8rem", fontWeight: 700 }}>{r.classLevel ?? `Race #${r.id}`}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.75rem" }}>{r.distanceMeters}m</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontSize: "0.75rem" }}>{r.trackType}</td>
                        <td style={{ padding: "0.75rem 1rem" }}><span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>{r.status}</span></td>
                        <td style={{ padding: "0.75rem 1rem", color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.7rem" }}>{r.startTime}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "horses":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{lang === "vi" ? "Danh sách Chiến mã" : "Horses Directory"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {horses.length === 0
                ? <p style={{ color: "#a0a0a0", fontStyle: "italic", fontFamily: "monospace" }}>{lang === "vi" ? "Không tìm thấy ngựa đã đăng ký." : "No horses registered yet."}</p>
                : horses.map((h: any) => (
                  <div
                    key={h.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "border-color 0.2s, transform 0.15s" }}
                    onClick={() => { setSelectedHorseId(h.id); setSelectedHorseName(h.name); }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,162,39,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  >
                    {h.avatar
                      ? <img src={h.avatar} alt={h.name} style={{ width: "100%", height: "9rem", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "9rem", background: "#0e0c09", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a3835", fontFamily: "monospace", fontSize: "0.7rem" }}>NO IMAGE</div>}
                    <div style={{ padding: "0.875rem" }}>
                      <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{h.name}</h4>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{h.breed}</p>
                      <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                        <span style={{ color: "#a0a0a0", fontFamily: "monospace" }}>Rating: <strong style={{ color: "#c9a227" }}>{h.currentRating}</strong></span>
                        <span style={{ color: "#a0a0a0", fontFamily: "monospace" }}>W: {h.totalWins ?? 0}</span>
                      </div>
                      <p style={{ fontSize: "0.6rem", color: "#c9a227", fontFamily: "monospace", marginTop: "0.4rem", textAlign: "center" }}>Click to view performance →</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "stats":
        return (
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.25rem", color: "#f4f2ec", marginBottom: "1rem" }}>{lang === "vi" ? "Thống kê tổng quan" : "Statistics"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: lang === "vi" ? "Tổng buổi đua" : "Total Meetings", value: meetings.length, color: "#c9a227" },
                { label: lang === "vi" ? "Tổng trận đấu" : "Total Races",    value: races.length,    color: "#ef4444" },
                { label: lang === "vi" ? "Tổng số ngựa" : "Total Horses",   value: horses.length,   color: "#4a9d6f" },
                { label: lang === "vi" ? "Trận hoàn thành" : "Completed Races", value: races.filter(r => r.status === "FINISHED" || r.status === "OFFICIAL").length, color: "#3b82c4" },
              ].map(s => (
                <div key={s.label} className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", color: "#a0a0a0", display: "block", marginBottom: "0.25rem" }}>{s.label}</span>
                  <span style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl" style={{ background: "rgba(21,19,16,0.6)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", textAlign: "center" }}>
              <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.875rem" }}>📊 Detailed statistics and charts coming soon.</p>
            </div>
          </div>
        );

      case "ai-assistant":
        const SUGGESTIONS = lang === "vi" 
          ? ["Ngựa nào rating cao nhất?", "Dự đoán trận đấu Class 2", "Thống kê nài ngựa xuất sắc nhất"]
          : ["Who has the highest rating?", "Predict the upcoming Class 2 race", "Give me top jockey stats"];

        return (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 12rem)", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.2)", borderRadius: "1rem", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.5rem", background: "rgba(21,19,16,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontWeight: "bold", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "14px" }}>
                  🤖 {lang === "vi" ? "Trợ lý ảo AI Đua Ngựa" : "AI Horse Racing Assistant"}
                </h4>
                <p style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "2px" }}>
                  {lang === "vi" ? "Tìm kiếm thông tin, tỷ lệ thắng, phong độ thời gian thực." : "Search ratings, win rates, and current form in real-time."}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }} className="scrollbar-hide">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.sender === "ai";
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end" }}>
                    <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isAI ? "flex-start" : "flex-end" }}>
                      <div style={{ fontSize: "10px", color: "#888", marginBottom: "0.25rem", fontFamily: "monospace" }}>
                        {isAI ? "AI Assistant" : "You"} · {msg.time}
                      </div>
                      <div style={{
                        padding: "0.75rem 1rem",
                        borderRadius: "0.75rem",
                        background: isAI ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.1)",
                        border: isAI ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(239,68,68,0.2)",
                        color: "#f4f2ec",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-line"
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#a0a0a0", fontSize: "12px", fontFamily: "monospace" }}>
                    ● ● ● AI is analyzing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            <div style={{ padding: "0.5rem 1.5rem", display: "flex", gap: "0.5rem", overflowX: "auto", borderTop: "1px solid rgba(255,255,255,0.03)" }} className="scrollbar-hide">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChatMessage(s)}
                  disabled={chatLoading}
                  style={{
                    padding: "0.35rem 0.75rem",
                    background: "rgba(201,162,39,0.08)",
                    border: "1px solid rgba(201,162,39,0.15)",
                    borderRadius: "0.5rem",
                    color: "#c9a227",
                    fontSize: "11px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(201,162,39,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(201,162,39,0.08)"}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage(chatInput);
              }}
              style={{ padding: "1rem 1.5rem", background: "#151310", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "0.75rem" }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                placeholder={lang === "vi" ? "Hỏi trợ lý ảo AI đua ngựa..." : "Ask AI Assistant..."}
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.875rem",
                  color: "#fff",
                  outline: "none",
                  fontSize: "13px"
                }}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                {lang === "vi" ? "Gửi" : "Send"}
              </button>
            </form>
          </div>
        );

      case "profile":
        return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Spectator" />;

      default:
        return null;
    }
  };

  return (
    <>
      <DashboardLayout
        roleLabel="Spectator"
        roleColor={ROLE_COLOR}
        activeLabel={activeLabel}
        currentView={activeTab}
        navItems={NAV_ITEMS}
        onViewChange={v => { setActiveTab(v as SpectatorTab); setSuccessMsg(""); setErrorMsg(""); }}
        successMsg={successMsg}
        errorMsg={errorMsg}
      >
        {renderContent()}
      </DashboardLayout>
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
    </>
  );
}

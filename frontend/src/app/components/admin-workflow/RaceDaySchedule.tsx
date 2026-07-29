import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../../../lib/api";
import { formatDateTime, formatDate, formatForApi, parseSafeDate } from "../../utils/dateTimeHelper";
import InlineDateTimePicker from "../ui/InlineDateTimePicker";
import { confirm } from "../../../lib/confirm";

/**
 * Component RaceDaySchedule - Phân hệ hiển thị và lập Lịch trình Ngày hội đua (Race Day Schedule) dành cho Admin.
 * - Trình bày các thẻ thông số: Mùa giải, Tên buổi hội đua, Trường đua và Ngày đua.
 * - Lựa chọn buổi hội đua để hiển thị thời gian biểu chi tiết các cuộc đua diễn ra trong ngày đó.
 * - Tự động tải thông tin chi tiết của kỵ sĩ - chiến mã (Racecard Entries) và Trọng tài phân công của từng trận.
 * - Cho phép nhanh chóng thêm cuộc đua mới (Schedule a Race) hoặc hủy cuộc đua (Cancel Race).
 */
export default function RaceDaySchedule() {
  // Danh sách hội đua, hội đua đang được lựa chọn, danh sách mùa giải
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  // Danh sách các cuộc đua được làm giàu thông tin (Enriched races: gồm cả lượt chạy và trọng tài)
  const [enrichedRaces, setEnrichedRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [error, setError] = useState("");

  // --- Các State phục vụ Modal Thêm nhanh cuộc đua ---
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [classLevel, setClassLevel] = useState("Class 1 (Rating 95+)");
  const [trackType, setTrackType] = useState("Turf");
  const [startTime, setStartTime] = useState("");
  const [distance, setDistance] = useState("1200");
  const [minEntries, setMinEntries] = useState("3");
  const [maxEntries, setMaxEntries] = useState("12");
  const [purse, setPurse] = useState("0");

  // Tải danh sách buổi hội đua và mùa giải khi bắt đầu
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [meetingsData, seasonsData] = await Promise.all([
        api.get<any[]>("/races/meetings").catch(() => []),
        api.get<any[]>("/races/seasons").catch(() => []),
      ]);
      setMeetings(meetingsData);
      setSeasons(seasonsData);
      // Mặc định hiển thị ngày hội đua đầu tiên nếu có dữ liệu
      if (meetingsData.length > 0) {
        setSelectedMeetingId(meetingsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load schedule data.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tải chi tiết các trận đua của buổi hội đua cụ thể.
   * Để hiển thị chi tiết, hàm này thực hiện:
   * 1. Lấy danh sách cuộc đua theo meetingId và bản đồ trọng tài.
   * 2. Duyệt qua từng cuộc đua để kéo kết quả y tế/đăng ký thi đấu (/public/results?raceId=...) làm giàu thông tin chiến mã/kỵ sĩ.
   */
  const fetchRacesDetails = async (meetingId: number) => {
    setLoadingRaces(true);
    try {
      const [racesData, refereesMap] = await Promise.all([
        api.get<any[]>(`/public/races?meetingId=${meetingId}`),
        api.get<any>("/admin/races/referees").catch(() => ({}))
      ]);

      const enriched = await Promise.all(
        racesData.map(async (race) => {
          // Kéo thông tin chi tiết ngựa và kỵ sĩ đã được xếp cổng
          const resultsData = await api.get<any[]>(`/public/results?raceId=${race.id}`).catch(() => []);
          const mappedEntries = resultsData.map((item: any) => ({
            id: item.entry.id,
            gateNumber: item.entry.gateNumber,
            horseName: item.horse?.name || "Unknown",
            horseRating: item.horse?.currentRating || 0,
            jockeyName: item.jockey?.fullName || item.jockey?.username || "Unknown",
            jockeyWeight: item.jockey?.weight || 0,
            carriedWeight: item.entry.carriedWeight
          }));

          const raceReferees = refereesMap[race.id] || [];

          return { race, entries: mappedEntries, referees: raceReferees };
        })
      );
      setEnrichedRaces(enriched);
    } catch (err: any) {
      console.error("Failed to load race details:", err);
    } finally {
      setLoadingRaces(false);
    }
  };

  // Tải danh sách khi khởi tạo
  useEffect(() => {
    fetchData();
  }, []);

  // Tải chi tiết cuộc đua mỗi khi Admin đổi buổi hội đua trong dropdown
  useEffect(() => {
    if (selectedMeetingId !== null) {
      fetchRacesDetails(selectedMeetingId);
    }
  }, [selectedMeetingId]);

  // Tìm ngày hội đua và mùa giải hoạt động tương ứng để làm dữ liệu hiển thị thẻ thống kê
  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId);
  const activeSeason = selectedMeeting
    ? seasons.find((s) => s.id === selectedMeeting.seasonId)
    : seasons.find((s) => s.status === "ACTIVE");

  // Xử lý gửi biểu mẫu Lên lịch trận đua mới
  const handleScheduleRaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId) {
      alert("Please select a race meeting first.");
      return;
    }
    const minVal = parseInt(minEntries);
    const maxVal = parseInt(maxEntries);
    if (isNaN(minVal) || minVal <= 0 || isNaN(maxVal) || maxVal <= 0) {
      alert("Min entries and Max entries must be positive integers.");
      return;
    }
    if (maxVal < minVal) {
      alert("Max entries cannot be less than Min entries.");
      return;
    }

    // Đảm bảo thời gian bắt đầu cuộc đua phải trùng khớp ngày tổ chức của hội đua đã chọn
    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (selectedMeeting) {
      const meetDate = parseSafeDate(selectedMeeting.startDate);
      const raceDate = parseSafeDate(startTime);
      if (meetDate && raceDate) {
        if (meetDate.getFullYear() !== raceDate.getFullYear() ||
            meetDate.getMonth() !== raceDate.getMonth() ||
            meetDate.getDate() !== raceDate.getDate()) {
          const pad = (n: number) => String(n).padStart(2, '0');
          const formattedMeetDate = `${pad(meetDate.getDate())}-${pad(meetDate.getMonth() + 1)}-${meetDate.getFullYear()}`;
          alert(`Race start time must be on the same date as the selected Race Meeting (${formattedMeetDate}).`);
          return;
        }
      }
    }

    try {
      await api.post("/races", {
        raceMeetingId: selectedMeetingId,
        classLevel,
        trackType,
        startTime: startTime,
        distanceMeters: parseInt(distance),
        minEntries: minVal,
        maxEntries: maxVal,
        purse: parseFloat(purse),
      });
      setShowScheduleModal(false); // Đóng Modal
      setStartTime("");
      fetchRacesDetails(selectedMeetingId); // Tải lại danh sách
    } catch (err: any) {
      const isVi = (localStorage.getItem("app-lang") || "vi") === "vi";
      // Xử lý lỗi trùng giờ chạy trong cùng ngày hội đua
      if (err.message?.includes("DUPLICATE_RACE_TIME")) {
        alert(isVi ? "Thời gian bắt đầu trận đấu trùng lặp với một trận đấu khác trong cùng buổi đua (Meeting)." : "Another race is already scheduled at this exact time for this meeting.");
      } else {
        alert("Failed to schedule race: " + err.message);
      }
    }
  };

  // Mở modal tạo cuộc đua mới, thiết lập giờ bắt đầu mặc định dựa theo ngày hội đua đang chọn
  const handleOpenScheduleModal = () => {
    if (!selectedMeetingId) {
      alert("Please select a race meeting first.");
      return;
    }
    const meeting = meetings.find(m => m.id === selectedMeetingId);
    if (meeting) {
      const dt = parseSafeDate(meeting.startDate);
      if (dt) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const dateStr = `${pad(dt.getDate())}-${pad(dt.getMonth() + 1)}-${dt.getFullYear()}`;
        setStartTime(`${dateStr} 13:00:00`); // Mặc định là 13h chiều cùng ngày hội đua
      }
    }
    setShowScheduleModal(true);
  };

  // Hủy bỏ cuộc đua
  const handleCancelRace = async (raceId: number) => {
    if (!await confirm("Are you sure you want to cancel this race?")) return;
    try {
      await api.post(`/admin/races/${raceId}/cancel`);
      if (selectedMeetingId) {
        fetchRacesDetails(selectedMeetingId);
      }
    } catch (err: any) {
      alert("Failed to cancel race: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", color: "#f4f2ec" }}>
      {/* Khối Banner báo lỗi */}
      {error && (
        <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Dòng Thẻ thống kê tổng quát */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* Thẻ Mùa giải */}
        <div style={cardStyle}>
          <p style={cardLabelStyle}>{$t("Season", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <p style={cardValStyle} title={activeSeason?.name}>
            {activeSeason?.name || "Championship Season"}
          </p>
          <p style={cardSubStyle}>{$t("Active Tournament", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        {/* Thẻ Ngày hội đua được chọn */}
        <div style={{ ...cardStyle, borderColor: "rgba(201,162,39,0.22)" }}>
          <p style={cardLabelStyle}>{$t("Race Meeting", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <p style={cardValStyle} title={selectedMeeting?.name}>
            {selectedMeeting?.name || "No Meeting Selected"}
          </p>
          <p style={{ ...cardSubStyle, color: "#c9a227" }}>● {$t("Scheduled Day", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        {/* Thẻ Địa điểm tổ chức */}
        <div style={cardStyle}>
          <p style={cardLabelStyle}>{$t("Track Venue", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <p style={cardValStyle} title={selectedMeeting?.venue}>
            {selectedMeeting?.venue || "Main Course"}
          </p>
          <p style={cardSubStyle}>{$t("Track Venue type", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

        {/* Thẻ ngày đua */}
        <div style={cardStyle}>
          <p style={cardLabelStyle}>{$t("Race Date", (localStorage.getItem('app-lang') || 'vi'))}</p>
          <p style={{ ...cardValStyle, fontFamily: "monospace" }}>
            {selectedMeeting ? formatDate(selectedMeeting.startDate || selectedMeeting.date) : "N/A"}
          </p>
          <p style={cardSubStyle}>
            {$t("Total Events:", (localStorage.getItem('app-lang') || 'vi'))} {enrichedRaces.length}
          </p>
        </div>
      </div>

      {/* KHUNG HIỂN THỊ CHÍNH (Main Container) */}
      <div className="rounded-xl border" style={{ background: "rgba(255,255,255,0.012)", borderColor: "rgba(255,255,255,0.05)" }}>
        
        {/* Header khung chính đi kèm dropdown chọn buổi hội đua */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "0.9rem", color: "#f4f2ec" }}>{$t("Race Day Schedule", (localStorage.getItem('app-lang') || 'vi'))}</h4>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem" }}>{$t("Official operational timeline for the upcoming race fixture", (localStorage.getItem('app-lang') || 'vi'))}</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={handleOpenScheduleModal}
              style={{
                padding: "0.5rem 1rem",
                background: "#c9a227",
                color: "#0b0d11",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.1s"
              }}
            >
              + Schedule a Race
            </button>
            {/* Bộ chọn hội đua */}
            <select
              value={selectedMeetingId || ""}
              onChange={(e) => setSelectedMeetingId(parseInt(e.target.value, 10))}
              style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.5rem", color: "#f4f2ec", fontSize: "12px", fontFamily: "monospace", outline: "none", cursor: "pointer" }}
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id} style={{ background: "#12141a" }}>
                  {m.name} {m.id === selectedMeetingId ? $t("(Current)", (localStorage.getItem('app-lang') || 'vi')) : ""}
                </option>
              ))}
              {meetings.length === 0 && (
                <option value="">{$t("No meetings available", (localStorage.getItem('app-lang') || 'vi'))}</option>
              )}
            </select>
          </div>
        </div>

        {/* Nội dung danh sách các cuộc đua thuộc ngày tổ chức hội đua đó */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {loadingRaces ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "2rem" }}>{$t("Loading schedule timeline...", (localStorage.getItem('app-lang') || 'vi'))}</p>
          ) : enrichedRaces.length > 0 ? (
            enrichedRaces.map((item) => {
              const r = item.race;
              return (
                <div key={r.id} className="rounded-xl border" style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.04)", padding: "1.25rem" }}>
                  
                  {/* Dòng tiêu đề trận đua kèm nhãn trạng thái và nút hủy */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", color: "#c9a227" }}>{$t("Race", (localStorage.getItem('app-lang') || 'vi'))} #{r.id}</span>
                        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#f4f2ec" }}>{r.classLevel}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                        {$t("Time:", (localStorage.getItem('app-lang') || 'vi'))} {formatDateTime(r.startTime)} | {$t("Distance:", (localStorage.getItem('app-lang') || 'vi'))} {r.distanceMeters}m | {$t("Track:", (localStorage.getItem('app-lang') || 'vi'))} {r.trackType}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "9px",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        background: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "rgba(16,185,129,0.1)" : r.status === "RUNNING" ? "rgba(239,68,68,0.1)" : r.status === "CANCELLED" ? "rgba(156,163,175,0.1)" : "rgba(245,158,11,0.1)",
                        color: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "#10b981" : r.status === "RUNNING" ? "#ef4444" : r.status === "CANCELLED" ? "#9ca3af" : "#f59e0b",
                        border: r.status === "OFFICIAL" || r.status === "RACE_EVENT_ENDED" ? "1px solid rgba(16,185,129,0.2)" : r.status === "RUNNING" ? "1px solid rgba(239,68,68,0.2)" : r.status === "CANCELLED" ? "1px solid rgba(156,163,175,0.2)" : "1px solid rgba(245,158,11,0.2)"
                      }}>
                        {r.status}
                      </span>
                      {r.status !== "CANCELLED" && r.status !== "OFFICIAL" && r.status !== "RACE_EVENT_ENDED" && (
                        <button
                          onClick={() => handleCancelRace(r.id)}
                          style={{
                            padding: "0.25rem 0.5rem",
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "0.25rem",
                            fontSize: "10px",
                            fontFamily: "monospace",
                            cursor: "pointer",
                          }}
                        >{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
                      )}
                    </div>
                  </div>

                  {/* Bảng chi tiết cuộc đua (Cột trọng tài phân công và Cột thẻ đua chiến mã/kỵ sĩ) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="lg:grid-cols-3">
                    
                    {/* Cột 1: Danh sách trọng tài được giao nhiệm vụ */}
                    <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)", paddingRight: "1rem" }}>
                      <h5 style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>{$t("Assigned Referees", (localStorage.getItem('app-lang') || 'vi'))}</h5>
                      {item.referees && item.referees.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                          {item.referees.map((ref: any) => (
                            <div key={ref.id} style={{ padding: "0.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.25rem", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                              {ref.username}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{$t("No referees assigned.", (localStorage.getItem('app-lang') || 'vi'))}</p>
                      )}
                    </div>

                    {/* Cột 2: Bảng thẻ đua (Chiến mã, kỵ sĩ, cổng xuất phát, cân nặng gánh) */}
                    <div className="lg:col-span-2">
                      <h5 style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", textTransform: "uppercase", color: "#c9a227", marginBottom: "0.5rem" }}>{$t("Racecard Entries", (localStorage.getItem('app-lang') || 'vi'))}</h5>
                      {item.entries && item.entries.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                                <th style={{ padding: "0.5rem 0.25rem", textAlign: "left" }}>{$t("Gate", (localStorage.getItem('app-lang') || 'vi'))}</th>
                                <th style={{ padding: "0.5rem", textAlign: "left" }}>{$t("Horse (Rating)", (localStorage.getItem('app-lang') || 'vi'))}</th>
                                <th style={{ padding: "0.5rem", textAlign: "left" }}>{$t("Jockey (Weight)", (localStorage.getItem('app-lang') || 'vi'))}</th>
                                <th style={{ padding: "0.5rem", textAlign: "right" }}>{$t("Carried Wt", (localStorage.getItem('app-lang') || 'vi'))}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.entries.map((entryInfo: any) => (
                                <tr key={entryInfo.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                                  <td style={{ padding: "0.5rem 0.25rem", fontSize: "12px", fontFamily: "monospace", color: "#fff", fontWeight: "bold" }}>{entryInfo.gateNumber}</td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px" }}>
                                    <span style={{ color: "#fff", fontWeight: 500 }}>{entryInfo.horseName}</span>
                                    <span style={{ color: "#c9a227", fontSize: "10px", fontFamily: "monospace", marginLeft: "4px" }}>({entryInfo.horseRating})</span>
                                  </td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                                    <span>{entryInfo.jockeyName}</span>
                                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", fontFamily: "monospace", marginLeft: "4px" }}>({entryInfo.jockeyWeight}kg)</span>
                                  </td>
                                  <td style={{ padding: "0.5rem", fontSize: "12px", fontFamily: "monospace", color: "#fff", textAlign: "right" }}>{entryInfo.carriedWeight} kg</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{$t("No entries declared for this race yet.", (localStorage.getItem('app-lang') || 'vi'))}</p>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "2rem", fontSize: "12px", fontFamily: "monospace" }}>{$t("No scheduled events found for this meeting date.", (localStorage.getItem('app-lang') || 'vi'))}</p>
          )}
        </div>

        {/* Chân trang điều khiển timeline */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.005)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}></span>
            <span>{$t("Timeline operational and scheduler enabled", (localStorage.getItem('app-lang') || 'vi'))}</span>
          </div>
          <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>{$t("Last updated: Just now", (localStorage.getItem('app-lang') || 'vi'))}</p>
        </div>

      </div>

      {/* MODAL LÊN LỊCH CUỘC ĐUA MỚI (Schedule Race Modal) - Render ngoài document.body thông qua Portal */}
      {showScheduleModal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
          <div style={{ background: "#111217", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "1rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#111217", zIndex: 10 }}>
              <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "16px", color: "#f4f2ec" }}>{$t("Schedule New Race", (localStorage.getItem('app-lang') || 'vi'))}</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <form onSubmit={handleScheduleRaceSubmit} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Chọn Hạng thi đấu */}
              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Class Level", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <select value={classLevel} onChange={e => setClassLevel(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }}>
                  <option value="Class 1 (Rating 95+)">Class 1 (Rating 95+)</option>
                  <option value="Class 2 (Rating 80-94)">{$t("Class 2 (Rating 80-94)", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  <option value="Class 3 (Rating 60-79)">{$t("Class 3 (Rating 60-79)", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  <option value="Class 4 (Rating 40-59)">{$t("Class 4 (Rating 40-59)", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  <option value="Class 5 (Rating 0-39)">{$t("Class 5 (Rating 0-39)", (localStorage.getItem('app-lang') || 'vi'))}</option>
                </select>
              </div>

              {/* Chọn bề mặt sân chạy */}
              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Track Type", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <select value={trackType} onChange={e => setTrackType(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }}>
                  <option value="Turf">{$t("Turf", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  <option value="Dirt">{$t("Dirt", (localStorage.getItem('app-lang') || 'vi'))}</option>
                  <option value="Artificial">{$t("Artificial", (localStorage.getItem('app-lang') || 'vi'))}</option>
                </select>
              </div>

              {/* Bộ chọn Ngày giờ bắt đầu */}
              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Start Time", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <InlineDateTimePicker value={startTime} onChange={setStartTime} />
              </div>

              {/* Nhập Cự ly thi đấu */}
              <div>
                <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Distance (Meters)", (localStorage.getItem('app-lang') || 'vi'))}</label>
                <input type="number" min="1" value={distance} onChange={e => setDistance(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
              </div>

              {/* Nhập giới hạn ngựa đăng ký */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Min Entries", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="number" min="1" value={minEntries} onChange={e => setMinEntries(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.375rem", color: "rgba(255,255,255,0.4)" }}>{$t("Max Entries", (localStorage.getItem('app-lang') || 'vi'))}</label>
                  <input type="number" min="1" value={maxEntries} onChange={e => setMaxEntries(e.target.value)} required style={{ width: "100%", padding: "0.5rem", background: "#151310", border: "1px solid rgba(201,162,39,0.22)", color: "#f4f2ec", borderRadius: "0.375rem", fontSize: "12px" }} />
                </div>
              </div>

              {/* Các nút Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.375rem", color: "#a0a0a0", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}>{$t("Cancel", (localStorage.getItem('app-lang') || 'vi'))}</button>
                <button type="submit" style={{ padding: "0.5rem 1rem", background: "#c9a227", color: "#0b0d11", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "11px", fontFamily: "monospace", fontWeight: 700 }}>{$t("Confirm Schedule", (localStorage.getItem('app-lang') || 'vi'))}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

// Bảng thuộc tính định kiểu (Style tokens)
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.015)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "0.75rem",
  padding: "1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  fontFamily: "monospace",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.4)",
};

const cardValStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#f4f2ec",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  marginTop: "0.25rem",
};

const cardSubStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.3)",
  marginTop: "0.5rem",
};

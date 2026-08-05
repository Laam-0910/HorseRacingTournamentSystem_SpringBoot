import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../context/AuthContext";
import { api, getErrMsg } from "../../../lib/api";
import { confirm } from "../../../lib/confirm";
import { formatDateTime, formatClassLevel } from "../../utils/dateTimeHelper";
import { getYouTubeEmbedUrl } from "../../../lib/utils";
import CameraBroadcasterModal from "../livestream/CameraBroadcasterModal";
import WebCamLiveViewer, { BroadcasterInfo } from "../livestream/WebCamLiveViewer";
import { Pagination } from "../common/Pagination";

const PURPLE = "#8b5cf6";

// SVG Icon Helper
const ICONS: Record<string, JSX.Element> = {
  "arrow-left": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  "alert-triangle": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  "map-pin": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  "calendar": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  "activity": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  "check-square": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  "eye": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  "file-text": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>,
  "gavel": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-5 5 3 3 5-5z"/><path d="m16 16 5 5"/><path d="m9 18 5 5"/><path d="m14 13-9-9 3-3 9 9z"/></svg>,
  "thumbs-up": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3l3.15-4.57a2.11 2.11 0 0 1 2.2-.83 2 2 0 0 1 1.65 1.62z"/></svg>,
};

function Icon({ name, color }: { name: string; color?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return <span style={{ display: "inline-flex", color: color || "currentColor" }}>{icon}</span>;
}

const translateSex = (sex: string, lang?: string) => {
  return sex || "N/A";
};


const statusLabels: Record<string, string> = {
  SCHEDULED:          "Scheduled",
  DECLARATION_OPEN:   "Declaration Open",
  DECLARATION_CLOSED: "Declaration Closed",
  RACE_ASSIGNED:      "Race Assigned",
  RUNNING:            "Running",
  FINISHED:           "Finished",
  OFFICIAL:           "Official",
  STEWARDS_INQUIRY:   "Stewards Inquiry",
  CANCELLED:          "Cancelled",
  PENDING_ADMIN:      "Pending Admin",
  APPROVED:           "Approved",
  DISQUALIFIED:       "Disqualified",
  REJECTED:           "Rejected",
  STOPPED:            "Stopped"
};

function statusBadge(status: string, preCheckCompleted?: boolean) {
  if (!status) return null;
  const s = status.toUpperCase();
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.SCHEDULED },
    DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_OPEN },
    DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_CLOSED },
    RACE_ASSIGNED:      { bg: "rgba(139,92,246,0.1)",  color: "#a08cf6", label: statusLabels.RACE_ASSIGNED },
    RUNNING:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.RUNNING },
    FINISHED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.FINISHED },
    OFFICIAL:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.OFFICIAL },
    STEWARDS_INQUIRY:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.STEWARDS_INQUIRY },
    CANCELLED:          { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.CANCELLED },
    PENDING_ADMIN:      { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.PENDING_ADMIN },
    APPROVED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.APPROVED },
    DISQUALIFIED:       { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.DISQUALIFIED },
    REJECTED:           { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.REJECTED },
    STOPPED:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.STOPPED },
  };
  const c = cfg[s] ?? { bg: "rgba(255,255,255,0.05)", color: "#a0a0a0", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.65rem", fontFamily: "monospace", fontWeight: 500, background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, display: "inline-block" }} />
      {c.label}
    </span>
  );
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    totalAssignments: "Total Assignments",
    pendingCheck: "Pending Check/Supervision",
    completedRaces: "Completed Races",
    assignedRaces: "Assigned Races & Duties",
    inspectMonitor: "Inspect, monitor, and finalize results for races assigned to you.",
    loadingRaces: "Loading assigned races...",
    noRaces: "No races assigned to you at the moment.",
    startRace: "🟢 Start Race",
    startPreCheck: "☑ Start Pre-Race Check",
    gatesNotSet: "Gates Not Set",
    monitorRecord: "👁 Monitor & Record",
    confirmResults: "🔴 Confirm Results",
    stewardReport: "📄 Steward Report",
    backToHub: "Back to Referee Hub",
    warningGatesNotSet: "Warning: Starting gates are not fully configured. Please ask Admin to configure them before starting the race.",
    infoGatesSet: "Info: All starting gates are configured. You can start the race early by confirming the pre-race check below to transition the status to RUNNING immediately.",
    preRaceInspection: "Pre-Race inspection for",
    classLevel: "Class Level",
    distance: "Distance",
    trackType: "Track Type",
    weightCheckTitle: "Horse & Jockey Weight Check",
    weightCheckSub: "Verify carried weights, horse breeding, and equipment checks before opening the gates.",
    safetyCheck: "Safety Checklist Complete?",
    safetyCheckSub: "Ensure veterinarians have cleared all horses, jockeys are weighed out, and starting boxes are safe.",
    confirmPreCheck: "Confirm Pre-Race Check & Open Gates",
    liveSupervision: "Live supervision for",
    raceInProgress: "Race in Progress",
    emergencyStop: "🛑 Emergency Stop",
    recordViolation: "⚠️ Record Violation",
    activeRunners: "Active Runners",
    activeRunnersSub: "Competitors currently running on the track.",
    incidentsRecorded: "Incidents Recorded",
    incidentsRecordedSub: "Violations logged by stewards for this race.",
    noIncidents: "No incidents recorded. Clean race so far.",
    raceCompleted: "Race Completed?",
    raceCompletedSub: "Transition to the final results sheet to enter positions, race times, and submit your official report.",
    finishRaceEnter: "Finish Race & Enter Results",
    logRulesViolation: "Log Rules Violation",
    runner: "Runner (Horse / Jockey)",
    violationDesc: "Violation Description",
    assessedPenalty: "Assessed Penalty",
    severeDq: "Severe rules violation (Disqualify runner from the race immediately)",
    saveViolation: "Save Violation",
    finalResultEntry: "Final Result entry for",
    finalResultEntrySub: "Submit official positions, timings, disqualifications and compile the Steward's Report to distribute prizes and update ratings.",
    officialFinishingSheet: "Official Finishing Sheet",
    officialFinishingSheetSub: "Verify each horse's position and timing. Check the DQ column to disqualify a runner.",
    stewardOfficialReport: "Steward's Official Report",
    stewardOfficialReportSub: "Provide a written summary of the race, detailing any incident inquiries, warnings, or vet notes.",
    approveOfficial: "Approve & Declare Official",
    perfectWeight: "Perfect Weight",
    verified: "Verified",
    scratched: "SCRATCHED",
    criticalOverweight: "Critical Overweight (Max +1.0kg)",
    overweight: "Overweight",
    requiresLeadWeight: "Requires Lead Weight",
    gate: "Gate",
    jockeyDetails: "Jockey Details",
    horseDetails: "Horse Details",
    jockeyWeight: "Weigh-Out Weight (kg)",
    requiredWeight: "Required Weight",
    vetCheck: "Vet & Safety Check",
    status: "Status",
    cancel: "Cancel",
    close: "Close",
    weighInPassed: "Weigh-In Passed",
    underweightDiscrepancy: "UNDERWEIGHT DISCREPANCY",
    finalPosition: "Final Position",
    weighInWeight: "Weigh-In Weight (kg)",
    finishTime: "Finish Time",
    dq: "DQ",
    stewardReportModalTitle: "Steward's Official Report",
    resultsVerifiedAlert: "Results verified and submitted officially. Race closed.",
    submissionFailedAlert: "Submission failed: ",
    noReportCompiled: "No report was compiled for this race.",
    stopReasonPrompt: "Enter the reason for emergency race suspension (Steward's Report):",
    emergencyStopSuccess: "Emergency stop executed. Race status set to CANCELLED.",
    failedStopRace: "Failed to stop race: ",
    selectRunner: "-- Select Runner --",
    violationLoggedSuccess: "Incident violation logged successfully.",
    disqualifiedImmediately: "Incident logged and runner DISQUALIFIED immediately!",
    failedLogViolation: "Failed to log violation: ",
    suspendRace: "Suspend Race",
    resumeRace: "Resume Race",
    suspendReasonPrompt: "Enter the reason for race suspension (Steward's Report):",
    suspendRaceSuccess: "Race suspended. Status set to STOPPED.",
    failedSuspendRace: "Failed to suspend race: ",
    resumeRaceSuccess: "Race resumed. Status set to RUNNING.",
    failedResumeRace: "Failed to resume race: "
  }
};

export default function RefereeHub() {
  const { user } = useAuth();
  
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const t = TRANSLATIONS.en;

  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assignedPage, setAssignedPage] = useState(1);
  const [assignedPageSize, setAssignedPageSize] = useState(5);

  // Sub-view state
  const [activeView, setActiveView] = useState<"list" | "check" | "supervise" | "confirm">("list");
  const [selectedRace, setSelectedRace] = useState<any | null>(null);
  const [broadcasterRace, setBroadcasterRace] = useState<any | null>(null);
  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);

  // Pre-Check State
  const [weighedWeights, setWeighedWeights] = useState<Record<number, string>>({});
  const [vetChecks, setVetChecks] = useState<Record<number, string>>({});

  // Confirm Results State
  const [finalPositions, setFinalPositions] = useState<Record<number, string>>({});
  const [finishTimes, setFinishTimes] = useState<Record<number, string>>({});
  const [finishTimeErrors, setFinishTimeErrors] = useState<Record<number, string>>({});
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({});
  const [disqualifiedList, setDisqualifiedList] = useState<Record<number, boolean>>({});
  const [stewardReport, setStewardReport] = useState("");
  const [sortBy, setSortBy] = useState<"gate" | "rating">("gate");

  // Live Race Monitor State for Referee Supervision
  const [liveMonitorMode, setLiveMonitorMode] = useState<"floating" | "embedded" | "hidden">("floating");
  const [liveMonitorSize, setLiveMonitorSize] = useState<"small" | "medium" | "large">("small");
  const [broadcasterList, setBroadcasterList] = useState<BroadcasterInfo[]>([]);
  const [selectedBroadcasterId, setSelectedBroadcasterId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reasonModal, setReasonModal] = useState<{ type: "suspend" | "emergency"; title: string } | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, iframe, video, a")) return;
    setIsDragging(true);
    const defaultX = typeof window !== "undefined" ? window.innerWidth - (liveMonitorSize === "small" ? 380 : liveMonitorSize === "medium" ? 500 : 660) : 100;
    const defaultY = typeof window !== "undefined" ? window.innerHeight - (liveMonitorSize === "small" ? 250 : liveMonitorSize === "medium" ? 320 : 420) : 100;
    const currentX = dragPos ? dragPos.x : defaultX;
    const currentY = dragPos ? dragPos.y : defaultY;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 300, dragStartRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 180, dragStartRef.current.initialY + dy));
      setDragPos({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const renderLiveMonitorCard = (isEmbeddedMode: boolean) => {
    if (!selectedRace || liveMonitorMode === "hidden") return null;
    if (isEmbeddedMode && liveMonitorMode !== "embedded") return null;
    if (!isEmbeddedMode && liveMonitorMode !== "floating") return null;

    const embedUrl = selectedRace.youtubeLiveUrl ? getYouTubeEmbedUrl(selectedRace.youtubeLiveUrl) : null;

    const sizeWidth = isEmbeddedMode ? "100%" : (liveMonitorSize === "small" ? "360px" : liveMonitorSize === "medium" ? "480px" : "640px");
    const sizeHeight = isEmbeddedMode ? "360px" : (liveMonitorSize === "small" ? "210px" : liveMonitorSize === "medium" ? "280px" : "370px");

    return (
      <div
        onMouseDown={!isEmbeddedMode ? handleMouseDown : undefined}
        style={{
          width: sizeWidth,
          maxWidth: "100%",
          background: "#14151c",
          border: "1px solid rgba(201,162,39,0.3)",
          borderRadius: "0.875rem",
          boxShadow: isEmbeddedMode ? "0 8px 25px rgba(0,0,0,0.4)" : "0 15px 40px rgba(0,0,0,0.75)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: !isEmbeddedMode ? "fixed" : "relative",
          top: !isEmbeddedMode && dragPos ? `${dragPos.y}px` : !isEmbeddedMode ? "auto" : undefined,
          bottom: !isEmbeddedMode && !dragPos ? "20px" : undefined,
          right: !isEmbeddedMode && !dragPos ? "20px" : undefined,
          left: !isEmbeddedMode && dragPos ? `${dragPos.x}px` : undefined,
          zIndex: !isEmbeddedMode ? 9999 : 1,
          cursor: !isEmbeddedMode ? (isDragging ? "grabbing" : "grab") : "default",
          transition: isDragging ? "none" : "all 0.2s ease",
          marginBottom: isEmbeddedMode ? "1.5rem" : undefined,
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: "0.5rem 0.875rem",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          userSelect: "none"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} className="animate-pulse"></span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#f4f2ec", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              📺 LIVE MONITOR · Race #{selectedRace.id}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <button
              type="button"
              onClick={() => setShowViolModal(true)}
              style={{ padding: "3px 8px", fontSize: "10px", background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)", color: "#f87171", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}
              title="Record rule violation immediately"
            >
              <span>🚩</span> Record Violation
            </button>

            {/* Size selector for floating window */}
            {!isEmbeddedMode && (
              <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "0.25rem", padding: "2px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button type="button" onClick={() => setLiveMonitorSize("small")} style={{ padding: "1px 5px", fontSize: "9px", background: liveMonitorSize === "small" ? "#c9a227" : "transparent", color: liveMonitorSize === "small" ? "#000" : "#a0a0a0", border: "none", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}>S</button>
                <button type="button" onClick={() => setLiveMonitorSize("medium")} style={{ padding: "1px 5px", fontSize: "9px", background: liveMonitorSize === "medium" ? "#c9a227" : "transparent", color: liveMonitorSize === "medium" ? "#000" : "#a0a0a0", border: "none", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}>M</button>
                <button type="button" onClick={() => setLiveMonitorSize("large")} style={{ padding: "1px 5px", fontSize: "9px", background: liveMonitorSize === "large" ? "#c9a227" : "transparent", color: liveMonitorSize === "large" ? "#000" : "#a0a0a0", border: "none", borderRadius: "2px", cursor: "pointer", fontWeight: "bold" }}>L</button>
              </div>
            )}

            {/* Toggle Mode Button (Floating ↔ Embedded) */}
            <button
              type="button"
              onClick={() => setLiveMonitorMode(isEmbeddedMode ? "floating" : "embedded")}
              style={{ padding: "2px 6px", fontSize: "10px", background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.3)", color: "#c9a227", borderRadius: "0.25rem", cursor: "pointer", fontWeight: "bold", fontFamily: "monospace" }}
              title={isEmbeddedMode ? "Switch to Floating Movable Window" : "Switch to Embedded Mode Below Table"}
            >
              {isEmbeddedMode ? "📌 Floating" : "📌 Below Table"}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLiveMonitorMode("hidden")}
              style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "14px", padding: "0 4px", lineHeight: 1 }}
              title="Close Monitor"
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ height: sizeHeight, background: "#000", position: "relative", overflow: "hidden" }}>
          {(() => {
            const myBroadcasterPrefix = user?.id ? `user_${user.id}_` : null;

            return (
              <>
                {broadcasterList.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", padding: "4px 8px", background: "rgba(0,0,0,0.65)", position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.1)", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", color: "#a0a0a0", fontFamily: "monospace" }}>📡 Referee Cams ({broadcasterList.length}):</span>
                    {broadcasterList.map((b) => {
                      const isSelf = myBroadcasterPrefix && b.id.startsWith(myBroadcasterPrefix);
                      const isSelected = selectedBroadcasterId === b.id || (!selectedBroadcasterId && broadcasterList[broadcasterList.length - 1]?.id === b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBroadcasterId(b.id)}
                          style={{
                            padding: "2px 6px",
                            fontSize: "9px",
                            background: isSelected ? "#ef4444" : "rgba(255,255,255,0.15)",
                            color: "#fff",
                            border: isSelf ? "1px solid #fbbf24" : "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          }}
                        >
                          <span>📱</span> {isSelf ? `Your Cam (${b.name}) 🔴` : `Cam ${b.name}`}
                        </button>
                      );
                    })}
                  </div>
                )}

                <WebCamLiveViewer
                  raceId={selectedRace.id}
                  selectedBroadcasterId={selectedBroadcasterId}
                  onBroadcastersFound={list => setBroadcasterList(list)}
                />
              </>
            );
          })()}
        </div>
      </div>
    );

  };

  // Auto-calculate final positions whenever finishTimes or disqualifiedList changes
  useEffect(() => {
    if (activeView !== "confirm" || raceEntries.length === 0) return;

    const parseTimeToSecs = (str: string): number => {
      if (!str) return 999999;
      const clean = str.trim();
      if (clean === "DQ" || clean === "" || clean.toUpperCase() === "SCRATCH") {
        return 999999;
      }
      const parts = clean.split(":");
      if (parts.length === 2) {
        const mins = parseFloat(parts[0]);
        const secs = parseFloat(parts[1]);
        if (!isNaN(mins) && !isNaN(secs)) {
          return mins * 60 + secs;
        }
      }
      const val = parseFloat(clean);
      return isNaN(val) ? 999999 : val;
    };

    const activeEntries = raceEntries.map(item => {
      const entryId = item.entry.id;
      const isAlreadyDq = item.entry.status === "DISQUALIFIED";
      const isDq = disqualifiedList[entryId] || isAlreadyDq;
      const timeStr = finishTimes[entryId] || "";
      const seconds = parseTimeToSecs(timeStr);
      return { entryId, isDq, seconds, timeStr };
    });

    const runnersWithTimes = activeEntries.filter(e => !e.isDq && e.timeStr.trim() !== "");
    runnersWithTimes.sort((a, b) => a.seconds - b.seconds);

    let changed = false;
    const newPos = { ...finalPositions };

    raceEntries.forEach(item => {
      const entryId = item.entry.id;
      const isAlreadyDq = item.entry.status === "DISQUALIFIED";
      const isDq = disqualifiedList[entryId] || isAlreadyDq;
      if (isDq) {
        if (newPos[entryId] !== "") {
          newPos[entryId] = "";
          changed = true;
        }
      }
    });

    runnersWithTimes.forEach((runner, idx) => {
      const targetPos = (idx + 1).toString();
      if (newPos[runner.entryId] !== targetPos) {
        newPos[runner.entryId] = targetPos;
        changed = true;
      }
    });

    if (changed) {
      setFinalPositions(newPos);
    }
  }, [finishTimes, disqualifiedList, activeView, raceEntries, finalPositions]);

  // Record Violation Modal State
  const [showViolModal, setShowViolModal] = useState(false);
  const [violRunner, setViolRunner] = useState("");
  const [violDesc, setViolDesc] = useState("");
  const [violPenalty, setViolPenalty] = useState("");
  const [fineTarget, setFineTarget] = useState<"jockey" | "owner">("jockey");
  const [fineAmount, setFineAmount] = useState<string>("10000");
  const [isSevereDq, setIsSevereDq] = useState(false);

  // Notification Toast State (replacing raw window.alert popups)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Steward Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalContent, setReportModalContent] = useState("");
  const [reportModalRaceId, setReportModalRaceId] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchDashboard = () => {
    if (!user) return;
    setLoading(true);
    api.get<any>(`/referee/${user.id}/dashboard`)
      .then(res => {
        setAssignedRaces(res.assignedRaces || []);
        setCompletedCount(res.completedCount || 0);
        setPendingCount(res.pendingCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleStartCheck = async (race: any) => {
    setSelectedRace(race);
    setLoading(true);
    try {
      await api.post(`/admin/races/${race.id}/recalculate-weights`).catch(() => {});

      const data = await api.get<any[]>(`/public/results?raceId=${race.id}`);
      setRaceEntries(data || []);
      
      const wMap: Record<number, string> = {};
      const vMap: Record<number, string> = {};
      data.forEach((item: any) => {
        wMap[item.entry.id] = (item.entry.carriedWeight || item.jockey?.weight || 52.0).toString();
        vMap[item.entry.id] = "CLEARED";
      });
      setWeighedWeights(wMap);
      setVetChecks(vMap);
      setActiveView("check");
    } catch (err) {
      alert("Failed to load race entries.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheck = async () => {
    if (!selectedRace) return;
    setLoading(true);
    try {

      const activeCount = raceEntries.filter(item => vetChecks[item.entry.id] !== "SCRATCH").length;
      const minEntries = selectedRace.minEntries || 3;
      if (activeCount < minEntries) {
        alert('Cannot confirm pre-check. Active entries count (' + activeCount + ') is below the minimum required (' + minEntries + ') for this race.');
        setLoading(false);
        return;
      }
      
      for (const item of raceEntries) {
        const entryId = item.entry.id;
        const isScratched = vetChecks[entryId] === "SCRATCH";
        if (isScratched) continue;

        const reqWeight = item.entry.carriedWeight || 52.0;
        const weighed = parseFloat(weighedWeights[entryId]);
        if (isNaN(weighed)) {
          alert(`Please enter a valid weight for horse "${item.horse?.name}".`);
          setLoading(false);
          return;
        }

        const diff = weighed - reqWeight;
        if (diff < 0) {
          alert(`Cannot confirm pre-check. Horse "${item.horse?.name}" is underweight (weighed ${weighed} kg, required ${reqWeight} kg). Jockey must add lead weights to match required weight, or horse must be scratched.`);
          setLoading(false);
          return;
        }
        if (diff > 1.0) {
          notify(`Cannot confirm pre-check. Horse "${item.horse?.name}" is too overweight (+${diff.toFixed(1)} kg, limit is +1.0 kg). Jockey weight must be corrected, or horse must be scratched.`, "error");
          setLoading(false);
          return;
        }
      }

      const payloadEntries = raceEntries.map((item: any) => ({
        entryId: item.entry.id,
        weighOutWeight: parseFloat(weighedWeights[item.entry.id]),
        status: vetChecks[item.entry.id] === "SCRATCH" ? "REJECTED" : "APPROVED",
      }));
      await api.post("/referee/pre-check", {
        raceId: selectedRace.id,
        entries: payloadEntries,
      });
      notify("Pre-race check completed. The race is now ready to start!", "success");
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      notify(getErrMsg(err, "Pre-check failed: "), "error");
      setLoading(false);
    }
  };

  const handleStartRace = async (race: any) => {
    setLoading(true);
    try {
      await api.post(`/referee/races/${race.id}/start`);
      notify("Race started successfully. Now monitoring live!", "success");
      handleStartSupervise({ ...race, status: "RUNNING" });
    } catch (err: any) {
      notify(getErrMsg(err, "Failed to start race: "), "error");
      setLoading(false);
    }
  };

  const handleStartSupervise = async (race: any) => {
    setLoading(true);
    try {
      const [entriesData, violationsData, allRacesData] = await Promise.all([
        api.get<any[]>(`/public/results?raceId=${race.id}`),
        api.get<any[]>(`/public/violations?raceId=${race.id}`).catch(() => []),
        api.get<any[]>(`/races`).catch(() => []),
      ]);
      const currentRace = (allRacesData || []).find((r: any) => r.id === race.id) || {};
      setSelectedRace({ ...race, ...currentRace });
      setRaceEntries(entriesData || []);
      setViolations(violationsData || []);
      setActiveView("supervise");
    } catch (err) {
      alert("Failed to load supervision data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSupervisionData = async () => {
    if (!selectedRace) return;
    try {
      const [entriesData, violationsData] = await Promise.all([
        api.get<any[]>(`/public/results?raceId=${selectedRace.id}`),
        api.get<any[]>(`/public/violations?raceId=${selectedRace.id}`).catch(() => []),
      ]);
      setRaceEntries(entriesData || []);
      setViolations(violationsData || []);
    } catch (err) {
      console.error("Failed to refresh supervision data.", err);
    }
  };

  const handleStopEntry = async (entryId: number) => {
    setActionLoadingId(entryId);
    try {
      await api.post(`/referee/entry/${entryId}/stop`);
      refreshSupervisionData();
    } catch (err: any) {
      alert(err.response?.data?.error || getErrMsg(err, "Failed to stop horse."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResumeEntry = async (entryId: number) => {
    setActionLoadingId(entryId);
    try {
      await api.post(`/referee/entry/${entryId}/resume`);
      refreshSupervisionData();
    } catch (err: any) {
      alert(err.response?.data?.error || getErrMsg(err, "Failed to resume horse."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDisqualifyEntry = async (entryId: number) => {
    if (!await confirm("Are you sure you want to disqualify this horse?")) return;
    setActionLoadingId(entryId);
    try {
      await api.post(`/referee/entry/${entryId}/disqualify`);
      refreshSupervisionData();
    } catch (err: any) {
      alert(err.response?.data?.error || getErrMsg(err, "Failed to disqualify horse."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRace || !violRunner) return;
    const [horseId, jockeyId] = violRunner.split("-").map(Number);

    let finalPenalty = isSevereDq ? "DISQUALIFIED (DQ)" : "OFFICIAL_WARNING";
    if (fineAmount && Number(fineAmount) > 0) {
      const rawVal = Math.round(Number(fineAmount));
      const fineVal = Math.max(10000, rawVal); // Minimum fine rule: 10,000 VND
      const formattedFine = (fineTarget === "owner" ? "Owner Fine " : "Fine ") + fineVal + " VND";
      finalPenalty = isSevereDq ? `${formattedFine} + DISQUALIFIED (DQ)` : formattedFine;
    } else if (violPenalty.trim()) {
      finalPenalty = isSevereDq ? `${violPenalty.trim()} + DISQUALIFIED (DQ)` : violPenalty.trim();
    }

    try {
      await api.post("/referee/violations", {
        raceId: selectedRace.id,
        horseId,
        jockeyId,
        refereeId: user?.id,
        description: violDesc,
        penalty: finalPenalty,
        status: "PENDING",
      });
      notify(isSevereDq ? "Violation logged and runner DISQUALIFIED immediately!" : "Violation logged & fine assessed successfully.", "success");
      setShowViolModal(false);
      setViolDesc("");
      setViolPenalty("");
      setFineAmount("10000");
      setFineTarget("jockey");
      setIsSevereDq(false);
      // Reload live supervise data
      handleStartSupervise(selectedRace);
    } catch (err: any) {
      notify("Failed to log violation: " + getErrMsg(err), "error");
    }
  };

  const handleStopRace = async (stewardReport: string) => {
    if (!selectedRace) return;
    setLoading(true);
    try {
      await api.post(`/referee/races/${selectedRace.id}/stop`, { stewardReport });
      notify("Emergency stop executed. Race status changed to CANCELLED.", "success");
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      notify("Failed to stop race: " + getErrMsg(err), "error");
      setLoading(false);
    }
  };

  const handleSuspendRace = async (stewardReport: string) => {
    if (!selectedRace) return;
    setLoading(true);
    try {
      await api.post(`/referee/races/${selectedRace.id}/suspend`, { stewardReport });
      notify("Race suspended. Status changed to STOPPED.", "info");
      if (user?.id) {
        const dashboardRes = await api.get<any>(`/referee/${user.id}/dashboard`);
        setAssignedRaces(dashboardRes.assignedRaces || []);
        setCompletedCount(dashboardRes.completedCount || 0);
        setPendingCount(dashboardRes.pendingCount || 0);
        const updatedRace = (dashboardRes.assignedRaces || []).find((r: any) => r.id === selectedRace.id);
        if (updatedRace) {
          handleStartSupervise(updatedRace);
        } else {
          fetchDashboard();
        }
      } else {
        setSelectedRace((prev: any) => prev ? { ...prev, status: "STOPPED" } : prev);
        setLoading(false);
      }
    } catch (err: any) {
      notify("Failed to suspend race: " + getErrMsg(err), "error");
      setLoading(false);
    }
  };

  const handleResumeRace = async () => {
    if (!selectedRace || !user) return;
    setLoading(true);
    try {
      await api.post(`/referee/races/${selectedRace.id}/resume`);
      notify("Race resumed. Status changed to RUNNING.", "success");
      const dashboardRes = await api.get<any>(`/referee/${user.id}/dashboard`);
      setAssignedRaces(dashboardRes.assignedRaces || []);
      setCompletedCount(dashboardRes.completedCount || 0);
      setPendingCount(dashboardRes.pendingCount || 0);
      const updatedRace = (dashboardRes.assignedRaces || []).find((r: any) => r.id === selectedRace.id);
      if (updatedRace) {
        handleStartSupervise(updatedRace);
      } else {
        fetchDashboard();
      }
    } catch (err: any) {
      notify("Failed to resume race: " + getErrMsg(err), "error");
      setLoading(false);
    }
  };

  const handleStartConfirmResults = () => {
    if (!selectedRace) return;
    const posMap: Record<number, string> = {};
    const tMap: Record<number, string> = {};
    const wMap: Record<number, string> = {};
    const dqMap: Record<number, boolean> = {};

    const dqHorseIds = new Set<number>(
      violations
        .filter((v: any) => v.violation?.penalty === "DISQUALIFIED")
        .map((v: any) => v.horseId)
    );

    raceEntries.forEach((item: any) => {
      const isAlreadyDq =
        item.entry.status === "DISQUALIFIED" ||
        dqHorseIds.has(item.horse?.id);
      posMap[item.entry.id] = "";
      tMap[item.entry.id] = isAlreadyDq ? "DQ" : "";
      wMap[item.entry.id] = isAlreadyDq ? "" : (item.entry.carriedWeight || 52.0).toString();
      dqMap[item.entry.id] = isAlreadyDq;
    });
    setFinalPositions(posMap);
    setFinishTimes(tMap);
    setWeighInWeights(wMap);
    setDisqualifiedList(dqMap);
    setStewardReport("");
    setActiveView("confirm");
  };

  const handleConfirmResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRace) return;
    setLoading(true);
    try {
      
      for (const item of raceEntries) {
        const entryId = item.entry.id;
        const isDq = disqualifiedList[entryId] || item.entry.status === "DISQUALIFIED";
        if (!isDq) {
          const time = finishTimes[entryId];
          if (!time || !time.trim()) {
            notify("Please enter finishing time for horse \"" + (item.horse ? item.horse.name : "") + "\" or mark as DQ.", "error");
            setLoading(false);
            return;
          }
          if (!/^\d+:[0-5]\d(\.\d{1,3})?$/.test(time.trim())) {
            notify(`Finishing time for horse "${item.horse?.name}" is invalid (${time}). Seconds must be between 00 and 59 (e.g. 1:48.35 or 1:05).`, "error");
            setLoading(false);
            return;
          }
          const pos = finalPositions[entryId];
          if (!pos || isNaN(parseInt(pos))) {
            notify(`Cannot determine final position for horse "${item.horse?.name}". Please check the finish time.`, "error");
            setLoading(false);
            return;
          }
          const weight = parseFloat(weighInWeights[entryId]);
          if (isNaN(weight) || weight <= 0) {
            notify(`Please enter a valid weigh-in weight for horse "${item.horse?.name}".`, "error");
            setLoading(false);
            return;
          }
        }
      }

      const resultsPayload = raceEntries.map((item: any) => {
        const entryId = item.entry.id;
        const isDq = disqualifiedList[entryId];
        return {
          entryId,
          finalPosition: isDq ? null : parseInt(finalPositions[entryId]),
          finishTime: isDq ? "DQ" : finishTimes[entryId],
          weighInWeight: parseFloat(weighInWeights[entryId]),
        };
      });

      await api.post("/referee/results", {
        raceId: selectedRace.id,
        stewardReport,
        results: resultsPayload,
      });

      notify("Results verified and published. Closing race.", "success");
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      notify("Failed to submit results: " + getErrMsg(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const openStewardReportModal = (raceId: string, report: string) => {
    setReportModalRaceId(raceId);
    setReportModalContent(report && report.trim() !== "null" ? report : "No report was recorded for this race.");
    setShowReportModal(true);
  };

  const sortedEntries = [...raceEntries].sort((a, b) => {
    if (sortBy === "gate") {
      const gateA = a.entry.gateNumber ?? 999;
      const gateB = b.entry.gateNumber ?? 999;
      return gateA - gateB;
    } else {
      const ratingA = a.horse?.currentRating ?? 0;
      const ratingB = b.horse?.currentRating ?? 0;
      return ratingB - ratingA;
    }
  });

  const renderGlobalModals = () => (
    <>
      {reasonModal && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "#12141a", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "0.75rem", padding: "1.5rem", width: "100%", maxWidth: "28rem" }}>
            <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#f4f2ec", fontSize: "1rem", marginBottom: "1rem" }}>{reasonModal.title}</h4>
            <textarea
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="Enter reason details (Steward's Report)..."
              style={{ width: "100%", height: "90px", padding: "0.75rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,162,39,0.22)", borderRadius: "0.5rem", color: "#fff", fontSize: "0.85rem", outline: "none", resize: "none", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.1)", color: "#aaa", border: "none", borderRadius: "0.375rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentReason = reasonInput.trim();
                  const currentType = reasonModal.type;
                  if (!currentReason) {
                    notify("Please enter a reason before confirming.", "error");
                    return;
                  }
                  setReasonModal(null);
                  setReasonInput("");
                  if (currentType === "suspend") handleSuspendRace(currentReason);
                  else if (currentType === "emergency") handleStopRace(currentReason);
                }}
                style={{ padding: "0.5rem 1.25rem", background: reasonModal.type === "emergency" ? "#f59e0b" : "#fbbf24", color: "#000", border: "none", borderRadius: "0.375rem", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && createPortal(
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 200000,
          background: toast.type === "error" ? "#7f1d1d" : toast.type === "success" ? "#064e3b" : "#1e1b4b",
          border: toast.type === "error" ? "1px solid #ef4444" : toast.type === "success" ? "1px solid #10b981" : "1px solid #6366f1",
          color: "#fff",
          padding: "0.875rem 1.25rem",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          maxWidth: "24rem"
        }}>
          <span>{toast.type === "error" ? "⚠️" : toast.type === "success" ? "✅" : "ℹ️"}</span>
          <span style={{ flex: 1 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1rem" }}>✕</button>
        </div>,
        document.body
      )}

      {broadcasterRace && (
        <CameraBroadcasterModal
          raceId={broadcasterRace.id}
          raceTitle={broadcasterRace.classLevel || `Race #${broadcasterRace.id}`}
          onClose={() => {
            setBroadcasterRace(null);
            fetchDashboard();
          }}
        />
      )}
    </>
  );

  if (activeView === "check" && selectedRace) {
    const isGatesFullySet = selectedRace.gatesFullySet;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Referee Hub
          </button>
        </div>

        {!isGatesFullySet && (
          <div style={{ padding: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "0.5rem", color: "#f87171", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="alert-triangle" />
            <span>Warning: Starting gates are not fully configured. Please ask Admin to configure them before starting the race.</span>
          </div>
        )}

        {isGatesFullySet && (
          <div style={{ padding: "1rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Info: All starting gates are configured. You can start the race early by confirming the pre-race check below to transition the status to RUNNING immediately.</span>
          </div>
        )}

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pre-Race inspection for</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <span>📍 {selectedRace.venue}</span>
              <span>📅 {formatDateTime(selectedRace.startTime)}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "11px", fontFamily: "monospace" }}>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Class Level</span>
              <strong style={{ color: "#f4f2ec" }}>{formatClassLevel(selectedRace.classLevel)}</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Distance</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.distanceMeters}m</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>Track Type</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.trackType}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Horse & Jockey Weight Check</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Verify carried weights, horse breeding, and equipment checks before opening the gates.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "11px", color: "#a0a0a0", fontFamily: "monospace" }}>Sort by:</span>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value as "gate" | "rating")} 
                style={{ padding: "0.25rem 0.5rem", fontSize: "11px", background: "#12141a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#fff", outline: "none", cursor: "pointer" }}
              >
                <option value="gate">Gate Number</option>
                <option value="rating">Horse Rating</option>
              </select>
            </div>
          </div>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
              {sortedEntries.map(item => {
                const entryId = item.entry.id;
                const reqWeight = item.entry.carriedWeight || 52.0;
                const weighed = parseFloat(weighedWeights[entryId]);
                const diff = weighed - reqWeight;
                let badgeText = "Verified";
                let badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                if (vetChecks[entryId] === "SCRATCH") {
                  badgeText = "SCRATCHED";
                  badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                } else if (diff > 1.0) {
                  badgeText = "Critical Overweight (Max +1.0kg)";
                  badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                } else if (diff > 0) {
                  badgeText = `Overweight +${diff.toFixed(1)}kg (Verified)`;
                  badgeStyle = { bg: "rgba(245,158,11,0.1)", color: "#fbbf24" };
                } else if (diff < 0) {
                  badgeText = `Requires Lead Weight: +${Math.abs(diff).toFixed(1)}kg`;
                  badgeStyle = { bg: "rgba(59,130,246,0.1)", color: "#60a5fa" };
                } else {
                  badgeText = "Perfect Weight";
                  badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                }

                return (
                  <div key={entryId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", opacity: vetChecks[entryId] === "SCRATCH" ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                        {item.entry.gateNumber || "-"}
                      </span>
                      <span style={{ fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.color}20`, fontWeight: "bold", textAlign: "right" }}>
                        {badgeText}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
                      <div>
                        <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Horse Details</label>
                        <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px", marginTop: "2px" }}>{item.horse?.name}</div>
                        <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "1px" }}>{item.horse?.breed} · {translateSex(item.horse?.sex)} · Rating: {item.horse?.currentRating}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Jockey Details</label>
                        <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px", marginTop: "2px" }}>{item.jockey?.username}</div>
                        <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "1px" }}>Base: {item.jockey?.weight || "52.0"} kg</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "flex-end" }}>
                      <div>
                        <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                          Jockey Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={weighedWeights[entryId] || ""}
                          disabled={vetChecks[entryId] === "SCRATCH"}
                          onChange={e => setWeighedWeights(prev => ({ ...prev, [entryId]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "0.375rem 0.5rem",
                            fontSize: "12px",
                            outline: "none",
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "0.375rem",
                            color: "#fff",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                          Vet & Safety Check
                        </label>
                        <select
                          value={vetChecks[entryId]}
                          onChange={e => setVetChecks(prev => ({ ...prev, [entryId]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "0.375rem 0.5rem",
                            fontSize: "11px",
                            outline: "none",
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "0.375rem",
                            color: "#fff",
                          }}
                        >
                          <option value="CLEARED">Cleared (Verified)</option>
                          <option value="SCRATCH">SCRATCHED (VET)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", fontSize: "11px" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Required Weight:</span>
                      <span style={{ fontFamily: "monospace", color: "#a855f7", fontWeight: "bold" }}>{reqWeight} kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {["Gate", "Horse Details", "Jockey Details", "Weigh-Out Weight (kg)", "Required Weight", "Vet & Safety Check", "Status"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map(item => {
                    const entryId = item.entry.id;
                    const reqWeight = item.entry.carriedWeight || 52.0;
                    const weighed = parseFloat(weighedWeights[entryId]);
                    const diff = weighed - reqWeight;
                    let badgeText = "Verified";
                    let badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                    if (vetChecks[entryId] === "SCRATCH") {
                      badgeText = "SCRATCHED";
                      badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                    } else if (diff > 1.0) {
                      badgeText = "Critical Overweight (Max +1.0kg)";
                      badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                    } else if (diff > 0) {
                      badgeText = `Overweight +${diff.toFixed(1)}kg (Verified)`;
                      badgeStyle = { bg: "rgba(245,158,11,0.1)", color: "#fbbf24" };
                    } else if (diff < 0) {
                      badgeText = `Requires Lead Weight: +${Math.abs(diff).toFixed(1)}kg`;
                      badgeStyle = { bg: "rgba(59,130,246,0.1)", color: "#60a5fa" };
                    } else {
                      badgeText = "Perfect Weight";
                      badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                    }

                    return (
                      <tr key={entryId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: vetChecks[entryId] === "SCRATCH" ? 0.4 : 1 }}>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                            {item.entry.gateNumber || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</div>
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · {translateSex(item.horse?.sex)} · Rating: {item.horse?.currentRating}</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px" }}>{item.jockey?.username}</div>
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Base weight: {item.jockey?.weight || "52.0"} kg</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <input type="number" step="0.1" value={weighedWeights[entryId] || ""} disabled={vetChecks[entryId] === "SCRATCH"} onChange={e => setWeighedWeights(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ width: 80, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                        </td>
                        <td style={{ padding: "1rem", fontSize: "12px", fontFamily: "monospace", color: "#a855f7", fontWeight: "bold" }}>
                          {reqWeight} kg
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <select value={vetChecks[entryId]} onChange={e => setVetChecks(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ padding: "0.25rem 0.5rem", fontSize: "11px", width: 140, outline: "none" }}>
                            <option value="CLEARED">Cleared (Verified)</option>
                            <option value="SCRATCH">SCRATCHED (VET)</option>
                          </select>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ fontSize: "10px", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", background: badgeStyle.bg, color: badgeStyle.color, border: `1px solid ${badgeStyle.color}20`, fontWeight: "bold" }}>
                            {badgeText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>Safety Checklist Complete?</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Ensure veterinarians have cleared all horses, jockeys are weighed out, and starting boxes are safe.</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => setActiveView("list")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleConfirmCheck} disabled={!isGatesFullySet} style={{ padding: "0.5rem 1rem", background: isGatesFullySet ? "#10b981" : "#1f1f22", color: isGatesFullySet ? "#fff" : "#555", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: isGatesFullySet ? "pointer" : "not-allowed" }}>
              Confirm Pre-Race Check & Open Gates
            </button>
          </div>
        </div>
        {renderGlobalModals()}
      </div>
    );
  }

  if (activeView === "supervise" && selectedRace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Referee Hub
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Live supervision for</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {selectedRace.meetingName} - Race #{selectedRace.id}
              <span style={{
                fontSize: "10px",
                padding: "0.2rem 0.5rem",
                borderRadius: "0.25rem",
                background: selectedRace.status === "STOPPED" ? "rgba(234,179,8,0.15)" : "rgba(16,185,129,0.15)",
                color: selectedRace.status === "STOPPED" ? "#fbbf24" : "#34d399",
                border: selectedRace.status === "STOPPED" ? "1px solid rgba(234,179,8,0.3)" : "1px solid rgba(16,185,129,0.3)"
              }}>
                {selectedRace.status}
              </span>
            </h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem", alignItems: "center" }}>
              <span>📍 {selectedRace.venue}</span>
              <span style={{ color: selectedRace.status === "STOPPED" ? "#fbbf24" : "#eab308", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="activity" /> {selectedRace.status === "STOPPED" ? "Race Suspended" : "Race in Progress"}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {(selectedRace.status === "RUNNING" || selectedRace.status === "STEWARDS_INQUIRY") && (
              <button
                onClick={() => {
                  setReasonInput("");
                  setReasonModal({ type: "suspend", title: "Enter reason for race suspension (Steward's Report):" });
                }}
                style={{ padding: "0.5rem 1.25rem", background: "#fbbf24", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                ⏸️ Suspend Race
              </button>
            )}
            {selectedRace.status === "STOPPED" && (
              <button
                onClick={handleResumeRace}
                style={{ padding: "0.5rem 1.25rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
              >
                ▶️ Resume Race
              </button>
            )}
            <button
              onClick={() => {
                setReasonInput("");
                setReasonModal({ type: "emergency", title: "Enter reason for emergency race stop (Steward's Report):" });
              }}
              style={{ padding: "0.5rem 1.25rem", background: "#f59e0b", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              🛑 Emergency Stop
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("OPEN_BROADCASTER", { detail: selectedRace }))} 
              style={{ 
                padding: "0.5rem 1.25rem", 
                background: "rgba(239,68,68,0.2)", 
                color: "#f87171", 
                border: "1px solid rgba(239,68,68,0.4)", 
                borderRadius: "0.5rem", 
                fontSize: "12px", 
                fontWeight: "bold", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.375rem" 
              }}
            >
              📷 Camera Broadcast
            </button>
            <button 
              onClick={() => setLiveMonitorMode(prev => prev === "hidden" ? "floating" : prev === "floating" ? "embedded" : "floating")} 
              style={{ 
                padding: "0.5rem 1.25rem", 
                background: liveMonitorMode !== "hidden" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", 
                color: liveMonitorMode !== "hidden" ? "#34d399" : "#fff", 
                border: liveMonitorMode !== "hidden" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.15)", 
                borderRadius: "0.5rem", 
                fontSize: "12px", 
                fontWeight: "bold", 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.375rem" 
              }}
            >
              📺 {liveMonitorMode === "floating" ? "Floating Monitor" : liveMonitorMode === "embedded" ? "Embedded Monitor" : "Turn on Live Monitor"}
            </button>
            <button onClick={() => setShowViolModal(true)} style={{ padding: "0.5rem 1.25rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              ⚠️ Record Violation
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: "1.5rem" }}>
          {/* Active Runners */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Active Runners</h3>
                <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Competitors currently running on the track.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "11px", color: "#a0a0a0", fontFamily: "monospace" }}>Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as "gate" | "rating")} 
                  style={{ padding: "0.25rem 0.5rem", fontSize: "11px", background: "#12141a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#fff", outline: "none", cursor: "pointer" }}
                >
                  <option value="gate">Gate Number</option>
                  <option value="rating">Horse Rating</option>
                </select>
              </div>
            </div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {sortedEntries.map(item => (
                  <div key={item.entry.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                        {item.entry.gateNumber || "-"}
                      </span>
                      {statusBadge(item.entry.status)}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "14px" }}>{item.horse?.name}</div>
                      <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Jockey: <span style={{ color: "#fff" }}>{item.jockey?.username}</span></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>Weight: {item.entry.carriedWeight} kg</span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button onClick={() => { setViolRunner(`${item.horse.id}-${item.jockey.id}`); setShowViolModal(true); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Report</button>
                        {item.entry.status === "RUNNING" && (
                          <button 
                            onClick={() => handleStopEntry(item.entry.id)} 
                            disabled={actionLoadingId !== null}
                            style={{ 
                              padding: "0.25rem 0.5rem", 
                              background: "rgba(245,158,11,0.15)", 
                              border: "1px solid rgba(245,158,11,0.3)", 
                              borderRadius: "0.25rem", 
                              color: "#f59e0b", 
                              cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                              opacity: actionLoadingId !== null ? 0.5 : 1,
                              fontSize: "11px", 
                              fontWeight: "bold" 
                            }}
                          >
                            Stop
                          </button>
                        )}
                        {item.entry.status === "STOPPED" && (
                          <>
                            <button 
                              onClick={() => handleResumeEntry(item.entry.id)} 
                              disabled={actionLoadingId !== null}
                              style={{ 
                                padding: "0.25rem 0.5rem", 
                                background: "rgba(16,185,129,0.15)", 
                                border: "1px solid rgba(16,185,129,0.3)", 
                                borderRadius: "0.25rem", 
                                color: "#10b981", 
                                cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                                opacity: actionLoadingId !== null ? 0.5 : 1,
                                fontSize: "11px", 
                                fontWeight: "bold" 
                              }}
                            >
                              Resume
                            </button>
                            <button 
                              onClick={() => handleDisqualifyEntry(item.entry.id)} 
                              disabled={actionLoadingId !== null}
                              style={{ 
                                padding: "0.25rem 0.5rem", 
                                background: "rgba(239,68,68,0.15)", 
                                border: "1px solid rgba(239,68,68,0.3)", 
                                borderRadius: "0.25rem", 
                                color: "#ef4444", 
                                cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                                opacity: actionLoadingId !== null ? 0.5 : 1,
                                fontSize: "11px", 
                                fontWeight: "bold" 
                              }}
                            >
                              DQ
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      {["Gate", "Horse Details", "Jockey Details", "Weigh-Out Weight (kg)", "Status", "Action"].map(h => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map(item => (
                      <tr key={item.entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                            {item.entry.gateNumber || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem", fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</td>
                        <td style={{ padding: "1rem", color: "#a0a0a0", fontSize: "12px" }}>{item.jockey?.username}</td>
                        <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "12px", color: "#f4f2ec" }}>{item.entry.carriedWeight} kg</td>
                        <td style={{ padding: "1rem" }}>
                          {statusBadge(item.entry.status)}
                        </td>
                        <td style={{ padding: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <button onClick={() => { setViolRunner(`${item.horse.id}-${item.jockey.id}`); setShowViolModal(true); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Report</button>
                          {item.entry.status === "RUNNING" && (
                            <button 
                              onClick={() => handleStopEntry(item.entry.id)} 
                              disabled={actionLoadingId !== null}
                              style={{ 
                                padding: "0.2rem 0.5rem", 
                                background: "rgba(245,158,11,0.15)", 
                                border: "1px solid rgba(245,158,11,0.3)", 
                                borderRadius: "0.25rem", 
                                color: "#f59e0b", 
                                cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                                opacity: actionLoadingId !== null ? 0.5 : 1,
                                fontSize: "11px", 
                                fontWeight: "bold" 
                              }}
                            >
                              Stop
                            </button>
                          )}
                          {item.entry.status === "STOPPED" && (
                            <>
                              <button 
                                onClick={() => handleResumeEntry(item.entry.id)} 
                                disabled={actionLoadingId !== null}
                                style={{ 
                                  padding: "0.2rem 0.5rem", 
                                  background: "rgba(16,185,129,0.15)", 
                                  border: "1px solid rgba(16,185,129,0.3)", 
                                  borderRadius: "0.25rem", 
                                  color: "#10b981", 
                                  cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                                  opacity: actionLoadingId !== null ? 0.5 : 1,
                                  fontSize: "11px", 
                                  fontWeight: "bold" 
                                }}
                              >
                                Resume
                              </button>
                              <button 
                                onClick={() => handleDisqualifyEntry(item.entry.id)} 
                                disabled={actionLoadingId !== null}
                                style={{ 
                                  padding: "0.2rem 0.5rem", 
                                  background: "rgba(239,68,68,0.15)", 
                                  border: "1px solid rgba(239,68,68,0.3)", 
                                  borderRadius: "0.25rem", 
                                  color: "#ef4444", 
                                  cursor: actionLoadingId !== null ? "not-allowed" : "pointer", 
                                  opacity: actionLoadingId !== null ? 0.5 : 1,
                                  fontSize: "11px", 
                                  fontWeight: "bold" 
                                }}
                              >
                                DQ
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Incidents Recorded */}
          <div className="rounded-xl flex flex-col overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Incidents Recorded</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Violations logged by stewards for this race.</p>
            </div>
            <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", maxHeight: "350px" }}>
              {violations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "#a0a0a0" }}>
                  <Icon name="thumbs-up" color="#10b981" />
                  <p style={{ fontSize: "12px", marginTop: "0.5rem" }}>No incidents recorded. Clean race so far.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {violations.map((v, i) => (
                    <div key={i} style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <h4 style={{ fontWeight: "bold", color: "#f87171", fontSize: "12px" }}>{v.horseName}</h4>
                        <span style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>DQ</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Jockey: <span style={{ color: "#fff" }}>{v.jockeyName}</span></p>
                      <p style={{ fontSize: "11px", background: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "0.25rem", margin: "0.5rem 0", fontFamily: "monospace", color: "#f4f2ec" }}>{v.violation?.description}</p>
                      <div style={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon name="gavel" /> Penalty: {v.violation?.penalty}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Live Race Monitor (Option 2: Below Table) */}
        {renderLiveMonitorCard(true)}

        {/* Finalization Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>Race Completed?</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Transition to the final results sheet to enter positions, race times, and submit your official report.</p>
          </div>
          <button onClick={handleStartConfirmResults} style={{ padding: "0.625rem 1.25rem", background: "#fbbf24", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="check-square" /> Finish Race & Enter Results
          </button>
        </div>

        {/* Floating Movable Live Race Monitor (Option 1: Corner Draggable) */}
        {renderLiveMonitorCard(false)}

        {/* Log Violation Modal */}
        {showViolModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50000, padding: "1rem" }}>
            <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "28rem", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon name="alert-triangle" color="#ef4444" /> Log Rules Violation
                </h3>
                <button onClick={() => setShowViolModal(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
              </div>
              <form onSubmit={handleSaveViolation} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Runner (Horse / Jockey)</label>
                  <select value={violRunner} onChange={e => setViolRunner(e.target.value)} required style={{ width: "100%", padding: "0.5rem", outline: "none", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0.375rem" }}>
                    <option value="">-- Select Runner --</option>
                    {sortedEntries.map(item => (
                      <option key={item.entry.id} value={`${item.horse.id}-${item.jockey.id}`}>
                        {item.horse?.name} (Jockey: {item.jockey?.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Violation Description</label>
                  <textarea value={violDesc} onChange={e => setViolDesc(e.target.value)} required placeholder="Describe violation incident (e.g. Careless riding, interference, whip misuse)..." style={{ width: "100%", padding: "0.5rem", height: 75, resize: "none", outline: "none", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0.375rem" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Fine Target Role</label>
                    <select value={fineTarget} onChange={e => setFineTarget(e.target.value as any)} style={{ width: "100%", padding: "0.5rem", outline: "none", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#fbbf24", fontWeight: "bold", borderRadius: "0.375rem" }}>
                      <option value="jockey">🏇 Jockey Wallet</option>
                      <option value="owner">🏢 Horse Owner Wallet</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>Fine Amount (VND, Min 10,000)</label>
                    <input type="number" min="10000" step="1000" value={fineAmount} onChange={e => setFineAmount(e.target.value)} placeholder="10000" style={{ width: "100%", padding: "0.5rem", outline: "none", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "#4ade80", fontWeight: "bold", borderRadius: "0.375rem", fontFamily: "monospace" }} />
                  </div>
                </div>

                {violRunner && fineAmount && Number(fineAmount) > 0 && (
                  <div style={{ fontSize: "10px", color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.08)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(251,191,36,0.2)" }}>
                    💳 <strong>Financial Deduction Preview:</strong><br />
                    {Math.round(Number(fineAmount)).toLocaleString('en-US')} VND will be automatically deducted from {fineTarget === "jockey" ? `Jockey ${sortedEntries.find(i => `${i.horse.id}-${i.jockey.id}` === violRunner)?.jockey?.username}'s wallet` : `Horse Owner's wallet`}.
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(239,68,68,0.08)", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <input type="checkbox" id="severeDq" checked={isSevereDq} onChange={e => setIsSevereDq(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor="severeDq" style={{ fontSize: "11px", color: "#ef4444", fontWeight: "bold", cursor: "pointer" }}>
                    Severe violation (Disqualify runner DQ immediately)
                  </label>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                  <button type="button" onClick={() => { setShowViolModal(false); setIsSevereDq(false); }} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>⚖️ Confirm & Assess Fine</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {renderGlobalModals()}
      </div>
    );
  }

  if (activeView === "confirm" && selectedRace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("supervise")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> Back to Referee Hub
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Final Result entry for</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
          <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "0.25rem" }}>Submit official positions, timings, disqualifications and compile the Steward's Report to distribute prizes and update ratings.</p>
        </div>

        <form onSubmit={handleConfirmResults} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Official Finishing Sheet</h3>
                <p style={{ fontSize: "11px", color: "#a0a0a0" }}>Verify each horse's position and timing. Check the DQ column to disqualify a runner.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "11px", color: "#a0a0a0", fontFamily: "monospace" }}>Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as "gate" | "rating")} 
                  style={{ padding: "0.25rem 0.5rem", fontSize: "11px", background: "#12141a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", color: "#fff", outline: "none", cursor: "pointer" }}
                >
                  <option value="gate">Gate Number</option>
                  <option value="rating">Horse Rating</option>
                </select>
              </div>
            </div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {sortedEntries.map((item, idx) => {
                  const entryId = item.entry.id;
                  const isAlreadyDq = item.entry.status === "DISQUALIFIED";
                  const isDq = disqualifiedList[entryId] || false;
                  const weighedOut = item.entry.carriedWeight || 52.0;
                  const weighedIn = parseFloat(weighInWeights[entryId]) || 0;
                  const diff = weighedIn - weighedOut;
                  let wiText = "Weigh-In Passed";
                  let wiColor = "#34d399";
                  if (diff < -0.5) {
                    wiText = `UNDERWEIGHT DISCREPANCY: ${diff.toFixed(1)} kg (dq)`;
                    wiColor = "#f87171";
                  } else {
                    wiText = `Weigh-In Passed (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} kg)`;
                  }

                  return (
                    <div key={entryId} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", opacity: isDq ? 0.5 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                          {item.entry.gateNumber || "-"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <label style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "0.25rem", cursor: isAlreadyDq ? "not-allowed" : "pointer" }}>
                            <input type="checkbox" checked={isDq} disabled={isAlreadyDq} onChange={e => setDisqualifiedList(prev => ({ ...prev, [entryId]: e.target.checked }))} style={{ width: 16, height: 16 }} />
                            DQ
                          </label>
                          {isAlreadyDq && (
                            <span style={{ fontSize: "9px", color: "#f87171", fontWeight: "bold" }}>
                              (Violation)
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem" }}>
                        <div>
                          <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Horse Details</label>
                          <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px", marginTop: "2px" }}>{item.horse?.name}</div>
                          <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "1px" }}>{item.horse?.breed} · {translateSex(item.horse?.sex)} · Rating: {item.horse?.currentRating}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Jockey Details</label>
                          <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px", marginTop: "2px" }}>{item.jockey?.username}</div>
                          <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "1px" }}>Out: {item.entry.carriedWeight || "52.0"} kg</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", alignItems: "flex-start" }}>
                        <div>
                          <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                            Final Position
                          </label>
                          {isAlreadyDq ? (
                            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", display: "inline-block" }}>
                              DISQUALIFIED
                            </span>
                          ) : (
                            <input type="text" readOnly disabled value={isDq ? "DQ" : finalPositions[entryId] ? `${finalPositions[entryId]}` : "—"} style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#c9a227", fontWeight: "bold", textAlign: "center", outline: "none", borderRadius: "0.25rem" }} />
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                            Weigh-In Weight (kg)
                          </label>
                          {isAlreadyDq ? (
                            <span style={{ fontSize: "11px", color: "#a0a0a0" }}>—</span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <input type="number" step="0.1" required={!isDq} value={weighInWeights[entryId] || ""} disabled={isDq} onChange={e => {
                                const v = parseFloat(e.target.value);
                                setWeighInWeights(prev => ({ ...prev, [entryId]: e.target.value }));
                                if (!isNaN(v) && v - weighedOut < -0.5) {
                                  setDisqualifiedList(prev => ({ ...prev, [entryId]: true }));
                                }
                              }} style={{ width: "100%", padding: "0.375rem 0.5rem", fontSize: "12px", outline: "none", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.375rem", color: "#fff" }} />
                              <span style={{ fontSize: "11px", color: "#a0a0a0" }}>kg</span>
                            </div>
                          )}
                          {!isDq && !isAlreadyDq && <div style={{ fontSize: "9px", fontWeight: "bold", color: wiColor, marginTop: "4px" }}>{wiText}</div>}
                        </div>

                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: "4px" }}>
                            Finish Time
                          </label>
                          {isAlreadyDq ? (
                            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#f87171", fontFamily: "monospace" }}>
                              DQ
                            </span>
                          ) : (
                            <div>
                              <input
                                type="text"
                                required={!isDq}
                                placeholder="e.g. 1:48.35"
                                value={isDq ? "DQ" : finishTimes[entryId] || ""}
                                disabled={isDq}
                                onChange={e => {
                                  const val = e.target.value;
                                  setFinishTimes(prev => ({ ...prev, [entryId]: val }));
                                  if (!val.trim()) {
                                    setFinishTimeErrors(prev => ({ ...prev, [entryId]: "" }));
                                  } else if (!/^\d+:[0-5]\d(\.\d{1,3})?$/.test(val.trim())) {
                                    setFinishTimeErrors(prev => ({
                                      ...prev,
                                      [entryId]: "Invalid format! Seconds must be between 00 and 59 (e.g. 1:48.35)"
                                    }));
                                  } else {
                                    setFinishTimeErrors(prev => ({ ...prev, [entryId]: "" }));
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  padding: "0.375rem 0.5rem",
                                  fontSize: "12px",
                                  outline: "none",
                                  background: finishTimeErrors[entryId] ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.6)",
                                  border: finishTimeErrors[entryId] ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: "0.375rem",
                                  color: finishTimeErrors[entryId] ? "#fca5a5" : "#fff"
                                }}
                              />
                              {finishTimeErrors[entryId] && (
                                <div style={{ fontSize: "10px", color: "#f87171", marginTop: "3px", fontFamily: "monospace", fontWeight: "bold" }}>
                                  ⚠ {finishTimeErrors[entryId]}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      {["Gate", "Horse Details", "Jockey Details", "Final Position", "Weigh-In Weight (kg)", "Finish Time", "DQ"].map(h => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: h === "DQ" ? "center" : "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((item, idx) => {
                      const entryId = item.entry.id;
                      const isAlreadyDq = item.entry.status === "DISQUALIFIED";
                      const isDq = disqualifiedList[entryId] || false;
                      const weighedOut = item.entry.carriedWeight || 52.0;
                      const weighedIn = parseFloat(weighInWeights[entryId]) || 0;
                      const diff = weighedIn - weighedOut;
                      let wiText = "Weigh-In Passed";
                      let wiColor = "#34d399";
                      if (diff < -0.5) {
                        wiText = `UNDERWEIGHT DISCREPANCY: ${diff.toFixed(1)} kg (dq)`;
                        wiColor = "#f87171";
                      } else {
                        wiText = `Weigh-In Passed (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} kg)`;
                      }

                      return (
                        <tr key={entryId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: isDq ? 0.4 : 1 }}>
                          <td style={{ padding: "1rem" }}>
                            <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#1f1d1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px", color: "#c9a227" }}>
                              {item.entry.gateNumber || "-"}
                            </span>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: "bold", color: "#f4f2ec", fontSize: "13px" }}>{item.horse?.name}</div>
                            <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · {translateSex(item.horse?.sex)} · Rating: {item.horse?.currentRating}</div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px" }}>{item.jockey?.username}</div>
                            <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Weighed Out: {item.entry.carriedWeight || "52.0"} kg</div>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            {isAlreadyDq ? (
                              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                                DISQUALIFIED
                              </span>
                            ) : (
                              <input type="text" readOnly disabled value={isDq ? "DQ" : finalPositions[entryId] ? `${finalPositions[entryId]}` : "—"} style={{ width: 70, padding: "0.25rem 0.5rem", fontSize: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#c9a227", fontWeight: "bold", textAlign: "center", outline: "none", borderRadius: "0.25rem" }} />
                            )}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            {isAlreadyDq ? (
                              <span style={{ fontSize: "11px", color: "#a0a0a0" }}>—</span>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <input type="number" step="0.1" required={!isDq} value={weighInWeights[entryId] || ""} disabled={isDq} onChange={e => {
                                  const v = parseFloat(e.target.value);
                                  setWeighInWeights(prev => ({ ...prev, [entryId]: e.target.value }));
                                  if (!isNaN(v) && v - weighedOut < -0.5) {
                                    setDisqualifiedList(prev => ({ ...prev, [entryId]: true }));
                                  }
                                }} style={{ width: 75, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                                <span style={{ fontSize: "11px", color: "#a0a0a0" }}>kg</span>
                              </div>
                            )}
                            {!isDq && !isAlreadyDq && <div style={{ fontSize: "10px", fontWeight: "bold", color: wiColor, marginTop: "4px" }}>{wiText}</div>}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            {isAlreadyDq ? (
                              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#f87171", fontFamily: "monospace" }}>
                                DQ
                              </span>
                            ) : (
                              <div>
                                <input
                                  type="text"
                                  required={!isDq}
                                  placeholder="e.g. 1:48.35"
                                  value={isDq ? "DQ" : finishTimes[entryId] || ""}
                                  disabled={isDq}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setFinishTimes(prev => ({ ...prev, [entryId]: val }));
                                    if (!val.trim()) {
                                      setFinishTimeErrors(prev => ({ ...prev, [entryId]: "" }));
                                    } else if (!/^\d+:[0-5]\d(\.\d{1,3})?$/.test(val.trim())) {
                                      setFinishTimeErrors(prev => ({
                                        ...prev,
                                        [entryId]: "Invalid format! Seconds must be between 00 and 59 (e.g. 1:48.35)"
                                      }));
                                    } else {
                                      setFinishTimeErrors(prev => ({ ...prev, [entryId]: "" }));
                                    }
                                  }}
                                  style={{
                                    width: 140,
                                    padding: "0.375rem 0.5rem",
                                    fontSize: "12px",
                                    outline: "none",
                                    background: finishTimeErrors[entryId] ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.6)",
                                    border: finishTimeErrors[entryId] ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                                    borderRadius: "0.375rem",
                                    color: finishTimeErrors[entryId] ? "#fca5a5" : "#fff"
                                  }}
                                />
                                {finishTimeErrors[entryId] && (
                                  <div style={{ fontSize: "10px", color: "#f87171", marginTop: "3px", fontFamily: "monospace", fontWeight: "bold" }}>
                                    ⚠ {finishTimeErrors[entryId]}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <input type="checkbox" checked={isDq} disabled={isAlreadyDq} onChange={e => setDisqualifiedList(prev => ({ ...prev, [entryId]: e.target.checked }))} style={{ width: 16, height: 16, cursor: isAlreadyDq ? "not-allowed" : "pointer" }} />
                            {isAlreadyDq && (
                              <div style={{ fontSize: "9px", color: "#f87171", marginTop: "4px", fontWeight: "bold" }}>
                                Violation
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>Steward's Official Report</h3>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginBottom: "0.75rem" }}>Provide a written summary of the race, detailing any incident inquiries, warnings, or vet notes.</p>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} required rows={5} placeholder="Insert race description..." style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "0.5rem", color: "#fff", fontSize: "12px", resize: "none", outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setActiveView("supervise")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>
              Approve & Declare Official
            </button>
          </div>
        </form>

        {renderGlobalModals()}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {[
          { label: "Total Assignments",       value: completedCount + pendingCount, color: PURPLE,    bg: `rgba(139,92,246,0.1)`,  icon: "📋" },
          { label: "Pending Check/Supervision", value: pendingCount,   color: "#eab308",  bg: "rgba(234,179,8,0.1)",   icon: "⏱" },
          { label: "Completed Races",          value: completedCount,  color: "#4ade80",  bg: "rgba(74,222,128,0.1)",  icon: "✅" },
        ].map(s => (
          <div key={s.label} className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", background: "rgba(21,19,16,0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0", marginBottom: "0.375rem" }}>{s.label}</p>
              <h3 style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: "0.5rem", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Assigned Races Table */}
      {(() => {
        const totalItems = assignedRaces.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / assignedPageSize));
        const validPage = Math.min(Math.max(1, assignedPage), totalPages);
        const startIndex = (validPage - 1) * assignedPageSize;
        const paginatedRaces = assignedRaces.slice(startIndex, startIndex + assignedPageSize);

        return (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>Assigned Races & Duties</h3>
                <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>Inspect, monitor, and finalize results for races assigned to you.</p>
              </div>
            </div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" }}>
                {paginatedRaces.map((race: any) => {
                  const isPending = !["OFFICIAL", "RACE_EVENT_ENDED", "FINISHED", "CANCELLED"].includes(race.status ?? "");
                  const isRunning = race.status === "RUNNING";
                  const isOfficial = race.status === "OFFICIAL" || race.status === "RACE_EVENT_ENDED";
                  const isStewardsInquiry = race.status === "STEWARDS_INQUIRY";

                  return (
                    <div key={race.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>#{race.id}</span>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: "bold", color: "#f4f2ec", marginTop: "2px" }}>
                            {race.meetingName}
                          </h4>
                          <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginTop: "2px" }}>📍 {race.venue}</span>
                        </div>
                        {statusBadge(race.status, race.preCheckCompleted)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                        📅 {formatDateTime(race.startTime)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#f4f2ec", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{formatClassLevel(race.classLevel)}</div>
                          <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "2px" }}>
                            {race.distanceMeters}m · {race.trackType}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, marginLeft: "0.5rem" }}>
                          {isPending && !isRunning && (
                            race.preCheckCompleted ? (
                              <button onClick={() => handleStartRace(race)} style={{ padding: "0.375rem 0.75rem", background: "#10b981", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                                🟢 Start Race
                              </button>
                            ) : race.gatesFullySet ? (
                              <button onClick={() => handleStartCheck(race)} style={{ padding: "0.375rem 0.75rem", background: PURPLE, color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                                ☑ Start Pre-Race Check
                              </button>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                                <span style={{ fontSize: "8px", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>Gates Not Set</span>
                                <button disabled style={{ padding: "0.375rem 0.75rem", background: "#1f1d1a", color: "#555", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "not-allowed", border: "none" }}>
                                  🔒 ☑ Start Pre-Race Check
                                </button>
                              </div>
                            )
                          )}
                          {isRunning && (
                            <button onClick={() => handleStartSupervise(race)} style={{ padding: "0.375rem 0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                              👁 Monitor & Record
                            </button>
                          )}
                          {isStewardsInquiry && (
                            <button
                              onClick={() => handleStartSupervise(race)}
                              style={{
                                padding: "0.375rem 0.75rem",
                                background: "rgba(239,68,68,0.15)",
                                color: "#ef4444",
                                fontSize: "0.7rem",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                border: "1px solid rgba(239,68,68,0.4)",
                                animation: "pulse 1.5s infinite",
                              }}
                            >
                              🔴 Confirm Results
                            </button>
                          )}
                          {isOfficial && (
                            <button onClick={() => openStewardReportModal(race.id, race.stewardReport)} style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}>
                              📄 Steward Report
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  currentPage={validPage}
                  totalItems={totalItems}
                  pageSize={assignedPageSize}
                  onPageChange={setAssignedPage}
                  onPageSizeChange={setAssignedPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      {["Race ID", "Race Meeting", "Start Time", "Race Details", "Status", "Actions"].map((h, i) => (
                        <th key={h} style={{ padding: "0.75rem 1rem", textAlign: i === 5 ? "right" : "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>Loading assigned races...</td></tr>
                    ) : assignedRaces.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "3rem", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "2rem" }}>📭</span>
                            <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>No races assigned to you at the moment.</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRaces.map((race: any) => {
                      const isPending = !["OFFICIAL", "RACE_EVENT_ENDED", "FINISHED", "CANCELLED"].includes(race.status ?? "");
                      const isRunning = race.status === "RUNNING";
                      const isOfficial = race.status === "OFFICIAL" || race.status === "RACE_EVENT_ENDED";
                      const isStewardsInquiry = race.status === "STEWARDS_INQUIRY";

                      return (
                        <tr key={race.id} style={{ borderBottom: "1px solid rgba(42,40,37,0.5)" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                        >
                          <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.875rem", color: "#f4f2ec" }}>#{race.id}</td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "0.875rem" }}>{race.meetingName}</div>
                            <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>📍 {race.venue}</div>
                          </td>
                          <td style={{ padding: "1rem", fontSize: "0.8rem", color: "#a0a0a0", fontFamily: "monospace" }}>{formatDateTime(race.startTime)}</td>
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontSize: "0.875rem", color: "#f4f2ec" }}>{formatClassLevel(race.classLevel)}</div>
                            <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>{race.distanceMeters}m · {race.trackType}</div>
                          </td>
                          <td style={{ padding: "1rem" }}>{statusBadge(race.status, race.preCheckCompleted)}</td>
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            {isPending && !isRunning && (
                              race.preCheckCompleted ? (
                                <button onClick={() => handleStartRace(race)} style={{ padding: "0.375rem 0.75rem", background: "#10b981", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                                  🟢 Start Race
                                </button>
                              ) : race.gatesFullySet ? (
                                <button onClick={() => handleStartCheck(race)} style={{ padding: "0.375rem 0.75rem", background: PURPLE, color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                                  ☑ Start Pre-Race Check
                                </button>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                                  <span style={{ fontSize: "8px", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>Gates Not Set</span>
                                  <button disabled style={{ padding: "0.375rem 0.75rem", background: "#1f1d1a", color: "#555", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "not-allowed", border: "none" }}>
                                    🔒 ☑ Start Pre-Race Check
                                  </button>
                                </div>
                              )
                            )}
                            {isRunning && (
                              <button onClick={() => handleStartSupervise(race)} style={{ padding: "0.375rem 0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                                👁 Monitor & Record
                              </button>
                            )}
                            {isStewardsInquiry && (
                              <button
                                onClick={() => handleStartSupervise(race)}
                                style={{
                                  padding: "0.375rem 0.75rem",
                                  background: "rgba(239,68,68,0.15)",
                                  color: "#ef4444",
                                  fontSize: "0.7rem",
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  borderRadius: "0.5rem",
                                  cursor: "pointer",
                                  border: "1px solid rgba(239,68,68,0.4)",
                                  animation: "pulse 1.5s infinite",
                                }}
                              >
                                🔴 Confirm Results
                              </button>
                            )}
                            {isOfficial && (
                              <button onClick={() => openStewardReportModal(race.id, race.stewardReport)} style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}>
                                📄 Steward Report
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {assignedRaces.length > 0 && (
                  <Pagination
                    currentPage={validPage}
                    totalItems={totalItems}
                    pageSize={assignedPageSize}
                    onPageChange={setAssignedPage}
                    onPageSizeChange={setAssignedPageSize}
                    pageSizeOptions={[5, 10, 20]}
                  />
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Steward Report Modal */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50000, padding: "1rem" }}>
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Steward's Official Report
              </h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
            </div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontSize: "10px", fontFamily: "monospace", color: "#a0a0a0", marginBottom: "0.5rem" }}>Race ID: #{reportModalRaceId}</p>
              <div style={{ fontSize: "13px", color: "#fff", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                {reportModalContent}
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowReportModal(false)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {renderGlobalModals()}
    </div>
  );
}

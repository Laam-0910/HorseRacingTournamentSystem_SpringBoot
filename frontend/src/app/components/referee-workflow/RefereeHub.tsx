import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

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

const statusLabels: Record<string, Record<string, string>> = {
  SCHEDULED:          { vi: "Lịch trình", en: "Scheduled", zh: "已排程", ja: "予定" },
  DECLARATION_OPEN:   { vi: "Mở đăng ký", en: "Declaration Open", zh: "开启报名", ja: "登録受付中" },
  DECLARATION_CLOSED: { vi: "Đóng đăng ký", en: "Declaration Closed", zh: "截止报名", ja: "登録終了" },
  RACE_ASSIGNED:      { vi: "Đã phân công", en: "Race Assigned", zh: "已分派", ja: "担当決定" },
  RUNNING:            { vi: "Đang diễn ra", en: "Running", zh: "进行中", ja: "進行中" },
  FINISHED:           { vi: "Đã kết thúc", en: "Finished", zh: "已结束", ja: "終了" },
  OFFICIAL:           { vi: "Chính thức", en: "Official", zh: "官方确认", ja: "確定" },
  STEWARDS_INQUIRY:   { vi: "Trọng tài xem xét", en: "Stewards Inquiry", zh: "裁判审查", ja: "審判調査中" },
  CANCELLED:          { vi: "Đã hủy", en: "Cancelled", zh: "已取消", ja: "中止" }
};

function statusBadge(status: string, preCheckCompleted?: boolean) {
  if (!status) return null;
  const s = status.toUpperCase();
  const lang = localStorage.getItem("app-lang") || "vi";
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    SCHEDULED:          { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.SCHEDULED[lang] || statusLabels.SCHEDULED.vi },
    DECLARATION_OPEN:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_OPEN[lang] || statusLabels.DECLARATION_OPEN.vi },
    DECLARATION_CLOSED: { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", label: statusLabels.DECLARATION_CLOSED[lang] || statusLabels.DECLARATION_CLOSED.vi },
    RACE_ASSIGNED:      { bg: "rgba(139,92,246,0.1)",  color: "#a08cf6", label: statusLabels.RACE_ASSIGNED[lang] || statusLabels.RACE_ASSIGNED.vi },
    RUNNING:            { bg: "rgba(234,179,8,0.1)",   color: "#eab308", label: statusLabels.RUNNING[lang] || statusLabels.RUNNING.vi },
    FINISHED:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.FINISHED[lang] || statusLabels.FINISHED.vi },
    OFFICIAL:           { bg: "rgba(74,222,128,0.1)",  color: "#4ade80", label: statusLabels.OFFICIAL[lang] || statusLabels.OFFICIAL.vi },
    STEWARDS_INQUIRY:   { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.STEWARDS_INQUIRY[lang] || statusLabels.STEWARDS_INQUIRY.vi },
    CANCELLED:          { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: statusLabels.CANCELLED[lang] || statusLabels.CANCELLED.vi },
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
  vi: {
    totalAssignments: "Tổng số phân công",
    pendingCheck: "Chờ kiểm duyệt/Giám sát",
    completedRaces: "Trận đấu đã hoàn thành",
    assignedRaces: "Nhiệm vụ & Trận đấu phân công",
    inspectMonitor: "Kiểm tra, giám sát và chốt kết quả cho các trận đấu được giao.",
    loadingRaces: "Đang tải các trận đấu được giao...",
    noRaces: "Hiện tại không có trận đấu nào được giao cho bạn.",
    startRace: "🟢 Bắt đầu trận",
    startPreCheck: "☑ Bắt đầu kiểm tra",
    gatesNotSet: "Chưa thiết lập Cổng (Gate)",
    monitorRecord: "👁 Giám sát & Ghi nhận",
    confirmResults: "🔴 Xác nhận kết quả",
    stewardReport: "📄 Báo cáo Trọng tài",
    backToHub: "Quay lại Bảng trọng tài",
    warningGatesNotSet: "Cảnh báo: Cổng xuất phát chưa được thiết lập đầy đủ cho tất cả nài/ngựa. Hãy yêu cầu Admin cấu hình cổng trước khi bắt đầu cuộc đua.",
    infoGatesSet: "Thông tin: Trận đấu đã đầy đủ cổng xuất phát. Bạn có thể cho phép bắt đầu cuộc đua trước giờ bằng cách bấm Xác nhận kiểm tra phía dưới để đưa trạng thái trận đấu sang RUNNING ngay lập tức.",
    preRaceInspection: "Kiểm tra tiền trận đấu cho",
    classLevel: "Hạng đấu",
    distance: "Cự ly",
    trackType: "Loại đường chạy",
    weightCheckTitle: "Kiểm tra cân nặng Ngựa & Nài",
    weightCheckSub: "Xác minh trọng lượng tạ mang theo, giống ngựa và kiểm tra an toàn trang bị trước khi mở cổng.",
    safetyCheck: "Hoàn thành danh sách kiểm tra an toàn?",
    safetyCheckSub: "Đảm bảo bác sĩ thú y đã kiểm duyệt tất cả ngựa, nài ngựa đã được cân và hộp xuất phát an toàn.",
    confirmPreCheck: "Xác nhận kiểm tra & Mở cổng xuất phát",
    liveSupervision: "Giám sát trực tiếp cho",
    raceInProgress: "Trận đấu đang diễn ra",
    emergencyStop: "🛑 Dừng trận đấu khẩn cấp",
    recordViolation: "⚠️ Ghi nhận vi phạm",
    activeRunners: "Thí sinh đang chạy",
    activeRunnersSub: "Các đối thủ đang chạy trên đường đua.",
    incidentsRecorded: "Sự cố / Vi phạm đã ghi nhận",
    incidentsRecordedSub: "Các vi phạm đã được trọng tài ghi nhận cho trận đấu này.",
    noIncidents: "Không có sự cố nào được ghi nhận. Trận đấu sạch cho đến nay.",
    raceCompleted: "Trận đấu đã kết thúc?",
    raceCompletedSub: "Chuyển sang bảng nhập kết quả chung cuộc để điền thứ hạng, thời gian chạy và gửi báo cáo chính thức.",
    finishRaceEnter: "Kết thúc trận & Nhập kết quả",
    logRulesViolation: "Ghi nhận vi phạm luật đua",
    runner: "Thí sinh (Ngựa / Nài)",
    violationDesc: "Mô tả vi phạm",
    assessedPenalty: "Hình phạt áp dụng",
    severeDq: "Vi phạm cực kỳ nghiêm trọng (Loại trực tiếp khỏi trận đấu ngay lập tức)",
    saveViolation: "Lưu vi phạm",
    finalResultEntry: "Nhập kết quả chung cuộc cho",
    finalResultEntrySub: "Gửi thứ hạng, thời gian chạy chính thức, các trường hợp loại trực tiếp và lập Báo cáo của Trọng tài để chia giải thưởng và cập nhật điểm rating.",
    officialFinishingSheet: "Bảng thứ hạng chính thức",
    officialFinishingSheetSub: "Xác minh thứ hạng và thời gian của từng con ngựa. Chọn cột DQ để loại thí sinh khỏi trận đấu.",
    stewardOfficialReport: "Báo cáo chính thức của Trọng tài",
    stewardOfficialReportSub: "Cung cấp bản tóm tắt bằng văn bản về cuộc đua, mô tả chi tiết bất kỳ cuộc điều tra sự cố, cảnh cáo hoặc ghi chú y tế.",
    approveOfficial: "Phê duyệt & Công bố chính thức",
    perfectWeight: "Cân nặng chuẩn",
    verified: "Đã xác nhận",
    scratched: "BỊ LOẠI (Y TẾ)",
    criticalOverweight: "Quá cân nghiêm trọng (Tối đa +1.0kg)",
    overweight: "Quá cân",
    requiresLeadWeight: "Cần mang thêm chì",
    gate: "Cổng",
    jockeyDetails: "Thông tin Nài",
    horseDetails: "Thông tin Ngựa",
    jockeyWeight: "Cân nài (kg)",
    requiredWeight: "Cân nặng yêu cầu",
    vetCheck: "Khám y tế & An toàn",
    status: "Trạng thái",
    cancel: "Hủy",
    close: "Đóng",
    weighInPassed: "Cân sau đua đạt",
    underweightDiscrepancy: "SAI LỆCH THIẾU CÂN",
    finalPosition: "Thứ hạng chung cuộc",
    weighInWeight: "Cân sau đua (kg)",
    finishTime: "Thời gian chạy",
    dq: "Loại (DQ)",
    stewardReportModalTitle: "Báo cáo chính thức của Trọng tài",
    resultsVerifiedAlert: "Kết quả đã được xác minh và công bố chính thức. Đóng trận đấu.",
    submissionFailedAlert: "Gửi kết quả thất bại: ",
    noReportCompiled: "Không có báo cáo nào được ghi nhận cho trận đấu này.",
    stopReasonPrompt: "Nhập lý do tạm dừng/hoãn cuộc đua khẩn cấp (Steward's Report):",
    emergencyStopSuccess: "Đã thực hiện dừng khẩn cấp. Trạng thái cuộc đua chuyển thành CANCELLED.",
    failedStopRace: "Không thể dừng cuộc đua: ",
    selectRunner: "-- Chọn Thí sinh --",
    violationLoggedSuccess: "Đã ghi nhận vi phạm thành công.",
    disqualifiedImmediately: "Đã ghi nhận vi phạm và LOẠI TRỰC TIẾP thí sinh ngay lập tức!",
    failedLogViolation: "Ghi nhận vi phạm thất bại: "
  },
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
    jockeyWeight: "Jockey Weight (kg)",
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
    failedLogViolation: "Failed to log violation: "
  },
  ja: {
    totalAssignments: "総割り当て数",
    pendingCheck: "確認/監視待ち",
    completedRaces: "完了したレース",
    assignedRaces: "担当レースと任務",
    inspectMonitor: "割り当てられたレースの検査、監視、結果確定を行います。",
    loadingRaces: "担当レースを読み込み中...",
    noRaces: "現在、あなたに割り当てられたレースはありません。",
    startRace: "🟢 レース開始",
    startPreCheck: "☑ 事前確認開始",
    gatesNotSet: "ゲート未設定",
    monitorRecord: "👁 監視と記録",
    confirmResults: "🔴 結果の確認",
    stewardReport: "📄 審判レポート",
    backToHub: "審判ハブに戻る",
    warningGatesNotSet: "警告: 发走ゲートが完全に設定されていません。レースを開始する前に管理者に設定を依頼してください。",
    infoGatesSet: "情報: すべての発走ゲートが設定されています。下の事前確認ボタンを押すことで、状態を即座にRUNNINGにし、早期にレースを開始できます。",
    preRaceInspection: "事前検査対象:",
    classLevel: "クラスレベル",
    distance: "距離",
    trackType: "コースタイプ",
    weightCheckTitle: "競走馬と騎手の重量確認",
    weightCheckSub: "ゲートを開ける前に、負担重量、品種、装備の安全性を確認します。",
    safetyCheck: "安全チェックリストは完了しましたか？",
    safetyCheckSub: "獣医師がすべての馬を承認し、騎手の計量が完了し、発走ゲートが安全であることを確認してください。",
    confirmPreCheck: "事前確認の完了とゲート開放",
    liveSupervision: "ライブ監視対象:",
    raceInProgress: "レース進行中",
    emergencyStop: "🛑 緊急停止",
    recordViolation: "⚠️ 違反記録",
    activeRunners: "出走中の競走馬",
    activeRunnersSub: "現在コース上を走っている競走馬。",
    incidentsRecorded: "記録されたインシデント",
    incidentsRecordedSub: "このレースで審判によって記録された違反。",
    noIncidents: "インシデントは記録されていません。今のところクリーンなレースです。",
    raceCompleted: "レースは完了しましたか？",
    raceCompletedSub: "着順、着差タイムを入力し、公式レポートを送信するための最終結果シートに移行します。",
    finishRaceEnter: "レース終了と結果入力",
    logRulesViolation: "ルール違反の記録",
    runner: "出走馬 (馬 / 騎手)",
    violationDesc: "違反内容の説明",
    assessedPenalty: "適用されるペナルティ",
    severeDq: "重大なルール違反 (直ちに失格処分)",
    saveViolation: "違反を保存",
    finalResultEntry: "最終結果入力対象:",
    finalResultEntrySub: "公式の着順、タイム、失格を入力し、賞金分配とレーティング更新のために審判レポートを作成します。",
    officialFinishingSheet: "公式着順表",
    officialFinishingSheetSub: "各馬の着顺とタイムを確認します。失格にする場合はDQ列にチェックを入れます。",
    stewardOfficialReport: "審判公式レポート",
    stewardOfficialReportSub: "インシデント調査、警告、または獣医のメモを含む、レースの概要を書面で提供します。",
    approveOfficial: "承認と公式宣言",
    perfectWeight: "適正重量",
    verified: "検証済み",
    scratched: "出走取消 (医療)",
    criticalOverweight: "重大な重量超過 (最大 +1.0kg)",
    overweight: "重量超過",
    requiresLeadWeight: "鉛重りが必要",
    gate: "枠番",
    jockeyDetails: "騎手詳細",
    horseDetails: "馬詳細",
    jockeyWeight: "騎手重量 (kg)",
    requiredWeight: "必要重量",
    vetCheck: "獣医・安全検査",
    status: "状態",
    cancel: "キャンセル",
    close: "閉じる",
    weighInPassed: "後検量合格",
    underweightDiscrepancy: "重量不足の不一致",
    finalPosition: "最終着順",
    weighInWeight: "後検量重量 (kg)",
    finishTime: "走破タイム",
    dq: "失格 (DQ)",
    stewardReportModalTitle: "審判公式レポート",
    resultsVerifiedAlert: "結果が正常に検証され、公式に宣言されました。レースを閉じます。",
    submissionFailedAlert: "送信に失敗しました: ",
    noReportCompiled: "このレースのレポートは作成されていません。",
    stopReasonPrompt: "緊急レース中断の理由を入力してください (審判レポート):",
    emergencyStopSuccess: "緊急停止が実行されました。レース状態はCANCELLEDに設定されました。",
    failedStopRace: "レースの停止に失敗しました: ",
    selectRunner: "-- 出走馬を選択 --",
    violationLoggedSuccess: "インシデント違反が正常に記録されました。",
    disqualifiedImmediately: "インシデントが記録され、該当馬は直ちに失格となりました！",
    failedLogViolation: "違反の記録に失敗しました: "
  },
  zh: {
    totalAssignments: "总指派数",
    pendingCheck: "等待确认/监察",
    completedRaces: "已完成比赛",
    assignedRaces: "指派的比赛与职责",
    inspectMonitor: "检查、监察并确定您所负责比赛的最终结果。",
    loadingRaces: "正在加载指派的比赛...",
    noRaces: "目前没有指派给您的比赛。",
    startRace: "🟢 开始比赛",
    startPreCheck: "☑ 开始赛前检查",
    gatesNotSet: "闸位未设置",
    monitorRecord: "👁 监察与记录",
    confirmResults: "🔴 确认结果",
    stewardReport: "📄 裁判报告",
    backToHub: "返回裁判中心",
    warningGatesNotSet: "警告: 起步闸位未完全配置。请在比赛开始前要求管理员配置闸位。",
    infoGatesSet: "信息: 所有起步闸位已配置完毕。您可以通过在下方确认赛前检查，立即将状态更改为RUNNING，从而提早开始比赛。",
    preRaceInspection: "赛前检查对象:",
    classLevel: "比赛级别",
    distance: "途程",
    trackType: "场地类型",
    weightCheckTitle: "赛马与骑师负重检查",
    weightCheckSub: "在开闸前，核实出赛负重、品种以及装备安全检查。",
    safetyCheck: "安全检查清单是否完成？",
    safetyCheckSub: "确保兽医已批准所有马谱参赛，骑师已完成出磅，且起步闸箱安全。",
    confirmPreCheck: "确认赛前检查并开闸",
    liveSupervision: "现场监察对象:",
    raceInProgress: "比赛进行中",
    emergencyStop: "🛑 紧急停止",
    recordViolation: "⚠️ 记录违规",
    activeRunners: "参赛马匹",
    activeRunnersSub: "目前在跑道上竞逐的马匹。",
    incidentsRecorded: "记录的事件",
    incidentsRecordedSub: "裁判针对本场比赛记录的违规行为。",
    noIncidents: "未记录任何事件。目前比赛过程干净。",
    raceCompleted: "比赛是否已完成？",
    raceCompletedSub: "转至最终成绩表，输入名次、完赛时间并提交您的官方报告。",
    finishRaceEnter: "结束比赛并输入成绩",
    logRulesViolation: "记录违反规则行为",
    runner: "参赛者 (马匹 / 骑师)",
    violationDesc: "违规行为描述",
    assessedPenalty: "所处处罚",
    severeDq: "严重违反规则 (立即取消比赛资格)",
    saveViolation: "保存违规记录",
    finalResultEntry: "最终成绩输入对象:",
    finalResultEntrySub: "提交官方名次、时间、取消资格情况，并撰写裁判报告以分配奖金和更新评分。",
    officialFinishingSheet: "官方名次表",
    officialFinishingSheetSub: "核实每匹马的名次与时间。勾选DQ列以取消参赛者资格。",
    stewardOfficialReport: "裁判官方报告",
    stewardOfficialReportSub: "提供书面的比赛总结，详细列出任何事件调查、警告或兽医记录。",
    approveOfficial: "批准并正式公布",
    perfectWeight: "完美重量",
    verified: "已核实",
    scratched: "退出比赛 (医疗原因)",
    criticalOverweight: "严重超重 (最大 +1.0kg)",
    overweight: "超重",
    requiresLeadWeight: "需要配鞍铅块",
    gate: "闸位",
    jockeyDetails: "骑师详情",
    horseDetails: "马匹详情",
    jockeyWeight: "骑师体重 (kg)",
    requiredWeight: "要求负重",
    vetCheck: "兽医与安全检查",
    status: "状态",
    cancel: "取消",
    close: "关闭",
    weighInPassed: "后检量合格",
    underweightDiscrepancy: "负重不足偏差",
    finalPosition: "最终名次",
    weighInWeight: "后检量重量 (kg)",
    finishTime: "完赛时间",
    dq: "取消资格 (DQ)",
    stewardReportModalTitle: "裁判官方报告",
    resultsVerifiedAlert: "结果已核实并正式公布。比赛已关闭。",
    submissionFailedAlert: "提交失败: ",
    noReportCompiled: "本场比赛未撰写任何报告。",
    stopReasonPrompt: "请输入紧急中止比赛的原因 (裁判报告):",
    emergencyStopSuccess: "紧急停止已执行。比赛状态已设为CANCELLED。",
    failedStopRace: "中止比赛失败: ",
    selectRunner: "-- 选择参赛马匹 --",
    violationLoggedSuccess: "事件违规行为已成功记录。",
    disqualifiedImmediately: "事件已记录，且该马匹已被立即取消比赛资格！",
    failedLogViolation: "记录违规行为失败: "
  }
};

export default function RefereeHub() {
  const { user } = useAuth();
  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  const [assignedRaces, setAssignedRaces] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sub-view state
  const [activeView, setActiveView] = useState<"list" | "check" | "supervise" | "confirm">("list");
  const [selectedRace, setSelectedRace] = useState<any | null>(null);
  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);

  // Pre-Check State
  const [weighedWeights, setWeighedWeights] = useState<Record<number, string>>({});
  const [vetChecks, setVetChecks] = useState<Record<number, string>>({});

  // Confirm Results State
  const [finalPositions, setFinalPositions] = useState<Record<number, string>>({});
  const [finishTimes, setFinishTimes] = useState<Record<number, string>>({});
  const [weighInWeights, setWeighInWeights] = useState<Record<number, string>>({});
  const [disqualifiedList, setDisqualifiedList] = useState<Record<number, boolean>>({});
  const [stewardReport, setStewardReport] = useState("");
  const [sortBy, setSortBy] = useState<"gate" | "rating">("gate");

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
  const [isSevereDq, setIsSevereDq] = useState(false);

  // Steward Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportModalContent, setReportModalContent] = useState("");
  const [reportModalRaceId, setReportModalRaceId] = useState("");

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
      const data = await api.get<any[]>(`/public/results?raceId=${race.id}`);
      setRaceEntries(data || []);
      // Initialize states
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
      const isVi = lang === "vi";

      // Count active entries (not scratched)
      const activeCount = raceEntries.filter(item => vetChecks[item.entry.id] !== "SCRATCH").length;
      const minEntries = selectedRace.minEntries || 3;
      if (activeCount < minEntries) {
        alert(isVi
          ? `Không thể xác nhận pre-check. Số lượng ngựa tham gia hoạt động (${activeCount}) nhỏ hơn mức tối thiểu yêu cầu (${minEntries}) của trận đấu.`
          : `Cannot confirm pre-check. Active entries count (${activeCount}) is below the minimum required (${minEntries}) for this race.`);
        setLoading(false);
        return;
      }
      
      // Validate weights before confirming
      for (const item of raceEntries) {
        const entryId = item.entry.id;
        const isScratched = vetChecks[entryId] === "SCRATCH";
        if (isScratched) continue;

        const reqWeight = item.entry.carriedWeight || 52.0;
        const weighed = parseFloat(weighedWeights[entryId]);
        if (isNaN(weighed)) {
          alert(isVi 
            ? `Vui lòng nhập cân nặng hợp lệ cho ngựa "${item.horse?.name}".`
            : `Please enter a valid weight for horse "${item.horse?.name}".`);
          setLoading(false);
          return;
        }

        const diff = weighed - reqWeight;
        if (diff < 0) {
          alert(isVi 
            ? `Không thể xác nhận pre-check. Ngựa "${item.horse?.name}" bị thiếu cân (cân nặng đo được ${weighed} kg, yêu cầu tối thiểu ${reqWeight} kg). Nài ngựa phải mang thêm quả cân chì để đạt cân nặng yêu cầu, hoặc phải loại ngựa khỏi cuộc đua (SCRATCH).`
            : `Cannot confirm pre-check. Horse "${item.horse?.name}" is underweight (weighed ${weighed} kg, required ${reqWeight} kg). Jockey must add lead weights to match required weight, or horse must be scratched.`);
          setLoading(false);
          return;
        }
        if (diff > 1.0) {
          alert(isVi 
            ? `Không thể xác nhận pre-check. Ngựa "${item.horse?.name}" bị quá cân (+${diff.toFixed(1)} kg, giới hạn tối đa cho phép là +1.0 kg). Vui lòng điều chỉnh lại cân nặng của nài ngựa hoặc loại ngựa khỏi cuộc đua (SCRATCH).`
            : `Cannot confirm pre-check. Horse "${item.horse?.name}" is too overweight (+${diff.toFixed(1)} kg, limit is +1.0 kg). Jockey weight must be corrected, or horse must be scratched.`);
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
      alert(isVi ? "Kiểm tra trước cuộc đua hoàn tất. Trận đấu đã sẵn sàng bắt đầu!" : "Pre-race check completed. The race is now ready to start!");
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      alert("Pre-check failed: " + err.message);
      setLoading(false);
    }
  };

  const handleStartRace = async (race: any) => {
    setLoading(true);
    try {
      await api.post(`/referee/races/${race.id}/start`);
      alert("Race started successfully. Now monitoring live!");
      // Directly go to live supervision
      handleStartSupervise(race);
    } catch (err: any) {
      alert("Failed to start race: " + err.message);
      setLoading(false);
    }
  };

  const handleStartSupervise = async (race: any) => {
    setSelectedRace(race);
    setLoading(true);
    try {
      const [entriesData, violationsData] = await Promise.all([
        api.get<any[]>(`/public/results?raceId=${race.id}`),
        api.get<any[]>(`/public/violations?raceId=${race.id}`).catch(() => []),
      ]);
      setRaceEntries(entriesData || []);
      setViolations(violationsData || []);
      setActiveView("supervise");
    } catch (err) {
      alert("Failed to load supervision data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRace || !violRunner) return;
    const [horseId, jockeyId] = violRunner.split("-").map(Number);
    const finalPenalty = isSevereDq ? `DISQUALIFIED` : violPenalty;
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
      alert(isSevereDq ? t.disqualifiedImmediately : t.violationLoggedSuccess);
      setShowViolModal(false);
      setViolDesc("");
      setViolPenalty("");
      setIsSevereDq(false);
      // Refresh supervision details
      handleStartSupervise(selectedRace);
    } catch (err: any) {
      alert(t.failedLogViolation + err.message);
    }
  };

  const handleStopRace = async (stewardReport: string) => {
    if (!selectedRace) return;
    setLoading(true);
    try {
      await api.post(`/referee/races/${selectedRace.id}/stop`, { stewardReport });
      alert(t.emergencyStopSuccess);
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      alert(t.failedStopRace + err.message);
      setLoading(false);
    }
  };

  const handleStartConfirmResults = () => {
    if (!selectedRace) return;
    const posMap: Record<number, string> = {};
    const tMap: Record<number, string> = {};
    const wMap: Record<number, string> = {};
    const dqMap: Record<number, boolean> = {};
    raceEntries.forEach((item: any, idx: number) => {
      const isAlreadyDq = item.entry.status === "DISQUALIFIED";
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
      const isVi = lang === "vi";
      
      // Validate times and positions before submitting
      for (const item of raceEntries) {
        const entryId = item.entry.id;
        const isDq = disqualifiedList[entryId] || item.entry.status === "DISQUALIFIED";
        if (!isDq) {
          const time = finishTimes[entryId];
          if (!time || !time.trim()) {
            alert(isVi 
              ? `Vui lòng nhập thời gian về đích cho ngựa "${item.horse?.name}" hoặc đánh dấu loại bỏ (DQ).`
              : `Please enter finishing time for horse "${item.horse?.name}" or mark as DQ.`);
            setLoading(false);
            return;
          }
          const pos = finalPositions[entryId];
          if (!pos || isNaN(parseInt(pos))) {
            alert(isVi
              ? `Không thể xác định thứ hạng về đích cho ngựa "${item.horse?.name}". Vui lòng kiểm tra lại thời gian.`
              : `Cannot determine final position for horse "${item.horse?.name}". Please check the finish time.`);
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

      alert(t.resultsVerifiedAlert);
      setActiveView("list");
      setSelectedRace(null);
      fetchDashboard();
    } catch (err: any) {
      alert(t.submissionFailedAlert + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openStewardReportModal = (raceId: string, report: string) => {
    setReportModalRaceId(raceId);
    setReportModalContent(report && report.trim() !== "null" ? report : t.noReportCompiled);
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

  if (activeView === "check" && selectedRace) {
    const isGatesFullySet = selectedRace.gatesFullySet;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> {t.backToHub}
          </button>
        </div>

        {!isGatesFullySet && (
          <div style={{ padding: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "0.5rem", color: "#f87171", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="alert-triangle" />
            <span>{t.warningGatesNotSet}</span>
          </div>
        )}

        {isGatesFullySet && (
          <div style={{ padding: "1rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "0.5rem", color: "#34d399", fontSize: "12px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{t.infoGatesSet}</span>
          </div>
        )}

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.preRaceInspection}</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <span>📍 {selectedRace.venue}</span>
              <span>📅 {selectedRace.startTime}</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "11px", fontFamily: "monospace" }}>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>{t.classLevel}</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.classLevel}</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>{t.distance}</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.distanceMeters}m</strong>
            </div>
            <div style={{ background: "rgba(21,19,16,0.6)", padding: "0.5rem 1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "0.375rem" }}>
              <span style={{ fontSize: "8px", color: "#a0a0a0", display: "block" }}>{t.trackType}</span>
              <strong style={{ color: "#f4f2ec" }}>{selectedRace.trackType}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>{t.weightCheckTitle}</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>{t.weightCheckSub}</p>
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  {[t.gate, t.horseDetails, t.jockeyDetails, t.jockeyWeight, t.requiredWeight, t.vetCheck, t.status].map(h => (
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
                  let badgeText = t.verified;
                  let badgeStyle = { bg: "rgba(16,185,129,0.1)", color: "#34d399" };
                  if (vetChecks[entryId] === "SCRATCH") {
                    badgeText = t.scratched;
                    badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                  } else if (diff > 1.0) {
                    badgeText = t.criticalOverweight;
                    badgeStyle = { bg: "rgba(239,68,68,0.1)", color: "#f87171" };
                  } else if (diff > 0) {
                    badgeText = `${t.overweight} +${diff.toFixed(1)}kg (${t.verified})`;
                    badgeStyle = { bg: "rgba(245,158,11,0.1)", color: "#fbbf24" };
                  } else if (diff < 0) {
                    badgeText = `${t.requiresLeadWeight}: +${Math.abs(diff).toFixed(1)}kg`;
                    badgeStyle = { bg: "rgba(59,130,246,0.1)", color: "#60a5fa" };
                  } else {
                    badgeText = t.perfectWeight;
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
                        <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · Rating: {item.horse?.currentRating}</div>
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
                          <option value="CLEARED">Cleared ({t.verified})</option>
                          <option value="SCRATCH">{t.scratched}</option>
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
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>{t.safetyCheck}</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{t.safetyCheckSub}</p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => setActiveView("list")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>{t.cancel}</button>
            <button onClick={handleConfirmCheck} disabled={!isGatesFullySet} style={{ padding: "0.5rem 1rem", background: isGatesFullySet ? "#10b981" : "#1f1f22", color: isGatesFullySet ? "#fff" : "#555", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: isGatesFullySet ? "pointer" : "not-allowed" }}>
              {t.confirmPreCheck}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === "supervise" && selectedRace) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("list")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> {t.backToHub}
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.liveSupervision}</span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
            <p style={{ fontSize: "12px", color: "#a0a0a0", display: "flex", gap: "1rem", marginTop: "0.5rem", alignItems: "center" }}>
              <span>📍 {selectedRace.venue}</span>
              <span style={{ color: "#eab308", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="activity" /> {t.raceInProgress}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => {
                const reason = prompt(t.stopReasonPrompt);
                if (reason && reason.trim()) {
                  handleStopRace(reason);
                }
              }}
              style={{ padding: "0.5rem 1.25rem", background: "#f59e0b", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}
            >
              {t.emergencyStop}
            </button>
            <button onClick={() => setShowViolModal(true)} style={{ padding: "0.5rem 1.25rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {t.recordViolation}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
          {/* Active Runners */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>{t.activeRunners}</h3>
                <p style={{ fontSize: "11px", color: "#a0a0a0" }}>{t.activeRunnersSub}</p>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {[t.gate, t.horseDetails, t.jockeyDetails, t.jockeyWeight, "Action"].map(h => (
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
                        <button onClick={() => { setViolRunner(`${item.horse.id}-${item.jockey.id}`); setShowViolModal(true); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Incidents Recorded */}
          <div className="rounded-xl flex flex-col overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>{t.incidentsRecorded}</h3>
              <p style={{ fontSize: "11px", color: "#a0a0a0" }}>{t.incidentsRecordedSub}</p>
            </div>
            <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", maxHeight: "350px" }}>
              {violations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 0", color: "#a0a0a0" }}>
                  <Icon name="thumbs-up" color="#10b981" />
                  <p style={{ fontSize: "12px", marginTop: "0.5rem" }}>{t.noIncidents}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {violations.map((v, i) => (
                    <div key={i} style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <h4 style={{ fontWeight: "bold", color: "#f87171", fontSize: "12px" }}>{v.horseName}</h4>
                        <span style={{ fontSize: "8px", fontFamily: "monospace", textTransform: "uppercase", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>{t.dq}</span>
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

        {/* Finalization Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(21,19,16,0.4)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", borderRadius: "0.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ fontWeight: "bold", color: "#f4f2ec" }}>{t.raceCompleted}</h4>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{t.raceCompletedSub}</p>
          </div>
          <button onClick={handleStartConfirmResults} style={{ padding: "0.625rem 1.25rem", background: "#fbbf24", color: "#000", border: "none", borderRadius: "0.5rem", fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="check-square" /> {t.finishRaceEnter}
          </button>
        </div>

        {/* Log Violation Modal */}
        {showViolModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
            <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "28rem", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Icon name="alert-triangle" color="#ef4444" /> {t.logRulesViolation}
                </h3>
                <button onClick={() => setShowViolModal(false)} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
              </div>
              <form onSubmit={handleSaveViolation} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>{t.runner}</label>
                  <select value={violRunner} onChange={e => setViolRunner(e.target.value)} required style={{ width: "100%", padding: "0.5rem", outline: "none" }}>
                    <option value="">{t.selectRunner}</option>
                    {sortedEntries.map(item => (
                      <option key={item.entry.id} value={`${item.horse.id}-${item.jockey.id}`}>
                        {item.horse?.name} ({item.jockey?.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>{t.violationDesc}</label>
                  <textarea value={violDesc} onChange={e => setViolDesc(e.target.value)} required placeholder="Describe what happened..." style={{ width: "100%", padding: "0.5rem", height: 80, resize: "none", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1rem", color: "#a0a0a0", marginBottom: "0.5rem" }}>{t.assessedPenalty}</label>
                  <input type="text" value={isSevereDq ? `DISQUALIFIED (${t.dq})` : violPenalty} disabled={isSevereDq} onChange={e => setViolPenalty(e.target.value)} required={!isSevereDq} placeholder="e.g. Fine $500..." style={{ width: "100%", padding: "0.5rem", outline: "none", opacity: isSevereDq ? 0.5 : 1 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" id="severeDq" checked={isSevereDq} onChange={e => setIsSevereDq(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor="severeDq" style={{ fontSize: "11px", color: "#f87171", fontWeight: "bold", cursor: "pointer" }}>
                    {t.severeDq}
                  </label>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button type="button" onClick={() => { setShowViolModal(false); setIsSevereDq(false); }} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{t.cancel}</button>
                  <button type="submit" style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>{t.saveViolation}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === "confirm" && selectedRace) {
    const lang = localStorage.getItem("app-lang") || "vi";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => setActiveView("supervise")} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "#a0a0a0", background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="arrow-left" /> {t.backToHub}
          </button>
        </div>

        <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.4)", padding: "1.5rem" }}>
          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.finalResultEntry}</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f4f2ec", fontFamily: "'Roboto Slab', serif", marginTop: "0.25rem" }}>{selectedRace.meetingName} - Race #{selectedRace.id}</h2>
          <p style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "0.25rem" }}>{t.finalResultEntrySub}</p>
        </div>

        <form onSubmit={handleConfirmResults} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", padding: "1.25rem 1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>{t.officialFinishingSheet}</h3>
                <p style={{ fontSize: "11px", color: "#a0a0a0" }}>{t.officialFinishingSheetSub}</p>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    {[t.gate, t.horseDetails, t.jockeyDetails, t.finalPosition, t.weighInWeight, t.finishTime, t.dq].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: h === t.dq ? "center" : "left", fontSize: "9px", fontFamily: "monospace", color: "#a0a0a0", textTransform: "uppercase" }}>{h}</th>
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
                    let wiText = t.weighInPassed;
                    let wiColor = "#34d399";
                    if (diff < -0.5) {
                      wiText = `${t.underweightDiscrepancy}: ${diff.toFixed(1)} kg (${t.dq.toLowerCase()})`;
                      wiColor = "#f87171";
                    } else {
                      wiText = `${t.weighInPassed} (${diff >= 0 ? "+" : ""}${diff.toFixed(1)} kg)`;
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
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>{item.horse?.breed} · Rating: {item.horse?.currentRating}</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 600, color: "#f4f2ec", fontSize: "13px" }}>{item.jockey?.username}</div>
                          <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>Weighed Out: {item.entry.carriedWeight || "52.0"} kg</div>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          {isAlreadyDq ? (
                            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem" }}>
                              {lang === "vi" ? "BỊ LOẠI" : "DISQUALIFIED"}
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
                            <input type="text" required={!isDq} placeholder="e.g. 1:48.35" value={isDq ? "DQ" : finishTimes[entryId] || ""} disabled={isDq} onChange={e => setFinishTimes(prev => ({ ...prev, [entryId]: e.target.value }))} style={{ width: 120, padding: "0.25rem 0.5rem", fontSize: "12px", outline: "none" }} />
                          )}
                        </td>
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <input type="checkbox" checked={isDq} disabled={isAlreadyDq} onChange={e => setDisqualifiedList(prev => ({ ...prev, [entryId]: e.target.checked }))} style={{ width: 16, height: 16, cursor: isAlreadyDq ? "not-allowed" : "pointer" }} />
                          {isAlreadyDq && (
                            <div style={{ fontSize: "9px", color: "#f87171", marginTop: "4px", fontWeight: "bold" }}>
                              {lang === "vi" ? "Vi phạm" : "Violation"}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec" }}>{t.stewardOfficialReport}</h3>
            <p style={{ fontSize: "11px", color: "#a0a0a0", marginBottom: "0.75rem" }}>{t.stewardOfficialReportSub}</p>
            <textarea value={stewardReport} onChange={e => setStewardReport(e.target.value)} required rows={5} placeholder="Insert race description..." style={{ width: "100%", padding: "0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "0.5rem", color: "#fff", fontSize: "12px", resize: "none", outline: "none" }} />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setActiveView("supervise")} style={{ padding: "0.5rem 1rem", background: "#1f1f22", border: "1px solid #2d2d30", color: "#a0a0a0", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}>{t.cancel}</button>
            <button type="submit" style={{ padding: "0.5rem 1rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "12px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer" }}>
              {t.approveOfficial}
            </button>
          </div>
        </form>
      </div>
    );
  }



  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {[
          { label: t.totalAssignments,       value: completedCount + pendingCount, color: PURPLE,    bg: `rgba(139,92,246,0.1)`,  icon: "📋" },
          { label: t.pendingCheck, value: pendingCount,   color: "#eab308",  bg: "rgba(234,179,8,0.1)",   icon: "⏱" },
          { label: t.completedRaces,          value: completedCount,  color: "#4ade80",  bg: "rgba(74,222,128,0.1)",  icon: "✅" },
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
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.3)" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(21,19,16,0.6)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec" }}>{t.assignedRaces}</h3>
            <p style={{ fontSize: "0.75rem", color: "#a0a0a0", marginTop: "0.25rem" }}>{t.inspectMonitor}</p>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {[t.hId, t.hMeeting, t.hTime, t.hDetails, t.hStatus, t.hActions].map((h, i) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: i === 5 ? "right" : "left", fontSize: "0.6rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a0a0a0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#a0a0a0" }}>{t.loadingRaces}</td></tr>
              ) : assignedRaces.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "2rem" }}>📭</span>
                      <span style={{ color: "#a0a0a0", fontSize: "0.875rem" }}>{t.noRaces}</span>
                    </div>
                  </td>
                </tr>
              ) : assignedRaces.map((race: any) => {
                const isPending = !["OFFICIAL", "FINISHED", "CANCELLED"].includes(race.status ?? "");
                const isRunning = race.status === "RUNNING";
                const isOfficial = race.status === "OFFICIAL";
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
                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "#a0a0a0", fontFamily: "monospace" }}>{race.startTime}</td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontSize: "0.875rem", color: "#f4f2ec" }}>{race.classLevel}</div>
                      <div style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.125rem" }}>{race.distanceMeters}m · {race.trackType}</div>
                    </td>
                    <td style={{ padding: "1rem" }}>{statusBadge(race.status, race.preCheckCompleted)}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {isPending && !isRunning && (
                        race.preCheckCompleted ? (
                          <button onClick={() => handleStartRace(race)} style={{ padding: "0.375rem 0.75rem", background: "#10b981", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                            {t.startRace}
                          </button>
                        ) : race.gatesFullySet ? (
                          <button onClick={() => handleStartCheck(race)} style={{ padding: "0.375rem 0.75rem", background: PURPLE, color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                            {t.startPreCheck}
                          </button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                            <span style={{ fontSize: "8px", color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "0.125rem 0.25rem", borderRadius: "0.25rem" }}>{t.gatesNotSet}</span>
                            <button disabled style={{ padding: "0.375rem 0.75rem", background: "#1f1d1a", color: "#555", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "not-allowed", border: "none" }}>
                              🔒 {t.startPreCheck}
                            </button>
                          </div>
                        )
                      )}
                      {isRunning && (
                        <button onClick={() => handleStartSupervise(race)} style={{ padding: "0.375rem 0.75rem", background: "#fbbf24", color: "#000", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer", border: "none" }}>
                          {t.monitorRecord}
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
                          {t.confirmResults}
                        </button>
                      )}
                      {isOfficial && (
                        <button onClick={() => openStewardReportModal(race.id, race.stewardReport)} style={{ padding: "0.375rem 0.75rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, borderRadius: "0.5rem", cursor: "pointer" }}>
                          {t.stewardReport}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Steward Report Modal */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
          <div style={{ background: "#151310", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", width: "100%", maxWidth: "32rem", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {t.stewardReportModalTitle}
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
              <button onClick={() => setShowReportModal(false)} style={{ padding: "0.5rem 1rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

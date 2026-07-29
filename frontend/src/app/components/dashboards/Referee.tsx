import { $t } from '@/lib/i18n';
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import RefereeHub from "../referee-workflow/RefereeHub";
import RefereeIncidents from "../referee-workflow/RefereeIncidents";
import RefereeDuties from "../referee-workflow/RefereeDuties";
import ProfileTab from "./components/ProfileTab";

// Khai báo các loại tab cho dashboard của trọng tài
type RefereeTab = "hub" | "incidents" | "duties" | "profile";

// Màu sắc chủ đạo cho vai trò trọng tài
const ROLE_COLOR = "#8b5cf6";

// Cấu hình ngôn ngữ cho các tab (mặc dù đã dùng $t)
const TRANSLATIONS: Record<string, Record<string, string>> = {
  vi: {
    refereeHub: "Bảng trọng tài",
    incidents: "Nhật ký sự cố",
    duties: "Lịch phân công",
  },
  en: {
    refereeHub: "Referee Hub",
    incidents: "Incidents",
    duties: "Duties",
  },
  ja: {
    refereeHub: "審判ハブ",
    incidents: "インシデント",
    duties: "任務",
  },
  zh: {
    refereeHub: "裁判中心",
    incidents: "事件记录",
    duties: "职责",
  }
};

// ── Component chính cho Dashboard Trọng tài ──────────────────────────────
export default function Referee() {
  const { user } = useAuth(); // Lấy thông tin người dùng đang đăng nhập
  
  // State quản lý tab hiện tại
  const [activeTab, setActiveTab] = useState<RefereeTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as RefereeTab) || "hub";
  });
  
  // State quản lý thông báo thành công và lỗi
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const lang = localStorage.getItem("app-lang") || "vi";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;

  // Định nghĩa các mục trên thanh điều hướng
  const navItems = [
    { index: "01", icon: "layout-dashboard", label: $t("Bảng trọng tài", (localStorage.getItem('app-lang') || 'vi')),   view: "hub"       },
    { index: "02", icon: "alert-triangle",   label: $t("Nhật ký sự cố", (localStorage.getItem('app-lang') || 'vi')),     view: "incidents" },
    { index: "03", icon: "clipboard-check",  label: $t("Lịch phân công", (localStorage.getItem('app-lang') || 'vi')),        view: "duties"    },
  ];

  // Lấy tên tab hiện hành
  const activeLabel = navItems.find(n => n.view === activeTab)?.label ?? $t("Bảng trọng tài", (localStorage.getItem('app-lang') || 'vi'));

  // Hàm chuyển đổi view
  const handleViewChange = (view: string) => {
    setActiveTab(view as RefereeTab);
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Render nội dung tương ứng theo tab
  const renderContent = () => {
    switch (activeTab) {
      case "hub":       return <RefereeHub />;
      case "incidents": return <RefereeIncidents />;
      case "duties":    return <RefereeDuties />;
      case "profile":   return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Referee" />;
      default:          return <RefereeHub />;
    }
  };

  return (
    <DashboardLayout
      roleLabel="Referee"
      roleColor={ROLE_COLOR}
      activeLabel={activeLabel}
      currentView={activeTab}
      navItems={navItems}
      onViewChange={handleViewChange}
      successMsg={successMsg}
      errorMsg={errorMsg}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

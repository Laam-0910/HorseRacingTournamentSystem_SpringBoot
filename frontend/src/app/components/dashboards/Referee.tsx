import { $t } from '@/lib/i18n';
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import RefereeHub from "../referee-workflow/RefereeHub";
import RefereeIncidents from "../referee-workflow/RefereeIncidents";
import RefereeDuties from "../referee-workflow/RefereeDuties";
import ProfileTab from "./components/ProfileTab";

// Định nghĩa tập hợp các Tab giao diện khả dụng trong Dashboard của Trọng tài
type RefereeTab = "hub" | "incidents" | "duties" | "profile";

// Mã màu tím đặc trưng làm giao diện chủ đạo cho trọng tài Referee
const ROLE_COLOR = "#8b5cf6";

// Từ điển tiếng Anh hỗ trợ tiêu đề
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    refereeHub: "Referee Hub",
    incidents: "Incidents",
    duties: "Duties",
  }
};

/**
 * Component Referee - Bảng điều khiển chính của Trọng tài (Referee).
 * Quản lý lịch phân công nhiệm vụ giám sát trận đấu, ghi nhận các sự cố/vi phạm luật
 * của ngựa đua và kỵ sĩ ngay trên sân đấu, và cập nhật thông tin cá nhân.
 */
export default function Referee() {
  const { user } = useAuth();
  
  // State quản lý Tab hiển thị đang hoạt động, mặc định là "hub"
  const [activeTab, setActiveTab] = useState<RefereeTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as RefereeTab) || "hub";
  });
  // Banner thông điệp
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const t = TRANSLATIONS.en;

  // Cấu hình các nút điều hướng sidebar dành riêng cho Referee
  const navItems = [
    { index: "01", icon: "layout-dashboard", label: $t("Bảng trọng tài", (localStorage.getItem('app-lang') || 'vi')),   view: "hub"       },
    { index: "02", icon: "alert-triangle",   label: $t("Nhật ký sự cố", (localStorage.getItem('app-lang') || 'vi')),     view: "incidents" },
    { index: "03", icon: "clipboard-check",  label: $t("Lịch phân công", (localStorage.getItem('app-lang') || 'vi')),        view: "duties"    },
  ];

  // Tìm tiêu đề nhãn tương ứng cho view đang kích hoạt
  const activeLabel = navItems.find(n => n.view === activeTab)?.label ?? $t("Bảng trọng tài", (localStorage.getItem('app-lang') || 'vi'));

  // Xử lý đổi view và làm sạch các banner cũ
  const handleViewChange = (view: string) => {
    setActiveTab(view as RefereeTab);
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Hàm chuyển đổi nội dung render dựa trên tab đang hoạt động
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
    // DashboardLayout lo khung bọc ngoài và thanh điều hướng sidebar
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
      {/* Phân hệ giao diện Referee cụ thể được lồng vào */}
      {renderContent()}
    </DashboardLayout>
  );
}

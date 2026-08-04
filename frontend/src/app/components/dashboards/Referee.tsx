import { $t } from '@/lib/i18n';
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import RefereeHub from "../referee-workflow/RefereeHub";
import RefereeIncidents from "../referee-workflow/RefereeIncidents";
import RefereeDuties from "../referee-workflow/RefereeDuties";
import ProfileTab from "./components/ProfileTab";
import LiveSettings from "../admin-workflow/LiveSettings";
import NotificationCenterView from "./components/NotificationCenterView";

type RefereeTab = "hub" | "incidents" | "duties" | "live" | "profile" | "notifications";

const ROLE_COLOR = "#8b5cf6";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    refereeHub: "Referee Hub",
    incidents: "Incidents",
    duties: "Duties",
  }
};

/**
 */
export default function Referee() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<RefereeTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as RefereeTab) || "hub";
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const t = TRANSLATIONS.en;

  // Navigation items for Referee
  const navItems = [
    { index: "01", icon: "layout-dashboard", label: $t("Referee Dashboard"), view: "hub"       },
    { index: "02", icon: "bell",             label: $t("Notifications"),     view: "notifications" },
    { index: "03", icon: "alert-triangle",   label: $t("Incident Log"),     view: "incidents" },
    { index: "04", icon: "clipboard-check",  label: $t("Duty Schedule"),    view: "duties"    },
    { index: "05", icon: "tv",               label: $t("Livestream Feed"),  view: "live"     },
  ];

  // Active label for current view
  const activeLabel = navItems.find(n => n.view === activeTab)?.label ?? $t("Referee Dashboard");

  const handleViewChange = (view: string) => {
    setActiveTab(view as RefereeTab);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "hub":           return <RefereeHub />;
      case "incidents":     return <RefereeIncidents />;
      case "duties":        return <RefereeDuties />;
      case "live":          return <LiveSettings />;
      case "notifications": return <NotificationCenterView userId={user?.id} />;
      case "profile":       return <ProfileTab roleColor={ROLE_COLOR} roleLabel="Referee" />;
      default:              return <RefereeHub />;
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

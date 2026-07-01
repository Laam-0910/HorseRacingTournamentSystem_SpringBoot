import { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import RefereeHub from "../referee-workflow/RefereeHub";
import RefereeIncidents from "../referee-workflow/RefereeIncidents";
import RefereeDuties from "../referee-workflow/RefereeDuties";
import ProfileTab from "./components/ProfileTab";

type RefereeTab = "hub" | "incidents" | "duties" | "profile";

const ROLE_COLOR = "#8b5cf6";

const NAV_ITEMS = [
  { index: "01", icon: "layout-dashboard", label: "Referee Hub",   view: "hub"       },
  { index: "02", icon: "alert-triangle",   label: "Incidents",     view: "incidents" },
  { index: "03", icon: "clipboard-check",  label: "Duties",        view: "duties"    },
];

export default function Referee() {
  const [activeTab, setActiveTab] = useState<RefereeTab>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    return (tabParam as RefereeTab) || "hub";
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activeLabel = NAV_ITEMS.find(n => n.view === activeTab)?.label ?? "Referee Hub";

  const handleViewChange = (view: string) => {
    setActiveTab(view as RefereeTab);
    setSuccessMsg("");
    setErrorMsg("");
  };

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
      navItems={NAV_ITEMS}
      onViewChange={handleViewChange}
      successMsg={successMsg}
      errorMsg={errorMsg}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

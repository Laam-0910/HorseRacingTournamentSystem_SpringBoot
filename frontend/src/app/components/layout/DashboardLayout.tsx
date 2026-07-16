import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

interface NavItem {
  index: string;       // "01", "02"...
  icon: string;        // lucide icon name
  label: string;
  view: string;        // view key
  badge?: number;
}

interface DashboardLayoutProps {
  roleLabel: string;
  roleColor: string;
  activeLabel: string;
  currentView: string;
  navItems: NavItem[];
  onViewChange: (view: string) => void;
  children: React.ReactNode;
  successMsg?: string;
  errorMsg?: string;
}

// Lucide icon component via CDN-compatible SVG map
const ICONS: Record<string, JSX.Element> = {
  "layout-dashboard": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
  "layers": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  "calendar": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  "flag": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>,
  "file-check": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>,
  "layout": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  "clipboard-list": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>,
  "award": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  "user-cog": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>,
  "settings": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  "tv": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
  "book-open": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  "mail": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  "alert-triangle": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  "clipboard-check": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>,
  "trophy": <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  "home": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  "log-out": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  "chevron-left": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  "chevron-right": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  "bell": <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  "check-circle": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  "x-circle": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>,
  "alert-circle": <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  "clock": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  "info": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
  "activity": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  "bar-chart-3": <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-5"/><path d="M11 16V5"/><path d="M15 16v-3"/><path d="M19 16v-7"/></svg>,
};

function Icon({ name, size = 14, color }: { name: string; size?: number; color?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, color: color || 'currentColor', flexShrink: 0 }}>
      {icon}
    </span>
  );
}

const translateLabel = (label: string, lang: string): string => {
  const dict: Record<string, Record<string, string>> = {
    "Owner Hub": { vi: "Trang của tôi", en: "Owner Hub", zh: "业主中心", ja: "オーナーハブ" },
    "My Stable": { vi: "Chuồng ngựa của tôi", en: "My Stable", zh: "我的马房", ja: "マイ厩舎" },
    "Race Calendar": { vi: "Lịch đua", en: "Race Calendar", zh: "赛事日历", ja: "レースカレンダー" },
    "Invitations": { vi: "Lời mời", en: "Invitations", zh: "赛事邀请", ja: "招待状" },
    "Results & Earnings": { vi: "Kết quả & Thu nhập", en: "Results & Earnings", zh: "比赛结果与收益", ja: "結果と収益" },
    "Jockey Hub": { vi: "Trang của Jockey", en: "Jockey Hub", zh: "骑师中心", ja: "ジョッキーハブ" },
    "My Mounts": { vi: "Ngựa của tôi", en: "My Mounts", zh: "我的赛马", ja: "私の馬" },
    "Steward Board": { vi: "Bảng trọng tài", en: "Steward Board", zh: "裁判面板", ja: "審判ボード" },
    "Violation Reports": { vi: "Báo cáo vi phạm", en: "Violation Reports", zh: "违规报告", ja: "違反レポート" },
    "Rule Violations": { vi: "Vi phạm luật", en: "Rule Violations", zh: "违规记录", ja: "ルール違反" },
    "Spectator Hub": { vi: "Trang người xem", en: "Spectator Hub", zh: "观众主页", ja: "観客ハブ" },
    "Horse Registry": { vi: "Danh mục ngựa", en: "Horse Registry", zh: "马匹注册", ja: "馬の登録" },
    "System Dashboard": { vi: "Bảng điều khiển", en: "Dashboard", zh: "系统控制面板", ja: "ダッシュボード" },
    "Seasons": { vi: "Mùa giải", en: "Seasons", zh: "赛季管理", ja: "シーズン管理" },
    "Race Meetings": { vi: "Ngày hội đua", en: "Meetings", zh: "赛事日", ja: "レース開催日" },
    "Races": { vi: "Trận đấu", en: "Races", zh: "比赛管理", ja: "レース管理" },
    "Registrations": { vi: "Duyệt đăng ký", en: "Registrations", zh: "报名审核", ja: "登録管理" },
    "Users": { vi: "Người dùng", en: "Users", zh: "用户与角色", ja: "ユーザー管理" },
    "Rules": { vi: "Luật thi đấu", en: "Rules", zh: "规则设置", ja: "ルール設定" },
    "profile": { vi: "Thông tin cá nhân", en: "Profile", zh: "个人资料", ja: "プロフィール" },
    "Overview": { vi: "Tổng quan", en: "Overview", zh: "总览", ja: "概要" },
    "Live Watch": { vi: "Xem trực tiếp", en: "Live Watch", zh: "实况直播", ja: "ライブ視聴" },
    "Racecard": { vi: "Thẻ đua (Racecard)", en: "Racecard", zh: "排位表", ja: "出馬表" },
    "Results": { vi: "Kết quả", en: "Results", zh: "比赛赛果", ja: "レース結果" },
    "Horses": { vi: "Danh sách ngựa", en: "Horses", zh: "参赛马匹", ja: "競走馬リスト" },
    "Statistics": { vi: "Bảng thống kê", en: "Statistics", zh: "统计数据", ja: "統計データ" },
    "AI Assistant": { vi: "Trợ lý ảo AI", en: "AI Assistant", zh: "AI 助手", ja: "AIアシスタント" },
    "Horse Owner": { vi: "Chủ ngựa", en: "Horse Owner", zh: "马主", ja: "馬主" },
    "Jockey": { vi: "Nài ngựa", en: "Jockey", zh: "骑师", ja: "ジョッキー" },
    "Referee": { vi: "Trọng tài", en: "Referee", zh: "裁判", ja: "審判" },
    "Spectator": { vi: "Người xem", en: "Spectator", zh: "观众", ja: "観客" },
    "Admin": { vi: "Quản trị viên", en: "Admin", zh: "管理员", ja: "管理者" },
    "Referee Hub": { vi: "Bảng trọng tài", en: "Referee Hub", zh: "裁判面板", ja: "審判ボード" },
    "Incidents": { vi: "Lịch sử sự cố", en: "Incidents", zh: "违规记录", ja: "インシデント" },
    "Duties": { vi: "Lịch trình trọng tài", en: "Duties", zh: "值勤日程", ja: "任務" }
  };
  const key = Object.keys(dict).find(k => k.toLowerCase() === label.toLowerCase());
  if (key) {
    return dict[key][lang] || dict[key]["en"] || label;
  }
  return label;
};

export default function DashboardLayout({
  roleLabel,
  roleColor,
  activeLabel,
  currentView,
  navItems,
  onViewChange,
  children,
  successMsg,
  errorMsg,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-pinned') === 'false';
  });
  const [hovering, setHovering] = useState(false);
  const [today, setToday] = useState('');
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'vi');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const LANG_OPTIONS: [string, string][] = [['vi', 'Tiếng Việt'], ['en', 'English'], ['zh', '简体中文'], ['ja', '日本語']];
  const langLabel = LANG_OPTIONS.find(([c]) => c === lang)?.[1] || lang.toUpperCase();

  const changeLang = (code: string) => {
    setLang(code);
    localStorage.setItem('app-lang', code);
    setShowLangMenu(false);
    window.location.reload();
  };

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const d = new Date();
    setToday(d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-pinned', next ? 'false' : 'true');
  };

  const handleNavClick = (view: string) => {
    onViewChange(view);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const sidebarExpanded = !collapsed || hovering;
  const initials = ((user?.fullName || user?.username) || 'U').substring(0, 2).toUpperCase();

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--background)', color: 'var(--foreground)', '--role-color': roleColor } as React.CSSProperties}
    >
      {/* Sidebar Overlay backdrop on mobile */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <aside
        style={isMobile ? {
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '16rem',
          zIndex: 50,
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
        } : {
          width: sidebarExpanded ? '16rem' : '5rem',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
          flexShrink: 0,
          zIndex: 40,
          position: 'relative',
        }}
        onMouseEnter={() => !isMobile && collapsed && setHovering(true)}
        onMouseLeave={() => !isMobile && setHovering(false)}
      >
        <div
          id="sidebar"
          style={{
            width: isMobile ? '100%' : (sidebarExpanded ? '16rem' : '5rem'),
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--sidebar)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: !isMobile && collapsed && hovering ? 'absolute' : 'relative',
            boxShadow: (!isMobile && collapsed && hovering) ? '10px 0 30px rgba(0,0,0,0.65)' : 'none',
          }}
        >
          {/* Logo */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--sidebar-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '0.375rem', background: '#c9a227', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0e0c09' }}>
                  <Icon name="trophy" size={20} />
                </div>
                {(isMobile || sidebarExpanded) && (
                  <div className="sidebar-text">
                    <h1 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)', lineHeight: 1.2 }}>HorseRace</h1>
                    <p style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MS · 2026</p>
                  </div>
                )}
              </div>
              {isMobile ? (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.25rem', display: 'flex' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
              ) : (
                sidebarExpanded && (
                  <button
                    onClick={toggleSidebar}
                    style={{ color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.25rem', display: 'flex' }}
                  >
                    <Icon name="chevron-left" size={16} />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Profile */}
          <div 
            onClick={() => handleNavClick('profile')}
            title={lang === "vi" ? "Đến Trang cá nhân & 2FA" : lang === "zh" ? "前往个人中心 với 双重认证" : lang === "ja" ? "プロフィールと2FAへ" : "Go to Profile & 2FA"}
            style={{ 
              padding: '1rem 1.25rem', 
              borderBottom: '1px solid var(--sidebar-border)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            className="hover:bg-white/[0.04]"
          >
            <div style={{ 
              width: 36, height: 36, 
              borderRadius: '50%', 
              background: roleColor, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: '0.7rem', fontFamily: 'monospace', fontWeight: 700, 
              color: '#0e0c09', flexShrink: 0,
              overflow: 'hidden'
            }}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            {(isMobile || sidebarExpanded) && (
              <div style={{ overflow: 'hidden', flex: 1 }} className="sidebar-text">
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName || user?.username}</p>
                <p style={{ fontSize: '0.6rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: roleColor }}>{translateLabel(roleLabel, lang)}</p>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }} className="scrollbar-hide">
            {(isMobile || sidebarExpanded) && (
              <p style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.75rem', marginBottom: '0.5rem' }}>
                {lang === "vi" ? "Tiến trình" : lang === "zh" ? "工作流" : lang === "ja" ? "ワークフロー" : "Workflow"}
              </p>
            )}
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: (isMobile || sidebarExpanded) ? '0.625rem' : 0,
                    justifyContent: (isMobile || sidebarExpanded) ? 'flex-start' : 'center',
                    padding: (isMobile || sidebarExpanded) ? '0.5rem 0.75rem' : '0.5rem 0',
                    borderRadius: '0.5rem',
                    marginBottom: '0.125rem',
                    background: isActive ? `${roleColor}18` : 'transparent',
                    borderLeft: isActive ? `2px solid ${roleColor}` : '2px solid transparent',
                    cursor: 'pointer',
                    border: 'none',
                    borderLeftStyle: 'solid',
                    borderLeftWidth: 2,
                    borderLeftColor: isActive ? roleColor : 'transparent',
                    textAlign: 'left',
                    transition: 'all 0.25s',
                  }}
                >
                  {!(isMobile || sidebarExpanded) ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: isActive ? roleColor : 'rgba(255,255,255,0.4)', width: '100%', textAlign: 'center' }}>
                      {item.index}
                    </span>
                  ) : (
                    <>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', width: 20, textAlign: 'right', flexShrink: 0, color: isActive ? roleColor : 'rgba(255,255,255,0.25)' }}>
                        {item.index}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.75rem', color: isActive ? roleColor : 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="sidebar-text">
                        {translateLabel(item.label, lang)}
                      </span>
                    </>
                  )}
                  {(isMobile || sidebarExpanded) && item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                    <span style={{ background: roleColor, color: '#0b0d11', fontSize: '0.5rem', fontFamily: 'monospace', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: (isMobile || sidebarExpanded) ? '0.75rem' : 0, justifyContent: (isMobile || sidebarExpanded) ? 'flex-start' : 'center', width: 'calc(100% - 1.5rem)', margin: '0 0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.25rem', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Icon name="home" size={16} />
              {(isMobile || sidebarExpanded) && <span className="sidebar-text">{lang === "vi" ? "Về trang chủ" : lang === "zh" ? "返回首页" : lang === "ja" ? "ホームに戻る" : "Back to Home"}</span>}
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: (isMobile || sidebarExpanded) ? '0.75rem' : 0, justifyContent: (isMobile || sidebarExpanded) ? 'flex-start' : 'center', width: 'calc(100% - 1.5rem)', margin: '0 0.75rem 0.5rem', padding: '0.625rem 0.75rem', borderRadius: '0.25rem', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <Icon name="log-out" size={16} />
              {(isMobile || sidebarExpanded) && <span className="sidebar-text">{lang === "vi" ? "Đăng xuất" : lang === "zh" ? "退出登录" : lang === "ja" ? "ログアウト" : "Sign out"}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: '3.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: 'rgba(21,19,16,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  padding: '0.375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.25rem',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
            )}
            <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{translateLabel(activeLabel, lang)}</h2>
            <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', background: `${roleColor}22`, color: roleColor }}>
              {translateLabel(roleLabel, lang)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {!isMobile && <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{today}</span>}
            {/* Language Switcher */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLangMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)',
                  borderRadius: '0.375rem', padding: '0.3rem 0.65rem',
                  color: '#c9a227', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.68rem',
                  transition: 'all 0.2s',
                }}
              >
                🌐 {langLabel} ▾
              </button>
              {showLangMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                  width: '9rem', background: '#151310', border: '1px solid #2a2825',
                  borderRadius: '0.375rem', zIndex: 999, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}>
                  {LANG_OPTIONS.map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => changeLang(code)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.45rem 0.75rem', background: lang === code ? 'rgba(201,162,39,0.12)' : 'none',
                        border: 'none', color: lang === code ? '#c9a227' : '#a0a0a0',
                        cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'monospace',
                        transition: 'background 0.15s',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem' : '1.5rem' }} className="scrollbar-hide">
          {/* Success / Error banners */}
          {successMsg && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(74,157,111,0.1)', border: '1px solid rgba(74,157,111,0.2)', color: '#4a9d6f', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Icon name="check-circle" size={16} /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <Icon name="alert-circle" size={16} /> {errorMsg}
            </div>
          )}

          <div className="animate-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

export { Icon };

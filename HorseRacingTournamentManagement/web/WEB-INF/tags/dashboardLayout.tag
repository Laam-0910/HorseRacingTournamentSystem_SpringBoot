<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="roleLabel" required="true" type="java.lang.String" %>
<%@ attribute name="roleColor" required="true" type="java.lang.String" %>
<%@ attribute name="userName" required="true" type="java.lang.String" %>
<%@ attribute name="activeLabel" required="true" type="java.lang.String" %>
<%@ attribute name="profileActive" required="false" type="java.lang.Boolean" %>
<%@ attribute name="navItems" fragment="true" required="true" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activeLabel} - HorseRace Management</title>
    
    <!-- Google Fonts for English, Vietnamese, Chinese, Japanese -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Sans+JP:wght@300;400;500;700&family=Roboto+Slab:wght@300;400;500;700&display=swap" rel="stylesheet">

    <script>
      (function() {
        const pinned = localStorage.getItem('sidebar-pinned');
        if (pinned === 'false') {
          document.documentElement.classList.add('sidebar-collapsed');
        }
      })();
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              background: 'var(--background)',
              foreground: 'var(--foreground)',
              primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
              card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
              popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
              secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
              muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
              accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
              destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
              border: 'var(--border)',
              input: 'var(--input)',
              ring: 'var(--ring)',
              sidebar: {
                DEFAULT: 'var(--sidebar)',
                foreground: 'var(--sidebar-foreground)',
                border: 'var(--sidebar-border)',
                accent: 'var(--sidebar-accent)'
              }
            },
            fontFamily: {
              sans: ['Outfit', 'Noto Sans SC', 'Noto Sans JP', 'sans-serif'],
              serif: ['Roboto Slab', 'serif'],
              mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace']
            }
          }
        }
      }
    </script>
    <style>
      body {
        font-family: 'Outfit', 'Noto Sans SC', 'Noto Sans JP', sans-serif !important;
      }
      .font-serif {
        font-family: 'Roboto Slab', serif !important;
      }
      :root {
        --background: #0e0c09;
        --foreground: #f0f0f0;
        --primary: #c9a227;
        --primary-foreground: #0e0c09;
        --card: #151310;
        --card-foreground: #f0f0f0;
        --popover: #151310;
        --popover-foreground: #f0f0f0;
        --secondary: #1a1815;
        --secondary-foreground: #f0f0f0;
        --muted: #2a2825;
        --muted-foreground: #a0a0a0;
        --accent: #2a2825;
        --accent-foreground: #f0f0f0;
        --destructive: #c0392b;
        --destructive-foreground: #f0f0f0;
        --border: #2a2825;
        --input: #151310;
        --ring: #c9a227;
        --sidebar: #100f0c;
        --sidebar-foreground: #f0f0f0;
        --sidebar-border: #2a2825;
        --sidebar-accent: #1f1d1a;
        --radius: 0.5rem;
      }
      
      /* Sidebar wrapper transitions */
      #sidebar-wrapper {
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #sidebar {
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
      }
      
      /* Collapsed states */
      html.sidebar-collapsed #sidebar-wrapper {
        width: 5rem; /* w-20 */
      }
      html.sidebar-collapsed #sidebar {
        width: 5rem;
      }
      
      /* Hover expand state when collapsed */
      html.sidebar-collapsed #sidebar-wrapper:hover #sidebar {
        width: 16rem;
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.65);
        z-index: 50;
      }
      
      /* Hide elements when collapsed, unless hovered */
      html.sidebar-collapsed #sidebar:not(:hover) .sidebar-text {
        opacity: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        display: none !important;
      }
      
      /* Center nav icons when collapsed and not hovered */
      html.sidebar-collapsed #sidebar:not(:hover) nav a {
        justify-content: center !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        gap: 0 !important;
        border-left-width: 0px !important;
      }
      html.sidebar-collapsed #sidebar:not(:hover) nav a span {
        display: none !important;
      }
      
      /* Center footer icons when collapsed and not hovered */
      html.sidebar-collapsed #sidebar:not(:hover) .mt-auto button,
      html.sidebar-collapsed #sidebar:not(:hover) .mt-auto a {
        justify-content: center !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        gap: 0 !important;
        margin-left: 0.75rem !important;
        margin-right: 0.75rem !important;
        width: calc(100% - 1.5rem) !important;
      }
      
      /* Center profile avatar when collapsed and not hovered */
      html.sidebar-collapsed #sidebar:not(:hover) .sidebar-profile {
        justify-content: center !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      html.sidebar-collapsed #sidebar:not(:hover) .sidebar-profile .sidebar-text {
        display: none !important;
      }
      
      /* Transition for sidebar texts */
      .sidebar-text {
        transition: opacity 0.2s ease, width 0.2s ease;
      }
      
      /* Premium Hover and Animation Utilities */
      .hover-scale {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .hover-scale:hover {
        transform: scale(1.03) !important;
      }
      
      .hover-lift {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease !important;
      }
      .hover-lift:hover {
        transform: translateY(-3px) !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
      }
      
      .hover-glow {
        transition: box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease !important;
      }
      .hover-glow:hover {
        box-shadow: 0 0 15px rgba(201, 162, 39, 0.25) !important;
        border-color: #c9a227 !important;
      }
      
      /* Gold shine sweep button hover effect */
      .hover-sweep {
        position: relative;
        overflow: hidden;
      }
      .hover-sweep::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        transition: all 0.6s ease;
      }
      .hover-sweep:hover::after {
        left: 100%;
      }
      
      /* Card Hover Lift Glow combination */
      .hover-card {
        transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease !important;
      }
      .hover-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(201, 162, 39, 0.4) !important;
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(201, 162, 39, 0.1) !important;
      }

      /* Automatically style all cards inside dashboards with smooth hover effects */
      .rounded-xl.border,
      .rounded-xl[style*="border"] {
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease !important;
      }
      .rounded-xl.border:hover,
      .rounded-xl[style*="border"]:hover {
        border-color: #c9a227 !important;
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(201, 162, 39, 0.2) !important;
      }
      /* Only lift smaller stats/info cards (not massive tables or full page panels) */
      .rounded-xl.border:not(.overflow-x-auto):not(.overflow-hidden):hover,
      .rounded-xl[style*="border"]:not(.overflow-x-auto):not(.overflow-hidden):hover {
        transform: translateY(-5px) !important;
      }

      /* Hover underline slide-in for links */
      .hover-underline-slide {
        position: relative;
      }
      .hover-underline-slide::after {
        content: '';
        position: absolute;
        width: 100%;
        transform: scaleX(0);
        height: 1.5px;
        bottom: -2px;
        left: 0;
        background-color: #c9a227;
        transform-origin: bottom right;
        transition: transform 0.25s ease-out;
      }
      .hover-underline-slide:hover::after {
        transform: scaleX(1);
        transform-origin: bottom left;
      }

      /* Sidebar nav items hover effects just like landing page */
      nav a {
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease !important;
      }
      nav a:hover {
        transform: translateY(-2px) scale(1.02) !important;
        background-color: color-mix(in srgb, var(--role-color) 12%, transparent) !important;
        border-left-color: var(--role-color) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
      }
      nav a:hover span:not(.font-mono) {
        color: var(--role-color) !important;
      }
      nav a:hover i {
        color: var(--role-color) !important;
      }
      nav a:hover span.font-mono:not(.rounded-full) {
        color: color-mix(in srgb, var(--role-color) 80%, white 20%) !important;
      }

      /* Global high-visibility premium inputs styling */
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="date"],
      input[type="datetime-local"],
      select,
      textarea {
        background: linear-gradient(120deg, #1a1815 30%, #25221b 50%, #1a1815 70%) !important;
        background-size: 200% 100% !important;
        background-position: 0% 0% !important;
        border: 1.5px solid rgba(201, 162, 39, 0.35) !important;
        color: #f4f2ec !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        transition: border-color 0.3s ease, box-shadow 0.3s ease, background-position 0.5s ease, transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
      }
      input[type="text"]::placeholder,
      input[type="email"]::placeholder,
      input[type="password"]::placeholder,
      input[type="number"]::placeholder,
      textarea::placeholder {
        color: rgba(244, 242, 236, 0.4) !important;
      }
      input[type="text"]:hover,
      input[type="email"]:hover,
      input[type="password"]:hover,
      input[type="number"]:hover,
      input[type="date"]:hover,
      input[type="datetime-local"]:hover,
      select:hover,
      textarea:hover {
        background-position: 100% 0% !important;
        border-color: rgba(201, 162, 39, 0.6) !important;
        transform: translateY(-1.5px) scale(1.008) !important;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(201, 162, 39, 0.15) !important;
      }
      input[type="text"]:focus,
      input[type="email"]:focus,
      input[type="password"]:focus,
      input[type="number"]:focus,
      input[type="date"]:focus,
      input[type="datetime-local"]:focus,
      select:focus,
      textarea:focus {
        background-position: 100% 0% !important;
        border-color: var(--role-color, #c9a227) !important;
        transform: translateY(-2px) translateX(2px) scale(1.012) !important;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(201, 162, 39, 0.3) !important;
        outline: none !important;
      }
      input[type="text"]:active,
      input[type="email"]:active,
      input[type="password"]:active,
      input[type="number"]:active,
      input[type="date"]:active,
      input[type="datetime-local"]:active,
      select:active,
      textarea:active {
        transform: scale(0.985) translateY(0px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
      }

      /* Specific Select and Option overrides to prevent white-on-white text errors in Chrome/Edge */
      select {
        background: #1a1815 !important;
        color: #f4f2ec !important;
        color-scheme: dark !important;
      }
      select option {
        background-color: #151310 !important;
        color: #f4f2ec !important;
        color-scheme: dark !important;
      }

      /* Prevent browser autocomplete/autofill from overriding input styles (colors and backgrounds) */
      input:-webkit-autofill,
      input:-webkit-autofill:hover, 
      input:-webkit-autofill:focus, 
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #1a1815 inset !important;
        -webkit-text-fill-color: #f4f2ec !important;
        border: 1.5px solid rgba(201, 162, 39, 0.35) !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }

      /* High visibility invalid fields on user typing */
      input:invalid:not(:placeholder-shown) {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
      }

      /* Document Click Ripple Style */
      .click-ripple {
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        pointer-events: none;
        transform: translate3d(-50%, -50%, 0) scale(1);
        animation: ripple-effect 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        z-index: 99999;
        border-style: solid;
        border-width: 2px;
        will-change: transform, opacity;
      }
      
      @keyframes ripple-effect {
        0% {
          width: 0px;
          height: 0px;
          opacity: 1;
        }
        100% {
          width: 180px;
          height: 180px;
          opacity: 0;
          border-width: 0.5px;
        }
      }

      /* Document Click Spark Style */
      .click-spark {
        position: fixed;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 999999;
        animation: spark-fall 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        will-change: transform, opacity;
      }
      
      @keyframes spark-fall {
        0% {
          transform: translate3d(-50%, -50%, 0) translate3d(0, 0, 0) scale(1.2);
          box-shadow: 0 0 10px currentColor, 0 0 5px currentColor;
          opacity: 1;
        }
        100% {
          transform: translate3d(-50%, -50%, 0) translate3d(var(--dx), var(--dy), 0) scale(0);
          box-shadow: 0 0 0px transparent;
          opacity: 0;
        }
      }

      /* Card click feedback compression */
      a.rounded-xl.border:active,
      .rounded-xl.border.cursor-pointer:active,
      .rounded-xl.border.hover-card:active,
      a.rounded-xl[style*="border"]:active,
      .rounded-xl[style*="border"].cursor-pointer:active,
      .rounded-xl[style*="border"].hover-card:active {
        transform: scale(0.96) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4) !important;
        transition: transform 0.08s ease !important;
      }

      /* Premium Interactive Button styling */
      button, 
      .btn,
      input[type="submit"],
      a.bg-primary,
      a.bg-secondary,
      a.border,
      a.border-primary,
      a.px-3 {
        position: relative;
        overflow: hidden;
        transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.25s ease, background-color 0.25s ease, border-color 0.25s ease, filter 0.25s ease !important;
      }
      
      /* Shimmer Shine Sweep effect */
      button::after,
      .btn::after,
      input[type="submit"]::after,
      a.bg-primary::after,
      a.bg-secondary::after,
      a.border::after,
      a.border-primary::after {
        content: '';
        position: absolute;
        top: 0;
        left: -150%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.25) 50%,
          rgba(255, 255, 255, 0) 100%
        );
        transform: skewX(-25deg);
        transition: left 0.75s ease;
        pointer-events: none;
        z-index: 1;
      }
      
      button:hover::after,
      .btn:hover::after,
      input[type="submit"]:hover::after,
      a.bg-primary:hover::after,
      a.bg-secondary:hover::after,
      a.border:hover::after,
      a.border-primary:hover::after {
        left: 150%;
      }
      
      button:hover,
      .btn:hover,
      input[type="submit"]:hover,
      a.bg-primary:hover,
      a.bg-secondary:hover,
      a.border:hover,
      a.border-primary:hover {
        transform: translateY(-3.5px) scale(1.02) !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.55), 0 0 25px var(--role-color, #c9a227)88 !important;
        filter: brightness(1.1) !important;
      }
      
      button:active,
      .btn:active,
      input[type="submit"]:active,
      a.bg-primary:active,
      a.bg-secondary:active,
      a.border:active,
      a.border-primary:active {
        transform: scale(0.95) translateY(0px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        transition: transform 0.08s ease !important; /* Snappy click down transition */
      }

      /* Internal button click ripple style */
      .btn-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        transform: translate3d(-50%, -50%, 0) scale(0);
        animation: btn-ripple-expand 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        pointer-events: none;
        z-index: 2;
        will-change: transform, opacity;
      }
      
      @keyframes btn-ripple-expand {
        to {
          transform: translate3d(-50%, -50%, 0) scale(2.5);
          opacity: 0;
        }
      }
    </style>
    <!-- Flatpickr Datepicker CSS and Theme -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css">
</head>
<body class="bg-background text-foreground font-sans antialiased" style="--role-color: ${roleColor}">
    <div class="flex h-screen w-full bg-background overflow-hidden">
      <!-- Sidebar Wrapper -->
      <aside id="sidebar-wrapper" class="w-64 transition-all duration-300 shrink-0 z-40 relative">
        <!-- Sidebar Content -->
        <div id="sidebar" class="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300">
          <div class="p-5 border-b border-sidebar-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded flex items-center justify-center shrink-0" style="background: #c9a227">
                  <i data-lucide="trophy" style="width: 20px; height: 20px;" class="text-[#0e0c09]"></i>
                </div>
                <div class="sidebar-text">
                  <h1 class="font-['Roboto_Slab'] font-bold text-base text-foreground leading-tight">
                    HorseRace
                  </h1>
                  <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    MS · 2026
                  </p>
                </div>
              </div>
              <button id="sidebar-toggle" class="sidebar-text text-muted-foreground hover:text-foreground hover:bg-white/10 p-1.5 rounded transition-all cursor-pointer">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="sidebar-profile px-5 py-4 border-b border-sidebar-border w-full flex items-center justify-start gap-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[#0e0c09] shrink-0" style="background: ${roleColor}">
              ${userName.substring(0, 2).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1 sidebar-text">
              <p class="text-sm font-medium truncate text-foreground">
                ${userName}
              </p>
              <p class="text-[10px] font-mono uppercase tracking-widest" style="color: ${roleColor}">
                ${roleLabel}
              </p>
            </div>
          </div>

          <nav class="flex-1 p-3 overflow-y-auto">
            <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-3 mb-2 sidebar-text">
              Workflow
            </p>
            <jsp:invoke fragment="navItems" />
          </nav>

        <div class="mt-auto border-t border-sidebar-border pt-2">
          <c:if test="${not empty sessionScope.user && (sessionScope.user.roleId eq 2 || sessionScope.user.roleId eq 3)}">
            <button id="user-settings-trigger" class="mx-3 mt-2 px-3 py-2.5 flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-colors w-[calc(100%-1.5rem)] text-left cursor-pointer">
                <i data-lucide="shield-check" style="width: 16px; height: 16px;"></i>
                <span class="sidebar-text">Login 2FA Settings</span>
            </button>
          </c:if>
          <a href="${pageContext.request.contextPath}/MainController?action=home" class="mx-3 mt-2 px-3 py-2.5 flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-colors w-[calc(100%-1.5rem)] text-left">
              <i data-lucide="home" style="width: 16px; height: 16px;"></i>
              <span class="sidebar-text">Back to Home</span>
          </a>
          <form action="${pageContext.request.contextPath}/MainController" method="post" class="m-0 p-0">
              <input type="hidden" name="action" value="logout" />
              <button type="submit" class="mx-3 my-2 px-3 py-2.5 flex items-center gap-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors w-[calc(100%-1.5rem)] text-left">
                <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
                <span class="sidebar-text">Sign out</span>
              </button>
          </form>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <header class="h-14 border-b border-border flex items-center justify-between px-6 bg-card/40">
          <div class="flex items-center gap-3">
            <h2 class="font-['Roboto_Slab'] font-bold text-base text-foreground">
              ${activeLabel}
            </h2>
            <span class="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm" style="background: ${roleColor}22; color: ${roleColor}">
              ${roleLabel}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="font-mono text-xs text-muted-foreground hidden md:block">
              <!-- Insert date logic here if needed or render empty for now -->
              Today
            </span>
            <c:if test="${not empty sessionScope.user && sessionScope.user.roleId != 1}">
              <div class="relative flex">
                <button id="notificationBellBtn" onclick="toggleNotificationsDropdown(event)" class="relative text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center p-1.5 rounded-lg hover:bg-white/5">
                  <i data-lucide="bell" style="width: 18px; height: 18px;"></i>
                  <c:if test="${not empty notifications}">
                    <span id="unreadDot" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#c9a227] animate-pulse"></span>
                  </c:if>
                </button>
                
                <!-- Notification Dropdown Panel -->
                <div id="notificationsDropdown" class="absolute right-0 mt-3 w-80 bg-[#151310] border border-white/10 rounded-lg shadow-2xl overflow-hidden hidden z-50 transition-all duration-300 opacity-0 scale-95" style="transform-origin: top right;">
                  <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#1a1815]">
                    <h3 class="text-xs font-serif font-semibold text-white">Notifications</h3>
                    <button type="button" onclick="clearNotifications(event)" class="text-[10px] text-[#c9a227] hover:text-[#dfb830] transition-colors font-mono uppercase tracking-wider cursor-pointer">
                      Clear
                    </button>
                  </div>
                  <div class="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-hide text-left" id="notificationsList">
                    <c:choose>
                      <c:when test="${empty notifications}">
                        <div class="p-4 text-center text-white/40 text-xs font-mono">
                          Không có thông báo mới.
                        </div>
                      </c:when>
                      <c:otherwise>
                        <c:forEach var="notif" items="${notifications}">
                          <div class="p-3.5 flex gap-3 hover:bg-[#1a1815] transition-colors">
                            <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${notif.type eq 'approved' ? 'bg-emerald-500/10 text-emerald-400' : (notif.type eq 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-[#c9a227]/10 text-[#c9a227]')}">
                              <c:choose>
                                <c:when test="${notif.type eq 'approved'}">
                                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                                </c:when>
                                <c:when test="${notif.type eq 'rejected'}">
                                  <i data-lucide="x-circle" class="w-4 h-4"></i>
                                </c:when>
                                <c:otherwise>
                                  <i data-lucide="clock" class="w-4 h-4"></i>
                                </c:otherwise>
                              </c:choose>
                            </div>
                            <div class="text-left leading-tight flex-1">
                              <p class="text-xs text-white font-medium">${notif.title}</p>
                              <p class="text-[10px] text-white/60 mt-1">${notif.message}</p>
                            </div>
                          </div>
                        </c:forEach>
                      </c:otherwise>
                    </c:choose>
                  </div>
                  <div class="px-4 py-2 border-t border-white/10 text-center bg-[#1a1815]">
                    <span class="text-[9px] text-white/40 font-mono uppercase tracking-wider block py-1">
                      No more notifications
                    </span>
                  </div>
                </div>
              </div>
            </c:if>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto p-6">
            <jsp:doBody />
        </div>
      </main>
    </div>


    <!-- Security Settings Modal for Users (Jockey/Owner) -->
    <c:if test="${not empty sessionScope.user && sessionScope.user.roleId ge 2}">
      <div id="user-otp-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm opacity-0 pointer-events-none transition-all duration-300">
        <div id="user-otp-modal-container" class="bg-[#151310] border border-[#2a2825] p-6 rounded-xl w-full max-w-md shadow-2xl transform scale-95 transition-all duration-300">
          <div class="flex items-center justify-between pb-4 border-b border-[#2a2825]">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-[#c9a227]/10 flex items-center justify-center text-[#c9a227]">
                <i data-lucide="key-round" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <h3 class="font-['Roboto_Slab'] font-bold text-base text-foreground">2FA Settings</h3>
                <p class="text-[10px] text-muted-foreground uppercase tracking-widest">Personal Preferences</p>
              </div>
            </div>
            <button id="user-otp-close" class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <i data-lucide="x" style="width: 18px; height: 18px;"></i>
            </button>
          </div>
          
          <div class="py-6">
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <p class="text-sm font-semibold text-foreground">Require Email OTP</p>
                <p class="text-xs text-muted-foreground mt-1">If enabled, a verification code will be sent to your email when logging in.</p>
              </div>
              <div class="shrink-0">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="user-otp-checkbox" class="sr-only peer" ${not empty sessionScope.user && sessionScope.user.requireOtp ? 'checked' : ''} />
                  <div class="w-11 h-6 bg-[#2a2825] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a227]"></div>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-[#2a2825]">
            <div id="user-otp-status"></div>
            <button id="user-otp-close-btn" class="px-4 py-2 bg-[#1a1815] hover:bg-[#2a2825] text-foreground text-xs font-semibold rounded-lg transition-colors border border-[#2a2825] cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- User Settings AJAX and Modal Scripts -->
      <script>
        document.addEventListener('DOMContentLoaded', function() {
            const trigger = document.getElementById('user-settings-trigger');
            const modal = document.getElementById('user-otp-modal');
            const modalContainer = document.getElementById('user-otp-modal-container');
            const closeBtn = document.getElementById('user-otp-close');
            const closeBtn2 = document.getElementById('user-otp-close-btn');
            const checkbox = document.getElementById('user-otp-checkbox');
            const statusMsg = document.getElementById('user-otp-status');

            if (!trigger || !modal) return;

            function showModal() {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                modal.classList.add('opacity-100', 'pointer-events-auto');
                modalContainer.classList.remove('scale-95');
                modalContainer.classList.add('scale-100');
            }

            function hideModal() {
                modal.classList.remove('opacity-100', 'pointer-events-auto');
                modal.classList.add('opacity-0', 'pointer-events-none');
                modalContainer.classList.remove('scale-100');
                modalContainer.classList.add('scale-95');
                statusMsg.innerHTML = '';
            }

            trigger.addEventListener('click', showModal);
            closeBtn.addEventListener('click', hideModal);
            closeBtn2.addEventListener('click', hideModal);
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hideModal();
                }
            });

            checkbox.addEventListener('change', function() {
                const isChecked = checkbox.checked;
                statusMsg.innerHTML = '<span class="text-xs text-muted-foreground flex items-center gap-1.5"><svg class="animate-spin h-3.5 w-3.5 text-[#c9a227]" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Saving...</span>';
                
                const params = new URLSearchParams();
                params.append('action', 'toggleMyOtp');
                
                fetch('${pageContext.request.contextPath}/UserController', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString()
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        statusMsg.innerHTML = '<span class="text-xs text-green-500 font-medium flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> Saved</span>';
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    } else {
                        statusMsg.innerHTML = '<span class="text-xs text-red-500 font-medium flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Failed to save</span>';
                        checkbox.checked = !isChecked;
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error saving OTP configuration:', error);
                    statusMsg.innerHTML = '<span class="text-xs text-red-500 font-medium flex items-center gap-1"><i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Error connecting</span>';
                    checkbox.checked = !isChecked;
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                });
            });
        });
      </script>
    </c:if>

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
      lucide.createIcons();

      // Document Click Ripple and Spark Animation
      document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Skip form elements, buttons, links, and items inside them to prevent interaction lag
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' ||
            target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
          return; 
        }
        
        // Neon color palette for random selection on click
        const neonColors = [
          '#c9a227', // Gold
          '#00f0ff', // Neon Cyan
          '#ff007f', // Neon Pink
          '#a855f7', // Neon Purple
          '#22c55e', // Neon Green
          '#f97316', // Neon Orange
          '#ffffff'  // White
        ];
        
        // Pick random color for ripple border and glow
        const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];
        
        // Spawn ripple on empty whitespace click
        const ripple = document.createElement('span');
        ripple.className = 'click-ripple';
        ripple.style.borderColor = randomColor;
        ripple.style.background = `radial-gradient(circle, ${randomColor}55 0%, ${randomColor}00 70%)`;
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);
        setTimeout(() => {
          ripple.remove();
        }, 700);

        // Spawn 12 multi-colored burst sparks
        const numSparks = 12;
        for (let i = 0; i < numSparks; i++) {
          const spark = document.createElement('span');
          spark.className = 'click-spark';
          const sparkColor = neonColors[Math.floor(Math.random() * neonColors.length)];
          spark.style.backgroundColor = sparkColor;
          spark.style.color = sparkColor;
          spark.style.left = e.clientX + 'px';
          spark.style.top = e.clientY + 'px';
          
          const angle = Math.random() * Math.PI * 2;
          const distance = 35 + Math.random() * 65;
          const dx = Math.cos(angle) * distance;
          const dy = Math.sin(angle) * distance + 20;
          
          spark.style.setProperty('--dx', dx + 'px');
          spark.style.setProperty('--dy', dy + 'px');
          
          document.body.appendChild(spark);
          setTimeout(() => {
            spark.remove();
          }, 600);
        }
      });
      
      document.addEventListener('DOMContentLoaded', function() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

        function updateToggleIcon() {
          if (!toggleIcon) return;
          const isCollapsed = document.documentElement.classList.contains('sidebar-collapsed');
          toggleIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }

        if (toggleBtn) {
          toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            document.documentElement.classList.toggle('sidebar-collapsed');
            const isCollapsed = document.documentElement.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebar-pinned', isCollapsed ? 'false' : 'true');
            updateToggleIcon();
          });
        }
        
        updateToggleIcon();
      });

      // Snappy and smooth internal button click ripple effect
      document.addEventListener('mousedown', function(e) {
        const btn = e.target.closest('button, .btn, input[type="submit"], a.bg-primary, a.bg-secondary, a.border, a.border-primary, a.px-3');
        if (!btn) return;
        
        // Remove any existing ripples first
        const oldRipples = btn.querySelectorAll('.btn-ripple');
        oldRipples.forEach(r => r.remove());

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripple.style.width = ripple.style.height = (size * 2) + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        btn.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 550);
      });
    </script>
    <!-- Global Toast Notification Setup -->
    <c:set var="alertMessage" value="" />
    <c:if test="${not empty requestScope.message}">
        <c:set var="alertMessage" value="${requestScope.message}" />
    </c:if>
    <c:if test="${empty alertMessage and not empty sessionScope.message}">
        <c:set var="alertMessage" value="${sessionScope.message}" />
        <c:remove var="message" scope="session" />
    </c:if>
    <c:if test="${empty alertMessage and not empty param.message}">
        <c:set var="alertMessage" value="${param.message}" />
    </c:if>

    <c:if test="${not empty alertMessage}">
        <div id="global-toast" class="fixed top-5 right-5 z-[99999] flex items-center gap-3 bg-[#151310] border border-[#c9a227] rounded-lg px-4 py-3.5 shadow-2xl transition-all duration-500 ease-out translate-x-[120%] opacity-0">
            <div id="toast-icon-container" class="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            </div>
            <div class="text-left">
                <p id="toast-title" class="font-mono text-[9px] uppercase tracking-widest text-white/40">Notification</p>
                <p id="toast-text" class="text-xs text-[#f4f2ec] font-sans font-medium pr-6"><c:out value="${alertMessage}" /></p>
            </div>
            <button onclick="dismissToast()" class="absolute top-2 right-2 text-white/30 hover:text-white transition-colors">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const toast = document.getElementById('global-toast');
                const toastText = document.getElementById('toast-text').innerText;
                const iconContainer = document.getElementById('toast-icon-container');
                
                const isSuccess = toastText.toLowerCase().includes('success') || 
                                  toastText.toLowerCase().includes('thành công') || 
                                  toastText.toLowerCase().includes('verified') ||
                                  toastText.toLowerCase().includes('approved');
                                  
                if (isSuccess) {
                    iconContainer.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500';
                    iconContainer.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i>';
                    toast.style.borderColor = '#10b981';
                } else {
                    iconContainer.className = 'w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10 text-red-500';
                    iconContainer.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4"></i>';
                    toast.style.borderColor = '#ef4444';
                }
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                setTimeout(() => {
                    toast.classList.remove('translate-x-[120%]', 'opacity-0');
                }, 100);
                
                setTimeout(() => {
                    dismissToast();
                }, 5000);
            });

            function dismissToast() {
                const toast = document.getElementById('global-toast');
                if (toast) {
                    toast.classList.add('translate-x-[120%]', 'opacity-0');
                    setTimeout(() => {
                        toast.remove();
                    }, 500);
                }
            }
        </script>
    </c:if>
    <script>
      function toggleNotificationsDropdown(event) {
          if (event) event.stopPropagation();
          const dropdown = document.getElementById('notificationsDropdown');
          if (!dropdown) return;
          if (dropdown.classList.contains('hidden')) {
              dropdown.classList.remove('hidden');
              setTimeout(() => {
                  dropdown.classList.remove('opacity-0', 'scale-95');
                  dropdown.classList.add('opacity-100', 'scale-100');
              }, 10);
          } else {
              closeNotificationsDropdown();
          }
      }

      function closeNotificationsDropdown() {
          const dropdown = document.getElementById('notificationsDropdown');
          if (!dropdown || dropdown.classList.contains('hidden')) return;
          dropdown.classList.remove('opacity-100', 'scale-100');
          dropdown.classList.add('opacity-0', 'scale-95');
          setTimeout(() => {
              dropdown.classList.add('hidden');
          }, 150);
      }

      function clearNotifications(event) {
          if (event) event.stopPropagation();
          const list = document.getElementById('notificationsList');
          if (list) {
              list.innerHTML = `<div class="p-4 text-center text-white/40 text-xs font-mono">Không có thông báo mới.</div>`;
          }
          const dot = document.getElementById('unreadDot');
          if (dot) {
              dot.remove();
          }
      }

      document.addEventListener('click', function(event) {
          const dropdown = document.getElementById('notificationsDropdown');
          const btn = document.getElementById('notificationBellBtn');
          if (dropdown && !dropdown.classList.contains('hidden') && btn && !btn.contains(event.target) && !dropdown.contains(event.target)) {
              closeNotificationsDropdown();
          }
      });
    </script>
    <!-- Flatpickr Datepicker JS -->
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        // Initialize date picker
        flatpickr(".date-picker", {
            dateFormat: "d/m/Y",
            theme: "dark",
            allowInput: true
        });
        
        // Initialize date-time picker
        flatpickr(".datetime-picker", {
            enableTime: true,
            dateFormat: "d/m/Y H:i",
            time_24hr: true,
            theme: "dark",
            allowInput: true
        });
      });
    </script>
</body>
</html>

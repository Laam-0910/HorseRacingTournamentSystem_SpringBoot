<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>

<style>
.welcome-card-glass {
    background: linear-gradient(135deg, rgba(20, 24, 38, 0.7), rgba(11, 13, 20, 0.8)) !important;
    border: 1px solid rgba(201, 162, 39, 0.16) !important;
    backdrop-filter: blur(16px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.stat-card-glass {
    background: rgba(255, 255, 255, 0.02) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(8px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card-glass:hover {
    background: rgba(201, 162, 39, 0.02) !important;
    border-color: rgba(201, 162, 39, 0.25) !important;
    transform: translateY(-2px);
}
.quick-action-card {
    background: rgba(255, 255, 255, 0.015) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    text-decoration: none !important;
}
.quick-action-card:hover {
    background: rgba(201, 162, 39, 0.03) !important;
    border-color: rgba(201, 162, 39, 0.35) !important;
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), 0 0 15px rgba(201, 162, 39, 0.05);
}
</style>

<div class="max-w-4xl mx-auto py-8 px-4 space-y-8 text-[#f4f2ec]">
    <!-- Welcome Header Banner -->
    <div class="welcome-card-glass rounded-2xl p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-[#c9a227]/5 blur-3xl"></div>
        <div class="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl"></div>
        
        <div class="space-y-4 text-center md:text-left flex-1">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest text-[#c9a227] bg-[#c9a227]/10 border border-[#c9a227]/25">
                👑 ADMINISTRATIVE OVERVIEW
            </span>
            <h1 class="font-['Roboto_Slab'] text-2xl md:text-4xl font-bold tracking-wide text-zinc-100">
                Welcome to the Admin Dashboard
            </h1>
            <p class="text-xs text-zinc-400 max-w-lg leading-relaxed font-sans">
                Welcome back, Administrator. Use this central management panel to coordinate and run the tournament cycles, configure class rules, manage entries, and publish results.
            </p>
        </div>
        
        <!-- Live System Info Box -->
        <div class="w-full md:w-auto shrink-0 bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3 font-mono text-[11px] text-zinc-400 min-w-[200px]">
            <div class="flex items-center justify-between pb-2 border-b border-white/5">
                <span>System Status</span>
                <span class="text-emerald-400 font-bold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span>Active Season:</span>
                <span class="text-[#c9a227] font-bold">
                    <c:set var="hasActive" value="false" />
                    <c:forEach var="s" items="${seasons}">
                        <c:if test="${s.status eq 'ACTIVE'}">
                            <c:out value="${s.name}" />
                            <c:set var="hasActive" value="true" />
                        </c:if>
                    </c:forEach>
                    <c:if test="${not hasActive}">None</c:if>
                </span>
            </div>
            <div class="flex items-center justify-between">
                <span>Pending Approvals:</span>
                <span class="font-bold ${not empty totalPendingCount && totalPendingCount > 0 ? 'text-[#c9a227] animate-pulse' : 'text-zinc-500'}">
                    ${not empty totalPendingCount ? totalPendingCount : 0}
                </span>
            </div>
        </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Active Seasons -->
        <div class="stat-card-glass rounded-xl p-5 text-center">
            <span class="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block mb-1">Seasons</span>
            <span class="text-2xl font-bold font-mono text-[#c9a227]">
                ${not empty seasons ? fn:length(seasons) : 0}
            </span>
        </div>

        <!-- Total Meetings -->
        <div class="stat-card-glass rounded-xl p-5 text-center">
            <span class="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block mb-1">Meetings</span>
            <span class="text-2xl font-bold font-mono text-zinc-100">
                ${not empty meetings ? fn:length(meetings) : 0}
            </span>
        </div>

        <!-- Total Races -->
        <div class="stat-card-glass rounded-xl p-5 text-center">
            <span class="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block mb-1">Total Races</span>
            <span class="text-2xl font-bold font-mono text-zinc-100">
                ${not empty allRaces ? fn:length(allRaces) : 0}
            </span>
        </div>

        <!-- System Users -->
        <div class="stat-card-glass rounded-xl p-5 text-center">
            <span class="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block mb-1">Total Users</span>
            <span class="text-2xl font-bold font-mono text-zinc-100">
                ${not empty users ? fn:length(users) : 0}
            </span>
        </div>
    </div>

    <!-- Quick Navigation / Workflow -->
    <div class="space-y-4">
        <h3 class="font-['Roboto_Slab'] font-bold text-xs uppercase tracking-widest text-[#c9a227] pl-1">
            System Operations Quick Navigation
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Season Setup -->
            <a href="${pageContext.request.contextPath}/SeasonController" class="quick-action-card rounded-xl p-5 flex gap-4 items-start group">
                <div class="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[#c9a227] shrink-0">
                    <i data-lucide="layers" class="w-5 h-5"></i>
                </div>
                <div class="space-y-1">
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#c9a227] transition-colors">
                        Season Initialization
                    </h4>
                    <p class="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        Initialize tournament seasons, specify date ranges, and configure rating class rules.
                    </p>
                </div>
            </a>

            <!-- Meeting Setup -->
            <a href="${pageContext.request.contextPath}/AdminUserController?view=race-meeting" class="quick-action-card rounded-xl p-5 flex gap-4 items-start group">
                <div class="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[#c9a227] shrink-0">
                    <i data-lucide="calendar" class="w-5 h-5"></i>
                </div>
                <div class="space-y-1">
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#c9a227] transition-colors">
                        Race Meetings
                    </h4>
                    <p class="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        Schedule new race meetings, set track venues, and allocate prize money budgets.
                    </p>
                </div>
            </a>

            <!-- Registration Processing -->
            <a href="${pageContext.request.contextPath}/admin/registration-processing" class="quick-action-card rounded-xl p-5 flex gap-4 items-start group">
                <div class="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[#c9a227] shrink-0 relative">
                    <i data-lucide="file-check" class="w-5 h-5"></i>
                    <c:if test="${not empty totalPendingCount && totalPendingCount > 0}">
                        <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c9a227] animate-pulse"></span>
                    </c:if>
                </div>
                <div class="space-y-1">
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#c9a227] transition-colors">
                        Registration Processing
                    </h4>
                    <p class="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        Review, approve, or reject horse registrations, jockey licenses, and race entries.
                    </p>
                </div>
            </a>

            <!-- Direct Supervision -->
            <a href="${pageContext.request.contextPath}/admin/system-config" class="quick-action-card rounded-xl p-5 flex gap-4 items-start group">
                <div class="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[#c9a227] shrink-0">
                    <i data-lucide="settings" class="w-5 h-5"></i>
                </div>
                <div class="space-y-1">
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 group-hover:text-[#c9a227] transition-colors">
                        System Configuration
                    </h4>
                    <p class="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        Configure global system variables, settings, and other operational limits.
                    </p>
                </div>
            </a>
        </div>
    </div>
</div>

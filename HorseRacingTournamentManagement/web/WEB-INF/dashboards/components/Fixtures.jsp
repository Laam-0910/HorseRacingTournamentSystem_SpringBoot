<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<c:set var="fixActionPath" value="${param.action eq 'dashboard' ? 'MainController?action=dashboard&view=fixtures' : 'MainController?action=fixtures'}" />

<div class="space-y-8 p-6 bg-[#0b0a08] text-[#f4f2ec] rounded-xl border border-white/5 selection:bg-[#c9a227]/30 min-h-screen">
    
    <!-- Header -->
    <div class="border-b pb-6" style="border-color: rgba(201,162,39,0.1)">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Calendar & Schedule</span>
        <h1 class="font-['Roboto_Slab'] font-bold text-3xl text-[#f4f2ec] mt-1">Fixtures & Schedule</h1>
        <p class="text-xs font-mono mt-1 text-white/40">Browse upcoming race meetings, scheduled classes, and participant registrations.</p>
    </div>

    <!-- 1. Meeting Selector -->
    <div class="space-y-3">
        <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Select Race Meeting</span>
        <c:choose>
            <c:when test="${empty meetings}">
                <div class="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <p class="text-sm font-mono text-white/40">No race meetings scheduled in the system.</p>
                </div>
            </c:when>
            <c:otherwise>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <c:forEach var="meeting" items="${meetings}">
                        <a href="${pageContext.request.contextPath}/${fixActionPath}&meetingId=${meeting.id}" 
                           class="group relative p-5 border rounded-xl transition-all duration-300 ease-out block hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_4px_15px_rgba(201,162,39,0.08)] active:scale-95 ${meeting.id == selectedMeeting.id ? 'bg-[#c9a227]/10 border-[#c9a227] shadow-[0_0_15px_rgba(201,162,39,0.15)] font-semibold' : 'bg-white/[0.02] border-white/5 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5'}">
                            <div class="absolute top-4 right-4 text-xs font-mono text-[#c9a227]">
                                <c:choose>
                                    <c:when test="${meeting.id == selectedMeeting.id}">
                                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#c9a227]/20 font-bold">
                                            <span class="w-1.5 h-1.5 rounded-full bg-[#c9a227]"></span> Selected
                                        </span>
                                    </c:when>
                                    <c:otherwise>
                                        <i data-lucide="arrow-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                    </c:otherwise>
                                </c:choose>
                            </div>
                            <span class="text-[9px] font-mono uppercase tracking-widest text-white/30 block mb-1">Venue: ${meeting.venue}</span>
                            <h4 class="font-['Roboto_Slab'] font-bold text-base text-[#f4f2ec] group-hover:text-primary transition-colors pr-16">${meeting.name}</h4>
                            <p class="text-xs text-white/50 font-mono mt-3 flex items-center gap-1.5">
                                <i data-lucide="calendar" class="w-3.5 h-3.5 text-white/30"></i>
                                <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm"/>
                            </p>
                        </a>
                    </c:forEach>
                </div>
            </c:otherwise>
        </c:choose>
    </div>

    <!-- Selected Meeting Section -->
    <c:if test="${not empty selectedMeeting}">
        <div class="space-y-6 pt-4">
            <!-- Meeting Details Banner -->
            <div class="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <span class="text-[10px] font-mono uppercase tracking-widest text-[#c9a227]">Currently Viewing Meeting</span>
                        <h2 class="font-['Roboto_Slab'] font-bold text-2xl text-[#f4f2ec] mt-1">${selectedMeeting.name}</h2>
                        <div class="flex flex-wrap gap-4 mt-2.5 text-xs text-white/50 font-mono">
                            <span class="flex items-center gap-1.5">
                                <i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#c9a227]"></i>
                                ${selectedMeeting.venue}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <i data-lucide="calendar" class="w-3.5 h-3.5 text-[#c9a227]"></i>
                                <fmt:formatDate value="${selectedMeeting.startDate}" pattern="dd/MM/yyyy HH:mm"/>
                            </span>
                            <c:if test="${not empty selectedMeeting.totalBudget}">
                                <span class="flex items-center gap-1.5">
                                    <i data-lucide="dollar-sign" class="w-3.5 h-3.5 text-[#c9a227]"></i>
                                    Budget: $<fmt:formatNumber value="${selectedMeeting.totalBudget}" type="number" maxFractionDigits="0"/>
                                </span>
                            </c:if>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Races Table -->
            <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
                <div class="mb-4 pb-3 border-b border-white/5 flex items-center justify-between">
                    <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Race Schedule & Fixtures</h3>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                                <th class="py-3 px-4 w-12">R</th>
                                <th class="py-3 px-4">Start Time</th>
                                <th class="py-3 px-4">Race Class</th>
                                <th class="py-3 px-4">Track & Distance</th>
                                <th class="py-3 px-4">Purse (Prize)</th>
                                <th class="py-3 px-4">Entries</th>
                                <th class="py-3 px-4">Status</th>
                                <th class="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/[0.03]">
                            <c:forEach var="fixture" items="${raceFixtures}" varStatus="loop">
                                <tr class="hover:bg-white/[0.01] transition-colors group">
                                    <td class="py-4 px-4 font-mono text-sm font-bold text-[#c9a227]">
                                        ${loop.index + 1}
                                    </td>
                                    <td class="py-4 px-4 font-mono text-xs text-white/80">
                                        <fmt:formatDate value="${fixture.race.startTime}" pattern="HH:mm"/>
                                    </td>
                                    <td class="py-4 px-4 text-sm font-serif font-medium text-white/90">
                                        ${fixture.race.classLevel}
                                    </td>
                                    <td class="py-4 px-4 text-xs font-mono text-white/50">
                                        ${fixture.race.distanceMeters}m (${fixture.race.trackType})
                                    </td>
                                    <td class="py-4 px-4 font-mono text-xs text-[#c9a227]">
                                        <c:choose>
                                            <c:when test="${not empty fixture.race.purse}">
                                                $<fmt:formatNumber value="${fixture.race.purse}" type="number" maxFractionDigits="0"/>
                                            </c:when>
                                            <c:otherwise>N/A</c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td class="py-4 px-4 font-mono text-xs text-white/60">
                                        <span class="inline-flex items-center gap-1">
                                            <i data-lucide="shield" style="width:11px; height:11px;" class="text-white/40"></i>
                                            ${fixture.entryCount} declared
                                        </span>
                                    </td>
                                    <td class="py-4 px-4">
                                        <c:choose>
                                            <c:when test="${fixture.race.status eq 'SCHEDULED'}">
                                                <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(59,130,246,0.1); color: #3b82f6; border-color: rgba(59,130,246,0.3)">Scheduled</span>
                                            </c:when>
                                            <c:when test="${fixture.race.status eq 'DECLARATION_OPEN'}">
                                                <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(16,185,129,0.1); color: #10b981; border-color: rgba(16,185,129,0.3)">Dec Open</span>
                                            </c:when>
                                            <c:when test="${fixture.race.status eq 'DECLARATION_CLOSED'}">
                                                <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(245,158,11,0.1); color: #f59e0b; border-color: rgba(245,158,11,0.3)">Dec Closed</span>
                                            </c:when>
                                            <c:when test="${fixture.race.status eq 'RUNNING'}">
                                                <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block animate-pulse" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3)">Running</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.15)">${fixture.race.status}</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td class="py-4 px-4 text-right">
                                        <a href="${pageContext.request.contextPath}/MainController?action=racecard&meetingId=${selectedMeeting.id}&raceId=${fixture.race.id}" 
                                           class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="background: rgba(201,162,39,0.12); color: #c9a227; border: 1px solid rgba(201,162,39,0.25)">
                                            View Card
                                            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                        </a>
                                    </td>
                                </tr>
                            </c:forEach>
                            <c:if test="${empty raceFixtures}">
                                <tr>
                                    <td colspan="8" class="py-8 text-center font-mono text-xs text-white/30">
                                        No races scheduled for this meeting yet.
                                    </td>
                                </tr>
                            </c:if>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </c:if>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<c:set var="view" value="${empty param.view ? 'hub' : param.view}" />
<c:set var="activeLabel" value="Jockey Hub" />
<c:choose>
    <c:when test="${view eq 'hub'}"><c:set var="activeLabel" value="Jockey Hub" /></c:when>
    <c:when test="${view eq 'mounts'}"><c:set var="activeLabel" value="My Mounts" /></c:when>
    <c:when test="${view eq 'calendar'}"><c:set var="activeLabel" value="Race Calendar" /></c:when>
    <c:when test="${view eq 'invitations'}"><c:set var="activeLabel" value="Invitations" /></c:when>
    <c:when test="${view eq 'violations'}"><c:set var="activeLabel" value="Rule Violations" /></c:when>
</c:choose>

<t:dashboardLayout 
    roleLabel="Jockey" 
    roleColor="#3b82c4" 
    userName="${not empty sessionScope.user.username ? sessionScope.user.username : 'Asha Volkov'}" 
    activeLabel="${activeLabel}"
    profileActive="${view eq 'profile'}">
    
    <jsp:attribute name="navItems">
        <!-- Workflow -->
        <a href="?action=jockeyViewDashboard&view=hub" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'hub' ? '#3b82c418' : 'transparent'}; border-left: ${view eq 'hub' ? '2px solid #3b82c4' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'hub' ? '#3b82c4' : 'rgba(255,255,255,0.25)'}">01</span>
            <i data-lucide="layout-dashboard" style="width: 14px; height: 14px; color: ${view eq 'hub' ? '#3b82c4' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'hub' ? '#3b82c4' : 'rgba(255,255,255,0.65)'}">Jockey Hub</span>
        </a>
        <a href="?action=jockeyViewDashboard&view=mounts" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'mounts' ? '#3b82c418' : 'transparent'}; border-left: ${view eq 'mounts' ? '2px solid #3b82c4' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'mounts' ? '#3b82c4' : 'rgba(255,255,255,0.25)'}">02</span>
            <i data-lucide="flag" style="width: 14px; height: 14px; color: ${view eq 'mounts' ? '#3b82c4' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'mounts' ? '#3b82c4' : 'rgba(255,255,255,0.65)'}">My Mounts</span>
        </a>
        <a href="?action=jockeyViewDashboard&view=calendar" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'calendar' ? '#3b82c418' : 'transparent'}; border-left: ${view eq 'calendar' ? '2px solid #3b82c4' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'calendar' ? '#3b82c4' : 'rgba(255,255,255,0.25)'}">03</span>
            <i data-lucide="calendar" style="width: 14px; height: 14px; color: ${view eq 'calendar' ? '#3b82c4' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'calendar' ? '#3b82c4' : 'rgba(255,255,255,0.65)'}">Race Calendar</span>
        </a>
        <a href="?action=jockeyViewDashboard&view=invitations" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'invitations' ? '#3b82c418' : 'transparent'}; border-left: ${view eq 'invitations' ? '2px solid #3b82c4' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'invitations' ? '#3b82c4' : 'rgba(255,255,255,0.25)'}">04</span>
            <i data-lucide="mail" style="width: 14px; height: 14px; color: ${view eq 'invitations' ? '#3b82c4' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'invitations' ? '#3b82c4' : 'rgba(255,255,255,0.65)'}">Invitations</span>
            <c:if test="${not empty invitations && invitations.size() > 0}">
                <span class="bg-[#3b82c4] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-2">${invitations.size()}</span>
            </c:if>
        </a>
        <a href="?action=jockeyViewDashboard&view=violations" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'violations' ? '#3b82c418' : 'transparent'}; border-left: ${view eq 'violations' ? '2px solid #3b82c4' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'violations' ? '#3b82c4' : 'rgba(255,255,255,0.25)'}">05</span>
            <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: ${view eq 'violations' ? '#3b82c4' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'violations' ? '#3b82c4' : 'rgba(255,255,255,0.65)'}">Rule Violations</span>
        </a>
    </jsp:attribute>

    <jsp:body>
        <!-- Alerts block -->
        <c:if test="${not empty requestScope.message}">
            <div class="mb-4 p-3 rounded-lg border text-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                <span>${requestScope.message}</span>
            </div>
        </c:if>
        <c:if test="${not empty requestScope.error}">
            <div class="mb-4 p-3 rounded-lg border text-sm bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-2">
                <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                <span>${requestScope.error}</span>
            </div>
        </c:if>

        <c:choose>
            <%-- VIEW: HUB --%>
            <c:when test="${view eq 'hub'}">
                <div class="space-y-6">
                    <!-- Jockey Statistics Metrics Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div class="rounded-xl border p-4 bg-[#151310]/60 border-white/5 flex flex-col justify-between" style="border-color: rgba(255,255,255,0.08);">
                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Total Rides</p>
                            <p class="text-2xl font-bold text-[#f4f2ec]">${jockeyStats.totalRaces}</p>
                        </div>
                        <div class="rounded-xl border p-4 bg-[#151310]/60 border-white/5 flex flex-col justify-between" style="border-color: rgba(255,255,255,0.08);">
                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Wins (1st)</p>
                            <p class="text-2xl font-bold text-emerald-400">${jockeyStats.totalWins}</p>
                        </div>
                        <div class="rounded-xl border p-4 bg-[#151310]/60 border-white/5 flex flex-col justify-between" style="border-color: rgba(255,255,255,0.08);">
                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Top 3 Finishes</p>
                            <p class="text-2xl font-bold text-[#3b82c4]">${jockeyStats.top3}</p>
                        </div>
                        <div class="rounded-xl border p-4 bg-[#151310]/60 border-white/5 flex flex-col justify-between" style="border-color: rgba(255,255,255,0.08);">
                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Win Rate</p>
                            <p class="text-2xl font-bold text-primary font-mono"><fmt:formatNumber value="${jockeyStats.winRate}" pattern="0.0" />%</p>
                        </div>
                        <div class="rounded-xl border p-4 bg-[#151310]/60 border-white/5 flex flex-col justify-between col-span-2 md:col-span-1" style="border-color: rgba(255,255,255,0.08);">
                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Total Earnings (10%)</p>
                            <p class="text-2xl font-bold text-emerald-400 font-mono">$<fmt:formatNumber value="${jockeyStats.earnings}" pattern="#,##0" /></p>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Available Race Meetings</h3>
                        <p class="text-xs text-muted-foreground">Register for race meetings to make yourself available for stable hire invitations.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <c:forEach var="meeting" items="${meetings}">
                            <div class="rounded-xl border p-5 flex flex-col justify-between" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08);">
                                <div>
                                    <div class="flex justify-between items-start gap-3 mb-2">
                                        <h4 class="font-bold text-[#f4f2ec] text-base">${meeting.name}</h4>
                                        <c:choose>
                                            <c:when test="${registeredMeetingIds.contains(meeting.id)}">
                                                <c:set var="status" value="${regStatuses.get(meeting.id)}" />
                                                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${status eq 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (status eq 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}">
                                                    ${status}
                                                </span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                    UNREGISTERED
                                                </span>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="space-y-1.5 text-xs text-muted-foreground mb-4">
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="calendar" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Date: <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm" /></span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Venue: ${meeting.venue}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="award" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Total Purse: $<fmt:formatNumber value="${meeting.totalBudget}" pattern="#,##0" /></span>
                                        </div>
                                    </div>
                                </div>

                                <c:if test="${!registeredMeetingIds.contains(meeting.id)}">
                                    <form action="${pageContext.request.contextPath}/MainController" method="POST" class="m-0">
                                        <input type="hidden" name="action" value="jockeyRegisterMeeting" />
                                        <input type="hidden" name="raceMeetingId" value="${meeting.id}" />
                                        <button type="submit" class="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                                            <i data-lucide="user-plus" class="w-4 h-4"></i>
                                            Register Availability
                                        </button>
                                    </form>
                                </c:if>
                            </div>
                        </c:forEach>
                        <c:if test="${empty meetings}">
                            <div class="col-span-2 rounded-xl border p-8 text-center text-muted-foreground border-border bg-card/20">
                                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                <p class="text-sm">No upcoming race meetings scheduled.</p>
                            </div>
                        </c:if>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: MOUNTS --%>
            <c:when test="${view eq 'mounts'}">
                <div class="space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">My Mounts</h3>
                        <p class="text-xs text-muted-foreground">List of races where you are scheduled or have competed.</p>
                    </div>

                    <div class="rounded-xl border overflow-x-auto" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01);">
                        <table class="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr class="border-b" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02)">
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Entry ID</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Event / Meeting</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Race Details</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Horse</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Gate</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Weight</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Result</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <c:forEach var="mount" items="${mounts}">
                                    <tr>
                                        <td class="px-5 py-3.5 font-mono text-muted-foreground">#${mount.id}</td>
                                        <td class="px-5 py-3.5 font-medium text-foreground">${mount.meetingName}</td>
                                        <td class="px-5 py-3.5 text-muted-foreground">
                                            ${mount.classLevel} &middot; <fmt:formatDate value="${mount.startTime}" pattern="dd/MM/yyyy HH:mm" />
                                        </td>
                                        <td class="px-5 py-3.5 font-semibold text-foreground">${mount.horseName}</td>
                                        <td class="px-5 py-3.5 font-mono">${mount.gateNumber eq 0 ? 'TBA' : mount.gateNumber}</td>
                                        <td class="px-5 py-3.5 font-mono">${mount.carriedWeight} kg</td>
                                        <td class="px-5 py-3.5">
                                            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${mount.status eq 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (mount.status eq 'PENDING_ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}">
                                                ${mount.status}
                                            </span>
                                        </td>
                                        <td class="px-5 py-3.5 text-foreground">
                                            <c:choose>
                                                <c:when test="${mount.status eq 'FINISHED'}">
                                                    <span class="font-bold text-emerald-400">Pos: ${mount.finalPosition}</span>
                                                    <span class="text-[10px] text-muted-foreground font-mono block">Time: ${mount.finishTime}</span>
                                                </c:when>
                                                <c:otherwise>
                                                    <span class="text-muted-foreground italic">Scheduled</span>
                                                </c:otherwise>
                                            </c:choose>
                                        </td>
                                        <td class="px-5 py-3.5 text-right">
                                            <button type="button"
                                                    data-id="mount-${mount.id}"
                                                    data-race="${mount.classLevel} - ${mount.meetingName}"
                                                    onclick="initCompetitorsModal(this)"
                                                    class="inline-flex items-center gap-1 py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#f4f2ec] font-semibold text-[10px] rounded transition-colors">
                                                <i data-lucide="users" class="w-3 h-3 text-[#3b82c4]"></i>
                                                Competitors
                                            </button>

                                            <!-- Hidden competitors data -->
                                            <div id="competitors-data-mount-${mount.id}" class="hidden text-left">
                                                <c:forEach var="comp" items="${mount.competitors}">
                                                    <div class="competitor-row">
                                                        <span class="gate">${comp.gate eq 0 ? 'TBA' : comp.gate}</span>
                                                        <span class="horse"><c:out value="${comp.horseName}" /></span>
                                                        <span class="jockey"><c:out value="${comp.jockeyName}" /></span>
                                                    </div>
                                                </c:forEach>
                                            </div>
                                        </td>
                                    </tr>
                                </c:forEach>
                                <c:if test="${empty mounts}">
                                    <tr>
                                        <td colspan="9" class="px-5 py-8 text-center text-muted-foreground">
                                            No mounts allocated yet. Keep checking invitations!
                                        </td>
                                    </tr>
                                </c:if>
                            </tbody>
                        </table>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: CALENDAR --%>
            <c:when test="${view eq 'calendar'}">
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Race Calendar</h3>
                        <p class="text-xs text-muted-foreground">Overview of all scheduled races across upcoming meeting days.</p>
                    </div>

                    <div class="space-y-6">
                        <c:forEach var="meeting" items="${meetings}">
                            <div class="rounded-xl border overflow-hidden" style="background: rgba(255,255,255,0.01); border-color: rgba(255,255,255,0.06);">
                                <!-- Meeting Header -->
                                <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01]">
                                    <h4 class="font-bold text-[#f4f2ec] text-base">${meeting.name}</h4>
                                    <p class="text-[11px] text-muted-foreground mt-0.5">
                                        Date: <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm" /> &middot; Venue: ${meeting.venue}
                                    </p>
                                </div>

                                <!-- Races List -->
                                <div class="divide-y divide-white/5">
                                    <c:set var="hasRaces" value="false" />
                                    <c:forEach var="race" items="${races}">
                                        <c:if test="${race.raceMeetingId == meeting.id}">
                                            <c:set var="hasRaces" value="true" />
                                            <div class="p-5 flex flex-col md:flex-row justify-between gap-4">
                                                <div class="space-y-2 flex-1">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-sm font-bold text-[#f4f2ec]">${race.classLevel}</span>
                                                        <span class="text-[10px] font-mono bg-[#c9a227]/10 text-primary border border-[#c9a227]/20 px-2 py-0.5 rounded">
                                                            ${race.status}
                                                        </span>
                                                    </div>
                                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Start Time</p>
                                                            <p class="font-semibold text-foreground"><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm" /></p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Distance & Track</p>
                                                            <p class="font-semibold text-foreground">${race.distanceMeters}m (${race.trackType})</p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Rating limits</p>
                                                            <p class="font-semibold text-foreground">
                                                                ${race.minRating != null ? race.minRating : '0'} - ${race.maxRating != null ? race.maxRating : '∞'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Purse</p>
                                                            <p class="font-semibold text-emerald-400 font-mono">$<fmt:formatNumber value="${race.purse}" pattern="#,##0" /></p>
                                                        </div>
                                                    </div>
                                                    <div class="mt-2.5 text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
                                                        <span><strong class="text-[#c9a227]/80">Entries Open:</strong> <fmt:formatDate value="${race.registrationStartTime}" pattern="dd/MM/yyyy HH:mm" /></span>
                                                        <span><strong class="text-[#c9a227]/80">Declarations Close:</strong> <fmt:formatDate value="${race.registrationEndTime}" pattern="dd/MM/yyyy HH:mm" /></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </c:if>
                                    </c:forEach>
                                    <c:if test="${!hasRaces}">
                                        <div class="p-6 text-center text-xs text-muted-foreground font-semibold">
                                            No races scheduled for this meeting event yet.
                                        </div>
                                    </c:if>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: INVITATIONS --%>
            <c:when test="${view eq 'invitations'}">
                <div class="space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Received Jockey Invitations</h3>
                        <p class="text-xs text-muted-foreground">Review hire requests from horse owners. Confirming is first-come-first-served.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <c:forEach var="inv" items="${invitations}">
                            <div class="rounded-xl border p-5 flex flex-col justify-between" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08);">
                                <div class="space-y-3">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <span class="text-[10px] font-mono text-primary uppercase">From Stable</span>
                                            <h4 class="font-bold text-[#f4f2ec] text-base">${inv.ownerName}</h4>
                                        </div>
                                        <span class="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                                            ${inv.status}
                                        </span>
                                    </div>

                                    <div class="p-3 rounded-lg bg-white/[0.01] border border-white/5 space-y-1 text-xs">
                                        <p class="text-muted-foreground">Horse: <span class="font-bold text-foreground">${inv.horseName}</span> (Rating: <span class="text-primary font-bold">${inv.horseRating}</span>)</p>
                                        <p class="text-muted-foreground">Race Level: <span class="text-foreground">${inv.classLevel}</span></p>
                                        <p class="text-muted-foreground">Event: <span class="text-foreground">${inv.meetingName}</span></p>
                                        <p class="text-muted-foreground">Venue: <span class="text-foreground">${inv.venue}</span></p>
                                        <p class="text-muted-foreground">Start Time: <span class="text-foreground"><fmt:formatDate value="${inv.startTime}" pattern="dd/MM/yyyy HH:mm" /></span></p>
                                        <p class="text-muted-foreground">Specs: <span class="text-foreground">${inv.distanceMeters}m (${inv.trackType})</span> &middot; Purse: <span class="text-emerald-400 font-mono">$<fmt:formatNumber value="${inv.purse}" pattern="#,##0" /></span></p>
                                        <div class="mt-2.5 pt-2 border-t border-white/5 space-y-1 font-mono text-[10px]">
                                            <p class="text-muted-foreground"><strong class="text-[#c9a227]/80">Entries Open:</strong> <fmt:formatDate value="${inv.registrationStartTime}" pattern="dd/MM/yyyy HH:mm" /></p>
                                            <p class="text-muted-foreground"><strong class="text-[#c9a227]/80">Declarations Close:</strong> <fmt:formatDate value="${inv.registrationEndTime}" pattern="dd/MM/yyyy HH:mm" /></p>
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-2 mt-4">
                                    <div class="flex gap-2">
                                        <c:choose>
                                            <c:when test="${inv.raceStatus eq 'DECLARATION_OPEN'}">
                                                <form action="${pageContext.request.contextPath}/MainController" method="POST" class="m-0 flex-1">
                                                    <input type="hidden" name="action" value="jockeyRespondInvitation" />
                                                    <input type="hidden" name="invitationId" value="${inv.id}" />
                                                    <input type="hidden" name="status" value="ACCEPTED" />
                                                    <button type="submit" class="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                                                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                                        Accept
                                                    </button>
                                                </form>
                                            </c:when>
                                            <c:when test="${inv.raceStatus eq 'SCHEDULED'}">
                                                <div class="flex-1 py-2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-not-allowed" title="Registration has not opened yet">
                                                    Not Started
                                                </div>
                                            </c:when>
                                            <c:otherwise>
                                                <div class="flex-1 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-not-allowed" title="Registration has closed">
                                                    Closed
                                                </div>
                                            </c:otherwise>
                                        </c:choose>
                                        <form action="${pageContext.request.contextPath}/MainController" method="POST" class="m-0 flex-1">
                                            <input type="hidden" name="action" value="jockeyRespondInvitation" />
                                            <input type="hidden" name="invitationId" value="${inv.id}" />
                                            <input type="hidden" name="status" value="REJECTED" />
                                            <button type="submit" class="w-full py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                                Decline
                                            </button>
                                        </form>
                                    </div>
                                    <button type="button"
                                            data-id="inv-${inv.id}"
                                            data-race="${inv.classLevel} - ${inv.meetingName}"
                                            onclick="initCompetitorsModal(this)"
                                            class="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#f4f2ec] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <i data-lucide="users" class="w-3.5 h-3.5 text-[#3b82c4]"></i>
                                        View Competitors
                                    </button>

                                    <!-- Hidden competitors data -->
                                    <div id="competitors-data-inv-${inv.id}" class="hidden">
                                        <c:forEach var="comp" items="${inv.competitors}">
                                            <div class="competitor-row">
                                                <span class="gate">${comp.gate eq 0 ? 'TBA' : comp.gate}</span>
                                                <span class="horse"><c:out value="${comp.horseName}" /></span>
                                                <span class="jockey"><c:out value="${comp.jockeyName}" /></span>
                                            </div>
                                        </c:forEach>
                                    </div>
                                </div>
                            </div>
                        </c:forEach>
                        <c:if test="${empty invitations}">
                            <div class="col-span-2 rounded-xl border p-8 text-center text-muted-foreground border-border bg-card/20">
                                <i data-lucide="mail-open" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                <p class="text-sm">No pending invitations received.</p>
                            </div>
                        </c:if>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: VIOLATIONS --%>
            <c:when test="${view eq 'violations'}">
                <div class="space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Rule Violations</h3>
                        <p class="text-xs text-muted-foreground">List of rules violations logged by referees. Unconfirmed violations require your acknowledgment.</p>
                    </div>

                    <div class="rounded-xl border overflow-x-auto" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01);">
                        <table class="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr class="border-b" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02)">
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">ID</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Race Meeting</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Race / Horse</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Description</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Penalty</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Logged By</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <c:forEach var="item" items="${violations}">
                                    <tr>
                                        <td class="px-5 py-3.5 font-mono text-muted-foreground">#${item.violation.id}</td>
                                        <td class="px-5 py-3.5 font-medium text-foreground">${item.meeting.name}</td>
                                        <td class="px-5 py-3.5">
                                            <span class="text-foreground font-semibold">${item.race.classLevel}</span>
                                            <span class="text-[10px] text-muted-foreground block">Horse: ${item.horse.name}</span>
                                        </td>
                                        <td class="px-5 py-3.5 text-muted-foreground">${item.violation.description}</td>
                                        <td class="px-5 py-3.5 font-mono text-amber-400">${item.violation.penalty}</td>
                                        <td class="px-5 py-3.5 text-muted-foreground">${item.referee.username}</td>
                                        <td class="px-5 py-3.5">
                                            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${item.violation.status eq 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                                ${item.violation.status}
                                            </span>
                                        </td>
                                        <td class="px-5 py-3.5 text-right">
                                            <c:if test="${item.violation.status eq 'PENDING'}">
                                                <form action="${pageContext.request.contextPath}/JockeyController" method="POST" class="m-0 inline-block">
                                                    <input type="hidden" name="action" value="jockeyConfirmViolation" />
                                                    <input type="hidden" name="violationId" value="${item.violation.id}" />
                                                    <button type="submit" class="inline-flex items-center gap-1 py-1 px-2.5 bg-[#3b82c4] hover:bg-[#3b82c4]/90 text-white font-semibold text-[10px] rounded transition-colors cursor-pointer">
                                                        <i data-lucide="check" class="w-3 h-3"></i>
                                                        Acknowledge
                                                    </button>
                                                </form>
                                            </c:if>
                                        </td>
                                    </tr>
                                </c:forEach>
                                <c:if test="${empty violations}">
                                    <tr>
                                        <td colspan="8" class="px-5 py-8 text-center text-muted-foreground">
                                            No rule violations logged against you. Keep up the clean riding!
                                        </td>
                                    </tr>
                                </c:if>
                            </tbody>
                        </table>
                    </div>
                </div>
            </c:when>
        </c:choose>

        <!-- Competitors Modal -->
        <div id="competitorsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
            <div class="bg-[#151310] border border-border p-6 rounded-xl w-full max-w-lg" style="border-color: rgba(59,130,196,0.2)">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-[#f4f2ec] flex items-center gap-1.5">
                        <i data-lucide="users" class="w-5 h-5" style="color: #3b82c4"></i>
                        Race Competitors
                    </h3>
                    <button onclick="closeCompetitorsModal()" class="text-muted-foreground hover:text-foreground">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <p class="text-xs text-muted-foreground mb-3" id="competitorsRaceTitle">-</p>

                <div class="overflow-y-auto max-h-[300px] border border-white/5 rounded-lg">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-white/10 text-muted-foreground" style="background: rgba(255,255,255,0.02)">
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Gate</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Horse</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Jockey</th>
                            </tr>
                        </thead>
                        <tbody id="competitorsModalBody" class="divide-y divide-white/5 text-[#f4f2ec]">
                            <!-- Dynamic rows -->
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end pt-4">
                    <button onclick="closeCompetitorsModal()" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground text-sm font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <script>
            function initCompetitorsModal(btn) {
                const id = btn.getAttribute('data-id');
                const race = btn.getAttribute('data-race');
                
                document.getElementById('competitorsRaceTitle').innerText = race;
                const tbody = document.getElementById('competitorsModalBody');
                tbody.innerHTML = '';

                const container = document.getElementById('competitors-data-' + id);
                if (!container || container.children.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-6 text-center text-muted-foreground italic">No other registered competitors in this race yet.</td></tr>`;
                } else {
                    Array.from(container.children).forEach(item => {
                        const gate = item.querySelector('.gate').innerText;
                        const horse = item.querySelector('.horse').innerText;
                        const jockey = item.querySelector('.jockey').innerText;

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td class="px-4 py-2.5 font-mono font-bold text-[#f4f2ec]">\${gate}</td>
                            <td class="px-4 py-2.5 font-semibold text-foreground">\${horse}</td>
                            <td class="px-4 py-2.5 text-muted-foreground">\${jockey}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }

                document.getElementById('competitorsModal').classList.remove('hidden');
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            function closeCompetitorsModal() {
                document.getElementById('competitorsModal').classList.add('hidden');
            }
        </script>
    </jsp:body>
</t:dashboardLayout>

<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="rounded-xl border border-border bg-card/30 overflow-hidden">
    <div class="p-6 border-b border-border bg-card/60">
        <h3 class="font-bold text-lg text-foreground">Referee Schedule</h3>
        <p class="text-xs text-muted-foreground">List of upcoming and past races where you are assigned as a steward.</p>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                    <th class="p-4 pl-6">Schedule</th>
                    <th class="p-4">Meeting & Venue</th>
                    <th class="p-4">Race ID & Details</th>
                    <th class="p-4 pr-6">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
                <c:choose>
                    <c:when test="${empty schedule}">
                        <tr>
                            <td colspan="4" class="p-8 text-center text-muted-foreground text-sm">
                                No duties assigned to your schedule.
                            </td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="item" items="${schedule}">
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 pl-6 font-mono text-sm text-foreground">
                                    <fmt:formatDate value="${item.race.startTime}" pattern="dd/MM/yyyy HH:mm"/>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">${item.meeting.name}</div>
                                    <div class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                                        <span>${item.meeting.venue}</span>
                                    </div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">Race #${item.race.id}</div>
                                    <div class="text-xs text-muted-foreground font-mono mt-0.5">${item.race.classLevel} · ${item.race.distanceMeters}m · ${item.race.trackType}</div>
                                </td>
                                <td class="p-4 pr-6">
                                    <c:choose>
                                        <c:when test="${item.race.status eq 'SCHEDULED' or item.race.status eq 'DECLARATION_OPEN' or item.race.status eq 'DECLARATION_CLOSED'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                Scheduled
                                            </span>
                                        </c:when>
                                        <c:when test="${item.race.status eq 'RUNNING'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                Running
                                            </span>
                                        </c:when>
                                        <c:when test="${item.race.status eq 'OFFICIAL'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Official
                                            </span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                                                ${item.race.status}
                                            </span>
                                        </c:otherwise>
                                    </c:choose>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>

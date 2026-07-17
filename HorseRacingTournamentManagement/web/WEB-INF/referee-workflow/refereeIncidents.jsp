<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="rounded-xl border border-border bg-card/30 overflow-hidden">
    <div class="p-6 border-b border-border bg-card/60">
        <h3 class="font-bold text-lg text-foreground">Steward Incident Log</h3>
        <p class="text-xs text-muted-foreground">Historical list of rule violations and penalties issued by you.</p>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                    <th class="p-4 pl-6">ID</th>
                    <th class="p-4">Race & Meeting</th>
                    <th class="p-4">Horse</th>
                    <th class="p-4">Jockey</th>
                    <th class="p-4">Violation Details</th>
                    <th class="p-4 pr-6">Assessed Penalty</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
                <c:choose>
                    <c:when test="${empty incidents}">
                        <tr>
                            <td colspan="6" class="p-8 text-center text-muted-foreground text-sm">
                                <div class="flex flex-col items-center gap-2">
                                    <i data-lucide="shield-check" class="w-8 h-8 text-emerald-500/80"></i>
                                    <span>No violations logged by you yet.</span>
                                </div>
                            </td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="item" items="${incidents}">
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 pl-6 font-mono text-sm text-foreground">#${item.violation.id}</td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">${item.meetingName}</div>
                                    <div class="text-xs text-muted-foreground font-mono mt-0.5">Race #${item.raceId} · ${item.classLevel}</div>
                                </td>
                                <td class="p-4 font-medium text-foreground">${item.horseName}</td>
                                <td class="p-4 text-sm text-muted-foreground">${item.jockeyName}</td>
                                <td class="p-4 text-sm text-foreground font-sans max-w-xs truncate" title="${item.violation.description}">
                                    ${item.violation.description}
                                </td>
                                <td class="p-4 pr-6 text-sm font-bold text-red-400 font-mono">${item.violation.penalty}</td>
                            </tr>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>

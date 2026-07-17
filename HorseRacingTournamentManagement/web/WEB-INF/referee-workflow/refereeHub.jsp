<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<!-- Stats Section -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="rounded-xl border border-border p-6 bg-card/50 flex items-center justify-between hover-card">
        <div>
            <p class="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Total Assignments</p>
            <h3 class="text-3xl font-bold text-foreground font-mono">${completedCount + pendingCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center text-[#8b5cf6]">
            <i data-lucide="clipboard-list" style="width: 24px; height: 24px;"></i>
        </div>
    </div>
    <div class="rounded-xl border border-border p-6 bg-card/50 flex items-center justify-between hover-card">
        <div>
            <p class="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Pending Check/Supervision</p>
            <h3 class="text-3xl font-bold text-amber-500 font-mono">${pendingCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <i data-lucide="clock" style="width: 24px; height: 24px;"></i>
        </div>
    </div>
    <div class="rounded-xl border border-border p-6 bg-card/50 flex items-center justify-between hover-card">
        <div>
            <p class="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Completed Races</p>
            <h3 class="text-3xl font-bold text-emerald-500 font-mono">${completedCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <i data-lucide="check-circle" style="width: 24px; height: 24px;"></i>
        </div>
    </div>
</div>

<!-- Assigned Duties List -->
<div class="rounded-xl border border-border bg-card/30 overflow-hidden">
    <div class="p-6 border-b border-border flex justify-between items-center bg-card/60">
        <div>
            <h3 class="font-bold text-lg text-foreground">Assigned Races & Duties</h3>
            <p class="text-xs text-muted-foreground">Inspect, monitor, and finalize results for races assigned to you.</p>
        </div>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                    <th class="p-4 pl-6">Race ID</th>
                    <th class="p-4">Race Meeting & Venue</th>
                    <th class="p-4">Start Time</th>
                    <th class="p-4">Details</th>
                    <th class="p-4">Status</th>
                    <th class="p-4 pr-6 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
                <c:choose>
                    <c:when test="${empty assignedRaces}">
                        <tr>
                            <td colspan="6" class="p-8 text-center text-muted-foreground text-sm">
                                <div class="flex flex-col items-center gap-2">
                                    <i data-lucide="inbox" class="w-8 h-8 text-muted-foreground/55"></i>
                                    <span>No races assigned to you at the moment.</span>
                                </div>
                            </td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="race" items="${assignedRaces}">
                            <tr class="hover:bg-white/5 transition-colors group">
                                <td class="p-4 pl-6 font-mono text-sm text-foreground">#${race.id}</td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">${race.meetingName}</div>
                                    <div class="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                                        <span>${race.venue}</span>
                                    </div>
                                </td>
                                <td class="p-4 text-sm text-muted-foreground font-mono">
                                    <fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm"/>
                                </td>
                                <td class="p-4">
                                    <div class="text-sm text-foreground">${race.classLevel}</div>
                                    <div class="text-xs text-muted-foreground font-mono mt-0.5">${race.distanceMeters}m · ${race.trackType}</div>
                                </td>
                                <td class="p-4">
                                    <c:choose>
                                        <c:when test="${race.status eq 'SCHEDULED' or race.status eq 'DECLARATION_OPEN' or race.status eq 'DECLARATION_CLOSED'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>Scheduled
                                            </span>
                                        </c:when>
                                        <c:when test="${race.status eq 'RUNNING'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>Running
                                            </span>
                                        </c:when>
                                        <c:when test="${race.status eq 'OFFICIAL'}">
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Official
                                            </span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                                                ${race.status}
                                            </span>
                                        </c:otherwise>
                                    </c:choose>
                                </td>
                                <td class="p-4 pr-6 text-right">
                                    <c:choose>
                                         <c:when test="${race.status eq 'SCHEDULED' or race.status eq 'DECLARATION_OPEN' or race.status eq 'DECLARATION_CLOSED'}">
                                             <c:choose>
                                                 <c:when test="${race.gatesFullySet}">
                                                     <a href="${pageContext.request.contextPath}/RefereeController?view=check&raceId=${race.id}" 
                                                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] text-xs font-medium rounded-lg transition-colors hover-lift hover-sweep">
                                                         <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
                                                         Start Pre-Race Check
                                                     </a>
                                                 </c:when>
                                                 <c:otherwise>
                                                     <div class="flex flex-col items-end gap-1">
                                                         <span class="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">Chưa thiết lập Cổng (Gate)</span>
                                                         <button disabled 
                                                                 title="Admin must assign gate numbers before starting"
                                                                 class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-500 text-xs font-medium rounded-lg cursor-not-allowed opacity-50">
                                                             <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
                                                             Start Pre-Race Check
                                                         </button>
                                                     </div>
                                                 </c:otherwise>
                                             </c:choose>
                                         </c:when>
                                        <c:when test="${race.status eq 'RUNNING'}">
                                            <a href="${pageContext.request.contextPath}/RefereeController?view=supervision&raceId=${race.id}" 
                                               class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black hover:bg-amber-600 text-xs font-medium rounded-lg transition-colors hover-lift hover-sweep">
                                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                                Monitor & Record
                                            </a>
                                        </c:when>
                                        <c:when test="${race.status eq 'OFFICIAL'}">
                                            <button onclick="openStewardReportModal('${race.id}', `${race.stewardReport}`)"
                                               class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium rounded-lg transition-colors border border-zinc-700 hover-lift">
                                                <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
                                                Steward Report
                                            </button>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="text-xs text-muted-foreground">No action required</span>
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

<!-- Steward Report Modal -->
<div id="reportModal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div class="p-6 border-b border-border flex justify-between items-center">
            <h3 class="text-lg font-bold text-foreground flex items-center gap-2">
                <i data-lucide="file-text" class="text-[#8b5cf6]"></i>
                Steward's Official Report
            </h3>
            <button onclick="closeStewardReportModal()" class="text-muted-foreground hover:text-foreground">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
            <p class="text-xs font-mono text-muted-foreground uppercase mb-2">Race ID: <span id="modalRaceId"></span></p>
            <div id="modalReportContent" class="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-lg border border-border/80">
            </div>
        </div>
        <div class="p-4 border-t border-border bg-card/50 flex justify-end">
            <button onclick="closeStewardReportModal()" class="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
                Close
            </button>
        </div>
    </div>
</div>

<script>
    function openStewardReportModal(raceId, report) {
        document.getElementById('modalRaceId').innerText = '#' + raceId;
        const reportContent = report && report.trim() !== 'null' ? report : 'No report was compiled for this race.';
        document.getElementById('modalReportContent').innerText = reportContent;
        document.getElementById('reportModal').classList.remove('hidden');
    }

    function closeStewardReportModal() {
        document.getElementById('reportModal').classList.add('hidden');
    }
</script>

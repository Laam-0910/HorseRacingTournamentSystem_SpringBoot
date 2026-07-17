<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="mb-6">
    <a href="${pageContext.request.contextPath}/RefereeController?view=hub" 
       class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
        <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
        Back to Referee Hub
    </a>
</div>

<!-- Race Info Header Card -->
<div class="rounded-xl border border-border bg-card/40 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
        <span class="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1">Live supervision for</span>
        <h2 class="text-2xl font-bold text-foreground font-['Roboto_Slab']">${meeting.name} - Race #${race.id}</h2>
        <p class="text-sm text-muted-foreground mt-1 flex items-center gap-4">
            <span><i data-lucide="map-pin" class="inline w-4 h-4 mr-1 text-[#8b5cf6]"></i>${meeting.venue}</span>
            <span><i data-lucide="activity" class="inline w-4 h-4 mr-1 text-amber-500 animate-pulse"></i>Race in Progress</span>
        </p>
    </div>
    <div>
        <button onclick="openViolationModal()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-red-900/20">
            <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
            Record Rules Violation
        </button>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
    <!-- Active Competitors List -->
    <div class="lg:col-span-2 rounded-xl border border-border bg-card/30 overflow-hidden">
        <div class="p-6 border-b border-border bg-card/60">
            <h3 class="font-bold text-lg text-foreground">Active Runners</h3>
            <p class="text-xs text-muted-foreground">Competitors currently running on the track.</p>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                        <th class="p-4 pl-6">Gate</th>
                        <th class="p-4">Horse</th>
                        <th class="p-4">Jockey</th>
                        <th class="p-4">Carried Weight</th>
                        <th class="p-4 pr-6 text-right font-normal text-muted-foreground/60">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                    <c:forEach var="item" items="${entries}">
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="p-4 pl-6 font-mono font-bold text-foreground">
                                <span class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                    ${item.entry.gateNumber > 0 ? item.entry.gateNumber : '-'}
                                </span>
                            </td>
                            <td class="p-4 font-medium text-foreground">${item.horse.name}</td>
                            <td class="p-4 text-sm text-muted-foreground">${item.jockey.username}</td>
                            <td class="p-4 text-sm text-foreground font-mono">${item.entry.carriedWeight} kg</td>
                            <td class="p-4 pr-6 text-right">
                                <button onclick="openViolationModal('${item.horse.id}', '${item.horse.name}', '${item.jockey.id}', '${item.jockey.username}')" 
                                        class="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium">
                                    Report
                                </button>
                            </td>
                        </tr>
                    </c:forEach>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Registered Violations in this Race -->
    <div class="rounded-xl border border-border bg-card/30 flex flex-col h-full overflow-hidden">
        <div class="p-6 border-b border-border bg-card/60">
            <h3 class="font-bold text-lg text-foreground">Incidents Recorded</h3>
            <p class="text-xs text-muted-foreground">Violations logged by stewards for this race.</p>
        </div>
        <div class="p-6 flex-1 overflow-y-auto max-h-[350px]">
            <c:choose>
                <c:when test="${empty violations}">
                    <div class="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <i data-lucide="thumbs-up" class="w-8 h-8 text-emerald-500/80"></i>
                        <span>No incidents recorded. Clean race so far.</span>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="space-y-4">
                        <c:forEach var="v" items="${violations}">
                            <div class="p-4 rounded-lg bg-red-950/20 border border-red-800/40">
                                <div class="flex items-start justify-between mb-1.5">
                                    <h4 class="text-sm font-bold text-red-400">${v.horseName}</h4>
                                    <span class="text-[10px] font-mono uppercase bg-red-900/30 px-1.5 py-0.5 rounded text-red-300 border border-red-800/50">Violated</span>
                                </div>
                                <p class="text-xs text-muted-foreground mb-2">Jockey: <span class="text-foreground">${v.jockeyName}</span></p>
                                <p class="text-xs text-foreground bg-black/30 p-2 rounded mb-2 font-mono">${v.violation.description}</p>
                                <div class="text-xs font-bold text-amber-400 flex items-center gap-1">
                                    <i data-lucide="gavel" style="width: 12px; height: 12px;"></i>
                                    <span>Penalty: ${v.violation.penalty}</span>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                </c:otherwise>
            </c:choose>
        </div>
    </div>
</div>

<!-- Race Finalization Box -->
<div class="flex justify-between items-center bg-card/40 border border-border p-6 rounded-xl">
    <div>
        <h4 class="font-bold text-foreground">Race Completed?</h4>
        <p class="text-xs text-muted-foreground">Transition to the final results sheet to enter positions, race times, and submit your official report.</p>
    </div>
    <div class="flex gap-4">
        <a href="${pageContext.request.contextPath}/RefereeController?view=confirm&raceId=${race.id}" 
           class="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-600 font-bold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/10">
            <i data-lucide="check-square" style="width: 16px; height: 16px;"></i>
            Finish Race & Enter Results
        </a>
    </div>
</div>

<!-- Violation Modal -->
<div id="violationModal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div class="p-6 border-b border-border flex justify-between items-center">
            <h3 class="text-lg font-bold text-foreground flex items-center gap-2">
                <i data-lucide="alert-circle" class="text-red-500"></i>
                Log Rules Violation
            </h3>
            <button onclick="closeViolationModal()" class="text-muted-foreground hover:text-foreground">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <form action="${pageContext.request.contextPath}/RefereeController" method="post" class="m-0">
            <input type="hidden" name="action" value="refereeAddViolation" />
            <input type="hidden" name="raceId" value="${race.id}" />

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Runner (Horse / Jockey)</label>
                    <select name="runnerCombo" id="runnerSelect" onchange="updateRunnerFields()" class="w-full bg-[#1c1a17] border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]">
                        <c:forEach var="item" items="${entries}">
                            <option value="${item.horse.id}-${item.jockey.id}">
                                ${item.horse.name} (${item.jockey.username})
                            </option>
                        </c:forEach>
                    </select>
                    <input type="hidden" name="horseId" id="hiddenHorseId" value="" />
                    <input type="hidden" name="jockeyId" id="hiddenJockeyId" value="" />
                </div>
                <div>
                    <label class="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Violation Description</label>
                    <textarea name="description" required placeholder="Describe what happened (e.g. Jockey cut off lane at turn 3, careless riding)..." class="w-full h-24 bg-[#1c1a17] border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]"></textarea>
                </div>
                <div>
                    <label class="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Assessed Penalty</label>
                    <input type="text" name="penalty" required placeholder="e.g. Fine $500, Suspended 3 Days..." class="w-full bg-[#1c1a17] border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]" />
                </div>
            </div>

            <div class="p-4 border-t border-border bg-card/50 flex justify-end gap-3">
                <button type="button" onclick="closeViolationModal()" class="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-medium rounded-lg text-sm transition-colors">
                    Save Violation
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function openViolationModal(horseId, horseName, jockeyId, jockeyUsername) {
        const modal = document.getElementById('violationModal');
        const select = document.getElementById('runnerSelect');
        
        if (horseId && jockeyId) {
            select.value = horseId + '-' + jockeyId;
        }
        updateRunnerFields();
        modal.classList.remove('hidden');
    }

    function closeViolationModal() {
        document.getElementById('violationModal').classList.add('hidden');
    }

    function updateRunnerFields() {
        const select = document.getElementById('runnerSelect');
        const val = select.value;
        if (val) {
            const parts = val.split('-');
            document.getElementById('hiddenHorseId').value = parts[0];
            document.getElementById('hiddenJockeyId').value = parts[1];
        }
    }
</script>

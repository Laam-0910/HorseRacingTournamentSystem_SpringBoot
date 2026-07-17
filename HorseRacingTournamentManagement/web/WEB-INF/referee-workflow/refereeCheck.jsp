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

<c:if test="${not empty gatesFullySet && not gatesFullySet}">
    <div class="mb-6 p-4 text-sm rounded-lg bg-rose-900/30 text-rose-400 border border-rose-800/50 flex items-center gap-2">
        <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-400"></i>
        <span><strong>Cảnh báo:</strong> Cổng xuất phát chưa được thiết lập đầy đủ cho tất cả nài/ngựa. Hãy yêu cầu Admin cấu hình cổng trước khi bắt đầu cuộc đua.</span>
    </div>
</c:if>

<!-- Race Information Header Card -->
<div class="rounded-xl border border-border bg-card/40 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
        <span class="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1">Pre-Race inspection for</span>
        <h2 class="text-2xl font-bold text-foreground font-['Roboto_Slab']">${meeting.name} - Race #${race.id}</h2>
        <p class="text-sm text-muted-foreground mt-1 flex items-center gap-4">
            <span><i data-lucide="map-pin" class="inline w-4 h-4 mr-1 text-[#8b5cf6]"></i>${meeting.venue}</span>
            <span><i data-lucide="calendar" class="inline w-4 h-4 mr-1 text-[#8b5cf6]"></i><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm"/></span>
        </p>
    </div>
    <div class="flex gap-4 font-mono text-xs">
        <div class="border border-border/80 px-4 py-2 rounded-lg bg-card/60">
            <span class="text-[10px] text-muted-foreground block uppercase">Class Level</span>
            <span class="text-foreground font-bold">${race.classLevel}</span>
        </div>
        <div class="border border-border/80 px-4 py-2 rounded-lg bg-card/60">
            <span class="text-[10px] text-muted-foreground block uppercase">Distance</span>
            <span class="text-foreground font-bold">${race.distanceMeters}m</span>
        </div>
        <div class="border border-border/80 px-4 py-2 rounded-lg bg-card/60">
            <span class="text-[10px] text-muted-foreground block uppercase">Track Type</span>
            <span class="text-foreground font-bold">${race.trackType}</span>
        </div>
    </div>
</div>

<!-- Pre-race Verification Table -->
<div class="rounded-xl border border-border bg-card/30 overflow-hidden mb-8">
    <div class="p-6 border-b border-border bg-card/60">
        <h3 class="font-bold text-lg text-foreground">Horse & Jockey Weight Check</h3>
        <p class="text-xs text-muted-foreground">Verify carried weights, horse breeding, and equipment checks before opening the gates.</p>
    </div>
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                    <th class="p-4 pl-6">Gate</th>
                    <th class="p-4">Horse Details</th>
                    <th class="p-4">Jockey Details</th>
                    <th class="p-4">Jockey Weight</th>
                    <th class="p-4">Required Carried Weight</th>
                    <th class="p-4">Vet & Safety Check</th>
                    <th class="p-4 pr-6">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
                <c:choose>
                    <c:when test="${empty entries}">
                        <tr>
                            <td colspan="7" class="p-8 text-center text-muted-foreground text-sm">
                                No entries registered for this race.
                            </td>
                        </tr>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="item" items="${entries}">
                            <tr class="hover:bg-white/5 transition-colors" id="row_${item.entry.id}">
                                <td class="p-4 pl-6 font-mono font-bold text-sm text-foreground">
                                    <span class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                        ${item.entry.gateNumber > 0 ? item.entry.gateNumber : '-'}
                                    </span>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">${item.horse.name}</div>
                                    <div class="text-xs text-muted-foreground mt-0.5">${item.horse.breed} · Rating: ${item.horse.currentRating}</div>
                                </td>
                                <td class="p-4">
                                    <div class="font-medium text-foreground">${item.jockey.username}</div>
                                    <div class="text-xs text-muted-foreground mt-0.5">Base weight: ${item.jockey.weight != null ? item.jockey.weight : '52.0'} kg</div>
                                </td>
                                <td class="p-4">
                                    <div class="flex items-center gap-2">
                                        <input type="number" step="0.1" name="weighedWeight_${item.entry.id}" id="weighed_${item.entry.id}" 
                                               value="${item.entry.carriedWeight != null ? item.entry.carriedWeight : (item.jockey.weight != null ? item.jockey.weight : '52.0')}"
                                               oninput="checkWeight('${item.entry.id}', ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'})"
                                               class="w-24 bg-[#1c1a17] border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]" />
                                        <span class="text-xs text-muted-foreground">kg</span>
                                    </div>
                                </td>
                                <td class="p-4 text-sm text-foreground font-mono">
                                    <span id="req_${item.entry.id}" class="font-bold text-purple-400">
                                        ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'}
                                    </span> kg
                                </td>
                                <td class="p-4">
                                    <select name="vet_${item.entry.id}" id="vet_${item.entry.id}" onchange="toggleVet('${item.entry.id}')"
                                            class="bg-[#1c1a17] border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]">
                                        <option value="CLEARED">Cleared (Passed)</option>
                                        <option value="SCRATCH">Scratch (Medical)</option>
                                    </select>
                                </td>
                                <td class="p-4 pr-6">
                                    <div id="badge_${item.entry.id}" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Verified
                                    </div>
                                </td>
                            </tr>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </tbody>
        </table>
    </div>
</div>

<script>
    function checkWeight(entryId, requiredWeight) {
        const weighedInput = document.getElementById('weighed_' + entryId);
        const badge = document.getElementById('badge_' + entryId);
        const weighed = parseFloat(weighedInput.value);

        if (isNaN(weighed)) {
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20";
            badge.innerHTML = "Invalid weight";
            return;
        }

        const diff = weighed - requiredWeight;

        if (diff > 1.0) {
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20";
            badge.innerHTML = "Critical Overweight: +" + diff.toFixed(1) + " kg (Max +1.0 kg allowed)";
        } else if (diff > 0) {
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20";
            badge.innerHTML = "Overweight: +" + diff.toFixed(1) + " kg (Stewards Approved)";
        } else if (diff < 0) {
            const lead = Math.abs(diff);
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20";
            badge.innerHTML = "Requires Lead Weight: +" + lead.toFixed(1) + " kg";
        } else {
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
            badge.innerHTML = "Perfect Weight";
        }
    }

    function toggleVet(entryId) {
        const vetSelect = document.getElementById('vet_' + entryId);
        const row = document.getElementById('row_' + entryId);
        const weighedInput = document.getElementById('weighed_' + entryId);
        const badge = document.getElementById('badge_' + entryId);

        if (vetSelect.value === 'SCRATCH') {
            row.classList.add('opacity-40');
            weighedInput.disabled = true;
            badge.className = "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20";
            badge.innerHTML = "SCRATCHED";
        } else {
            row.classList.remove('opacity-40');
            weighedInput.disabled = false;
            checkWeight(entryId, parseFloat(document.getElementById('req_' + entryId).innerText));
        }
    }

    // Run initial check for all entries
    document.addEventListener("DOMContentLoaded", function() {
        <c:forEach var="item" items="${entries}">
            checkWeight('${item.entry.id}', ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'});
        </c:forEach>
    });
</script>

<!-- Confirmation Actions -->
<div class="flex justify-between items-center bg-card/40 border border-border p-6 rounded-xl">
    <div>
        <h4 class="font-bold text-foreground">Safety Checklist Complete?</h4>
        <p class="text-xs text-muted-foreground">Ensure veterinarians have cleared all horses, jockeys are weighed out, and starting boxes are safe.</p>
    </div>
    <div class="flex gap-4">
        <a href="${pageContext.request.contextPath}/RefereeController?view=hub" 
           class="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm transition-colors border border-zinc-700">
            Cancel
        </a>
        <form action="${pageContext.request.contextPath}/RefereeController" method="post" class="m-0 p-0">
            <input type="hidden" name="action" value="refereePreRaceCheck" />
            <input type="hidden" name="raceId" value="${race.id}" />
            <c:choose>
                <c:when test="${gatesFullySet}">
                    <button type="submit" class="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-lg text-sm transition-colors shadow-lg shadow-emerald-900/20 cursor-pointer">
                        Confirm Pre-Race Check & Open Gates
                    </button>
                </c:when>
                <c:otherwise>
                    <button type="button" disabled title="Tất cả nài/ngựa phải có cổng xuất phát để bắt đầu"
                            class="px-5 py-2 bg-zinc-800 text-zinc-500 font-medium rounded-lg text-sm cursor-not-allowed opacity-50">
                        Confirm Pre-Race Check & Open Gates
                    </button>
                </c:otherwise>
            </c:choose>
        </form>
    </div>
</div>

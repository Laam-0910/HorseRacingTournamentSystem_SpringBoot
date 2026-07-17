<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="mb-6">
    <a href="${pageContext.request.contextPath}/RefereeController?view=supervision&raceId=${race.id}" 
       class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
        <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
        Back to Live Supervision
    </a>
</div>

<!-- Page Title Card -->
<div class="rounded-xl border border-border bg-card/40 p-6 mb-8">
    <span class="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1">Final Result entry for</span>
    <h2 class="text-2xl font-bold text-foreground font-['Roboto_Slab']">${meeting.name} - Race #${race.id}</h2>
    <p class="text-xs text-muted-foreground mt-1">Submit official positions, timings, disqualifications and compile the Steward's Report to distribute prizes and update ratings.</p>
</div>

<form action="${pageContext.request.contextPath}/RefereeController" method="post">
    <input type="hidden" name="action" value="refereeConfirmResults" />
    <input type="hidden" name="raceId" value="${race.id}" />

    <!-- Results Table -->
    <div class="rounded-xl border border-border bg-card/30 overflow-hidden mb-8">
        <div class="p-6 border-b border-border bg-card/60">
            <h3 class="font-bold text-lg text-foreground">Official Finishing Sheet</h3>
            <p class="text-xs text-muted-foreground">Verify each horse's position and timing. Check the DQ column to disqualify a runner.</p>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-border bg-card/10 text-muted-foreground text-xs uppercase font-mono">
                        <th class="p-4 pl-6 w-20">Gate</th>
                        <th class="p-4">Horse Details</th>
                        <th class="p-4">Jockey Details</th>
                        <th class="p-4 w-32">Final Position</th>
                        <th class="p-4 w-40">Weigh-In Weight</th>
                        <th class="p-4 w-48">Finish Time (e.g. 1:52.45)</th>
                        <th class="p-4 w-32 text-center">Disqualified (DQ)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border/60">
                    <c:forEach var="item" items="${entries}" varStatus="loop">
                        <tr class="hover:bg-white/5 transition-colors" id="row_${item.entry.id}">
                            <td class="p-4 pl-6 font-mono font-bold text-foreground">
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
                                <div class="text-xs text-muted-foreground mt-0.5">Weighed Out: ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'} kg</div>
                            </td>
                                <td class="p-4">
                                <input type="number" name="position_${item.entry.id}" id="pos_${item.entry.id}" 
                                       required min="1" max="${entries.size()}" value="${loop.index + 1}"
                                       data-original="${loop.index + 1}"
                                       class="w-20 bg-[#1c1a17] border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]" />
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-1.5">
                                    <input type="number" step="0.1" name="weighedIn_${item.entry.id}" id="weighedIn_${item.entry.id}" 
                                           value="${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'}"
                                           oninput="checkWeighIn('${item.entry.id}', ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'})"
                                           class="w-20 bg-[#1c1a17] border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]" />
                                    <span class="text-xs text-muted-foreground font-mono">kg</span>
                                </div>
                                <div id="wi_badge_${item.entry.id}" class="text-[10px] font-medium text-emerald-400 mt-1">Weigh-In Passed</div>
                            </td>
                            <td class="p-4">
                                <input type="text" name="time_${item.entry.id}" id="time_${item.entry.id}" 
                                       required placeholder="e.g. 1:48.35" value=""
                                       class="w-40 bg-[#1c1a17] border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6]" />
                            </td>
                            <td class="p-4 text-center">
                                <input type="checkbox" name="dq_${item.entry.id}" id="dq_${item.entry.id}" onchange="toggleDq('${item.entry.id}')"
                                       class="w-4 h-4 rounded bg-[#1c1a17] border border-border text-red-600 focus:ring-0 focus:ring-offset-0" />
                            </td>
                        </tr>
                    </c:forEach>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Steward Report Text Area -->
    <div class="rounded-xl border border-border bg-card/30 p-6 mb-8">
        <h3 class="font-bold text-lg text-foreground mb-1">Steward's Official Report</h3>
        <p class="text-xs text-muted-foreground mb-4">Provide a written summary of the race, detailing any incident inquiries, protests, warnings, or vet notes.</p>
        <textarea name="stewardReport" required rows="6" 
                  placeholder="Insert race description and official notes here...&#10;e.g. Clean jump. The race was run at a true pace. At the 200m mark, Horse A shifted out and interfered with Horse B. Inquiries were held and action taken..."
                  class="w-full bg-[#1c1a17] border border-border rounded-lg p-4 text-sm text-foreground focus:ring-1 focus:ring-[#8b5cf6] focus:border-[#8b5cf6] font-sans leading-relaxed"></textarea>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-4">
        <a href="${pageContext.request.contextPath}/RefereeController?view=supervision&raceId=${race.id}" 
           class="px-5 py-2.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm transition-colors border border-zinc-700 font-medium">
            Cancel
        </a>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg text-sm transition-colors shadow-lg shadow-emerald-950/20">
            Approve & Declare Official
        </button>
    </div>
</form>

<script>
    function toggleDq(entryId) {
        const isChecked = document.getElementById('dq_' + entryId).checked;
        const posInput = document.getElementById('pos_' + entryId);
        const timeInput = document.getElementById('time_' + entryId);
        const wiInput = document.getElementById('weighedIn_' + entryId);
        const row = document.getElementById('row_' + entryId);

        if (isChecked) {
            // Save original values before clearing
            posInput.dataset.original = posInput.value;
            timeInput.dataset.original = timeInput.value;

            // Grey out the row
            row.classList.add('opacity-50');

            // Disable position: set value to 0 (DQ) and send via hidden input
            posInput.value = '';
            posInput.required = false;
            posInput.classList.add('opacity-40', 'pointer-events-none');

            // Mark time as DQ
            timeInput.value = 'DQ';
            timeInput.readOnly = true;
            timeInput.required = false;
            timeInput.classList.add('text-red-400', 'opacity-60');

            // Disable weigh-in
            wiInput.readOnly = true;
            wiInput.classList.add('opacity-40', 'pointer-events-none');
        } else {
            // Restore original values
            posInput.value = posInput.dataset.original || '';
            posInput.required = true;
            posInput.classList.remove('opacity-40', 'pointer-events-none');

            timeInput.value = timeInput.dataset.original || '';
            timeInput.readOnly = false;
            timeInput.required = true;
            timeInput.classList.remove('text-red-400', 'opacity-60');

            wiInput.readOnly = false;
            wiInput.classList.remove('opacity-40', 'pointer-events-none');

            // Restore row opacity
            row.classList.remove('opacity-50');
        }
    }

    function checkWeighIn(entryId, weighedOut) {
        const weighedInInput = document.getElementById('weighedIn_' + entryId);
        const badge = document.getElementById('wi_badge_' + entryId);
        const dqCheckbox = document.getElementById('dq_' + entryId);
        const val = parseFloat(weighedInInput.value);

        if (isNaN(val)) {
            badge.className = "text-[10px] font-medium text-red-400 mt-1";
            badge.innerHTML = "Invalid weight";
            return;
        }

        const diff = val - weighedOut;

        if (diff < -0.5) {
            badge.className = "text-[10px] font-medium text-red-500 mt-1 font-bold animate-pulse";
            badge.innerHTML = "UNDERWEIGHT DISCREPANCY: " + diff.toFixed(1) + " kg (Fails weigh-in!)";
            
            // Auto-dq if discrepancy is larger than 0.5kg underweight
            if (!dqCheckbox.checked) {
                dqCheckbox.checked = true;
                toggleDq(entryId);
            }
        } else {
            badge.className = "text-[10px] font-medium text-emerald-400 mt-1";
            if (diff >= 0) {
                badge.innerHTML = "Weigh-In Passed (+" + diff.toFixed(1) + " kg)";
            } else {
                badge.innerHTML = "Weigh-In Passed (" + diff.toFixed(1) + " kg)";
            }
        }
    }

    document.addEventListener("DOMContentLoaded", function() {
        <c:forEach var="item" items="${entries}">
            checkWeighIn('${item.entry.id}', ${item.entry.carriedWeight != null ? item.entry.carriedWeight : '52.0'});
        </c:forEach>
    });
</script>

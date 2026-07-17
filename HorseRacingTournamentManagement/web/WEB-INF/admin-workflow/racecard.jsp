<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Racecard Management</h3>
            <p class="text-xs text-muted-foreground">Configure gate numbers and handicap weights for approved race entries.</p>
        </div>
    </div>

    <!-- Alert Messages -->
    <c:if test="${not empty sessionScope.message}">
        <div class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
            <span>${sessionScope.message}</span>
        </div>
        <c:remove var="message" scope="session"/>
    </c:if>
    <c:if test="${not empty sessionScope.error}">
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
            <span>${sessionScope.error}</span>
        </div>
        <c:remove var="error" scope="session"/>
    </c:if>

    <!-- Filters Section -->
    <div class="rounded-xl border p-5 bg-[#151310]/60 border-white/5 space-y-4">
        <form action="${pageContext.request.contextPath}/AdminUserController" method="GET" class="grid grid-cols-1 md:grid-cols-2 gap-4 m-0">
            <input type="hidden" name="view" value="racecard" />
            
            <div>
                <label class="block text-xs font-mono uppercase text-muted-foreground mb-2">Select Race Meeting</label>
                <select name="meetingId" onchange="this.form.submit()" class="w-full bg-[#1e1c18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f4f2ec] focus:outline-none focus:border-[#c9a227]">
                    <option value="">-- Choose Meeting --</option>
                    <c:forEach var="meeting" items="${raceMeetings}">
                        <option value="${meeting.id}" ${selectedMeetingId == meeting.id ? 'selected' : ''}>
                            ${meeting.name} (${meeting.venue})
                        </option>
                    </c:forEach>
                </select>
            </div>

            <div>
                <label class="block text-xs font-mono uppercase text-muted-foreground mb-2">Select Race</label>
                <select name="raceId" onchange="this.form.submit()" class="w-full bg-[#1e1c18] border border-white/10 rounded-lg px-3 py-2 text-sm text-[#f4f2ec] focus:outline-none focus:border-[#c9a227]" ${empty selectedMeetingId ? 'disabled' : ''}>
                    <option value="">-- Choose Race --</option>
                    <c:forEach var="race" items="${races}">
                        <option value="${race.id}" ${selectedRaceId == race.id ? 'selected' : ''}>
                            ${race.classLevel} (${race.distanceMeters}m - ${race.trackType}) - Status: ${race.status}
                        </option>
                    </c:forEach>
                </select>
            </div>
        </form>
    </div>

    <!-- Entries Table & Form -->
    <c:choose>
        <c:when test="${not empty selectedRaceId}">
            <div class="rounded-xl border border-white/5 overflow-hidden bg-[#151310]/60">
                <div class="px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.01]">
                    <h4 class="font-bold text-[#f4f2ec] text-base">Approved Entries</h4>
                    
                    <div class="flex flex-wrap gap-2">
                        <!-- Auto Assign Gates Button -->
                        <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="m-0">
                            <input type="hidden" name="action" value="autoAssignGates" />
                            <input type="hidden" name="meetingId" value="${selectedMeetingId}" />
                            <input type="hidden" name="raceId" value="${selectedRaceId}" />
                            <button type="submit" class="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-foreground border border-white/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                                <i data-lucide="shuffle" style="width: 14px; height: 14px;" class="text-[#c9a227]"></i>
                                Auto Assign Gates
                            </button>
                        </form>
                        
                        <!-- Auto Calculate Weights Button -->
                        <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="m-0">
                            <input type="hidden" name="action" value="autoCalculateWeights" />
                            <input type="hidden" name="meetingId" value="${selectedMeetingId}" />
                            <input type="hidden" name="raceId" value="${selectedRaceId}" />
                            <button type="submit" class="px-3.5 py-1.5 bg-[#c9a227]/10 hover:bg-[#c9a227]/25 text-xs font-bold text-[#c9a227] border border-[#c9a227]/25 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                                <i data-lucide="calculator" style="width: 14px; height: 14px;"></i>
                                Auto Calculate Weights
                            </button>
                        </form>
                    </div>
                </div>

                <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="m-0">
                    <input type="hidden" name="action" value="updateRacecard" />
                    <input type="hidden" name="meetingId" value="${selectedMeetingId}" />
                    <input type="hidden" name="raceId" value="${selectedRaceId}" />
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="border-b border-white/5 text-muted-foreground uppercase font-mono tracking-wider bg-white/[0.01]">
                                    <th class="px-5 py-3">Gate (1-12)</th>
                                    <th class="px-5 py-3">Horse</th>
                                    <th class="px-5 py-3">Jockey</th>
                                    <th class="px-5 py-3">Owner</th>
                                    <th class="px-5 py-3">Handicap Weight (kg)</th>
                                    <th class="px-5 py-3">Carried Weight (kg)</th>
                                    <th class="px-5 py-3 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5 text-[#f4f2ec]">
                                <c:forEach var="item" items="${enrichedEntries}">
                                    <tr>
                                        <!-- Gate input -->
                                        <td class="px-5 py-3.5">
                                            <input type="number" name="gate_${item.entry.id}" min="0" max="12" value="${item.entry.gateNumber}" class="w-20 bg-[#1e1c18] border border-white/10 rounded px-2.5 py-1 text-center text-sm font-mono text-[#f4f2ec] focus:outline-none focus:border-[#c9a227]" />
                                        </td>
                                        
                                        <!-- Horse -->
                                        <td class="px-5 py-3.5">
                                            <div class="font-bold text-sm text-foreground">${item.horse.name}</div>
                                            <div class="text-[10px] text-muted-foreground font-mono">Rating: ${item.horse.currentRating}</div>
                                        </td>
                                        
                                        <!-- Jockey -->
                                        <td class="px-5 py-3.5">
                                            <div class="font-semibold">${item.jockey.username}</div>
                                            <div class="text-[10px] text-muted-foreground font-mono">Weight: ${item.jockey.weight} kg</div>
                                        </td>
                                        
                                        <!-- Owner -->
                                        <td class="px-5 py-3.5 text-muted-foreground">${item.owner.username}</td>
                                        
                                        <!-- Handicap Weight -->
                                        <td class="px-5 py-3.5">
                                            <input type="number" step="0.1" name="handicap_${item.entry.id}" value="${item.entry.handicapWeight}" class="w-28 bg-[#1e1c18] border border-white/10 rounded px-2.5 py-1 text-center text-sm font-mono text-[#f4f2ec] focus:outline-none focus:border-[#c9a227]" />
                                        </td>
                                        
                                        <!-- Carried Weight -->
                                        <td class="px-5 py-3.5">
                                            <input type="number" step="0.1" name="carried_${item.entry.id}" value="${item.entry.carriedWeight}" class="w-28 bg-[#1e1c18] border border-white/10 rounded px-2.5 py-1 text-center text-sm font-mono text-[#f4f2ec] focus:outline-none focus:border-[#c9a227]" />
                                        </td>
                                        
                                        <!-- Status -->
                                        <td class="px-5 py-3.5 text-right">
                                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                ${item.entry.status}
                                            </span>
                                        </td>
                                    </tr>
                                </c:forEach>
                                <c:if test="${empty enrichedEntries}">
                                    <tr>
                                        <td colspan="7" class="px-5 py-8 text-center text-muted-foreground italic">
                                            No approved entries found for this race.
                                        </td>
                                    </tr>
                                </c:if>
                            </tbody>
                        </table>
                    </div>
                    
                    <c:if test="${not empty enrichedEntries}">
                        <div class="px-5 py-4 border-t border-white/5 bg-white/[0.01] flex justify-end">
                            <button type="submit" class="px-5 py-2 bg-[#c9a227] hover:bg-[#b08c1e] text-[#0e0c09] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                                <i data-lucide="save" style="width: 14.5px; height: 14.5px;"></i>
                                Save Racecard Changes
                            </button>
                        </div>
                    </c:if>
                </form>
            </div>
        </c:when>
        <c:otherwise>
            <div class="rounded-xl border p-8 text-center text-muted-foreground border-white/5 bg-white/[0.01]">
                <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Please select a Meeting and a Race to configure the racecard.</p>
            </div>
        </c:otherwise>
    </c:choose>
</div>

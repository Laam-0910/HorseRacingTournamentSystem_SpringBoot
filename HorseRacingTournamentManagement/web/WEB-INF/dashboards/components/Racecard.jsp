<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<c:set var="actionPath" value="${param.action eq 'dashboard' ? 'MainController?action=dashboard&view=races' : 'MainController?action=racecard'}" />

<div class="space-y-8 p-6 bg-[#0b0a08] text-[#f4f2ec] rounded-xl border border-white/5 selection:bg-[#c9a227]/30 min-h-screen">
    
    <!-- Header -->
    <div class="border-b pb-6" style="border-color: rgba(201,162,39,0.1)">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Hong Kong Jockey Club Style</span>
        <h1 class="font-['Roboto_Slab'] font-bold text-3xl text-[#f4f2ec] mt-1">Official Racecard</h1>
        <p class="text-xs font-mono mt-1 text-white/40">Browse scheduled race meetings, declared races, and official entries.</p>
    </div>
 
    <!-- 1. Meeting Selector -->
    <div class="space-y-3">
        <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Select Race Meeting</span>
        <c:choose>
            <c:when test="${empty meetings}">
                <div class="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <p class="text-sm font-mono text-white/40">No race meetings available in the system.</p>
                </div>
            </c:when>
            <c:otherwise>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <c:forEach var="meeting" items="${meetings}">
                        <a href="${pageContext.request.contextPath}/${actionPath}&meetingId=${meeting.id}" 
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
        
        <!-- 2. Race Selector (Tabs) -->
        <div class="space-y-3 pt-4">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Races inside "${selectedMeeting.name}"</span>
            <c:choose>
                <c:when test="${empty races}">
                    <div class="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                        <p class="text-sm font-mono text-white/40">No races declared for this meeting yet.</p>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="flex flex-wrap gap-2.5">
                        <c:forEach var="race" items="${races}" varStatus="loop">
                            <a href="${pageContext.request.contextPath}/${actionPath}&meetingId=${selectedMeeting.id}&raceId=${race.id}" 
                               class="px-4 py-3 border rounded-xl font-mono text-xs transition-all duration-300 ease-out flex items-center gap-3 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${race.id == selectedRace.id ? 'bg-[#c9a227] text-[#0e0c09] border-[#c9a227] font-bold shadow-lg shadow-[#c9a227]/20 scale-[1.02] -translate-y-0.5' : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5 hover:text-primary'}">
                                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${race.id == selectedRace.id ? 'bg-[#0e0c09] text-[#c9a227]' : 'bg-white/5 text-white/75'}">
                                    ${loop.index + 1}
                                </span>
                                <div class="text-left leading-tight">
                                    <p class="font-bold">Race ${loop.index + 1}</p>
                                    <p class="text-[9px] opacity-60 mt-0.5"><fmt:formatDate value="${race.startTime}" pattern="HH:mm"/> OFF</p>
                                </div>
                            </a>
                        </c:forEach>
                    </div>
                </c:otherwise>
            </c:choose>
        </div>

        <!-- 3. Selected Race Detail & Entries -->
        <c:if test="${not empty selectedRace}">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
                
                <!-- Race Overview Card -->
                <div class="lg:col-span-12 bg-white/[0.02] border border-white/5 rounded-xl p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c9a227]/10 text-[#c9a227] text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-[#c9a227] <c:if test="${selectedRace.status eq 'RUNNING'}">animate-pulse</c:if>"></span>
                                <c:choose>
                                    <c:when test="${selectedRace.status eq 'SCHEDULED' or selectedRace.status eq 'DECLARATION_OPEN' or selectedRace.status eq 'DECLARATION_CLOSED'}">
                                        Scheduled
                                    </c:when>
                                    <c:otherwise>
                                        ${selectedRace.status}
                                    </c:otherwise>
                                </c:choose>
                            </span>
                            <h3 class="text-xl font-serif font-bold text-[#f4f2ec]">Class ${selectedRace.classLevel} Stakes</h3>
                            <p class="text-xs font-mono text-white/40 mt-1 flex items-center gap-2">
                                <span>Distance: <b>${selectedRace.distanceMeters}m</b></span>
                                <span>•</span>
                                <span>Track Type: <b>${selectedRace.trackType}</b></span>
                            </p>
                        </div>
                        <div class="flex items-center gap-6">
                            <div class="text-left md:text-right border-l md:border-l-0 md:border-r border-white/5 pl-4 md:pl-0 md:pr-6">
                                <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Total Purse</span>
                                <span class="text-xl font-mono font-bold text-[#c9a227]">
                                    $<fmt:formatNumber value="${selectedRace.purse}" pattern="#,##0"/>
                                </span>
                            </div>
                            <div class="text-left md:text-right">
                                <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Scheduled Time</span>
                                <span class="text-sm font-mono font-bold text-white/80">
                                    <fmt:formatDate value="${selectedRace.startTime}" pattern="dd/MM/yyyy HH:mm"/>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Constraints -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-mono">
                        <div>
                            <span class="text-white/30 block mb-0.5">Rating Requirement</span>
                            <span class="text-white/80">
                                <c:choose>
                                    <c:when test="${not empty selectedRace.minRating && not empty selectedRace.maxRating}">
                                        ${selectedRace.minRating} - ${selectedRace.maxRating}
                                    </c:when>
                                    <c:when test="${not empty selectedRace.minRating}">
                                        &ge; ${selectedRace.minRating}
                                    </c:when>
                                    <c:otherwise>Open</c:otherwise>
                                </c:choose>
                            </span>
                        </div>
                        <div>
                            <span class="text-white/30 block mb-0.5">Max Runners</span>
                            <span class="text-white/80">${selectedRace.maxEntries} Horses</span>
                        </div>
                        <div>
                            <span class="text-white/30 block mb-0.5">Start Gate Window</span>
                            <span class="text-white/80">1 - ${selectedRace.maxEntries}</span>
                        </div>
                        <div>
                             <span class="text-white/30 block mb-0.5">Registration Limit</span>
                             <span class="text-[#c0392b] font-bold">
                                 <fmt:formatDate value="${selectedRace.registrationEndTime}" pattern="dd/MM/yyyy HH:mm"/>
                             </span>
                        </div>
                    </div>
                </div>

                <!-- 4. Entries Table -->
                <div class="lg:col-span-12 bg-white/[0.01] border border-white/5 rounded-xl p-6">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-4">Declared Runners &amp; Riders</span>
                    <c:choose>
                        <c:when test="${empty enrichedEntries}">
                            <div class="p-8 text-center bg-black/25 border border-white/5 rounded-lg">
                                <i data-lucide="info" class="w-8 h-8 text-[#c9a227]/60 mx-auto mb-2"></i>
                                <p class="text-sm font-mono text-white/40">No entries declared or approved for this race yet.</p>
                            </div>
                        </c:when>
                        <c:otherwise>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                                            <th class="py-3 px-2 w-16 text-center">Draw</th>
                                            <th class="py-3 px-4">Horse Details</th>
                                            <th class="py-3 px-4">Jockey Details</th>
                                            <th class="py-3 px-4">Horse Owner</th>
                                            <th class="py-3 px-3 text-center">Horse Rating</th>
                                            <th class="py-3 px-3 text-center">Carried Wt</th>
                                            <th class="py-3 px-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/[0.03]">
                                        <c:forEach var="item" items="${enrichedEntries}">
                                            <tr class="hover:bg-white/[0.01] transition-colors group">
                                                
                                                <!-- Gate Number -->
                                                <td class="py-4 px-2 text-center">
                                                    <c:choose>
                                                        <c:when test="${item.entry.gateNumber == 1}"><c:set var="gateColor" value="bg-yellow-500 text-black"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 2}"><c:set var="gateColor" value="bg-green-600 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 3}"><c:set var="gateColor" value="bg-blue-600 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 4}"><c:set var="gateColor" value="bg-red-600 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 5}"><c:set var="gateColor" value="bg-purple-600 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 6}"><c:set var="gateColor" value="bg-amber-800 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 7}"><c:set var="gateColor" value="bg-pink-500 text-white"/></c:when>
                                                        <c:when test="${item.entry.gateNumber == 8}"><c:set var="gateColor" value="bg-cyan-500 text-black"/></c:when>
                                                        <c:otherwise><c:set var="gateColor" value="bg-gray-700 text-white"/></c:otherwise>
                                                    </c:choose>
                                                    <span class="inline-flex w-7 h-7 rounded-lg font-mono text-xs font-bold items-center justify-center shadow ${gateColor}">
                                                        ${item.entry.gateNumber}
                                                    </span>
                                                </td>

                                                <!-- Horse -->
                                                <td class="py-4 px-4">
                                                    <div class="text-sm font-serif font-bold text-[#f4f2ec] group-hover:text-[#c9a227] transition-colors">
                                                        <c:out value="${item.horse.name}"/>
                                                    </div>
                                                    <div class="text-[10px] font-mono text-white/40 mt-0.5">
                                                        Breed: <span class="text-white/60"><c:out value="${item.horse.breed}"/></span>
                                                    </div>
                                                </td>

                                                <!-- Jockey -->
                                                <td class="py-4 px-4 text-xs font-mono">
                                                    <div class="text-white/80 font-bold"><c:out value="${item.jockey.username}"/></div>
                                                    <div class="text-[10px] text-white/30 mt-0.5">
                                                        Weight: <span class="text-white/50">${item.jockey.weight} kg</span>
                                                    </div>
                                                </td>

                                                <!-- Owner -->
                                                <td class="py-4 px-4 text-xs font-mono text-white/70">
                                                    <c:out value="${item.owner.username}"/>
                                                </td>

                                                <!-- Horse Rating -->
                                                <td class="py-4 px-3 text-center text-xs font-mono text-[#c9a227] font-semibold">
                                                    <c:out value="${item.horse.currentRating}"/>
                                                </td>

                                                <!-- Carried Weight -->
                                                <td class="py-4 px-3 text-center text-xs font-mono text-white/85 font-medium">
                                                    ${item.entry.carriedWeight} kg
                                                </td>

                                                <!-- Status -->
                                                <td class="py-4 px-4 text-right">
                                                    <c:choose>
                                                        <c:when test="${item.entry.status == 'APPROVED'}">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Approved</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.status == 'FINISHED'}">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/60 font-bold border border-white/10">Finished</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.status == 'RUNNING'}">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">Running</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.status == 'PENDING_ADMIN'}">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#c9a227]/10 text-[#c9a227] font-bold border border-[#c9a227]/20">Pending</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.status == 'REJECTED'}">
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#c0392b]/10 text-[#c0392b] font-bold border border-[#c0392b]/20">Rejected</span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/50 border border-white/5">${item.entry.status}</span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </td>
                                            </tr>
                                        </c:forEach>
                                    </tbody>
                                </table>
                            </div>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </c:if>
    </c:if>
</div>
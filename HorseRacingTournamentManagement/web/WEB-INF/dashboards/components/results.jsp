<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<c:set var="resActionPath" value="${param.action eq 'dashboard' ? 'MainController?action=dashboard&view=results' : 'MainController?action=results'}" />

<div class="space-y-8 p-6 bg-[#0b0a08] text-[#f4f2ec] rounded-xl border border-white/5 selection:bg-[#c9a227]/30 min-h-screen">
    
    <!-- Header -->
    <div class="border-b pb-6" style="border-color: rgba(201,162,39,0.1)">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Official Race Results</span>
        <h1 class="font-['Roboto_Slab'] font-bold text-3xl text-[#f4f2ec] mt-1">Race Results</h1>
        <p class="text-xs font-mono mt-1 text-white/40">View completed race outcomes, finishing positions, times, and prize money.</p>
    </div>

    <!-- 1. Meeting Selector -->
    <div class="space-y-3">
        <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Select Race Meeting</span>
        <c:choose>
            <c:when test="${empty resultMeetings}">
                <div class="p-6 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                    <p class="text-sm font-mono text-white/40">No race meetings available.</p>
                </div>
            </c:when>
            <c:otherwise>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <c:forEach var="meeting" items="${resultMeetings}">
                        <a href="${pageContext.request.contextPath}/${resActionPath}&meetingId=${meeting.id}" 
                           class="group relative p-5 border rounded-xl transition-all duration-300 ease-out block hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_4px_15px_rgba(201,162,39,0.08)] active:scale-95 ${meeting.id == resSelectedMeeting.id ? 'bg-[#c9a227]/10 border-[#c9a227] shadow-[0_0_15px_rgba(201,162,39,0.15)] font-semibold' : 'bg-white/[0.02] border-white/5 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5'}">
                            <div class="absolute top-4 right-4 text-xs font-mono text-[#c9a227]">
                                <c:choose>
                                    <c:when test="${meeting.id == resSelectedMeeting.id}">
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
    <c:if test="${not empty resSelectedMeeting}">
        
        <!-- 2. Finished Race Tabs -->
        <div class="space-y-3 pt-4">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Completed Races in "${resSelectedMeeting.name}"</span>
            <c:choose>
                <c:when test="${empty finishedRaces}">
                    <div class="p-8 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                        <i data-lucide="clock" class="w-10 h-10 text-white/10 mx-auto mb-3"></i>
                        <p class="text-sm font-mono text-white/40">No finished races for this meeting yet.</p>
                        <p class="text-xs font-mono text-white/20 mt-1">Results will appear here once races are completed.</p>
                    </div>
                </c:when>
                <c:otherwise>
                    <div class="flex flex-wrap gap-2.5">
                        <c:forEach var="race" items="${finishedRaces}" varStatus="loop">
                            <a href="${pageContext.request.contextPath}/${resActionPath}&meetingId=${resSelectedMeeting.id}&raceId=${race.id}" 
                               class="px-4 py-3 border rounded-xl font-mono text-xs transition-all duration-300 ease-out flex items-center gap-3 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${race.id == resSelectedRace.id ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-lg shadow-emerald-600/20 scale-[1.02] -translate-y-0.5' : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-emerald-600/30 hover:bg-emerald-600/5 hover:text-emerald-400'}">
                                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${race.id == resSelectedRace.id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/75'}">
                                    ${loop.index + 1}
                                </span>
                                <div class="text-left leading-tight">
                                    <p class="font-bold">Race ${loop.index + 1}</p>
                                    <p class="text-[9px] opacity-60 mt-0.5">
                                        <i data-lucide="flag" style="width:9px;height:9px;display:inline-block;margin-right:2px;"></i> FINISHED
                                    </p>
                                </div>
                            </a>
                        </c:forEach>
                    </div>
                </c:otherwise>
            </c:choose>
        </div>

        <!-- 3. Selected Race Results -->
        <c:if test="${not empty resSelectedRace}">
            <div class="space-y-6 pt-4">
                
                <!-- Race Overview -->
                <div class="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                                <i data-lucide="check-circle" style="width:12px;height:12px;"></i>
                                ${resSelectedRace.status}
                            </span>
                            <h3 class="text-xl font-serif font-bold text-[#f4f2ec]">Class ${resSelectedRace.classLevel} Stakes</h3>
                            <p class="text-xs font-mono text-white/40 mt-1 flex items-center gap-2">
                                <span>Distance: <b>${resSelectedRace.distanceMeters}m</b></span>
                                <span>•</span>
                                <span>Track: <b>${resSelectedRace.trackType}</b></span>
                            </p>
                        </div>
                        <div class="flex items-center gap-6">
                            <div class="text-left md:text-right border-l md:border-l-0 md:border-r border-white/5 pl-4 md:pl-0 md:pr-6">
                                <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Total Purse</span>
                                <span class="text-xl font-mono font-bold text-[#c9a227]">
                                    $<fmt:formatNumber value="${resSelectedRace.purse}" pattern="#,##0"/>
                                </span>
                            </div>
                            <div class="text-left md:text-right">
                                <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Race Time</span>
                                <span class="text-sm font-mono font-bold text-white/80">
                                    <fmt:formatDate value="${resSelectedRace.startTime}" pattern="dd/MM/yyyy HH:mm"/>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Race Stats Grid -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs font-mono">
                        <div>
                            <span class="text-white/30 block mb-0.5">Rating Band</span>
                            <span class="text-white/80">
                                <c:choose>
                                    <c:when test="${not empty resSelectedRace.minRating && not empty resSelectedRace.maxRating}">
                                        ${resSelectedRace.minRating} - ${resSelectedRace.maxRating}
                                    </c:when>
                                    <c:when test="${not empty resSelectedRace.minRating}">
                                        &ge; ${resSelectedRace.minRating}
                                    </c:when>
                                    <c:otherwise>Open</c:otherwise>
                                </c:choose>
                            </span>
                        </div>
                        <div>
                            <span class="text-white/30 block mb-0.5">Runners</span>
                            <span class="text-white/80">${fn:length(resultEntries)} of ${resSelectedRace.maxEntries}</span>
                        </div>
                        <div>
                            <span class="text-white/30 block mb-0.5">Track Type</span>
                            <span class="text-white/80">${resSelectedRace.trackType}</span>
                        </div>
                        <div>
                            <span class="text-white/30 block mb-0.5">Class Level</span>
                            <span class="text-[#c9a227] font-bold">${resSelectedRace.classLevel}</span>
                        </div>
                    </div>
                </div>

                <!-- Podium (Top 3) -->
                <c:if test="${fn:length(resultEntries) >= 1}">
                    <div class="space-y-3">
                        <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block">Podium Finishers</span>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            <c:set var="displayRank" value="0"/>
                            <c:forEach var="item" items="${resultEntries}" varStatus="podiumLoop">
                                <c:if test="${item.entry.status eq 'FINISHED' && displayRank < 3}">
                                    <c:set var="displayRank" value="${displayRank + 1}"/>
                                    <c:choose>
                                        <c:when test="${displayRank == 1}">
                                            <c:set var="podiumBorder" value="border-[#FFD700]"/>
                                            <c:set var="podiumBg" value="bg-[#FFD700]/5"/>
                                            <c:set var="podiumColor" value="text-[#FFD700]"/>
                                            <c:set var="podiumIcon" value="🥇"/>
                                            <c:set var="podiumLabel" value="1ST — WINNER"/>
                                            <c:set var="podiumGlow" value="shadow-[#FFD700]/10"/>
                                        </c:when>
                                        <c:when test="${displayRank == 2}">
                                            <c:set var="podiumBorder" value="border-[#C0C0C0]"/>
                                            <c:set var="podiumBg" value="bg-[#C0C0C0]/5"/>
                                            <c:set var="podiumColor" value="text-[#C0C0C0]"/>
                                            <c:set var="podiumIcon" value="🥈"/>
                                            <c:set var="podiumLabel" value="2ND PLACE"/>
                                            <c:set var="podiumGlow" value="shadow-[#C0C0C0]/10"/>
                                        </c:when>
                                        <c:when test="${displayRank == 3}">
                                            <c:set var="podiumBorder" value="border-[#CD7F32]"/>
                                            <c:set var="podiumBg" value="bg-[#CD7F32]/5"/>
                                            <c:set var="podiumColor" value="text-[#CD7F32]"/>
                                            <c:set var="podiumIcon" value="🥉"/>
                                            <c:set var="podiumLabel" value="3RD PLACE"/>
                                            <c:set var="podiumGlow" value="shadow-[#CD7F32]/10"/>
                                        </c:when>
                                    </c:choose>
                                    
                                    <div class="relative p-6 ${podiumBg} border ${podiumBorder} rounded-xl shadow-lg ${podiumGlow} transition-transform hover:scale-[1.02]">
                                        <div class="absolute top-4 right-4 text-2xl">${podiumIcon}</div>
                                        <span class="text-[9px] font-mono uppercase tracking-widest ${podiumColor} font-bold block mb-3">${podiumLabel}</span>
                                        
                                        <!-- Horse Name -->
                                        <h4 class="font-['Roboto_Slab'] font-bold text-lg text-[#f4f2ec] leading-tight">
                                            <c:out value="${item.horse.name}"/>
                                        </h4>
                                        <p class="text-[10px] font-mono text-white/40 mt-0.5">
                                            Breed: <span class="text-white/60"><c:out value="${item.horse.breed}"/></span>
                                        </p>
                                        
                                        <!-- Jockey & Owner -->
                                        <div class="mt-4 space-y-2 text-xs font-mono">
                                            <div class="flex items-center gap-2">
                                                <i data-lucide="user" class="w-3 h-3 text-white/30"></i>
                                                <span class="text-white/50">Jockey:</span>
                                                <span class="text-white/80 font-semibold"><c:out value="${item.jockey.username}"/></span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <i data-lucide="crown" class="w-3 h-3 text-white/30"></i>
                                                <span class="text-white/50">Owner:</span>
                                                <span class="text-white/80 font-semibold"><c:out value="${item.owner.username}"/></span>
                                            </div>
                                        </div>
                                        
                                        <!-- Stats -->
                                        <div class="mt-4 pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <span class="text-[9px] text-white/30 block">Gate</span>
                                                <span class="text-xs font-bold text-white/70">${item.entry.gateNumber}</span>
                                            </div>
                                            <div>
                                                <span class="text-[9px] text-white/30 block">Time</span>
                                                <span class="text-xs font-bold ${podiumColor}">
                                                    ${not empty item.entry.finishTime ? item.entry.finishTime : 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span class="text-[9px] text-white/30 block">Prize</span>
                                                <span class="text-xs font-bold text-[#c9a227]">
                                                    <c:choose>
                                                        <c:when test="${not empty item.entry.prizeMoney}">
                                                            $<fmt:formatNumber value="${item.entry.prizeMoney}" pattern="#,##0"/>
                                                        </c:when>
                                                        <c:otherwise>—</c:otherwise>
                                                    </c:choose>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </c:if>
                            </c:forEach>
                            
                        </div>
                    </div>
                </c:if>

                <!-- Full Results Table -->
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-4">Full Race Results</span>
                    <c:choose>
                        <c:when test="${empty resultEntries}">
                            <div class="p-8 text-center bg-black/25 border border-white/5 rounded-lg">
                                <i data-lucide="info" class="w-8 h-8 text-[#c9a227]/60 mx-auto mb-2"></i>
                                <p class="text-sm font-mono text-white/40">No result entries recorded for this race.</p>
                            </div>
                        </c:when>
                        <c:otherwise>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                                            <th class="py-3 px-2 w-16 text-center">Pos</th>
                                            <th class="py-3 px-2 w-16 text-center">Draw</th>
                                            <th class="py-3 px-4">Horse</th>
                                            <th class="py-3 px-4">Jockey</th>
                                            <th class="py-3 px-4">Owner</th>
                                            <th class="py-3 px-3 text-center">Wt (kg)</th>
                                            <th class="py-3 px-3 text-center">Rating</th>
                                            <th class="py-3 px-3 text-center">Finish Time</th>
                                            <th class="py-3 px-4 text-right">Prize ($)</th>
                                            <th class="py-3 px-3 text-center">Rtg +/-</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/[0.03]">
                                        <c:set var="tableRank" value="0"/>
                                        <c:forEach var="item" items="${resultEntries}" varStatus="rowLoop">
                                            <c:choose>
                                                <c:when test="${item.entry.status eq 'FINISHED'}">
                                                    <c:set var="tableRank" value="${tableRank + 1}"/>
                                                    <c:set var="rowBg" value="${tableRank == 1 ? 'bg-[#FFD700]/[0.03]' : (tableRank == 2 ? 'bg-[#C0C0C0]/[0.02]' : (tableRank == 3 ? 'bg-[#CD7F32]/[0.02]' : ''))}"/>
                                                </c:when>
                                                <c:otherwise>
                                                    <c:set var="rowBg" value=""/>
                                                </c:otherwise>
                                            </c:choose>
                                            <tr class="hover:bg-white/[0.01] transition-colors group ${rowBg}">
                                                
                                                <!-- Position -->
                                                <td class="py-4 px-2 text-center">
                                                    <c:choose>
                                                        <c:when test="${item.entry.status eq 'DISQUALIFIED'}">
                                                            <span class="inline-flex w-8 h-6 rounded font-mono text-[10px] font-bold items-center justify-center bg-red-900/30 text-red-400 border border-red-800/50">DQ</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.status eq 'FINISHED'}">
                                                            <c:choose>
                                                                <c:when test="${tableRank == 1}">
                                                                    <span class="inline-flex w-7 h-7 rounded-full font-mono text-xs font-bold items-center justify-center bg-[#FFD700] text-[#0e0c09] shadow shadow-[#FFD700]/20">1</span>
                                                                </c:when>
                                                                <c:when test="${tableRank == 2}">
                                                                    <span class="inline-flex w-7 h-7 rounded-full font-mono text-xs font-bold items-center justify-center bg-[#C0C0C0] text-[#0e0c09] shadow">2</span>
                                                                </c:when>
                                                                <c:when test="${tableRank == 3}">
                                                                    <span class="inline-flex w-7 h-7 rounded-full font-mono text-xs font-bold items-center justify-center bg-[#CD7F32] text-white shadow">3</span>
                                                                </c:when>
                                                                <c:otherwise>
                                                                    <span class="inline-flex w-7 h-7 rounded-full font-mono text-xs font-bold items-center justify-center bg-white/5 text-white/60">${tableRank}</span>
                                                                </c:otherwise>
                                                            </c:choose>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="text-xs font-mono text-white/30">—</span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </td>
                                                
                                                <!-- Gate / Draw -->
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
                                                        <c:out value="${item.horse.breed}"/>
                                                    </div>
                                                </td>
                                                
                                                <!-- Jockey -->
                                                <td class="py-4 px-4 text-xs font-mono">
                                                    <div class="text-white/80 font-bold"><c:out value="${item.jockey.username}"/></div>
                                                </td>
                                                
                                                <!-- Owner -->
                                                <td class="py-4 px-4 text-xs font-mono text-white/70">
                                                    <c:out value="${item.owner.username}"/>
                                                </td>
                                                
                                                <!-- Carried Weight -->
                                                <td class="py-4 px-3 text-center text-xs font-mono text-white/85 font-medium">
                                                    ${item.entry.carriedWeight}
                                                </td>
                                                
                                                <!-- Horse Rating -->
                                                <td class="py-4 px-3 text-center text-xs font-mono text-[#c9a227] font-semibold">
                                                    <c:out value="${item.horse.currentRating}"/>
                                                </td>
                                                
                                                <!-- Finish Time -->
                                                <td class="py-4 px-3 text-center text-xs font-mono">
                                                    <c:choose>
                                                        <c:when test="${not empty item.entry.finishTime}">
                                                            <span class="text-white/80 font-bold">${item.entry.finishTime}</span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="text-white/30">—</span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </td>
                                                
                                                <!-- Prize Money -->
                                                <td class="py-4 px-4 text-right text-xs font-mono">
                                                    <c:choose>
                                                        <c:when test="${not empty item.entry.prizeMoney}">
                                                            <span class="text-[#c9a227] font-bold">$<fmt:formatNumber value="${item.entry.prizeMoney}" pattern="#,##0"/></span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="text-white/30">—</span>
                                                        </c:otherwise>
                                                    </c:choose>
                                                </td>
                                                
                                                <!-- Rating Adjustment -->
                                                <td class="py-4 px-3 text-center text-xs font-mono font-bold">
                                                    <c:choose>
                                                        <c:when test="${item.entry.ratingAdjustment != null && item.entry.ratingAdjustment > 0}">
                                                            <span class="text-emerald-500">+${item.entry.ratingAdjustment}</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.ratingAdjustment != null && item.entry.ratingAdjustment < 0}">
                                                            <span class="text-[#c0392b]">${item.entry.ratingAdjustment}</span>
                                                        </c:when>
                                                        <c:when test="${item.entry.ratingAdjustment != null && item.entry.ratingAdjustment == 0}">
                                                            <span class="text-white/30">0</span>
                                                        </c:when>
                                                        <c:otherwise>
                                                            <span class="text-white/20">—</span>
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

                <!-- Steward Report -->
                <c:if test="${not empty resSelectedRace.stewardReport}">
                    <div class="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                        <div class="flex items-center gap-2 mb-3">
                            <i data-lucide="file-text" class="w-4 h-4 text-[#c9a227]"></i>
                            <span class="text-[10px] font-mono uppercase tracking-widest text-[#c9a227] font-bold">Steward's Report</span>
                        </div>
                        <p class="text-sm font-mono text-white/60 leading-relaxed whitespace-pre-line">${resSelectedRace.stewardReport}</p>
                    </div>
                </c:if>
            </div>
        </c:if>
    </c:if>
</div>
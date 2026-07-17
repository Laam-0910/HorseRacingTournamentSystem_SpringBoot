<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<div class="space-y-6 text-[#f4f2ec]">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05)">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-1" style="color: rgba(255,255,255,0.4)">Season</p>
      <p class="font-['Roboto_Slab'] text-base font-bold truncate text-[#c9a227]" title="${raceDay.seasonName}">
        <c:out value="${not empty raceDay.seasonName ? raceDay.seasonName : 'Championship Season'}" />
      </p>
      <p class="text-[10px] font-mono mt-1.5" style="color: rgba(255,255,255,0.3)">Active Tournament</p>
    </div>

    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.015); border-color: rgba(201,162,39,0.12)">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-1" style="color: rgba(255,255,255,0.4)">Race Meeting</p>
      <p class="font-['Roboto_Slab'] text-base font-bold truncate text-zinc-200" title="${raceDay.meetingName}">
        <c:out value="${not empty raceDay.meetingName ? raceDay.meetingName : 'Unknown Meeting'}" />
      </p>
      <p class="text-[10px] font-mono mt-1.5" style="color: #c9a227">● Scheduled Day</p>
    </div>

    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05)">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-1" style="color: rgba(255,255,255,0.4)">Track Venue</p>
      <p class="font-['Roboto_Slab'] text-base font-bold truncate text-zinc-200" title="${raceDay.venueName}">
        <c:out value="${not empty raceDay.venueName ? raceDay.venueName : 'Unknown Course'}" />
      </p>
      <p class="text-[10px] font-mono mt-1.5" style="color: rgba(255,255,255,0.3)">
        <c:out value="${not empty raceDay.trackType ? raceDay.trackType : 'Main Track'}" />
      </p>
    </div>

    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.05)">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-1" style="color: rgba(255,255,255,0.4)">Race Date</p>
      <p class="font-['DM_Mono'] text-base font-medium tabular-nums text-zinc-200">
        <c:out value="${raceDay.date}" />
      </p>
      <p class="text-[10px] font-mono mt-1.5" style="color: rgba(255,255,255,0.3)">
        Total Events: <c:out value="${not empty enrichedRaces ? fn:length(enrichedRaces) : '0'}" />
      </p>
    </div>
  </div>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.012); border-color: rgba(255,255,255,0.05)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(255,255,255,0.05)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Race Day Schedule</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Official operational timeline for the upcoming race fixture</p>
      </div>
      <div>
        <form action="${pageContext.request.contextPath}/RaceDayScheduleController" method="GET" id="filterForm">
          <input type="hidden" name="view" value="schedule" />
          <select 
            name="scheduleDateFilter" 
            onchange="document.getElementById('filterForm').submit();"
            class="rounded-lg px-4 py-2 text-xs text-[#f4f2ec] outline-none appearance-none cursor-pointer border font-mono"
            style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.15); color-scheme: dark;"
          >
            <c:forEach var="availDate" items="${availableDates}">
              <option value="${availDate}" <c:if test="${availDate eq param.scheduleDateFilter}">selected</c:if>>
                ${availDate} ${availDate eq raceDay.date ? '(Current)' : ''}
              </option>
            </c:forEach>
            <c:if test="${empty availableDates}">
              <option value="${raceDay.date}" selected>${raceDay.date} (Current)</option>
            </c:if>
          </select>
        </form>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <c:choose>
        <c:when test="${not empty enrichedRaces}">
          <c:forEach var="item" items="${enrichedRaces}">
            <c:set var="r" value="${item.race}" />
            <div class="rounded-xl border p-6" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.04)">
              
              <!-- Race Header Info -->
              <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.05] mb-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold text-[#c9a227]">Race #${r.id}</span>
                    <span class="font-sans font-bold text-sm text-[#f4f2ec]">${r.classLevel}</span>
                  </div>
                  <div class="text-[11px] font-mono text-zinc-400">
                    Time: <c:out value="${fn:substring(r.startTime, 11, 16)}" /> | Distance: ${r.distanceMeters}m | Track: ${r.trackType} | Purse: $${r.purse}
                  </div>
                </div>
                
                <!-- Status Badge (Read-only) -->
                <div>
                  <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-bold" style="
                    <c:choose>
                      <c:when test="${r.status eq 'OFFICIAL' or r.status eq 'RACE_EVENT_ENDED'}">background: rgba(16,185,129,0.1); color: #10b981; border-color: rgba(16,185,129,0.2);</c:when>
                      <c:when test="${r.status eq 'RUNNING'}">background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.2);</c:when>
                      <c:when test="${r.status eq 'CANCELLED'}">background: rgba(156,163,175,0.1); color: #9ca3af; border-color: rgba(156,163,175,0.2);</c:when>
                      <c:otherwise>background: rgba(245,158,11,0.1); color: #f59e0b; border-color: rgba(245,158,11,0.2);</c:otherwise>
                    </c:choose>
                  ">
                    ${r.status}
                  </span>
                </div>
              </div>
              
              <!-- Content Grid (Referees & Entries) -->
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Referees Section (1/3 width) -->
                <div class="space-y-4 lg:border-r lg:border-white/[0.05] lg:pr-6">
                  <div>
                    <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-[#c9a227] mb-2">Assigned Referees</h4>
                    <c:choose>
                      <c:when test="${not empty item.referees}">
                        <div class="space-y-2">
                          <c:forEach var="ref" items="${item.referees}">
                            <div class="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/[0.05] text-xs">
                              <span class="text-zinc-300 font-medium">${ref.username}</span>
                            </div>
                          </c:forEach>
                        </div>
                      </c:when>
                      <c:otherwise>
                        <p class="text-[11px] font-mono text-zinc-500">No referees assigned.</p>
                      </c:otherwise>
                    </c:choose>
                  </div>
                </div>
                
                <!-- Entries Section (2/3 width) -->
                <div class="lg:col-span-2 space-y-3">
                  <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-[#c9a227]">Racecard Entries</h4>
                  
                  <c:choose>
                    <c:when test="${not empty item.entries}">
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr class="border-b border-white/[0.05] text-[10px] font-mono uppercase text-zinc-500">
                              <th class="py-2 px-1 w-16">Gate</th>
                              <th class="py-2 px-2">Horse (Rating)</th>
                              <th class="py-2 px-2">Jockey (Weight)</th>
                              <th class="py-2 px-2 w-24">Carried Wt</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-white/[0.02]">
                            <c:forEach var="entryInfo" items="${item.entries}">
                              <tr class="hover:bg-white/[0.01]">
                                <!-- Gate Number display -->
                                <td class="py-2 px-1">
                                  <span class="font-mono text-zinc-300 font-bold">${entryInfo.entry.gateNumber}</span>
                                </td>
                                
                                <!-- Horse -->
                                <td class="py-2 px-2">
                                  <span class="font-serif font-medium text-zinc-200">${entryInfo.horse.name}</span>
                                  <span class="text-[10px] font-mono text-[#c9a227]">(${entryInfo.horse.currentRating})</span>
                                </td>
                                
                                <!-- Jockey -->
                                <td class="py-2 px-2">
                                  <span class="text-zinc-300">${entryInfo.jockey.username}</span>
                                  <span class="text-[10px] font-mono text-zinc-500">(${entryInfo.jockey.weight}kg)</span>
                                </td>
                                
                                <!-- Carried Weight display -->
                                <td class="py-2 px-2">
                                  <span class="font-mono text-zinc-300">${entryInfo.entry.carriedWeight} kg</span>
                                </td>
                              </tr>
                            </c:forEach>
                          </tbody>
                        </table>
                      </div>
                    </c:when>
                    <c:otherwise>
                      <p class="text-[11px] font-mono text-zinc-500 p-4 border border-dashed border-white/5 rounded-xl text-center">
                        No entries declared for this race yet.
                      </p>
                    </c:otherwise>
                  </c:choose>
                </div>
                
              </div>
              
            </div>
          </c:forEach>
        </c:when>
        
        <c:otherwise>
          <div class="p-8 text-center border border-dashed border-white/[0.05] rounded-xl text-zinc-500 font-mono text-xs">
            No scheduled events found for this date.
          </div>
        </c:otherwise>
      </c:choose>
    </div>

    <div class="flex items-center justify-between px-6 py-3 border-t" style="border-color: rgba(255,255,255,0.05); background: rgba(255,255,255,0.005)">
      <div class="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
        <span class="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
        <span>Timeline is locked for viewing only</span>
      </div>
      <p class="text-[10px] font-mono text-zinc-500">
        Last updated: <c:out value="${not empty raceDay.lastUpdated ? raceDay.lastUpdated : 'Just now'}" />
      </p>
    </div>
  </div>
</div>
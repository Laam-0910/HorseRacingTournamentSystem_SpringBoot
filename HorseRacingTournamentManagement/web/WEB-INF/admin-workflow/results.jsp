<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <h3 class="font-bold text-lg text-[#f4f2ec]">Process Results & Close Races</h3>
      <p class="text-muted-foreground text-sm" style="color: rgba(255,255,255,0.4)">Select a Race Meeting and process the outcomes of scheduled races.</p>
    </div>

    <!-- Race Meetings List -->
    <div class="p-6">
      <h4 class="font-mono text-[9px] uppercase tracking-widest mb-4" style="color: #c9a227">Race Meetings List</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Meeting Name</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Venue</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Total Budget</th>
            </tr>
          </thead>
          <tbody>
            <c:forEach var="meeting" items="${raceMeetings}">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                <td class="px-4 py-4 font-bold text-[#f4f2ec]">${meeting.name}</td>
                <td class="px-4 py-4 text-[12px]" style="color: rgba(255,255,255,0.55)">${meeting.venue}</td>
                <td class="px-4 py-4 font-mono text-[#4a9d6f]">$${meeting.totalBudget}</td>
              </tr>
            </c:forEach>
            <c:if test="${empty raceMeetings}">
              <tr><td colspan="3" class="px-4 py-4 text-center text-[12px]" style="color: rgba(255,255,255,0.55)">No Race Meetings Found.</td></tr>
            </c:if>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Races List -->
    <div class="p-6 border-t" style="border-color: rgba(201,162,39,0.10)">
      <h4 class="font-mono text-[9px] uppercase tracking-widest mb-4" style="color: #c9a227">Races To Process</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Meeting ID</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Class Level</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Start Time</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Purse</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Status</th>
              <th class="px-4 py-3 text-left font-mono text-[9px] uppercase" style="color: rgba(255,255,255,0.35)">Action</th>
            </tr>
          </thead>
          <tbody>
            <c:forEach var="race" items="${races}">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                <td class="px-4 py-4 font-mono text-xs" style="color: rgba(255,255,255,0.55)">${race.raceMeetingId}</td>
                <td class="px-4 py-4 font-bold text-[#f4f2ec]">${race.classLevel}</td>
                <td class="px-4 py-4 text-[12px]" style="color: rgba(255,255,255,0.55)"><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm"/></td>
                <td class="px-4 py-4 font-mono text-[#4a9d6f]">$${race.purse}</td>
                <td class="px-4 py-4">
                  <span class="px-2 py-1 rounded text-[10px] font-bold" style="background: rgba(201,162,39,0.15); color: #c9a227;">
                    ${race.status}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <button class="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90" style="background: #c9a227; color: #0b0d11">
                    Process
                  </button>
                </td>
              </tr>
            </c:forEach>
            <c:if test="${empty races}">
              <tr><td colspan="6" class="px-4 py-4 text-center text-[12px]" style="color: rgba(255,255,255,0.55)">No Races Found.</td></tr>
            </c:if>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Class Rules -->
    <div class="p-6 border-t" style="border-color: rgba(201,162,39,0.10)">
      <h4 class="font-mono text-[9px] uppercase tracking-widest mb-4" style="color: #c9a227">Season Class Rules Reference</h4>
      <div class="flex flex-wrap gap-4">
        <c:forEach var="rule" items="${classRules}">
          <div class="p-3 rounded-lg border" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); width: 250px;">
             <p class="font-bold text-[13px] text-[#f4f2ec]">${rule.classLevel}</p>
             <p class="text-[11px]" style="color: rgba(255,255,255,0.5)">${rule.className}</p>
             <div class="mt-2 text-[10px] font-mono" style="color: rgba(255,255,255,0.4)">
                Rating: ${rule.minRating} - ${rule.maxRating == null ? 'Max' : rule.maxRating}<br/>
                Prize: $${rule.minPrize} - $${rule.maxPrize}
             </div>
          </div>
        </c:forEach>
      </div>
    </div>
  </div>
</div>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
  
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Live Broadcast Settings</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Attach or manage YouTube livestream URLs for running race events</p>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[800px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Race ID</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Race Meeting</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Class</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Start Time</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Status</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-center" style="color: rgba(255,255,255,0.35)">Livestream Configuration</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty races}">
              <c:forEach var="race" items="${races}">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">R-${race.id}</span></td>
                  <td class="px-6 py-4"><p class="text-xs text-[#f4f2ec]">${meetingNames[race.raceMeetingId]}</p></td>
                  <td class="px-6 py-4"><span class="text-xs font-mono text-[#c9a227] font-semibold">${race.classLevel}</span></td>
                  <td class="px-6 py-4 text-xs font-mono text-white/50"><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm"/></td>
                  <td class="px-6 py-4">
                    <c:choose>
                      <c:when test="${race.status eq 'RUNNING'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block animate-pulse" style="background: rgba(245,158,11,0.1); color: #fbbf24; border-color: rgba(245,158,11,0.2)">Running</span>
                      </c:when>
                      <c:when test="${race.status eq 'SCHEDULED' or race.status eq 'DECLARATION_OPEN' or race.status eq 'DECLARATION_CLOSED'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(59,130,246,0.1); color: #3b82f6; border-color: rgba(59,130,246,0.2)">Scheduled</span>
                      </c:when>
                      <c:when test="${race.status eq 'OFFICIAL'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(16,185,129,0.1); color: #34d399; border-color: rgba(16,185,129,0.2)">Official</span>
                      </c:when>
                      <c:when test="${race.status eq 'CANCELLED'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(239,91,91,0.1); color: #ef5b5b; border-color: rgba(239,91,91,0.2)">Cancelled</span>
                      </c:when>
                      <c:otherwise>
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.1)">${race.status}</span>
                      </c:otherwise>
                    </c:choose>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <c:choose>
                      <c:when test="${not empty race.youtubeLiveUrl}">
                        <div class="flex items-center gap-3 justify-center">
                          <span class="text-xs text-red-500 font-bold tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span>LIVE
                          </span>
                          <a href="${race.youtubeLiveUrl}" target="_blank" class="text-xs text-[#c9a227] hover:underline truncate max-w-[250px]" title="${race.youtubeLiveUrl}">
                            ${race.youtubeLiveUrl}
                          </a>
                          <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="inline m-0">
                            <input type="hidden" name="action" value="removeLivestreamUrl" />
                            <input type="hidden" name="raceId" value="${race.id}" />
                            <button type="submit" class="text-[10px] px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-red-400 font-bold transition-all active:scale-95">End Live</button>
                          </form>
                        </div>
                      </c:when>
                      <c:otherwise>
                        <c:choose>
                          <c:when test="${race.status eq 'RUNNING'}">
                            <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="flex items-center gap-2 justify-center m-0">
                              <input type="hidden" name="action" value="setLivestreamUrl" />
                              <input type="hidden" name="raceId" value="${race.id}" />
                              <input type="text" name="youtubeLiveUrl" placeholder="Enter YouTube Livestream URL..." required class="text-xs rounded-lg px-3 py-1.5 text-[#f4f2ec] border outline-none w-80 focus:border-[#c9a227] transition-all" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); color-scheme: dark"/>
                              <button type="submit" class="text-xs px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold transition-all active:scale-95">Go Live</button>
                            </form>
                          </c:when>
                          <c:otherwise>
                            <span class="text-xs text-white/20">Needs to be RUNNING status</span>
                          </c:otherwise>
                        </c:choose>
                      </c:otherwise>
                    </c:choose>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No races found in the database.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>
    
  </div>
</div>

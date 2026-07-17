<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Create New Race</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Add a race to a scheduled race meeting</p>
      </div>
    </div>
    <div class="p-6 space-y-6">
      <c:if test="${not empty createRaceError}">
          <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs mb-4">
              ${createRaceError}
          </div>
      </c:if>
      <form action="${pageContext.request.contextPath}/AdminUserController" method="post">
        <input type="hidden" name="action" value="createRace" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div class="md:col-span-2">
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
              Select Race Meeting
            </label>
            <div class="relative">
              <select 
                name="raceMeetingId" 
                required 
                class="w-full rounded-lg px-4 py-3.5 text-sm text-[#f4f2ec] outline-none appearance-none cursor-pointer font-['Roboto_Slab'] font-bold [&>option]:bg-[#12141a] [&>option]:text-white [&>option]:font-bold" 
                style="background: #c9a22712; border: 1px solid #c9a22740; color-scheme: dark;"
              >
                <c:if test="${empty raceMeetings}">
                   <option value="" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">No Active Race Meetings Found</option>
                </c:if>
                <c:forEach var="meeting" items="${raceMeetings}">
                   <option value="${meeting.id}" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">${meeting.name}</option>
                </c:forEach>
              </select>
              <i data-lucide="chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style="width: 16px; height: 16px; color: #c9a227"></i>
            </div>
          </div>
          <div>
             <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Class Level</label>
             <select 
               name="classLevel" 
               required 
               class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none appearance-none cursor-pointer [&>option]:bg-[#12141a] [&>option]:text-white [&>option]:font-bold" 
               style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
             >
                 <option value="1" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Class 1 (Rating 95+)</option>
                 <option value="2" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Class 2 (Rating 80-94)</option>
                 <option value="3" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Class 3 (Rating 60-79)</option>
                 <option value="4" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Class 4 (Rating 40-59)</option>
                 <option value="5" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Class 5 (Rating 0-39)</option>
             </select>
          </div>
          <div>
             <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Track Type</label>
             <select 
               name="trackType" 
               required 
               class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none appearance-none cursor-pointer [&>option]:bg-[#12141a] [&>option]:text-white [&>option]:font-bold" 
               style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
             >
                 <option value="Turf" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Turf</option>
                 <option value="Dirt" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Dirt</option>
                 <option value="Synthetic" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">Synthetic</option>
             </select>
          </div>
          <div>
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Start Time</label>
            <input type="text" name="startTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
          <div>
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: #c9a227">Registration Start Time</label>
            <input type="text" name="registrationStartTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
          <div>
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: #c9a227">Registration End Time</label>
            <input type="text" name="registrationEndTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
          <div>
             <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Distance (Meters)</label>
             <input type="number" name="distanceMeters" value="1200" required class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
          <div>
             <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Max Entries</label>
             <input type="number" name="maxEntries" value="12" required class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
          <div>
             <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Purse Amount (USD)</label>
             <input type="number" name="purse" value="100000" required class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95" style="background: #c9a227; color: #0b0d11">
            <i data-lucide="flag" style="width: 13px; height: 13px;"></i>
            Create Race
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Races Database</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">List of all scheduled races across active meetings</p>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[900px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Race ID</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Race Meeting</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Class</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Track</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Distance</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Start Time</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Min–Max Rating</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-right" style="color: rgba(255,255,255,0.35)">Purse</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-right" style="color: rgba(255,255,255,0.35)">Status</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-center" style="color: rgba(255,255,255,0.35)">Livestream</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-center" style="color: rgba(255,255,255,0.35)">Assigned Referee</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-center" style="color: rgba(255,255,255,0.35)">Actions</th>
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
                  <td class="px-6 py-4 text-xs font-mono text-white/60">${race.trackType}</td>
                  <td class="px-6 py-4 text-xs font-mono text-white/60">${race.distanceMeters}m</td>
                  <td class="px-6 py-4 text-xs font-mono text-white/50"><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm"/></td>
                  <td class="px-6 py-4 text-xs font-mono text-white/50">${race.minRating} – ${race.maxRating}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="font-['DM_Mono'] text-sm font-bold tabular-nums text-[#4a9d6f]">$${race.purse}</span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <c:choose>
                      <c:when test="${race.status eq 'SCHEDULED' or race.status eq 'DECLARATION_OPEN' or race.status eq 'DECLARATION_CLOSED'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(59,130,246,0.1); color: #3b82f6; border-color: rgba(59,130,246,0.2)">Scheduled</span>
                      </c:when>
                      <c:when test="${race.status eq 'RUNNING'}">
                        <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block animate-pulse" style="background: rgba(245,158,11,0.1); color: #fbbf24; border-color: rgba(245,158,11,0.2)">Running</span>
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
                        <div class="flex flex-col items-center gap-1.5 justify-center">
                          <span class="text-[10px] text-red-500 font-bold tracking-widest uppercase flex items-center gap-1 animate-pulse">
                            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>LIVE
                          </span>
                          <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="inline">
                            <input type="hidden" name="action" value="removeLivestreamUrl" />
                            <input type="hidden" name="raceId" value="${race.id}" />
                            <button type="submit" class="text-[9px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-red-400 font-bold transition-all">End Live</button>
                          </form>
                        </div>
                      </c:when>
                      <c:otherwise>
                        <c:choose>
                          <c:when test="${race.status eq 'RUNNING'}">
                            <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="flex flex-col gap-1 items-center justify-center">
                              <input type="hidden" name="action" value="setLivestreamUrl" />
                              <input type="hidden" name="raceId" value="${race.id}" />
                              <input type="text" name="youtubeLiveUrl" placeholder="YouTube URL" required class="text-[10px] rounded px-1.5 py-1 text-[#f4f2ec] border outline-none w-28" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); color-scheme: dark"/>
                              <button type="submit" class="text-[9px] px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold transition-all">Go Live</button>
                            </form>
                          </c:when>
                          <c:otherwise>
                            <span class="text-xs text-white/30">-</span>
                          </c:otherwise>
                        </c:choose>
                      </c:otherwise>
                    </c:choose>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center gap-1.5 justify-center">
                      <c:set var="assignedList" value="${raceRefereesMap[race.id]}" />
                      <c:forEach var="ref" items="${assignedList}">
                        <div class="inline-flex items-center gap-1 bg-zinc-800 text-[#f4f2ec] text-[10px] px-2 py-0.5 rounded border border-zinc-700">
                          <span>${ref.username}</span>
                          <a href="${pageContext.request.contextPath}/AdminUserController?action=removeReferee&raceId=${race.id}&refereeId=${ref.id}" class="text-red-400 hover:text-red-300 font-bold ml-1 font-mono text-[10px]" title="Remove referee">×</a>
                        </div>
                      </c:forEach>
                      <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="flex items-center gap-1 mt-1 justify-center">
                        <input type="hidden" name="action" value="assignReferee" />
                        <input type="hidden" name="raceId" value="${race.id}" />
                        <select name="refereeId" required class="text-[10px] rounded px-1.5 py-1 text-[#f4f2ec] border outline-none" style="background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.1); color-scheme: dark">
                          <option value="">-- Assign Referee --</option>
                          <c:forEach var="rUser" items="${referees}">
                            <option value="${rUser.id}">${rUser.username}</option>
                          </c:forEach>
                        </select>
                        <button type="submit" class="text-[10px] px-2 py-1 rounded bg-[#c9a227] hover:bg-[#b08d20] text-zinc-950 font-bold transition-all">Assign</button>
                      </form>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button 
                      onclick="openEditRaceModal(${race.id}, '${race.startTime}', '${race.registrationStartTime}', '${race.registrationEndTime}', ${race.distanceMeters}, '${race.trackType}', ${race.purse}, ${race.maxEntries})"
                      class="px-2.5 py-1.5 rounded bg-[#c9a227] hover:bg-[#b08d20] text-zinc-950 font-mono text-[10px] font-bold transition-all"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="12" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No races found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>
    <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
      <p class="text-[10px] font-mono" style="color: rgba(255,255,255,0.3)">
        ${not empty racesSize ? racesSize : 0} races total inside current active season meetings.
      </p>
    </div>
  </div>
</div>

<!-- Edit Race Modal -->
<div id="editRaceModal" class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div class="w-full max-w-lg rounded-xl border p-6 space-y-6 shadow-2xl" style="background: #12141a; border-color: rgba(201,162,39,0.22)">
    <div class="flex items-center justify-between border-b pb-3" style="border-color: rgba(201,162,39,0.1)">
      <h3 class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Edit Race Schedule</h3>
      <button onclick="closeEditRaceModal()" class="text-white/40 hover:text-white/80 font-bold text-lg">&times;</button>
    </div>
    <form action="${pageContext.request.contextPath}/AdminUserController" method="POST" class="space-y-4 m-0">
      <input type="hidden" name="action" value="updateRace" />
      <input type="hidden" name="raceId" id="editRaceId" />
      
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: rgba(255,255,255,0.4)">Start Time</label>
          <input type="text" name="startTime" id="editStartTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: #c9a227">Registration Start</label>
          <input type="text" name="registrationStartTime" id="editRegStartTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: #c9a227">Registration End</label>
          <input type="text" name="registrationEndTime" id="editRegEndTime" placeholder="dd/MM/yyyy HH:mm" required class="datetime-picker w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: rgba(255,255,255,0.4)">Distance (m)</label>
          <input type="number" name="distanceMeters" id="editDistanceMeters" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: rgba(255,255,255,0.4)">Track Type</label>
          <select name="trackType" id="editTrackType" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark">
            <option value="Turf">Turf</option>
            <option value="Dirt">Dirt</option>
            <option value="Synthetic">Synthetic</option>
          </select>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: rgba(255,255,255,0.4)">Purse ($)</label>
          <input type="number" name="purse" id="editPurse" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
        <div>
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-1.5" style="color: rgba(255,255,255,0.4)">Max Entries</label>
          <input type="number" name="maxEntries" id="editMaxEntries" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"/>
        </div>
      </div>
      
      <div class="flex items-center justify-end gap-3 pt-4 border-t" style="border-color: rgba(201,162,39,0.1)">
        <button type="button" onclick="closeEditRaceModal()" class="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-all">Cancel</button>
        <button type="submit" class="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-[#c9a227] hover:bg-[#b08d20] text-zinc-950 transition-all">Save Changes</button>
      </div>
    </form>
  </div>
</div>

<script>
function openEditRaceModal(id, startTime, regStartTime, regEndTime, distance, trackType, purse, maxEntries) {
    document.getElementById('editRaceId').value = id;
    
    // Format timestamps from "YYYY-MM-DD HH:MM:SS" to "DD/MM/YYYY HH:MM" for text inputs with Flatpickr
    let formattedStart = formatTimestampForInput(startTime);
    let formattedRegStart = formatTimestampForInput(regStartTime);
    let formattedRegEnd = formatTimestampForInput(regEndTime);
    
    setPickerValue('editStartTime', formattedStart);
    setPickerValue('editRegStartTime', formattedRegStart);
    setPickerValue('editRegEndTime', formattedRegEnd);
    
    document.getElementById('editDistanceMeters').value = distance;
    document.getElementById('editTrackType').value = trackType;
    document.getElementById('editPurse').value = purse;
    document.getElementById('editMaxEntries').value = maxEntries;
    
    document.getElementById('editRaceModal').classList.remove('hidden');
}

function setPickerValue(id, val) {
    const el = document.getElementById(id);
    if (el) {
        el.value = val;
        if (el._flatpickr) {
            el._flatpickr.setDate(val, true);
        }
    }
}

function closeEditRaceModal() {
    document.getElementById('editRaceModal').classList.add('hidden');
}

function formatTimestampForInput(ts) {
    if (!ts) return "";
    let parts = ts.split(" ");
    if (parts.length >= 2) {
        let dateParts = parts[0].split("-");
        let timeParts = parts[1].split(":");
        if (dateParts.length >= 3 && timeParts.length >= 2) {
            return dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0] + " " + timeParts[0] + ":" + timeParts[1];
        }
    }
    return ts;
}
</script>
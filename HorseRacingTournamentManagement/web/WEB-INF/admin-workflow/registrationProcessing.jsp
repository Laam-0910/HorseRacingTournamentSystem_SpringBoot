<%@ page contentType="text/html" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="space-y-6 p-6 min-h-screen" style="background: #0b0d11; color: #f4f2ec;">
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.025); border-color: rgba(201,162,39,0.14)">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Awaiting Decision</p>
      <p class="font-['DM_Mono'] text-3xl font-medium tabular-nums" style="color: #c9a227">${not empty awaitingDecisionCount ? awaitingDecisionCount : 0}</p>
      <p class="text-[10px] font-mono mt-1" style="color: rgba(255,255,255,0.3)">pending review</p>
    </div>
    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.025); border-color: #4a9d6f22">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Approved</p>
      <p class="font-['DM_Mono'] text-3xl font-medium tabular-nums" style="color: #4a9d6f">${not empty approvedCount ? approvedCount : 0}</p>
      <p class="text-[10px] font-mono mt-1" style="color: rgba(255,255,255,0.3)">cleared to race</p>
    </div>
    <div class="rounded-xl p-5 border" style="background: rgba(255,255,255,0.025); border-color: #ff6b6b22">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Rejected</p>
      <p class="font-['DM_Mono'] text-3xl font-medium tabular-nums" style="color: #ff6b6b">${not empty rejectedCount ? rejectedCount : 0}</p>
      <p class="text-[10px] font-mono mt-1" style="color: rgba(255,255,255,0.3)">entry denied</p>
    </div>
  </div>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <h2 class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Pending Registrations</h2>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Race meeting entry submissions awaiting steward approval</p>
      </div>
      <div>
        <select 
          class="rounded px-3 py-1.5 text-xs font-bold outline-none cursor-pointer [&>option]:bg-[#12141a] [&>option]:text-white [&>option]:font-bold"
          style="background: #c9a22712; border: 1px solid rgba(201,162,39,0.3); color: #f4f2ec; color-scheme: dark;"
        >
          <option style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">All Races</option>
        </select>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[1000px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Ref</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Horse & Rating</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Owner</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Assigned Jockey</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Target Race</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Carried Weight</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style="color: rgba(255,255,255,0.35)">Action</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty entriesData}">
              <c:forEach var="data" items="${entriesData}">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">REG-${data.entry.id}</span></td>
                  
                  <td class="px-6 py-4">
                    <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">${data.horse.name}</p>
                    <div class="inline-flex items-center gap-1 bg-[#1c1b17] border border-[#c9a227]/20 rounded px-1.5 py-0.5 mt-1">
                      <span class="text-[#c9a227] text-[9px] font-mono">⭐ Rating: ${data.horse.currentRating}</span>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 text-xs" style="color: rgba(255,255,255,0.7)">
                    ${data.owner.username}
                  </td>
                  
                  <td class="px-6 py-4">
                    <p class="text-xs font-semibold hover:underline cursor-pointer" style="color: #3b82c4">${data.jockey.username}</p>
                    <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Weight: ${data.jockey.weight} kg</p>
                  </td>
                  
                  <td class="px-6 py-4">
                    <p class="text-xs font-semibold text-gray-200">${data.meeting.name}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">${data.race.classLevel} (${data.race.distanceMeters}m)</p>
                  </td>
                  
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: rgba(255,255,255,0.6)">${data.entry.carriedWeight} kg</span></td>
                  
                  <td class="px-6 py-4 text-right">
                    <form action="${pageContext.request.contextPath}/admin/registration-processing" method="POST" class="inline-flex gap-2">
                      <input type="hidden" name="entryId" value="${data.entry.id}">
                      
                      <button type="submit" name="action" value="REJECT" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        ✕ Reject
                      </button>
                      
                      <button type="submit" name="action" value="APPROVE" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        ✓ Approve
                      </button>
                    </form>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No pending registrations found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
      <div class="flex justify-between items-center text-[10px] font-mono" style="color: rgba(255,255,255,0.3)">
        <div class="flex items-center gap-4">
          <span>● <span style="color: rgba(255,255,255,0.6)">${not empty entriesDataSize ? entriesDataSize : 0}</span> pending</span>
          <span>● 0 approved</span>
          <span>● 0 rejected</span>
        </div>
        <div>
          ${not empty entriesDataSize ? entriesDataSize : 0} entries shown
        </div>
      </div>
    </div>
  </div>

  <div class="rounded-xl border mt-6" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <h2 class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Pending Horse Meeting Registrations</h2>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Horse event entry submissions awaiting steward approval</p>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[1000px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Ref</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Horse</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Owner</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Target Meeting</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Submitted</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style="color: rgba(255,255,255,0.35)">Action</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty pendingHorseRegsData}">
              <c:forEach var="data" items="${pendingHorseRegsData}">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">REG-H-${data.registration.id}</span></td>
                  
                  <td class="px-6 py-4">
                    <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">${data.horse.name}</p>
                    <div class="inline-flex items-center gap-1 bg-[#1c1b17] border border-[#c9a227]/20 rounded px-1.5 py-0.5 mt-1">
                      <span class="text-[#c9a227] text-[9px] font-mono">⭐ Rating: ${data.horse.currentRating}</span>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 text-xs" style="color: rgba(255,255,255,0.7)">
                    ${data.owner.username}
                  </td>
                  
                  <td class="px-6 py-4"><p class="font-['Roboto_Slab'] font-bold text-sm" style="color: #f4f2ec">${data.meeting.name}</p></td>
                  
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: rgba(255,255,255,0.55)">${data.registration.registeredAt}</span></td>
                  
                  <td class="px-6 py-4 text-right">
                    <form action="${pageContext.request.contextPath}/admin/registration-processing" method="POST" class="inline-flex gap-2">
                      <input type="hidden" name="registrationId" value="${data.registration.id}">
                      
                      <button type="submit" name="action" value="REJECT_HORSE" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        ✕ Reject
                      </button>
                      
                      <button type="submit" name="action" value="APPROVE_HORSE" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        ✓ Approve
                      </button>
                    </form>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No pending horse registrations found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
      <div class="flex justify-between items-center text-[10px] font-mono" style="color: rgba(255,255,255,0.3)">
        <div>
          <span>● <span style="color: rgba(255,255,255,0.6)">${not empty pendingHorseRegsDataSize ? pendingHorseRegsDataSize : 0}</span> pending</span>
        </div>
        <div>
          ${not empty pendingHorseRegsDataSize ? pendingHorseRegsDataSize : 0} horse entries shown
        </div>
      </div>
    </div>
  </div>

  <!-- Jockey Meeting Registrations Section -->
  <div class="bg-[#111625] rounded-xl border border-white/[0.05] overflow-hidden mt-6">
    <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
      <div>
        <h2 class="font-['Roboto_Slab'] font-bold text-base text-[#f4f2ec]">Pending Jockey Meeting Registrations</h2>
        <p class="text-[11px] text-gray-400 mt-0.5">Jockey availability sign-up submissions awaiting steward approval</p>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[800px]">
        <thead>
          <tr class="border-b border-white/[0.05] bg-white/[0.01] text-left">
            <th class="px-6 py-3.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">Ref</th>
            <th class="px-6 py-3.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">Jockey</th>
            <th class="px-6 py-3.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">Target Meeting</th>
            <th class="px-6 py-3.5 text-[10px] font-mono uppercase tracking-wider text-gray-500">Submitted</th>
            <th class="px-6 py-3.5 text-[10px] font-mono uppercase tracking-wider text-right text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/[0.03]">
          <c:choose>
            <c:when test="${not empty pendingJockeyRegsData}">
              <c:forEach var="data" items="${pendingJockeyRegsData}">
                <tr class="hover:bg-white/[0.01] transition-colors">
                  <td class="px-6 py-4 font-mono text-xs text-gray-400">
                    REG-J-${data.registration.id}
                  </td>
                  
                  <td class="px-6 py-4">
                    <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">${data.jockey.username}</p>
                    <div class="inline-flex items-center gap-1 bg-[#1a2035] border border-blue-500/20 rounded px-1.5 py-0.5 mt-1">
                      <span class="text-blue-400 text-[9px]">⚖️ Weight: ${data.jockey.weight} lbs</span>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 text-sm text-gray-300 font-semibold">
                    ${data.meeting.name}
                  </td>
                  
                  <td class="px-6 py-4 font-mono text-xs text-gray-400">
                    ${data.registration.registeredAt}
                  </td>
                  
                  <td class="px-6 py-4 text-right">
                    <form action="${pageContext.request.contextPath}/admin/registration-processing" method="POST" class="inline-flex gap-2">
                      <input type="hidden" name="registrationId" value="${data.registration.id}">
                      
                      <button type="submit" name="action" value="REJECT_JOCKEY" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        ✕ Reject
                      </button>
                      
                      <button type="submit" name="action" value="APPROVE_JOCKEY" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        ✓ Approve
                      </button>
                    </form>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No pending jockey registrations found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-3 border-t border-white/[0.05] bg-white/[0.005] flex justify-between items-center text-[10px] font-mono text-gray-500">
      <div>
        <span>● <span class="text-gray-400">${not empty pendingJockeyRegsDataSize ? pendingJockeyRegsDataSize : 0}</span> pending</span>
      </div>
      <div>
        ${not empty pendingJockeyRegsDataSize ? pendingJockeyRegsDataSize : 0} jockey entries shown
      </div>
    </div>
  </div>

  <!-- Pending System Horse Approvals Section -->
  <div class="rounded-xl border mt-6 bg-[#111625]/40" style="border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <h2 class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Pending System Horse Approvals</h2>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">New stable horses registered by Owners awaiting system activation</p>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[800px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Horse ID</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Horse Name</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Breed</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Owner</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Date of Birth</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style="color: rgba(255,255,255,0.35)">Action</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty pendingSystemHorsesData}">
              <c:forEach var="data" items="${pendingSystemHorsesData}">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">HORSE-${data.horse.id}</span></td>
                  <td class="px-6 py-4 font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">${data.horse.name}</td>
                  <td class="px-6 py-4 text-xs" style="color: rgba(255,255,255,0.7)">${data.horse.breed}</td>
                  <td class="px-6 py-4 text-xs" style="color: rgba(255,255,255,0.7)">${data.owner.username}</td>
                  <td class="px-6 py-4 text-xs font-mono" style="color: rgba(255,255,255,0.55)"><fmt:formatDate value="${data.horse.dateOfBirth}" pattern="dd/MM/yyyy" /></td>
                  <td class="px-6 py-4 text-right">
                    <form action="${pageContext.request.contextPath}/admin/registration-processing" method="POST" class="inline-flex gap-2">
                      <input type="hidden" name="horseId" value="${data.horse.id}">
                      
                      <button type="submit" name="action" value="REJECT_SYSTEM_HORSE" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        ✕ Reject
                      </button>
                      
                      <button type="submit" name="action" value="APPROVE_SYSTEM_HORSE" class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                        ✓ Approve
                      </button>
                    </form>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No pending system horses found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>
    
    <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
      <div class="flex justify-between items-center text-[10px] font-mono" style="color: rgba(255,255,255,0.3)">
        <div>
          <span>● <span style="color: rgba(255,255,255,0.6)">${not empty pendingSystemHorsesDataSize ? pendingSystemHorsesDataSize : 0}</span> pending</span>
        </div>
        <div>
          ${not empty pendingSystemHorsesDataSize ? pendingSystemHorsesDataSize : 0} horses shown
        </div>
      </div>
    </div>
  </div>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Create New Race Meeting</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Define a race meeting day within the selected active season</p>
      </div>
    </div>
    <div class="p-6 space-y-6">
      <c:if test="${not empty createMeetingError}">
          <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs mb-4">
              ${createMeetingError}
          </div>
      </c:if>
      <form action="${pageContext.request.contextPath}/AdminUserController" method="post">
        <input type="hidden" name="action" value="createRaceMeeting" />
        <div class="mb-5">
          <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: #c9a227">
            Select Active Season
          </label>
          <div class="relative">
            <select
              name="seasonId"
              required
              class="w-full rounded-lg px-4 py-3.5 text-sm text-[#f4f2ec] outline-none appearance-none cursor-pointer font-['Roboto_Slab'] font-bold [&>option]:bg-[#12141a] [&>option]:text-white [&>option]:font-bold"
              style="background: #c9a22712; border: 1px solid #c9a22740; color-scheme: dark;"
            >
              <c:if test="${empty seasons}">
                <option value="" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">No active seasons found</option>
              </c:if>
              <c:forEach var="season" items="${seasons}">
                <option value="${season.id}" style="background: #12141a !important; color: #ffffff !important; font-weight: bold !important;">${season.name}</option>
              </c:forEach>
            </select>
            <i data-lucide="calendar" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style="width: 16px; height: 16px; color: #c9a227"></i>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div class="md:col-span-2">
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
              Race Meeting Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Spring Gold Cup Day"
              class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
            />
          </div>
          <div>
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
              Event Date
            </label>
             <input
              type="text"
              name="date"
              placeholder="dd/MM/yyyy"
              class="date-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
            />
          </div>
          <div>
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
              Venue Location
            </label>
            <input
              type="text"
              name="venue"
              placeholder="e.g. Royal Ascot Arena"
              class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
              style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
              Total Purse Amount (USD)
            </label>
            <div class="relative">
              <i data-lucide="dollar-sign" class="absolute left-3 top-1/2 -translate-y-1/2" style="width: 14px; height: 14px; color: rgba(255,255,255,0.3)"></i>
              <input
                type="number"
                name="purse"
                placeholder="e.g. 1200000"
                class="w-full rounded-lg pl-8 pr-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95"
            style="background: #c9a227; color: #0b0d11"
          >
            <i data-lucide="plus" style="width: 13px; height: 13px;"></i>
            Create Race Meeting
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Race Meeting Calendar</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">All scheduled race meetings for the active season</p>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[800px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Meeting ID</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Title</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Scheduled Date</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Venue</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-right" style="color: rgba(255,255,255,0.35)">Total Purse</th>
          </tr>
        </thead>
        <tbody>
          <c:choose>
            <c:when test="${not empty raceMeetings}">
              <c:forEach var="meeting" items="${raceMeetings}">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
                  <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">RM-${meeting.id}</span></td>
                  <td class="px-6 py-4"><p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">${meeting.name}</p></td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <i data-lucide="calendar" style="width: 11px; height: 11px; color: rgba(255,255,255,0.3)"></i>
                      <span class="font-mono text-xs" style="color: rgba(255,255,255,0.55)"><fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm"/></span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <i data-lucide="map-pin" style="width: 11px; height: 11px; color: rgba(255,255,255,0.3)"></i>
                      <span class="text-xs" style="color: rgba(255,255,255,0.55)">${meeting.venue}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="font-['DM_Mono'] text-sm font-bold tabular-nums" style="color: #4a9d6f">$${meeting.totalBudget}</span>
                  </td>
                </tr>
              </c:forEach>
            </c:when>
            <c:otherwise>
              <tr>
                <td colspan="5" class="px-6 py-12 text-center text-xs font-mono text-gray-500">
                  No race meetings found.
                </td>
              </tr>
            </c:otherwise>
          </c:choose>
        </tbody>
      </table>
    </div>
    <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
      <p class="text-[10px] font-mono" style="color: rgba(255,255,255,0.3)">
        ${not empty raceMeetingsSize ? raceMeetingsSize : 0} race meetings scheduled · Race configuration begins after race meeting creation
      </p>
    </div>
  </div>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<c:set var="view" value="${empty param.view ? 'hub' : param.view}" />
<c:set var="activeLabel" value="Owner Hub" />
<c:choose>
    <c:when test="${view eq 'hub'}"><c:set var="activeLabel" value="Owner Hub" /></c:when>
    <c:when test="${view eq 'stable'}"><c:set var="activeLabel" value="My Stable" /></c:when>
    <c:when test="${view eq 'calendar'}"><c:set var="activeLabel" value="Race Calendar" /></c:when>
    <c:when test="${view eq 'invitations'}"><c:set var="activeLabel" value="Jockey Invitations" /></c:when>
    <c:when test="${view eq 'results'}"><c:set var="activeLabel" value="Results & Earnings" /></c:when>
</c:choose>

<t:dashboardLayout 
    roleLabel="Horse Owner" 
    roleColor="#4a9d6f" 
    userName="${not empty sessionScope.user.username ? sessionScope.user.username : 'Marlowe Stables'}" 
    activeLabel="${activeLabel}"
    profileActive="${view eq 'profile'}">
    
    <jsp:attribute name="navItems">
        <!-- Workflow -->
        <a href="?action=viewDashboard&view=hub" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'hub' ? '#4a9d6f18' : 'transparent'}; border-left: ${view eq 'hub' ? '2px solid #4a9d6f' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'hub' ? '#4a9d6f' : 'rgba(255,255,255,0.25)'}">01</span>
            <i data-lucide="layout-dashboard" style="width: 14px; height: 14px; color: ${view eq 'hub' ? '#4a9d6f' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'hub' ? '#4a9d6f' : 'rgba(255,255,255,0.65)'}">Owner Hub</span>
        </a>
        <a href="?action=viewDashboard&view=stable" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'stable' ? '#4a9d6f18' : 'transparent'}; border-left: ${view eq 'stable' ? '2px solid #4a9d6f' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'stable' ? '#4a9d6f' : 'rgba(255,255,255,0.25)'}">02</span>
            <i data-lucide="book-open" style="width: 14px; height: 14px; color: ${view eq 'stable' ? '#4a9d6f' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'stable' ? '#4a9d6f' : 'rgba(255,255,255,0.65)'}">My Stable</span>
        </a>
        <a href="?action=viewDashboard&view=calendar" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'calendar' ? '#4a9d6f18' : 'transparent'}; border-left: ${view eq 'calendar' ? '2px solid #4a9d6f' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'calendar' ? '#4a9d6f' : 'rgba(255,255,255,0.25)'}">03</span>
            <i data-lucide="calendar" style="width: 14px; height: 14px; color: ${view eq 'calendar' ? '#4a9d6f' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'calendar' ? '#4a9d6f' : 'rgba(255,255,255,0.65)'}">Race Calendar</span>
        </a>
        <a href="?action=viewDashboard&view=invitations" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'invitations' ? '#4a9d6f18' : 'transparent'}; border-left: ${view eq 'invitations' ? '2px solid #4a9d6f' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'invitations' ? '#4a9d6f' : 'rgba(255,255,255,0.25)'}">04</span>
            <i data-lucide="mail" style="width: 14px; height: 14px; color: ${view eq 'invitations' ? '#4a9d6f' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'invitations' ? '#4a9d6f' : 'rgba(255,255,255,0.65)'}">Invitations</span>
            <c:if test="${not empty invitations && invitations.size() > 0}">
                <span class="bg-[#4a9d6f] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-2">${invitations.size()}</span>
            </c:if>
        </a>
        <a href="?action=viewDashboard&view=results" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'results' ? '#4a9d6f18' : 'transparent'}; border-left: ${view eq 'results' ? '2px solid #4a9d6f' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'results' ? '#4a9d6f' : 'rgba(255,255,255,0.25)'}">05</span>
            <i data-lucide="award" style="width: 14px; height: 14px; color: ${view eq 'results' ? '#4a9d6f' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'results' ? '#4a9d6f' : 'rgba(255,255,255,0.65)'}">Results & Earnings</span>
        </a>
    </jsp:attribute>

    <jsp:body>
        <!-- Alerts block -->
        <c:if test="${not empty requestScope.message}">
            <div class="mb-4 p-3 rounded-lg border text-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                <span>${requestScope.message}</span>
            </div>
        </c:if>
        <c:if test="${not empty requestScope.error}">
            <div class="mb-4 p-3 rounded-lg border text-sm bg-red-500/10 border-red-500/20 text-red-400 flex items-center gap-2">
                <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
                <span>${requestScope.error}</span>
            </div>
        </c:if>

        <c:choose>
            <%-- VIEW: HUB --%>
            <c:when test="${view eq 'hub'}">
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Available Race Meetings</h3>
                        <p class="text-xs text-muted-foreground">Register your stable for upcoming race day events to participate in races.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <c:forEach var="meeting" items="${meetings}">
                            <div class="rounded-xl border p-5 flex flex-col justify-between" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08);">
                                <div>
                                    <div class="flex justify-between items-start gap-3 mb-2">
                                        <h4 class="font-bold text-[#f4f2ec] text-base">${meeting.name}</h4>
                                        <c:choose>
                                            <c:when test="${registeredMeetingIds.contains(meeting.id)}">
                                                <c:set var="status" value="${regStatuses.get(meeting.id)}" />
                                                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${status eq 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (status eq 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}">
                                                    ${status}
                                                </span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                                    UNREGISTERED
                                                </span>
                                            </c:otherwise>
                                        </c:choose>
                                    </div>
                                    <div class="space-y-1.5 text-xs text-muted-foreground mb-4">
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="calendar" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Date: <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm" /></span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Venue: ${meeting.venue}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="award" class="w-3.5 h-3.5 text-primary"></i>
                                            <span>Purse Budget: $<fmt:formatNumber value="${meeting.totalBudget}" pattern="#,##0" /></span>
                                        </div>
                                    </div>
                                </div>

                                <c:if test="${!registeredMeetingIds.contains(meeting.id)}">
                                    <form action="${pageContext.request.contextPath}/MainController" method="POST" class="m-0 mt-3 space-y-3">
                                        <input type="hidden" name="action" value="registerOwner" />
                                        <input type="hidden" name="raceMeetingId" value="${meeting.id}" />
                                        
                                        <div>
                                            <label class="block text-xs font-semibold text-muted-foreground mb-1">Select Horses to Register:</label>
                                            <div class="space-y-1 max-h-24 overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/20">
                                                <c:forEach var="horse" items="${activeHorses}">
                                                    <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary">
                                                        <input type="checkbox" name="horseIds" value="${horse.id}" class="rounded border-gray-600 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent" />
                                                        <span>${horse.name} (Rating: ${horse.currentRating})</span>
                                                    </label>
                                                </c:forEach>
                                                <c:if test="${empty activeHorses}">
                                                    <p class="text-[11px] text-muted-foreground italic">No active horses in stable.</p>
                                                </c:if>
                                            </div>
                                        </div>
                                        
                                        <button type="submit" <c:if test="${empty activeHorses}">disabled</c:if> class="w-full py-2 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                                            <i data-lucide="user-plus" class="w-4 h-4"></i>
                                            Register for Event
                                        </button>
                                    </form>
                                </c:if>
                                <c:if test="${registeredMeetingIds.contains(meeting.id)}">
                                    <div class="mt-3 space-y-2 border-t border-white/5 pt-3">
                                        <p class="text-xs font-semibold text-muted-foreground">Registered Horses:</p>
                                        <div class="space-y-1.5">
                                            <c:forEach var="hReg" items="${meetingRegisteredHorses.get(meeting.id)}">
                                                <div class="flex justify-between items-center bg-white/[0.02] px-2.5 py-1.5 rounded border border-white/[0.04]">
                                                    <span class="text-xs font-medium text-foreground">${hReg.horse.name}</span>
                                                    <span class="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${hReg.status eq 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (hReg.status eq 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}">
                                                        ${hReg.status}
                                                    </span>
                                                </div>
                                            </c:forEach>
                                            <c:if test="${empty meetingRegisteredHorses.get(meeting.id)}">
                                                <p class="text-[11px] text-muted-foreground italic">No horses registered.</p>
                                            </c:if>
                                        </div>
                                        
                                        <!-- Register additional horses form -->
                                        <c:if test="${not empty meetingUnregisteredHorses.get(meeting.id)}">
                                            <div class="pt-2">
                                                <form action="${pageContext.request.contextPath}/MainController" method="POST" class="m-0 space-y-2">
                                                    <input type="hidden" name="action" value="registerAdditionalHorses" />
                                                    <input type="hidden" name="raceMeetingId" value="${meeting.id}" />
                                                    
                                                    <div class="space-y-1">
                                                        <label class="block text-[10px] font-semibold text-muted-foreground uppercase">Register Additional Horses:</label>
                                                        <div class="space-y-1 max-h-24 overflow-y-auto border border-white/10 rounded-lg p-2 bg-black/20">
                                                            <c:forEach var="horse" items="${meetingUnregisteredHorses.get(meeting.id)}">
                                                                <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary">
                                                                    <input type="checkbox" name="horseIds" value="${horse.id}" class="rounded border-gray-600 text-primary focus:ring-primary focus:ring-offset-0 bg-transparent" />
                                                                    <span>${horse.name} (Rating: ${horse.currentRating})</span>
                                                                </label>
                                                            </c:forEach>
                                                        </div>
                                                    </div>
                                                    
                                                    <button type="submit" class="w-full py-1.5 bg-white/5 hover:bg-white/10 text-foreground text-[11px] font-bold rounded transition-colors flex items-center justify-center gap-1 border border-white/10">
                                                        <i data-lucide="plus" class="w-3.5 h-3.5 text-primary"></i>
                                                        Submit Additional Horses
                                                    </button>
                                                </form>
                                            </div>
                                        </c:if>
                                    </div>
                                </c:if>
                            </div>
                        </c:forEach>
                        <c:if test="${empty meetings}">
                            <div class="col-span-2 rounded-xl border p-8 text-center text-muted-foreground border-border bg-card/20">
                                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                <p class="text-sm">No upcoming race meetings scheduled.</p>
                            </div>
                        </c:if>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: STABLE --%>
            <c:when test="${view eq 'stable'}">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Horse list -->
                    <div class="lg:col-span-2 space-y-4">
                        <div>
                            <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">My Stable</h3>
                            <p class="text-xs text-muted-foreground">List of all active horses owned by your stable.</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <c:forEach var="hMap" items="${stableHorses}">
                                <c:set var="horse" value="${hMap.horse}" />
                                <fmt:formatDate value="${horse.dateOfBirth}" pattern="dd/MM/yyyy" var="formattedDob" />
                                <div class="rounded-xl border p-4 flex flex-col justify-between" style="background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08);">
                                    <div>
                                        <div class="flex justify-between items-start mb-2">
                                            <h4 class="font-bold text-[#f4f2ec] text-base">${horse.name}</h4>
                                            <c:choose>
                                                <c:when test="${horse.status eq 'ACTIVE'}">
                                                    <span class="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                                                        ${horse.status}
                                                    </span>
                                                </c:when>
                                                <c:when test="${horse.status eq 'PENDING'}">
                                                    <span class="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                                                        ${horse.status}
                                                    </span>
                                                </c:when>
                                                <c:when test="${horse.status eq 'REJECTED'}">
                                                    <span class="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                                                        ${horse.status}
                                                    </span>
                                                </c:when>
                                                <c:otherwise>
                                                    <span class="text-[10px] font-mono bg-white/10 text-white/60 border border-white/20 px-2 py-0.5 rounded">
                                                        ${horse.status}
                                                    </span>
                                                </c:otherwise>
                                            </c:choose>
                                        </div>
                                        <div class="space-y-1 text-xs text-muted-foreground">
                                            <p>Breed: <span class="text-foreground">${horse.breed}</span></p>
                                            <p>DOB: <span class="text-foreground"><fmt:formatDate value="${horse.dateOfBirth}" pattern="dd/MM/yyyy" /></span></p>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-center">
                                        <div>
                                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Rating</p>
                                            <p class="text-base font-bold text-primary" id="rating-val-${horse.id}">${horse.currentRating}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Races</p>
                                            <p class="text-base font-bold text-foreground" id="races-val-${horse.id}">${hMap.totalRaces}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-mono text-muted-foreground uppercase">Wins</p>
                                            <p class="text-base font-bold text-emerald-400" id="wins-val-${horse.id}">${hMap.totalWins}</p>
                                        </div>
                                    </div>

                                    <!-- Quick actions: Edit details and View history -->
                                    <div class="mt-4 pt-3 border-t border-white/5 flex gap-2">
                                        <button type="button" 
                                                data-id="${horse.id}"
                                                data-name="<c:out value='${horse.name}' />"
                                                data-breed="<c:out value='${horse.breed}' />"
                                                data-dob="${formattedDob}"
                                                onclick="initEditModal(this)"
                                                class="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[#f4f2ec] text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1">
                                            <i data-lucide="edit" class="w-3.5 h-3.5 text-primary"></i>
                                            Edit
                                        </button>
                                        <button type="button" 
                                                data-id="${horse.id}"
                                                data-name="<c:out value='${horse.name}' />"
                                                onclick="loadAndOpenHistoryModal(this)"
                                                class="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[#f4f2ec] text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1">
                                            <i data-lucide="line-chart" class="w-3.5 h-3.5 text-primary"></i>
                                            History
                                        </button>
                                    </div>
                                </div>
                            </c:forEach>
                            <c:if test="${empty stableHorses}">
                                <div class="col-span-2 rounded-xl border p-8 text-center text-muted-foreground border-border bg-card/20">
                                    <i data-lucide="horse" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                                    <p class="text-sm">No horses registered yet. Use the form to add one.</p>
                                </div>
                            </c:if>
                        </div>
                    </div>

                    <!-- Add Horse Form -->
                    <div class="space-y-4">
                        <div class="rounded-xl border p-5 bg-[#151310]/60" style="border-color: rgba(74,157,111,0.14)">
                            <h3 class="text-lg font-bold text-[#f4f2ec] mb-3 flex items-center gap-1.5">
                                <i data-lucide="plus-circle" class="text-primary w-5 h-5"></i>
                                Add Horse to Stable
                            </h3>
                            <form action="${pageContext.request.contextPath}/MainController" method="POST" class="space-y-4 m-0">
                                <input type="hidden" name="action" value="addHorseToStable" />
                                
                                <div>
                                    <label class="block text-xs font-medium text-muted-foreground mb-1">Horse Name *</label>
                                    <input type="text" name="name" required placeholder="e.g. Thunder King" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-muted-foreground mb-1">Breed</label>
                                    <input type="text" name="breed" placeholder="e.g. Thoroughbred" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                </div>

                                <div>
                                    <label class="block text-xs font-medium text-muted-foreground mb-1">Date of Birth *</label>
                                    <input type="text" name="dateOfBirth" required placeholder="dd/MM/yyyy" class="date-picker w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                                </div>

                                <button type="submit" class="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                    <i data-lucide="save" class="w-4 h-4"></i>
                                    Register Horse
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: CALENDAR --%>
            <c:when test="${view eq 'calendar'}">
                <div class="space-y-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Race Calendar</h3>
                            <p class="text-xs text-muted-foreground">Select a race to invite an approved jockey. You must be registered for the meeting.</p>
                        </div>
                        <div class="w-full md:w-64 bg-[#151310]/60 p-3 rounded-lg border border-white/5">
                            <form action="${pageContext.request.contextPath}/HorseOwnerController" method="GET" class="m-0">
                                <input type="hidden" name="view" value="calendar" />
                                <label class="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Filter by Season</label>
                                <select name="seasonFilter" onchange="this.form.submit()" class="w-full bg-[#1e1c18] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#f4f2ec] focus:outline-none focus:border-[#4a9d6f] cursor-pointer">
                                    <option value="">-- All Seasons --</option>
                                    <c:forEach var="season" items="${seasons}">
                                        <option value="${season.id}" ${selectedSeasonId == season.id ? 'selected' : ''}>
                                            ${season.name} (${season.status})
                                        </option>
                                    </c:forEach>
                                </select>
                            </form>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <c:forEach var="meeting" items="${meetings}">
                            <div class="rounded-xl border overflow-hidden" style="background: rgba(255,255,255,0.01); border-color: rgba(255,255,255,0.06);">
                                <!-- Meeting Header -->
                                <div class="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h4 class="font-bold text-[#f4f2ec] text-base">${meeting.name}</h4>
                                        <p class="text-[11px] text-muted-foreground mt-0.5">
                                            Date: <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm" /> &middot; Venue: ${meeting.venue}
                                        </p>
                                    </div>
                                    <c:choose>
                                        <c:when test="${registeredMeetingIds.contains(meeting.id)}">
                                            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Event Registration Approved
                                            </span>
                                        </c:when>
                                        <c:otherwise>
                                            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                                Event Registration Required
                                            </span>
                                        </c:otherwise>
                                    </c:choose>
                                </div>

                                <!-- Races List -->
                                <div class="divide-y divide-white/5">
                                    <c:set var="hasRaces" value="false" />
                                    <c:forEach var="race" items="${races}">
                                        <c:if test="${race.raceMeetingId == meeting.id}">
                                            <c:set var="hasRaces" value="true" />
                                            <div class="p-5 flex flex-col lg:flex-row justify-between gap-6">
                                                <div class="space-y-2 flex-1">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-sm font-bold text-[#f4f2ec]">${race.classLevel}</span>
                                                        <span class="text-[10px] font-mono bg-[#c9a227]/10 text-primary border border-[#c9a227]/20 px-2 py-0.5 rounded">
                                                            ${race.status}
                                                        </span>
                                                    </div>
                                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Start Time</p>
                                                            <p class="font-semibold text-foreground"><fmt:formatDate value="${race.startTime}" pattern="dd/MM/yyyy HH:mm" /></p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Distance & Track</p>
                                                            <p class="font-semibold text-foreground">${race.distanceMeters}m (${race.trackType})</p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Rating limits</p>
                                                            <p class="font-semibold text-foreground">
                                                                ${race.minRating != null ? race.minRating : '0'} - ${race.maxRating != null ? race.maxRating : '∞'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p class="font-mono text-[10px] uppercase">Purse</p>
                                                            <p class="font-semibold text-emerald-400 font-mono">$<fmt:formatNumber value="${race.purse}" pattern="#,##0" /></p>
                                                        </div>                                                    </div>
                                                    <div class="mt-2.5 text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono">
                                                        <span><strong class="text-[#c9a227]/80">Entries Open:</strong> <fmt:formatDate value="${race.registrationStartTime}" pattern="dd/MM/yyyy HH:mm" /></span>
                                                        <span><strong class="text-[#c9a227]/80">Declarations Close:</strong> <fmt:formatDate value="${race.registrationEndTime}" pattern="dd/MM/yyyy HH:mm" /></span>
                                                    </div>
                                                </div>
 
                                                <!-- Invitation Panel -->
                                                <c:if test="${registeredMeetingIds.contains(meeting.id)}">
                                                    <div class="w-full lg:w-72 pt-4 lg:pt-0 lg:pl-6 lg:border-l border-white/5 flex flex-col justify-center">
                                                        <c:choose>
                                                            <c:when test="${race.status eq 'DECLARATION_OPEN'}">
                                                                <form action="${pageContext.request.contextPath}/MainController" method="POST" class="space-y-2 m-0">
                                                                    <input type="hidden" name="action" value="inviteJockey" />
                                                                    <input type="hidden" name="raceId" value="${race.id}" />
 
                                                                    <div>
                                                                        <select name="horseId" required class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none">
                                                                            <option value="">-- Select Horse --</option>
                                                                            <c:forEach var="horse" items="${meetingHorses.get(meeting.id)}">
                                                                                <c:set var="minRatingOk" value="${race.minRating == null || horse.currentRating >= race.minRating}" />
                                                                                <c:set var="maxRatingOk" value="${race.maxRating == null || horse.currentRating <= race.maxRating}" />
                                                                                <c:if test="${minRatingOk && maxRatingOk}">
                                                                                    <option value="${horse.id}">${horse.name} (Rating: ${horse.currentRating})</option>
                                                                                </c:if>
                                                                            </c:forEach>
                                                                        </select>
                                                                    </div>
 
                                                                    <div>
                                                                        <select name="jockeyId" required class="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none">
                                                                            <option value="">-- Select Jockey --</option>
                                                                            <c:forEach var="jockey" items="${meetingJockeys.get(meeting.id)}">
                                                                                <option value="${jockey.id}">${jockey.username} (${jockey.weight}kg)</option>
                                                                            </c:forEach>
                                                                        </select>
                                                                    </div>
 
                                                                    <button type="submit" class="w-full py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] font-bold rounded transition-colors flex items-center justify-center gap-1">
                                                                        <i data-lucide="send" class="w-3.5 h-3.5"></i>
                                                                        Send Invitation
                                                                    </button>
                                                                </form>
                                                            </c:when>
                                                            <c:when test="${race.status eq 'SCHEDULED'}">
                                                                <span class="text-[11px] text-zinc-400 italic text-center block py-3 border border-dashed border-white/5 rounded bg-white/[0.01]">
                                                                    Registration opens at: <br/>
                                                                    <span class="font-mono text-amber-500 font-bold"><fmt:formatDate value="${race.registrationStartTime}" pattern="dd/MM/yyyy HH:mm" /></span>
                                                                </span>
                                                            </c:when>
                                                            <c:otherwise>
                                                                <span class="text-xs text-muted-foreground italic text-center block py-3">
                                                                    Declarations closed for this race.
                                                                </span>
                                                            </c:otherwise>
                                                        </c:choose>
                                                    </div>
                                                 </c:if>
                                             </div>
                                        </c:if>
                                    </c:forEach>
                                    <c:if test="${!hasRaces}">
                                        <div class="p-6 text-center text-xs text-muted-foreground">
                                            No races scheduled for this meeting event yet.
                                        </div>
                                    </c:if>
                                </div>
                            </div>
                        </c:forEach>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: INVITATIONS --%>
            <c:when test="${view eq 'invitations'}">
                <div class="space-y-4">
                    <div>
                        <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Sent Invitations</h3>
                        <p class="text-xs text-muted-foreground">Manage and track invitations sent to jockeys for various races.</p>
                    </div>

                    <div class="rounded-xl border overflow-x-auto" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01);">
                        <table class="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr class="border-b" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02)">
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">ID</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Meeting</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Race</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Horse</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Jockey</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <c:forEach var="inv" items="${invitations}">
                                    <tr>
                                        <td class="px-5 py-3.5 font-mono text-muted-foreground">#${inv.id}</td>
                                        <td class="px-5 py-3.5 font-medium text-foreground">${inv.meetingName}</td>
                                        <td class="px-5 py-3.5 text-muted-foreground">
                                            ${inv.classLevel} &middot; <fmt:formatDate value="${inv.startTime}" pattern="dd/MM/yyyy HH:mm" />
                                        </td>
                                        <td class="px-5 py-3.5 font-semibold text-foreground">${inv.horseName}</td>
                                        <td class="px-5 py-3.5 text-foreground">${inv.jockeyName}</td>
                                        <td class="px-5 py-3.5">
                                            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${inv.status eq 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (inv.status eq 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}">
                                                ${inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                </c:forEach>
                                <c:if test="${empty invitations}">
                                    <tr>
                                        <td colspan="6" class="px-5 py-8 text-center text-muted-foreground">
                                            No invitations have been sent yet.
                                        </td>
                                    </tr>
                                </c:if>
                            </tbody>
                        </table>
                    </div>
                </div>
            </c:when>

            <%-- VIEW: RESULTS & EARNINGS --%>
            <c:when test="${view eq 'results'}">
                <div class="space-y-6">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-[#f4f2ec] mb-1">Results & Earnings</h3>
                            <p class="text-xs text-muted-foreground">Comprehensive record of all finished races and prize money won by your stable.</p>
                        </div>
                        <div class="rounded-xl border px-4 py-3 bg-[#151310]/60 border-primary/20 flex items-center gap-3">
                            <i data-lucide="banknote" class="text-primary w-5 h-5"></i>
                            <div>
                                <p class="text-[10px] font-mono text-muted-foreground uppercase">Total Stable Earnings</p>
                                <p class="text-lg font-bold text-emerald-400 font-mono">$<fmt:formatNumber value="${totalEarnings}" pattern="#,##0" /></p>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-xl border overflow-x-auto" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01);">
                        <table class="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr class="border-b" style="border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.02)">
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Date</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Meeting</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Race Class</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Horse</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Pos</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Finish Time</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Rating Adj</th>
                                    <th class="px-5 py-3 font-mono uppercase tracking-wider text-muted-foreground">Prize</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <c:forEach var="res" items="${ownerResults}">
                                    <tr>
                                        <td class="px-5 py-3.5 text-muted-foreground">
                                            <fmt:formatDate value="${res.startTime}" pattern="dd/MM/yyyy HH:mm" />
                                        </td>
                                        <td class="px-5 py-3.5 font-medium text-foreground">${res.meetingName}</td>
                                        <td class="px-5 py-3.5 text-muted-foreground">${res.classLevel}</td>
                                        <td class="px-5 py-3.5 font-semibold text-[#f4f2ec]">${res.horseName}</td>
                                        <td class="px-5 py-3.5">
                                            <span class="px-2 py-0.5 rounded font-bold ${res.position == 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-[#f4f2ec]'}">
                                                ${res.position}
                                            </span>
                                        </td>
                                        <td class="px-5 py-3.5 font-mono text-muted-foreground">${not empty res.time ? res.time : 'N/A'}</td>
                                        <td class="px-5 py-3.5 font-mono ${res.adjustment > 0 ? 'text-emerald-400' : (res.adjustment < 0 ? 'text-red-400' : 'text-muted-foreground')}">
                                            ${res.adjustment > 0 ? '+' : ''}${res.adjustment}
                                        </td>
                                        <td class="px-5 py-3.5 text-emerald-400 font-mono font-semibold">$<fmt:formatNumber value="${res.prize}" pattern="#,##0" /></td>
                                    </tr>
                                </c:forEach>
                                <c:if test="${empty ownerResults}">
                                    <tr>
                                        <td colspan="8" class="px-5 py-8 text-center text-muted-foreground">
                                            No race results recorded yet.
                                        </td>
                                    </tr>
                                </c:if>
                            </tbody>
                        </table>
                    </div>
                </div>
            </c:when>
        </c:choose>

        <!-- Modals -->
        <!-- Edit Horse Modal -->
        <div id="editHorseModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
            <div class="bg-[#151310] border border-border p-6 rounded-xl w-full max-w-md" style="border-color: rgba(74,157,111,0.2)">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-[#f4f2ec] flex items-center gap-1.5">
                        <i data-lucide="edit" class="text-primary w-5 h-5"></i>
                        Edit Horse Details
                    </h3>
                    <button onclick="closeEditModal()" class="text-muted-foreground hover:text-foreground">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <form action="${pageContext.request.contextPath}/MainController" method="POST" class="space-y-4 m-0">
                    <input type="hidden" name="action" value="updateHorse" />
                    <input type="hidden" name="id" id="editHorseId" />
                    
                    <div>
                        <label class="block text-xs font-medium text-muted-foreground mb-1">Horse Name *</label>
                        <input type="text" name="name" id="editHorseName" required class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-muted-foreground mb-1">Breed</label>
                        <input type="text" name="breed" id="editHorseBreed" class="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>

                    <div>
                        <label class="block text-xs font-medium text-muted-foreground mb-1">Date of Birth *</label>
                        <input type="text" name="dateOfBirth" id="editHorseDOB" required placeholder="dd/MM/yyyy" class="date-picker w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button type="button" onclick="closeEditModal()" class="flex-1 py-2 bg-white/5 hover:bg-white/10 text-foreground text-sm font-bold rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="flex-1 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-bold rounded-lg transition-colors">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- History Modal -->
        <div id="historyModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden">
            <div class="bg-[#151310] border border-border p-6 rounded-xl w-full max-w-3xl" style="border-color: rgba(74,157,111,0.2)">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-[#f4f2ec] flex items-center gap-1.5" id="historyModalTitle">
                        <i data-lucide="line-chart" class="text-primary w-5 h-5"></i>
                        Horse Performance History
                    </h3>
                    <button onclick="closeHistoryModal()" class="text-muted-foreground hover:text-foreground">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <!-- Summary Metrics inside modal -->
                <div class="grid grid-cols-4 gap-4 mb-4 text-center">
                    <div class="bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <p class="text-[9px] font-mono text-muted-foreground uppercase">Total Races</p>
                        <p id="modalTotalRaces" class="text-base font-bold text-foreground">-</p>
                    </div>
                    <div class="bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <p class="text-[9px] font-mono text-muted-foreground uppercase">Total Wins</p>
                        <p id="modalTotalWins" class="text-base font-bold text-emerald-400">-</p>
                    </div>
                    <div class="bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <p class="text-[9px] font-mono text-muted-foreground uppercase">Avg Position</p>
                        <p id="modalAvgPosition" class="text-base font-bold text-primary">-</p>
                    </div>
                    <div class="bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <p class="text-[9px] font-mono text-muted-foreground uppercase">Total Earnings</p>
                        <p id="modalTotalPrize" class="text-base font-bold text-emerald-400 font-mono">-</p>
                    </div>
                </div>

                <div class="overflow-y-auto max-h-[300px] border border-white/5 rounded-lg">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-white/10 text-muted-foreground" style="background: rgba(255,255,255,0.02)">
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Date</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Meeting</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Class</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Position</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Finish Time</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Prize</th>
                                <th class="px-4 py-2 font-mono uppercase tracking-wider">Rating Adj</th>
                            </tr>
                        </thead>
                        <tbody id="historyModalBody" class="divide-y divide-white/5 text-[#f4f2ec]">
                            <!-- Dynamic rows -->
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end pt-4">
                    <button onclick="closeHistoryModal()" class="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground text-sm font-bold rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>

        <script>
            function initEditModal(btn) {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                const breed = btn.getAttribute('data-breed');
                const dob = btn.getAttribute('data-dob');
                
                document.getElementById('editHorseId').value = id;
                document.getElementById('editHorseName').value = name;
                document.getElementById('editHorseBreed').value = breed;
                document.getElementById('editHorseDOB').value = dob;
                
                document.getElementById('editHorseModal').classList.remove('hidden');
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }

            function closeEditModal() {
                document.getElementById('editHorseModal').classList.add('hidden');
            }

            function loadAndOpenHistoryModal(btn) {
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                
                // Set modal title and initial loading state
                document.getElementById('historyModalTitle').innerHTML = '<i data-lucide="line-chart" class="text-primary w-5 h-5"></i> ' + name + ' - Performance Profile';
                document.getElementById('modalTotalRaces').innerText = "...";
                document.getElementById('modalTotalWins').innerText = "...";
                document.getElementById('modalAvgPosition').innerText = "...";
                document.getElementById('modalTotalPrize').innerText = "...";

                const tbody = document.getElementById('historyModalBody');
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-muted-foreground"><div class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2"></div>Loading history from database...</td></tr>';
                document.getElementById('historyModal').classList.remove('hidden');
                if (window.lucide) {
                    window.lucide.createIcons();
                }

                // Fetch latest data from database using AJAX
                fetch('${pageContext.request.contextPath}/HorseOwnerController?action=getHorseHistory&horseId=' + id)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Update modal stats
                            const horse = data.horse;
                            document.getElementById('modalTotalRaces').innerText = horse.totalRaces;
                            document.getElementById('modalTotalWins').innerText = horse.totalWins;
                            document.getElementById('modalAvgPosition').innerText = parseFloat(horse.avgPosition).toFixed(1);
                            document.getElementById('modalTotalPrize').innerText = '$' + parseFloat(horse.totalPrize).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});

                            // Update stable card values in the background to show the fresh data
                            const ratingEl = document.getElementById('rating-val-' + id);
                            const racesEl = document.getElementById('races-val-' + id);
                            const winsEl = document.getElementById('wins-val-' + id);
                            if (ratingEl) ratingEl.innerText = horse.currentRating;
                            if (racesEl) racesEl.innerText = horse.totalRaces;
                            if (winsEl) winsEl.innerText = horse.totalWins;

                            // Populate history table
                            tbody.innerHTML = '';
                            if (!data.history || data.history.length === 0) {
                                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-muted-foreground italic">No race history recorded for this horse.</td></tr>';
                            } else {
                                data.history.forEach(item => {
                                    const prizeVal = parseFloat(item.prize) || 0;
                                    const prizeText = '$' + prizeVal.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                                    
                                    const adjVal = parseInt(item.adjustment) || 0;
                                    const adjText = (adjVal > 0 ? '+' : '') + adjVal;

                                    const tr = document.createElement('tr');
                                    tr.innerHTML = `
                                        <td class="px-4 py-2.5 text-muted-foreground">\${item.startTime}</td>
                                        <td class="px-4 py-2.5 font-semibold">\${item.meetingName}</td>
                                        <td class="px-4 py-2.5">\${item.classLevel}</td>
                                        <td class="px-4 py-2.5">
                                            <span class="px-1.5 py-0.5 rounded font-bold \${item.position === 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-[#f4f2ec]'}">
                                                \${item.position}
                                            </span>
                                        </td>
                                        <td class="px-4 py-2.5 font-mono text-muted-foreground">\${item.time || 'N/A'}</td>
                                        <td class="px-4 py-2.5 text-emerald-400 font-mono font-semibold">\${prizeText}</td>
                                        <td class="px-4 py-2.5 font-mono \${adjVal > 0 ? 'text-emerald-400' : (adjVal < 0 ? 'text-red-400' : 'text-muted-foreground')}">\${adjText}</td>
                                    `;
                                    tbody.appendChild(tr);
                                });
                            }
                        } else {
                            tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-center text-red-400 italic">Error: \${data.message || 'Failed to load history'}</td></tr>`;
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-6 text-center text-red-400 italic">Failed to connect to the server.</td></tr>';
                    });
            }

            function closeHistoryModal() {
                document.getElementById('historyModal').classList.add('hidden');
            }
        </script>
    </jsp:body>
</t:dashboardLayout>

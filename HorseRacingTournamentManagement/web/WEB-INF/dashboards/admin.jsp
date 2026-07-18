<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<c:set var="view" value="${not empty currentView ? currentView : (empty param.view ? 'live' : param.view)}" />
<c:set var="activeLabel" value="Dashboard" />
<c:choose>
    <c:when test="${view eq 'live'}"><c:set var="activeLabel" value="Dashboard Overview" /></c:when>
    <c:when test="${view eq 'season'}"><c:set var="activeLabel" value="Season Initialization" /></c:when>
    <c:when test="${view eq 'race-meeting'}"><c:set var="activeLabel" value="Race Meeting Management" /></c:when>
    <c:when test="${view eq 'race'}"><c:set var="activeLabel" value="Race Configuration" /></c:when>
    <c:when test="${view eq 'processing'}"><c:set var="activeLabel" value="Registration Processing" /></c:when>
    <c:when test="${view eq 'racecard'}"><c:set var="activeLabel" value="Racecard Management" /></c:when>
    <c:when test="${view eq 'schedule'}"><c:set var="activeLabel" value="Race Day Schedule" /></c:when>
    <c:when test="${view eq 'results'}"><c:set var="activeLabel" value="Process Results & Close" /></c:when>
    <c:when test="${view eq 'users'}"><c:set var="activeLabel" value="User & Role Management" /></c:when>
    <c:when test="${view eq 'config'}"><c:set var="activeLabel" value="System Configuration" /></c:when>
    <c:when test="${view eq 'live-settings'}"><c:set var="activeLabel" value="Live Setting" /></c:when>
</c:choose>

<t:dashboardLayout 
    roleLabel="Administrator" 
    roleColor="#c9a227" 
    userName="${not empty sessionScope.user.username ? sessionScope.user.username : 'Eleanor Vance'}" 
    activeLabel="${activeLabel}"
    profileActive="${view eq 'profile'}">
    
    <jsp:attribute name="navItems">
        <!-- Workflow -->
        <a href="${pageContext.request.contextPath}/AdminUserController?view=live" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'live' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'live' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'live' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">01</span>
            <i data-lucide="layout-dashboard" style="width: 14px; height: 14px; color: ${view eq 'live' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'live' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Dashboard Overview</span>
        </a>
        <a href="${pageContext.request.contextPath}/SeasonController" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'season' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'season' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'season' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">02</span>
            <i data-lucide="layers" style="width: 14px; height: 14px; color: ${view eq 'season' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'season' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Season Initialization</span>
        </a>
        <a href="${pageContext.request.contextPath}/AdminUserController?view=race-meeting" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'race-meeting' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'race-meeting' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'race-meeting' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">03</span>
            <i data-lucide="calendar" style="width: 14px; height: 14px; color: ${view eq 'race-meeting' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'race-meeting' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Race Meeting Management</span>
        </a>
        <a href="${pageContext.request.contextPath}/AdminUserController?view=race" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'race' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'race' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'race' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">04</span>
            <i data-lucide="flag" style="width: 14px; height: 14px; color: ${view eq 'race' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'race' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Race Configuration</span>
        </a>
        <a href="${pageContext.request.contextPath}/admin/registration-processing" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'processing' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'processing' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'processing' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">05</span>
            <i data-lucide="file-check" style="width: 14px; height: 14px; color: ${view eq 'processing' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'processing' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Registration Processing</span>
            <c:if test="${not empty totalPendingCount && totalPendingCount > 0}">
                <span class="bg-[#c9a227] text-[#0b0d11] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-2">${totalPendingCount}</span>
            </c:if>
        </a>
        <a href="${pageContext.request.contextPath}/AdminUserController?view=racecard" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'racecard' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'racecard' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'racecard' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">06</span>
            <i data-lucide="layout" style="width: 14px; height: 14px; color: ${view eq 'racecard' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'racecard' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Racecard Management</span>
        </a>
        <a href="${pageContext.request.contextPath}/RaceDayScheduleController" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'schedule' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'schedule' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'schedule' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">07</span>
            <i data-lucide="clipboard-list" style="width: 14px; height: 14px; color: ${view eq 'schedule' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'schedule' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Race Day Schedule</span>
        </a>
        <a href="${pageContext.request.contextPath}/ProcessResultsController" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'results' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'results' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'results' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">08</span>
            <i data-lucide="award" style="width: 14px; height: 14px; color: ${view eq 'results' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'results' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Process Results & Close</span>
        </a>
        <a href="${pageContext.request.contextPath}/AdminUserController?view=users" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'users' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'users' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'users' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">09</span>
            <i data-lucide="user-cog" style="width: 14px; height: 14px; color: ${view eq 'users' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'users' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">User & Role Management</span>
        </a>
        <a href="${pageContext.request.contextPath}/admin/system-config" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'config' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'config' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'config' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">10</span>
            <i data-lucide="settings" style="width: 14px; height: 14px; color: ${view eq 'config' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'config' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">System Configuration</span>
        </a>
        <a href="${pageContext.request.contextPath}/AdminUserController?view=live-settings" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'live-settings' ? '#c9a22718' : 'transparent'}; border-left: ${view eq 'live-settings' ? '2px solid #c9a227' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'live-settings' ? '#c9a227' : 'rgba(255,255,255,0.25)'}">11</span>
            <i data-lucide="tv" style="width: 14px; height: 14px; color: ${view eq 'live-settings' ? '#c9a227' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'live-settings' ? '#c9a227' : 'rgba(255,255,255,0.65)'}">Live Setting</span>
        </a>
    </jsp:attribute>

    <jsp:body>
    <c:choose>
        <c:when test="${view eq 'live'}">
            <jsp:include page="/WEB-INF/dashboards/components/AdminWelcome.jsp" />
        </c:when>
        
        <c:when test="${view eq 'season'}">
            <jsp:include page="/WEB-INF/admin-workflow/season.jsp" />
        </c:when>

        <c:when test="${view eq 'season-rules'}">
            <jsp:include page="/WEB-INF/admin-workflow/seasonRulesEdit.jsp" />
        </c:when>

        <c:when test="${view eq 'race-meeting'}">
            <jsp:include page="/WEB-INF/admin-workflow/raceMeeting.jsp" />
        </c:when>

        <c:when test="${view eq 'race'}">
            <jsp:include page="/WEB-INF/admin-workflow/race.jsp" />
        </c:when>

        <c:when test="${view eq 'processing'}">
            <jsp:include page="/WEB-INF/admin-workflow/registrationProcessing.jsp" />
        </c:when>

        <c:when test="${view eq 'schedule'}">
            <jsp:include page="/WEB-INF/admin-workflow/raceDaySchedule.jsp" />
        </c:when>
        
        <c:when test="${view eq 'racecard'}">
            <jsp:include page="/WEB-INF/admin-workflow/racecard.jsp" />
        </c:when>

        <c:when test="${view eq 'results'}">
            <jsp:include page="/WEB-INF/admin-workflow/results.jsp" />
        </c:when>

        <c:when test="${view eq 'users'}">
            <jsp:include page="/WEB-INF/admin-workflow/users.jsp" />
        </c:when>

        <c:when test="${view eq 'config'}">
            <jsp:include page="/WEB-INF/admin-workflow/systemConfig.jsp" />
        </c:when>
        
        <c:when test="${view eq 'live-settings'}">
            <jsp:include page="/WEB-INF/admin-workflow/live-settings.jsp" />
        </c:when>
        
        <c:otherwise>
            <div class="rounded-xl border p-6" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
                <h3 class="font-bold text-lg mb-2">Welcome to the Admin Dashboard</h3>
                <p class="text-muted-foreground text-sm">Select a workflow item from the sidebar to begin.</p>
            </div>
        </c:otherwise>
    </c:choose>
</jsp:body>
</t:dashboardLayout>

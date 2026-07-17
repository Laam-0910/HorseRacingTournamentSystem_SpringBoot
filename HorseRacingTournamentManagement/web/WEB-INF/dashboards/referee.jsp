<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<c:set var="view" value="${empty currentView ? (empty param.view ? 'hub' : param.view) : currentView}" />
<c:set var="activeLabel" value="Referee Hub" />
<c:choose>
    <c:when test="${view eq 'hub'}"><c:set var="activeLabel" value="Referee Hub" /></c:when>
    <c:when test="${view eq 'check'}"><c:set var="activeLabel" value="Pre-Race Check" /></c:when>
    <c:when test="${view eq 'supervision'}"><c:set var="activeLabel" value="Race Supervision" /></c:when>
    <c:when test="${view eq 'confirm'}"><c:set var="activeLabel" value="Confirm Results" /></c:when>
    <c:when test="${view eq 'incidents'}"><c:set var="activeLabel" value="Recorded Incidents" /></c:when>
    <c:when test="${view eq 'duties'}"><c:set var="activeLabel" value="Assigned Duties" /></c:when>
</c:choose>

<t:dashboardLayout 
    roleLabel="Referee" 
    roleColor="#8b5cf6" 
    userName="${not empty sessionScope.user.username ? sessionScope.user.username : 'Inspector Hale'}" 
    activeLabel="${activeLabel}"
    profileActive="${view eq 'profile'}">
    
    <jsp:attribute name="navItems">
        <!-- Workflow -->
        <a href="${pageContext.request.contextPath}/RefereeController?view=hub" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'hub' ? '#8b5cf618' : 'transparent'}; border-left: ${view eq 'hub' ? '2px solid #8b5cf6' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'hub' ? '#8b5cf6' : 'rgba(255,255,255,0.25)'}">01</span>
            <i data-lucide="layout-dashboard" style="width: 14px; height: 14px; color: ${view eq 'hub' ? '#8b5cf6' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'hub' ? '#8b5cf6' : 'rgba(255,255,255,0.65)'}">Referee Hub</span>
        </a>
        <a href="${pageContext.request.contextPath}/RefereeController?view=incidents" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'incidents' ? '#8b5cf618' : 'transparent'}; border-left: ${view eq 'incidents' ? '2px solid #8b5cf6' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'incidents' ? '#8b5cf6' : 'rgba(255,255,255,0.25)'}">02</span>
            <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: ${view eq 'incidents' ? '#8b5cf6' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'incidents' ? '#8b5cf6' : 'rgba(255,255,255,0.65)'}">Incidents</span>
        </a>
        <a href="${pageContext.request.contextPath}/RefereeController?view=duties" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: ${view eq 'duties' ? '#8b5cf618' : 'transparent'}; border-left: ${view eq 'duties' ? '2px solid #8b5cf6' : '2px solid transparent'}">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: ${view eq 'duties' ? '#8b5cf6' : 'rgba(255,255,255,0.25)'}">03</span>
            <i data-lucide="clipboard-check" style="width: 14px; height: 14px; color: ${view eq 'duties' ? '#8b5cf6' : 'rgba(255,255,255,0.4)'};"></i>
            <span class="flex-1 text-xs truncate" style="color: ${view eq 'duties' ? '#8b5cf6' : 'rgba(255,255,255,0.65)'}">Duties</span>
            <c:if test="${not empty assignedRaces && assignedRaces.size() > 0}">
                <span class="bg-[#8b5cf6] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-2">${assignedRaces.size()}</span>
            </c:if>
        </a>
    </jsp:attribute>

    <jsp:body>
        <!-- Alerts -->
        <c:if test="${not empty success}">
            <div class="mb-4 p-4 text-sm rounded-lg bg-green-900/30 text-green-400 border border-green-800/50">
                ${success}
            </div>
        </c:if>
        <c:if test="${not empty error}">
            <div class="mb-4 p-4 text-sm rounded-lg bg-red-900/30 text-red-400 border border-red-800/50">
                ${error}
            </div>
        </c:if>

        <c:choose>
            <c:when test="${view eq 'hub'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeHub.jsp"/>
            </c:when>
            <c:when test="${view eq 'check'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeCheck.jsp"/>
            </c:when>
            <c:when test="${view eq 'supervision'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeSupervision.jsp"/>
            </c:when>
            <c:when test="${view eq 'confirm'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeConfirm.jsp"/>
            </c:when>
            <c:when test="${view eq 'incidents'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeIncidents.jsp"/>
            </c:when>
            <c:when test="${view eq 'duties'}">
                <jsp:include page="/WEB-INF/referee-workflow/refereeDuties.jsp"/>
            </c:when>
            <c:otherwise>
                <div class="rounded-xl border p-6 bg-card/30 border-border">
                    <h3 class="font-bold text-lg mb-2">Welcome to the Referee Dashboard</h3>
                    <p class="text-muted-foreground text-sm">Select a workflow item from the sidebar to begin.</p>
                </div>
            </c:otherwise>
        </c:choose>
    </jsp:body>
</t:dashboardLayout>

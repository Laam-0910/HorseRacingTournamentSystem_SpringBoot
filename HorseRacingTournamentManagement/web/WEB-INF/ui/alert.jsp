
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- Nhận tham số từ trang gọi tới --%>
<c:set var="variant" value="${empty param.variant ? 'default' : param.variant}" />
<c:set var="title" value="${param.title}" />
<c:set var="description" value="${param.description}" />
<c:set var="iconType" value="${param.iconType}" />
<c:set var="customClass" value="${param.customClass}" />

<%-- Xử lý Variant (Tương đương cva) --%>
<c:choose>
    <c:when test="${variant == 'destructive'}">
        <c:set var="variantClass" value="text-red-500 bg-red-500/10 border-red-500/50 *:data-[slot=alert-description]:text-red-400" />
    </c:when>
    <c:otherwise>
        <%-- Default --%>
        <c:set var="variantClass" value="bg-gray-900 border-gray-800 text-white *:data-[slot=alert-description]:text-gray-400" />
    </c:otherwise>
</c:choose>

<div 
    data-slot="alert" 
    role="alert" 
    class="relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[1rem_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current ${variantClass} ${customClass}"
>
    <c:if test="${not empty iconType}">
        <c:choose>
            <c:when test="${iconType == 'warning'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </c:when>
            <c:when test="${iconType == 'info'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </c:when>
        </c:choose>
    </c:if>

    <c:if test="${not empty title}">
        <div data-slot="alert-title" class="col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight">
            ${title}
        </div>
    </c:if>

    <c:if test="${not empty description}">
        <div data-slot="alert-description" class="col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed">
            ${description}
        </div>
    </c:if>
</div>
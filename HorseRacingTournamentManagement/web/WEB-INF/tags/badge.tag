<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="variant" required="false" type="java.lang.String" description="default, secondary, destructive, outline" %>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<c:set var="baseClass" value="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />

<c:choose>
    <c:when test="${variant == 'secondary'}">
        <c:set var="variantClass" value="border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80" />
    </c:when>
    <c:when test="${variant == 'destructive'}">
        <c:set var="variantClass" value="border-transparent bg-red-500 text-white hover:bg-red-500/80" />
    </c:when>
    <c:when test="${variant == 'outline'}">
        <c:set var="variantClass" value="text-foreground" />
    </c:when>
    <c:otherwise>
        <c:set var="variantClass" value="border-transparent bg-gray-900 text-white hover:bg-gray-900/80" />
    </c:otherwise>
</c:choose>

<div class="${baseClass} ${variantClass} ${customClass}">
    <jsp:doBody/>
</div>

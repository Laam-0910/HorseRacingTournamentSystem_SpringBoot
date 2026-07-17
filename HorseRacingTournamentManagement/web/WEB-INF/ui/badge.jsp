<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%@ attribute name="variant" required="false" type="java.lang.String" %>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<c:set var="currentVariant" value="${empty variant ? 'default' : variant}" />

<c:set var="baseClasses" value="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden" />

<c:choose>
    <c:when test="${currentVariant == 'secondary'}">
        <c:set var="variantClasses" value="border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90" />
    </c:when>
    <c:when test="${currentVariant == 'destructive'}">
        <c:set var="variantClasses" value="border-transparent bg-red-500 text-white [a&]:hover:bg-red-500/90 focus-visible:ring-red-500/20" />
    </c:when>
    <c:when test="${currentVariant == 'outline'}">
        <c:set var="variantClasses" value="text-white [a&]:hover:bg-gray-800" />
    </c:when>
    <c:otherwise>
        <c:set var="variantClasses" value="border-transparent bg-[#c9a227] text-[#0e0c09] [a&]:hover:bg-[#e3bd3f]" />
    </c:otherwise>
</c:choose>

<span data-slot="badge" class="${baseClasses} ${variantClasses} ${customClass}">
    <jsp:doBody/>
</span>
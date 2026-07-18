
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- Nhận tham số từ trang gọi tới --%>
<c:set var="imageUrl" value="${param.imageUrl}" />
<c:set var="altText" value="${empty param.altText ? 'Avatar' : param.altText}" />
<c:set var="fallbackText" value="${empty param.fallbackText ? '?' : param.fallbackText}" />
<%-- Default size là size-10 (w-10 h-10) giống component React gốc --%>
<c:set var="customClass" value="${empty param.customClass ? 'size-10' : param.customClass}" />

<div 
    data-slot="avatar" 
    class="relative flex shrink-0 overflow-hidden rounded-full ${customClass}"
>
    <c:choose>
        <%-- TRƯỜNG HỢP 1: CÓ TRUYỀN LINK ẢNH --%>
        <c:when test="${not empty imageUrl}">
            <img 
                data-slot="avatar-image" 
                src="${imageUrl}" 
                alt="${altText}" 
                class="aspect-square size-full object-cover"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div 
                data-slot="avatar-fallback" 
                class="bg-gray-700 text-white size-full items-center justify-center rounded-full text-sm font-bold"
                style="display: none;"
            >
                ${fallbackText}
            </div>
        </c:when>

        <%-- TRƯỜNG HỢP 2: KHÔNG CÓ LINK ẢNH -> CHỈ HIỆN CHỮ VIẾT TẮT --%>
        <c:otherwise>
            <div 
                data-slot="avatar-fallback" 
                class="bg-gray-700 text-white flex size-full items-center justify-center rounded-full text-sm font-bold"
            >
                ${fallbackText}
            </div>
        </c:otherwise>
    </c:choose>
</div>
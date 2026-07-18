<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%@ attribute name="ratio" required="false" type="java.lang.String" description="Ví dụ: 16/9, 4/3, 1" %>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<%-- Đặt giá trị mặc định nếu không truyền ratio --%>
<c:set var="ratioValue" value="${empty ratio ? '1 / 1' : ratio}" />

<div 
    data-slot="aspect-ratio" 
    class="relative w-full ${customClass}" 
    style="aspect-ratio: ${ratioValue};"
>
    <%-- jsp:doBody chính là {children} trong React, nó sẽ render bất cứ thứ gì được bọc bên trong --%>
    <jsp:doBody/>
</div>
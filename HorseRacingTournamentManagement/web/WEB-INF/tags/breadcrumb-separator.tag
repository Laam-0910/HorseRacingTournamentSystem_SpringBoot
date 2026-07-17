<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" class="[&>svg]:size-3.5 ${customClass}">
    <jsp:doBody/>
    <c:if test="${empty jspContext.body}">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5"><path d="m9 18 6-6-6-6"/></svg>
    </c:if>
</li>
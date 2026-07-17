<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<li data-slot="breadcrumb-item" class="inline-flex items-center gap-1.5 ${customClass}">
    <jsp:doBody/>
</li>
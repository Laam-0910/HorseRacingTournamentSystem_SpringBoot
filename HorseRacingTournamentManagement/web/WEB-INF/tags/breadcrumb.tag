<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<nav aria-label="breadcrumb" data-slot="breadcrumb" class="${customClass}">
    <jsp:doBody/>
</nav>
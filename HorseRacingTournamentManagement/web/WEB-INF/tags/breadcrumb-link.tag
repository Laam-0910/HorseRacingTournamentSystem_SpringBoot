<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="href" required="true" type="java.lang.String" %>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<a href="${href}" data-slot="breadcrumb-link" class="hover:text-white transition-colors ${customClass}">
    <jsp:doBody/>
</a>
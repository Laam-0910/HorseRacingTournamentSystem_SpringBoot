<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<ol data-slot="breadcrumb-list" class="text-gray-400 flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5 ${customClass}">
    <jsp:doBody/>
</ol>
<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" class="text-white font-normal ${customClass}">
    <jsp:doBody/>
</span>
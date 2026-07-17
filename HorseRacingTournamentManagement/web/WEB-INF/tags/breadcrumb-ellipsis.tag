<%@ tag language="java" pageEncoding="UTF-8"%>
<%@ attribute name="customClass" required="false" type="java.lang.String" %>

<span data-slot="breadcrumb-ellipsis" role="presentation" aria-hidden="true" class="flex size-9 items-center justify-center ${customClass}">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
    <span class="sr-only">More</span>
</span>

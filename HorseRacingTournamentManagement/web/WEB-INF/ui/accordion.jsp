<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>


<div class="w-full" data-slot="accordion">
    <c:forEach items="${faqList}" var="item" varStatus="loop">
        
        <div data-slot="accordion-item" class="border-b border-border last:border-b-0">
            <h3 class="flex m-0">
                <button 
                    type="button"
                    class="accordion-trigger focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-4 py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 w-full"
                    aria-expanded="false"
                    aria-controls="accordion-content-${loop.index}"
                >
                    ${item.title}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="accordion-icon text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </button>
            </h3>
            
            <div 
                id="accordion-content-${loop.index}"
                data-slot="accordion-content" 
                class="accordion-content overflow-hidden text-sm transition-all duration-200 ease-in-out max-h-0 opacity-0"
            >
                <div class="pb-4 pt-0">
                    ${item.content}
                </div>
            </div>
        </div>

    </c:forEach>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const triggers = document.querySelectorAll('.accordion-trigger');

        triggers.forEach(trigger => {
            trigger.addEventListener('click', function() {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                const contentId = this.getAttribute('aria-controls');
                const content = document.getElementById(contentId);
                const icon = this.querySelector('.accordion-icon');

                // Tùy chọn: Đóng tất cả các tab khác trước khi mở tab mới (Bỏ comment nếu muốn)
                /*
                triggers.forEach(t => {
                    if (t !== this) {
                        t.setAttribute('aria-expanded', 'false');
                        const otherContent = document.getElementById(t.getAttribute('aria-controls'));
                        const otherIcon = t.querySelector('.accordion-icon');
                        otherContent.style.maxHeight = '0px';
                        otherContent.style.opacity = '0';
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                });
                */

                if (isExpanded) {
                    // Đang mở -> Đóng lại
                    this.setAttribute('aria-expanded', 'false');
                    content.style.maxHeight = '0px';
                    content.style.opacity = '0';
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    // Đang đóng -> Mở ra
                    this.setAttribute('aria-expanded', 'true');
                    // Sử dụng scrollHeight để tự động điều chỉnh chiều cao mượt mà
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                    icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    });
</script>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<%-- Nhận tham số từ trang gọi tới --%>
<c:set var="dialogId" value="${param.dialogId}" />
<c:set var="title" value="${param.title}" />
<c:set var="description" value="${param.description}" />
<c:set var="cancelText" value="${empty param.cancelText ? 'Cancel' : param.cancelText}" />
<c:set var="actionText" value="${empty param.actionText ? 'Continue' : param.actionText}" />
<c:set var="actionUrl" value="${param.actionUrl}" />

<div 
    id="${dialogId}-overlay" 
    class="fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 opacity-0 pointer-events-none hidden"
></div>

<div 
    id="${dialogId}-content" 
    class="bg-gray-900 border-gray-800 text-white fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg transition-all opacity-0 scale-95 pointer-events-none hidden"
    role="alertdialog"
>
    <div class="flex flex-col gap-2 text-center sm:text-left">
        <h2 class="text-lg font-semibold">${title}</h2>
        <p class="text-gray-400 text-sm">${description}</p>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end mt-2">
        <button 
            type="button" 
            onclick="closeAlertDialog('${dialogId}')"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 border border-gray-700 bg-transparent hover:bg-gray-800 hover:text-white h-9 px-4 py-2"
        >
            ${cancelText}
        </button>
        
        <form action="${actionUrl}" method="POST" class="m-0">
            <button 
                type="submit" 
                class="inline-flex w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 bg-[#c9a227] text-[#0e0c09] hover:bg-[#e3bd3f] shadow h-9 px-4 py-2"
            >
                ${actionText}
            </button>
        </form>
    </div>
</div>

<script>
    // Hàm mở Dialog
    function openAlertDialog(id) {
        const overlay = document.getElementById(id + '-overlay');
        const content = document.getElementById(id + '-content');
        
        // Bỏ class hidden trước để phần tử xuất hiện trong DOM
        overlay.classList.remove('hidden');
        content.classList.remove('hidden');

        // Dùng setTimeout nhỏ để trình duyệt kịp render class hidden bị xóa trước khi chạy animation
        setTimeout(() => {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            content.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            content.classList.add('scale-100');
        }, 10);
    }

    // Hàm đóng Dialog
    function closeAlertDialog(id) {
        const overlay = document.getElementById(id + '-overlay');
        const content = document.getElementById(id + '-content');
        
        // Chạy animation fade-out và zoom-out
        overlay.classList.add('opacity-0', 'pointer-events-none');
        content.classList.remove('scale-100');
        content.classList.add('opacity-0', 'scale-95', 'pointer-events-none');

        // Đợi animation (duration-200 = 200ms) kết thúc rồi mới thêm class hidden
        setTimeout(() => {
            overlay.classList.add('hidden');
            content.classList.add('hidden');
        }, 200);
    }
</script>
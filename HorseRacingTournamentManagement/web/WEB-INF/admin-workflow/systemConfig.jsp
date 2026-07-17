<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="space-y-6">
    <!-- Alert message if present -->
    <c:if test="${not empty message}">
        <div class="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style="background-color: rgba(74,157,111,0.15); color: #4a9d6f; border: 1px solid rgba(74,157,111,0.3)">
            <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
            ${message}
        </div>
    </c:if>
    <c:if test="${not empty sessionScope.error}">
        <div class="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style="background-color: rgba(239,91,91,0.15); color: #ef5b5b; border: 1px solid rgba(239,91,91,0.3)">
            <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
            ${sessionScope.error}
        </div>
        <c:remove var="error" scope="session" />
    </c:if>

    <!-- Table Container / Form Block -->
    <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
            <div>
                <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">System Configurations</p>
                <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">
                    Update weights and thresholds for ranking and prediction formulas.
                </p>
            </div>
        </div>

        <!-- Form Content -->
        <div class="p-6">
            <form action="${pageContext.request.contextPath}/admin/system-config" method="POST" class="space-y-6">
                <div class="space-y-5">
                    <c:forEach var="config" items="${configs}">
                        <div class="grid grid-cols-12 gap-4 items-center hover:bg-white/[0.015] p-3 -mx-3 rounded-lg transition-colors border border-transparent hover:border-white/[0.02]">
                            <!-- Configuration Label and Description -->
                            <div class="col-span-12 md:col-span-5">
                                <div class="flex items-start gap-2.5">
                                    <div class="mt-0.5 p-1 rounded bg-[#c9a227]/10" style="color: #c9a227">
                                        <i data-lucide="sliders" style="width: 12px; height: 12px;"></i>
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-mono uppercase tracking-widest font-bold" style="color: #c9a227">
                                            ${config.configKey}
                                        </label>
                                        <p class="text-[9px] mt-0.5 uppercase tracking-wide" style="color: rgba(255,255,255,0.4)">
                                            ${config.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Input Field -->
                            <div class="col-span-12 md:col-span-7">
                                <input type="text" 
                                       name="${config.configKey}" 
                                       value="${config.configValue}" 
                                       required
                                       class="w-full rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#f4f2ec] outline-none transition-all focus:border-[#c9a227]"
                                       style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
                            </div>
                        </div>
                    </c:forEach>
                </div>

                <!-- Submit Buttons -->
                <div class="pt-6 border-t flex justify-end gap-3" style="border-color: rgba(201,162,39,0.10)">
                    <button type="submit" 
                            class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                            style="background: #c9a227; color: #0b0d11">
                        <i data-lucide="save" style="width: 13px; height: 13px;"></i>
                        Save Configurations
                    </button>
                </div>
            </form>
        </div>
        
        <!-- Footer Info -->
        <div class="px-6 py-3 border-t" style="border-color: rgba(201,162,39,0.10); background: rgba(255,255,255,0.012)">
            <p class="text-[10px] font-mono flex items-center gap-1.5" style="color: rgba(255,255,255,0.3)">
                <i data-lucide="info" style="width: 10px; height: 10px;"></i>
                Formula changes take effect immediately on new calculations.
            </p>
        </div>
    </div>
</div>
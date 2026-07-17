<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>

<t:dashboardLayout 
    roleLabel="Administrator" 
    roleColor="#c9a227" 
    userName="${not empty sessionScope.user.username ? sessionScope.user.username : 'Admin'}" 
    activeLabel="User & Role Management"
    profileActive="false">
    
    <jsp:attribute name="navItems">
        <a href="${pageContext.request.contextPath}/AdminUserController?view=users" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all group mb-0.5" style="background: #c9a22718; border-left: 2px solid #c9a227">
            <span class="font-mono text-[9px] w-5 text-right shrink-0 tabular-nums" style="color: #c9a227">08</span>
            <i data-lucide="arrow-left" style="width: 14px; height: 14px; color: #c9a227;"></i>
            <span class="flex-1 text-xs truncate" style="color: #c9a227">Back to Users</span>
        </a>
    </jsp:attribute>

    <jsp:body>
        <div class="space-y-6">
            <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
                <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
                    <div>
                        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Edit User Information</p>
                        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Update username and email for user #${editUser.id}</p>
                    </div>
                </div>
                <div class="p-6">
                    <form action="${pageContext.request.contextPath}/AdminUserController" method="post" class="space-y-5 max-w-md">
                        <input type="hidden" name="action" value="updateUser" />
                        <input type="hidden" name="userId" value="${editUser.id}" />
                        
                        <div>
                            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Username (Họ tên / Tên hiển thị)</label>
                            <input type="text" name="username" value="${editUser.username}" required class="w-full rounded-lg px-3 py-2 text-sm text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
                        </div>
                        
                        <div>
                            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Email</label>
                            <input type="email" name="email" value="${editUser.email}" required class="w-full rounded-lg px-3 py-2 text-sm text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
                        </div>
                        
                        <div>
                            <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Role (Vai trò)</label>
                            <c:choose>
                                <c:when test="${editUser.roleId == 1}">
                                    <input type="text" value="Administrator" disabled class="w-full rounded-lg px-3 py-2 text-sm text-[#f4f2ec] outline-none opacity-60 font-mono" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1)" />
                                    <input type="hidden" name="roleId" value="1" />
                                </c:when>
                                <c:otherwise>
                                    <select name="roleId" class="w-full rounded-lg px-3 py-2 text-sm outline-none bg-[#0a0907] text-[#f4f2ec]" style="border: 1px solid rgba(255,255,255,0.1); color-scheme: dark">
                                        <c:forEach var="r" items="${roles}">
                                            <c:if test="${r.id != 1}">
                                                <option value="${r.id}" ${editUser.roleId == r.id ? 'selected' : ''}>${r.roleName}</option>
                                            </c:if>
                                        </c:forEach>
                                    </select>
                                </c:otherwise>
                            </c:choose>
                        </div>
                        
                        <div class="flex items-center gap-2.5 py-1">
                            <input type="checkbox" name="requireOtp" id="admin-require-otp" value="true" ${editUser.requireOtp ? 'checked' : ''} class="w-4 h-4 rounded cursor-pointer accent-[#c9a227]" />
                            <label for="admin-require-otp" class="text-xs font-mono cursor-pointer select-none" style="color: rgba(255,255,255,0.7)">
                                Enable Login OTP Verification (Yêu cầu xác thực OTP khi đăng nhập)
                            </label>
                        </div>

                        <div class="pt-4 flex gap-3">
                            <button type="submit" class="inline-flex items-center justify-center gap-1.5 px-6 py-2 rounded-lg text-sm font-mono font-medium transition-opacity hover:brightness-75" style="background: #c9a227; color: #0b0d11">
                                Save Changes
                            </button>
                            <a href="${pageContext.request.contextPath}/AdminUserController?view=users" class="inline-flex items-center justify-center gap-1.5 px-6 py-2 rounded-lg text-sm font-mono font-medium transition-opacity hover:brightness-75" style="background: rgba(255,255,255,0.1); color: #f4f2ec">
                                Cancel
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </jsp:body>
</t:dashboardLayout>

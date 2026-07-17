<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<div class="space-y-6">
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Create New Account</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Register an Owner, Jockey or Spectator manually</p>
      </div>
    </div>
    <div class="p-6 border-b" style="border-color: rgba(201,162,39,0.10)">
        <form action="${pageContext.request.contextPath}/AdminUserController" method="post" class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <input type="hidden" name="action" value="createUser" />
            <div class="md:col-span-1">
                <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Username</label>
                <input type="text" name="username" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
            </div>
            <div class="md:col-span-1">
                <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Email</label>
                <input type="email" name="email" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
            </div>
            <div class="md:col-span-1">
                <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Password</label>
                <input type="password" name="password" required class="w-full rounded-lg px-3 py-2 text-xs text-[#f4f2ec] outline-none" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color-scheme: dark" />
            </div>
            <div class="md:col-span-1">
                <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Role</label>
                <select name="roleId" class="w-full rounded-lg px-3 py-2 text-xs outline-none bg-[#0a0907] text-[#f4f2ec]" style="border: 1px solid rgba(255,255,255,0.1); color-scheme: dark">
                    <option value="2">Horse Owner</option>
                    <option value="3">Jockey</option>
                    <option value="4">Spectator / Fan</option>
                    <option value="5">Referee</option>
                </select>
            </div>
            <div class="md:col-span-1">
                <button type="submit" class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="background: #c9a227; color: #0b0d11">
                    <i data-lucide="plus" style="width: 14px; height: 14px;"></i> Create
                </button>
            </div>
        </form>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">User</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Total Races</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-left" style="color: rgba(255,255,255,0.35)">Status</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest text-right" style="color: rgba(255,255,255,0.35)">Role Management</th>
          </tr>
        </thead>
        <tbody>
          <c:forEach var="u" items="${users}">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025] ${u.status == 'INACTIVE' ? 'opacity-50' : ''}">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0" style="background: #64748b; color: #0b0d11">${fn:toUpperCase(fn:substring(u.username, 0, 2))}</div>
                  <div>
                    <p class="text-xs text-[#f4f2ec] ${u.status == 'INACTIVE' ? 'line-through' : ''}">${u.username}</p>
                    <p class="text-[10px] font-mono" style="color: rgba(255,255,255,0.4)">${u.email}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-mono text-xs" style="color: rgba(255,255,255,0.45)">${u.totalRacesParticipated != null ? u.totalRacesParticipated : 0}</td>
              <td class="px-6 py-4">
                  <c:choose>
                      <c:when test="${u.status == 'INACTIVE'}">
                          <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: rgba(239,91,91,0.12); color: #ef5b5b; border-color: rgba(239,91,91,0.35)">Inactive</span>
                      </c:when>
                      <c:otherwise>
                          <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border inline-block" style="background: #4a9d6f18; color: #4a9d6f; border-color: #4a9d6f40">Active</span>
                      </c:otherwise>
                  </c:choose>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <span class="text-xs font-mono px-3 py-1.5" style="color: rgba(255,255,255,0.5)">
                        <c:forEach var="r" items="${roles}">
                            <c:if test="${r.id == u.roleId}">${r.roleName}</c:if>
                        </c:forEach>
                    </span>
                    <a href="${pageContext.request.contextPath}/AdminUserController?action=editUserPage&userId=${u.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="background: rgba(59,130,196,0.12); color: #3b82c4; border: 1px solid #3b82c450">
                        Edit
                    </a>
                    
                    <c:if test="${u.id != sessionScope.user.id}">
                        <form action="${pageContext.request.contextPath}/AdminUserController" method="post">
                            <input type="hidden" name="action" value="toggleStatus" />
                            <input type="hidden" name="userId" value="${u.id}" />
                            <c:choose>
                                <c:when test="${u.status == 'INACTIVE'}">
                                    <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="background: rgba(74,157,111,0.12); color: #4a9d6f; border: 1px solid #4a9d6f50">
                                      Activate
                                    </button>
                                </c:when>
                                <c:otherwise>
                                    <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="background: rgba(239,91,91,0.12); color: #ef5b5b; border: 1px solid rgba(239,91,91,0.35)">
                                      Deactivate
                                    </button>
                                </c:otherwise>
                            </c:choose>
                        </form>
                    </c:if>
                </div>
              </td>
            </tr>
          </c:forEach>
        </tbody>
      </table>
    </div>
  </div>
</div>


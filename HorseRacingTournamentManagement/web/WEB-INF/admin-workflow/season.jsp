<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-6">
  <c:if test="${not empty sessionScope.error}">
      <div class="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style="background-color: rgba(239,91,91,0.15); color: #ef5b5b; border: 1px solid rgba(239,91,91,0.3)">
          <i data-lucide="alert-triangle" style="width: 16px; height: 16px;"></i>
          ${sessionScope.error}
      </div>
      <c:remove var="error" scope="session" />
  </c:if>
  <c:if test="${not empty sessionScope.success}">
      <div class="p-3 rounded-lg text-sm font-mono flex items-center gap-2" style="background-color: rgba(74,157,111,0.15); color: #4a9d6f; border: 1px solid rgba(74,157,111,0.3)">
          <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
          ${sessionScope.success}
      </div>
      <c:remove var="success" scope="session" />
  </c:if>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Initialize New Racing Season</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Configure the season framework and choose rule initialization method.</p>
      </div>
    </div>
    <div class="p-6 space-y-6">
      <form action="${pageContext.request.contextPath}/SeasonController" method="post">
          <input type="hidden" name="action" value="init" />
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            <div class="md:col-span-2">
              <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
                Season Name
              </label>
              <input
                type="text"
                name="name"
                value="2026–2027 Grand Prix Season"
                class="w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
              />
            </div>
            <div>
              <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
                Season Start Date
              </label>
              <input
                type="text"
                name="startDate"
                value=""
                placeholder="dd/MM/yyyy"
                class="date-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
              />
            </div>
            <div>
              <label class="block text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">
                Season End Date
              </label>
              <input
                type="text"
                name="endDate"
                value=""
                placeholder="dd/MM/yyyy"
                class="date-picker w-full rounded-lg px-3 py-2.5 text-xs text-[#f4f2ec] outline-none"
                style="background: rgba(255,255,255,0.05); border: 1px solid rgba(201,162,39,0.22); color-scheme: dark"
              />
            </div>
          </div>

          <div class="space-y-3 mb-6">
            <label class="block text-[9px] font-mono uppercase tracking-widest" style="color: rgba(255,255,255,0.4)">
              Class Rule Setup Method
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div id="cardAuto" onclick="selectMethod('AUTOMATIC')" class="p-4 rounded-xl border cursor-pointer transition-all" 
                     style="background: rgba(201,162,39,0.03); border-color: rgba(201,162,39,0.4)">
                    <div class="flex items-start gap-3">
                        <input type="radio" id="radioAuto" name="classRuleMethod" value="AUTOMATIC" checked class="mt-0.5 accent-[#c9a227]" onclick="event.stopPropagation(); selectMethod('AUTOMATIC');" />
                        <div>
                            <span class="block text-xs font-mono font-bold text-[#f4f2ec]">Automatic Class Rules</span>
                            <span class="block text-[10px] font-mono mt-1 text-white/40 leading-relaxed">
                                TỰ ĐỘNG: Máy tự động thiết lập và áp dụng toàn bộ các Class mặc định (Class 1 - Class 5) vào Season này.
                            </span>
                        </div>
                    </div>
                </div>

                <div id="cardManual" onclick="selectMethod('MANUAL')" class="p-4 rounded-xl border cursor-pointer transition-all" 
                     style="background: rgba(255,255,255,0.01); border-color: rgba(255,255,255,0.08)">
                    <div class="flex items-start gap-3">
                        <input type="radio" id="radioManual" name="classRuleMethod" value="MANUAL" class="mt-0.5 accent-[#c9a227]" onclick="event.stopPropagation(); selectMethod('MANUAL');" />
                        <div>
                            <span class="block text-xs font-mono font-bold text-[#f4f2ec]">Manual Setup</span>
                            <span class="block text-[10px] font-mono mt-1 text-white/40 leading-relaxed">
                                THỦ CÔNG: Tự tay điều chỉnh trực tiếp điểm số và tiền thưởng cho cả 5 Class (Class 1 - Class 5) cho Season này.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div id="manualClassSection" class="hidden rounded-xl p-5 border space-y-3 transition-all duration-300" 
               style="background: rgba(255,255,255,0.015); border-color: rgba(201,162,39,0.15)">
              <div>
                  <p class="text-[9px] font-mono uppercase tracking-widest text-[#c9a227]">Configure Season Classes (Manual Mode)</p>
                  <p class="text-[10px] text-white/40 font-mono mt-0.5">Adjust ratings and prize ranges for the 5 season classes before initialization:</p>
              </div>
              
              <div class="overflow-x-auto pt-2">
                <table class="w-full text-xs font-mono text-left min-w-[600px]">
                  <thead>
                    <tr class="border-b border-white/10 pb-2 text-white/50">
                      <th class="py-2 pr-4 text-left">Class Level</th>
                      <th class="py-2 px-4 text-left">Min Rating</th>
                      <th class="py-2 px-4 text-left">Max Rating</th>
                      <th class="py-2 px-4 text-left">Min Prize ($)</th>
                      <th class="py-2 pl-4 text-left">Max Prize ($)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    <c:forEach var="rule" items="${templateRules}" varStatus="status">
                      <tr class="py-2">
                        <td class="py-3 pr-4 font-bold text-[#c9a227]">${rule.classLevel}</td>
                        <td class="py-2 px-4">
                          <input type="number" name="manual_class_${status.index + 1}_minRating" value="${rule.minRating}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-24" />
                        </td>
                        <td class="py-2 px-4">
                          <input type="number" name="manual_class_${status.index + 1}_maxRating" value="${rule.maxRating}" class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-24" placeholder="No limit" />
                        </td>
                        <td class="py-2 px-4">
                          <input type="number" step="0.01" name="manual_class_${status.index + 1}_minPrize" value="${rule.minPrize}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-32" />
                        </td>
                        <td class="py-2 pl-4">
                          <input type="number" step="0.01" name="manual_class_${status.index + 1}_maxPrize" value="${rule.maxPrize}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-32" />
                        </td>
                      </tr>
                    </c:forEach>
                  </tbody>
                </table>
              </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style="background: #c9a227; color: #0b0d11"
            >
              <i data-lucide="check-square" style="width: 13px; height: 13px;"></i>
              Initialize Season
            </button>
          </div>
      </form>
    </div>
  </div>

  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Historical Seasons</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">Previously completed racing seasons</p>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[600px]">
        <thead>
          <tr style="border-bottom: 1px solid rgba(201,162,39,0.10); background: rgba(255,255,255,0.018)">
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Season ID</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Season Name</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-left" style="color: rgba(255,255,255,0.35)">Date Range</th>
            <th class="px-6 py-3 text-[9px] font-mono uppercase tracking-widest whitespace-nowrap text-right" style="color: rgba(255,255,255,0.35)">Status</th>
          </tr>
        </thead>
        <tbody>
          <c:forEach var="season" items="${seasons}">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05)" class="transition-colors hover:bg-white/[0.025]">
              <td class="px-6 py-4"><span class="font-mono text-xs" style="color: #c9a227">S-${season.id}</span></td>
              <td class="px-6 py-4"><p class="text-xs text-[#f4f2ec]">${season.name}</p></td>
              <td class="px-6 py-4 font-mono text-xs" style="color: rgba(255,255,255,0.45)"><fmt:formatDate value="${season.startDate}" pattern="dd/MM/yyyy"/> – <fmt:formatDate value="${season.endDate}" pattern="dd/MM/yyyy"/></td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <c:choose>
                      <c:when test="${season.status eq 'ACTIVE'}">
                          <span class="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style="background: #4a9d6f18; color: #4a9d6f; border-color: #4a9d6f40">Active</span>
                      </c:when>
                      <c:otherwise>
                          <span class="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border inline-block" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border-color: rgba(255,255,255,0.12)">Closed</span>
                      </c:otherwise>
                  </c:choose>
                  <form action="${pageContext.request.contextPath}/SeasonController" method="post" class="inline-block m-0">
                      <input type="hidden" name="action" value="toggleStatus" />
                      <input type="hidden" name="seasonId" value="${season.id}" />
                      <button type="submit" class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-opacity hover:brightness-75" style="${season.status eq 'ACTIVE' ? 'background: rgba(239,91,91,0.12); color: #ef5b5b; border: 1px solid rgba(239,91,91,0.35)' : 'background: rgba(74,157,111,0.12); color: #4a9d6f; border: 1px solid #4a9d6f50'}">
                        ${season.status eq 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                  </form>
                </div>
              </td>
            </tr>
          </c:forEach>
        </tbody>
      </table>
    </div>
  </div>
</div>


<script>
    function selectMethod(method) {
        const isAuto = (method === 'AUTOMATIC');
        
        document.getElementById('radioAuto').checked = isAuto;
        document.getElementById('radioManual').checked = !isAuto;

        const cardAuto = document.getElementById('cardAuto');
        const cardManual = document.getElementById('cardManual');
        const manualSection = document.getElementById('manualClassSection');

        if (isAuto) {
            cardAuto.style.borderColor = 'rgba(201, 162, 39, 0.4)';
            cardAuto.style.background = 'rgba(201, 162, 39, 0.03)';
            
            cardManual.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            cardManual.style.background = 'rgba(255, 255, 255, 0.01)';
            
            manualSection.classList.add('hidden');
        } else {
            cardManual.style.borderColor = 'rgba(201, 162, 39, 0.4)';
            cardManual.style.background = 'rgba(201, 162, 39, 0.03)';
            
            cardAuto.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            cardAuto.style.background = 'rgba(255, 255, 255, 0.01)';
            
            manualSection.classList.remove('hidden');
        }
    }
</script>
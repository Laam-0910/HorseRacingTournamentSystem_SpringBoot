<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="space-y-6">
  <div class="rounded-xl border" style="background: rgba(255,255,255,0.028); border-color: rgba(201,162,39,0.14)">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color: rgba(201,162,39,0.10)">
      <div>
        <p class="font-['Roboto_Slab'] font-bold text-sm text-[#f4f2ec]">Configure Season Class Rules (Step 2)</p>
        <p class="text-[10px] font-mono mt-0.5" style="color: rgba(255,255,255,0.4)">
          Verify and adjust the generated class rules for: <span class="text-[#c9a227] font-bold">${season.name}</span>
        </p>
      </div>
    </div>

    <!-- Form Content -->
    <div class="p-6">
      <form action="${pageContext.request.contextPath}/SeasonController" method="post" class="space-y-6">
        <input type="hidden" name="action" value="saveRules" />
        <input type="hidden" name="seasonId" value="${season.id}" />

        <div class="overflow-x-auto">
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
              <c:forEach var="rule" items="${rules}">
                <tr class="py-2 hover:bg-white/[0.01]">
                  <td class="py-3 pr-4 font-bold text-[#c9a227]">${rule.classLevel}</td>
                  <td class="py-2 px-4">
                    <input type="number" name="minRating_${rule.id}" value="${rule.minRating}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-24" />
                  </td>
                  <td class="py-2 px-4">
                    <input type="number" name="maxRating_${rule.id}" value="${rule.maxRating}" class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-24" placeholder="No limit" />
                  </td>
                  <td class="py-2 px-4">
                    <input type="number" step="0.01" name="minPrize_${rule.id}" value="${rule.minPrize}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-32" />
                  </td>
                  <td class="py-2 pl-4">
                    <input type="number" step="0.01" name="maxPrize_${rule.id}" value="${rule.maxPrize}" required class="bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs outline-none text-[#f4f2ec] focus:border-[#c9a227] w-32" />
                  </td>
                </tr>
              </c:forEach>
            </tbody>
          </table>
        </div>

        <!-- Submit and Skip Actions -->
        <div class="pt-6 border-t border-white/10 flex justify-end gap-3">
          <a href="${pageContext.request.contextPath}/SeasonController?view=season" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:bg-white/10 hover:text-white text-white/70 border border-white/10 active:scale-95 cursor-pointer">
            <i data-lucide="corner-up-left" style="width: 13px; height: 13px;"></i>
            Skip & Finish
          </a>
          <button type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all hover:opacity-90 active:scale-95 cursor-pointer" style="background: #c9a227; color: #0b0d11">
            <i data-lucide="check" style="width: 13px; height: 13px;"></i>
            Save Rules & Finish
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="min-h-screen bg-[#0b0a08] text-[#f4f2ec] px-8 py-12 font-sans selection:bg-[#c9a227]/30">
    
    <div class="mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Data & Analytics</span>
    </div>
    <div class="mb-10">
        <h1 class="text-4xl font-serif font-bold tracking-tight">Statistics</h1>
        <p class="text-sm font-mono text-white/40 mt-1">Comprehensive season analytics and probability metrics</p>
    </div>

    <!-- Tab Selector -->
    <div class="flex items-center space-x-2 mb-8 overflow-x-auto pb-2">
        <a href="${pageContext.request.contextPath}/MainController?action=statistics&type=jockeys" 
           class="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${selectedType eq 'jockeys' || empty selectedType ? 'bg-[#c9a227] text-black border-[#c9a227] font-bold shadow-lg shadow-[#c9a227]/20 scale-[1.02] -translate-y-0.5' : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5 hover:text-primary'}">
            Jockeys Leaderboard
        </a>
        <a href="${pageContext.request.contextPath}/MainController?action=statistics&type=horses" 
           class="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${selectedType eq 'horses' ? 'bg-[#c9a227] text-black border-[#c9a227] font-bold shadow-lg shadow-[#c9a227]/20 scale-[1.02] -translate-y-0.5' : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5 hover:text-primary'}">
            Horses Leaderboard
        </a>
        <a href="${pageContext.request.contextPath}/MainController?action=statistics&type=owners" 
           class="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 ${selectedType eq 'owners' ? 'bg-[#c9a227] text-black border-[#c9a227] font-bold shadow-lg shadow-[#c9a227]/20 scale-[1.02] -translate-y-0.5' : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-[#c9a227]/30 hover:bg-[#c9a227]/5 hover:text-primary'}">
            Owners Leaderboard
        </a>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Sample Size (Races)</span>
            <span class="text-2xl font-mono font-bold text-[#f4f2ec]">${metrics.totalRaces}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Fav Win Rate</span>
            <span class="text-2xl font-mono font-bold text-emerald-500">${metrics.favWinRate}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Avg Winning Odds</span>
            <span class="text-2xl font-mono font-bold text-[#c9a227]">${metrics.avgOdds}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Highest Win Div</span>
            <span class="text-2xl font-mono font-bold text-white/90">${metrics.highestPayout}</span>
        </div>
    </div>

    <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Performance Analytics</h3>
            <span class="text-xs font-mono text-white/30">Sort by Wins</span>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                        <th class="py-3 px-4 w-16 text-center">Rank</th>
                        <th class="py-3 px-4">Name / Entry</th>
                        <th class="py-3 px-4 text-center">Starts</th>
                        <th class="py-3 px-4 text-center">Wins (1st)</th>
                        <th class="py-3 px-4 text-center">Places (Top 3)</th>
                        <th class="py-3 px-4 text-center">Win %</th>
                        <th class="py-3 px-4 text-center">Place %</th>
                        <th class="py-3 px-4 text-right">Net ROI</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/[0.03]">
                    <c:forEach var="row" items="${perfData}">
                        <tr class="hover:bg-white/[0.01] transition-colors group">
                            
                            <td class="py-4 px-4 text-center">
                                <c:choose>
                                    <c:when test="${row.rank == 1}">
                                        <span class="inline-block w-6 h-6 rounded bg-[#c9a227]/10 border border-[#c9a227]/30 text-[#c9a227] font-mono text-xs font-bold leading-6 text-center">01</span>
                                    </c:when>
                                    <c:when test="${row.rank == 2}">
                                        <span class="inline-block w-6 h-6 rounded bg-white/10 border border-white/10 text-white/80 font-mono text-xs font-bold leading-6 text-center">02</span>
                                    </c:when>
                                    <c:when test="${row.rank == 3}">
                                        <span class="inline-block w-6 h-6 rounded bg-amber-900/20 border border-amber-800/30 text-amber-600 font-mono text-xs font-bold leading-6 text-center">03</span>
                                    </c:when>
                                    <c:otherwise>
                                        <span class="font-mono text-xs text-white/30"><fmt:formatNumber value="${row.rank}" pattern="00"/></span>
                                    </c:otherwise>
                                </c:choose>
                            </td>

                            <td class="py-4 px-4 text-sm font-serif font-bold text-[#f4f2ec] group-hover:text-[#c9a227] transition-colors">
                                <c:out value="${row.name}"/>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs text-white/60">
                                <c:out value="${row.starts}"/>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs text-emerald-500 font-bold">
                                <c:out value="${row.wins}"/>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs text-white/70">
                                <c:out value="${row.places}"/>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs font-bold text-white/90">
                                <c:out value="${row.winRate}"/>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs text-white/50">
                                <c:out value="${row.placeRate}"/>
                            </td>

                            <td class="py-4 px-4 text-right font-mono text-sm font-bold ${row.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                                <c:if test="${row.roi > 0}">+</c:if><fmt:formatNumber value="${row.roi}" type="number" maxFractionDigits="2"/>
                            </td>
                        </tr>
                    </c:forEach>
                    
                    <c:if test="${empty perfData}">
                        <tr>
                            <td colspan="8" class="py-12 text-center font-mono text-xs text-white/30">
                                No statistical data available for this tracking period.
                            </td>
                        </tr>
                    </c:if>
                </tbody>
            </table>
        </div>
    </div>
</div>
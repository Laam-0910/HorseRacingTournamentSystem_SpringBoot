<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="min-h-screen bg-[#0b0a08] text-[#f4f2ec] px-8 py-12 font-sans selection:bg-[#c9a227]/30">
    
    <c:choose>
        <c:when test="${not empty horse}">
            <div class="mb-4">
                <a href="${pageContext.request.contextPath}/MainController?action=horses" class="text-xs font-mono uppercase tracking-widest text-white/40 hover:text-[#c9a227] transition-colors">
                    &larr; Back to Registry
                </a>
            </div>

            <div class="mb-10 border-b border-white/5 pb-8">
                <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Horse Profile</span>
                <h1 class="text-5xl font-serif font-black tracking-tight mt-1 uppercase text-white/95">
                    <c:out value="${horse.name}"/>
                </h1>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Sex</span>
                    <span class="text-lg font-serif font-bold text-[#f4f2ec]"><c:out value="${horse.sex}"/></span>
                </div>
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Trainer</span>
                    <span class="text-lg font-serif font-bold text-[#c9a227] truncate block"><c:out value="${horse.trainer}"/></span>
                </div>
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Owner</span>
                    <span class="text-lg font-serif font-bold text-white/90 truncate block"><c:out value="${horse.owner}"/></span>
                </div>
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Pedigree (Sire / Dam)</span>
                    <span class="text-xs font-mono text-white/60 truncate block mt-1">
                        S: <span class="text-white/80 font-bold"><c:out value="${horse.sire}"/></span> <br>
                        D: <span class="text-white/80 font-bold"><c:out value="${horse.dam}"/></span>
                    </span>
                </div>
            </div>

            <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Recent Form & Career History</h3>
                    <span class="text-xs font-mono text-white/30"><c:out value="${recentRuns.size()}"/> runs recorded</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                                <th class="py-3 px-4 w-16">R</th>
                                <th class="py-3 px-4">Race Event</th>
                                <th class="py-3 px-4">Date</th>
                                <th class="py-3 px-4">Jockey</th>
                                <th class="py-3 px-4 text-center">Pos.</th>
                                <th class="py-3 px-4">Margin</th>
                                <th class="py-3 px-4 text-right">Odds</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/[0.03]">
                            <c:forEach var="run" items="${recentRuns}">
                                <tr class="hover:bg-white/[0.01] transition-colors group">
                                    <td class="py-4 px-4 font-mono text-xs text-[#c9a227] font-bold">
                                        <c:out value="${run.raceNumber}"/>
                                    </td>
                                    <td class="py-4 px-4 text-sm font-serif font-medium text-white/90">
                                        <c:out value="${run.raceName}"/>
                                    </td>
                                    <td class="py-4 px-4 font-mono text-xs text-white/50">
                                        <fmt:formatDate value="${run.date}" pattern="dd/MM/yyyy"/>
                                    </td>
                                    <td class="py-4 px-4 text-xs font-mono text-white/70">
                                        <c:out value="${run.jockey}"/>
                                    </td>
                                    <td class="py-4 px-4 text-center">
                                        <c:choose>
                                            <c:when test="${run.position == 1}">
                                                <span class="inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">1st</span>
                                            </c:when>
                                            <c:when test="${run.position == 2}">
                                                <span class="inline-block px-2 py-0.5 rounded bg-white/5 text-white/80 font-mono text-xs">2nd</span>
                                            </c:when>
                                            <c:when test="${run.position == 3}">
                                                <span class="inline-block px-2 py-0.5 rounded bg-amber-900/10 text-amber-600 font-mono text-xs">3rd</span>
                                            </c:when>
                                            <c:otherwise>
                                                <span class="font-mono text-xs text-white/30">${run.position}</span>
                                            </c:otherwise>
                                        </c:choose>
                                    </td>
                                    <td class="py-4 px-4 font-mono text-xs text-white/40">
                                        <c:out value="${run.margin}"/>
                                    </td>
                                    <td class="py-4 px-4 text-right font-mono text-sm font-medium text-white/80">
                                        <fmt:formatNumber value="${run.odds}" type="number" minFractionDigits="1"/>
                                    </td>
                                </tr>
                            </c:forEach>
                            <c:if test="${empty recentRuns}">
                                <tr>
                                    <td colspan="7" class="py-12 text-center font-mono text-xs text-white/30">
                                        This horse has no historical race entries recorded yet.
                                    </td>
                                </tr>
                            </c:if>
                        </tbody>
                    </table>
                </div>
            </div>
        </c:when>
        <c:otherwise>
            <div class="mb-2">
                <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Competitors Directory</span>
            </div>
            <div class="mb-10 flex justify-between items-end">
                <div>
                    <h1 class="text-4xl font-serif font-bold tracking-tight">Thoroughbred Horses</h1>
                    <p class="text-sm font-mono text-white/40 mt-1">Registry of licensed racing horses and their owners</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Total Horses Registered</span>
                    <span class="text-2xl font-mono font-bold text-[#f4f2ec]">${allHorses.size()}</span>
                </div>
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Average Current Rating</span>
                    <span class="text-2xl font-mono font-bold text-emerald-400">
                        <c:set var="totalRating" value="0"/>
                        <c:forEach var="item" items="${allHorses}">
                            <c:set var="totalRating" value="${totalRating + item.currentRating}"/>
                        </c:forEach>
                        <c:choose>
                            <c:when test="${allHorses.size() > 0}">
                                <fmt:formatNumber value="${totalRating / allHorses.size()}" maxFractionDigits="1"/>
                            </c:when>
                            <c:otherwise>0</c:otherwise>
                        </c:choose>
                    </span>
                </div>
                <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
                    <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Total Wins Recorded</span>
                    <span class="text-2xl font-mono font-bold text-[#c9a227]">
                        <c:set var="totalWins" value="0"/>
                        <c:forEach var="item" items="${allHorses}">
                            <c:set var="totalWins" value="${totalWins + item.totalWins}"/>
                        </c:forEach>
                        ${totalWins}
                    </span>
                </div>
            </div>

            <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Horse Registry</h3>
                    <span class="text-xs font-mono text-white/30">${allHorses.size()} Thoroughbred Profiles</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                                <th class="py-3 px-4">Horse Name</th>
                                <th class="py-3 px-4">Breed</th>
                                <th class="py-3 px-4">Owner Name</th>
                                <th class="py-3 px-4 text-center">Rating</th>
                                <th class="py-3 px-4 text-center">Wins / Starts</th>
                                <th class="py-3 px-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/[0.03]">
                            <c:forEach var="item" items="${allHorses}">
                                <tr class="hover:bg-white/[0.01] transition-colors group">
                                    <td class="py-4 px-4">
                                        <a href="${pageContext.request.contextPath}/MainController?action=horses&horseId=${item.id}" class="text-sm font-serif font-bold text-[#f4f2ec] group-hover:text-[#c9a227] transition-colors block">
                                            <c:out value="${item.name}"/>
                                        </a>
                                        <span class="text-[10px] font-mono text-white/30 block mt-0.5">ID: H-00${item.id}</span>
                                    </td>
                                    <td class="py-4 px-4">
                                        <span class="text-xs font-mono text-white/70 block"><c:out value="${item.breed}"/></span>
                                    </td>
                                    <td class="py-4 px-4 text-xs font-mono text-white/60">
                                        <c:out value="${item.ownerName}"/>
                                    </td>
                                    <td class="py-4 px-4 text-center font-mono text-xs text-white/80">
                                        <c:out value="${item.currentRating}"/>
                                    </td>
                                    <td class="py-4 px-4 text-center font-mono text-xs text-[#c9a227] font-bold">
                                        <c:out value="${item.totalWins}"/> / <c:out value="${item.totalRaces}"/>
                                    </td>
                                    <td class="py-4 px-4 text-right">
                                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${item.status == 'ACTIVE' || item.status == 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40'}">
                                            <c:out value="${item.status}"/>
                                        </span>
                                    </td>
                                </tr>
                            </c:forEach>
                            <c:if test="${empty allHorses}">
                                <tr>
                                    <td colspan="6" class="py-12 text-center font-mono text-xs text-white/30">
                                        No horses found in the tournament registry database.
                                    </td>
                                </tr>
                            </c:if>
                        </tbody>
                    </table>
                </div>
            </div>
        </c:otherwise>
    </c:choose>
</div>
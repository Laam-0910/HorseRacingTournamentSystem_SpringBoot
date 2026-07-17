<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="min-h-screen bg-[#0b0a08] text-[#f4f2ec] px-8 py-12 font-sans selection:bg-[#c9a227]/30">
    
    <div class="mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Integrity & Safety Log</span>
    </div>
    <div class="mb-10 pb-6 border-b border-white/5">
        <h1 class="text-4xl font-serif font-bold tracking-tight">Incident Reports</h1>
        <p class="text-sm font-mono text-white/40 mt-1">Track regulatory infractions, track conditions, and safety logs</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Total Logged Incidents</span>
            <span class="text-2xl font-mono font-bold text-[#f4f2ec]">${stats.total}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Under Active Investigation</span>
            <span class="text-2xl font-mono font-bold text-amber-500">${stats.underReview}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Resolved Cases</span>
            <span class="text-2xl font-mono font-bold text-emerald-400">${stats.resolved}</span>
        </div>
    </div>

    <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Incident Ledger</h3>
            <span class="text-xs font-mono text-white/30">Latest Activity</span>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                        <th class="py-3 px-4 w-12 text-center">ID</th>
                        <th class="py-3 px-4">Race Event</th>
                        <th class="py-3 px-4">Involved Parties</th>
                        <th class="py-3 px-4 w-1/3">Description</th>
                        <th class="py-3 px-4 text-center">Severity</th>
                        <th class="py-3 px-4 text-center">Date</th>
                        <th class="py-3 px-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/[0.03]">
                    <c:forEach var="item" items="${incidents}">
                        <tr class="hover:bg-white/[0.01] transition-colors group">
                            
                            <td class="py-4 px-4 text-center font-mono text-xs text-white/40">
                                #<c:out value="${item.id}"/>
                            </td>

                            <td class="py-4 px-4 font-serif text-xs font-bold text-white/90">
                                <c:out value="${item.raceName}"/>
                            </td>

                            <td class="py-4 px-4 font-mono text-xs">
                                <span class="text-[#c9a227] font-bold block">H: <c:out value="${item.horseName}"/></span>
                                <span class="text-white/50 block mt-0.5">J: <c:out value="${item.jockeyName}"/></span>
                            </td>

                            <td class="py-4 px-4 text-xs text-white/70 font-sans leading-relaxed">
                                <c:out value="${item.description}"/>
                            </td>

                            <td class="py-4 px-4 text-center">
                                <c:choose>
                                    <c:when test="${item.severity == 'Critical' || item.severity == 'High'}">
                                        <span class="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-red-500/10 text-red-400 border border-red-500/20"><c:out value="${item.severity}"/></span>
                                    </c:when>
                                    <c:when test="${item.severity == 'Medium'}">
                                        <span class="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><c:out value="${item.severity}"/></span>
                                    </c:when>
                                    <c:otherwise>
                                        <span class="inline-block px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-white/5 text-white/50"><c:out value="${item.severity}"/></span>
                                    </c:otherwise>
                                </c:choose>
                            </td>

                            <td class="py-4 px-4 text-center font-mono text-xs text-white/40">
                                <fmt:formatDate value="${item.date}" pattern="dd/MM/yyyy"/>
                            </td>

                            <td class="py-4 px-4 text-right">
                                <c:choose>
                                    <c:when test="${item.status == 'Resolved'}">
                                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>
                                    </c:when>
                                    <c:when test="${item.status == 'Under Review'}">
                                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Under Review</span>
                                    </c:when>
                                    <c:otherwise>
                                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-white/30"><c:out value="${item.status}"/></span>
                                    </c:otherwise>
                                </c:choose>
                            </td>

                        </tr>
                    </c:forEach>

                    <c:if test="${empty incidents}">
                        <tr>
                            <td colspan="7" class="py-12 text-center font-mono text-xs text-white/30">
                                Clean record. No incidents or infractions reported during this session.
                            </td>
                        </tr>
                    </c:if>
                </tbody>
            </table>
        </div>
    </div>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<div class="min-h-screen bg-[#0b0a08] text-[#f4f2ec] px-8 py-12 font-sans selection:bg-[#c9a227]/30">
    
    <div class="mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Roster Directory</span>
    </div>
    <div class="mb-10 flex justify-between items-end">
        <div>
            <h1 class="text-4xl font-serif font-bold tracking-tight">Jockeys & Horse Owners</h1>
            <p class="text-sm font-mono text-white/40 mt-1">Manage certified racing jockeys and registered asset owners</p>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Total Jockeys</span>
            <span class="text-2xl font-mono font-bold text-[#f4f2ec]">${stats.totalJockeys}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Total Horse Owners</span>
            <span class="text-2xl font-mono font-bold text-[#f4f2ec]">${stats.totalOwners}</span>
        </div>
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-5 hover-card">
            <span class="text-[10px] font-mono uppercase tracking-widest text-white/30 block mb-1">Active Status (Combined)</span>
            <span class="text-2xl font-mono font-bold text-emerald-400">${stats.activeMembers}</span>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Certified Jockeys</h3>
                <span class="text-xs font-mono text-white/30">${jockeys.size()} Active Profiles</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                            <th class="py-3 px-2">Name</th>
                            <th class="py-3 px-2">Contact</th>
                            <th class="py-3 px-2 text-center">Races</th>
                            <th class="py-3 px-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/[0.03]">
                        <c:forEach var="jockey" items="${jockeys}">
                            <tr class="hover:bg-white/[0.01] transition-colors group">
                                <td class="py-4 px-2">
                                    <span class="text-sm font-serif font-bold text-[#f4f2ec] group-hover:text-[#c9a227] transition-colors block">
                                        <c:out value="${jockey.name}"/>
                                    </span>
                                    <span class="text-[10px] font-mono text-white/30 block mt-0.5">ID: J-00${jockey.id}</span>
                                </td>
                                <td class="py-4 px-2">
                                    <span class="text-xs font-mono text-white/70 block"><c:out value="${jockey.email}"/></span>
                                    <span class="text-[11px] font-mono text-white/40 block"><c:out value="${jockey.phone}"/></span>
                                </td>
                                <td class="py-4 px-2 text-center font-mono text-xs text-white/80">
                                    <c:out value="${jockey.totalRaces}"/>
                                </td>
                                <td class="py-4 px-2 text-right">
                                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${jockey.status == 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40'}">
                                        <c:out value="${jockey.status}"/>
                                    </span>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-white/[0.01] border border-white/5 rounded-xl p-6">
            <div class="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <h3 class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Registered Horse Owners</h3>
                <span class="text-xs font-mono text-white/30">${owners.size()} Accounts</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/30">
                            <th class="py-3 px-2">Owner Details</th>
                            <th class="py-3 px-2">Contact Info</th>
                            <th class="py-3 px-2 text-center">Horses Owned</th>
                            <th class="py-3 px-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/[0.03]">
                        <c:forEach var="owner" items="${owners}">
                            <tr class="hover:bg-white/[0.01] transition-colors group">
                                <td class="py-4 px-2">
                                    <span class="text-sm font-serif font-bold text-[#f4f2ec] group-hover:text-[#c9a227] transition-colors block">
                                        <c:out value="${owner.name}"/>
                                    </span>
                                    <span class="text-[10px] font-mono text-white/30 block mt-0.5">ID: O-00${owner.id}</span>
                                </td>
                                <td class="py-4 px-2">
                                    <span class="text-xs font-mono text-white/70 block"><c:out value="${owner.email}"/></span>
                                    <span class="text-[11px] font-mono text-white/40 block"><c:out value="${owner.phone}"/></span>
                                </td>
                                <td class="py-4 px-2 text-center font-mono text-xs text-[#c9a227] font-bold">
                                    <c:out value="${owner.horsesOwned}"/>
                                </td>
                                <td class="py-4 px-2 text-right">
                                    <span class="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${owner.status == 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/40'}">
                                        <c:out value="${owner.status}"/>
                                    </span>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </div>
        </div>

    </div>
</div>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="space-y-8 p-6">

  <div class="border-b pb-4" style="border-color: rgba(201,162,39,0.1)">
    <h1 class="font-['Roboto_Slab'] font-bold text-2xl text-[#f4f2ec]">About Our Horse Racing Platform</h1>
    <p class="text-xs font-mono mt-1 text-white/40">Real-time database insights and decentralized historical racing statistics.</p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    
    <div class="rounded-xl p-5 border transition-all hover:bg-white/[0.04]" style="background: rgba(255,255,255,0.025); border-color: #c9a22722">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Active Season</p>
      <p class="font-['DM_Mono'] text-xl font-medium tracking-tight text-[#c9a227] truncate">
          <c:out value="${stats.activeSeason}" />
      </p>
      <p class="text-[10px] font-mono mt-2" style="color: rgba(255,255,255,0.3)">currently running framework</p>
    </div>

    <div class="rounded-xl p-5 border transition-all hover:bg-white/[0.04]" style="background: rgba(255,255,255,0.025); border-color: #4a9d6f22">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Seasons Completed</p>
      <p class="font-['DM_Mono'] text-3xl font-medium tabular-nums" style="color: #4a9d6f">
          <fmt:formatNumber value="${stats.seasonsCompleted}" type="number" />
      </p>
      <p class="text-[10px] font-mono mt-1" style="color: rgba(255,255,255,0.3)">historical archives</p>
    </div>

    <div class="rounded-xl p-5 border transition-all hover:bg-white/[0.04]" style="background: rgba(255,255,255,0.025); border-color: #3b82c422">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Total Official Races</p>
      <p class="font-['DM_Mono'] text-3xl font-medium tabular-nums" style="color: #3b82c4">
          <fmt:formatNumber value="${stats.totalRacesRun}" type="number" />
      </p>
      <p class="text-[10px] font-mono mt-1" style="color: rgba(255,255,255,0.3)">concluded with official status</p>
    </div>

    <div class="rounded-xl p-5 border transition-all hover:bg-white/[0.04]" style="background: rgba(255,255,255,0.025); border-color: #8b5cf622">
      <p class="text-[9px] font-mono uppercase tracking-widest mb-2" style="color: rgba(255,255,255,0.4)">Prize Distributed</p>
      <p class="font-['DM_Mono'] text-2xl font-medium tabular-nums text-[#8b5cf6]">
          <fmt:formatNumber value="${stats.totalPrizeDistributed}" type="currency" currencySymbol="$" maxFractionDigits="2"/>
      </p>
      <p class="text-[10px] font-mono mt-1.5" style="color: rgba(255,255,255,0.3)">paid out to elite entries</p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      <div class="rounded-xl p-6 border" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.06)">
          <h3 class="font-['Roboto_Slab'] text-sm font-bold text-[#f4f2ec] mb-4 flex items-center gap-2">
              <i data-lucide="shield-check" class="text-[#c9a227] w-4 h-4"></i> Verified Ecosystem Assets
          </h3>
          <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                  <span class="text-xs font-mono text-white/50">Active Registered Horses</span>
                  <span class="text-xs font-mono font-bold text-[#f4f2ec]"><c:out value="${stats.totalActiveHorses}"/> Thoroughbreds</span>
              </div>
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                  <span class="text-xs font-mono text-white/50">Licensed Professional Jockeys</span>
                  <span class="text-xs font-mono font-bold text-[#f4f2ec]"><c:out value="${stats.totalActiveJockeys}"/> Athletes</span>
              </div>
              <div class="flex items-center justify-between pb-1">
                  <span class="text-xs font-mono text-white/50">Platform Integrity Rules</span>
                  <span class="text-xs font-mono text-[#c9a227] font-semibold">Strict Rating Class 0–5</span>
              </div>
          </div>
      </div>

      <div class="rounded-xl p-6 border" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.06)">
          <h3 class="font-['Roboto_Slab'] text-sm font-bold text-[#f4f2ec] mb-4 flex items-center gap-2">
              <i data-lucide="sliders" class="text-[#4a9d6f] w-4 h-4"></i> System Weight Constraints
          </h3>
          <p class="text-[11px] font-mono text-white/40 mb-3 leading-relaxed">
              Jockey weight distribution is dynamic and calculated based on the internal formula utilizing individual horse rating deviations.
          </p>
          <div class="flex gap-2">
              <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70">Min: 52.0 kg</span>
              <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70">Max: 60.0 kg</span>
              <span class="text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 border border-white/10 text-white/70">Step: 0.5 kg/point</span>
          </div>
      </div>
  </div>
</div>
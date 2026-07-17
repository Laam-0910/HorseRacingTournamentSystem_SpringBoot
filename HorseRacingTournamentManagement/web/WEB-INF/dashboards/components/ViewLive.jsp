<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<style>
.live-race-row:hover {
    border-color: rgba(201,162,39,0.3) !important;
    background: rgba(201,162,39,0.03) !important;
}
.start-watch-btn:hover {
    background: #f54e4e !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(229, 62, 62, 0.4) !important;
}
.start-watch-btn:active {
    transform: translateY(0);
}
</style>

<div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 40px 24px; color: #f2ead8; max-w: 650px; margin: 40px auto; box-sizing: border-box; text-align: center;">
    
    <div style="margin-bottom: 30px;">
        <span class="blink-text" style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: #e53e3e; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: #e53e3e;"></span>
            LIVE BROADCASTS ACTIVE
        </span>
        <h2 style="font-size: 32px; font-weight: bold; margin: 0; font-family: Georgia, serif; color: #f2ead8;">Watch Live Stream</h2>
        <p style="font-size: 14px; color: #8e8476; margin-top: 10px; line-height: 1.6;">
            Select a live race below to watch its broadcast stream.
        </p>
    </div>

    <c:choose>
        <c:when test="${not empty liveRaces}">
            <div style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
                <c:forEach var="lr" items="${liveRaces}">
                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; text-align: left; box-sizing: border-box; transition: all 0.2s;" class="live-race-row">
                        <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-w: 0;">
                            <!-- Race ID Badge -->
                            <div style="width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 14px; font-weight: bold; background: rgba(229,62,62,0.12); color: #ef4444; border: 1px solid rgba(229,62,62,0.2); shrink: 0;">
                                R-${lr.id}
                            </div>
                            <!-- Race Info -->
                            <div style="min-w: 0; flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span style="font-size: 15px; font-weight: bold; color: #f4f2ec;">Race R-${lr.id}</span>
                                    <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px 6px; border-radius: 4px; background: rgba(201,162,39,0.12); color: #c9a227; font-weight: 600;">
                                        ${lr.classLevel}
                                    </span>
                                </div>
                                <div style="font-size: 12px; color: #8e8476; margin-top: 4px; line-height: 1.4; display: flex; flex-direction: column; gap: 2px;">
                                    <span style="color: #c9a227; font-weight: 500;">
                                        Event: 
                                        <c:forEach var="meeting" items="${meetings}">
                                            <c:if test="${meeting.id eq lr.raceMeetingId}">
                                                ${meeting.name}
                                            </c:if>
                                        </c:forEach>
                                    </span>
                                    <span style="font-family: monospace; font-size: 11px;">
                                        <c:if test="${not empty lr.distanceMeters}">${lr.distanceMeters}m</c:if>
                                        <c:if test="${not empty lr.trackType}"> · ${lr.trackType}</c:if>
                                        <c:if test="${not empty lr.purse}"> · Purse: $<fmt:formatNumber value="${lr.purse}" pattern="#,##0" /></c:if>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Start Watching Button -->
                        <div style="margin-left: 16px; shrink: 0;">
                            <a href="${lr.youtubeLiveUrl}" target="_blank" class="start-watch-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #e53e3e; color: #ffffff; font-weight: bold; font-size: 13px; border-radius: 20px; text-decoration: none; box-shadow: 0 4px 12px rgba(229, 62, 62, 0.25); transition: all 0.2s;">
                                🔴 Start Watching
                            </a>
                        </div>
                    </div>
                </c:forEach>
            </div>
        </c:when>
        
        <c:otherwise>
            <!-- No livestream available representation -->
            <div style="padding: 20px 0;">
                <div style="font-size: 48px; margin-bottom: 16px;">📺</div>
                <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; font-family: Georgia, serif; color: #f2ead8;">No Live Races Right Now</h3>
                <p style="font-size: 13px; color: #8e8476; max-w: 350px; margin: 0 auto; line-height: 1.6;">
                    There are no active races currently broadcasting. Please wait until the next race meeting goes live.
                </p>
            </div>
        </c:otherwise>
    </c:choose>

</div>

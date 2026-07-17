<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<div class="min-h-screen bg-[#0b0a08] text-[#f4f2ec] px-8 py-12 font-sans selection:bg-[#c9a227]/30">
    
    <div class="mb-2">
        <span class="text-xs font-mono uppercase tracking-widest text-[#c9a227]">Media & Announcements</span>
    </div>
    <div class="mb-12">
        <h1 class="text-4xl font-serif font-bold tracking-tight">Latest News & Racing Insights</h1>
        <p class="text-sm font-mono text-white/40 mt-1">Stay updated with official statements, track updates, and community alerts</p>
    </div>

    <c:if test="${not empty featured}">
        <div class="relative overflow-hidden bg-white/[0.01] border border-white/5 rounded-2xl mb-12 group hover:border-[#c9a227]/30 transition-all duration-300">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                <div class="lg:col-span-7 h-64 lg:h-[400px] overflow-hidden relative">
                    <img src="<c:out value='${featured.imageUrl}'/>" 
                         alt="Featured Image" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                         onerror="this.src='https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=1200'"/>
                    <div class="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0b0a08] via-transparent to-transparent"></div>
                </div>

                <div class="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-center">
                    <span class="px-2 py-0.5 bg-[#c9a227]/10 border border-[#c9a227]/20 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-[#c9a227] w-max mb-4">
                        <c:out value="${featured.category}"/>
                    </span>
                    <a href="article-detail?id=${featured.id}" class="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white hover:text-[#c9a227] transition-colors leading-tight block mb-4">
                        <c:out value="${featured.title}"/>
                    </a>
                    <p class="text-sm text-white/60 font-sans leading-relaxed mb-6 line-clamp-3">
                        <c:out value="${featured.summary}"/>
                    </p>
                    <div class="flex items-center space-x-3 font-mono text-xs text-white/30">
                        <span>By <c:out value="${featured.author}"/></span>
                        <span>·</span>
                        <span><fmt:formatDate value="${featured.date}" pattern="dd/MM/yyyy"/></span>
                    </div>
                </div>
            </div>
        </div>
    </c:if>

    <div>
        <div class="border-b border-white/5 pb-4 mb-6">
            <h3 class="text-xs font-mono uppercase tracking-widest text-white/40">More Articles & Updates</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <c:forEach var="article" items="${articles}">
                <div class="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden flex flex-col group hover:border-white/10 transition-all duration-300">
                    
                    <div class="h-48 overflow-hidden relative">
                        <img src="<c:out value='${article.imageUrl}'/>" 
                             alt="Article Thumbnail" 
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                             onerror="this.src='https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&q=80&w=600'"/>
                        <span class="absolute top-4 left-4 px-2 py-0.5 bg-[#0b0a08]/80 border border-white/10 rounded text-[9px] font-mono uppercase tracking-widest text-[#c9a227]">
                            <c:out value="${article.category}"/>
                        </span>
                    </div>

                    <div class="p-6 flex flex-col flex-1 justify-between">
                        <div>
                            <a href="article-detail?id=${article.id}" class="text-lg font-serif font-bold text-white/90 hover:text-[#c9a227] transition-colors line-clamp-2 leading-snug mb-3 block">
                                <c:out value="${article.title}"/>
                            </a>
                            <p class="text-xs text-white/50 font-sans leading-relaxed line-clamp-3 mb-4">
                                <c:out value="${article.summary}"/>
                            </p>
                        </div>

                        <div class="flex justify-between items-center pt-4 border-t border-white/[0.03] font-mono text-[10px] text-white/30">
                            <span>By <c:out value="${article.author}"/></span>
                            <span><fmt:formatDate value="${article.date}" pattern="dd/MM/yyyy"/></span>
                        </div>
                    </div>
                </div>
            </c:forEach>
        </div>

        <c:if test="${empty featured && empty articles}">
            <div class="py-24 text-center bg-white/[0.01] border border-white/5 rounded-xl">
                <p class="font-mono text-xs text-white/30">No news articles or technical updates are currently available.</p>
            </div>
        </c:if>
    </div>
</div>
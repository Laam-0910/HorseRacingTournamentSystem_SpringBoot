<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>


<%-- CHATBOT WIDGET --%>
<style>
    #chat-toggle-btn {
        position: fixed; bottom: 24px; right: 24px;
        width: 52px; height: 52px; border-radius: 50%;
        background: #C9A84C; color: #111; border: none;
        cursor: pointer; font-size: 22px; z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }
    #chat-toggle-btn:hover { background: #b8952e; }
    #chat-widget {
        position: fixed; bottom: 88px; right: 24px;
        width: 370px; height: 530px;
        background: #1a1a1a; border: 1px solid #2e2e2e;
        border-radius: 12px; display: none;
        flex-direction: column; z-index: 9998; overflow: hidden;
        box-shadow: 0 6px 28px rgba(0,0,0,0.75);
    }
    #chat-widget.open { display: flex; }
    #chat-header {
        background: #111; color: #C9A84C;
        padding: 11px 14px; display: flex;
        align-items: center; justify-content: space-between;
        border-bottom: 1px solid #C9A84C33; flex-shrink: 0;
    }
    #chat-header-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
    #chat-header-right { display: flex; align-items: center; gap: 8px; }
    #lang-select {
        background: #1e1e1e; border: 1px solid #C9A84C55;
        color: #C9A84C; border-radius: 5px;
        font-size: 11px; padding: 3px 5px; cursor: pointer; outline: none;
    }
    #lang-select:focus { border-color: #C9A84C; }
    #chat-close-btn { background: none; border: none; color: #777; font-size: 17px; cursor: pointer; padding: 2px 4px; }
    #chat-close-btn:hover { color: #fff; }
    #chat-quick-actions {
        padding: 8px 12px; border-bottom: 1px solid #222;
        display: flex; flex-wrap: wrap; gap: 6px;
        flex-shrink: 0; background: #141414;
    }
    .chat-quick-btn {
        font-size: 11px; padding: 4px 11px;
        border: 1px solid #C9A84C55; border-radius: 20px;
        background: #241f00; color: #C9A84C; cursor: pointer; white-space: nowrap;
    }
    .chat-quick-btn:hover { background: #3a3000; border-color: #C9A84C; }
    #chat-messages {
        flex: 1; overflow-y: auto; padding: 12px;
        display: flex; flex-direction: column; gap: 8px; background: #1a1a1a;
    }
    #chat-messages::-webkit-scrollbar { width: 4px; }
    #chat-messages::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    .chat-msg {
        max-width: 86%; padding: 8px 12px; border-radius: 10px;
        font-size: 13px; line-height: 1.55; word-break: break-word; white-space: pre-wrap;
    }
    .chat-msg.bot { align-self: flex-start; background: #242424; color: #ddd; border: 1px solid #2e2e2e; border-bottom-left-radius: 2px; }
    .chat-msg.user { align-self: flex-end; background: #C9A84C; color: #111; font-weight: 500; border-bottom-right-radius: 2px; }
    .chat-msg.typing { align-self: flex-start; background: #242424; color: #666; font-style: italic; border: 1px solid #2e2e2e; }
    #chat-input-area { padding: 10px 12px; border-top: 1px solid #222; display: flex; gap: 8px; flex-shrink: 0; background: #141414; }
    #chat-input {
        flex: 1; padding: 8px 13px; border: 1px solid #333;
        border-radius: 20px; font-size: 13px; outline: none;
        background: #222; color: #e0e0e0;
    }
    #chat-input::placeholder { color: #555; }
    #chat-input:focus { border-color: #C9A84C88; }
    #chat-send-btn {
        width: 36px; height: 36px; border-radius: 50%;
        background: #C9A84C; color: #111; border: none; cursor: pointer; font-size: 16px; flex-shrink: 0;
    }
    #chat-send-btn:hover { background: #b8952e; }
    #chat-send-btn:disabled { background: #3a3a3a; color: #666; cursor: not-allowed; }
</style>

<button id="chat-toggle-btn" onclick="toggleChat()">&#129302;</button>

<div id="chat-widget">
    <div id="chat-header">
        <div id="chat-header-title">&#129302; <span id="chat-header-label">AI Horse Racing</span></div>
        <div id="chat-header-right">
            <select id="lang-select" onchange="chatChangeLang(this.value)">
                <option value="vi">🇻🇳 VI</option>
                <option value="en">🇺🇸 EN</option>
                <option value="ja">🇯🇵 JA</option>
                <option value="zh">🇨🇳 ZH</option>
            </select>
            <button id="chat-close-btn" onclick="toggleChat()">&#10005;</button>
        </div>
    </div>
    <div id="chat-quick-actions">
        <button class="chat-quick-btn" onclick="chatQuickAsk(0)">Rating cao nhất</button>
        <button class="chat-quick-btn" onclick="chatQuickAsk(1)">Dự đoán race</button>
        <button class="chat-quick-btn" onclick="chatQuickAsk(2)">Nài xuất sắc</button>
        <button class="chat-quick-btn" onclick="chatQuickAsk(3)">Mùa giải</button>
    </div>
    <div id="chat-messages">
        <div class="chat-msg bot" id="chat-welcome-msg">Xin chào! Hỏi tôi về ngựa, nài, race, dự đoán kết quả nhé.</div>
    </div>
    <div id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Nhập câu hỏi..."
               onkeydown="if(event.key==='Enter') sendMessage()" />
        <button id="chat-send-btn" onclick="sendMessage()">&#10148;</button>
    </div>
</div>

<script>
var isWaiting = false;
var chatLang = 'vi';
var CHAT_LANG = {
    vi: {
        label: 'AI Horse Racing', placeholder: 'Nhập câu hỏi...',
        typing: 'Đang phân tích...',
        welcome: 'Xin chào! Hỏi tôi về ngựa, nài, race, dự đoán kết quả nhé.',
        error: 'Lỗi: ', noconn: 'Không kết nối được server AI. Kiểm tra Python đang chạy chưa.',
        quick: ['Rating cao nhất','Dự đoán race','Nài xuất sắc','Mùa giải'],
        quickQ: ['Ngựa nào rating cao nhất?','Dự đoán kết quả race mới nhất','Nài ngựa xuất sắc nhất?','Mùa giải hiện tại']
    },
    en: {
        label: 'AI Horse Racing', placeholder: 'Ask a question...',
        typing: 'Analyzing...',
        welcome: 'Hello! Ask me about horses, jockeys, races, or predictions.',
        error: 'Error: ', noconn: 'Cannot connect to AI server. Check if Python is running.',
        quick: ['Top Rating','Predict Race','Best Jockey','Season'],
        quickQ: ['Which horse has the highest rating?','Predict the latest race result','Which jockey has the best top-3 rate?','Current season summary']
    },
    ja: {
        label: 'AI競馬アシスタント', placeholder: '質問を入力...',
        typing: '分析中...',
        welcome: 'こんにちは！馬・騎手・レース・予測について聞いてください。',
        error: 'エラー：', noconn: 'AIサーバーに接続できません。Pythonを確認してください。',
        quick: ['最高レーティング','レース予測','優秀騎手','シーズン'],
        quickQ: ['最もレーティングが高い馬は？','最新レースを予測','トップ3率が最も高い騎手は？','今シーズンのまとめ']
    },
    zh: {
        label: 'AI赛马助手', placeholder: '输入问题...',
        typing: '分析中...',
        welcome: '你好！请问关于马匹、骑师、比赛或预测的问题。',
        error: '错误：', noconn: '无法连接AI服务器，请检查Python是否运行。',
        quick: ['最高评分','预测赛事','优秀骑师','赛季'],
        quickQ: ['哪匹马评分最高？','预测最新比赛结果','哪位骑师前三率最高？','本赛季总结']
    }
};
function chatChangeLang(lang) {
    chatLang = lang;
    var L = CHAT_LANG[lang];
    document.getElementById('chat-header-label').textContent = L.label;
    document.getElementById('chat-input').placeholder = L.placeholder;
    document.getElementById('chat-welcome-msg').textContent = L.welcome;
    document.querySelectorAll('.chat-quick-btn').forEach(function(b,i){ b.textContent = L.quick[i]; });
}
function toggleChat() {
    var w = document.getElementById('chat-widget');
    w.classList.toggle('open');
    if (w.classList.contains('open')) document.getElementById('chat-input').focus();
}
function chatQuickAsk(i) {
    document.getElementById('chat-input').value = CHAT_LANG[chatLang].quickQ[i];
    sendMessage();
}
function sendMessage() {
    if (isWaiting) return;
    var input = document.getElementById('chat-input');
    var msg = input.value.trim();
    if (!msg) return;
    addChatMsg('user', msg);
    input.value = '';
    var L = CHAT_LANG[chatLang];
    var tid = addChatMsg('typing', L.typing);
    isWaiting = true;
    document.getElementById('chat-send-btn').disabled = true;
    fetch('${pageContext.request.contextPath}/ai/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        body: JSON.stringify({message: msg, lang: chatLang})
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById(tid).remove();
        addChatMsg('bot', data.success ? data.reply : L.error + (data.error || ''));
    })
    .catch(() => {
        document.getElementById(tid).remove();
        addChatMsg('bot', L.noconn);
    })
    .finally(() => {
        isWaiting = false;
        document.getElementById('chat-send-btn').disabled = false;
    });
}
function addChatMsg(type, text) {
    var box = document.getElementById('chat-messages');
    var id = 'msg-' + Date.now();
    var d = document.createElement('div');
    d.className = 'chat-msg ' + type;
    d.id = id; d.textContent = text;
    box.appendChild(d); box.scrollTop = box.scrollHeight;
    return id;
}
</script>
<t:layout>
    <jsp:attribute name="pageTitle">Home - Horse Race Management</jsp:attribute>
    <jsp:body>
        <div class="bg-[#0a0907] border-b border-border">
          <div class="max-w-7xl mx-auto px-4 h-8 flex items-center text-[11px] font-mono text-muted-foreground">
            <span id="welcome-text">Welcome to HorseRace · Royal Ascot meeting in progress</span>
          </div>
        </div>

        <header class="bg-card relative z-50">
          <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
            <a href="${pageContext.request.contextPath}/" class="flex items-center gap-3">
              <div class="w-9 h-9 rounded flex items-center justify-center" style="background: #c9a227">
                <i data-lucide="trophy" style="width: 18px; height: 18px;" class="text-[#0e0c09]"></i>
              </div>
              <div class="text-left">
                <p class="font-['Roboto_Slab'] font-bold text-base leading-tight">HorseRace</p>
                <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Management System
                </p>
              </div>
            </a>

            <div class="hidden md:flex items-center flex-1 max-w-md relative" id="search-container">
              <div class="relative w-full">
                <i data-lucide="search" style="width: 14px; height: 14px;" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                <input
                  id="search-input"
                  placeholder="Search horse, jockey, horse owner, race…"
                  class="w-full bg-[#151310]/80 border border-[#c9a227]/20 hover:border-[#c9a227]/40 focus:border-[#c9a227] rounded-md px-9 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#c9a227]/30 placeholder-muted-foreground/60 transition-all duration-300 backdrop-blur-md"
                />
              </div>
              <!-- Search Results Dropdown -->
              <div id="search-results-dropdown" class="absolute left-0 top-full mt-1.5 w-full bg-[#151310]/95 border border-[#c9a227]/25 rounded-lg shadow-2xl py-3 hidden z-[9999] max-h-[80vh] overflow-y-auto backdrop-blur-md">
              </div>
            </div>

            <div class="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
              <!-- Dropdown Language Switcher -->
              <div class="relative">
                <button id="lang-btn" type="button" onclick="toggleLangDropdown(event)" class="inline-flex items-center gap-1 hover:text-foreground cursor-pointer py-1">
                  <i data-lucide="globe" style="width: 12px; height: 12px;"></i>
                  <span id="lang-label">EN</span>
                  <i data-lucide="chevron-down" style="width: 10px; height: 10px;"></i>
                </button>
                <div id="lang-dropdown" class="absolute right-0 top-full mt-1 w-28 bg-[#151310] border border-[#2a2825] rounded-md shadow-xl py-1 hidden z-50 transition-all">
                  <button type="button" onclick="changeLang('en', 'EN'); closeLangDropdown();" class="w-full text-left px-3 py-1.5 hover:bg-[#c9a227]/10 hover:text-[#c9a227] transition-colors cursor-pointer block font-mono text-[10px]">
                    English
                  </button>
                  <button type="button" onclick="changeLang('vi', 'VI'); closeLangDropdown();" class="w-full text-left px-3 py-1.5 hover:bg-[#c9a227]/10 hover:text-[#c9a227] transition-colors cursor-pointer block font-mono text-[10px]">
                    Tiếng Việt
                  </button>
                  <button type="button" onclick="changeLang('zh', 'ZH'); closeLangDropdown();" class="w-full text-left px-3 py-1.5 hover:bg-[#c9a227]/10 hover:text-[#c9a227] transition-colors cursor-pointer block font-mono text-[10px]">
                    简体中文
                  </button>
                  <button type="button" onclick="changeLang('ja', 'JA'); closeLangDropdown();" class="w-full text-left px-3 py-1.5 hover:bg-[#c9a227]/10 hover:text-[#c9a227] transition-colors cursor-pointer block font-mono text-[10px]">
                    日本語
                  </button>
                </div>
              </div>
              <div class="relative">
                <button
                  type="button"
                  id="bell-btn"
                  onclick="toggleNotifications()"
                  class="relative text-muted-foreground hover:text-foreground p-1 focus:outline-none flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                  style="box-shadow: none !important; transform: none !important;"
                >
                  <i data-lucide="bell" style="width: 18px; height: 18px;"></i>
                  <span id="unread-dot" class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </button>
                
                <!-- Notifications Dropdown Panel -->
                <div
                  id="notifications-dropdown"
                  class="absolute right-0 mt-3 w-80 bg-[#151310] border border-border rounded-lg shadow-2xl overflow-hidden hidden z-50 transform transition-all duration-300 opacity-0 scale-95"
                  style="transform-origin: top right;"
                >
                  <!-- Header -->
                  <div class="px-4 py-3 border-b border-border flex items-center justify-between bg-[#1a1815]">
                    <h3 class="text-xs font-serif font-semibold text-white">Notifications</h3>
                    <button
                      type="button"
                      onclick="markAllNotificationsAsRead()"
                      class="text-[10px] text-primary hover:text-[#dfb830] transition-colors font-mono uppercase tracking-wider"
                      style="box-shadow: none !important; transform: none !important;"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <!-- Notifications List -->
                  <div class="max-h-64 overflow-y-auto divide-y divide-border scrollbar-hide" id="notifications-list">
                    <!-- Notification 1 -->
                    <div class="p-3.5 flex gap-3 hover:bg-[#1a1815] transition-colors">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[#c9a227]/10 text-[#c9a227]">
                        <i data-lucide="trophy" class="w-4 h-4"></i>
                      </div>
                      <div class="text-left leading-tight">
                        <p class="text-xs text-white font-medium">Tournament Season 2026</p>
                        <p class="text-[10px] text-white/50 mt-1">Registrations are now open for Jockeys and Owners!</p>
                        <span class="text-[8px] text-white/30 font-mono block mt-1">10 mins ago</span>
                      </div>
                    </div>
                    <!-- Notification 2 -->
                    <div class="p-3.5 flex gap-3 hover:bg-[#1a1815] transition-colors">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-400">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                      </div>
                      <div class="text-left leading-tight">
                        <p class="text-xs text-white font-medium">Upcoming Race Meeting</p>
                        <p class="text-[10px] text-white/50 mt-1">Gold Cup Championship starts Sunday at 3:00 PM.</p>
                        <span class="text-[8px] text-white/30 font-mono block mt-1">2 hours ago</span>
                      </div>
                    </div>
                    <!-- Notification 3 -->
                    <div class="p-3.5 flex gap-3 hover:bg-[#1a1815] transition-colors">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-400">
                        <i data-lucide="shield-check" class="w-4 h-4"></i>
                      </div>
                      <div class="text-left leading-tight">
                        <p class="text-xs text-white font-medium">System Update</p>
                        <p class="text-[10px] text-white/50 mt-1">Database integration verified and performance optimized.</p>
                        <span class="text-[8px] text-white/30 font-mono block mt-1">1 day ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div class="px-4 py-2 border-t border-border text-center bg-[#1a1815]">
                    <span class="text-[9px] text-white/40 font-mono uppercase tracking-wider block py-1">
                      No more notifications
                    </span>
                  </div>
                </div>
              </div>
              
              <c:choose>
                <c:when test="${not empty sessionScope.user}">
                  <div class="hidden md:flex items-center gap-3 pl-3 border-l border-border">
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[#0e0c09]"
                      style="background: #c0392b"
                      title="${sessionScope.user.email}"
                    >
                      ${fn:toUpperCase(fn:substring(sessionScope.user.username, 0, 1))}
                    </div>
                    <div class="text-left leading-tight">
                      <p class="text-xs text-foreground">${sessionScope.user.username}</p>
                      <p class="text-[10px] font-mono uppercase tracking-widest" style="color: #c0392b">
                          <c:choose>
                            <c:when test="${sessionScope.user.roleId == 1}">ADMIN</c:when>
                            <c:when test="${sessionScope.user.roleId == 2}">OWNER</c:when>
                            <c:when test="${sessionScope.user.roleId == 3}">JOCKEY</c:when>
                            <c:when test="${sessionScope.user.roleId == 4}">SPECTATOR</c:when>
                            <c:when test="${sessionScope.user.roleId == 5}">REFEREE</c:when>
                            <c:otherwise>MEMBER</c:otherwise>
                          </c:choose>
                      </p>
                    </div>
                    <form action="${pageContext.request.contextPath}/MainController" method="post" class="m-0 p-0">
                        <input type="hidden" name="action" value="logout" />
                        <button type="submit" class="ml-2 hover:text-foreground border-l border-border pl-3 transition-colors">
                          Sign out
                        </button>
                    </form>
                  </div>
                </c:when>
                <c:otherwise>
                  <div class="flex items-center gap-2 pl-3 border-l border-border">
                    <a
                      href="${pageContext.request.contextPath}/MainController?action=loginPage"
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-[#dfb830] hover:text-[#0e0c09] transition-colors font-mono text-[11px] uppercase tracking-wider"
                    >
                      <i data-lucide="user" style="width: 12px; height: 12px;"></i> Sign in
                    </a>
                    <a
                      href="${pageContext.request.contextPath}/MainController?action=registerPage"
                      class="px-3 py-1.5 rounded border border-primary/50 text-primary hover:bg-primary/10 transition-colors font-mono text-[11px] uppercase tracking-wider"
                    >
                      Register
                    </a>
                  </div>
                </c:otherwise>
              </c:choose>
            </div>
          </div>
          <nav class="border-t border-b border-border bg-[#0a0907]">
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
              <c:if test="${not empty sessionScope.user}">
                <c:choose>
                  <c:when test="${sessionScope.user.roleId == 1}">
                    <a href="${pageContext.request.contextPath}/AdminUserController?view=live" 
                       class="px-8 py-3 text-sm font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-300 ease-out active:scale-95 ${param.action eq 'dashboard' ? 'border-primary text-primary bg-[#c9a227]/[0.05] shadow-[inset_0_-2px_0_0_#c9a227]' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-[#c9a227]/[0.02] hover:border-primary/30'}">
                      Dashboard
                    </a>
                  </c:when>
                  <c:otherwise>
                    <a href="${pageContext.request.contextPath}/MainController?action=dashboard" 
                       class="px-8 py-3 text-sm font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-300 ease-out active:scale-95 ${param.action eq 'dashboard' ? 'border-primary text-primary bg-[#c9a227]/[0.05] shadow-[inset_0_-2px_0_0_#c9a227]' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-[#c9a227]/[0.02] hover:border-primary/30'}">
                      Dashboard
                    </a>
                  </c:otherwise>
                </c:choose>
              </c:if>
              <a href="${pageContext.request.contextPath}/" 
                 class="px-8 py-3 text-sm font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-300 ease-out active:scale-95 ${param.action ne 'about' and param.action ne 'dashboard' ? 'border-primary text-primary bg-[#c9a227]/[0.05] shadow-[inset_0_-2px_0_0_#c9a227]' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-[#c9a227]/[0.02] hover:border-primary/30'}">
                Racing
              </a>

              <a href="${pageContext.request.contextPath}/MainController?action=about" 
                 class="px-8 py-3 text-sm font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-300 ease-out active:scale-95 ${param.action eq 'about' ? 'border-primary text-primary bg-[#c9a227]/[0.05] shadow-[inset_0_-2px_0_0_#c9a227]' : 'border-transparent text-muted-foreground hover:text-primary hover:bg-[#c9a227]/[0.02] hover:border-primary/30'}">
                About
              </a>
            </div>
          </nav>

          <div class="bg-[#0e0c09] border-b border-border overflow-x-auto scrollbar-hide">
            <div class="max-w-7xl mx-auto px-4 h-[46px] flex items-center gap-3 text-[11px] font-mono text-muted-foreground whitespace-nowrap">
              
              <a href="${pageContext.request.contextPath}/MainController?action=home" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'home' or empty param.action ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="home" style="width: 12px; height: 12px;"></i> Home
              </a>
              
              <c:choose>
                <c:when test="${not empty liveRaces}">
                  <a href="javascript:void(0)" onclick="openWatchLiveModal()" 
                     class="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-red-500 font-bold bg-red-500/10 border-red-500/20 hover:bg-red-500/20 transition-all duration-300 ease-out active:scale-95 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_4px_12px_rgba(239,68,68,0.15)] animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Live
                  </a>
                </c:when>
                <c:otherwise>
                  <a href="javascript:void(0)" onclick="showNoLiveToast()" 
                     class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'live' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                    <i data-lucide="tv" style="width: 12px; height: 12px;"></i> Live
                  </a>
                </c:otherwise>
              </c:choose>
              
              <a href="${pageContext.request.contextPath}/MainController?action=racecard" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'racecard' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="info" style="width: 12px; height: 12px;"></i> Racecard
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=results" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'results' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="award" style="width: 12px; height: 12px;"></i> Results
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=fixtures" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'fixtures' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="calendar" style="width: 12px; height: 12px;"></i> Fixtures
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=statistics" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'statistics' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="bar-chart-3" style="width: 12px; height: 12px;"></i> Statistics
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=horses" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'horses' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="activity" style="width: 12px; height: 12px;"></i> Horses
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=jockeys_owners" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'jockeys_owners' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="users" style="width: 12px; height: 12px;"></i> Jockeys &amp; Horse Owners
              </a>
              
              <a href="${pageContext.request.contextPath}/MainController?action=incident" 
                 class="px-3 py-1.5 rounded-md border transition-all duration-300 ease-out flex items-center gap-1.5 ${param.action eq 'incident' ? 'text-primary bg-[#c9a227]/15 border-[#c9a227]/40 shadow-lg shadow-[#c9a227]/10 font-bold scale-[1.02] -translate-y-0.5' : 'text-muted-foreground bg-[#151310]/40 border-[#c9a227]/5 hover:text-primary hover:bg-[#c9a227]/8 hover:border-[#c9a227]/25 hover:shadow-[0_4px_12px_rgba(201,162,39,0.1)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 active:bg-[#c9a227]/20'}">
                <i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i> Incident Report
              </a>
            </div>
          </div>
        </header>

        <section class="relative overflow-hidden border-b border-border">
          <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${pageContext.request.contextPath}/imports/anhngua1-1.jpg')">
            <div class="absolute inset-0 bg-gradient-to-r from-[#0e0c09] via-[#0e0c09]/80 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0e0c09] via-transparent to-transparent"></div>
          </div>
          <div class="relative max-w-7xl mx-auto px-4 py-14 md:py-20">
            <div class="max-w-2xl">
              <span class="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-sm" style="background: #c9a22722; color: #c9a227">
                <span class="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse"></span> Meeting in progress
              </span>
              <h1 class="font-['Roboto_Slab'] font-bold text-3xl md:text-5xl text-foreground mt-4 leading-tight">
                Royal Ascot · Spring Gold Cup Day
              </h1>
              <p class="text-sm md:text-base text-muted-foreground mt-3">
                10 races · turf · firm going · total prize fund $3.4M
              </p>
              <div class="flex flex-wrap gap-3 mt-6">
                <c:choose>
                  <c:when test="${not empty liveRaces}">
                    <a href="javascript:void(0)" onclick="openWatchLiveModal()" id="heroWatchLiveBtn" class="px-5 py-2.5 text-sm font-mono bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow-lg shadow-red-600/30 transition-all transform hover:scale-105 flex items-center gap-2 animate-pulse-red cursor-pointer">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      🔴 WATCH LIVE
                    </a>
                  </c:when>
                  <c:otherwise>
                    <!-- Không có trận nào đang live -->
                    <a href="javascript:void(0)" onclick="showNoLiveToast()" id="heroWatchLiveBtn" class="px-5 py-2.5 text-sm font-mono bg-card/60 backdrop-blur border border-red-600/30 hover:border-red-600/50 text-[#ef4444] rounded transition-colors flex items-center gap-2 cursor-pointer">
                      🔴 WATCH LIVE
                    </a>
                  </c:otherwise>
                </c:choose>
                <a href="${pageContext.request.contextPath}/MainController?action=racecard" class="px-5 py-2.5 text-sm font-mono bg-card/60 backdrop-blur border border-border text-foreground hover:bg-muted/40 rounded transition-colors">
                  View Racecard
                </a>
              </div>
            </div>
          </div>
        </section>

        <section class="max-w-7xl mx-auto px-4 py-10">
            <c:choose>
                <%-- 1. TRANG CHỦ / HOME WORKFLOW --%>
                <c:when test="${param.action eq 'home' or empty param.action}">
                  <h2 class="text-foreground font-bold font-['Roboto_Slab'] text-2xl mb-4">Welcome to Horse Race Management System</h2>
                  <p class="text-muted-foreground mb-8">Select an option from the menu to get started.</p>
                  
                  <div class="mb-10">
                    <h3 class="text-primary font-bold font-mono text-xl mb-4 uppercase tracking-wider border-b border-border pb-2">Active Seasons</h3>
                    <c:choose>
                        <c:when test="${empty activeSeasons}">
                            <p class="text-muted-foreground text-sm font-mono italic">No active seasons currently available.</p>
                        </c:when>
                        <c:otherwise>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <c:forEach var="season" items="${activeSeasons}">
                                    <div class="bg-card/40 border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
                                        <div class="flex justify-between items-start mb-3">
                                            <h4 class="text-foreground font-bold font-['Roboto_Slab']">${season.name}</h4>
                                            <span class="text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded" style="background: rgba(74,157,111,0.15); color: #4a9d6f;">Active</span>
                                        </div>
                                        <p class="text-xs text-muted-foreground font-mono">
                                            <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px;"></i>
                                            <fmt:formatDate value="${season.startDate}" pattern="dd/MM/yyyy" /> to <fmt:formatDate value="${season.endDate}" pattern="dd/MM/yyyy" />
                                        </p>
                                    </div>
                                </c:forEach>
                            </div>
                        </c:otherwise>
                    </c:choose>
                  </div>

                  <div class="mb-10">
                    <h3 class="text-primary font-bold font-mono text-xl mb-4 uppercase tracking-wider border-b border-border pb-2">Upcoming Race Meetings</h3>
                    <c:choose>
                        <c:when test="${empty upcomingMeetings}">
                            <p class="text-muted-foreground text-sm font-mono italic">No upcoming meetings scheduled.</p>
                        </c:when>
                        <c:otherwise>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <c:forEach var="meeting" items="${upcomingMeetings}">
                                    <div class="bg-card/40 border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
                                        <div class="flex justify-between items-start mb-3">
                                            <h4 class="text-foreground font-bold font-['Roboto_Slab']">${meeting.name}</h4>
                                        </div>
                                        <p class="text-xs text-muted-foreground font-mono mb-2">
                                            <i data-lucide="map-pin" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px;"></i>
                                            Venue: ${meeting.venue}
                                        </p>
                                        <p class="text-xs text-muted-foreground font-mono mb-2">
                                            <i data-lucide="calendar" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px;"></i>
                                            Date: <fmt:formatDate value="${meeting.startDate}" pattern="dd/MM/yyyy HH:mm" />
                                        </p>
                                        <p class="text-xs text-muted-foreground font-mono">
                                            <i data-lucide="dollar-sign" style="width: 12px; height: 12px; display: inline-block; margin-right: 4px;"></i>
                                            Budget: $<fmt:formatNumber value="${meeting.totalBudget}" type="number" maxFractionDigits="0"/>
                                        </p>
                                    </div>
                                </c:forEach>
                            </div>
                        </c:otherwise>
                    </c:choose>
                  </div>
                </c:when>

                <%-- 2. ĐƯỜNG DẪN KẾT NỐI TOÀN BỘ FILE JSP CON TRONG THƯ MỤC COMPONENTS --%>
                <c:when test="${param.action eq 'about'}">
                    <jsp:include page="/WEB-INF/dashboards/components/About.jsp" />
                </c:when>

                <c:when test="${param.action eq 'racecard'}">
                    <jsp:include page="/WEB-INF/dashboards/components/Racecard.jsp" />
                </c:when>

                <c:when test="${param.action eq 'results'}">
                    <jsp:include page="/WEB-INF/dashboards/components/results.jsp" />
                </c:when>

                <c:when test="${param.action eq 'fixtures'}">
                    <jsp:include page="/WEB-INF/dashboards/components/Fixtures.jsp" />
                </c:when>

                <c:when test="${param.action eq 'statistics'}">
                    <jsp:include page="/WEB-INF/dashboards/components/Statistics.jsp" />
                </c:when>

                <c:when test="${param.action eq 'horses'}">
                    <jsp:include page="/WEB-INF/dashboards/components/Horses.jsp" />
                </c:when>

                <c:when test="${param.action eq 'jockeys_owners'}">
                    <jsp:include page="/WEB-INF/dashboards/components/JockeysHorseOwners.jsp" />
                </c:when>

                <c:when test="${param.action eq 'incident'}">
                    <jsp:include page="/WEB-INF/dashboards/components/IncidentReport.jsp" />
                </c:when>

                <%-- FALLBACK TRƯỜNG HỢP NGOẠI LỆ --%>
                <c:otherwise>
                    <div class="rounded-xl border p-12 text-center" style="background: rgba(255,255,255,0.01); border-color: rgba(255,255,255,0.05)">
                        <i data-lucide="database" class="mx-auto mb-4 text-[#c9a227]" style="width: 32px; height: 32px;"></i>
                        <h3 class="font-bold text-base mb-1 font-['Roboto_Slab'] capitalize">${fn:replace(param.action, '_', ' ')} Section</h3>
                        <p class="text-zinc-500 font-mono text-xs">Connecting to secure racing server repository database...</p>
                    </div>
                </c:otherwise>
            </c:choose>
        </section>

        <%-- ========== WATCH LIVE SELECTION MODAL ========== --%>
        <c:if test="${not empty liveRaces}">
        <div id="watchLiveModal" class="fixed inset-0 z-[9999] hidden">
          <%-- Backdrop --%>
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeWatchLiveModal()"></div>
          <%-- Modal Content --%>
          <div class="absolute inset-0 flex items-center justify-center p-4">
            <div class="relative w-full max-w-lg rounded-2xl border overflow-hidden" style="background: #121010; border-color: rgba(201,162,39,0.18); box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,162,39,0.06)">
              <%-- Header --%>
              <div class="flex items-center justify-between px-6 py-5 border-b" style="border-color: rgba(255,255,255,0.06); background: rgba(201,162,39,0.03)">
                <div class="flex items-center gap-3">
                  <span class="relative flex h-3 w-3">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <div>
                    <h3 class="font-['Roboto_Slab'] font-bold text-base text-[#f4f2ec]">Select Live Race</h3>
                    <p class="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">${liveRaces.size()} races currently broadcasting</p>
                  </div>
                </div>
                <button onclick="closeWatchLiveModal()" class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5">
                  <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
              <%-- Race List --%>
              <div class="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <c:forEach var="lr" items="${liveRaces}" varStatus="idx">
                  <div class="rounded-xl border p-4 flex items-center justify-between transition-all" 
                       style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.06);"
                       onmouseover="this.style.borderColor='rgba(201,162,39,0.3)'; this.style.background='rgba(201,162,39,0.04)';" 
                       onmouseout="this.style.borderColor='rgba(255,255,255,0.06)'; this.style.background='rgba(255,255,255,0.015)';">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-mono font-bold shrink-0" style="background: rgba(229,62,62,0.12); color: #ef4444;">
                        R${lr.id}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold text-[#f4f2ec] flex items-center gap-2">
                          ${lr.classLevel} (Race #${lr.id})
                        </p>
                        <p class="text-[11px] font-mono text-muted-foreground mt-1 flex flex-col gap-0.5 truncate">
                          <span class="text-[#c9a227] font-semibold truncate">
                            <c:forEach var="meeting" items="${meetings}">
                              <c:if test="${meeting.id eq lr.raceMeetingId}">
                                ${meeting.name}
                              </c:if>
                            </c:forEach>
                          </span>
                          <span class="text-[10px] text-muted-foreground/80">
                            <c:if test="${not empty lr.distanceMeters}">${lr.distanceMeters}m</c:if>
                            <c:if test="${not empty lr.trackType}"> · ${lr.trackType}</c:if>
                          </span>
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 shrink-0 ml-4">
                      <span class="text-[9px] font-mono uppercase tracking-widest text-red-500 font-bold animate-pulse flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> LIVE
                      </span>
                      <c:choose>
                        <c:when test="${not empty sessionScope.user}">
                          <a href="${lr.youtubeLiveUrl}" target="_blank" onclick="closeWatchLiveModal()"
                             class="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-[11px] font-bold rounded-lg transition-colors shadow-md shadow-red-600/20 active:scale-95 flex items-center gap-1">
                            Start Watching
                          </a>
                        </c:when>
                        <c:otherwise>
                          <a href="${pageContext.request.contextPath}/MainController?action=loginPage" onclick="closeWatchLiveModal()"
                             class="px-3.5 py-1.5 bg-[#c9a227] hover:bg-[#b08e22] text-black font-mono text-[11px] font-bold rounded-lg transition-colors shadow-md active:scale-95 flex items-center gap-1">
                            Login to Watch
                          </a>
                        </c:otherwise>
                      </c:choose>
                    </div>
                  </div>
                </c:forEach>
              </div>
              <%-- Footer --%>
              <div class="px-6 py-3 border-t flex items-center justify-between" style="border-color: rgba(255,255,255,0.06); background: rgba(0,0,0,0.2)">
                <p class="text-[10px] font-mono text-muted-foreground">
                  <c:choose>
                    <c:when test="${not empty sessionScope.user}">Click Start Watching to open YouTube in a new tab</c:when>
                    <c:otherwise>Please log in to access live race broadcasts</c:otherwise>
                  </c:choose>
                </p>
                <button onclick="closeWatchLiveModal()" class="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>

        <script>
          function openWatchLiveModal() {
            document.getElementById('watchLiveModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            // Re-render lucide icons inside modal
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          function closeWatchLiveModal() {
            document.getElementById('watchLiveModal').classList.add('hidden');
            document.body.style.overflow = '';
          }
          // Close modal on Escape key
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeWatchLiveModal();
          });
        </script>
        </c:if>

        <%-- ========== NO LIVE TOAST NOTIFICATION ========== --%>
        <div id="noLiveToast" class="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] hidden">
          <div class="flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl" style="background: #1a1715; border-color: rgba(201,162,39,0.2); box-shadow: 0 20px 40px rgba(0,0,0,0.5)">
            <span style="font-size: 20px;">📺</span>
            <div>
              <p id="noLiveToast-title" class="text-sm font-semibold text-[#f4f2ec]">No Live Broadcast</p>
              <p id="noLiveToast-desc" class="text-[11px] font-mono text-muted-foreground mt-0.5">No races are currently taking place.</p>
            </div>
            <button onclick="hideNoLiveToast()" class="ml-3 text-muted-foreground hover:text-foreground transition-colors">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <script>
          var noLiveToastTimer;
          function showNoLiveToast() {
            var toast = document.getElementById('noLiveToast');
            if (toast) {
              toast.classList.remove('hidden');
              if (typeof lucide !== 'undefined') lucide.createIcons();
              clearTimeout(noLiveToastTimer);
              noLiveToastTimer = setTimeout(function() {
                toast.classList.add('hidden');
              }, 4000);
            }
          }
          function hideNoLiveToast() {
            clearTimeout(noLiveToastTimer);
            const toast = document.getElementById('noLiveToast');
            if (toast) toast.classList.add('hidden');
          }

          // Click-to-toggle Language Dropdown
          function toggleLangDropdown(e) {
            if (e) e.stopPropagation();
            const langDropdown = document.getElementById('lang-dropdown');
            if (langDropdown) {
              langDropdown.classList.toggle('hidden');
            }
          }

          function closeLangDropdown() {
            const langDropdown = document.getElementById('lang-dropdown');
            if (langDropdown) langDropdown.classList.add('hidden');
          }

          function changeLang(code, label) {
            localStorage.setItem('lang-selected', code);
            const langLabel = document.getElementById('lang-label');
            if (langLabel) langLabel.innerText = label;
            applyTranslations(code);
          }

          // Serialized Database Lists
          const searchMeetings = [
            <c:forEach var="m" items="${meetings}" varStatus="loop">
              {
                id: ${m.id},
                name: `${fn:escapeXml(m.name)}`,
                venue: `${fn:escapeXml(m.venue)}`,
                totalBudget: ${m.totalBudget != null ? m.totalBudget : 0},
                startDate: `${m.startDate}`
              }${!loop.last ? ',' : ''}
            </c:forEach>
          ];

          const searchHorses = [
            <c:forEach var="h" items="${allHorses}" varStatus="loop">
              {
                id: ${h.id},
                name: `${fn:escapeXml(h.name)}`,
                breed: `${fn:escapeXml(h.breed)}`,
                rating: ${h.currentRating != null ? h.currentRating : 0},
                ownerId: ${h.ownerId != null ? h.ownerId : 0}
              }${!loop.last ? ',' : ''}
            </c:forEach>
          ];

          const searchRaces = [
            <c:forEach var="r" items="${allRaces}" varStatus="loop">
              {
                id: ${r.id},
                raceMeetingId: ${r.raceMeetingId},
                classLevel: `${fn:escapeXml(r.classLevel)}`,
                distanceMeters: ${r.distanceMeters != null ? r.distanceMeters : 0},
                trackType: `${fn:escapeXml(r.trackType)}`,
                status: `${fn:escapeXml((r.status eq 'DECLARATION_OPEN' or r.status eq 'DECLARATION_CLOSED') ? 'SCHEDULED' : r.status)}`,
                startTime: `${r.startTime}`
              }${!loop.last ? ',' : ''}
            </c:forEach>
          ];

          // Articles & Guides mock database
          const searchArticles = [
            {
              id: 'rules-2026',
              title: {
                en: 'Official Racing Rules & Regulations 2026',
                vi: 'Quy định & Luật Đua ngựa Chính thức 2026',
                zh: '2026年官方赛马规则与条例',
                ja: '2026年公式競馬規則・規定'
              },
              desc: {
                en: 'A comprehensive guide to safety checks, weight limits, and steward rulings.',
                vi: 'Hướng dẫn toàn diện về kiểm tra an toàn, giới hạn cân nặng và phán quyết của trọng tài.',
                zh: '关于安全检查、重量限制和干事裁决的综合指南。',
                ja: '安全検査、重量制限、および裁決委員の決定に関する包括的なガイド。'
              },
              content: {
                en: '<p class="font-bold text-[#c9a227] mb-2">Section 1: General Conduct</p><p class="mb-4">All horses must undergo a veterinary check-up 60 minutes before the start of the race. Jockeys must wear approved protective vests and helmets at all times.</p><p class="font-bold text-[#c9a227] mb-2">Section 2: Weight Restrictions</p><p class="mb-4">Standard carrying weight is determined based on horse age and classification. Handicappers may assign penalty weight for previous wins.</p><p class="font-bold text-[#c9a227] mb-2">Section 3: Stewards & Violations</p><p>Stewards have the right to inspect race videos and suspend license for dangerous riding or illegal substances.</p>',
                vi: '<p class="font-bold text-[#c9a227] mb-2">Phần 1: Quy tắc chung</p><p class="mb-4">Tất cả ngựa phải qua kiểm tra thú y 60 phút trước cuộc đua. Nài ngựa bắt buộc phải mặc áo bảo hộ và đội mũ bảo hiểm đã qua phê duyệt mọi lúc.</p><p class="font-bold text-[#c9a227] mb-2">Phần 2: Giới hạn trọng lượng</p><p class="mb-4">Trọng lượng mang vác tiêu chuẩn được tính dựa trên tuổi và phân hạng của ngựa. Trọng tài có thể chỉ định thêm khối lượng phạt nếu thắng trận trước.</p><p class="font-bold text-[#c9a227] mb-2">Phần 3: Trọng tài & Vi phạm</p><p>Hội đồng trọng tài có quyền kiểm tra video cuộc đua và đình chỉ giấy phép nếu nài ngựa lái xe nguy hiểm hoặc dùng chất cấm.</p>',
                zh: '<p class="font-bold text-[#c9a227] mb-2">第一部分：一般行为准则</p><p class="mb-4">所有马匹必须在比赛前60分钟接受兽医检查。骑师在任何时候都必须佩戴经批准的防护防护服和头盔。</p><p class="font-bold text-[#c9a227] mb-2">第二部分：重量限制</p><p class="mb-4">标准负重根据马匹年龄和级别确定。评磅员可能会因之前的胜利分配惩罚重量。</p><p class="font-bold text-[#c9a227] mb-2">第三部分：赛事干事与违规行为</p><p>赛事干事有权检查比赛视频，并因危险骑乘或违禁物质暂停执照。</p>',
                ja: '<p class="font-bold text-[#c9a227] mb-2">第1節：一般的な行動基準</p><p class="mb-4">すべての競走馬は、レース開始60分前に獣医の検査を受けなければなりません。ジョッキーは常に承認された保護ベストとヘルメットを着用する必要があります。</p><p class="font-bold text-[#c9a227] mb-2">第2節：斤量制限</p><p class="mb-4">標準負担重量は、馬の年齢とクラスに基づいて決定されます。ハンデキャッパーは前走の勝利に対してペナルティ斤量を課すことができます。</p><p class="font-bold text-[#c9a227] mb-2">第3節：裁決委員と反則</p><p>裁決委員はレース映像を検証し、危険な騎乗や禁止薬物の使用に対して免許を停止する権限を有します。</p>'
              }
            },
            {
              id: 'ratings-guide',
              title: {
                en: 'Guide to Thoroughbred Horse Ratings',
                vi: 'Hướng dẫn về Xếp hạng Ngựa Thuần chủng',
                zh: '纯血马评级指南',
                ja: 'サラブレッド・レーティングガイド'
              },
              desc: {
                en: 'Understand how handicap ratings and class levels affect race entries.',
                vi: 'Tìm hiểu cách xếp hạng chấp và phân hạng ảnh hưởng đến việc đăng ký thi đấu.',
                zh: '了解让磅评级和赛事级别如何影响参赛资格。',
                ja: 'ハンデキャップ評価とクラス分けがレース登録にどのように影響するかを解説。'
              },
              content: {
                en: '<p class="font-bold text-[#c9a227] mb-2">1. The Rating System</p><p class="mb-4">Ratings are values between 0 and 120 indicating a horse\'s racing strength. A rating of 90+ denotes exceptional Class 1 quality.</p><p class="font-bold text-[#c9a227] mb-2">2. Class Categories</p><ul class="list-disc pl-5 mb-4 space-y-1"><li>Class 1: Rating 85+ (Stakes, Cups)</li><li>Class 2: Rating 70-85</li><li>Class 3: Rating 55-70</li><li>Class 4: Rating 40-55</li><li>Class 5: Rating under 40</li></ul><p class="font-bold text-[#c9a227] mb-2">3. Entry Requirements</p><p>Horses can only register for races that match their ratings range to ensure fair competition.</p>',
                vi: '<p class="font-bold text-[#c9a227] mb-2">1. Hệ thống xếp hạng</p><p class="mb-4">Xếp hạng là các giá trị từ 0 đến 120 cho biết sức mạnh thi đấu của ngựa. Điểm số từ 90 trở lên tượng trưng cho đẳng cấp Hạng 1 vượt trội.</p><p class="font-bold text-[#c9a227] mb-2">2. Phân nhóm Hạng</p><ul class="list-disc pl-5 mb-4 space-y-1"><li>Hạng 1: Xếp hạng 85+ (Cúp quốc gia)</li><li>Hạng 2: Xếp hạng 70-85</li><li>Hạng 3: Xếp hạng 55-70</li><li>Hạng 4: Xếp hạng 40-55</li><li>Hạng 5: Xếp hạng dưới 40</li></ul><p class="font-bold text-[#c9a227] mb-2">3. Yêu cầu tham gia</p><p>Ngựa chỉ được đăng ký các trận đấu phù hợp với phạm vi xếp hạng của mình để đảm bảo cạnh tranh công bằng.</p>',
                zh: '<p class="font-bold text-[#c9a227] mb-2">1. 评分系统</p><p class="mb-4">评分是介于0到120之间的数值，表示马匹的竞赛实力。90分以上的评分代表杰出的级别 1 品质。</p><p class="font-bold text-[#c9a227] mb-2">2. 赛事级别划分</p><ul class="list-disc pl-5 mb-4 space-y-1"><li>级别 1: 评分 85+（杯赛、锦标赛）</li><li>级别 2: 评分 70-85</li><li>级别 3: 评分 55-70</li><li>级别 4: 评分 40-55</li><li>级别 5: 评分 40以下</li></ul><p class="font-bold text-[#c9a227] mb-2">3. 报名要求</p><p>马匹只能报名参加符合其评分范围的比赛，以确保公平竞争。</p>',
                ja: '<p class="font-bold text-[#c9a227] mb-2">1. レーティング制度について</p><p class="mb-4">レーティングは、馬の競走能力を示す0から120までの数値です。90以上は極めて優秀なクラス 1 の実力を有することを示します。</p><p class="font-bold text-[#c9a227] mb-2">2. クラスの分類</p><ul class="list-disc pl-5 mb-4 space-y-1"><li>クラス 1: レーティング 85以上 (重賞・特別レース)</li><li>クラス 2: レーティング 70-85</li><li>クラス 3: レーティング 55-70</li><li>クラス 4: レーティング 40-55</li><li>クラス 5: レーティング 40未満</li></ul><p class="font-bold text-[#c9a227] mb-2">3. 出走条件</p><p>公平な競争を担保するため、競走馬は自身のレーティング範囲と合致するレースにのみ登録できます。</p>'
              }
            },
            {
              id: 'odds-guide',
              title: {
                en: 'A Beginner\'s Guide to Racing Form & Odds',
                vi: 'Hướng dẫn cho Người mới về Phong độ & Tỷ lệ cược',
                zh: '赛马表与赔率新手指南',
                ja: '競馬の出馬表とオッズの初心者ガイド'
              },
              desc: {
                en: 'How to read odds and track performance indicators like a pro.',
                vi: 'Cách đọc tỷ lệ cược và theo dõi các chỉ số phong độ chuyên nghiệp.',
                zh: '如何像专业人士一样看懂赔率并跟踪马匹表现指标。',
                ja: 'オッズの見方や競走成績の指標をプロのように分析する方法。'
              },
              content: {
                en: '<p class="font-bold text-[#c9a227] mb-2">1. Understanding the Odds</p><p class="mb-4">Odds express the probability of winning. If a horse has odds of 3.50, a winning $10 bet returns $35. Lower odds represent favorites.</p><p class="font-bold text-[#c9a227] mb-2">2. Reading Recent Form</p><p class="mb-4">Recent form displays finishing positions from recent races, read left to right. For example, "1-2-F" means the horse won the race before last, placed 2nd in the last race, and failed to finish in the most recent.</p><p class="font-bold text-[#c9a227] mb-2">3. Track Conditions</p><p>Always verify the track condition. Some horses excel on firm turf, while others prefer wet or soft going.</p>',
                vi: '<p class="font-bold text-[#c9a227] mb-2">1. Hiểu về tỷ lệ cược</p><p class="mb-4">Tỷ lệ cược biểu thị xác suất thắng cuộc. Nếu ngựa có tỷ lệ 3.50, đặt cược $10 thắng sẽ thu về $35. Tỷ lệ cược càng thấp nghĩa là ngựa đó được đánh giá càng cao.</p><p class="font-bold text-[#c9a227] mb-2">2. Cách đọc phong độ gần đây</p><p class="mb-4">Phong độ hiển thị thứ hạng về đích từ các trận gần nhất, đọc từ trái qua phải. Ví dụ: "1-2-F" nghĩa là trận trước nữa về nhất, trận trước về nhì, và trận gần nhất không hoàn thành (F - Failed).</p><p class="font-bold text-[#c9a227] mb-2">3. Điều kiện mặt sân</p><p>Luôn kiểm tra điều kiện đường đua. Một số ngựa chạy tốt trên cỏ khô cứng, trong khi một số khác thích nghi tốt hơn với đường đua lầy lội hoặc mềm ẩm.</p>',
                zh: '<p class="font-bold text-[#c9a227] mb-2">1. 理解赔率</p><p class="mb-4">赔率表达了获胜的概率。如果一匹马的赔率是3.50，赢得10美元的投注将收回35美元。较低的赔率代表热门马匹。</p><p class="font-bold text-[#c9a227] mb-2">2. 阅读近期表现（Form）</p><p class="mb-4">近期表现显示了马匹在最近比赛中的完赛位置，从左向右阅读。例如，“1-2-F”意味着马匹在前前场获得第一，前场获得第二，而最近一场未能完赛。</p><p class="font-bold text-[#c9a227] mb-2">3. 赛道状况</p><p>一定要确认赛道状况。有些马匹在坚硬的草地上表现出色，而另一些则更喜欢潮湿或柔软的场地。</p>',
                ja: '<p class="font-bold text-[#c9a227] mb-2">1. オッズの仕組み</p><p class="mb-4">オッズは勝利確率を示します。オッズが3.50の場合、10ドルの賭け金が的中すると35ドル戻ってきます。オッズが低い馬ほど本命（人気馬）です。</p><p class="font-bold text-[#c9a227] mb-2">2. 近走成績（馬柱）の読み方</p><p class="mb-4">近走成績は最近の着順を左から右に示します。例えば「1-2-F」は、前々走が1着、前走が2着、直近のレースで競走中止（F）したことを意味します。</p><p class="font-bold text-[#c9a227] mb-2">3. 馬場状態の影響</p><p>常に馬場状態（良・稍重・重・不良など）を確認してください。良馬場の芝が得意な馬もいれば、湿った重馬場が得意な馬もいます。</p>'
              }
            },
            {
              id: 'safety-integrity',
              title: {
                en: 'Safety & Integrity in Professional Horse Racing',
                vi: 'An toàn & Liêm chính trong Đua ngựa Chuyên nghiệp',
                zh: '职业赛马的安全与廉洁',
                ja: 'プロ競馬における安全と公正性'
              },
              desc: {
                en: 'How modern regulatory bodies enforce fair play and protect animal welfare.',
                vi: 'Cách các cơ quan quản lý thực thi luật chơi công bằng và bảo vệ động vật.',
                zh: '现代监管机构如何执行公平竞争并保护动物福利。',
                ja: '現代の規制機関がどのように公平なルールを執行し、動物愛護を徹底しているかを解説。'
              },
              content: {
                en: '<p class="font-bold text-[#c9a227] mb-2">1. Strict Anti-Doping</p><p class="mb-4">All competitors are subject to random testing. Pre-race blood tests and post-race urine tests ensure zero tolerance for performance-enhancing substances.</p><p class="font-bold text-[#c9a227] mb-2">2. Steward Inspections</p><p class="mb-4">A panel of certified referees watches every angle using high-definition camera arrays. Infractions like blocking or excessive whip use result in instant disqualifications.</p><p class="font-bold text-[#c9a227] mb-2">3. Medical and Vet Infrastructure</p><p>On-site veterinary teams and equine ambulances stand ready to respond to incidents immediately. Track safety barriers are designed to absorb impact.</p>',
                vi: '<p class="font-bold text-[#c9a227] mb-2">1. Chống Doping Nghiêm ngặt</p><p class="mb-4">Tất cả các đối thủ cạnh tranh đều phải trải qua kiểm tra ngẫu nhiên. Xét nghiệm máu trước trận đấu và xét nghiệm nước tiểu sau trận đấu đảm bảo không khoan nhượng với chất kích thích hiệu suất.</p><p class="font-bold text-[#c9a227] mb-2">2. Kiểm tra của Trọng tài</p><p class="mb-4">Ban trọng tài được chứng nhận theo dõi mọi góc độ thông qua hệ thống camera độ phân giải cao. Các vi phạm như cản trở hoặc lạm dụng roi quá mức sẽ bị loại trực tiếp.</p><p class="font-bold text-[#c9a227] mb-2">3. Cơ sở hạ tầng Y tế và Thú y</p><p>Các đội ngũ thú y tại hiện trường và xe cứu thương cho ngựa luôn sẵn sàng ứng phó sự cố ngay lập tức. Rào cản an toàn đường đua được thiết kế để hấp thụ lực va chạm tốt.</p>',
                zh: '<p class="font-bold text-[#c9a227] mb-2">1. 严格反兴奋剂检查</p><p class="mb-4">所有参赛马匹均须接受抽样测试。赛前血液检查和赛后尿液检查确保对任何增强体能的药物零容忍。</p><p class="font-bold text-[#c9a227] mb-2">2. 赛事干事监督</p><p class="mb-4">持证干事小组通过高清晰度多机位系统监控比赛每一个角度。阻挡其他马匹或过度使用马鞭等违规行为会导致立即取消资格。</p><p class="font-bold text-[#c9a227] mb-2">3. 医疗与兽医保障</p><p>现场兽医团队和赛马救护车随时待命以便立刻应对突发事件。赛道安全护栏经过特别设计以吸收冲击力。</p>',
                ja: '<p class="font-bold text-[#c9a227] mb-2">1. 厳格な薬物検査</p><p class="mb-4">すべての出走馬はランダムな検査を受けます。レース前の血液検査およびレース後の尿検査により、薬物使用に対する厳格な方針が適用されます。</p><p class="font-bold text-[#c9a227] mb-2">2. 裁決委員による監視</p><p class="mb-4">公認された審判チームが、高精細カメラを用いてあらゆる角度からレースを監視します。進路妨害や過度なムチの使用などは即座に処分の対象となります。</p><p class="font-bold text-[#c9a227] mb-2">3. 医療と獣医体制</p><p>現場の獣医師チームと競走馬専用救急車が即時の対応に対応できるよう待機しています。コース上の安全フェンスは衝撃を吸収する設計です。</p>'
              }
            }
          ];

          // Search Dropdown implementation
          document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('search-input');
            const searchDropdown = document.getElementById('search-results-dropdown');
            const contextPath = '${pageContext.request.contextPath}';

            if (!searchInput || !searchDropdown) return;

            searchInput.addEventListener('input', function() {
              const query = this.value.trim().toLowerCase();
              if (query.length < 1) {
                searchDropdown.innerHTML = '';
                searchDropdown.classList.add('hidden');
                return;
              }

              const currentLang = localStorage.getItem('lang-selected') || 'en';

              // 1. Matches for Race Meetings & Scheduled Races
              const matchedRaces = [];
              // For meetings
              searchMeetings.forEach(m => {
                if (m.name.toLowerCase().includes(query) || m.venue.toLowerCase().includes(query)) {
                  matchedRaces.push({
                    type: 'meeting',
                    title: m.name,
                    sub: m.venue + ' · ' + m.startDate,
                    url: contextPath + '/MainController?action=racecard&meetingId=' + m.id
                  });
                }
              });
              // For scheduled races
              searchRaces.forEach(r => {
                if (r.status === 'SCHEDULED' || r.status === 'RUNNING') {
                  const mName = getMeetingName(r.raceMeetingId);
                  if (r.classLevel.toLowerCase().includes(query) || mName.toLowerCase().includes(query)) {
                    matchedRaces.push({
                      type: 'race',
                      title: r.classLevel + ' (Race #' + r.id + ')',
                      sub: mName + ' · ' + r.distanceMeters + 'm · ' + r.trackType,
                      url: contextPath + '/MainController?action=racecard&meetingId=' + r.raceMeetingId + '&raceId=' + r.id
                    });
                  }
                }
              });

              // 2. Matches for Horses
              const matchedHorses = [];
              searchHorses.forEach(h => {
                if (h.name.toLowerCase().includes(query) || h.breed.toLowerCase().includes(query)) {
                  matchedHorses.push({
                    title: h.name,
                    sub: h.breed + ' · Rating: ' + h.rating,
                    url: contextPath + '/MainController?action=horses&horseId=' + h.id
                  });
                }
              });

              // 3. Matches for Race Results
              const matchedResults = [];
              searchRaces.forEach(r => {
                if (r.status === 'FINISHED' || r.status === 'OFFICIAL') {
                  const mName = getMeetingName(r.raceMeetingId);
                  if (r.classLevel.toLowerCase().includes(query) || mName.toLowerCase().includes(query)) {
                    matchedResults.push({
                      title: r.classLevel + ' (Race #' + r.id + ')',
                      sub: mName + ' · ' + r.distanceMeters + 'm · Result: ' + r.status,
                      url: contextPath + '/MainController?action=results&meetingId=' + r.raceMeetingId + '&raceId=' + r.id
                    });
                  }
                }
              });

              // 4. Matches for Articles & Guides
              const matchedArticles = [];
              searchArticles.forEach(art => {
                const titleStr = art.title[currentLang] || art.title['en'];
                const descStr = art.desc[currentLang] || art.desc['en'];
                if (titleStr.toLowerCase().includes(query) || descStr.toLowerCase().includes(query)) {
                  matchedArticles.push({
                    id: art.id,
                    title: titleStr,
                    sub: descStr
                  });
                }
              });

              // Render Results
              renderSearchDropdown(matchedRaces, matchedHorses, matchedResults, matchedArticles, currentLang);
            });

            function getMeetingName(mId) {
              const m = searchMeetings.find(x => x.id === mId);
              return m ? m.name : '';
            }

            // Headers & labels mapping
            const searchLabels = {
              en: {
                races: 'Race Meetings & Races',
                horses: 'Horses',
                results: 'Race Results',
                articles: 'Articles & Guides',
                noResults: 'No results found'
              },
              vi: {
                races: 'Thông tin về các trận đua',
                horses: 'Thông tin về ngựa',
                results: 'Kết quả đua ngựa',
                articles: 'Các bài viết và hướng dẫn',
                noResults: 'Không tìm thấy kết quả'
              },
              zh: {
                races: '赛事与日程信息',
                horses: '马匹信息',
                results: '赛事结果',
                articles: '文章与指南',
                noResults: '未找到结果'
              },
              ja: {
                races: 'レース＆日程情報',
                horses: '競走馬情報',
                results: 'レース結果',
                articles: '記事＆ガイド',
                noResults: '結果が見つかりません'
              }
            };

            function renderSearchDropdown(races, horses, results, articles, lang) {
              const labels = searchLabels[lang] || searchLabels['en'];
              let html = '';

              const hasRaces = races.length > 0;
              const hasHorses = horses.length > 0;
              const hasResults = results.length > 0;
              const hasArticles = articles.length > 0;

              if (!hasRaces && !hasHorses && !hasResults && !hasArticles) {
                html = `<div class="px-4 py-3 text-xs text-muted-foreground italic font-mono">${labels.noResults}</div>`;
                searchDropdown.innerHTML = html;
                searchDropdown.classList.remove('hidden');
                return;
              }

              // Category 1: Races
              if (hasRaces) {
                html += `<div class="font-mono text-[9px] text-[#c9a227] uppercase tracking-wider px-4 py-1.5 bg-[#1f1d1a]/50 border-y border-[#2a2825]/30 mt-2 first:mt-0">${labels.races}</div>`;
                races.slice(0, 3).forEach(item => {
                  html += `<a href="${item.url}" class="px-4 py-2 hover:bg-[#c9a227]/10 flex items-center justify-between text-xs text-foreground transition-colors group">
                    <span class="truncate pr-3 font-semibold group-hover:text-[#c9a227]">${item.title}</span>
                    <span class="text-[10px] font-mono text-muted-foreground shrink-0">${item.sub}</span>
                  </a>`;
                });
              }

              // Category 2: Horses
              if (hasHorses) {
                html += `<div class="font-mono text-[9px] text-[#c9a227] uppercase tracking-wider px-4 py-1.5 bg-[#1f1d1a]/50 border-y border-[#2a2825]/30 mt-2 first:mt-0">${labels.horses}</div>`;
                horses.slice(0, 3).forEach(item => {
                  html += `<a href="${item.url}" class="px-4 py-2 hover:bg-[#c9a227]/10 flex items-center justify-between text-xs text-foreground transition-colors group">
                    <span class="truncate pr-3 font-semibold group-hover:text-[#c9a227]">${item.title}</span>
                    <span class="text-[10px] font-mono text-muted-foreground shrink-0">${item.sub}</span>
                  </a>`;
                });
              }

              // Category 3: Results
              if (hasResults) {
                html += `<div class="font-mono text-[9px] text-[#c9a227] uppercase tracking-wider px-4 py-1.5 bg-[#1f1d1a]/50 border-y border-[#2a2825]/30 mt-2 first:mt-0">${labels.results}</div>`;
                results.slice(0, 3).forEach(item => {
                  html += `<a href="${item.url}" class="px-4 py-2 hover:bg-[#c9a227]/10 flex items-center justify-between text-xs text-foreground transition-colors group">
                    <span class="truncate pr-3 font-semibold group-hover:text-[#c9a227]">${item.title}</span>
                    <span class="text-[10px] font-mono text-muted-foreground shrink-0">${item.sub}</span>
                  </a>`;
                });
              }

              // Category 4: Articles
              if (hasArticles) {
                html += `<div class="font-mono text-[9px] text-[#c9a227] uppercase tracking-wider px-4 py-1.5 bg-[#1f1d1a]/50 border-y border-[#2a2825]/30 mt-2 first:mt-0">${labels.articles}</div>`;
                articles.slice(0, 3).forEach(item => {
                  html += `<div onclick="openArticle('${item.id}')" class="px-4 py-2 hover:bg-[#c9a227]/10 flex items-center justify-between text-xs text-foreground transition-colors cursor-pointer group">
                    <span class="truncate pr-3 font-semibold group-hover:text-[#c9a227]">${item.title}</span>
                    <span class="text-[10px] font-mono text-muted-foreground shrink-0 truncate max-w-[200px]">${item.sub}</span>
                  </div>`;
                });
              }

              searchDropdown.innerHTML = html;
              searchDropdown.classList.remove('hidden');
            }

            // Close dropdown on click outside
            document.addEventListener('click', function(e) {
              const searchContainer = document.getElementById('search-container');
              if (searchContainer && !searchContainer.contains(e.target)) {
                searchDropdown.classList.add('hidden');
              }
            });
          });

          // Open article details in modal
          window.openArticle = function(artId) {
            const currentLang = localStorage.getItem('lang-selected') || 'en';
            const art = searchArticles.find(x => x.id === artId);
            if (!art) return;

            const modal = document.getElementById('articleModal');
            const titleEl = document.getElementById('article-modal-title');
            const bodyEl = document.getElementById('article-modal-body');

            if (modal && titleEl && bodyEl) {
              titleEl.innerText = art.title[currentLang] || art.title['en'];
              bodyEl.innerHTML = art.content[currentLang] || art.content['en'];
              modal.classList.remove('hidden');
              document.body.style.overflow = 'hidden';
              if (typeof lucide !== 'undefined') lucide.createIcons();
            }
          };

          window.closeArticleModal = function() {
            const modal = document.getElementById('articleModal');
            if (modal) {
              modal.classList.add('hidden');
              document.body.style.overflow = '';
            }
          };

          function applyTranslations(lang) {
            // 1. Static Dictionary translations
            const dict = {
              'en': {
                'welcome-text': 'Welcome to HorseRace · Royal Ascot meeting in progress',
                'search-input': 'Search horse, jockey, horse owner, race…',
                'dashboard-tab': 'Dashboard',
                'racing-tab': 'Racing',
                'about-tab': 'About',
                'signin-btn': 'Sign in',
                'register-btn': 'Register',
                'noLiveToast-title': 'No Live Broadcast',
                'noLiveToast-desc': 'No races are currently taking place.'
              },
              'vi': {
                'welcome-text': 'Chào mừng đến với HorseRace · Sự kiện Royal Ascot đang diễn ra',
                'search-input': 'Tìm kiếm ngựa, nài ngựa, chủ ngựa, cuộc đua…',
                'dashboard-tab': 'Bảng điều khiển',
                'racing-tab': 'Đua Ngựa',
                'about-tab': 'Giới Thiệu',
                'signin-btn': 'Đăng nhập',
                'register-btn': 'Đăng ký',
                'noLiveToast-title': 'Không có truyền hình trực tiếp',
                'noLiveToast-desc': 'Hiện tại không có cuộc đua nào đang diễn ra.'
              },
              'zh': {
                'welcome-text': '欢迎来到 HorseRace · 皇家阿斯科特赛事正在进行中',
                'search-input': '搜索马匹、骑师、马主、赛事…',
                'dashboard-tab': '控制面板',
                'racing-tab': '赛马',
                'about-tab': '关于',
                'signin-btn': '登录',
                'register-btn': '注册',
                'noLiveToast-title': '暂无直播',
                'noLiveToast-desc': '当前没有任何比赛在进行。'
              },
              'ja': {
                'welcome-text': 'HorseRaceへようこそ · ロイヤルアスコット開催中',
                'search-input': '馬、ジョッキー、馬主、レースを検索…',
                'dashboard-tab': 'ダッシュボード',
                'racing-tab': '競馬',
                'about-tab': '概要',
                'signin-btn': 'ログイン',
                'register-btn': '新規登録',
                'noLiveToast-title': 'ライブ配信はありません',
                'noLiveToast-desc': '現在開催されているレースはありません。'
              }
            };

            const langDict = dict[lang] || dict['en'];
            for (const [id, text] of Object.entries(langDict)) {
              const el = document.getElementById(id);
              if (el) {
                if (el.tagName === 'INPUT') {
                  el.setAttribute('placeholder', text);
                } else {
                  el.innerText = text;
                }
              }
            }

            // 2. Recursive DOM translations for all non-proper names info
            const domTrans = {
              'welcome to horserace · royal ascot meeting in progress': {
                'vi': 'Chào mừng đến với HorseRace · Sự kiện Royal Ascot đang diễn ra',
                'zh': '欢迎来到 HorseRace · 皇家阿斯科特赛事正在进行中',
                'ja': 'HorseRaceへようこそ · ロイヤルアスコット開催中'
              },
              'search horse, jockey, horse owner, race…': {
                'vi': 'Tìm kiếm ngựa, nài ngựa, chủ ngựa, cuộc đua…',
                'zh': '搜索马匹、骑师、马主、赛事…',
                'ja': '馬、ジョッキー、馬主、レースを検索…'
              },
              'dashboard': {
                'vi': 'Bảng điều khiển',
                'zh': '控制面板',
                'ja': 'ダッシュボード'
              },
              'racing': {
                'vi': 'Đua Ngựa',
                'zh': '赛马',
                'ja': '競馬'
              },
              'about': {
                'vi': 'Giới Thiệu',
                'zh': '关于',
                'ja': '概要'
              },
              'home': {
                'vi': 'Trang Chủ',
                'zh': '首页',
                'ja': 'ホーム'
              },
              'live': {
                'vi': 'Trực Tiếp',
                'zh': '直播',
                'ja': 'ライブ'
              },
              'racecard': {
                'vi': 'Chương Trình Đua',
                'zh': '排位表',
                'ja': '出馬表'
              },
              'results': {
                'vi': 'Kết Quả',
                'zh': '赛事结果',
                'ja': 'レース結果'
              },
              'fixtures': {
                'vi': 'Lịch Thi Đấu',
                'zh': '赛程安排',
                'ja': '日程'
              },
              'statistics': {
                'vi': 'Thống Kê',
                'zh': '统计数据',
                'ja': '成績・統計'
              },
              'horses': {
                'vi': 'Ngựa',
                'zh': '马匹',
                'ja': '競走馬'
              },
              'jockeys & horse owners': {
                'vi': 'Nài Ngựa & Chủ Ngựa',
                'zh': '骑师与马主',
                'ja': '骑手＆馬主'
              },
              'incident report': {
                'vi': 'Báo Cáo Sự Cố',
                'zh': '事故报告',
                'ja': 'トラブル報告'
              },
              'sign in': {
                'vi': 'Đăng Nhập',
                'zh': '登录',
                'ja': 'ログイン'
              },
              'register': {
                'vi': 'Đăng Ký',
                'zh': '注册',
                'ja': '新規登録'
              },
              'sign out': {
                'vi': 'Đăng Xuất',
                'zh': '登出',
                'ja': 'ログアウト'
              },
              'meeting in progress': {
                'vi': 'Sự kiện đang diễn ra',
                'zh': '赛事进行中',
                'ja': '開催中'
              },
              'royal ascot · spring gold cup day': {
                'vi': 'Royal Ascot · Ngày Cúp Vàng Mùa Xuân',
                'zh': '皇家阿斯科特 · 春季金杯赛日',
                'ja': 'ロイヤルアスコット · 春季ゴールドカップ開催日'
              },
              '10 races · turf · firm going · total prize fund $3.4m': {
                'vi': '10 cuộc đua · đường cỏ · chạy tốt · tổng quỹ giải thưởng $3.4M',
                'zh': '10 场比赛 · 草地 · 场地良 · 总奖金 $3.4M',
                'ja': '10 レース · 芝 · 良馬場 · 総賞金 $3.4M'
              },
              'watch live': {
                'vi': 'Xem Trực Tiếp',
                'zh': '观看直播',
                'ja': 'ライブ視聴'
              },
              'view racecard': {
                'vi': 'Xem Chương Trình Đua',
                'zh': '查看排位表',
                'ja': '出馬表を見る'
              },
              'read news': {
                'vi': 'Đọc Tin Tức',
                'zh': '阅读新闻',
                'ja': 'ニュースを読む'
              },
              'results & rewards': {
                'vi': 'Kết quả & Phần thưởng',
                'zh': '结果与奖励',
                'ja': '結果と配当'
              },
              'welcome to horse race management system': {
                'vi': 'Chào mừng đến với Hệ thống Quản lý Đua ngựa',
                'zh': '欢迎使用赛马管理系统',
                'ja': '競馬管理システムへようこそ'
              },
              'select an option from the menu to get started.': {
                'vi': 'Chọn một tùy chọn từ menu để bắt đầu.',
                'zh': '从菜单中选择一个选项开始。',
                'ja': 'メニューからオプションを選択して開始してください。'
              },
              'active seasons': {
                'vi': 'Mùa giải đang hoạt động',
                'zh': '进行中赛季',
                'ja': '開催中のシーズン'
              },
              'no active seasons currently available.': {
                'vi': 'Hiện tại không có mùa giải nào đang hoạt động.',
                'zh': '当前无进行中的赛季。',
                'ja': '現在アクティブなシーズンはありません。'
              },
              'upcoming race meetings': {
                'vi': 'Các sự kiện đua sắp tới',
                'zh': '即将进行的赛事',
                'ja': '開催予定のレース'
              },
              'no upcoming meetings scheduled.': {
                'vi': 'Không có sự kiện đua nào sắp tới được lên lịch.',
                'zh': '当前无已排程的赛事。',
                'ja': '開催予定のレースはありません。'
              },
              'active': {
                'vi': 'Hoạt động',
                'zh': '激活',
                'ja': 'アクティブ'
              },
              'inactive': {
                'vi': 'Không hoạt động',
                'zh': '未激活',
                'ja': '非アクティブ'
              },
              'selected': {
                'vi': 'Đã chọn',
                'zh': '已选择',
                'ja': '選択済み'
              },
              'finished': {
                'vi': 'Đã hoàn thành',
                'zh': '已结束',
                'ja': '終了'
              },
              'scheduled': {
                'vi': 'Đã lên lịch',
                'zh': '已排程',
                'ja': '予定'
              },
              'running': {
                'vi': 'Đang diễn ra',
                'zh': '进行中',
                'ja': '進行中'
              },
              'official': {
                'vi': 'Chính thức',
                'zh': '官方',
                'ja': '公式'
              },
              'competitors directory': {
                'vi': 'Thư mục đối thủ cạnh tranh',
                'zh': '参赛马匹与人员名录',
                'ja': '競走対象名簿'
              },
              'thoroughbred horses': {
                'vi': 'Ngựa thuần chủng',
                'zh': '纯血马',
                'ja': 'サラブレッド'
              },
              'registry of licensed racing horses and their owners': {
                'vi': 'Đăng ký ngựa đua được cấp phép và chủ sở hữu',
                'zh': '持证赛马及马主注册名录',
                'ja': '公認競走馬および馬主登録簿'
              },
              'total horses registered': {
                'vi': 'Tổng số ngựa đăng ký',
                'zh': '已注册马匹总数',
                'ja': '登録馬総数'
              },
              'average current rating': {
                'vi': 'Xếp hạng trung bình hiện tại',
                'zh': '当前平均评分',
                'ja': '現在の平均レーティング'
              },
              'total wins recorded': {
                'vi': 'Tổng số trận thắng ghi nhận',
                'zh': '已记录胜场总数',
                'ja': '通算勝利数'
              },
              'horse registry': {
                'vi': 'Danh sách đăng ký ngựa',
                'zh': '马匹注册登记',
                'ja': '競走馬登録'
              },
              'thoroughbred profiles': {
                'vi': 'Hồ sơ ngựa thuần chủng',
                'zh': '纯血马档案',
                'ja': 'サラブレッド詳細'
              },
              'horse name': {
                'vi': 'Tên ngựa',
                'zh': '马名',
                'ja': '馬名'
              },
              'breed': {
                'vi': 'Giống loài',
                'zh': '品种',
                'ja': '品種'
              },
              'owner name': {
                'vi': 'Tên chủ sở hữu',
                'zh': '马主姓名',
                'ja': '馬主名'
              },
              'rating': {
                'vi': 'Xếp hạng',
                'zh': '评分',
                'ja': 'レーティング'
              },
              'wins / starts': {
                'vi': 'Thắng / Tham gia',
                'zh': '胜场 / 出赛',
                'ja': '勝率 / 出走数'
              },
              'status': {
                'vi': 'Trạng thái',
                'zh': '状态',
                'ja': 'ステータス'
              },
              'no horses found in the tournament registry database.': {
                'vi': 'Không tìm thấy ngựa nào trong cơ sở dữ liệu.',
                'zh': '未在赛事注册数据库中找到马匹。',
                'ja': '登録競走馬データベースに馬が見つかりません。'
              },
              'horse profile': {
                'vi': 'Hồ sơ ngựa',
                'zh': '马匹档案',
                'ja': '競走馬プロフィール'
              },
              'sex': {
                'vi': 'Giới tính',
                'zh': '性别',
                'ja': '性別'
              },
              'trainer': {
                'vi': 'Huấn luyện viên',
                'zh': '练马师',
                'ja': '調教師'
              },
              'owner': {
                'vi': 'Chủ ngựa',
                'zh': '马主',
                'ja': '馬主'
              },
              'pedigree (sire / dam)': {
                'vi': 'Phả hệ (Cha / Mẹ)',
                'zh': '血统（父系 / 母系）',
                'ja': '血統 (父 / 母)'
              },
              'recent form & career history': {
                'vi': 'Phong độ gần đây & Lịch sử sự nghiệp',
                'zh': '近期表现与竞赛生涯历史',
                'ja': '近走成績 ＆ 過去の戦績'
              },
              'runs recorded': {
                'vi': 'lượt chạy được ghi nhận',
                'zh': '次出赛记录',
                'ja': '出走回数'
              },
              'race event': {
                'vi': 'Sự kiện cuộc đua',
                'zh': '赛事事件',
                'ja': 'レースイベント'
              },
              'date': {
                'vi': 'Ngày',
                'zh': '日期',
                'ja': '日付'
              },
              'jockey': {
                'vi': 'Nài ngựa',
                'zh': '骑师',
                'ja': '騎手'
              },
              'pos.': {
                'vi': 'Hạng',
                'zh': '名次',
                'ja': '着順'
              },
              'margin': {
                'vi': 'Khoảng cách',
                'zh': '胜负差',
                'ja': '着差'
              },
              'odds': {
                'vi': 'Tỷ lệ cược',
                'zh': '赔率',
                'ja': 'オッズ'
              },
              'this horse has no historical race entries recorded yet.': {
                'vi': 'Ngựa này chưa có thông tin lịch sử cuộc đua.',
                'zh': '该马匹尚无历史比赛记录。',
                'ja': 'この馬の過去のレース出走記録はありません。'
              },
              'back to registry': {
                'vi': 'Quay lại danh sách',
                'zh': '返回名录',
                'ja': '名簿に戻る'
              },
              'roster directory': {
                'vi': 'Thư mục danh sách thành viên',
                'zh': '花名册名录',
                'ja': '名簿ディレクトリ'
              },
              'manage certified racing jockeys and registered asset owners': {
                'vi': 'Quản lý nài ngựa đua được chứng nhận và chủ sở hữu tài sản đã đăng ký',
                'zh': '管理持证骑师及注册资产所有者',
                'ja': '公認騎手および登録馬主の管理'
              },
              'total jockeys': {
                'vi': 'Tổng số nài ngựa',
                'zh': '骑师总数',
                'ja': '騎手総数'
              },
              'total horse owners': {
                'vi': 'Tổng số chủ ngựa',
                'zh': '马主总数',
                'ja': '馬主总数'
              },
              'active status (combined)': {
                'vi': 'Trạng thái hoạt động (kết hợp)',
                'zh': '活跃状态（合并）',
                'ja': '稼働ステータス（総合）'
              },
              'certified jockeys': {
                'vi': 'Nài ngựa được chứng nhận',
                'zh': '认证骑师',
                'ja': '公認騎手'
              },
              'active profiles': {
                'vi': 'Hồ sơ hoạt động',
                'zh': '活跃档案',
                'ja': '有効プロフィール'
              },
              'name': {
                'vi': 'Tên',
                'zh': '姓名',
                'ja': '名前'
              },
              'contact': {
                'vi': 'Liên hệ',
                'zh': '联系方式',
                'ja': '連絡先'
              },
              'races': {
                'vi': 'Số cuộc đua',
                'zh': '比赛场数',
                'ja': '出走レース数'
              },
              'registered horse owners': {
                'vi': 'Chủ sở hữu ngựa đã đăng ký',
                'zh': '注册马主',
                'ja': '登録马主'
              },
              'owner details': {
                'vi': 'Chi tiết chủ ngựa',
                'zh': '马主详情',
                'ja': '馬主詳細'
              },
              'contact info': {
                'vi': 'Thông tin liên hệ',
                'zh': '联系信息',
                'ja': '連絡先情報'
              },
              'horses owned': {
                'vi': 'Số ngựa sở hữu',
                'zh': '拥有马匹数',
                'ja': '所有馬数'
              },
              'integrity & safety log': {
                'vi': 'Nhật ký an toàn & liêm chính',
                'zh': '廉洁与安全日志',
                'ja': '公正・安全ログ'
              },
              'incident reports': {
                'vi': 'Báo cáo sự cố',
                'zh': '事故报告',
                'ja': 'インシデント報告'
              },
              'track regulatory infractions, track conditions, and safety logs': {
                'vi': 'Theo dõi vi phạm quy định, điều kiện đường đua và nhật ký an toàn',
                'zh': '跟踪违规行为、赛道状况和安全日志',
                'ja': '違反行為、トラック状況、安全ログの監視'
              },
              'file new report': {
                'vi': 'Tạo báo cáo mới',
                'zh': '提交新报告',
                'ja': '新規インシデント報告'
              },
              'total logged incidents': {
                'vi': 'Tổng số sự cố đã ghi nhận',
                'zh': '记录事件总数',
                'ja': '記録されたインシデント数'
              },
              'under active investigation': {
                'vi': 'Đang điều tra hoạt động',
                'zh': '调查中',
                'ja': '調査中'
              },
              'resolved cases': {
                'vi': 'Sự cố đã giải quyết',
                'zh': '已解决案例',
                'ja': '解決済みの件数'
              },
              'incident ledger': {
                'vi': 'Sổ cái sự cố',
                'zh': '事故分类账',
                'ja': 'インシデント台帳'
              },
              'latest activity': {
                'vi': 'Hoạt động mới nhất',
                'zh': '最新动态',
                'ja': '最新の動き'
              },
              'id': {
                'vi': 'Mã số',
                'zh': 'ID',
                'ja': 'ID'
              },
              'involved parties': {
                'vi': 'Các bên liên quan',
                'zh': '涉及人员/马匹',
                'ja': '当事者'
              },
              'description': {
                'vi': 'Mô tả',
                'zh': '描述',
                'ja': '説明'
              },
              'severity': {
                'vi': 'Mức độ',
                'zh': '严重程度',
                'ja': '深刻度'
              },
              'resolved': {
                'vi': 'Đã giải quyết',
                'zh': '已解决',
                'ja': '解決済み'
              },
              'under review': {
                'vi': 'Đang xem xét',
                'zh': '审查中',
                'ja': '審査中'
              },
              'critical': {
                'vi': 'Nguy cấp',
                'zh': '紧急',
                'ja': '重大'
              },
              'high': {
                'vi': 'Cao',
                'zh': '高',
                'ja': '高'
              },
              'medium': {
                'vi': 'Trung bình',
                'zh': '中',
                'ja': '中'
              },
              'low': {
                'vi': 'Thấp',
                'zh': '低',
                'ja': '低'
              },
              'official racecard': {
                'vi': 'Chương Trình Đua Chính Thức',
                'zh': '官方排位表',
                'ja': '公式出馬表'
              },
              'browse scheduled race meetings, declared races, and official entries.': {
                'vi': 'Duyệt các sự kiện đua, cuộc đua công bố và đăng ký chính thức.',
                'zh': '浏览已排程的赛事、已公布的比赛和官方报名信息。',
                'ja': '予定されているレース、確定番組、および公式出走馬を閲覧できます。'
              },
              'select race meeting': {
                'vi': 'Chọn sự kiện đua',
                'zh': '选择赛事',
                'ja': 'レース開催の選択'
              },
              'no race meetings available in the system.': {
                'vi': 'Không có sự kiện đua nào trong hệ thống.',
                'zh': '系统中没有可用的赛事',
                'ja': 'システム内に利用可能な開催レースはありません'
              },
              'no races declared for this meeting yet.': {
                'vi': 'Chưa có cuộc đua nào được công bố cho sự kiện này.',
                'zh': '该赛事尚未公布任何比赛。',
                'ja': 'この開催での確定番組はまだありません'
              },
              'distance': {
                'vi': 'Khoảng cách',
                'zh': '距离',
                'ja': '距離'
              },
              'track type': {
                'vi': 'Loại đường đua',
                'zh': '赛道类型',
                'ja': 'トラック種類'
              },
              'total purse': {
                'vi': 'Tổng quỹ giải thưởng',
                'zh': '总奖金',
                'ja': '総賞金'
              },
              'scheduled time': {
                'vi': 'Thời gian dự kiến',
                'zh': '排定时间',
                'ja': '発走予定時刻'
              },
              'rating requirement': {
                'vi': 'Yêu cầu xếp hạng',
                'zh': '评分要求',
                'ja': 'レーティング条件'
              },
              'max runners': {
                'vi': 'Số ngựa tối đa',
                'zh': '最大参赛马匹数',
                'ja': '最大出走頭数'
              },
              'start gate window': {
                'vi': 'Số cổng xuất phát',
                'zh': '起跑闸位窗口',
                'ja': '発走ゲート'
              },
              'registration limit': {
                'vi': 'Hạn chót đăng ký',
                'zh': '报名截止日期',
                'ja': '登録締切'
              },
              'declared runners & riders': {
                'vi': 'Ngựa & nài ngựa chính thức',
                'zh': '宣布出赛的马匹与骑师',
                'ja': '確定出走馬 ＆ 騎手'
              },
              'no entries declared or approved for this race yet.': {
                'vi': 'Chưa có danh sách đăng ký nào được công bố hoặc phê duyệt.',
                'zh': '该场比赛尚未公布或批准报名名单。',
                'ja': 'このレースに対する出走予定または承認された登録はありません'
              },
              'draw': {
                'vi': 'Cổng',
                'zh': '闸位',
                'ja': '枠番'
              },
              'horse details': {
                'vi': 'Thông tin ngựa',
                'zh': '马匹详情',
                'ja': '馬詳細'
              },
              'jockey details': {
                'vi': 'Thông tin nài ngựa',
                'zh': '骑师详情',
                'ja': '騎手詳細'
              },
              'horse rating': {
                'vi': 'Xếp hạng ngựa',
                'zh': '马匹评分',
                'ja': '馬レーティング'
              },
              'carried wt': {
                'vi': 'Khối lượng mang',
                'zh': '负重',
                'ja': '負担重量'
              },
              'open': {
                'vi': 'Mở',
                'zh': '开启',
                'ja': '開く'
              },
              'select live race': {
                'vi': 'Chọn cuộc đua trực tiếp',
                'zh': '选择直播赛事',
                'ja': 'ライブレースの選択'
              },
              'races currently broadcasting': {
                'vi': 'cuộc đua đang phát sóng trực tiếp',
                'zh': '场比赛正在直播',
                'ja': 'レースライブ配信中'
              },
              'start watching': {
                'vi': 'Bắt đầu xem',
                'zh': '开始观看',
                'ja': '視聴を開始'
              },
              'click start watching to open youtube in a new tab': {
                'vi': 'Nhấp Bắt đầu xem để mở YouTube trong tab mới',
                'zh': '点击“开始观看”以在新标签页中打开 YouTube',
                'ja': '「視聴を開始」をクリックすると新しいタブでYouTubeが開きます'
              },
              'close': {
                'vi': 'Đóng',
                'zh': '关闭',
                'ja': '閉じる'
              },
              'no live broadcast': {
                'vi': 'Không có truyền hình trực tiếp',
                'zh': '暂无直播',
                'ja': 'ライブ配信はありません'
              },
              'no races are currently taking place.': {
                'vi': 'Hiện tại không có cuộc đua nào đang diễn ra.',
                'zh': '当前没有任何比赛在进行。',
                'ja': '現在開催されているレースはありません。'
              },
              'official race results': {
                'vi': 'Kết quả cuộc đua chính thức',
                'zh': '官方比赛结果',
                'ja': '公式レース結果'
              },
              'race results': {
                'vi': 'Kết quả cuộc đua',
                'zh': '比赛结果',
                'ja': 'レース結果'
              },
              'view completed race outcomes, finishing positions, times, and prize money.': {
                'vi': 'Xem kết quả cuộc đua đã hoàn thành, vị trí về đích, thời gian và tiền thưởng.',
                'zh': '查看已完成比赛的结果、名次、用时及奖金分配。',
                'ja': '終了したレースの結果、着順、タイム、および賞金を閲覧できます。'
              },
              'no race meetings available.': {
                'vi': 'Không có sự kiện đua nào có sẵn.',
                'zh': '无可用赛事。',
                'ja': '利用可能なレース開催はありません。'
              },
              'no finished races for this meeting yet.': {
                'vi': 'Chưa có cuộc đua nào hoàn thành trong sự kiện này.',
                'zh': '该赛事尚未有完成的比赛。',
                'ja': 'この開催ではまだ終了したレースはありません。'
              },
              'results will appear here once races are completed.': {
                'vi': 'Kết quả sẽ xuất hiện ở đây sau khi các cuộc đua hoàn thành.',
                'zh': '比赛完成后，结果将在此显示。',
                'ja': 'レースが完了すると、ここに結果が表示されます。'
              },
              'official standing': {
                'vi': 'Bảng xếp hạng chính thức',
                'zh': '官方名次表',
                'ja': '公式順位'
              },
              'runner details': {
                'vi': 'Chi tiết ngựa chạy',
                'zh': '参赛马匹详情',
                'ja': '出走馬詳細'
              },
              'finish time': {
                'vi': 'Thời gian về đích',
                'zh': '完赛用时',
                'ja': 'タイム'
              },
              'prize money': {
                'vi': 'Tiền thưởng',
                'zh': '奖金',
                'ja': '賞金'
              },
              'no official results recorded for this race yet.': {
                'vi': 'Chưa có kết quả chính thức nào được ghi nhận cho cuộc đua này.',
                'zh': '该场比赛尚未录入官方结果。',
                'ja': 'このレースに対する公式結果はまだ記録されていません。'
              },
              'fixtures & schedule': {
                'vi': 'Lịch thi đấu & Lịch trình',
                'zh': '赛程安排与日程表',
                'ja': '日程 ＆ スケジュール'
              },
              'view upcoming race fixtures, timings, and participant registry.': {
                'vi': 'Xem lịch thi đấu sắp tới, thời gian và danh sách người tham gia.',
                'zh': '查看即将进行的赛事排程、发走时间及参赛名册。',
                'ja': '今後のレース日程、発走時刻、および登録馬を確認できます。'
              },
              'no upcoming races found for this meeting.': {
                'vi': 'Không tìm thấy cuộc đua sắp tới nào cho sự kiện này.',
                'zh': '该赛事下未找到即将进行的比赛。',
                'ja': 'この開催での今後の予定レースは見つかりません。'
              },
              'performance statistics': {
                'vi': 'Thống kê hiệu suất',
                'zh': '表现统计',
                'ja': 'パフォーマンス統計'
              },
              'historical statistics leaderboard for jockeys, horses, and owners': {
                'vi': 'Bảng xếp hạng thống kê lịch sử cho nài ngựa, ngựa và chủ sở hữu',
                'zh': '骑师、马匹及马主的历史统计排行榜',
                'ja': '騎手、馬、馬主の過去成績ランキング'
              },
              'top performing jockeys': {
                'vi': 'Nài ngựa xuất sắc nhất',
                'zh': '表现最佳骑师',
                'ja': 'リーディングジョッキー'
              },
              'top performing horses': {
                'vi': 'Ngựa đua xuất sắc nhất',
                'zh': '表现最佳马匹',
                'ja': 'リーディングホース'
              },
              'top performing owners': {
                'vi': 'Chủ sở hữu xuất sắc nhất',
                'zh': '表现最佳马主',
                'ja': 'リーディングオーナー'
              },
              'wins': {
                'vi': 'Số trận thắng',
                'zh': '胜场',
                'ja': '勝利数'
              },
              'win rate': {
                'vi': 'Tỷ lệ thắng',
                'zh': '胜率',
                'ja': '勝率'
              },
              'total races': {
                'vi': 'Tổng số cuộc đua',
                'zh': '出赛总场数',
                'ja': '総レース数'
              },
              'earnings': {
                'vi': 'Tiền thưởng kiếm được',
                'zh': '总奖金收入',
                'ja': '獲得賞金'
              },
              'no statistics data recorded.': {
                'vi': 'Chưa có dữ liệu thống kê nào được ghi nhận.',
                'zh': '未录入任何统计数据。',
                'ja': '統計データは記録されていません。'
              },
              's:': {
                'vi': 'Cha:',
                'zh': '父:',
                'ja': '父:'
              },
              'd:': {
                'vi': 'Mẹ:',
                'zh': '母:',
                'ja': '母:'
              }
            };

            function getTranslation(text, l) {
              if (l === 'en') return null;
              const cleanText = text.trim().replace(/\s+/g, ' ');
              const lowerText = cleanText.toLowerCase();
              if (domTrans[lowerText] && domTrans[lowerText][l]) {
                return domTrans[lowerText][l];
              }

              let m;
              if (l === 'vi') {
                if (m = cleanText.match(/^\s*venue:\s*(.*)$/i)) return "Địa điểm: " + m[1];
                if (m = cleanText.match(/^\s*budget:\s*\$(.*)$/i)) return "Ngân sách: $" + m[1];
                if (m = cleanText.match(/^\s*id:\s*([a-z0-9#-]+)$/i)) return "Mã: " + m[1].toUpperCase();
                if (m = cleanText.match(/^\s*race\s*#(\d+)$/i)) return "Cuộc đua #" + m[1];
                if (m = cleanText.match(/^\s*race\s*(\d+)$/i)) return "Cuộc đua " + m[1];
                if (m = cleanText.match(/^\s*class\s*(\d+)\s*stakes$/i)) return "Cúp Hạng " + m[1];
                if (m = cleanText.match(/^\s*class\s*(\d+)$/i)) return "Hạng " + m[1];
                if (m = cleanText.match(/^\s*(\d+)\s*runs\s*recorded$/i)) return m[1] + " lượt chạy được ghi nhận";
                if (m = cleanText.match(/^\s*(\d+)\s*thoroughbred\s*profiles$/i)) return m[1] + " Hồ sơ ngựa thuần chủng";
                if (m = cleanText.match(/^\s*(\d+)\s*active\s*profiles$/i)) return m[1] + " Hồ sơ hoạt động";
                if (m = cleanText.match(/^\s*(\d+)\s*accounts$/i)) return m[1] + " Tài khoản";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*currently\s*broadcasting$/i)) return m[1] + " cuộc đua đang phát sóng trực tiếp";
                if (m = cleanText.match(/^\s*distance:\s*(\d+m)$/i)) return "Khoảng cách: " + m[1];
                if (m = cleanText.match(/^\s*track\s*type:\s*(.*)$/i)) {
                    let tType = m[1].trim().toLowerCase();
                    if (tType === 'turf') tType = 'Đường cỏ'; else if (tType === 'dirt') tType = 'Đường đất';
                    return "Loại đường đua: " + tType;
                }
                if (m = cleanText.match(/^\s*(\d+)(st|nd|rd|th)\s*$/i)) return "Hạng " + m[1];
                if (m = cleanText.match(/^\s*h:\s*(.*)$/i)) return "Ngựa: " + m[1];
                if (m = cleanText.match(/^\s*j:\s*(.*)$/i)) return "Nài: " + m[1];
                if (m = cleanText.match(/^\s*([\d-]+)\s*to\s*([\d-]+)\s*$/i)) return m[1] + " đến " + m[2];
                if (m = cleanText.match(/^\s*races\s*inside\s*"(.*)"$/i)) return "Các cuộc đua trong \"" + m[1] + "\"";
                if (m = cleanText.match(/^\s*completed\s*races\s*in\s*"(.*)"$/i)) return "Các cuộc đua đã hoàn thành trong \"" + m[1] + "\"";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*$/i)) return m[1] + " cuộc đua";
                if (m = cleanText.match(/^\s*total\s*prize\s*fund\s*\$(.*)$/i)) return "tổng quỹ giải thưởng $" + m[1];
              } else if (l === 'zh') {
                if (m = cleanText.match(/^\s*venue:\s*(.*)$/i)) return "地点: " + m[1];
                if (m = cleanText.match(/^\s*budget:\s*\$(.*)$/i)) return "预算: $" + m[1];
                if (m = cleanText.match(/^\s*id:\s*([a-z0-9#-]+)$/i)) return "ID: " + m[1].toUpperCase();
                if (m = cleanText.match(/^\s*race\s*#(\d+)$/i)) return "比赛 #" + m[1];
                if (m = cleanText.match(/^\s*race\s*(\d+)$/i)) return "比赛 " + m[1];
                if (m = cleanText.match(/^\s*class\s*(\d+)\s*stakes$/i)) return "级别 " + m[1] + " 锦标赛";
                if (m = cleanText.match(/^\s*class\s*(\d+)$/i)) return "级别 " + m[1];
                if (m = cleanText.match(/^\s*(\d+)\s*runs\s*recorded$/i)) return "已记录 " + m[1] + " 次比赛";
                if (m = cleanText.match(/^\s*(\d+)\s*thoroughbred\s*profiles$/i)) return m[1] + " 纯血马档案";
                if (m = cleanText.match(/^\s*(\d+)\s*active\s*profiles$/i)) return m[1] + " 活跃档案";
                if (m = cleanText.match(/^\s*(\d+)\s*accounts$/i)) return m[1] + " 账户";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*currently\s*broadcasting$/i)) return m[1] + " 场比赛正在直播";
                if (m = cleanText.match(/^\s*distance:\s*(\d+m)$/i)) return "距离: " + m[1];
                if (m = cleanText.match(/^\s*track\s*type:\s*(.*)$/i)) {
                    let tType = m[1].trim().toLowerCase();
                    if (tType === 'turf') tType = '草地'; else if (tType === 'dirt') tType = '泥地';
                    return "赛道类型: " + tType;
                }
                if (m = cleanText.match(/^\s*(\d+)(st|nd|rd|th)\s*$/i)) return "第 " + m[1] + " 名";
                if (m = cleanText.match(/^\s*h:\s*(.*)$/i)) return "马: " + m[1];
                if (m = cleanText.match(/^\s*j:\s*(.*)$/i)) return "骑: " + m[1];
                if (m = cleanText.match(/^\s*([\d-]+)\s*to\s*([\d-]+)\s*$/i)) return m[1] + " 至 " + m[2];
                if (m = cleanText.match(/^\s*races\s*inside\s*"(.*)"$/i)) return "\"" + m[1] + "\" 内的比赛";
                if (m = cleanText.match(/^\s*completed\s*races\s*in\s*"(.*)"$/i)) return "\"" + m[1] + "\" 内已完成的比赛";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*$/i)) return m[1] + " 场比赛";
                if (m = cleanText.match(/^\s*total\s*prize\s*fund\s*\$(.*)$/i)) return "总奖金 $" + m[1];
              } else if (l === 'ja') {
                if (m = cleanText.match(/^\s*venue:\s*(.*)$/i)) return "開催地: " + m[1];
                if (m = cleanText.match(/^\s*budget:\s*\$(.*)$/i)) return "予算: $" + m[1];
                if (m = cleanText.match(/^\s*id:\s*([a-z0-9#-]+)$/i)) return "ID: " + m[1].toUpperCase();
                if (m = cleanText.match(/^\s*race\s*#(\d+)$/i)) return "レース #" + m[1];
                if (m = cleanText.match(/^\s*race\s*(\d+)$/i)) return "レース " + m[1];
                if (m = cleanText.match(/^\s*class\s*(\d+)\s*stakes$/i)) return "クラス " + m[1] + " 特別";
                if (m = cleanText.match(/^\s*class\s*(\d+)$/i)) return "クラス " + m[1];
                if (m = cleanText.match(/^\s*(\d+)\s*runs\s*recorded$/i)) return m[1] + " レース記録";
                if (m = cleanText.match(/^\s*(\d+)\s*thoroughbred\s*profiles$/i)) return m[1] + " サラブレッド情報";
                if (m = cleanText.match(/^\s*(\d+)\s*active\s*profiles$/i)) return m[1] + " アクティブプロフィール";
                if (m = cleanText.match(/^\s*(\d+)\s*accounts$/i)) return m[1] + " アカウント";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*currently\s*broadcasting$/i)) return m[1] + " レースライブ中";
                if (m = cleanText.match(/^\s*distance:\s*(\d+m)$/i)) return "距離: " + m[1];
                if (m = cleanText.match(/^\s*track\s*type:\s*(.*)$/i)) {
                    let tType = m[1].trim().toLowerCase();
                    if (tType === 'turf') tType = '芝'; else if (tType === 'dirt') tType = 'ダート';
                    return "トラック種類: " + tType;
                }
                if (m = cleanText.match(/^\s*(\d+)(st|nd|rd|th)\s*$/i)) return m[1] + " 着";
                if (m = cleanText.match(/^\s*h:\s*(.*)$/i)) return "馬: " + m[1];
                if (m = cleanText.match(/^\s*j:\s*(.*)$/i)) return "騎手: " + m[1];
                if (m = cleanText.match(/^\s*([\d-]+)\s*to\s*([\d-]+)\s*$/i)) return m[1] + " から " + m[2];
                if (m = cleanText.match(/^\s*races\s*inside\s*"(.*)"$/i)) return "\"" + m[1] + "\" のレース";
                if (m = cleanText.match(/^\s*completed\s*races\s*in\s*"(.*)"$/i)) return "\"" + m[1] + "\" の終了したレース";
                if (m = cleanText.match(/^\s*(\d+)\s*races\s*$/i)) return m[1] + " レース";
                if (m = cleanText.match(/^\s*total\s*prize\s*fund\s*\$(.*)$/i)) return "総賞金 $" + m[1];
              }
              return null;
            }



            function translateNode(node) {
              if (node.nodeType === Node.TEXT_NODE) {
                if (!node.originalTextContent) {
                  node.originalTextContent = node.textContent;
                }
                if (lang === 'en') {
                  node.textContent = node.originalTextContent;
                } else {
                  const trans = getTranslation(node.originalTextContent, lang);
                  if (trans !== null) {
                    const startSpace = node.originalTextContent.startsWith(' ') ? ' ' : '';
                    const endSpace = node.originalTextContent.endsWith(' ') ? ' ' : '';
                    node.textContent = startSpace + trans + endSpace;
                  } else {
                    node.textContent = node.originalTextContent;
                  }
                }
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && node.tagName !== 'IFRAME') {
                  for (let i = 0; i < node.childNodes.length; i++) {
                    translateNode(node.childNodes[i]);
                  }
                }
              }
            }

            translateNode(document.body);
          }

          document.addEventListener('DOMContentLoaded', function() {
            document.addEventListener('click', function(e) {
              const langBtn = document.getElementById('lang-btn');
              const langDropdown = document.getElementById('lang-dropdown');
              if (langBtn && langDropdown) {
                if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
                  langDropdown.classList.add('hidden');
                }
              }
            });

            // Toggle Notifications Dropdown
            window.toggleNotifications = function() {
              const dropdown = document.getElementById('notifications-dropdown');
              if (!dropdown) return;
              
              const isHidden = dropdown.classList.contains('hidden');
              if (isHidden) {
                dropdown.classList.remove('hidden');
                setTimeout(() => {
                  dropdown.classList.remove('opacity-0', 'scale-95');
                }, 10);
              } else {
                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                  dropdown.classList.add('hidden');
                }, 300);
              }
            };
            
            // Close Notifications Dropdown
            window.closeNotifications = function() {
              const dropdown = document.getElementById('notifications-dropdown');
              if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => {
                  dropdown.classList.add('hidden');
                }, 300);
              }
            };
            
            // Mark all notifications as read
            window.markAllNotificationsAsRead = function() {
              const unreadDot = document.getElementById('unread-dot');
              if (unreadDot) {
                unreadDot.remove();
              }
              
              // Fade out notification item visual styles to show they are read
              const listItems = document.querySelectorAll('#notifications-list > div');
              listItems.forEach(item => {
                item.style.opacity = '0.6';
              });
            };
            
            // Click-away listener for notifications dropdown
            document.addEventListener('click', function(e) {
              const dropdown = document.getElementById('notifications-dropdown');
              const btn = document.getElementById('bell-btn');
              if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                closeNotifications();
              }
            });

            const savedLang = localStorage.getItem('lang-selected') || 'en';
            let label = 'EN';
            if (savedLang === 'vi') label = 'VI';
            else if (savedLang === 'zh') label = 'ZH';
            else if (savedLang === 'ja') label = 'JA';

            const langLabel = document.getElementById('lang-label');
            if (langLabel) langLabel.innerText = label;
            applyTranslations(savedLang);
          });
        </script>

        <!-- Article Detail Modal -->
        <div id="articleModal" class="fixed inset-0 z-[99999] hidden">
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeArticleModal()"></div>
          <div class="absolute inset-0 flex items-center justify-center p-4">
            <div class="relative w-full max-w-xl rounded-2xl border overflow-hidden" style="background: #121010; border-color: rgba(201,162,39,0.18); box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(201,162,39,0.06)">
              <div class="flex items-center justify-between px-6 py-5 border-b shadow-lg" style="border-color: rgba(255,255,255,0.06); background: rgba(201,162,39,0.03)">
                <h3 id="article-modal-title" class="font-['Roboto_Slab'] font-bold text-base text-[#f4f2ec]">Article Title</h3>
                <button onclick="closeArticleModal()" class="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5">
                  <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
              </div>
              <div id="article-modal-body" class="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-muted-foreground leading-relaxed font-sans">
              </div>
              <div class="px-6 py-3 border-t flex justify-end" style="border-color: rgba(255,255,255,0.06); background: rgba(0,0,0,0.2)">
                <button onclick="closeArticleModal()" class="text-xs font-mono px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>

        <footer class="bg-[#0a0907] mt-auto">
          <div class="border-t border-border">
            <div class="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>© 2026 HorseRace Management System</span>
              <span>Season 2026 · Audited racing engine</span>
            </div>
          </div>
        </footer>
    </jsp:body>
</t:layout>
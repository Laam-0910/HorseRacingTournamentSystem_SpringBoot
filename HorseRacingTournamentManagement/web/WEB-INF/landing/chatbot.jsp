<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Horse Racing Chatbot</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }

        #chat-toggle-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #C9A84C;
            color: #111;
            border: none;
            cursor: pointer;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.6);
        }
        #chat-toggle-btn:hover { background: #b8952e; }

        #chat-widget {
            position: fixed;
            bottom: 88px;
            right: 24px;
            width: 370px;
            height: 530px;
            background: #1a1a1a;
            border: 1px solid #2e2e2e;
            border-radius: 12px;
            display: none;
            flex-direction: column;
            z-index: 9998;
            overflow: hidden;
            box-shadow: 0 6px 28px rgba(0,0,0,0.75);
        }
        #chat-widget.open { display: flex; }

        #chat-header {
            background: #111111;
            color: #C9A84C;
            padding: 11px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            border-bottom: 1px solid #C9A84C33;
        }
        #chat-header-title {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.4px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #chat-header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #lang-select {
            background: #1e1e1e;
            border: 1px solid #C9A84C55;
            color: #C9A84C;
            border-radius: 5px;
            font-size: 11px;
            padding: 3px 5px;
            cursor: pointer;
            outline: none;
        }
        #lang-select:focus { border-color: #C9A84C; }
        #chat-close-btn {
            background: none;
            border: none;
            color: #777;
            font-size: 17px;
            cursor: pointer;
            line-height: 1;
            padding: 2px 4px;
        }
        #chat-close-btn:hover { color: #fff; }

        #quick-actions {
            padding: 8px 12px;
            border-bottom: 1px solid #222;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            flex-shrink: 0;
            background: #141414;
        }
        .quick-btn {
            font-size: 11px;
            padding: 4px 11px;
            border: 1px solid #C9A84C55;
            border-radius: 20px;
            background: #241f00;
            color: #C9A84C;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.15s, border-color 0.15s;
        }
        .quick-btn:hover { background: #3a3000; border-color: #C9A84C; }

        #chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: #1a1a1a;
        }
        #chat-messages::-webkit-scrollbar { width: 4px; }
        #chat-messages::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .msg {
            max-width: 86%;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 13px;
            line-height: 1.55;
            word-break: break-word;
            white-space: pre-wrap;
        }
        .msg.bot {
            align-self: flex-start;
            background: #242424;
            color: #ddd;
            border: 1px solid #2e2e2e;
            border-bottom-left-radius: 2px;
        }
        .msg.user {
            align-self: flex-end;
            background: #C9A84C;
            color: #111;
            font-weight: 500;
            border-bottom-right-radius: 2px;
        }
        .msg.typing {
            align-self: flex-start;
            background: #242424;
            color: #666;
            font-style: italic;
            border: 1px solid #2e2e2e;
        }

        #chat-input-area {
            padding: 10px 12px;
            border-top: 1px solid #222;
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            background: #141414;
        }
        #chat-input {
            flex: 1;
            padding: 8px 13px;
            border: 1px solid #333;
            border-radius: 20px;
            font-size: 13px;
            outline: none;
            background: #222;
            color: #e0e0e0;
        }
        #chat-input::placeholder { color: #555; }
        #chat-input:focus { border-color: #C9A84C88; }
        #chat-send-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #C9A84C;
            color: #111;
            border: none;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.15s;
        }
        #chat-send-btn:hover { background: #b8952e; }
        #chat-send-btn:disabled { background: #3a3a3a; color: #666; cursor: not-allowed; }
    </style>
</head>
<body>

<%-- NÚT MỞ CHATBOT --%>
<button id="chat-toggle-btn" onclick="toggleChat()" title="AI Assistant">&#129302;</button>

<%-- KHUNG CHAT --%>
<div id="chat-widget">

    <div id="chat-header">
        <div id="chat-header-title">
            &#129302; <span id="header-label">AI Horse Racing</span>
        </div>
        <div id="chat-header-right">
            <select id="lang-select" onchange="changeLang(this.value)">
                <option value="vi">🇻🇳 VI</option>
                <option value="en">🇺🇸 EN</option>
                <option value="ja">🇯🇵 JA</option>
                <option value="zh">🇨🇳 ZH</option>
            </select>
            <button id="chat-close-btn" onclick="toggleChat()">&#10005;</button>
        </div>
    </div>

    <div id="quick-actions">
        <button class="quick-btn" onclick="quickAsk(0)">Rating cao nhất</button>
        <button class="quick-btn" onclick="quickAsk(1)">Dự đoán race</button>
        <button class="quick-btn" onclick="quickAsk(2)">Nài xuất sắc</button>
        <button class="quick-btn" onclick="quickAsk(3)">Mùa giải</button>
    </div>

    <div id="chat-messages">
        <div class="msg bot" id="welcome-msg">Xin chào! Tôi là AI phân tích đua ngựa. Bạn có thể hỏi tôi về ngựa, nài, kết quả đua, hoặc dự đoán race.</div>
    </div>

    <div id="chat-input-area">
        <input type="text" id="chat-input" placeholder="Nhập câu hỏi..."
               onkeydown="if(event.key==='Enter') sendMessage()" />
        <button id="chat-send-btn" onclick="sendMessage()" title="Send">&#10148;</button>
    </div>

</div>

<script>
    var chatHistory = [];
    var isWaiting = false;
    var currentLang = 'vi';

    var LANG = {
        vi: {
            headerLabel:  'AI Horse Racing',
            placeholder:  'Nhập câu hỏi...',
            typing:       'Đang phân tích...',
            welcome:      'Xin chào! Tôi là AI phân tích đua ngựa. Bạn có thể hỏi tôi về ngựa, nài, kết quả đua, hoặc dự đoán race.',
            error:        'Có lỗi xảy ra: ',
            noconn:       'Không kết nối được AI server. Vui lòng kiểm tra Python server đang chạy.',
            quick:        ['Rating cao nhất', 'Dự đoán race', 'Nài xuất sắc', 'Mùa giải'],
            quickQ:       [
                'Ngựa nào đang có rating cao nhất?',
                'Dự đoán kết quả race mới nhất',
                'Nài ngựa nào có tỉ lệ top 3 tốt nhất?',
                'Tổng kết mùa giải hiện tại'
            ]
        },
        en: {
            headerLabel:  'AI Horse Racing',
            placeholder:  'Ask a question...',
            typing:       'Analyzing...',
            welcome:      'Hello! I am a horse racing AI assistant. Ask me about horses, jockeys, race results, or predictions.',
            error:        'An error occurred: ',
            noconn:       'Cannot connect to AI server. Please check the Python server is running.',
            quick:        ['Top Rating', 'Predict Race', 'Best Jockey', 'Season'],
            quickQ:       [
                'Which horse has the highest rating?',
                'Predict the latest race result',
                'Which jockey has the best top-3 rate?',
                'Summarize the current season'
            ]
        },
        ja: {
            headerLabel:  'AI競馬アシスタント',
            placeholder:  '質問を入力...',
            typing:       '分析中...',
            welcome:      'こんにちは！競馬AIアシスタントです。馬・騎手・レース結果・予測について何でも聞いてください。',
            error:        'エラーが発生しました：',
            noconn:       'AIサーバーに接続できません。Pythonサーバーが起動しているか確認してください。',
            quick:        ['最高レーティング', 'レース予測', '優秀騎手', 'シーズン'],
            quickQ:       [
                '最もレーティングが高い馬は？',
                '最新レースの結果を予測してください',
                'トップ3率が最も高い騎手は？',
                '今シーズンのまとめ'
            ]
        },
        zh: {
            headerLabel:  'AI赛马助手',
            placeholder:  '输入问题...',
            typing:       '分析中...',
            welcome:      '你好！我是赛马AI助手，可以回答关于马匹、骑师、比赛结果或预测的问题。',
            error:        '发生错误：',
            noconn:       '无法连接AI服务器，请检查Python服务器是否正在运行。',
            quick:        ['最高评分', '预测赛事', '优秀骑师', '赛季'],
            quickQ:       [
                '哪匹马的评分最高？',
                '预测最新比赛结果',
                '哪位骑师的前三率最高？',
                '本赛季总结'
            ]
        }
    };

    function changeLang(lang) {
        currentLang = lang;
        var L = LANG[lang];
        document.getElementById('header-label').textContent  = L.headerLabel;
        document.getElementById('chat-input').placeholder    = L.placeholder;
        document.getElementById('welcome-msg').textContent   = L.welcome;
        var btns = document.querySelectorAll('.quick-btn');
        btns.forEach(function(btn, i) { btn.textContent = L.quick[i]; });
    }

    function toggleChat() {
        var widget = document.getElementById('chat-widget');
        if (widget.classList.contains('open')) {
            widget.classList.remove('open');
        } else {
            widget.classList.add('open');
            document.getElementById('chat-input').focus();
        }
    }

    function quickAsk(index) {
        var text = LANG[currentLang].quickQ[index];
        document.getElementById('chat-input').value = text;
        sendMessage();
    }

    function sendMessage() {
        if (isWaiting) return;
        var input = document.getElementById('chat-input');
        var msg   = input.value.trim();
        if (!msg) return;

        appendMessage('user', msg);
        input.value = '';

        var L        = LANG[currentLang];
        var typingId = appendMessage('typing', L.typing);
        isWaiting    = true;
        document.getElementById('chat-send-btn').disabled = true;

        fetch('ai/chat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body:    JSON.stringify({ message: msg, history: chatHistory, lang: currentLang })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            removeMessage(typingId);
            if (data.success) {
                appendMessage('bot', data.reply);
                chatHistory.push({ role: 'user',      content: msg        });
                chatHistory.push({ role: 'assistant', content: data.reply });
                if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
            } else {
                appendMessage('bot', L.error + (data.error || ''));
            }
        })
        .catch(function() {
            removeMessage(typingId);
            appendMessage('bot', L.noconn);
        })
        .finally(function() {
            isWaiting = false;
            document.getElementById('chat-send-btn').disabled = false;
        });
    }

    function appendMessage(type, text) {
        var box = document.getElementById('chat-messages');
        var id  = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        var div = document.createElement('div');
        div.className   = 'msg ' + type;
        div.id          = id;
        div.textContent = text;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        return id;
    }

    function removeMessage(id) {
        var el = document.getElementById(id);
        if (el) el.remove();
    }
</script>

</body>
</html>

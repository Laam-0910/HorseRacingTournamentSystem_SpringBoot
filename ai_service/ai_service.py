"""
Horse Racing AI Chatbot Service
Flask + pyodbc + SQL Server
Chay: python ai_service.py → http://localhost:8001
"""

import sys
sys.stdout.reconfigure(encoding="utf-8")

from flask import Flask, request, jsonify
import pyodbc, os, re, json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

# ── CORS thủ công (không cần flask-cors) ─────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route("/chat", methods=["OPTIONS"])
def options_chat():
    return "", 204

# ── DB Config ─────────────────────────────────────────────────────────────────
DB = {
    "server":   os.getenv("DB_SERVER",   "localhost"),
    "port":     os.getenv("DB_PORT",     "1433"),
    "database": os.getenv("DB_NAME",     "HorseRacingDB"),
    "username": os.getenv("DB_USER",     "sa"),
    "password": os.getenv("DB_PASSWORD", "12345"),
}

def get_conn():
    return pyodbc.connect(
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB['server']},{DB['port']};"
        f"DATABASE={DB['database']};"
        f"UID={DB['username']};"
        f"PWD={DB['password']};"
        f"TrustServerCertificate=yes;"
    )

def query(sql, params=()):
    try:
        conn = get_conn()
        cur  = conn.cursor()
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        print(f"[DB Error] {e}")
        return []

# ── Bảo mật ───────────────────────────────────────────────────────────────────
BLOCKED = [
    "password","mật khẩu","passwd",
    "email","phone","số điện thoại",
    "tài khoản","account","token","jwt","secret",
    "drop ","delete from","truncate","insert into",
    "--",";--","/*","*/","xp_","exec(",
]

def is_blocked(msg):
    m = msg.lower()
    return any(kw in m for kw in BLOCKED)

# ── Lấy dữ liệu thật ──────────────────────────────────────────────────────────
def top_horses():
    return query(
        "SELECT TOP 5 name, current_rating AS currentRating, total_wins AS totalWins, total_races AS totalRaces, breed "
        "FROM [Horse] WHERE status='ACTIVE' ORDER BY current_rating DESC"
    )

def top_jockeys():
    return query(
        "SELECT TOP 5 u.username, u.total_races_participated AS totalRacesParticipated, "
        "COALESCE(w.wins, 0) AS totalWins, u.total_top3_finishes AS totalTop3Finishes, u.weight "
        "FROM [User] u LEFT JOIN ("
        "  SELECT jockey_id, COUNT(*) AS wins FROM [RaceEntry] WHERE final_position = 1 GROUP BY jockey_id"
        ") w ON u.id = w.jockey_id "
        "WHERE u.role_id=3 AND u.status='ACTIVE' "
        "ORDER BY totalWins DESC"
    )

def upcoming_races():
    return query(
        "SELECT TOP 5 r.class_level AS classLevel, r.distance_meters AS distanceMeters, r.track_type AS trackType, r.start_time AS startTime, rm.name as meetingName "
        "FROM [Race] r LEFT JOIN [RaceMeeting] rm ON r.race_meeting_id=rm.id "
        "WHERE r.status IN ('SCHEDULED','DECLARATION_OPEN','DECLARATION_CLOSED','RACE_ASSIGNED') "
        "ORDER BY r.start_time ASC"
    )

def running_races():
    return query(
        "SELECT r.id, r.class_level AS classLevel, rm.name as meetingName "
        "FROM [Race] r LEFT JOIN [RaceMeeting] rm ON r.race_meeting_id=rm.id "
        "WHERE r.status='RUNNING'"
    )

def recent_results():
    return query(
        "SELECT TOP 5 r.class_level AS classLevel, r.start_time AS startTime, rm.name as meetingName, "
        "h.name as horseName, re.final_position AS finalPosition, re.finish_time AS finishTime, re.prize_money AS prizeMoney "
        "FROM [RaceEntry] re "
        "JOIN [Race] r ON re.race_id=r.id "
        "JOIN [RaceMeeting] rm ON r.race_meeting_id=rm.id "
        "JOIN [Horse] h ON re.horse_id=h.id "
        "WHERE r.status='OFFICIAL' AND re.final_position IS NOT NULL "
        "ORDER BY r.start_time DESC"
    )

def get_horse(name):
    rows = query(
        "SELECT name, current_rating AS currentRating, total_wins AS totalWins, total_races AS totalRaces, breed "
        "FROM [Horse] WHERE name LIKE ? AND status='ACTIVE'",
        (f"%{name}%",)
    )
    return rows[0] if rows else None

def stats():
    def n(sql):
        r = query(sql)
        return list(r[0].values())[0] if r else 0
    return {
        "races":   n("SELECT COUNT(*) FROM [Race] WHERE status='OFFICIAL'"),
        "horses":  n("SELECT COUNT(*) FROM [Horse] WHERE status='ACTIVE'"),
        "jockeys": n("SELECT COUNT(*) FROM [User] WHERE role_id=3 AND status='ACTIVE'"),
    }

# ── Phân tích ý định ──────────────────────────────────────────────────────────
def intent(msg):
    m = msg.lower()
    if any(w in m for w in ["top ngựa","ngựa nào","rating cao","horse rating","ranking"]):
        return "top_horses"
    if any(w in m for w in ["nài","jockey","nai ngua"]):
        return "top_jockeys"
    if any(w in m for w in ["sắp tới","upcoming","lịch","schedule"]):
        return "upcoming"
    if any(w in m for w in ["đang chạy","running","live","đang đua"]):
        return "running"
    if any(w in m for w in ["kết quả","result","thắng gần","winner"]):
        return "results"
    if any(w in m for w in ["thống kê","statistics","bao nhiêu","how many","tổng"]):
        return "stats"
    m2 = re.search(r"(?:ngựa|horse|con)\s+([A-Za-zÀ-ỹ\s]+)", msg, re.IGNORECASE)
    if m2:
        return f"horse:{m2.group(1).strip()}"
    return "unknown"

# ── Tạo phản hồi ─────────────────────────────────────────────────────────────
def fmt(v):
    try: return f"${float(v):,.0f}" if v else "—"
    except: return "—"

def respond(it, lang):
    vi = lang != "en"

    if it == "top_horses":
        rows = top_horses()
        if not rows: return "Chưa có dữ liệu." if vi else "No data."
        h = "🏇 Top 5 Ngựa Rating Cao Nhất:\n\n" if vi else "🏇 Top 5 Horses by Rating:\n\n"
        for i, r in enumerate(rows, 1):
            wr = f"{r['totalWins']/r['totalRaces']*100:.1f}%" if r.get("totalRaces") else "—"
            h += f"{i}. {r['name']} — Rating: {r['currentRating']} | Thắng: {r['totalWins']}/{r['totalRaces']} ({wr}) | {r.get('breed','—')}\n"
        return h

    if it == "top_jockeys":
        rows = top_jockeys()
        if not rows: return "Chưa có dữ liệu." if vi else "No data."
        h = "🥇 Top 5 Nài Ngựa:\n\n" if vi else "🥇 Top 5 Jockeys:\n\n"
        for i, r in enumerate(rows, 1):
            total = r.get("totalRacesParticipated") or 0
            top3  = r.get("totalTop3Finishes") or 0
            rate  = f"{top3/total*100:.1f}%" if total else "—"
            h += f"{i}. {r['username']} — {total} lần | Top 3: {top3} ({rate}) | {r.get('weight','—')}kg\n"
        return h

    if it == "upcoming":
        rows = upcoming_races()
        if not rows: return "Không có trận sắp tới." if vi else "No upcoming races."
        h = "📅 Trận Đua Sắp Tới:\n\n" if vi else "📅 Upcoming Races:\n\n"
        for r in rows:
            h += f"• {r.get('meetingName','—')} | {r.get('classLevel','—')} | {r.get('distanceMeters','—')}m | ⏰ {r.get('startTime','—')}\n"
        return h

    if it == "running":
        rows = running_races()
        if not rows: return "Không có trận đang chạy." if vi else "No races running."
        h = "🔴 Đang Live:\n\n" if vi else "🔴 Currently Running:\n\n"
        for r in rows:
            h += f"• Race #{r['id']} | {r.get('meetingName','—')} | {r.get('classLevel','—')}\n"
        return h

    if it == "results":
        rows = recent_results()
        if not rows: return "Chưa có kết quả." if vi else "No results yet."
        h = "🏆 Kết Quả Gần Đây:\n\n" if vi else "🏆 Recent Results:\n\n"
        for r in rows:
            h += f"• #{r.get('finalPosition','—')} {r.get('horseName','—')} | {r.get('classLevel','—')} | ⏱ {r.get('finishTime','—')} | 💰 {fmt(r.get('prizeMoney'))}\n"
        return h

    if it == "stats":
        s = stats()
        if vi:
            return f"📊 Thống Kê:\n\n• Trận chính thức: {s['races']}\n• Ngựa hoạt động: {s['horses']}\n• Nài hoạt động: {s['jockeys']}"
        return f"📊 Statistics:\n\n• Official races: {s['races']}\n• Active horses: {s['horses']}\n• Active jockeys: {s['jockeys']}"

    if it.startswith("horse:"):
        name = it.split(":", 1)[1]
        h = get_horse(name)
        if not h: return f"Không tìm thấy ngựa '{name}'." if vi else f"Horse '{name}' not found."
        wr = f"{h['totalWins']/h['totalRaces']*100:.1f}%" if h.get("totalRaces") else "—"
        return f"🐴 {h['name']}\n• Giống: {h.get('breed','—')}\n• Rating: {h.get('currentRating','—')}\n• Thắng: {h.get('totalWins',0)}/{h.get('totalRaces',0)} ({wr})"

    if vi:
        return ("💡 Tôi có thể giúp:\n"
                "• 🏇 Top ngựa rating cao nhất\n"
                "• 🥇 Top nài ngựa xuất sắc\n"
                "• 📅 Lịch trận sắp tới\n"
                "• 🔴 Trận đang live\n"
                "• 🏆 Kết quả gần đây\n"
                "• 📊 Thống kê\n"
                "• 🐴 Thông tin ngựa (VD: 'ngựa Thunder King')")
    return ("💡 I can help with:\n"
            "• 🏇 Top rated horses\n• 🥇 Top jockeys\n"
            "• 📅 Upcoming races\n• 🔴 Live races\n"
            "• 🏆 Recent results\n• 📊 Statistics\n"
            "• 🐴 Horse info (e.g. 'horse Thunder King')")

# ── Gemini Self-Training Configuration & Grounding ───────────────────────────
def load_gemini_config():
    config_path = os.path.join(os.path.dirname(__file__), "gemini_config.json")
    default_config = {
        "model_name": "gemini-1.5-flash",
        "temperature": 0.3,
        "top_p": 0.95,
        "top_k": 40,
        "system_instruction": "You are the Gemini HKJC Assistant, an expert AI chatbot designed for the Hong Kong Jockey Club (HKJC) Horse Racing Tournament System. Your job is to answer spectator questions about horses, ratings, jockeys, upcoming/live races, and race results using ONLY the database context provided in the user prompt."
    }
    if not os.path.exists(config_path):
        return default_config
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Config Error] Failed to read config: {e}")
        return default_config

def get_db_grounding_context(user_msg):
    horses = top_horses()
    jockeys = top_jockeys()
    upcoming = upcoming_races()
    running = running_races()
    results = recent_results()
    st = stats()

    horse_info = ""
    m2 = re.search(r"(?:ngựa|horse|con)\s+([A-Za-zÀ-ỹ0-9\s]+)", user_msg, re.IGNORECASE)
    if m2:
        name = m2.group(1).strip()
        h = get_horse(name)
        if h:
            horse_info = f"\n- Specific Horse Queried ({name}): Name: {h['name']}, Breed: {h.get('breed','—')}, Rating: {h.get('currentRating','—')}, Wins/Races: {h.get('totalWins',0)}/{h.get('totalRaces',0)}"

    context = f"""[DATABASE REAL-TIME CONTEXT]
1. General Stats:
   - Official Completed Races: {st.get('races', 0)}
   - Active Horses: {st.get('horses', 0)}
   - Active Jockeys: {st.get('jockeys', 0)}

2. Top 5 Rated Horses:
{json.dumps(horses, default=str, ensure_ascii=False, indent=2)}

3. Top 5 Jockeys by Wins:
{json.dumps(jockeys, default=str, ensure_ascii=False, indent=2)}

4. Upcoming Scheduled Races:
{json.dumps(upcoming, default=str, ensure_ascii=False, indent=2)}

5. Live Running Races:
{json.dumps(running, default=str, ensure_ascii=False, indent=2)}

6. Recent Official Race Results:
{json.dumps(results, default=str, ensure_ascii=False, indent=2)}
{horse_info}
[END OF DATABASE CONTEXT]"""
    return context

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    msg  = (data.get("message") or "").strip()
    lang = data.get("lang", "vi")

    if not msg:
        return jsonify({"success": False, "reply": "Tin nhắn trống." if lang != "en" else "Empty message."})

    if is_blocked(msg):
        reply = ("⚠️ Tôi không được phép chia sẻ thông tin tài khoản hoặc mật khẩu. Liên hệ quản trị viên."
                 if lang != "en" else
                 "⚠️ I cannot share account or password information. Please contact the administrator.")
        return jsonify({"success": False, "reply": reply})

    config = load_gemini_config()
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("[AI Service] GEMINI_API_KEY not found. Falling back to rule-based responder.")
        it = intent(msg)
        reply = respond(it, lang)
        hint = "\n\n*(Chế độ dự phòng: Hãy cấu hình API Key trong file .env để kích hoạt trợ lý ảo AI)*" if lang != "en" else "\n\n*(Fallback mode: Configure API Key in .env to activate AI Assistant)*"
        return jsonify({"success": True, "reply": reply + hint})

    try:
        db_context = get_db_grounding_context(msg)
        
        generation_config = {
            "temperature": config.get("temperature", 0.3),
            "top_p": config.get("top_p", 0.95),
            "top_k": config.get("top_k", 40),
        }
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name=config.get("model_name", "gemini-1.5-flash"),
            system_instruction=config.get("system_instruction"),
            generation_config=generation_config
        )
        
        prompt = f"{db_context}\n\nUser Question: {msg}\nAnswer:"
        response = model.generate_content(prompt)
        
        reply = response.text if response.text else "Sorry, I couldn't generate a reply."
        return jsonify({"success": True, "reply": reply})
        
    except Exception as e:
        print(f"[Gemini API Error] {e}")
        it = intent(msg)
        reply = respond(it, lang)
        error_hint = f"\n\n*(Lỗi kết nối dịch vụ AI: {str(e)}. Sử dụng câu trả lời dự phòng)*" if lang != "en" else f"\n\n*(AI Service connection error: {str(e)}. Using fallback response)*"
        return jsonify({"success": True, "reply": reply + error_hint})

@app.route("/health")
def health():
    try:
        conn = get_conn(); conn.close()
        return jsonify({"status": "ok", "database": "connected"})
    except Exception as e:
        return jsonify({"status": "error", "database": str(e)}), 500

if __name__ == "__main__":
    print("🤖 AI Service running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)

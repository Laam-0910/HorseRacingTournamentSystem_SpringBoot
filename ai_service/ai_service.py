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
from google import genai
from google.genai import types
try:
    from groq import Groq as GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

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
    # ── HÀM LẤY DANH SÁCH 5 NÀI NGỰA XUẤT SẮC NHẤT ─────────────────────────────────────
    # [GIẢI THÍCH]:
    # 1. BẢNG [RaceEntry] LÀ GÌ? Đây là bảng trung gian lưu lịch sử thi đấu của từng cặp nài ngựa + ngựa.
    #    Chúng ta đếm số lần nài ngựa về NHẤT (final_position = 1) để biết số trận thắng (wins).
    # 2. TẠI SAO DÙNG LEFT JOIN? Để đảm bảo những nài ngựa mới đăng ký (chưa thắng trận nào, wins = NULL)
    #    vẫn được liệt kê đầy đủ trong danh sách hoạt động, thay vì bị loại bỏ khỏi bảng kết quả.
    # 3. HÀM COALESCE(w.wins, 0) LÀM GÌ? Nó kiểm tra nếu cột wins bị NULL (do chưa thắng trận nào), 
    #    thì tự động thay thế bằng số 0 để hiển thị trên giao diện đẹp mắt và tránh lỗi tính toán.
    # 4. BÍ DANH (AS totalWins, totalRacesParticipated...) ĐỂ LÀM GÌ? Các bí danh này được đặt theo dạng camelCase
    #    để tương thích khớp 100% với các key của Object mà Frontend/Backend Java đang sử dụng.
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

from datetime import datetime

def all_horses():
    return query(
        "SELECT h.id, h.name, h.breed, h.sex, h.current_rating AS currentRating, "
        "h.total_wins AS totalWins, h.total_races AS totalRaces, h.status, u.username AS ownerName "
        "FROM [Horse] h LEFT JOIN [User] u ON h.owner_id=u.id "
        "ORDER BY h.current_rating DESC"
    )

def all_jockeys():
    return query(
        "SELECT u.id, u.username, u.full_name AS fullName, u.weight, "
        "u.total_races_participated AS totalRacesParticipated, u.total_top3_finishes AS totalTop3Finishes, "
        "COALESCE(w.wins, 0) AS totalWins, u.status "
        "FROM [User] u LEFT JOIN ("
        "  SELECT jockey_id, COUNT(*) AS wins FROM [RaceEntry] WHERE final_position = 1 GROUP BY jockey_id"
        ") w ON u.id = w.jockey_id "
        "WHERE u.role_id=3 ORDER BY totalWins DESC"
    )

def all_race_meetings():
    return query(
        "SELECT rm.id, rm.name, rm.venue, rm.status, CONVERT(VARCHAR(10), rm.start_date, 105) AS startDate, "
        "rs.name AS seasonName "
        "FROM [RaceMeeting] rm LEFT JOIN [RaceSeason] rs ON rm.season_id=rs.id "
        "ORDER BY rm.start_date DESC"
    )

def all_races():
    return query(
        "SELECT r.id, r.class_level AS classLevel, r.distance_meters AS distanceMeters, "
        "r.track_type AS trackType, CONVERT(VARCHAR(19), r.start_time, 105) + ' ' + CONVERT(VARCHAR(8), r.start_time, 108) AS startTime, "
        "r.status, rm.name as meetingName, rm.venue "
        "FROM [Race] r LEFT JOIN [RaceMeeting] rm ON r.race_meeting_id=rm.id "
        "ORDER BY r.start_time DESC"
    )

def all_race_entries():
    return query(
        "SELECT re.id, re.race_id AS raceId, r.class_level AS classLevel, "
        "CONVERT(VARCHAR(19), r.start_time, 105) + ' ' + CONVERT(VARCHAR(8), r.start_time, 108) AS raceStartTime, "
        "h.name AS horseName, u.username AS jockeyName, re.gate_number AS gateNumber, "
        "re.status, re.carried_weight AS carriedWeight, re.final_position AS finalPosition, "
        "re.finish_time AS finishTime, re.prize_money AS prizeMoney "
        "FROM [RaceEntry] re "
        "JOIN [Race] r ON re.race_id=r.id "
        "JOIN [Horse] h ON re.horse_id=h.id "
        "JOIN [User] u ON re.jockey_id=u.id "
        "ORDER BY r.start_time DESC, re.final_position ASC"
    )

def all_violations():
    return query(
        "SELECT v.id, v.race_id AS raceId, h.name AS horseName, u.username AS jockeyName, "
        "v.description, v.penalty, v.status "
        "FROM [Violation] v "
        "LEFT JOIN [Horse] h ON v.horse_id=h.id "
        "LEFT JOIN [User] u ON v.jockey_id=u.id "
        "ORDER BY v.id DESC"
    )

def load_gemini_config():
    config_path = os.path.join(os.path.dirname(__file__), "gemini_config.json")
    default_config = {
        "model_name": "gemini-1.5-flash",
        "temperature": 0.3,
        "top_p": 0.95,
        "top_k": 40,
        "system_instruction": "You are the Gemini HKJC Assistant, an expert AI chatbot designed for the Hong Kong Jockey Club (HKJC) Horse Racing Tournament System. You have FULL access to the live SQL database context provided in the prompt. Answer spectator and admin questions accurately using the full database context provided."
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
    current_time_str = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    horses = all_horses()
    jockeys = all_jockeys()
    meetings = all_race_meetings()
    all_r = all_races()
    running = running_races()
    entries = all_race_entries()
    violations = all_violations()
    st = stats()

    context = f"""[FULL SYSTEM DATABASE REAL-TIME CONTEXT]
System Current Date & Time: {current_time_str}

1. Tournament Overview Stats:
   - Official Completed Races: {st.get('races', 0)}
   - Total Active Horses: {st.get('horses', 0)}
   - Total Active Jockeys: {st.get('jockeys', 0)}

2. All Registered Horses (Ratings, Wins, Breed, Owner):
{json.dumps(horses, default=str, ensure_ascii=False, indent=2)}

3. All Registered Jockeys (Races, Top 3, Wins, Weight):
{json.dumps(jockeys, default=str, ensure_ascii=False, indent=2)}

4. All Race Meetings:
{json.dumps(meetings, default=str, ensure_ascii=False, indent=2)}

5. All Tournament Races (Today, Scheduled, Running, Finished, Official):
{json.dumps(all_r, default=str, ensure_ascii=False, indent=2)}

6. Currently Live / Running Races:
{json.dumps(running, default=str, ensure_ascii=False, indent=2)}

7. All Race Participants & Official Entry Results:
{json.dumps(entries, default=str, ensure_ascii=False, indent=2)}

8. Steward Recorded Violations:
{json.dumps(violations, default=str, ensure_ascii=False, indent=2)}
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

    # ── Thu thập tất cả API keys (từ .env và gemini_config.json) ──────────────
    all_keys = []
    PLACEHOLDERS = {"YOUR_GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE", ""}

    # 1. Key chính từ .env: GEMINI_API_KEY
    k = os.getenv("GEMINI_API_KEY", "").strip()
    if k not in PLACEHOLDERS:
        all_keys.append(k)

    # 2. Các key phụ từ .env: GEMINI_API_KEY_2, GEMINI_API_KEY_3, ...
    for i in range(2, 10):
        k = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if k not in PLACEHOLDERS and k not in all_keys:
            all_keys.append(k)

    # 3. Các key từ gemini_config.json → gemini_api_keys (array)
    for k in config.get("gemini_api_keys", []):
        k = k.strip()
        if k not in PLACEHOLDERS and k not in all_keys:
            all_keys.append(k)

    # 4. Key đơn từ gemini_config.json → gemini_api_key
    k = config.get("gemini_api_key", "").strip()
    if k not in PLACEHOLDERS and k not in all_keys:
        all_keys.append(k)

    if not all_keys:
        print("[AI Service] Không tìm thấy GEMINI_API_KEY nào. Dùng chế độ dự phòng.")
        it = intent(msg)
        reply = respond(it, lang)
        hint = "\n\n*(Chế độ dự phòng: Hãy cấu hình API Key trong file .env để kích hoạt trợ lý ảo AI)*" if lang != "en" else "\n\n*(Fallback mode: Configure API Key in .env to activate AI Assistant)*"
        return jsonify({"success": True, "reply": reply + hint})

    # ── Thử lần lượt từng key ─────────────────────────────────────────────────
    db_context = get_db_grounding_context(msg)
    prompt = f"{db_context}\n\nUser Question: {msg}\nAnswer:"
    last_error = None

    for idx, api_key in enumerate(all_keys):
        try:
            print(f"[AI] Thử key #{idx+1}/{len(all_keys)}: ...{api_key[-8:]}")
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=config.get("model_name", "gemini-2.0-flash"),
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=config.get("system_instruction"),
                    temperature=config.get("temperature", 0.3),
                    top_p=config.get("top_p", 0.95),
                    top_k=config.get("top_k", 40),
                )
            )
            reply = response.text if response.text else "Sorry, I couldn't generate a reply."
            if idx > 0:
                print(f"[AI] Thành công với key #{idx+1}")
            return jsonify({"success": True, "reply": reply})

        except Exception as e:
            err_str = str(e)
            last_error = err_str
            print(f"[AI] Gemini Key #{idx+1} thất bại ({type(e).__name__}): {err_str[:120]}")
            continue

    # ── Tất cả Gemini key thất bại → thử Groq ───────────────────────────────
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if GROQ_AVAILABLE and groq_key and groq_key not in ("YOUR_GROQ_API_KEY", ""):
        try:
            print("[AI] Gemini thất bại. Chuyển sang Groq...")
            groq_client = GroqClient(api_key=groq_key)
            system_instr = config.get("system_instruction", "You are a helpful assistant for horse racing.")
            groq_response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_instr},
                    {"role": "user",   "content": prompt},
                ],
                temperature=config.get("temperature", 0.3),
                max_tokens=1024,
            )
            reply = groq_response.choices[0].message.content
            print("[AI] Groq phản hồi thành công.")
            return jsonify({"success": True, "reply": reply})
        except Exception as ge:
            import traceback
            traceback.print_exc()
            last_error = f"Groq Error: {str(ge)}"
            print(f"[AI] Groq thất bại: {str(ge)}")

    # Tất cả provider đều thất bại → rule-based fallback
    print(f"[AI] Tất cả provider đều thất bại. Dùng chế độ dự phòng.")
    it = intent(msg)
    reply = respond(it, lang)
    error_hint = f"\n\n*(Lỗi kết nối dịch vụ AI: {last_error}. Sử dụng câu trả lời dự phòng)*" if lang != "en" else f"\n\n*(AI Service connection error: {last_error}. Using fallback response)*"
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

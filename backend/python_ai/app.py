from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import chat
from predictor import predict_race, train_model
from session_memory import memory
from rag_engine import rag_engine

app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app)

# ── CONFIG CHATBOT RAG / LLM ─────────────────────────────────────────────────
import os, json
USE_GEMINI = True
GEMINI_API_KEY = "AQ.Ab8RN6IZfv4v5ic1ylYRrCy9Hl36wbt0g66fvdcBmuEMp8A0UQ"

# Thử load động từ file cấu hình
config_path = os.path.join(os.path.dirname(__file__), "gemini_config.json")
if os.path.exists(config_path):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            api_key = config.get("gemini_api_key", "").strip()
            if api_key and not api_key.startswith("YOUR_") and not api_key.startswith("Điền_"):
                GEMINI_API_KEY = api_key
    except Exception as e:
        print(f"[Config Loader Error] {e}")

rag_engine.use_gemini = USE_GEMINI
rag_engine.gemini_api_key = GEMINI_API_KEY

@app.route("/chat", methods=["POST"])
def chatbot():
    data = request.json or {}
    message = data.get("message", "").strip()
    lang = data.get("lang", None)
    session_id = data.get("sessionId", "default-user-session")

    if not message:
        return jsonify({"success": False, "error": "message is required"}), 400

    # ── BẢO MẬT: Chặn yêu cầu nhạy cảm liên quan đến tài khoản mật khẩu
    blocked_keywords = ["password", "mật khẩu", "passwd", "admin credential", "danh sách user", "danh sách tài khoản", "user credentials"]
    msg_lower = message.lower()
    if any(kw in msg_lower for kw in blocked_keywords):
        reply = (
            "⚠️ Tôi không được phép chia sẻ thông tin tài khoản, mật khẩu hoặc dữ liệu cá nhân của người dùng. Vui lòng liên hệ quản trị viên."
            if lang != "en" else
            "⚠️ I am not authorized to share account credentials, passwords, or personal information. Please contact the administrator."
        )
        return jsonify({"success": True, "reply": reply})

    # 1. Cập nhật ngữ cảnh hội thoại (Dialogue State Memory) từ tin nhắn mới
    memory.update_state_from_text(session_id, message)
    session = memory.get_session(session_id)
    state = session["state"]

    # 2. RAG: Lấy thông tin thực tế từ Database dựa trên state hiện tại
    db_context = rag_engine.retrieve_db_context(state)

    # 3. Lấy chuỗi lịch sử trò chuyện để làm ngữ cảnh
    chat_history = memory.get_history_context(session_id)

    # 4. Tạo phản hồi sử dụng LLM (Gemini hoặc Ollama local)
    # Nếu chưa bật Gemini hoặc không kết nối được Ollama, ta sẽ tự động fallback sang Chatbot rule-based gốc
    reply = ""
    try:
        reply = rag_engine.generate_answer(message, chat_history, db_context, lang)
    except Exception as e:
        reply = f"EXCEPTION: {str(e)}"
        
    # Fallback dự phòng nếu LLM không trả về kết quả hoặc lỗi API
    is_fallback = not reply or "Lỗi kết nối dịch vụ AI" in reply or "Lỗi gọi dịch vụ AI" in reply or "connection error" in reply.lower() or reply.startswith("EXCEPTION:")
    if is_fallback:
        reply = chat(message, lang)

    # 5. Lưu tin nhắn vào lịch sử session memory
    memory.add_message(session_id, message, reply)

    return jsonify({
        "success": True, 
        "reply": reply,
        "dialogueState": state
    })

@app.route("/predict/<int:race_id>", methods=["GET"])
def predict(race_id):
    try:
        result = predict_race(race_id)
        return jsonify({"success": True, "predictions": result, "race_id": race_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/train", methods=["POST"])
def retrain():
    model = train_model()
    return jsonify({"success": model is not None, "message": "Model retrained"})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
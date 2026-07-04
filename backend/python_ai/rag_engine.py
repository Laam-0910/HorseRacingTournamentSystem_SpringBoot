import pandas as pd
import requests
import json
import os
from db_connector import get_connection

class RAGEngine:
    """
    RAG (Retrieval-Augmented Generation) Engine.
    Tự động truy vấn thông tin thực tế từ database dựa trên ngữ cảnh hội thoại,
    sau đó gửi sang LLM (Gemini API hoặc Ollama local) để sinh câu trả lời tự nhiên, chính xác.
    """
    def __init__(self, use_gemini=False, gemini_api_key=None, ollama_url="http://localhost:11434/api/generate"):
        self.use_gemini = use_gemini
        self.gemini_api_key = gemini_api_key
        self.ollama_url = ollama_url
        self.model_name = "gemini-2.5-flash"

    def retrieve_db_context(self, state: dict) -> str:
        """
        Lấy thông tin thực tế từ database dựa trên trạng thái hội thoại hiện tại.
        """
        context_parts = []
        conn = get_connection()
        cursor = conn.cursor()

        # 1. Lấy thông tin ngựa nếu có trong ngữ cảnh
        if state.get("horse"):
            cursor.execute("""
                SELECT h.name, h.breed, h.current_rating, h.total_races, h.total_wins, h.status, u.username
                FROM Horse h
                LEFT JOIN [User] u ON h.owner_id = u.id
                WHERE h.name LIKE ?
            """, (f"%{state['horse']}%",))
            rows = cursor.fetchall()
            for r in rows:
                wr = (r[4] / r[3] * 100) if r[3] > 0 else 0
                context_parts.append(
                    f"Dữ liệu Ngựa: {r[0]}, giống {r[1]}, rating hiện tại {r[2]}, "
                    f"đã chạy {r[3]} trận, thắng {r[4]} trận (Tỷ lệ thắng: {wr:.1f}%), trạng thái {r[5]}, chủ sở hữu là {r[6]}."
                )

        # 2. Lấy thông tin nài ngựa nếu có trong ngữ cảnh
        if state.get("jockey"):
            cursor.execute("""
                SELECT username, weight, total_races_participated, total_top3_finishes, status
                FROM [User]
                WHERE role_id = 3 AND username LIKE ?
            """, (f"%{state['jockey']}%",))
            rows = cursor.fetchall()
            for r in rows:
                t3r = (r[3] / r[2] * 100) if r[2] > 0 else 0
                context_parts.append(
                    f"Dữ liệu Nài ngựa: {r[0]}, cân nặng {r[1]}kg, đã tham gia {r[2]} trận, "
                    f"đạt top 3 {r[3]} lần (Tỷ lệ top 3: {t3r:.1f}%), trạng thái hoạt động {r[4]}."
                )

        # 3. Lấy thông tin trận đấu (Race) nếu có trong ngữ cảnh
        if state.get("race_id"):
            cursor.execute("""
                SELECT r.id, r.class_level, r.distance_meters, r.track_type, r.status, r.start_time, rm.name
                FROM Race r
                LEFT JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
                WHERE r.id = ?
            """, (state["race_id"],))
            r = cursor.fetchone()
            if r:
                context_parts.append(
                    f"Dữ liệu Trận đấu: Trận số {r[0]}, phân hạng {r[1]}, cự ly {r[2]}m, "
                    f"mặt chạy {r[3]}, trạng thái {r[4]}, giờ bắt đầu {r[5]}, thuộc hội đua {r[6]}."
                )

        conn.close()
        return "\n".join(context_parts) if context_parts else "Không tìm thấy dữ liệu liên quan cụ thể trong Database giải đấu."

    def call_gemini(self, prompt: str) -> str:
        if not self.gemini_api_key:
            return "Lỗi: Chưa cấu hình GEMINI_API_KEY."
        
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text
            return "Lỗi: Không nhận được phản hồi từ Gemini API."
        except Exception as e:
            # Fallback về REST API dùng x-goog-api-key header (giúp hỗ trợ mã khóa dạng AQ. mới của Google)
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": self.gemini_api_key
            }
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=15)
                if res.status_code == 200:
                    data = res.json()
                    return data["contents"][0]["parts"][0]["text"]
                return f"Lỗi kết nối Gemini API (HTTP {res.status_code})"
            except Exception as ex:
                return f"Lỗi gọi Gemini API: {str(ex)}"

    def call_ollama(self, prompt: str) -> str:
        payload = {
            "model": "qwen2.5:1.5b", # Sử dụng model nhẹ tối ưu trên local máy của bạn
            "prompt": prompt,
            "stream": False
        }
        try:
            res = requests.post(self.ollama_url, json=payload, timeout=15)
            if res.status_code == 200:
                return res.json().get("response", "")
            return f"Lỗi kết nối Ollama local (Hãy chắc chắn Ollama đang chạy trên port 11434)"
        except Exception as e:
            return f"Lỗi kết nối Ollama local: {str(e)} (Hãy kiểm tra Ollama đã được khởi động chưa)"

    def generate_answer(self, user_msg: str, chat_history: str, db_context: str, lang: str) -> str:
        """
        Ghép dữ liệu thật thu được từ Database + Lịch sử trò chuyện + Câu hỏi của User
        để tạo Prompt tối ưu nhất cho LLM.
        """
        # Cấu hình mặc định
        system_instruction = (
            "Bạn là trợ lý AI chuyên nghiệp cho Hệ thống quản lý đua ngựa.\n"
            "Hãy sử dụng 'Thông tin giải đấu thực tế' dưới đây (được trích xuất trực tiếp từ Database hệ thống) "
            "để trả lời câu hỏi của người dùng một cách chính xác, tự nhiên và ngắn gọn.\n"
            "Không tự bịa đặt thông tin không có trong phần dữ liệu thực tế được cung cấp.\n"
            "Nếu người dùng hỏi các câu hỏi chung chung hoặc ngoài lề, hãy trả lời lịch sự dựa trên vai trò trợ lý của Hệ thống quản lý đua ngựa.\n"
        )
        
        # Load cấu hình động thời gian thực từ gemini_config.json
        config_path = os.path.join(os.path.dirname(__file__), "gemini_config.json")
        if os.path.exists(config_path):
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    api_key = config.get("gemini_api_key", "").strip()
                    if api_key and not api_key.startswith("YOUR_") and not api_key.startswith("Điền_"):
                        self.gemini_api_key = api_key
                        self.use_gemini = True
                    model_n = config.get("model_name", "").strip()
                    if model_n:
                        self.model_name = model_n
                    sys_inst = config.get("system_instruction", "").strip()
                    if sys_inst:
                        system_instruction = sys_inst
            except Exception as e:
                print(f"[Config Loader Error] Failed to read dynamic config: {e}")

        # Bảo mật: Nếu chưa có key trong gemini_config.json, thử đọc từ file .env riêng tư (không chia sẻ)
        if not self.gemini_api_key or self.gemini_api_key.startswith("YOUR_"):
            env_path = os.path.join(os.path.dirname(__file__), ".env")
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                k, v = line.split("=", 1)
                                if k.strip() == "GEMINI_API_KEY":
                                    val = v.strip()
                                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                        val = val[1:-1]
                                    if val and not val.startswith("YOUR_"):
                                        self.gemini_api_key = val
                                        self.use_gemini = True
                except Exception as e:
                    print(f"[Env Loader Error] Failed to read .env: {e}")

        prompt = (
            f"{system_instruction}\n"
            f"=== THÔNG TIN GIẢI ĐẤU THỰC TẾ TỪ DATABASE ===\n"
            f"{db_context}\n\n"
            f"=== LỊCH SỬ HỘI THOẠI GẦN ĐÂY ===\n"
            f"{chat_history if chat_history else '[Chưa có hội thoại trước]'}\n\n"
            f"=== CÂU HỎI MỚI CỦA USER ===\n"
            f"User: {user_msg}\n"
            f"Ngôn ngữ trả lời yêu cầu: {lang or 'vi'}\n"
            f"AI:"
        )

        if self.use_gemini:
            return self.call_gemini(prompt)
        else:
            return self.call_ollama(prompt)

# Khởi tạo engine RAG toàn cục
# Có thể đổi use_gemini=True và truyền api_key nếu muốn dùng cloud Gemini
rag_engine = RAGEngine(use_gemini=False)

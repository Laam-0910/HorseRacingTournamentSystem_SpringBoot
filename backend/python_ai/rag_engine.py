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
        self.gemini_api_keys = []
        self.current_key_idx = 0
        self.ollama_url = ollama_url
        self.model_name = "gemini-2.5-flash"
        # Groq fallback (khi tất cả Gemini key hết quota)
        self.groq_api_key = ""
        self.groq_api_keys = []
        self.current_groq_key_idx = 0
        self.groq_model = "llama-3.3-70b-versatile"  # Miễn phí, 14400 req/ngày

    def retrieve_db_context(self, state: dict) -> str:
        """
        Lấy thông tin thực tế từ database dựa trên trạng thái hội thoại hiện tại.
        Hỗ trợ cả ngữ cảnh cụ thể (ngựa, nài, trận) và thông tin giải đấu nền (top ngựa, top nài, lịch đấu, kết quả).
        """
        context_parts = []
        conn = get_connection()
        cursor = conn.cursor()

        # ── 1. LẤY THÔNG TIN CỤ THỂ (SPECIFIC ENTITY CONTEXT) ─────────────────
        # Lấy thông tin ngựa nếu có trong ngữ cảnh
        if state.get("horse"):
            try:
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
                        f"Dữ liệu chi tiết ngựa '{r[0]}': giống {r[1]}, rating hiện tại {r[2]}, "
                        f"đã chạy {r[3]} trận, thắng {r[4]} trận (Tỷ lệ thắng: {wr:.1f}%), trạng thái {r[5]}, chủ sở hữu là {r[6]}."
                    )
            except Exception as e:
                print(f"[RAG Query Error - Specific Horse] {e}")

        # Lấy thông tin nài ngựa nếu có trong ngữ cảnh
        if state.get("jockey"):
            try:
                cursor.execute("""
                    SELECT username, weight, total_races_participated, total_top3_finishes, status
                    FROM [User]
                    WHERE role_id = 3 AND username LIKE ?
                """, (f"%{state['jockey']}%",))
                rows = cursor.fetchall()
                for r in rows:
                    t3r = (r[3] / r[2] * 100) if r[2] > 0 else 0
                    context_parts.append(
                        f"Dữ liệu chi tiết nài ngựa '{r[0]}': cân nặng {r[1]}kg, đã tham gia {r[2]} trận, "
                        f"đạt top 3 {r[3]} lần (Tỷ lệ top 3: {t3r:.1f}%), trạng thái hoạt động {r[4]}."
                    )
            except Exception as e:
                print(f"[RAG Query Error - Specific Jockey] {e}")

        # Lấy thông tin trận đấu (Race) nếu có trong ngữ cảnh
        if state.get("race_id"):
            try:
                cursor.execute("""
                    SELECT r.id, r.class_level, r.distance_meters, r.track_type, r.status, r.start_time, rm.name
                    FROM Race r
                    LEFT JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
                    WHERE r.id = ?
                """, (state["race_id"],))
                r = cursor.fetchone()
                if r:
                    context_parts.append(
                        f"Dữ liệu chi tiết trận đấu #{r[0]}: phân hạng {r[1]}, cự ly {r[2]}m, "
                        f"sân chạy {r[3]}, trạng thái trận {r[4]}, giờ bắt đầu {r[5]}, thuộc hội đua {r[6]}."
                    )
            except Exception as e:
                print(f"[RAG Query Error - Specific Race] {e}")

        # ── 2. LẤY THÔNG TIN GIẢI ĐẤU NỀN (BASELINE CONTEXT - ALWAYS DYNAMIC) ──
        # Điều này cho phép AI trả lời các câu hỏi tổng quát ngay cả khi không có ngựa/trận đấu cụ thể nào hoạt động trong bộ nhớ chat
        
        # A. Thống kê chung giải đấu
        try:
            cursor.execute("SELECT COUNT(*) FROM Race WHERE status='OFFICIAL'")
            races_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM Horse WHERE status='ACTIVE'")
            horses_cnt = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM [User] WHERE role_id=3 AND status='ACTIVE'")
            jockeys_cnt = cursor.fetchone()[0]
            context_parts.append(
                f"[THỐNG KÊ GIẢI ĐẤU] Số trận đã kết thúc chính thức: {races_cnt} | Số ngựa đang hoạt động: {horses_cnt} | Số nài ngựa đang hoạt động: {jockeys_cnt}"
            )
        except Exception as e:
            print(f"[RAG Query Error - Stats] {e}")

        # B. Top 5 Ngựa Rating cao nhất
        try:
            cursor.execute("""
                SELECT TOP 5 name, breed, current_rating, total_races, total_wins
                FROM Horse WHERE status='ACTIVE' ORDER BY current_rating DESC
            """)
            horses = cursor.fetchall()
            if horses:
                context_parts.append("[DANH SÁCH TOP 5 NGỰA RATING CAO NHẤT]")
                for idx, h in enumerate(horses, 1):
                    wr = (h[4] / h[3] * 100) if h[3] > 0 else 0
                    context_parts.append(f"{idx}. {h[0]} (Giống: {h[1]} | Rating: {h[2]} | Đua: {h[3]} trận, Thắng: {h[4]} trận, Tỷ lệ thắng: {wr:.1f}%)")
        except Exception as e:
            print(f"[RAG Query Error - Top Horses] {e}")

        # C. Top 5 Nài ngựa xuất sắc nhất (Theo số lần lọt Top 3)
        try:
            cursor.execute("""
                SELECT TOP 5 username, weight, total_races_participated, total_top3_finishes
                FROM [User] WHERE role_id=3 AND status='ACTIVE' ORDER BY total_top3_finishes DESC
            """)
            jockeys = cursor.fetchall()
            if jockeys:
                context_parts.append("[DANH SÁCH TOP 5 NÀI NGỰA XUẤT SẮC NHẤT]")
                for idx, j in enumerate(jockeys, 1):
                    t3r = (j[3] / j[2] * 100) if j[2] > 0 else 0
                    context_parts.append(f"{idx}. {j[0]} (Nặng: {j[1]}kg | Số trận: {j[2]} | Top 3: {j[3]} lần, Tỷ lệ top 3: {t3r:.1f}%)")
        except Exception as e:
            print(f"[RAG Query Error - Top Jockeys] {e}")

        # D. Các trận đấu sắp tới (Scheduled / Open)
        try:
            cursor.execute("""
                SELECT TOP 3 r.id, r.class_level, r.distance_meters, r.track_type, r.start_time, rm.name
                FROM Race r
                JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
                WHERE r.status IN ('SCHEDULED','DECLARATION_OPEN','RACE_ASSIGNED')
                ORDER BY r.start_time ASC
            """)
            upcoming = cursor.fetchall()
            if upcoming:
                context_parts.append("[LỊCH THI ĐẤU SẮP TỚI]")
                for u in upcoming:
                    context_parts.append(f"- Trận #{u[0]} ({u[1]}): Cự ly {u[2]}m, Sân {u[3]} | Giờ chạy: {u[4]} | Hội đua: {u[5]}")
        except Exception as e:
            print(f"[RAG Query Error - Upcoming] {e}")

        # E. Trận đấu đang diễn ra (Live)
        try:
            cursor.execute("""
                SELECT r.id, r.class_level, rm.name
                FROM Race r
                JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
                WHERE r.status='RUNNING'
            """)
            running = cursor.fetchall()
            if running:
                context_parts.append("[TRẬN ĐẤU ĐANG DIỄN RA LIVE]")
                for r in running:
                    context_parts.append(f"- Trận #{r[0]} ({r[1]}) tại hội đua {r[2]} đang chạy!")
        except Exception as e:
            print(f"[RAG Query Error - Live] {e}")

        # F. Kết quả 3 trận gần đây nhất (Vô địch)
        try:
            cursor.execute("""
                SELECT TOP 3 r.id, r.class_level, h.name, re.finish_time, re.prize_money, u.username, rm.name
                FROM RaceEntry re
                JOIN Race r ON re.race_id = r.id
                JOIN Horse h ON re.horse_id = h.id
                JOIN [User] u ON re.jockey_id = u.id
                JOIN RaceMeeting rm ON r.race_meeting_id = rm.id
                WHERE re.status = 'FINISHED' AND re.final_position = 1
                ORDER BY r.start_time DESC
            """)
            results = cursor.fetchall()
            if results:
                context_parts.append("[KẾT QUẢ CÁC TRẬN GẦN NHẤT]")
                for r in results:
                    context_parts.append(f"- Trận #{r[0]} ({r[1]}): Ngựa thắng: {r[2]} | Thời gian: {r[3]} | Thưởng: ${r[4]:,.0f} | Nài: {r[5]} | Hội đua: {r[6]}")
        except Exception as e:
            print(f"[RAG Query Error - Recent Results] {e}")

        conn.close()
        return "\n".join(context_parts) if context_parts else "Không tìm thấy dữ liệu liên quan cụ thể trong Database giải đấu."

    def get_current_api_key(self) -> str:
        if self.gemini_api_keys:
            self.current_key_idx = self.current_key_idx % len(self.gemini_api_keys)
            return self.gemini_api_keys[self.current_key_idx]
        return self.gemini_api_key

    def rotate_api_key(self) -> None:
        if self.gemini_api_keys:
            self.current_key_idx = (self.current_key_idx + 1) % len(self.gemini_api_keys)
            print(f"[API Key Rotator] Rotated to key index: {self.current_key_idx}")

    def get_current_groq_key(self) -> str:
        """Lấy Groq API key hiện tại (có rotation)."""
        if self.groq_api_keys:
            return self.groq_api_keys[self.current_groq_key_idx % len(self.groq_api_keys)]
        return self.groq_api_key

    def call_groq(self, prompt: str, system_instruction: str = None) -> str:
        """
        Gọi Groq API (OpenAI-compatible) - miễn phí 14,400 req/ngày.
        Tự động thay thế Gemini khi hết quota.
        """
        keys = self.groq_api_keys if self.groq_api_keys else ([self.groq_api_key] if self.groq_api_key else [])
        if not keys:
            return ""

        for i, key in enumerate(keys):
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}"
            }
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})
            payload = {
                "model": self.groq_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=20)
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"]
                    print(f"[Groq Fallback] ✅ Key {i} OK - {len(text)} chars")
                    return text
                err = res.json().get("error", {}).get("message", f"HTTP {res.status_code}")[:100]
                print(f"[Groq Fallback] Key {i} failed: {err}")
                if "429" in str(res.status_code) or "rate" in err.lower():
                    self.current_groq_key_idx = (self.current_groq_key_idx + 1) % max(len(keys), 1)
                    continue
            except Exception as e:
                print(f"[Groq Fallback] Exception key {i}: {e}")
        return ""

    def call_gemini(self, prompt: str, system_instruction: str = None) -> str:
        keys_count = len(self.gemini_api_keys) if self.gemini_api_keys else 1
        
        for attempt in range(keys_count):
            api_key = self.get_current_api_key()
            if not api_key:
                return "Lỗi: Chưa cấu hình API Key cho dịch vụ AI."
            
            print(f"[RAG Engine] Attempt {attempt + 1}: Using key index {self.current_key_idx if self.gemini_api_keys else 0} ({api_key[:10]}...)")
            
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(self.model_name, system_instruction=system_instruction)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
                raise Exception("Empty response from genai SDK")
            except Exception as e:
                error_msg = str(e)
                print(f"[RAG Engine SDK Error] {error_msg}")
                
                # Fallback về REST API dùng x-goog-api-key header
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
                headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": api_key
                }
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                if system_instruction:
                    payload["systemInstruction"] = {
                        "parts": [{"text": system_instruction}]
                    }
                try:
                    res = requests.post(url, headers=headers, json=payload, timeout=20)
                    if res.status_code == 200:
                        data = res.json()
                        # ⚠️ Đúng path: candidates[0]["content"]["parts"][0]["text"]
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text:
                            return text
                        raise Exception("Empty candidates text from REST API")
                    
                    error_msg = f"HTTP {res.status_code}"
                except Exception as ex:
                    error_msg = f"Request failed: {str(ex)}"
                
                print(f"[RAG Engine REST Error] {error_msg}")
                
                # Kiểm tra xem có phải lỗi rate limit/quota hay không để xoay key
                is_quota_error = any(w in error_msg.lower() for w in ["429", "resourceexhausted", "quota", "limit"])
                if is_quota_error and self.gemini_api_keys and attempt < keys_count - 1:
                    print(f"[RAG Engine] Rate limit hit on key index {self.current_key_idx}. Rotating key...")
                    self.rotate_api_key()
                    continue
                else:
                    # Thử Groq fallback ngay lập tức nếu là lỗi quota
                    if is_quota_error:
                        groq_reply = self.call_groq(prompt, system_instruction)
                        if groq_reply:
                            print("[Fallback Chain] Gemini → Groq ✅")
                            return groq_reply
                    return f"Lỗi kết nối dịch vụ AI ({error_msg})"
                    
        # Tất cả Gemini key đều hết - thử Groq làm fallback cuối
        return self._gemini_all_quota_exhausted(prompt, system_instruction)

    def _gemini_all_quota_exhausted(self, prompt: str, system_instruction: str = None) -> str:
        """Khi tất cả Gemini keys bị 429, thử Groq trước khi báo lỗi."""
        groq_reply = self.call_groq(prompt, system_instruction)
        if groq_reply:
            print("[Fallback Chain] Gemini exhausted → Groq ✅")
            return groq_reply
        return "Lỗi kết nối dịch vụ AI (HTTP 429 - Tất cả API Key đều hết lượt)"

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
            "Bạn là Trợ lý ảo AI nội bộ của Hệ thống quản lý giải đấu đua ngựa (do đội ngũ phát triển dự án xây dựng). Bạn sử dụng mô hình Gemini 3.5 Flash để hoạt động nhưng Tuyệt đối KHÔNG được nhận mình là của Google hay tự xưng tên là Gemini. Nếu người dùng hỏi bạn là ai hay ai tạo ra bạn, hãy khẳng định bạn là Trợ lý AI tích hợp sẵn của hệ thống đua ngựa này.\n\n"
            "Cá tính và quy tắc ứng xử của bạn:\n"
            "1. Bạn có phong cách trả lời vô cùng lém lỉnh, dí dỏm, thông minh và linh hoạt. Bạn không bị bó buộc bởi các quy định cứng nhắc, ngoại trừ quy định bảo mật bắt buộc.\n"
            "2. Bảo mật tối cao: Tuyệt đối không tiết lộ thông tin nhạy cảm (như mật khẩu, tài khoản cá nhân, thông tin kỹ thuật của hệ thống). Ngoài giới hạn bảo mật này ra, bạn được TỰ DO trả lời và thảo luận mọi chủ đề với người dùng.\n"
            "3. Khi trả lời các câu hỏi ngoài lề (không liên quan đến đua ngựa), hãy luôn tìm cách lái câu trả lời liên đới về hệ thống đua ngựa một cách sáng tạo và khôi hài:\n"
            "   - Nếu hỏi về viết code/lập trình: Trả lời khéo là bạn không hỗ trợ lập trình trực tiếp mà khuyên họ nên nhờ các con AI lập trình chuyên dụng khác giúp đỡ.\n"
            "   - Nếu hỏi về tình cảm, muốn có người yêu (ny): Hãy khuyên họ rèn luyện cơ bắp cuồn cuộn để trở thành một nài ngựa (jockey) chuyên nghiệp xuất sắc, lọt top bảng xếp hạng giải đấu của hệ thống, lúc đó tự khắc sẽ có hàng tá người hâm mộ vây quanh!\n"
            "   - Nếu hỏi cách để thông minh hơn: Hãy bảo họ chịu khó đọc thêm nhiều sách chăn nuôi và chăm sóc ngựa chiến để cung cấp kiến thức hoặc chiến mã vô địch cho trường đua.\n"
            "   - Với các câu hỏi tán gẫu khác: Hãy liên kết hài hước với việc cưỡi ngựa, chăm ngựa, cá cược vui vẻ hoặc luật lệ của giải đấu.\n"
            "4. Khi trả lời về dữ liệu giải đấu thực tế (ngựa, nài, kết quả trận đấu), hãy luôn đối chiếu với 'Thông tin giải đấu thực tế' từ Database được cung cấp để đưa ra số liệu chuẩn xác nhất."
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
                    # Load Groq config
                    groq_key = config.get("groq_api_key", "").strip()
                    if groq_key and not groq_key.startswith("YOUR_"):
                        self.groq_api_key = groq_key
                    groq_keys = config.get("groq_api_keys", [])
                    if groq_keys:
                        self.groq_api_keys = [k for k in groq_keys if k and not k.startswith("YOUR_")]
                    groq_model = config.get("groq_model", "").strip()
                    if groq_model:
                        self.groq_model = groq_model
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
            return self.call_gemini(prompt, system_instruction=system_instruction)
        else:
            return self.call_ollama(f"System Instruction: {system_instruction}\n\n{prompt}")

# Khởi tạo engine RAG toàn cục
# Có thể đổi use_gemini=True và truyền api_key nếu muốn dùng cloud Gemini
rag_engine = RAGEngine(use_gemini=False)

class SessionMemory:
    """
    Quản lý ngữ cảnh và lịch sử cuộc trò chuyện (Conversation Memory / Dialogue State).
    Nhớ các thực thể như ngựa, nài, trận đấu từ các câu chat trước để trả lời câu sau một cách tự nhiên.
    """
    def __init__(self, limit=10):
        self.limit = limit
        # Cấu trúc: { session_id: { "history": [(user_msg, bot_msg), ...], "state": { "horse": None, "jockey": None, "race_id": None } } }
        self.sessions = {}

    def get_session(self, session_id: str) -> dict:
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "history": [],
                "state": {
                    "horse": None,
                    "jockey": None,
                    "race_id": None
                }
            }
        return self.sessions[session_id]

    def update_state_from_text(self, session_id: str, text: str):
        """
        Phân tích văn bản của người dùng để cập nhật ngữ cảnh (State) của cuộc hội thoại.
        """
        import re
        session = self.get_session(session_id)
        state = session["state"]
        text_lower = text.lower()

        # 1. Trích xuất tên ngựa (ví dụ: "ngựa Thunder King", "ngựa Golden Flash")
        horse_match = re.search(r"(?:ngựa|horse|con)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", text, re.IGNORECASE)
        if horse_match:
            state["horse"] = horse_match.group(1).strip()

        # 2. Trích xuất tên nài (ví dụ: "nài jockey_ryan", "nài ryan")
        jockey_match = re.search(r"(?:nài|jockey|nài ngựa)\s+([A-Za-z0-9_\u4e00-\u9fff\u3040-\u30ff ]+)", text, re.IGNORECASE)
        if jockey_match:
            state["jockey"] = jockey_match.group(1).strip()

        # 3. Trích xuất mã trận đấu (ví dụ: "trận 1", "race 3")
        race_match = re.search(r"(?:trận|race|trận đấu)\s+(\d+)", text_lower)
        if race_match:
            state["race_id"] = int(race_match.group(1))

    def add_message(self, session_id: str, user_msg: str, bot_msg: str):
        session = self.get_session(session_id)
        session["history"].append((user_msg, bot_msg))
        # Giới hạn số lượng hội thoại nhớ được để tránh phình dung lượng
        if len(session["history"]) > self.limit:
            session["history"].pop(0)

    def get_history_context(self, session_id: str) -> str:
        """
        Định dạng lịch sử chat thành văn bản để gửi vào Prompt của LLM.
        """
        session = self.get_session(session_id)
        if not session["history"]:
            return ""
        
        context_lines = []
        for u, b in session["history"]:
            context_lines.append(f"User: {u}")
            context_lines.append(f"AI: {b}")
        return "\n".join(context_lines)

# Khởi tạo đối tượng quản lý session memory toàn cục
memory = SessionMemory()

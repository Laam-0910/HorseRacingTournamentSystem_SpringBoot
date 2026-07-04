# Horse Racing AI Service

## Cài đặt

```bash
cd ai_service
pip install -r requirements.txt
python ai_service.py
```

Service chạy tại: `http://localhost:8001`

## Cấu hình Môi trường & Database

Tạo file `.env` trong thư mục `ai_service/` để cấu hình kết nối database và kích hoạt Gemini:

```env
# Kết nối SQL Server
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=HorseRacingDB
DB_USER=sa
DB_PASSWORD=12345

# Kích hoạt Gemini API (Lấy khóa từ Google AI Studio)
GEMINI_API_KEY=AIzaSy...
```

*Mặc định nếu thiếu DB config sẽ dùng thông tin giống `application.yml` của Spring Boot. Nếu thiếu `GEMINI_API_KEY`, hệ thống sẽ tự động chạy ở chế độ dự phòng (fallback regex).*

## Tự Huấn luyện Trợ lý AI (Self-Training Config)

Bạn có thể thay đổi tính cách, giọng văn, chỉ thị đặc biệt hoặc mô hình AI của Trợ lý thông qua file [gemini_config.json](gemini_config.json):

*   `model_name`: Mặc định là `gemini-1.5-flash` (tốc độ cao) hoặc đổi sang `gemini-1.5-pro` (phân tích thông minh hơn).
*   `system_instruction`: System Prompt định hình quy tắc và cách ứng xử của AI. Thay đổi trực tiếp tại đây để huấn luyện AI theo ý bạn.
*   `temperature`: Điều chỉnh tính sáng tạo (từ 0.0 đến 1.0).

*Mọi thay đổi trong `gemini_config.json` sẽ được nạp trực tiếp tức thời cho từng câu hỏi tiếp theo mà không cần khởi động lại Flask server!*

## Endpoints

| Method | URL | Mô tả |
|--------|-----|--------|
| `POST` | `/chat` | Gửi tin nhắn, nhận trả lời AI |
| `GET`  | `/health` | Kiểm tra kết nối DB |

### Body `/chat`:
```json
{ "message": "Top ngựa rating cao nhất?", "lang": "vi" }
```

## Bảo mật

Các câu hỏi về `password`, `tài khoản`, `mật khẩu`, SQL injection keywords... sẽ bị **chặn tự động** và trả về cảnh báo.

## Đổi frontend gọi sang Python service

Trong `Spectator.tsx`, thay:
```typescript
const res = await api.post<any>("/public/chat", { message: messageText, lang });
```
Thành:
```typescript
const res = await fetch("http://localhost:8001/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: messageText, lang })
}).then(r => r.json());
```

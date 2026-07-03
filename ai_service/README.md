# Horse Racing AI Service

## Cài đặt

```bash
cd ai_service
pip install -r requirements.txt
python ai_service.py
```

Service chạy tại: `http://localhost:8001`

## Cấu hình DB (tuỳ chọn)

Tạo file `.env` trong thư mục `ai_service/`:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=HorseRacingDB
DB_USER=sa
DB_PASSWORD=12345
```

Mặc định dùng thông tin giống `application.yml` của Spring Boot.

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

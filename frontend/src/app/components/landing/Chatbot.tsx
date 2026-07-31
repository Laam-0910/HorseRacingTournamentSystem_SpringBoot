import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrMsg } from "../../../lib/api";
import { parseMarkdownToHtml } from "../../utils/markdownParser";

// Khai báo kiểu cấu trúc dữ liệu cho một Tin nhắn (Message) trong Chatbot
interface Message {
  sender: "user" | "bot"; // Người gửi: có thể là "user" (người dùng) hoặc "bot" (hệ thống AI)
  text: string;           // Nội dung văn bản của tin nhắn
  isHtml?: boolean;       // Biến tùy chọn xác định tin nhắn có cần render dưới dạng HTML không (phục vụ markdown)
}

/**
 * Component Chatbot - Trang giao diện trò chuyện trực tiếp với Trợ lý AI trường đua ngựa.
 * Hỗ trợ hỏi đáp thông tin, dự đoán kết quả và tra cứu dữ liệu trường đua bằng tiếng Việt.
 */
export default function Chatbot() {
  // State quản lý danh sách tin nhắn trong cuộc hội thoại, khởi tạo với lời chào mặc định từ bot
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Xin chào! Tôi là Trợ lý AI trường đua ngựa. Bạn có thể hỏi tôi bất kỳ thông tin nào về giải đấu, nài ngựa, ngựa đua hoặc vi phạm. (Ví dụ: 'Top 3 ngựa xuất sắc nhất' hoặc 'Thông tin ngựa Storm')",
      isHtml: false,
    },
  ]);
  // State lưu trữ nội dung đang nhập vào trong ô input
  const [input, setInput] = useState("");
  // State lưu trạng thái đang tải (đang chờ phản hồi từ AI server)
  const [loading, setLoading] = useState(false);
  // Ref trỏ tới phần tử DOM của khung chat để phục vụ tính năng tự động cuộn xuống dưới
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Hook để điều hướng chuyển trang
  const navigate = useNavigate();
  // Khởi tạo và giữ cố định ID phiên làm việc (sessionId) ngẫu nhiên cho chatbot trong phiên này
  const [sessionId] = useState(() => "session-" + Math.random().toString(36).substr(2, 9));

  // Hàm thực hiện cuộn khung chat xuống dưới cùng khi có tin nhắn mới
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight, // Cuộn tới chiều cao tối đa của vùng chứa
        behavior: "smooth",                        // Hiệu ứng cuộn mượt mà
      });
    }
  };

  // Mỗi khi danh sách tin nhắn thay đổi, tự động cuộn màn hình chat xuống dưới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm xử lý gửi tin nhắn của người dùng lên máy chủ AI
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn hành vi tải lại trang mặc định của thẻ form
    if (!input.trim() || loading) return; // Nếu ô nhập trống hoặc đang tải thì không xử lý

    const userMessage = input.trim(); // Lấy nội dung tin nhắn và xóa khoảng trắng thừa
    setInput(""); // Reset ô nhập liệu về trống
    // Thêm tin nhắn của user vào danh sách tin nhắn hiển thị
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setLoading(true); // Bật trạng thái loading hiển thị dấu 3 chấm đang xử lý

    try {
      // Gửi yêu cầu HTTP POST đến proxy backend (/ai/chat) để giao tiếp với chatbot Python
      const res = await api.post<any>("/ai/chat", { message: userMessage, lang: "en", sessionId });
      if (res.success && res.reply) {
        // Nếu thành công và nhận được câu trả lời từ AI, thêm tin nhắn bot với định dạng render HTML
        setMessages((prev) => [...prev, { sender: "bot", text: res.reply, isHtml: true }]);
      } else {
        // Trường hợp API phản hồi lỗi nghiệp vụ từ phía máy chủ
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Xin lỗi, hiện tại tôi không thể kết nối tới cơ sở dữ liệu." },
        ]);
      }
    } catch (err: any) {
      // Trường hợp xảy ra lỗi mạng hoặc lỗi kết nối đến server Spring Boot/AI
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Đã xảy ra lỗi khi kết nối tới máy chủ AI: " + (getErrMsg(err, "Unknown error")) },
      ]);
    } finally {
      setLoading(false); // Tắt trạng thái chờ
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-black/60 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header - Thanh đầu trang */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        {/* Logo và Tên tiêu đề click được để quay về trang chủ */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500 text-black font-bold font-serif text-xl shadow-lg">
            H
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
            AI ASSISTANT
          </span>
        </div>
        {/* Nút quay lại trang chủ Landing */}
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 border border-white/5 hover:bg-[#151310]/50 text-sm font-medium rounded-xl transition"
        >
          Back to Home
        </button>
      </header>

      {/* Vùng Khung Chat */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between overflow-hidden">
        {/* Khu vực cuộn hiển thị nội dung tin nhắn */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4 max-h-[calc(100vh-230px)]"
        >
          {messages.map((m, idx) => (
            // Căn lề phải cho user, lề trái cho bot
            <div
              key={idx}
              className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bóng hội thoại được tạo kiểu theo vai trò người gửi */}
              <div
                className={`max-w-[85%] p-4 rounded-2xl border text-sm shadow-md leading-relaxed ${
                  m.sender === "user"
                    ? "bg-amber-500/10 border-amber-500/20 text-white rounded-br-none" // Kiểu tin nhắn của User (Vàng đen)
                    : "bg-[#151310]/50 border-white/10 text-slate-100 rounded-bl-none overflow-x-auto" // Kiểu tin nhắn của Bot (Xám đen)
                }`}
              >
                {m.sender === "bot" ? (
                  // Nếu là bot, render markdown đã phân tích thành HTML an toàn
                  <div
                    className="prose prose-invert max-w-none chatbot-response"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(m.text) }}
                  />
                ) : (
                  // Nếu là user, render chuỗi text thông thường
                  <p>{m.text}</p>
                )}
              </div>
            </div>
          ))}
          {/* Component dấu ba chấm chạy nhấp nháy khi AI đang phân tích dữ liệu */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#151310]/50 border border-white/10 p-4 rounded-2xl rounded-bl-none text-sm text-white/60 flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Form nhập liệu tin nhắn và nút gửi */}
        <form onSubmit={handleSend} className="relative mt-2">
          <input
            type="text"
            value={input}
            disabled={loading} // Vô hiệu hóa input khi đang tải
            onChange={(e) => setInput(e.target.value)}
            className="w-full pl-6 pr-16 py-4 bg-[#151310]/60 border border-white/5 rounded-2xl placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm transition"
            placeholder="Hỏi về nài ngựa, kết quả đua..."
          />
          {/* Nút gửi tin nhắn */}
          <button
            type="submit"
            disabled={!input.trim() || loading} // Vô hiệu hóa nút nếu không có ký tự nhập
            className="absolute right-3 top-2.5 h-10 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}

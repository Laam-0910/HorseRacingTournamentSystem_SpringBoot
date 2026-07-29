/**
 * A lightweight, safe Markdown to HTML parser for the Horse Racing AI Chatbot.
 * Converts bold (**), italic (*), lists (- / * / 1.), headers (# / ## / ###), and line breaks.
 */
export function parseMarkdownToHtml(markdown: string): string { // Hàm chuyển đổi chuỗi markdown thành HTML
  if (!markdown) return ""; // Trả về chuỗi rỗng nếu markdown đầu vào bị trống hoặc null

  let html = markdown; // Khởi tạo biến html với nội dung markdown ban đầu

  // 1. Escape HTML special characters to prevent XSS
  html = html // Gán lại biến html với các ký tự đã được escape
    .replace(/&/g, "&amp;") // Thay thế ký tự & thành thực thể HTML để tránh lỗi hiển thị
    .replace(/</g, "&lt;") // Thay thế dấu nhỏ hơn thành thực thể HTML để chống XSS
    .replace(/>/g, "&gt;"); // Thay thế dấu lớn hơn thành thực thể HTML để chống XSS

  // 2. Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Chuyển đổi cú pháp in đậm của markdown thành thẻ strong HTML

  // 3. Italic: *text* or _text_ -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>"); // Chuyển đổi cú pháp in nghiêng bằng dấu sao thành thẻ em HTML
  html = html.replace(/_(.*?)_/g, "<em>$1</em>"); // Chuyển đổi cú pháp in nghiêng bằng dấu gạch dưới thành thẻ em HTML

  // 4. Headers
  html = html.replace(/^### (.*)$/gm, "<h4 style='color:#C9A84C;margin-top:10px;margin-bottom:6px;font-weight:bold;font-size:1.1em;'>$1</h4>"); // Chuyển đổi H3 của markdown thành thẻ H4 có css styling
  html = html.replace(/^## (.*)$/gm, "<h3 style='color:#C9A84C;margin-top:12px;margin-bottom:8px;font-weight:bold;font-size:1.2em;'>$1</h3>"); // Chuyển đổi H2 của markdown thành thẻ H3 có css styling
  html = html.replace(/^# (.*)$/gm, "<h2 style='color:#C9A84C;margin-top:14px;margin-bottom:10px;font-weight:bold;font-size:1.3em;'>$1</h2>"); // Chuyển đổi H1 của markdown thành thẻ H2 có css styling

  // 5. Bullet Lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:disc;margin-bottom:4px;'>$1</li>"); // Chuyển đổi danh sách không thứ tự (dấu gạch/sao) thành thẻ li HTML

  // 6. Ordered Lists
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:decimal;margin-bottom:4px;'>$2</li>"); // Chuyển đổi danh sách có thứ tự (số) thành thẻ li HTML

  // 7. Line Breaks
  html = html.replace(/\n/g, "<br />"); // Thay thế các ký tự xuống dòng thành thẻ br HTML

  return html; // Trả về chuỗi HTML cuối cùng sau khi đã parse
}

/**
 * Trình phân tích cú pháp Markdown sang HTML dung lượng nhẹ và an toàn dành cho Chatbot AI.
 * - Chuyển đổi định dạng chữ đậm (**), chữ nghiêng (*), danh sách (- / * / 1.), tiêu đề (# / ## / ###) và ngắt dòng (\n).
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // 1. Mã hóa các ký tự đặc biệt của HTML (Escape HTML) để chống lỗi bảo mật XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Chuyển đổi định dạng Chữ đậm: **văn bản** -> <strong>văn bản</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3. Chuyển đổi định dạng Chữ nghiêng: *văn bản* hoặc _văn bản_ -> <em>văn bản</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // 4. Chuyển đổi các Tiêu đề (Headers)
  html = html.replace(/^### (.*)$/gm, "<h4 style='color:#C9A84C;margin-top:10px;margin-bottom:6px;font-weight:bold;font-size:1.1em;'>$1</h4>");
  html = html.replace(/^## (.*)$/gm, "<h3 style='color:#C9A84C;margin-top:12px;margin-bottom:8px;font-weight:bold;font-size:1.2em;'>$1</h3>");
  html = html.replace(/^# (.*)$/gm, "<h2 style='color:#C9A84C;margin-top:14px;margin-bottom:10px;font-weight:bold;font-size:1.3em;'>$1</h2>");

  // 5. Chuyển đổi các Danh sách không thứ tự (Bullet Lists)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:disc;margin-bottom:4px;'>$1</li>");

  // 6. Chuyển đổi các Danh sách có thứ tự (Ordered Lists)
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:decimal;margin-bottom:4px;'>$2</li>");

  // 7. Chuyển đổi ký tự xuống dòng (\n) thành thẻ ngắt dòng của HTML (<br />)
  html = html.replace(/\n/g, "<br />");

  return html;
}

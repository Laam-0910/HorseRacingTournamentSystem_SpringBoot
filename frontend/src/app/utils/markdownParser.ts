/**
 * A lightweight, safe Markdown to HTML parser for the Horse Racing AI Chatbot.
 * Converts bold (**), italic (*), lists (- / * / 1.), headers (# / ## / ###), and line breaks.
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // 1. Escape HTML special characters to prevent XSS
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3. Italic: *text* or _text_ -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");

  // 4. Headers
  html = html.replace(/^### (.*)$/gm, "<h4 style='color:#C9A84C;margin-top:10px;margin-bottom:6px;font-weight:bold;font-size:1.1em;'>$1</h4>");
  html = html.replace(/^## (.*)$/gm, "<h3 style='color:#C9A84C;margin-top:12px;margin-bottom:8px;font-weight:bold;font-size:1.2em;'>$1</h3>");
  html = html.replace(/^# (.*)$/gm, "<h2 style='color:#C9A84C;margin-top:14px;margin-bottom:10px;font-weight:bold;font-size:1.3em;'>$1</h2>");

  // 5. Bullet Lists
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:disc;margin-bottom:4px;'>$1</li>");

  // 6. Ordered Lists
  html = html.replace(/^\s*(\d+)\.\s+(.*)$/gm, "<li style='margin-left:16px;list-style-type:decimal;margin-bottom:4px;'>$2</li>");

  // 7. Line Breaks
  html = html.replace(/\n/g, "<br />");

  return html;
}

/**
 * Phân tích cú pháp URL YouTube và trích xuất mã ID video 11 ký tự độc nhất.
 * - Hỗ trợ các định dạng URL xem tiêu chuẩn (watch?v=), dạng rút gọn trên di động (youtu.be/),
 *   dạng phát trực tiếp (/live/), dạng video ngắn (/shorts/), và liên kết nhúng (/embed/).
 */
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const tempUrl = url.trim(); // Loại bỏ khoảng trắng thừa hai đầu
  
  // Khai báo các mẫu Regex cho các đường dẫn đặc thù của YouTube
  const pathPatterns = [
    /\/live\/([^"&?\/\s]{11})/,
    /\/shorts\/([^"&?\/\s]{11})/,
    /\/embed\/([^"&?\/\s]{11})/,
    /\/v\/([^"&?\/\s]{11})/
  ];
  
  // Duyệt qua từng mẫu Regex để tìm kiếm ID khớp có độ dài đúng 11 ký tự
  for (const pattern of pathPatterns) {
    const match = tempUrl.match(pattern);
    if (match && match[1].length === 11) {
      return match[1];
    }
  }
  
  // Hỗ trợ rút gọn dạng: youtu.be/VIDEO_ID
  if (tempUrl.includes("youtu.be/")) {
    const parts = tempUrl.split("youtu.be/");
    if (parts.length > 1) {
      const id = parts[1].split(/[?#]/)[0];
      if (id.length === 11) return id;
    }
  }
  
  // Hỗ trợ dạng chuẩn: watch?v=VIDEO_ID
  const regExp = /[?&]v=([^"&?\/\s]{11})/;
  const match = tempUrl.match(regExp);
  if (match && match[1].length === 11) {
    return match[1];
  }
  
  return null; // Trả về null nếu không khớp định dạng video YouTube nào
}

/**
 * Tạo URL liên kết nhúng (Embed URL) cho thẻ iframe từ bất kỳ liên kết YouTube nào.
 * - Nếu không tìm được ID YouTube nhưng chuỗi là URL hợp lệ, trả về nguyên bản.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const id = getYouTubeId(url);
  if (id) {
    // Trả về liên kết nhúng chuẩn của YouTube
    return `https://www.youtube.com/embed/${id}`;
  }
  // Nếu là URL web khác bắt đầu bằng giao thức http/https, trả về chính nó làm liên kết thay thế
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return null;
}

/**
 * Trình phân tích cú pháp an toàn để chuyển các định dạng chuỗi ngày tháng khác nhau thành Date:
 * - dd-MM-yyyy HH:mm:ss
 * - dd-MM-yyyy HH-mm-ss
 * - yyyy-MM-ddTHH:mm:ss
 * - yyyy-MM-dd HH:mm:ss
 */
export const parseSafeDate = (str: string): Date | null => {
  // Nếu chuỗi rỗng hoặc null, trả về null ngay lập tức
  if (!str) return null;
  // Loại bỏ khoảng trắng thừa ở hai đầu chuỗi
  const cleanStr = str.trim();

  // Khớp định dạng dd-MM-yyyy HH:mm:ss hoặc dd-MM-yyyy HH:mm bằng biểu thức chính quy (Regex)
  // (Cần kiểm tra định dạng này trước khi dùng hàm Date mặc định để tránh việc hiểu sai dd-MM-yyyy thành MM-DD-YYYY)
  const dmyMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})[ T](\d{2})[-:](\d{2})(?:[-:](\d{2}))?/);
  if (dmyMatch) {
    const [_, day, month, year, hours, minutes, seconds] = dmyMatch;
    // Trả về đối tượng Date của Javascript sau khi chuyển đổi kiểu số nguyên cho các thành phần ngày giờ
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), seconds ? parseInt(seconds) : 0);
  }

  // Khớp định dạng chỉ có ngày dd-MM-yyyy hoặc dd/MM/yyyy
  const dmyDateMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmyDateMatch) {
    const [_, day, month, year] = dmyDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Đối với định dạng ISO 8601 (yyyy-MM-ddTHH:mm:ss hoặc yyyy-MM-dd HH:mm:ss), sử dụng hàm khởi tạo Date mặc định
  const parsed = new Date(cleanStr.includes(" ") ? cleanStr.replace(" ", "T") : cleanStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null; // Trả về null nếu tất cả các lần thử phân tích cú pháp đều thất bại
};


/**
 * Định dạng một đối tượng Date hoặc một chuỗi ngày giờ thành định dạng chuỗi: dd-MM-yyyy
 */
export const formatDate = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  // Chuyển đổi chuỗi đầu vào thành đối tượng Date bằng hàm phân tích cú pháp an toàn ở trên
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput.split(" ")[0] : "";

  // Hàm đệm chữ số 0 ở trước số có 1 chữ số
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1); // Tháng trong JS bắt đầu từ 0 nên phải cộng thêm 1
  const year = d.getFullYear();

  return `${day}-${month}-${year}`; // Trả về chuỗi ngày đã định dạng
};

/**
 * Định dạng một đối tượng Date hoặc một chuỗi ngày giờ thành định dạng chuỗi: dd-MM-yyyy HH:mm:ss
 */
export const formatDateTime = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "";

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`; // Kết hợp các thành phần thành chuỗi ngày giờ đầy đủ
};

/**
 * Định dạng một đối tượng Date hoặc một chuỗi ngày giờ thành yyyy-MM-ddTHH:mm:ss cho phần tử <input type="datetime-local"> của HTML5
 */
export const formatForDateTimeLocal = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Định dạng chuỗi nhận được từ ô nhập ngày giờ HTML thành định dạng chuẩn dd-MM-yyyy HH:mm:ss để gửi lên API Spring Boot
 */
export const formatForApi = (htmlInputStr: string): string => {
  if (!htmlInputStr) return "";
  // Thay thế khoảng trắng bằng ký tự T để đảm bảo tương thích khi chuyển đổi đối tượng Date
  const d = new Date(htmlInputStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return htmlInputStr;
  return formatDateTime(d);
};

/**
 * Định dạng chuỗi hạng/nhóm cuộc đua (ví dụ từ "1" -> "Class 1", giữ nguyên nếu không phải số)
 */
export const formatClassLevel = (level: string | null | undefined): string => {
  if (!level) return "—";
  const trimmed = level.trim();
  // Nếu là số thuần túy, định dạng dạng "Class X"
  return /^\d+$/.test(trimmed) ? `Class ${trimmed}` : trimmed;
};

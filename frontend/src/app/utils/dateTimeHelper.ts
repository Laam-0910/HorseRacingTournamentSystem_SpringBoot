/**
 * Safe helper to parse dates from various formats:
 * - dd-MM-yyyy HH:mm:ss
 * - dd-MM-yyyy HH-mm-ss
 * - yyyy-MM-ddTHH:mm:ss
 * - yyyy-MM-dd HH:mm:ss
 */
export const parseSafeDate = (str: string): Date | null => { // Hàm để phân tích cú pháp an toàn một chuỗi thành đối tượng Date
  if (!str) return null; // Nếu chuỗi đầu vào bị trống hoặc null, trả về null ngay lập tức
  const cleanStr = str.trim(); // Xóa khoảng trắng thừa ở đầu và cuối chuỗi
  // Try matching dd-MM-yyyy HH:mm:ss or dd-MM-yyyy HH:mm FIRST
  // (Must check before native Date() which misreads dd-MM-yyyy as MM-DD-YYYY)
  const dmyMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})[ T](\d{2})[-:](\d{2})(?:[-:](\d{2}))?/); // Dùng regex để khớp chuỗi có định dạng dd-MM-yyyy kèm thời gian
  if (dmyMatch) { // Nếu regex khớp với chuỗi
    const [_, day, month, year, hours, minutes, seconds] = dmyMatch; // Trích xuất ngày, tháng, năm và thời gian từ kết quả regex
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), seconds ? parseInt(seconds) : 0); // Tạo và trả về đối tượng Date mới từ các thành phần đã trích xuất
  }

  // Try matching dd-MM-yyyy or dd/MM/yyyy (date only) first
  const dmyDateMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/); // Dùng regex để khớp chuỗi có định dạng dd-MM-yyyy không có thời gian
  if (dmyDateMatch) { // Nếu regex khớp với chuỗi ngày
    const [_, day, month, year] = dmyDateMatch; // Trích xuất ngày, tháng và năm
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)); // Tạo và trả về đối tượng Date mới chỉ với phần ngày
  }

  // For ISO 8601 format (yyyy-MM-ddTHH:mm:ss or yyyy-MM-dd HH:mm:ss), use native Date()
  const parsed = new Date(cleanStr.includes(" ") ? cleanStr.replace(" ", "T") : cleanStr); // Thay thế khoảng trắng bằng 'T' cho chuẩn ISO và dùng hàm Date mặc định để parse
  if (!isNaN(parsed.getTime())) { // Kiểm tra xem đối tượng Date được tạo ra có hợp lệ không (không phải NaN)
    return parsed; // Trả về đối tượng Date hợp lệ
  }

  return null; // Nếu tất cả các cách phân tích đều thất bại, trả về null
};


/**
 * Formats a Date object or string into dd-MM-yyyy
 */
export const formatDate = (dateInput: Date | string | null | undefined): string => { // Hàm để định dạng ngày thành chuỗi dd-MM-yyyy
  if (!dateInput) return ""; // Trả về chuỗi rỗng nếu đầu vào không hợp lệ
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Chuyển chuỗi thành Date bằng parseSafeDate nếu cần thiết
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput.split(" ")[0] : ""; // Trả về chuỗi gốc hoặc rỗng nếu đối tượng Date không hợp lệ

  const pad = (n: number) => String(n).padStart(2, '0'); // Hàm hỗ trợ thêm số 0 đằng trước nếu số chỉ có 1 chữ số
  const day = pad(d.getDate()); // Lấy phần ngày và thêm số 0 nếu cần
  const month = pad(d.getMonth() + 1); // Lấy phần tháng (do tháng bắt đầu từ 0 nên cộng 1) và thêm số 0
  const year = d.getFullYear(); // Lấy phần năm đầy đủ 4 chữ số

  return `${day}-${month}-${year}`; // Ghép và trả về chuỗi ngày đã định dạng
};

/**
 * Formats a Date object or string into dd-MM-yyyy HH:mm:ss
 */
export const formatDateTime = (dateInput: Date | string | null | undefined): string => { // Hàm để định dạng ngày thành chuỗi dd-MM-yyyy HH:mm:ss
  if (!dateInput) return ""; // Trả về chuỗi rỗng nếu đầu vào không hợp lệ
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Chuyển đổi đầu vào thành đối tượng Date nếu nó là chuỗi
  if (!d || isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : ""; // Nếu ngày không hợp lệ, trả về chuỗi gốc hoặc chuỗi rỗng

  const pad = (n: number) => String(n).padStart(2, '0'); // Hàm hỗ trợ thêm số 0 đằng trước cho số có 1 chữ số
  const day = pad(d.getDate()); // Trích xuất và định dạng phần ngày
  const month = pad(d.getMonth() + 1); // Trích xuất và định dạng phần tháng
  const year = d.getFullYear(); // Trích xuất phần năm đầy đủ
  const hours = pad(d.getHours()); // Trích xuất và định dạng phần giờ
  const minutes = pad(d.getMinutes()); // Trích xuất và định dạng phần phút
  const seconds = pad(d.getSeconds()); // Trích xuất và định dạng phần giây

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`; // Kết hợp các thành phần lại thành chuỗi thời gian hoàn chỉnh
};

/**
 * Formats a Date object or string into yyyy-MM-ddTHH:mm:ss for <input type="datetime-local">
 */
export const formatForDateTimeLocal = (dateInput: Date | string | null | undefined): string => { // Hàm để định dạng ngày cho thẻ input type="datetime-local"
  if (!dateInput) return ""; // Trả về chuỗi rỗng nếu đầu vào bị bỏ trống
  const d = typeof dateInput === "string" ? parseSafeDate(dateInput) : dateInput; // Đổi chuỗi đầu vào thành đối tượng Date
  if (!d || isNaN(d.getTime())) return ""; // Trả về chuỗi rỗng nếu đối tượng Date không hợp lệ

  const pad = (n: number) => String(n).padStart(2, '0'); // Hàm đệm thêm số 0
  const day = pad(d.getDate()); // Lấy phần ngày đã được đệm
  const month = pad(d.getMonth() + 1); // Lấy phần tháng đã được đệm
  const year = d.getFullYear(); // Lấy phần năm
  const hours = pad(d.getHours()); // Lấy phần giờ đã được đệm
  const minutes = pad(d.getMinutes()); // Lấy phần phút đã được đệm
  const seconds = pad(d.getSeconds()); // Lấy phần giây đã được đệm

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; // Trả về định dạng chuẩn ISO cho thẻ datetime-local
};

/**
 * Formats a Date object or string to dd-MM-yyyy HH:mm:ss for API payload submission
 */
export const formatForApi = (htmlInputStr: string): string => { // Hàm để định dạng chuỗi HTML đầu vào dùng để gửi lên API
  if (!htmlInputStr) return ""; // Trả về rỗng nếu chuỗi đầu vào bị thiếu
  const d = new Date(htmlInputStr.replace(" ", "T")); // Tạo đối tượng Date, thay thế khoảng trắng bằng 'T' cho tính tương thích
  if (isNaN(d.getTime())) return htmlInputStr; // Nếu ngày không hợp lệ, trả về chuỗi gốc chưa định dạng
  return formatDateTime(d); // Trả về chuỗi ngày giờ đã được định dạng
};

/**
 * Formats class level string to "Class X" if it is a number
 */
export const formatClassLevel = (level: string | null | undefined): string => { // Hàm để định dạng chuỗi cấp độ class
  if (!level) return "—"; // Nếu cấp độ không được truyền vào, trả về ký tự dấu gạch ngang
  const trimmed = level.trim(); // Xóa các khoảng trắng thừa từ chuỗi cấp độ
  return /^\d+$/.test(trimmed) ? `Class ${trimmed}` : trimmed; // Nếu cấp độ chỉ chứa toàn chữ số, thêm chữ "Class " vào đầu, nếu không thì giữ nguyên
};


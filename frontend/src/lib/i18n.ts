import dictData from './dictionary.json';

// Cấu trúc định nghĩa của mỗi bản dịch trong dictionary.json
interface Translations {
  en: string;  // Tiếng Anh (bắt buộc)
  vi?: string; // Tiếng Việt
  zh?: string; // Tiếng Trung
  ja?: string; // Tiếng Nhật
}

// Ép kiểu dữ liệu tệp tin JSON từ điển vào bản đồ định tuyến key-value
const dict: Record<string, Translations> = dictData;

/**
 * Hàm dịch thuật đa ngôn ngữ helper ($t).
 * - Đầu vào: từ khóa cần dịch (key) và ngôn ngữ đích (lang: vi, en, zh, ja).
 * - Tìm kiếm key trong tệp từ điển dictionary.json.
 * - Nếu tìm thấy, trả về chuỗi dịch tương ứng của ngôn ngữ được chọn.
 * - Nếu không tìm thấy, trả về chính từ khóa gốc (key) như một giá trị mặc định dự phòng (fallback).
 */
export const $t = (key: string, lang?: string): string => {
  const entry = dict[key];
  if (entry && entry.en) {
    return entry.en;
  }
  return key;
};

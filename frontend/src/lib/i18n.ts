import dictData from './dictionary.json'; // Nhập dữ liệu từ điển từ file dictionary.json

interface Translations { // Định nghĩa kiểu dữ liệu cho các bản dịch
  en: string; // Bản dịch tiếng Anh là bắt buộc
  vi?: string; // Bản dịch tiếng Việt (không bắt buộc)
  zh?: string; // Bản dịch tiếng Trung (không bắt buộc)
  ja?: string; // Bản dịch tiếng Nhật (không bắt buộc)
}

const dict: Record<string, Translations> = dictData; // Khởi tạo biến dict lưu trữ từ điển với key là chuỗi và value là object Translations

export const $t = (key: string, lang: string): string => { // Hàm xuất $t dùng để lấy bản dịch dựa theo từ khóa và ngôn ngữ
  const entry = dict[key]; // Lấy giá trị bản dịch tương ứng với từ khóa trong từ điển
  
  if (entry) { // Nếu tìm thấy từ khóa trong từ điển
    if (lang === 'vi' && entry.vi) return entry.vi; // Trả về tiếng Việt nếu ngôn ngữ yêu cầu là 'vi' và có bản dịch 'vi'
    if (lang === 'en' && entry.en) return entry.en; // Trả về tiếng Anh nếu ngôn ngữ yêu cầu là 'en' và có bản dịch 'en'
    if (lang === 'zh' && entry.zh) return entry.zh; // Trả về tiếng Trung nếu ngôn ngữ yêu cầu là 'zh' và có bản dịch 'zh'
    if (lang === 'ja' && entry.ja) return entry.ja; // Trả về tiếng Nhật nếu ngôn ngữ yêu cầu là 'ja' và có bản dịch 'ja'
  }

  // Chuyển về hành vi mặc định cho những từ khóa không có trong từ điển (giả định từ khóa gốc là tiếng Việt)
  if (!lang || lang === 'vi') return key; // Trả về từ khóa gốc nếu không truyền ngôn ngữ hoặc ngôn ngữ là tiếng Việt
  
  if (entry) { // Nếu có từ khóa trong từ điển nhưng không khớp các điều kiện trên
    if (lang === 'en') return entry.en || key; // Cố gắng trả về tiếng Anh, nếu không có thì trả về từ khóa gốc
    if (lang === 'zh') return entry.zh || entry.en || key; // Cố gắng trả về tiếng Trung, dự phòng tiếng Anh, cuối cùng là từ khóa gốc
    if (lang === 'ja') return entry.ja || entry.en || key; // Cố gắng trả về tiếng Nhật, dự phòng tiếng Anh, cuối cùng là từ khóa gốc
  }
  
  return key; // Trường hợp cuối cùng không tìm thấy gì, trả về chính từ khóa gốc
};

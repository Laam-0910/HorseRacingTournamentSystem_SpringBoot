import { $t } from "../../../lib/i18n"; // Import hàm hỗ trợ đa ngôn ngữ

// Component chỉnh sửa quy tắc mùa giải
export default function SeasonRulesEdit() {
  return ( // Trả về giao diện người dùng
    <div>
      {/* TODO: chuyen noi dung tu component mau (HR.zip) hoac JSP tuong ung vao day */}
      <h1>{$t("SeasonRulesEdit", (localStorage.getItem('app-lang') || 'vi'))}</h1>
    </div>
  );
}

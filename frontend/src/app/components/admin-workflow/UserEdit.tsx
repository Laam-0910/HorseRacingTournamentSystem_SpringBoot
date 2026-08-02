import { $t } from "../../../lib/i18n"; // Import hàm hỗ trợ đa ngôn ngữ

// Component chỉnh sửa thông tin người dùng
export default function UserEdit() {
  return ( // Trả về giao diện người dùng
    <div>
      {/* TODO: chuyen noi dung tu component mau (HR.zip) hoac JSP tuong ung vao day */}
      <h1>{$t("UserEdit", (localStorage.getItem('app-lang') || 'en'))}</h1>
    </div>
  );
}

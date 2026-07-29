/**
 * Component Footer - Chân trang dùng chung của hệ thống.
 * - Hiển thị bản quyền tác giả tích hợp năm tự động cập nhật.
 */
export default function Footer() {
  return (
    <footer className="bg-black/60 border-t border-white/10 py-8 text-center text-xs text-white/40">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        {/* Bản quyền chứa năm hiện tại động */}
        <p>&copy; {new Date().getFullYear()} HorseRacing Management System. All rights reserved.</p>
        <p className="text-[10px] text-slate-600">Recreated dynamically in React TypeScript & Spring Boot.</p>
      </div>
    </footer>
  );
}

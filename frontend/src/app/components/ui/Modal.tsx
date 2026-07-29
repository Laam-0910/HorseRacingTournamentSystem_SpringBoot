import React from "react";

// Định nghĩa các thuộc tính đầu vào cho hộp thoại Modal
interface ModalProps {
  isOpen: boolean; // Trạng thái đóng/mở hộp thoại
  onClose: () => void; // Hàm xử lý đóng hộp thoại khi click dấu X hoặc overlay
  title: string; // Tiêu đề hiển thị ở đầu hộp thoại
  children: React.ReactNode; // Nội dung con bên trong hộp thoại
}

/**
 * Component Modal - Hộp thoại Popup tùy biến dùng chung cho toàn bộ dự án.
 * - Sử dụng CSS Backdrop Blur tạo lớp nền mờ tối sang trọng.
 * - Hỗ trợ hiệu ứng phóng to động nhẹ nhàng (animate-in, zoom-in-95).
 * - Đóng an toàn bằng phím X.
 */
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Nếu không mở, không hiển thị gì cả (null)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Vùng hộp thoại chính */}
      <div className="bg-[#151310] border border-white/5 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Nút đóng X ở góc trên bên phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-white/40 hover:text-white text-base transition"
        >
          ✕
        </button>
        {/* Tiêu đề hộp thoại */}
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        {/* Nội dung bên trong hộp thoại */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

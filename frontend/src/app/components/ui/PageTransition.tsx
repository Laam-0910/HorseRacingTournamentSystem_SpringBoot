import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Component PageTransition - Bộ bọc chuyển trang (Page Transition Wrapper).
 * - Sử dụng framer-motion để tạo hiệu ứng mờ nhòe nhẹ (blur) và mờ dần (fade-in) khi chuyển đổi tab hoặc trang.
 * - filter: "blur(4px)" -> "blur(0px)" giúp trang tải trông cực kỳ chuyên nghiệp và mượt mà.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      // Trạng thái ban đầu trước khi xuất hiện: độ mờ bằng 0, độ nhòe bằng 4px
      initial={{ opacity: 0, filter: "blur(4px)" }}
      // Trạng thái chuyển động hoàn tất: độ mờ bằng 1, độ nhòe bằng 0px
      animate={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      // Trạng thái khi biến mất khỏi DOM: mờ đi và nhòe dần
      exit={{ opacity: 0, filter: "blur(4px)" }}
      // Cấu hình thời lượng 0.3s kết hợp gia tốc mượt easeInOut
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full h-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}

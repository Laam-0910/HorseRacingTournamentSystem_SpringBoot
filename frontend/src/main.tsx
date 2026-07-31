// Nhập thư viện React để sử dụng JSX và các tính năng cốt lõi
import React from "react";
// Nhập ReactDOM client để render ứng dụng React vào DOM của trình duyệt
import ReactDOM from "react-dom/client";
// Nhập component gốc App của ứng dụng
import App from "./app/App";
// Nhập các thiết lập style CSS toàn cục
import "./styles/index.css";
// Nhập module cấu hình hộp thoại xác nhận toàn cục
import "@/lib/confirm";

// Xử lý hiệu ứng gợn sóng (ripple) và tia sáng (spark) khi nhấp chuột toàn cục
if (typeof window !== "undefined") {
  // Lắng nghe sự kiện click trên toàn bộ tài liệu HTML
  document.addEventListener("click", (e) => {
    // Lấy phần tử HTML nơi xảy ra sự kiện click
    const target = e.target as HTMLElement;
    // Kiểm tra nếu không có phần tử hoặc click vào ô nhập liệu, nút bấm, liên kết thì bỏ qua hiệu ứng
    if (
      !target ||
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest('[role="button"]')
    ) {
      // Dừng xử lý hiệu ứng cho các phần tử này
      return;
    }

    // Danh sách các mã màu neon rực rỡ dùng cho hiệu ứng
    const neonColors = [
      "#c9a227", // Màu vàng kim (Gold)
      "#00f0ff", // Màu xanh neon (Neon Cyan)
      "#ff007f", // Màu hồng neon (Neon Pink)
      "#a855f7", // Màu tím neon (Neon Purple)
      "#22c55e", // Màu xanh lá neon (Neon Green)
      "#f97316", // Màu cam neon (Neon Orange)
      "#ffffff", // Màu trắng (White)
    ];

    // Chọn ngẫu nhiên một màu từ danh sách neonColors
    const randomColor = neonColors[Math.floor(Math.random() * neonColors.length)];

    // Tạo một phần tử <span> để làm hiệu ứng vòng tròn gợn sóng (ripple)
    const ripple = document.createElement("span");
    // Gán class CSS cho vòng tròn gợn sóng
    ripple.className = "click-ripple";
    // Thiết lập màu viền ngẫu nhiên cho gợn sóng
    ripple.style.borderColor = randomColor;
    // Thiết lập màu nền dải màu tỏa tròn (radial gradient) ngẫu nhiên
    ripple.style.background = `radial-gradient(circle, ${randomColor}55 0%, ${randomColor}00 70%)`;
    // Đặt vị trí X của gợn sóng trùng với vị trí con trỏ chuột
    ripple.style.left = e.clientX + "px";
    // Đặt vị trí Y của gợn sóng trùng với vị trí con trỏ chuột
    ripple.style.top = e.clientY + "px";
    // Thêm phần tử gợn sóng vào thẻ body
    document.body.appendChild(ripple);
    // Đặt thời gian tự động xóa phần tử gợn sóng sau 700ms (khi hoàn tất hoạt họa)
    setTimeout(() => {
      // Xóa phần tử gợn sóng khỏi DOM
      ripple.remove();
    }, 700);

    // Số lượng tia sáng (sparks) sẽ bắn ra khi nhấp chuột
    const numSparks = 12;
    // Vòng lặp để tạo từng tia sáng
    for (let i = 0; i < numSparks; i++) {
      // Tạo một phần tử <span> đại diện cho tia sáng
      const spark = document.createElement("span");
      // Gán class CSS cho tia sáng
      spark.className = "click-spark";
      // Chọn màu ngẫu nhiên cho tia sáng từ danh sách neonColors
      const sparkColor = neonColors[Math.floor(Math.random() * neonColors.length)];
      // Đặt màu nền cho tia sáng
      spark.style.backgroundColor = sparkColor;
      // Đặt màu chữ/viền cho tia sáng
      spark.style.color = sparkColor;
      // Đặt vị trí X ban đầu của tia sáng trùng với vị trí chuột
      spark.style.left = e.clientX + "px";
      // Đặt vị trí Y ban đầu của tia sáng trùng với vị trí chuột
      spark.style.top = e.clientY + "px";

      // Tính toán góc bắn ngẫu nhiên (tính bằng radian từ 0 đến 2*PI)
      const angle = Math.random() * Math.PI * 2;
      // Tính toán khoảng cách bay ngẫu nhiên từ 35px đến 100px
      const distance = 35 + Math.random() * 65;
      // Tính toán độ lệch theo trục X
      const dx = Math.cos(angle) * distance;
      // Tính toán độ lệch theo trục Y (cộng thêm 20px để tạo lực hút trọng lực nhẹ)
      const dy = Math.sin(angle) * distance + 20;

      // Đặt biến CSS động --dx cho khoảng cách dịch chuyển ngang
      spark.style.setProperty("--dx", dx + "px");
      // Đặt biến CSS động --dy cho khoảng cách dịch chuyển dọc
      spark.style.setProperty("--dy", dy + "px");

      // Thêm phần tử tia sáng vào thẻ body
      document.body.appendChild(spark);
      // Tự động xóa phần tử tia sáng sau 600ms
      setTimeout(() => {
        // Xóa phần tử tia sáng khỏi DOM
        spark.remove();
      }, 600);
    }
  });
}

// Khởi tạo root DOM và render component App vào thẻ HTML có id="root"
ReactDOM.createRoot(document.getElementById("root")!).render(
  // Bọc ứng dụng trong React.StrictMode để kiểm tra các cảnh báo và phát hiện lỗi trong môi trường phát triển
  <React.StrictMode>
    {/* Component chính chứa toàn bộ giao diện và định tuyến của ứng dụng */}
    <App />
  </React.StrictMode>
);

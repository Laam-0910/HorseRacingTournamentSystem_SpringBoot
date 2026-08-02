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

// Global handler to replace browser native validation popups (e.g. "Vui lòng điền vào trường này.")
// with a clean, custom English floating tooltip on all platforms.
if (typeof window !== "undefined") {
  let currentValidationTooltip: HTMLDivElement | null = null;

  const removeValidationTooltip = () => {
    if (currentValidationTooltip) {
      currentValidationTooltip.remove();
      currentValidationTooltip = null;
    }
  };

  document.addEventListener(
    "invalid",
    (e: Event) => {
      // Prevent browser's native OS-localized popup ("Vui lòng điền vào trường này.")
      e.preventDefault();

      const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (!target) return;

      let msg = "Please enter a valid value.";

      if (target.validity.valueMissing) {
        msg = "Please fill out this field.";
      } else if (target.validity.typeMismatch) {
        if (target.type === "email") {
          msg = "Please enter a valid email address.";
        } else if (target.type === "url") {
          msg = "Please enter a valid URL.";
        } else {
          msg = "Please enter a valid value.";
        }
      } else if (target.validity.patternMismatch) {
        msg = "Please match the requested format.";
      } else if (target.validity.tooShort) {
        const minLen = (target as HTMLInputElement).minLength || 1;
        msg = `Please enter at least ${minLen} characters.`;
      } else if (target.validity.tooLong) {
        const maxLen = (target as HTMLInputElement).maxLength || 255;
        msg = `Please enter no more than ${maxLen} characters.`;
      } else if (target.validity.rangeUnderflow) {
        const minVal = (target as HTMLInputElement).min || 0;
        msg = `Value must be greater than or equal to ${minVal}.`;
      } else if (target.validity.rangeOverflow) {
        const maxVal = (target as HTMLInputElement).max || 100;
        msg = `Value must be less than or equal to ${maxVal}.`;
      } else if (target.validity.stepMismatch) {
        msg = "Please enter a valid value.";
      } else if (target.validity.badInput) {
        msg = "Please enter a valid number.";
      }

      // Focus invalid input
      try { target.focus(); } catch (_) {}

      // Remove existing tooltip
      removeValidationTooltip();

      // Create custom English tooltip element
      const rect = target.getBoundingClientRect();
      const tooltip = document.createElement("div");
      tooltip.className = "custom-validation-tooltip";
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = "999999";
      tooltip.style.left = `${Math.max(10, rect.left)}px`;
      tooltip.style.top = `${Math.max(10, rect.top - 42)}px`;
      tooltip.style.background = "#1e1e1e";
      tooltip.style.color = "#ffffff";
      tooltip.style.border = "1px solid #ef4444";
      tooltip.style.borderRadius = "8px";
      tooltip.style.padding = "6px 12px";
      tooltip.style.fontSize = "12px";
      tooltip.style.fontFamily = "system-ui, -apple-system, sans-serif";
      tooltip.style.fontWeight = "500";
      tooltip.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 10px rgba(239, 68, 68, 0.3)";
      tooltip.style.display = "flex";
      tooltip.style.alignItems = "center";
      tooltip.style.gap = "6px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.animation = "customTooltipFadeIn 0.2s ease-out forwards";

      tooltip.innerHTML = `
        <span style="color: #ef4444; font-weight: bold; font-size: 14px;">⚠️</span>
        <span>${msg}</span>
        <div style="position: absolute; bottom: -6px; left: 16px; width: 10px; height: 10px; background: #1e1e1e; border-right: 1px solid #ef4444; border-bottom: 1px solid #ef4444; transform: rotate(45deg);"></div>
      `;

      document.body.appendChild(tooltip);
      currentValidationTooltip = tooltip;

      // Automatically hide after 4 seconds
      setTimeout(() => {
        if (currentValidationTooltip === tooltip) {
          removeValidationTooltip();
        }
      }, 4000);
    },
    true
  );

  document.addEventListener("input", removeValidationTooltip, true);
  document.addEventListener("change", removeValidationTooltip, true);
  document.addEventListener("scroll", removeValidationTooltip, true);

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

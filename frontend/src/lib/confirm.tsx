import ReactDOM from "react-dom/client";
import { $t } from "./i18n";

/**
 * Hàm confirm tùy biến (Custom Confirm Dialog) - Thay thế cho window.confirm mặc định của trình duyệt.
 * - Trả về một Promise chứa giá trị boolean (true/false) tương tự hàm mặc định.
 * - Tạo động một phần tử <div> trong body để vẽ (render) giao diện hộp thoại xác nhận.
 * - Sử dụng giao diện tối đồng bộ, có hiệu ứng backdrop-blur và hỗ trợ đa ngôn ngữ.
 * - Tự động dọn dẹp (unmount và remove phần tử DOM) sau khi người dùng lựa chọn bấm Đồng ý/Hủy.
 */
export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Tạo động container trong tài liệu HTML
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    // Hàm dọn dẹp DOM và trả về kết quả lựa chọn của người dùng thông qua resolve của Promise
    const cleanup = (value: boolean) => {
      root.unmount();
      container.remove();
      resolve(value);
    };

    const lang = localStorage.getItem("app-lang") || "en";

    // Tiến hành vẽ giao diện Confirm Dialog tùy biến
    root.render(
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}>
        <div style={{
          background: "#12141a",
          border: "1px solid rgba(201,162,39,0.22)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "26rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          position: "relative"
        }}>
          {/* Dòng tiêu đề hộp thoại */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem"
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(201,162,39,0.1)",
              border: "1px solid rgba(201,162,39,0.25)",
              color: "#c9a227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              ❓
            </div>
            <h4 style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#f4f2ec",
              margin: 0
            }}>
              {$t("Xác nhận")}
            </h4>
          </div>

          {/* Nội dung thông điệp cần hỏi */}
          <p style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.7)",
            lineHeight: "1.5",
            margin: "0 0 1.5rem 0",
            fontFamily: "sans-serif"
          }}>
            {$t(message)}
          </p>

          {/* Các nút hành động (Hủy / Đồng ý) */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            borderTop: "1px solid rgba(201,162,39,0.1)",
            paddingTop: "1rem"
          }}>
            {/* Nút Hủy (Không đồng ý) */}
            <button
              onClick={() => cleanup(false)}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#1f1f22",
                border: "1px solid #2e2e33",
                color: "#fff",
                borderRadius: "0.375rem",
                fontSize: "11px",
                fontFamily: "monospace",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2a2a30";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1f1f22";
              }}
            >
              {$t("Hủy")}
            </button>
            {/* Nút Đồng ý */}
            <button
              onClick={() => cleanup(true)}
              style={{
                padding: "0.5rem 1.25rem",
                background: "#c9a227",
                color: "#0c0a09",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
            >
              {$t("Đồng ý")}
            </button>
          </div>
        </div>
      </div>
    );
  });
}

/**
 * Hàm alert tùy biến (Custom Alert Dialog) - Thay thế cho window.alert mặc định của trình duyệt.
 * Không hiển thị "localhost:5173 cho biết", đồng bộ giao diện Dark Mode cao cấp.
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const cleanup = () => {
      root.unmount();
      container.remove();
      resolve();
    };

    const lang = localStorage.getItem("app-lang") || "en";

    root.render(
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}>
        <div style={{
          background: "#12141a",
          border: "1px solid rgba(201,162,39,0.3)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "26rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          position: "relative"
        }}>
          {/* Tiêu đề */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem"
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(201,162,39,0.15)",
              border: "1px solid rgba(201,162,39,0.3)",
              color: "#c9a227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold"
            }}>
              ℹ️
            </div>
            <h4 style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#f4f2ec",
              margin: 0
            }}>
              {$t("Thông báo")}
            </h4>
          </div>

          {/* Nội dung thông báo */}
          <p style={{
            fontSize: "0.825rem",
            color: "rgba(255,255,255,0.85)",
            lineHeight: "1.5",
            margin: "0 0 1.5rem 0"
          }}>
            {$t(message)}
          </p>

          {/* Nút OK */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid rgba(201,162,39,0.1)",
            paddingTop: "1rem"
          }}>
            <button
              onClick={cleanup}
              style={{
                padding: "0.5rem 1.5rem",
                background: "#c9a227",
                color: "#0c0a09",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  });
}

// Tự động ghi đè window.alert mặc định bằng custom showAlert
if (typeof window !== "undefined") {
  window.alert = (msg?: any) => {
    if (msg !== undefined && msg !== null) {
      showAlert(String(msg));
    }
  };
}

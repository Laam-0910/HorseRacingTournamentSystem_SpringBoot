import ReactDOM from "react-dom/client";
import { $t } from "./i18n";

export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);

    const cleanup = (value: boolean) => {
      root.unmount();
      container.remove();
      resolve(value);
    };

    const lang = localStorage.getItem("app-lang") || "vi";

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
          {/* Header */}
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
              {$t("Xác nhận", lang)}
            </h4>
          </div>

          {/* Message */}
          <p style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.7)",
            lineHeight: "1.5",
            margin: "0 0 1.5rem 0",
            fontFamily: "sans-serif"
          }}>
            {$t(message, lang)}
          </p>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            borderTop: "1px solid rgba(201,162,39,0.1)",
            paddingTop: "1rem"
          }}>
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
              {$t("Hủy", lang)}
            </button>
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
              {$t("Đồng ý", lang)}
            </button>
          </div>
        </div>
      </div>
    );
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import { $t } from "./i18n";

// Inject custom keyframe styles into document head if not already present
if (typeof document !== "undefined") {
  const styleId = "custom-modal-animations-styles";
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @keyframes modalBackdropFadeIn {
        from {
          opacity: 0;
          background-color: rgba(0, 0, 0, 0);
          backdrop-filter: blur(0px);
        }
        to {
          opacity: 1;
          background-color: rgba(6, 5, 4, 0.85);
          backdrop-filter: blur(8px);
        }
      }
      @keyframes modalScaleIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(12px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(styleEl);
  }
}

/**
 * Custom confirm modal with dark glassmorphic gold accent design
 */
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

    root.render(
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "modalBackdropFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}>
        <div style={{
          background: "linear-gradient(145deg, #151310 0%, #0c0a08 100%)",
          border: "1px solid rgba(201, 162, 39, 0.3)",
          borderRadius: "1rem",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "28rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.85), 0 0 30px rgba(201, 162, 39, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
          animation: "modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
        }}>
          {/* Top Gold Accent Line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, #c9a227, transparent)"
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem"
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(201, 162, 39, 0.08)",
              border: "1px solid rgba(201, 162, 39, 0.25)",
              color: "#c9a227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 12px rgba(201, 162, 39, 0.15)"
            }}>
              ❓
            </div>
            <h4 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#f4f2ec",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              {$t("Confirm")}
            </h4>
          </div>

          {/* Message Body */}
          <p style={{
            fontSize: "0.9rem",
            color: "rgba(244, 242, 236, 0.85)",
            lineHeight: "1.6",
            margin: "0 0 1.75rem 0",
            fontFamily: "'Outfit', sans-serif"
          }}>
            {$t(message)}
          </p>

          {/* Buttons Footer */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            borderTop: "1px solid rgba(201, 162, 39, 0.12)",
            paddingTop: "1.25rem"
          }}>
            <button
              onClick={() => cleanup(false)}
              style={{
                padding: "0.625rem 1.5rem",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(244, 242, 236, 0.7)",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "rgba(244, 242, 236, 0.7)";
              }}
            >
              {$t("Cancel")}
            </button>
            <button
              onClick={() => cleanup(true)}
              style={{
                padding: "0.625rem 1.5rem",
                background: "linear-gradient(135deg, #e5ba37 0%, #c9a227 100%)",
                color: "#0e0c09",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(201, 162, 39, 0.2)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.15)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(201, 162, 39, 0.35), 0 0 8px rgba(201, 162, 39, 0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(201, 162, 39, 0.2)";
                e.currentTarget.style.transform = "none";
              }}
            >
              {$t("Agree")}
            </button>
          </div>
        </div>
      </div>
    );
  });
}

/**
 * Custom alert modal with dark glassmorphic gold accent design
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

    root.render(
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "modalBackdropFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }}>
        <div style={{
          background: "linear-gradient(145deg, #151310 0%, #0c0a08 100%)",
          border: "1px solid rgba(201, 162, 39, 0.35)",
          borderRadius: "1rem",
          padding: "1.75rem",
          width: "100%",
          maxWidth: "28rem",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.85), 0 0 30px rgba(201, 162, 39, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
          animation: "modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
        }}>
          {/* Top Gold Accent Line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, #c9a227, transparent)"
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.25rem"
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "rgba(201, 162, 39, 0.08)",
              border: "1px solid rgba(201, 162, 39, 0.25)",
              color: "#c9a227",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 0 12px rgba(201, 162, 39, 0.15)"
            }}>
              ℹ️
            </div>
            <h4 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#f4f2ec",
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              {$t("Notification")}
            </h4>
          </div>

          {/* Message Body */}
          <p style={{
            fontSize: "0.9rem",
            color: "rgba(244, 242, 236, 0.85)",
            lineHeight: "1.6",
            margin: "0 0 1.75rem 0",
            fontFamily: "'Outfit', sans-serif"
          }}>
            {$t(message)}
          </p>

          {/* Buttons Footer */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid rgba(201, 162, 39, 0.12)",
            paddingTop: "1.25rem"
          }}>
            <button
              onClick={cleanup}
              style={{
                padding: "0.625rem 2rem",
                background: "linear-gradient(135deg, #e5ba37 0%, #c9a227 100%)",
                color: "#0e0c09",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(201, 162, 39, 0.2)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.15)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(201, 162, 39, 0.35), 0 0 8px rgba(201, 162, 39, 0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(201, 162, 39, 0.2)";
                e.currentTarget.style.transform = "none";
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

if (typeof window !== "undefined") {
  window.alert = (msg?: any) => {
    if (msg !== undefined && msg !== null) {
      showAlert(String(msg));
    }
  };
}

import React from "react";
import { $t } from "../../../lib/i18n";

export interface ActionModalState {
  isOpen: boolean;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface ActionModalProps {
  modal: ActionModalState;
  onClose: () => void;
}

export default function ActionModal({ modal, onClose }: ActionModalProps) {
  if (!modal.isOpen) return null;

  const lang = localStorage.getItem("app-lang") || "en";
  const isSuccess = modal.type === "success";
  const isError = modal.type === "error";

  const icon = isSuccess ? "✅" : isError ? "⚠️" : "ℹ️";
  const iconBg = isSuccess ? "rgba(74, 222, 128, 0.15)" : isError ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)";
  const iconBorder = isSuccess ? "rgba(74, 222, 128, 0.3)" : isError ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)";
  const titleColor = isSuccess ? "#4ade80" : isError ? "#f87171" : "#60a5fa";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
      padding: "1rem"
    }}>
      <div style={{
        background: "#181613",
        border: `1px solid ${iconBorder}`,
        borderRadius: "1rem",
        padding: "1.75rem",
        maxWidth: "26rem",
        width: "100%",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        textAlign: "center",
        animation: "fadeIn 0.2s ease-out"
      }}>
        {/* Circle Icon Header */}
        <div style={{
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          margin: "0 auto 1rem auto"
        }}>
          {icon}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Roboto Slab', serif",
          fontWeight: 700,
          fontSize: "1.2rem",
          color: titleColor,
          marginBottom: "0.5rem"
        }}>
          {$t(modal.title, lang)}
        </h3>

        {/* Message */}
        <p style={{
          color: "rgba(244, 242, 236, 0.85)",
          fontSize: "0.85rem",
          lineHeight: "1.4",
          marginBottom: "1.5rem",
          fontFamily: "monospace",
          wordBreak: "break-word"
        }}>
          {modal.message}
        </p>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.65rem 1.25rem",
            background: isSuccess ? "#4ade80" : isError ? "#ef4444" : "#3b82f6",
            color: isSuccess ? "#0e0c09" : "#ffffff",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: 700,
            fontSize: "0.85rem",
            fontFamily: "monospace",
            cursor: "pointer",
            transition: "opacity 0.2s"
          }}
        >
          {$t("OK", lang)}
        </button>
      </div>
    </div>
  );
}

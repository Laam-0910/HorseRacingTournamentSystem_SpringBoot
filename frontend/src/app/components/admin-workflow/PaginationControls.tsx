import React from "react";
import { $t } from "../../../lib/i18n";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 20,
}) => {
  if (totalItems <= itemsPerPage) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const lang = localStorage.getItem("app-lang") || "vi";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)", flexWrap: "wrap", gap: "0.75rem" }}>
      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
        {$t("Hiển thị", lang)} {startItem} - {endItem} / {totalItems} {$t("hàng", lang)}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: "0.3rem 0.7rem",
            background: currentPage === 1 ? "rgba(255,255,255,0.02)" : "rgba(201,162,39,0.15)",
            border: currentPage === 1 ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(201,162,39,0.3)",
            borderRadius: "0.375rem",
            color: currentPage === 1 ? "rgba(255,255,255,0.2)" : "#c9a227",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          ◀ {$t("Trước", lang)}
        </button>
        <span style={{ padding: "0 0.6rem", fontSize: "11px", fontFamily: "monospace", color: "#f4f2ec", fontWeight: "bold" }}>
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: "0.3rem 0.7rem",
            background: currentPage === totalPages ? "rgba(255,255,255,0.02)" : "rgba(201,162,39,0.15)",
            border: currentPage === totalPages ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(201,162,39,0.3)",
            borderRadius: "0.375rem",
            color: currentPage === totalPages ? "rgba(255,255,255,0.2)" : "#c9a227",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          }}
        >
          {$t("Sau", lang)} ▶
        </button>
      </div>
    </div>
  );
};

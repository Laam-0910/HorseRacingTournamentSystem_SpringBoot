import React from "react";
import { $t } from "../../../lib/i18n";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const safeTotalPages = Math.max(1, totalPages);
  const lang = localStorage.getItem("app-lang") || "en";

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.875rem 1.25rem",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.25)",
      flexWrap: "wrap",
      gap: "0.75rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
          Showing <strong style={{ color: "#fbbf24" }}>{startItem}</strong> - <strong style={{ color: "#fbbf24" }}>{endItem}</strong> of <strong style={{ color: "#fbbf24" }}>{totalItems}</strong> items
        </span>

        {onItemsPerPageChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "11px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
            <span>Rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              style={{
                padding: "0.15rem 0.4rem",
                background: "rgba(21,19,16,0.8)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.25rem",
                color: "#f4f2ec",
                fontSize: "11px",
                fontFamily: "monospace",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: "0.3rem 0.75rem",
            background: currentPage <= 1 ? "rgba(255,255,255,0.02)" : "rgba(201,162,39,0.15)",
            border: currentPage <= 1 ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(201,162,39,0.3)",
            borderRadius: "0.375rem",
            color: currentPage <= 1 ? "rgba(255,255,255,0.2)" : "#c9a227",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: currentPage <= 1 ? "not-allowed" : "pointer",
          }}
        >
          ◀ Prev
        </button>
        <span style={{ padding: "0 0.6rem", fontSize: "11px", fontFamily: "monospace", color: "#f4f2ec", fontWeight: "bold" }}>
          Page {currentPage} of {safeTotalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: "0.3rem 0.75rem",
            background: currentPage >= safeTotalPages ? "rgba(255,255,255,0.02)" : "rgba(201,162,39,0.15)",
            border: currentPage >= safeTotalPages ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(201,162,39,0.3)",
            borderRadius: "0.375rem",
            color: currentPage >= safeTotalPages ? "rgba(255,255,255,0.2)" : "#c9a227",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "bold",
            cursor: currentPage >= safeTotalPages ? "not-allowed" : "pointer",
          }}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

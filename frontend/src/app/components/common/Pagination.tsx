import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endItem = Math.min(validPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        background: "rgba(0,0,0,0.4)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "0 0 0.75rem 0.75rem",
        fontSize: "0.75rem",
        fontFamily: "monospace",
        color: "#a0a0a0",
        flexWrap: "wrap",
        gap: "0.75rem",
        marginTop: "0.5rem"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>
          Showing <strong style={{ color: "#fbbf24" }}>{startItem}</strong> – <strong style={{ color: "#fbbf24" }}>{endItem}</strong> of <strong style={{ color: "#fff" }}>{totalItems}</strong> items
        </span>

        {onPageSizeChange && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              style={{
                background: "#151310",
                border: "1px solid rgba(251, 191, 36, 0.4)",
                borderRadius: "0.375rem",
                color: "#fbbf24",
                padding: "0.2rem 0.5rem",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} style={{ background: "#151310", color: "#fff" }}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          type="button"
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage <= 1}
          style={{
            padding: "0.25rem 0.75rem",
            background: validPage <= 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.375rem",
            color: validPage <= 1 ? "rgba(255,255,255,0.2)" : "#fff",
            cursor: validPage <= 1 ? "not-allowed" : "pointer",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          ◀ Prev
        </button>

        <span style={{ color: "#fff", fontWeight: "bold" }}>
          Page {validPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage >= totalPages}
          style={{
            padding: "0.25rem 0.75rem",
            background: validPage >= totalPages ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.375rem",
            color: validPage >= totalPages ? "rgba(255,255,255,0.2)" : "#fff",
            cursor: validPage >= totalPages ? "not-allowed" : "pointer",
            fontSize: "0.75rem",
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

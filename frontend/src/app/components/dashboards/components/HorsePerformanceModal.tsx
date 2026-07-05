import { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import { parseSafeDate } from "../../../utils/dateTimeHelper";

interface RaceRecord {
  startTime: string;
  meetingName: string;
  classLevel: string;
  gateNumber: number | null;
  jockeyName: string;
  position: string;
  finishTime: string;
  ratingAdjustment: number;
  prizeMoney: number;
}

interface HorsePerf {
  name: string;
  breed: string;
  sex?: string;
  currentRating: number;
  totalRaces: number;
  totalWins: number;
  winRate: number;
  history: RaceRecord[];
}

function HorsePerformanceModal({
  horseId,
  horseName,
  onClose,
}: {
  horseId: number;
  horseName: string;
  onClose: () => void;
}) {
  const [perf, setPerf] = useState<HorsePerf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerf = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<HorsePerf>(`/public/horses/${horseId}/performance`);
        setPerf(data);
      } catch (err: any) {
        setError(err.message || "Failed to load horse performance data.");
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, [horseId]);

  const formatDate = (dStr: string) => {
    if (!dStr) return "—";
    const d = parseSafeDate(dStr);
    if (!d) return dStr;
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const positionBadge = (position: string) => {
    const isFirst = position === "1";
    const isTop3 = ["2", "3"].includes(position);
    const isDQ = position === "DQ" || position === "DISQUALIFIED";
    const bg = isFirst
      ? "rgba(201,162,39,0.2)"
      : isTop3
      ? "rgba(74,222,128,0.15)"
      : isDQ
      ? "rgba(239,68,68,0.15)"
      : "rgba(255,255,255,0.05)";
    const color = isFirst
      ? "#c9a227"
      : isTop3
      ? "#4ade80"
      : isDQ
      ? "#ef4444"
      : "#a0a0a0";
    const label = position === "1" ? "1st" : position === "2" ? "2nd" : position === "3" ? "3rd" : position;
    return (
      <span
        style={{
          padding: "0.15rem 0.45rem",
          borderRadius: "0.25rem",
          fontSize: "0.65rem",
          fontFamily: "monospace",
          fontWeight: 700,
          background: bg,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {label}
      </span>
    );
  };

  // Last 10 races for the rating trend
  const last10 = perf?.history?.slice(0, 10) ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "56rem",
          background: "#100f0d",
          border: "1px solid rgba(201,162,39,0.18)",
          borderRadius: "1rem",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0,0,0,0.7)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "1rem",
            top: "1rem",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: "1.25rem",
            fontFamily: "monospace",
            padding: "0.25rem",
            borderRadius: "50%",
            zIndex: 10,
            lineHeight: 1,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
        >
          ✕
        </button>

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "2rem" }}>⏳</span>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontFamily: "monospace" }}>
              Loading horse performance data...
            </p>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontFamily: "monospace", fontSize: "0.875rem" }}>⚠️ {error}</p>
            <button
              onClick={onClose}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: "#fff",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(201,162,39,0.1)",
                background: "linear-gradient(to bottom, rgba(201,162,39,0.04), transparent)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Horse icon + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "0.75rem",
                    background: "rgba(201,162,39,0.08)",
                    border: "1px solid rgba(201,162,39,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                    flexShrink: 0,
                  }}
                >
                  🐎
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <h2
                      style={{
                        fontFamily: "'Roboto Slab', serif",
                        fontWeight: 700,
                        fontSize: "1.5rem",
                        color: "#f4f2ec",
                        margin: 0,
                      }}
                    >
                      {perf?.name ?? horseName}
                    </h2>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "0.25rem",
                        background: "rgba(201,162,39,0.15)",
                        color: "#c9a227",
                        border: "1px solid rgba(201,162,39,0.3)",
                      }}
                    >
                      Rating {perf?.currentRating ?? "—"}
                    </span>
                  </div>
                  <p style={{ color: "#a0a0a0", fontSize: "0.8rem", margin: "0.25rem 0 0", fontFamily: "monospace" }}>
                    Breed: {perf?.breed ?? "—"} &nbsp;·&nbsp; Sex: {perf?.sex ?? "Gelding"}
                  </p>
                </div>
              </div>

              {/* Stats cards row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {[
                  { label: "Total Races", value: perf?.totalRaces ?? 0, color: "#60a5fa" },
                  { label: "Total Wins", value: perf?.totalWins ?? 0, color: "#4ade80" },
                  {
                    label: "Win Rate",
                    value:
                      perf?.winRate != null
                        ? `${perf.winRate.toFixed(1)}%`
                        : perf?.totalRaces && perf.totalRaces > 0
                        ? `${((perf.totalWins / perf.totalRaces) * 100).toFixed(1)}%`
                        : "0.0%",
                    color: "#c9a227",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: "rgba(255,255,255,0.015)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "0.75rem",
                      padding: "0.875rem",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.55rem",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: s.color,
                        margin: 0,
                      }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Body (scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Rating Trend (last 10 races) */}
              {last10.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: "0.55rem",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#c9a227",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Rating Trend (Last 10 Races)
                  </h4>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                    {last10.map((r, i) => {
                      const adj = r.ratingAdjustment ?? 0;
                      const isPos = adj >= 0;
                      const barH = Math.min(Math.abs(adj) * 4 + 8, 40);
                      return (
                        <div
                          key={i}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", minWidth: "2.5rem" }}
                          title={`${r.meetingName} — ${adj >= 0 ? "+" : ""}${adj} pts`}
                        >
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              color: isPos ? "#4ade80" : "#f87171",
                            }}
                          >
                            {adj >= 0 ? "+" : ""}{adj}
                          </span>
                          <div
                            style={{
                              width: "1.5rem",
                              height: `${barH}px`,
                              borderRadius: "0.25rem",
                              background: isPos ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)",
                              border: `1px solid ${isPos ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"}`,
                            }}
                          />
                          <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                            R{last10.length - i}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Race History Table */}
              <div>
                <h4
                  style={{
                    fontSize: "0.55rem",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#c9a227",
                    marginBottom: "0.75rem",
                  }}
                >
                  Full Race History
                </h4>
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    overflowX: "auto",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.01)",
                        }}
                      >
                        {["Date", "Meeting", "Class", "Gate", "Jockey", "Pos", "Finish Time", "Rating Δ", "Prize"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "0.75rem 1rem",
                              textAlign: h === "Pos" || h === "Rating Δ" || h === "Prize" ? "center" : "left",
                              fontSize: "0.55rem",
                              fontFamily: "monospace",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "rgba(255,255,255,0.4)",
                              fontWeight: 500,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!perf?.history || perf.history.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              padding: "2.5rem",
                              textAlign: "center",
                              color: "rgba(255,255,255,0.4)",
                              fontStyle: "italic",
                              fontSize: "0.8rem",
                            }}
                          >
                            No race records found for this horse.
                          </td>
                        </tr>
                      ) : (
                        perf.history.map((r, idx) => {
                          const adj = r.ratingAdjustment ?? 0;
                          return (
                            <tr
                              key={idx}
                              style={{
                                borderBottom: "1px solid rgba(255,255,255,0.04)",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.01)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLElement).style.background = "transparent")
                              }
                            >
                              <td style={{ padding: "0.75rem 1rem", fontSize: "0.7rem", fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
                                {formatDate(r.startTime)}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                                {r.meetingName ?? "—"}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontSize: "0.7rem", fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>
                                {r.classLevel ?? "—"}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "0.7rem", fontFamily: "monospace", color: "#c9a227" }}>
                                {r.gateNumber != null ? `#${r.gateNumber}` : "—"}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)" }}>
                                {r.jockeyName ?? "—"}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                                {positionBadge(r.position ?? "—")}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "0.7rem", fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>
                                {r.finishTime ?? "—"}
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    color: adj > 0 ? "#4ade80" : adj < 0 ? "#f87171" : "#a0a0a0",
                                  }}
                                >
                                  {adj > 0 ? "+" : ""}{adj}
                                </span>
                              </td>
                              <td style={{ padding: "0.75rem 1rem", textAlign: "center", fontSize: "0.7rem", fontFamily: "monospace", fontWeight: 700, color: "#4ade80" }}>
                                {r.prizeMoney > 0 ? `$${r.prizeMoney.toLocaleString()}` : "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HorsePerformanceModal;

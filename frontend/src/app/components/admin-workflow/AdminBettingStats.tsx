import { useState, useEffect } from "react";
import { api } from "../../../lib/api";
import { formatDateTime } from "../../utils/dateTimeHelper";
import { $t } from "@/lib/i18n";

interface AdminBettingSummary {
  totalBets: number;
  totalBetAmount: number;
  totalPayouts: number;
  netRevenue: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  refundedBets: number;
  raceBreakdown: Array<{
    raceId: number;
    raceName: string;
    raceStatus: string;
    totalBets: number;
    totalBetAmount: number;
    totalPayouts: number;
    profit: number;
  }>;
}

interface BetRecord {
  id: number;
  userId: number;
  username?: string;
  raceId: number;
  raceName?: string;
  horseId: number;
  horseName?: string;
  amount: number;
  odds: number;
  status: string;
  payout: number;
  createdAt: string;
}

export default function AdminBettingStats() {
  const lang = localStorage.getItem("app-lang") || "en";
  const [stats, setStats] = useState<AdminBettingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRaceFilter, setSelectedRaceFilter] = useState<number | "ALL">("ALL");
  const [raceBets, setRaceBets] = useState<BetRecord[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get<AdminBettingSummary>("/betting/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load admin betting stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBetsForRace = async (raceId: number | "ALL") => {
    setSelectedRaceFilter(raceId);
    setLoadingBets(true);
    try {
      if (raceId === "ALL") {
        // Fetch all bets by iterating or calling endpoint
        // Since we don't have all-bets endpoint, fetch per race or fallback
        const allBets: BetRecord[] = [];
        if (stats?.raceBreakdown) {
          for (const r of stats.raceBreakdown) {
            const bets = await api.get<BetRecord[]>(`/betting/admin/race/${r.raceId}`).catch(() => []);
            if (Array.isArray(bets)) allBets.push(...bets);
          }
        }
        setRaceBets(allBets);
      } else {
        const bets = await api.get<BetRecord[]>(`/betting/admin/race/${raceId}`);
        setRaceBets(Array.isArray(bets) ? bets : []);
      }
    } catch (err) {
      console.error("Failed to load race bets", err);
    } finally {
      setLoadingBets(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(15,15,15,0.9) 100%)",
          border: "1px solid rgba(201,162,39,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.5rem", color: "#f4f2ec", marginBottom: "0.25rem" }}>
            📊 {$t("Race Betting Financial Analytics & House Margin", lang)}
          </h2>
          <p style={{ color: "#a0a0a0", fontSize: "0.85rem" }}>
            {$t("Monitor spectator betting volumes, payout distributions, overround margins, and total house net revenue.", lang)}
          </p>
        </div>

        <button
          onClick={fetchStats}
          style={{
            padding: "0.5rem 1rem",
            background: "rgba(201,162,39,0.2)",
            border: "1px solid #c9a227",
            color: "#c9a227",
            borderRadius: "0.5rem",
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: "0.8rem",
          }}
        >
          🔄 {$t("Refresh Data", lang)}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#a0a0a0", fontFamily: "monospace" }}>{$t("Loading betting statistics...", lang)}</p>
      ) : !stats ? (
        <p style={{ color: "#ef4444" }}>{$t("Failed to load betting data.", lang)}</p>
      ) : (
        <>
          {/* Key Financial KPIs Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {/* Total Wagered */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", borderRadius: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", textTransform: "uppercase" }}>
                💰 TOTAL BET VOLUME
              </span>
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f4f2ec", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {Number(stats.totalBetAmount ?? 0).toLocaleString("vi-VN")} VND
              </p>
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                From {stats.totalBets} total spectator bets
              </span>
            </div>

            {/* Total Payouts */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", borderRadius: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", textTransform: "uppercase" }}>
                🏆 WINNER PAYOUTS
              </span>
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fbbf24", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {Number(stats.totalPayouts ?? 0).toLocaleString("vi-VN")} VND
              </p>
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                Paid to winning spectators
              </span>
            </div>

            {/* House Net Revenue */}
            <div
              style={{
                background: stats.netRevenue >= 0 ? "rgba(74,222,128,0.05)" : "rgba(239,68,68,0.05)",
                border: stats.netRevenue >= 0 ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(239,68,68,0.3)",
                padding: "1.25rem",
                borderRadius: "1rem",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", textTransform: "uppercase" }}>
                📈 HOUSE NET REVENUE (PROFIT)
              </span>
              <p style={{ fontSize: "1.4rem", fontWeight: 800, color: stats.netRevenue >= 0 ? "#4ade80" : "#ef4444", fontFamily: "monospace", marginTop: "0.25rem" }}>
                {Number(stats.netRevenue ?? 0).toLocaleString("vi-VN")} VND
              </p>
              <span style={{ fontSize: "0.7rem", color: stats.netRevenue >= 0 ? "#4ade80" : "#ef4444", fontFamily: "monospace" }}>
                {stats.netRevenue >= 0 ? "Overround margin profit" : "Deficit payout"}
              </span>
            </div>

            {/* Bet Breakdown Counts */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem", borderRadius: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", textTransform: "uppercase" }}>
                🎯 BET STATUS RATIOS
              </span>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <span style={{ color: "#c9a227" }}>PENDING: {stats.pendingBets}</span> ·{" "}
                <span style={{ color: "#4ade80" }}>WON: {stats.wonBets}</span> ·{" "}
                <span style={{ color: "#ef4444" }}>LOST: {stats.lostBets}</span>
              </div>
            </div>
          </div>

          {/* Per-Race Revenue Breakdown Table */}
          <div>
            <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.15rem", color: "#f4f2ec", marginBottom: "0.75rem" }}>
              {$t("Per-Race Betting Performance Breakdown", lang)}
            </h3>

            {stats.raceBreakdown.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic" }}>{$t("No race betting activity recorded yet.", lang)}</p>
            ) : (
              <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #2a2825" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(201,162,39,0.08)", borderBottom: "1px solid #2a2825" }}>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#c9a227", fontFamily: "monospace" }}>RACE</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#c9a227", fontFamily: "monospace" }}>STATUS</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#c9a227", fontFamily: "monospace" }}>TOTAL BETS</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#c9a227", fontFamily: "monospace" }}>TOTAL WAGERED</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#c9a227", fontFamily: "monospace" }}>PAYOUTS</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "#c9a227", fontFamily: "monospace" }}>HOUSE PROFIT</th>
                      <th style={{ padding: "0.75rem 1rem", textAlign: "center", color: "#c9a227", fontFamily: "monospace" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.raceBreakdown.map((item) => (
                      <tr key={item.raceId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.75rem 1rem", color: "#f4f2ec", fontWeight: "bold" }}>
                          {item.raceName} <span style={{ color: "#a0a0a0", fontSize: "0.75rem", fontFamily: "monospace" }}>(#{item.raceId})</span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontFamily: "monospace",
                              fontWeight: "bold",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              background: item.raceStatus === "SCHEDULED" ? "rgba(74,222,128,0.1)" : item.raceStatus === "OFFICIAL" ? "rgba(59,130,246,0.1)" : "rgba(201,162,39,0.1)",
                              color: item.raceStatus === "SCHEDULED" ? "#4ade80" : item.raceStatus === "OFFICIAL" ? "#60a5fa" : "#c9a227",
                            }}
                          >
                            {item.raceStatus}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace" }}>{item.totalBets}</td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace" }}>
                          {Number(item.totalBetAmount).toLocaleString("vi-VN")} VND
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", color: "#fbbf24" }}>
                          {Number(item.totalPayouts).toLocaleString("vi-VN")} VND
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "right", fontFamily: "monospace", fontWeight: "bold", color: item.profit >= 0 ? "#4ade80" : "#ef4444" }}>
                          {item.profit >= 0 ? "+" : ""}{Number(item.profit).toLocaleString("vi-VN")} VND
                        </td>
                        <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                          <button
                            onClick={() => fetchBetsForRace(item.raceId)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              fontSize: "0.7rem",
                              fontFamily: "monospace",
                              background: "rgba(201,162,39,0.15)",
                              border: "1px solid rgba(201,162,39,0.3)",
                              color: "#c9a227",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                            }}
                          >
                            🔍 View Bets
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detailed Spectator Bet Logs Panel */}
          {selectedRaceFilter !== "ALL" && (
            <div style={{ marginTop: "1rem", background: "rgba(20,20,20,0.8)", border: "1px solid rgba(201,162,39,0.3)", padding: "1.25rem", borderRadius: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, color: "#c9a227", fontSize: "1.05rem" }}>
                  📜 Detailed Bets for Race #{selectedRaceFilter}
                </h4>
                <button
                  onClick={() => setSelectedRaceFilter("ALL")}
                  style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "0.8rem", fontFamily: "monospace" }}
                >
                  ✖ Close Details
                </button>
              </div>

              {loadingBets ? (
                <p style={{ color: "#a0a0a0", fontFamily: "monospace" }}>Loading bet logs...</p>
              ) : raceBets.length === 0 ? (
                <p style={{ color: "#a0a0a0", fontStyle: "italic" }}>No bets placed on this race yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#a0a0a0", textAlign: "left" }}>
                        <th style={{ padding: "0.5rem" }}>ID</th>
                        <th style={{ padding: "0.5rem" }}>SPECTATOR</th>
                        <th style={{ padding: "0.5rem" }}>HORSE</th>
                        <th style={{ padding: "0.5rem" }}>ODDS</th>
                        <th style={{ padding: "0.5rem" }}>STAKE</th>
                        <th style={{ padding: "0.5rem" }}>PAYOUT</th>
                        <th style={{ padding: "0.5rem" }}>STATUS</th>
                        <th style={{ padding: "0.5rem" }}>DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceBets.map((b) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>#{b.id}</td>
                          <td style={{ padding: "0.5rem", fontWeight: "bold", color: "#60a5fa" }}>{b.username ?? `User #${b.userId}`}</td>
                          <td style={{ padding: "0.5rem", color: "#f4f2ec" }}>{b.horseName ?? `Horse #${b.horseId}`}</td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "#c9a227", fontWeight: "bold" }}>{b.odds}x</td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>{Number(b.amount).toLocaleString("vi-VN")} VND</td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace", color: b.status === "WON" ? "#4ade80" : "#a0a0a0" }}>
                            {Number(b.payout).toLocaleString("vi-VN")} VND
                          </td>
                          <td style={{ padding: "0.5rem" }}>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "0.25rem",
                                background: b.status === "WON" ? "rgba(74,222,128,0.15)" : b.status === "LOST" ? "rgba(239,68,68,0.15)" : "rgba(201,162,39,0.15)",
                                color: b.status === "WON" ? "#4ade80" : b.status === "LOST" ? "#ef4444" : "#c9a227",
                              }}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem", fontFamily: "monospace", color: "#a0a0a0", fontSize: "0.7rem" }}>
                            {formatDateTime(b.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";
import { formatDateTime } from "../../../utils/dateTimeHelper";
import { $t } from "@/lib/i18n";

interface RaceOddsItem {
  horseId: number;
  horseName: string;
  horseRating: number;
  horseAvatar?: string;
  jockeyId?: number;
  jockeyName: string;
  gateNumber?: number;
  probability: number;
  odds: number;
  entryId: number;
}

interface BetRecord {
  id: number;
  userId: number;
  raceId: number;
  horseId: number;
  amount: number;
  odds: number;
  status: "PENDING" | "WON" | "LOST" | "REFUNDED";
  payout: number;
  createdAt: string;
  horseName?: string;
  raceName?: string;
  potentialPayout?: number;
}

export default function BettingView() {
  const { user, setUser } = useAuth();
  const lang = localStorage.getItem("app-lang") || "en";

  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [oddsList, setOddsList] = useState<RaceOddsItem[]>([]);
  const [loadingOdds, setLoadingOdds] = useState(false);

  const [selectedHorse, setSelectedHorse] = useState<RaceOddsItem | null>(null);
  const [betAmount, setBetAmount] = useState<string>("100000");
  const [placingBet, setPlacingBet] = useState(false);

  const [myBets, setMyBets] = useState<BetRecord[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"place" | "my-bets">("place");

  // Load scheduled races & my bets on mount
  useEffect(() => {
    fetchScheduledRaces();
    if (user?.id) {
      fetchMyBets();
    }
  }, [user?.id]);

  const fetchScheduledRaces = async () => {
    try {
      const allRaces = await api.get<any[]>("/public/races").catch(() => []);
      // Filter scheduled or active races
      const scheduled = (Array.isArray(allRaces) ? allRaces : []).filter(
        (r) => r.status === "SCHEDULED" || r.status === "DECLARATION_CLOSED" || r.status === "RUNNING"
      );
      setRaces(scheduled);
      if (scheduled.length > 0 && !selectedRaceId) {
        setSelectedRaceId(scheduled[0].id);
      }
    } catch (err) {
      console.error("Failed to load races", err);
    }
  };

  const fetchMyBets = async () => {
    if (!user?.id) return;
    setLoadingBets(true);
    try {
      const res = await api.get<BetRecord[]>(`/betting/my-bets?userId=${user.id}`);
      setMyBets(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to fetch my bets", err);
    } finally {
      setLoadingBets(false);
    }
  };

  // Fetch odds when selected race changes
  useEffect(() => {
    if (!selectedRaceId) {
      setOddsList([]);
      setSelectedHorse(null);
      return;
    }
    setLoadingOdds(true);
    setSelectedHorse(null);
    api
      .get<RaceOddsItem[]>(`/betting/odds/${selectedRaceId}`)
      .then((data) => {
        setOddsList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load odds", err);
        setOddsList([]);
      })
      .finally(() => setLoadingOdds(false));
  }, [selectedRaceId]);

  const handlePlaceBet = async () => {
    if (!user?.id || !selectedRaceId || !selectedHorse) return;
    setErrorMsg("");
    setSuccessMsg("");

    const numAmount = parseFloat(betAmount);
    if (isNaN(numAmount) || numAmount < 10000) {
      setErrorMsg($t("Minimum bet is 10,000 VND"));
      return;
    }
    if (numAmount > 10000000) {
      setErrorMsg($t("Maximum bet is 10,000,000 VND"));
      return;
    }

    setPlacingBet(true);
    try {
      await api.post("/betting/place", {
        userId: user.id,
        raceId: selectedRaceId,
        horseId: selectedHorse.horseId,
        amount: numAmount,
      });
      setSuccessMsg(
        $t("Bet placed successfully on ") +
          selectedHorse.horseName +
          ` (${selectedHorse.odds}x)!`
      );
      setSelectedHorse(null);
      fetchMyBets();
      if (user) {
        setUser({
          ...user,
          walletBalance: Math.max(0, (user.walletBalance ?? 0) - numAmount),
        });
      }
    } catch (err: any) {
      setErrorMsg(getErrMsg(err, $t("Failed to place bet.")));
    } finally {
      setPlacingBet(false);
    }
  };

  const handleForceWin = async () => {
    try {
      await api.post("/betting/test/win-all-bets", {});
      setSuccessMsg($t("🎉 Race ended! All pending bets settled as WON and payouts credited to your wallet!"));
      fetchMyBets();
      fetchScheduledRaces();
      if (user) {
        const updatedBalance = (user.walletBalance ?? 0) + 500000;
        setUser({ ...user, walletBalance: updatedBalance });
      }
    } catch (err: any) {
      setErrorMsg($t("Failed to settle bets."));
    }
  };

  const currentRaceObj = races.find((r) => r.id === selectedRaceId);
  const isBettingOpen =
    currentRaceObj?.status === "SCHEDULED" ||
    currentRaceObj?.status === "DECLARATION_OPEN" ||
    currentRaceObj?.status === "DECLARATION_CLOSED";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header & Balance Banner */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(201,162,39,0.12) 0%, rgba(20,20,20,0.8) 100%)",
          border: "1px solid rgba(201,162,39,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Roboto Slab', serif",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "#f4f2ec",
              marginBottom: "0.25rem",
            }}
          >
            🎲 {$t("Race Betting Arena", lang)}
          </h2>
          <p style={{ color: "#a0a0a0", fontSize: "0.85rem" }}>
            {$t("Place bets on scheduled horse races with real-time dynamic odds calculated from horse ratings.", lang)}
          </p>
        </div>

        {/* User Balance Chip */}
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,162,39,0.4)",
            padding: "0.75rem 1.25rem",
            borderRadius: "1rem",
            textAlign: "right",
          }}
        >
          <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", display: "block" }}>
            💳 {$t("YOUR WALLET BALANCE", lang)}
          </span>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#4ade80", fontFamily: "monospace" }}>
            {Number(user?.walletBalance ?? 0).toLocaleString("vi-VN")} VND
          </span>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveSubTab("place")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: activeSubTab === "place" ? "rgba(201,162,39,0.2)" : "transparent",
            color: activeSubTab === "place" ? "#c9a227" : "#a0a0a0",
            fontWeight: activeSubTab === "place" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        >
          🏇 {$t("Place Bets", lang)}
        </button>
        <button
          onClick={() => setActiveSubTab("my-bets")}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: activeSubTab === "my-bets" ? "rgba(201,162,39,0.2)" : "transparent",
            color: activeSubTab === "my-bets" ? "#c9a227" : "#a0a0a0",
            fontWeight: activeSubTab === "my-bets" ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.9rem",
            fontFamily: "monospace",
          }}
        >
          📜 {$t("My Bet Slip History", lang)} ({myBets.length})
        </button>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(74,222,128,0.15)", border: "1px solid #4ade80", color: "#4ade80", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* SUB-TAB 1: PLACE BETS */}
      {activeSubTab === "place" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Race Selector Dropdown / Cards */}
          <div>
            <label style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#c9a227", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.5rem" }}>
              {$t("Select Upcoming Race to Bet On:", lang)}
            </label>
            {races.length === 0 ? (
              <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.875rem" }}>{$t("No races available for betting right now.", lang)}</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                {races.map((r) => {
                  const isSelected = r.id === selectedRaceId;
                  const isOpen =
                    r.status === "SCHEDULED" ||
                    r.status === "DECLARATION_OPEN" ||
                    r.status === "DECLARATION_CLOSED";
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRaceId(r.id)}
                      style={{
                        padding: "0.875rem",
                        borderRadius: "0.75rem",
                        background: isSelected ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.02)",
                        border: isSelected ? "1px solid #c9a227" : "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.9rem" }}>
                          {r.classLevel ?? `Race #${r.id}`}
                        </span>
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontFamily: "monospace",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem",
                            background: isOpen ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
                            color: isOpen ? "#4ade80" : "#ef4444",
                            fontWeight: 700,
                          }}
                        >
                          {isOpen ? "BETTING OPEN" : r.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                        📏 {r.distanceMeters}m · {r.trackType}
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.15rem" }}>
                        ⏰ {formatDateTime(r.startTime)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Race Betting Grid & Slip */}
          {selectedRaceId && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }} className="betting-responsive-grid">
              {/* Odds List */}
              <div>
                <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "0.75rem" }}>
                  {$t("Runner Odds & Win Probabilities", lang)}
                </h3>

                {!isBettingOpen && (
                  <div style={{ padding: "0.75rem", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.8rem", fontWeight: "bold" }}>
                    🔒 {$t("Betting is CLOSED for this race (Status: ", lang) + currentRaceObj?.status + ")."}
                  </div>
                )}

                {loadingOdds ? (
                  <p style={{ color: "#a0a0a0", fontFamily: "monospace", fontSize: "0.85rem" }}>{$t("Calculating odds from horse ratings...", lang)}</p>
                ) : oddsList.length === 0 ? (
                  <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.85rem" }}>{$t("No horses registered in this race yet.", lang)}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {oddsList.map((item) => {
                      const isPicked = selectedHorse?.horseId === item.horseId;
                      return (
                        <div
                          key={item.horseId}
                          onClick={() => isBettingOpen && setSelectedHorse(item)}
                          style={{
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            background: isPicked ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.02)",
                            border: isPicked ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.06)",
                            cursor: isBettingOpen ? "pointer" : "not-allowed",
                            opacity: isBettingOpen ? 1 : 0.7,
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "#2a2825", color: "#c9a227", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.8rem", fontFamily: "monospace" }}>
                                #{item.gateNumber ?? "-"}
                              </span>
                              <div>
                                <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>{item.horseName}</span>
                                <span style={{ fontSize: "0.7rem", color: "#a0a0a0", display: "block", fontFamily: "monospace" }}>
                                  🏇 Jockey: {item.jockeyName} · Rating: <strong style={{ color: "#c9a227" }}>{item.horseRating}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Odds Badge */}
                            <div style={{ textAlign: "right" }}>
                              <span
                                style={{
                                  fontSize: "1.2rem",
                                  fontWeight: 800,
                                  color: "#c9a227",
                                  fontFamily: "monospace",
                                  background: "rgba(201,162,39,0.1)",
                                  padding: "0.3rem 0.75rem",
                                  borderRadius: "0.5rem",
                                  border: "1px solid rgba(201,162,39,0.3)",
                                }}
                              >
                                {item.odds.toFixed(2)}x
                              </span>
                              <span style={{ display: "block", fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.2rem" }}>
                                Prob: {item.probability}%
                              </span>
                            </div>
                          </div>

                          {/* Probability Bar */}
                          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, item.probability * 2)}%`, height: "100%", background: "linear-gradient(90deg, #c9a227, #f59e0b)" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bet Slip Panel */}
              <div
                style={{
                  background: "rgba(20,20,20,0.9)",
                  border: "1px solid rgba(201,162,39,0.3)",
                  borderRadius: "1rem",
                  padding: "1.25rem",
                  height: "fit-content",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <h4 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#c9a227", borderBottom: "1px solid rgba(201,162,39,0.2)", paddingBottom: "0.5rem" }}>
                  🎟️ {$t("Bet Slip", lang)}
                </h4>

                {selectedHorse ? (
                  <>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace" }}>{$t("Selected Horse:", lang)}</span>
                      <p style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "1rem" }}>{selectedHorse.horseName}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
                        <span style={{ color: "#a0a0a0" }}>{$t("Odds:", lang)}</span>
                        <span style={{ color: "#c9a227", fontWeight: "bold" }}>{selectedHorse.odds.toFixed(2)}x</span>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginBottom: "0.35rem" }}>
                        {$t("Stake Amount (VND):", lang)}
                      </label>
                      <input
                        type="number"
                        step="10000"
                        min="10000"
                        max="10000000"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.8rem",
                          background: "rgba(0,0,0,0.5)",
                          border: "1px solid rgba(201,162,39,0.3)",
                          borderRadius: "0.5rem",
                          color: "#fff",
                          fontSize: "1rem",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      />
                      {/* Preset Buttons */}
                      <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.5rem" }}>
                        {["50000", "100000", "500000", "1000000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBetAmount(preset)}
                            style={{
                              flex: 1,
                              padding: "0.25rem 0",
                              fontSize: "0.65rem",
                              fontFamily: "monospace",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#a0a0a0",
                              borderRadius: "0.25rem",
                              cursor: "pointer",
                            }}
                          >
                            {(parseInt(preset) / 1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Potential Payout Calculation */}
                    <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", padding: "0.75rem", borderRadius: "0.5rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace" }}>{$t("ESTIMATED POTENTIAL PAYOUT:", lang)}</span>
                      <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#4ade80", fontFamily: "monospace" }}>
                        {((parseFloat(betAmount) || 0) * selectedHorse.odds).toLocaleString("vi-VN")} VND
                      </p>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handlePlaceBet}
                      disabled={placingBet || !isBettingOpen}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        background: isBettingOpen ? "linear-gradient(45deg, #c9a227, #f3d06c)" : "#444",
                        color: "#110f0e",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        cursor: isBettingOpen ? "pointer" : "not-allowed",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                      }}
                    >
                      {placingBet ? $t("Processing...", lang) : "💥 " + $t("CONFIRM BET", lang)}
                    </button>
                  </>
                ) : (
                  <p style={{ color: "#a0a0a0", fontStyle: "italic", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
                    {$t("Click on any horse runner from the odds list to pick your horse.", lang)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MY BET SLIPS */}
      {activeSubTab === "my-bets" && (
        <div>
          <h3 style={{ fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f4f2ec", marginBottom: "1rem" }}>
            {$t("Your Personal Betting History", lang)}
          </h3>

          {loadingBets ? (
            <p style={{ color: "#a0a0a0", fontFamily: "monospace" }}>{$t("Loading bet history...", lang)}</p>
          ) : myBets.length === 0 ? (
            <p style={{ color: "#a0a0a0", fontStyle: "italic" }}>{$t("You haven't placed any bets yet.", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {myBets.map((bet) => {
                let badgeBg = "rgba(201,162,39,0.15)";
                let badgeColor = "#c9a227";
                if (bet.status === "WON") {
                  badgeBg = "rgba(74,222,128,0.15)";
                  badgeColor = "#4ade80";
                } else if (bet.status === "LOST") {
                  badgeBg = "rgba(239,68,68,0.15)";
                  badgeColor = "#ef4444";
                } else if (bet.status === "REFUNDED") {
                  badgeBg = "rgba(148,163,184,0.15)";
                  badgeColor = "#94a3b8";
                }

                return (
                  <div
                    key={bet.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, color: "#f4f2ec", fontSize: "0.95rem" }}>
                          🏇 {bet.horseName ?? `Horse #${bet.horseId}`}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#c9a227", fontFamily: "monospace", fontWeight: "bold" }}>
                          ({bet.odds}x)
                        </span>
                      </div>
                      <p style={{ fontSize: "0.7rem", color: "#a0a0a0", fontFamily: "monospace", marginTop: "0.2rem" }}>
                        🏆 {bet.raceName ?? `Race #${bet.raceId}`} · 📅 {formatDateTime(bet.createdAt)}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", display: "block" }}>STAKE</span>
                        <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: "bold", fontFamily: "monospace" }}>
                          {Number(bet.amount).toLocaleString("vi-VN")} VND
                        </span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.65rem", color: "#a0a0a0", fontFamily: "monospace", display: "block" }}>PAYOUT</span>
                        <span style={{ fontSize: "0.9rem", color: bet.status === "WON" ? "#4ade80" : "#a0a0a0", fontWeight: "bold", fontFamily: "monospace" }}>
                          {bet.status === "WON"
                            ? `+${Number(bet.payout).toLocaleString("vi-VN")} VND`
                            : bet.status === "PENDING"
                            ? `Est: ${Number(bet.potentialPayout ?? bet.amount * bet.odds).toLocaleString("vi-VN")}`
                            : "0 VND"}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "0.375rem",
                          background: badgeBg,
                          color: badgeColor,
                          minWidth: "70px",
                          textAlign: "center",
                        }}
                      >
                        {bet.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

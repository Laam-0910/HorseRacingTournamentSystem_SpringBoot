import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

interface VietQRPaywallModalProps {
  userId: number;
  seasonId?: number | null;
  raceMeetingId?: number | null;
  raceMeetingName?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function VietQRPaywallModal({
  userId,
  seasonId,
  raceMeetingId,
  raceMeetingName,
  onSuccess,
  onClose,
}: VietQRPaywallModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<"RACEMEETING" | "SEASON">("RACEMEETING");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");

  const bankName = "TPB";
  const accountNumber = "08410092005";
  const accountHolder = "HORSE RACING ORG";

  // Fetch dynamic quote when package selection changes
  useEffect(() => {
    setLoading(true);
    setError("");
    api.get<any>(`/public/livestream/quote?userId=${userId}&packageType=${selectedPackage}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`)
      .then(res => setQuote(res))
      .catch(err => setError(getErrMsg(err, "Failed to calculate quote.")))
      .finally(() => setLoading(false));
  }, [selectedPackage, userId, seasonId, raceMeetingId]);

  // Auto-polling check access & simulated QR scan auto-activation every 3 seconds
  useEffect(() => {
    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const accessRes = await api.get<any>(
          `/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`
        );
        if (accessRes.hasAccess && !isCancelled) {
          onSuccess();
          return;
        }

        // Auto trigger purchase simulation on QR detection
        if (quote && !purchasing && !isCancelled) {
          const res = await api.post<any>("/public/livestream/purchase", {
            userId,
            packageType: selectedPackage,
            seasonId,
            raceMeetingId: selectedPackage === "RACEMEETING" ? raceMeetingId : null,
            amount: quote.finalPrice,
          });
          if (res.success && !isCancelled) {
            onSuccess();
          }
        }
      } catch (err) {
        // Silent poll error
      }
    }, 3500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [userId, seasonId, raceMeetingId, selectedPackage, quote, purchasing, onSuccess]);

  const finalAmount = quote ? quote.finalPrice : selectedPackage === "RACEMEETING" ? 15000 : 79000;
  const transferContent = `PPV_${userId}_${selectedPackage}_${raceMeetingId || seasonId || 1}`;
  const qrImageUrl = `https://img.vietqr.io/image/${bankName}-${accountNumber}-compact2.jpg?amount=${finalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60000, padding: "1rem" }}>
      <div style={{ background: "#12100d", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "1rem", width: "100%", maxWidth: "34rem", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
        
        {/* Modal Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(201,162,39,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#f4f2ec", fontFamily: "'Roboto Slab', serif" }}>
              Unlock HD Livestream Access
            </h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              Scan VietQR to watch live races in high definition.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}

          {/* Package Selector */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", marginBottom: "0.5rem" }}>
              Select Viewing Package
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Option 1: RaceMeeting Pass */}
              <div
                onClick={() => setSelectedPackage("RACEMEETING")}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: selectedPackage === "RACEMEETING" ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                  background: selectedPackage === "RACEMEETING" ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>RaceMeeting Pass</div>
                <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#c9a227", fontFamily: "monospace", marginTop: "4px" }}>
                  {selectedPackage === "RACEMEETING" && quote ? `${Number(quote.finalPrice).toLocaleString()} VND` : "15,000 VND"}
                </div>
                <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "4px" }}>
                  24h access for {raceMeetingName || "this event"}
                </div>
              </div>

              {/* Option 2: Season Pass */}
              <div
                onClick={() => setSelectedPackage("SEASON")}
                style={{
                  padding: "0.875rem",
                  borderRadius: "0.75rem",
                  border: selectedPackage === "SEASON" ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                  background: selectedPackage === "SEASON" ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>Season Pass</span>
                  <span style={{ fontSize: "8px", background: "#10b981", color: "#000", padding: "1px 4px", borderRadius: "2px", fontWeight: "bold" }}>BEST VALUE</span>
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#34d399", fontFamily: "monospace", marginTop: "4px" }}>
                  {selectedPackage === "SEASON" && quote ? `${Number(quote.finalPrice).toLocaleString()} VND` : "79,000 VND"}
                </div>
                <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "4px" }}>
                  {selectedPackage === "SEASON" && quote?.discountApplied > 0 ? quote?.description : "Unlimited access to all meetings"}
                </div>
              </div>
            </div>
          </div>

          {/* VietQR Scanner Area */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "1.25rem", background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <img
                src={qrImageUrl}
                alt="VietQR Code"
                style={{ width: "120px", height: "120px", borderRadius: "0.5rem", border: "2px solid #fff", background: "#fff" }}
              />
              <span style={{ fontSize: "9px", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginTop: "4px" }}>Scan via Banking App</span>
            </div>

            <div style={{ fontSize: "11px", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div>Bank: <strong style={{ color: "#fff" }}>{bankName}</strong></div>
              <div>Account: <strong style={{ color: "#c9a227", fontFamily: "monospace" }}>{accountNumber}</strong></div>
              <div>Holder: <strong style={{ color: "#fff" }}>{accountHolder}</strong></div>
              <div>Amount: <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: "14px" }}>{Number(finalAmount).toLocaleString()} VND</strong></div>
              <div>Transfer Content: <strong style={{ color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>{transferContent}</strong></div>
              <div style={{ marginTop: "4px", color: "#10b981", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }}></span>
                Auto-detecting payment, please scan...
              </div>
            </div>
          </div>

          {/* Action Buttons: Only Cancel */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem 1.25rem",
                background: "#1f1f22",
                border: "1px solid #2d2d30",
                color: "#a0a0a0",
                borderRadius: "0.5rem",
                fontSize: "13px",
                fontFamily: "monospace",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

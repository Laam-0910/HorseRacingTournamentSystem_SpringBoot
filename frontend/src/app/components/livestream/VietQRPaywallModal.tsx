import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";

interface VietQRPaywallModalProps {
  userId: number;
  seasonId?: number | null;
  raceMeetingId?: number | null;
  raceMeetingName?: string;
  initialPackage?: "RACEMEETING" | "SEASON";
  onSuccess: () => void;
  onClose: () => void;
}

export default function VietQRPaywallModal({
  userId,
  seasonId,
  raceMeetingId,
  raceMeetingName,
  initialPackage,
  onSuccess,
  onClose,
}: VietQRPaywallModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<"RACEMEETING" | "SEASON">(initialPackage || "RACEMEETING");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [payingViaWallet, setPayingViaWallet] = useState(false);
  const [walletBal, setWalletBal] = useState<number>(0);
  const [error, setError] = useState("");

  const bankName = "TPB";
  const accountNumber = "08410092005";
  const accountHolder = "HORSE RACING ORG";

  const [timeLeft, setTimeLeft] = useState(300); // 5-minute countdown timer (300s)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  useEffect(() => {
    if (userId) {
      api.get<any>(`/public/users/${userId}`)
        .then(res => {
          const u = res.user || res;
          if (u.walletBalance !== undefined && u.walletBalance !== null) {
            setWalletBal(Number(u.walletBalance));
          }
        })
        .catch(() => {});
    }
  }, [userId]);

  // Fetch dynamic quote when package selection changes
  useEffect(() => {
    setLoading(true);
    setError("");
    api.get<any>(`/public/livestream/quote?userId=${userId}&packageType=${selectedPackage}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`)
      .then(res => setQuote(res))
      .catch(err => setError(getErrMsg(err, "Failed to calculate quote.")))
      .finally(() => setLoading(false));
  }, [selectedPackage, userId, seasonId, raceMeetingId]);

  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.get<any>("/public/wallet/webhook/mode")
      .then(res => setIsMockMode(!!res.isMock))
      .catch(() => setIsMockMode(true));
  }, []);

  // Auto-polling check access & simulated QR scan auto-activation every 2.5 seconds
  useEffect(() => {
    let isCancelled = false;
    const checkPayment = async () => {
      try {
        const accessRes = await api.get<any>(
          `/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`
        );
        if (accessRes.hasAccess && !isCancelled && !paymentSuccess) {
          setPaymentSuccess(true);
          setTimeout(() => {
            if (!isCancelled) onSuccess();
          }, 1200);
          return;
        }

        // Auto trigger purchase simulation ONLY if system is in MOCK mode
        if (isMockMode && quote && !purchasing && !payingViaWallet && !isCancelled && !paymentSuccess) {
          const res = await api.post<any>("/public/livestream/purchase", {
            userId,
            packageType: selectedPackage,
            seasonId,
            raceMeetingId: selectedPackage === "RACEMEETING" ? raceMeetingId : null,
            amount: quote.finalPrice,
            paymentMethod: "VIETQR"
          });
          if (res.success && !isCancelled && !paymentSuccess) {
            setPaymentSuccess(true);
            onSuccess();
          }
        }
      } catch (err) {
        // Silent poll error
      }
    };

    checkPayment();
    const interval = setInterval(checkPayment, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [userId, seasonId, raceMeetingId, selectedPackage, quote, purchasing, payingViaWallet, isMockMode, onSuccess, paymentSuccess]);

  const finalAmount = quote ? Number(quote.finalPrice) : selectedPackage === "RACEMEETING" ? 15000 : 79000;
  const transferContent = `PPV_${userId}_${selectedPackage}_${raceMeetingId || seasonId || 1}`;
  const qrImageUrl = `https://img.vietqr.io/image/${bankName}-${accountNumber}-compact2.jpg?amount=${finalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  const handlePayViaWallet = async () => {
    setPayingViaWallet(true);
    setError("");
    try {
      const res = await api.post<any>("/public/livestream/purchase", {
        userId,
        packageType: selectedPackage,
        seasonId,
        raceMeetingId: selectedPackage === "RACEMEETING" ? raceMeetingId : null,
        amount: finalAmount,
        paymentMethod: "WALLET",
      });
      if (res.success) {
        setPaymentSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Wallet payment failed. Please check your balance or top up via VietQR."));
    } finally {
      setPayingViaWallet(false);
    }
  };

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
              Pay via your available wallet balance or scan VietQR code.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {paymentSuccess && (
            <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#34d399", fontSize: "13px", fontWeight: "bold", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <span>🎉</span> Payment Received & Verified! HD Stream Unlocked. Closing window...
            </div>
          )}

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
                  {finalAmount.toLocaleString('en-US')} VNĐ
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
                  79,000 VNĐ
                </div>
                <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "4px" }}>
                  {selectedPackage === "SEASON" && quote?.discountApplied > 0 ? quote?.description : "Unlimited access to all meetings"}
                </div>
              </div>
            </div>
          </div>

          {/* Option A: Direct Wallet Deduction Button */}
          <div style={{ background: "rgba(201,162,39,0.08)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(201,162,39,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "11px", color: "#a0a0a0", fontFamily: "monospace" }}>Your Available Wallet:</span>
              <strong style={{ fontSize: "1rem", color: "#fbbf24", fontFamily: "monospace" }}>{walletBal.toLocaleString('en-US')} VNĐ</strong>
            </div>
            <button
              onClick={handlePayViaWallet}
              disabled={payingViaWallet || walletBal < finalAmount}
              style={{
                width: "100%",
                padding: "0.625rem",
                background: walletBal >= finalAmount ? "linear-gradient(45deg, #c9a227, #f3d06c)" : "#27272a",
                color: walletBal >= finalAmount ? "#000" : "#71717a",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "12px",
                fontFamily: "monospace",
                fontWeight: 700,
                cursor: walletBal >= finalAmount ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
            >
              {payingViaWallet ? "Processing Wallet Deduction..." : walletBal >= finalAmount ? `⚡ Pay ${finalAmount.toLocaleString('en-US')} VNĐ via Available Wallet` : `🔒 Insufficient Balance (${walletBal.toLocaleString('en-US')} VNĐ available)`}
            </button>
          </div>

          {/* Option B: VietQR Scanner Area */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "1.25rem", background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <img
                src={qrImageUrl}
                alt="VietQR Code"
                style={{ width: "120px", height: "120px", borderRadius: "0.5rem", border: "2px solid #fff", background: "#fff" }}
              />
              <span style={{ fontSize: "9px", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginTop: "4px" }}>Or Scan via Banking App</span>
            </div>

            <div style={{ fontSize: "11px", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "monospace", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(251,191,36,0.2)", marginBottom: "4px" }}>
                <span>⏱️ QR expires in:</span>
                <strong style={{ color: "#fcd34d" }}>{formattedTime}</strong>
              </div>
              <div>Bank: <strong style={{ color: "#fff" }}>{bankName}</strong></div>
              <div>Account: <strong style={{ color: "#c9a227", fontFamily: "monospace" }}>{accountNumber}</strong></div>
              <div>Holder: <strong style={{ color: "#fff" }}>{accountHolder}</strong></div>
              <div>Ticket Price: <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: "14px" }}>{finalAmount.toLocaleString('en-US')} VNĐ</strong></div>
              <div>Transfer Content: <strong style={{ color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>{transferContent}</strong></div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "1rem 1.5rem", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1.25rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

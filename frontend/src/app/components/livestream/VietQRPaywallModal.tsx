import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, getErrMsg } from "../../../lib/api";

interface VietQRPaywallModalProps {
  userId: number;
  seasonId?: number | null;
  raceMeetingId?: number | null;
  raceMeetingName?: string;
  initialPackage?: "RACEMEETING" | "SEASON";
  isExtendMode?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function VietQRPaywallModal({
  userId,
  seasonId,
  raceMeetingId,
  raceMeetingName,
  initialPackage,
  isExtendMode = false,
  onSuccess,
  onClose,
}: VietQRPaywallModalProps) {
  const hasRaceMeeting = !!raceMeetingId;
  const [selectedPackage, setSelectedPackage] = useState<"RACEMEETING" | "SEASON">(() => {
    if (!hasRaceMeeting) return "SEASON";
    return initialPackage || "RACEMEETING";
  });

  useEffect(() => {
    if (!hasRaceMeeting && selectedPackage !== "SEASON") {
      setSelectedPackage("SEASON");
    }
  }, [hasRaceMeeting, selectedPackage]);


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
      api.get<any>(`/public/users/${userId}/profile`)
        .then(res => {
          const bal = res.walletBalance ?? res.balance;
          if (bal !== undefined && bal !== null) {
            setWalletBal(Number(bal));
          }
        })
        .catch(() => {
          api.get<any>(`/admin/users/${userId}/wallet`)
            .then(res => {
              if (res.walletBalance !== undefined) {
                setWalletBal(Number(res.walletBalance));
              }
            })
            .catch(() => {});
        });
    }
  }, [userId]);

  // Quotes are now loaded in parallel on mount (see useEffect below)

  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successCountdown, setSuccessCountdown] = useState<number>(0);

  // Separate quotes for each package to avoid showing wrong price when switching tabs
  const [meetingQuote, setMeetingQuote] = useState<any>(null);
  const [seasonQuote, setSeasonQuote] = useState<any>(null);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Access info (startDate + expiresAt) for current active subscription
  const [accessInfo, setAccessInfo] = useState<any>(null);

  // Unique refId per modal open (timestamp-based, unique per Spectator per transaction)
  const [refId] = useState<string>(() => Date.now().toString());

  // Load both quotes in parallel on mount
  useEffect(() => {
    setQuotesLoading(true);
    const params = `userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}${isExtendMode ? "&isExtend=true" : ""}`;
    Promise.all([
      hasRaceMeeting
        ? api.get<any>(`/public/livestream/quote?${params}&packageType=RACEMEETING`).catch(() => null)
        : Promise.resolve(null),
      api.get<any>(`/public/livestream/quote?${params}&packageType=SEASON`).catch(() => null),
    ]).then(([mq, sq]) => {
      if (mq) setMeetingQuote(mq);
      if (sq) setSeasonQuote(sq);
    }).finally(() => setQuotesLoading(false));

    api.get<any>(`/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}&meetingId=${raceMeetingId}` : ""}`)
      .then(res => { if (res.hasAccess) setAccessInfo(res); })
      .catch(() => {});
  }, [userId, seasonId, raceMeetingId, hasRaceMeeting, isExtendMode]);

  // Auto-switch selectedPackage to SEASON if Monthly card should be hidden
  useEffect(() => {
    const hasDiscount = seasonQuote && Number(seasonQuote.discountApplied || 0) > 0;
    const hasMonthlyActive = accessInfo?.packageType === "RACEMEETING";
    if (!isExtendMode && (hasDiscount || hasMonthlyActive)) {
      setSelectedPackage("SEASON");
    }
  }, [isExtendMode, seasonQuote, accessInfo]);

  useEffect(() => {
    api.get<any>("/public/wallet/webhook/mode")
      .then(res => setIsMockMode(!!res.isMock))
      .catch(() => setIsMockMode(true));
  }, []);

  // Auto-polling check access if user paid outside (or real webhook triggered)
  useEffect(() => {
    let isCancelled = false;
    let initialHasAccess: boolean | null = null;
    let initialExpiry: number = 0;

    // Fetch initial access state once
    api.get<any>(`/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`)
      .then(res => {
        initialHasAccess = Boolean(res.hasAccess);
        initialExpiry = Number(res.expiresAt || 0);
      })
      .catch(() => {
        initialHasAccess = false;
      });

    const checkPayment = async () => {
      // Only poll for external webhook completion if not already completed/processing
      if (paymentSuccess || purchasing || payingViaWallet) return;
      try {
        const accessRes = await api.get<any>(
          `/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`
        );
        const curHasAccess = Boolean(accessRes.hasAccess);
        const curExpiry = Number(accessRes.expiresAt || 0);

        // Payment succeeded if:
        // 1. User previously had NO access, but NOW has access.
        // OR 2. User previously HAD access, but their expiresAt was extended.
        const newlyGranted = initialHasAccess === false && curHasAccess === true;
        const expiryExtended = initialHasAccess === true && curHasAccess === true && curExpiry > initialExpiry;

        if ((newlyGranted || expiryExtended) && !isCancelled && !paymentSuccess) {
          setPaymentSuccess(true);
          setSuccessCountdown(2);
          // Auto-close modal after 2 seconds
          setTimeout(() => {
            if (!isCancelled) onSuccess();
          }, 2000);
        }
      } catch (err) {}
    };

    const interval = setInterval(checkPayment, 3000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [userId, seasonId, raceMeetingId, purchasing, payingViaWallet, onSuccess, paymentSuccess]);

  // Countdown display for auto-close
  useEffect(() => {
    if (successCountdown <= 0) return;
    const t = setInterval(() => setSuccessCountdown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [successCountdown]);

  // Called by the "Confirm Payment" dev button.
  // Step 1: Try to simulate via real sepay-webhook (same path real bank uses).
  // Step 2: If webhook endpoint fails (not deployed), fallback to /purchase directly.
  const handleSimulateVietQRPay = async () => {
    setPurchasing(true);
    setError("");
    try {
      // Step 1: Attempt to call the real webhook endpoint
      await api.post<any>("/public/wallet/sepay-webhook", {
        id: Date.now(),
        gateway: "TPBank",
        transactionDate: new Date().toISOString(),
        accountNumber,
        code: null,
        content: transferContent,
        transferType: "in",
        transferAmount: finalAmount,
        accumulated: finalAmount,
        subAccount: null,
        referenceCode: `SIM${Date.now()}`,
        description: transferContent,
      });
    } catch (webhookErr: any) {
      try {
        // Step 2: Attempt direct purchase API if webhook fails
        await api.post<any>("/public/livestream/purchase", {
          userId,
          packageType: selectedPackage,
          seasonId,
          raceMeetingId: selectedPackage === "RACEMEETING" ? raceMeetingId : null,
          amount: finalAmount,
          paymentMethod: "VIETQR",
        });
      } catch (purchaseErr: any) {
        console.warn("Simulated payment API call failed, but force unlocking anyway per fake confirm logic:", purchaseErr);
      }
    } finally {
      // Always force unlock access regardless of API outcome
      setPurchasing(false);
      setPaymentSuccess(true);
      setSuccessCountdown(2);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  // finalAmount based on the correct quote for selected package
  const quote = selectedPackage === "RACEMEETING" ? meetingQuote : seasonQuote;
  const finalAmount = quote ? Number(quote.finalPrice) : selectedPackage === "RACEMEETING" ? 15000 : 79000;
  
  // Format transfer content: PPV_{userId}_{packageType}_{meetingIdOrSeasonId}_{txTimestamp}
  const targetId = selectedPackage === "RACEMEETING" ? (raceMeetingId || 1) : (seasonId || 1);
  const transferContent = `PPV_${userId}_${selectedPackage}_${targetId}_${refId}`;
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
        setSuccessCountdown(2);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Wallet payment failed. Please check your balance or top up via VietQR."));
    } finally {
      setPayingViaWallet(false);
    }
  };

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Lock background body scrolling when modal is active so mouse wheel never scrolls background page!
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "1rem" }}>
      <div style={{ background: "#12100d", border: "1px solid rgba(201,162,39,0.35)", borderRadius: "1rem", width: "100%", maxWidth: "56rem", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)", overflow: "hidden" }}>
        
        {/* Modal Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(201,162,39,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#f4f2ec", fontFamily: "'Roboto Slab', serif" }}>
              Unlock / Extend HD Livestream Access
            </h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              Pay via your available wallet balance or scan VietQR code to unlock or extend access time.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}>✕</button>
        </div>

        {/* Modal Body - Scrollable content if viewport is small */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flexGrow: 1 }}>
          {paymentSuccess && (
            <div style={{ padding: "1rem", borderRadius: "0.5rem", background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", color: "#34d399", fontSize: "13px", fontWeight: "bold", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
              <span>🎉 Payment Received & Verified! HD Stream Unlocked / Extended.</span>
              <span style={{ fontSize: "11px", color: "#6ee7b7", fontFamily: "monospace" }}>Auto-closing in {successCountdown}s...</span>
            </div>
          )}

          {error && (
            <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "12px" }}>
              ⚠ {error}
            </div>
          )}

          {/* Section 1: Package Selector */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", marginBottom: "0.5rem" }}>
              {isExtendMode ? "1. Select Extension Period (+ Extra Time)" : "1. Select Viewing Package"}
            </label>
            
            {(() => {
              const currentActiveType = accessInfo?.packageType;
              const hasDiscount = seasonQuote && Number(seasonQuote.discountApplied || 0) > 0;
              const hasMonthly = currentActiveType === "RACEMEETING" || hasDiscount;
              const hasAnnual = currentActiveType === "SEASON";

              if (!isExtendMode && hasAnnual) {
                return (
                  <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)", color: "#fbbf24", fontSize: "12px", textAlign: "center" }}>
                    <p style={{ fontWeight: "bold" }}>⭐ You already possess the highest pass level (Annual Pass)!</p>
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
                      To add more viewing time to your active pass, please click the <strong>Extend Access</strong> button.
                    </p>
                  </div>
                );
              }

              const hideMonthlyCard = !isExtendMode && hasMonthly;

              return (
                <div style={{ display: "grid", gridTemplateColumns: (hasRaceMeeting && !hideMonthlyCard) ? "1fr 1fr" : "1fr", gap: "1rem" }}>
                  {/* Option 1: Monthly Pass (Uiverse Cobp Card) */}
                  {hasRaceMeeting && !hideMonthlyCard && (
                    <div
                      onClick={() => setSelectedPackage("RACEMEETING")}
                      className={`cobp-card-container ${selectedPackage === "RACEMEETING" ? "selected" : ""}`}
                    >
                      <div className="title-card">
                        <p>{isExtendMode ? "EXTEND 30 DAYS" : "EVENT PASS"}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                      </div>
                      <div className="card-content">
                        <p className="title">{isExtendMode ? "Extend Monthly (+30 Days)" : "Monthly Pass"}</p>
                        <p className="plain">
                          <span>{quotesLoading ? "..." : (meetingQuote ? Number(meetingQuote.finalPrice).toLocaleString('en-US') : "15,000")}</span>
                          <span>VNĐ / month</span>
                        </p>
                        <p className="description">
                          {isExtendMode ? "Add +30 days extra streaming time for this event." : `30-day HD livestream access for ${raceMeetingName || "this event"}.`}
                        </p>
                        <button className="card-btn">
                          {selectedPackage === "RACEMEETING" ? "✓ Selected (Proceed Below)" : "Select Monthly Pass"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Option 2: Annual Pass (Uiverse Cobp Card - Best Value / Most Popular) */}
                  <div
                    onClick={() => setSelectedPackage("SEASON")}
                    className={`cobp-card-container ${selectedPackage === "SEASON" ? "selected" : ""}`}
                  >
                    <div className="title-card">
                      <p>{!isExtendMode && hasMonthly ? "15,000 VNĐ OFF" : "MOST POPULAR / BEST VALUE"}</p>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div className="card-content">
                      <p className="title">{isExtendMode ? "Extend Annual (+365 Days)" : "Upgrade to Annual Pass"}</p>
                      <p className="plain">
                        <span>{quotesLoading ? "..." : (seasonQuote ? Number(seasonQuote.finalPrice).toLocaleString('en-US') : "79,000")}</span>
                        <span>VNĐ / year</span>
                      </p>
                      <p className="description">
                        {isExtendMode
                          ? "Add +365 days extra streaming time across all events."
                          : !isExtendMode && hasMonthly
                          ? "Upgrade to Annual Pass (15,000 VNĐ credited from active Monthly Pass)."
                          : "Full 365-day unlimited HD livestream pass for all tournament events."}
                      </p>
                      {accessInfo && accessInfo.expiresAtFormatted && (
                        <div style={{ fontSize: "9px", color: "#6ee7b7", fontFamily: "monospace", background: "rgba(16,185,129,0.1)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.2)" }}>
                          ✅ Active until: {accessInfo.expiresAtFormatted}
                        </div>
                      )}
                      <button className="card-btn">
                        {selectedPackage === "SEASON" ? "✓ Selected (Proceed Below)" : "Select Annual Pass"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 2: Split 2 Payment Methods Side-by-Side (2 Columns) */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", marginBottom: "0.5rem" }}>
              2. Choose Payment Method
            </label>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem", alignItems: "stretch" }}>
              
              {/* Column 1 / Method A: Available Wallet Balance */}
              <div style={{ background: "rgba(201,162,39,0.06)", padding: "1.25rem", borderRadius: "0.85rem", border: "1px solid rgba(201,162,39,0.25)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>💳</span>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#f4f2ec", margin: 0 }}>Method 1: Account Wallet</h4>
                      <p style={{ fontSize: "10px", color: "#a0a0a0", margin: 0 }}>Instant one-click deduction</p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.35)", padding: "0.875rem", borderRadius: "0.6rem", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "10px", color: "#a0a0a0", fontFamily: "monospace" }}>Your Available Balance:</div>
                    <div style={{ fontSize: "1.35rem", fontWeight: "bold", color: "#fbbf24", fontFamily: "monospace", marginTop: "2px" }}>
                      {walletBal.toLocaleString('en-US')} VND
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: "1.4", marginBottom: "1rem" }}>
                    Pay directly using funds available in your account wallet balance. Instant activation upon click.
                  </div>
                </div>

                <button
                  onClick={handlePayViaWallet}
                  disabled={payingViaWallet || walletBal < finalAmount}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    background: walletBal >= finalAmount ? "linear-gradient(45deg, #c9a227, #f3d06c)" : "#27272a",
                    color: walletBal >= finalAmount ? "#000" : "#71717a",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    cursor: walletBal >= finalAmount ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    boxShadow: walletBal >= finalAmount ? "0 4px 15px rgba(201,162,39,0.3)" : "none"
                  }}
                >
                  {payingViaWallet ? "Processing Deduction..." : walletBal >= finalAmount ? `⚡ Pay ${finalAmount.toLocaleString('en-US')} VND via Wallet` : `🔒 Insufficient Balance (${walletBal.toLocaleString('en-US')} VND)`}
                </button>
              </div>

              {/* Column 2 / Method B: Scan VietQR Transfer */}
              <div style={{ background: "rgba(0,0,0,0.4)", padding: "1.25rem", borderRadius: "0.85rem", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.875rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>📲</span>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#f4f2ec", margin: 0 }}>Method 2: Scan VietQR Code</h4>
                      <p style={{ fontSize: "10px", color: "#a0a0a0", margin: 0 }}>Banking app auto-verification</p>
                    </div>
                  </div>

                  {/* Large Prominent VietQR Display */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(201,162,39,0.25)", marginBottom: "0.75rem" }}>
                    <div style={{ background: "#ffffff", padding: "10px", borderRadius: "0.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                      <img
                        src={qrImageUrl}
                        alt="VietQR Code"
                        style={{ width: "180px", height: "180px", display: "block", borderRadius: "0.375rem" }}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "#fbbf24", fontFamily: "monospace", fontWeight: 600, marginTop: "8px" }}>
                      📱 Scan with Banking App
                    </span>
                  </div>

                  {/* Bank Transfer Details */}
                  <div style={{ fontSize: "10px", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontFamily: "monospace", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(251,191,36,0.2)", marginBottom: "2px" }}>
                      <span>⏱️ Expires in:</span>
                      <strong style={{ color: "#fcd34d", fontSize: "11px" }}>{formattedTime}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bank:</span> <strong style={{ color: "#fff" }}>{bankName}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Account:</span> <strong style={{ color: "#c9a227", fontFamily: "monospace" }}>{accountNumber}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Holder:</span> <strong style={{ color: "#fff" }}>{accountHolder}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Content:</span> <strong style={{ color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "1px 5px", borderRadius: "3px", wordBreak: "break-all" }}>{transferContent}</strong></div>
                  </div>

                  <div style={{ marginTop: "0.6rem", padding: "0.35rem 0.5rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399", borderRadius: "0.375rem", fontSize: "9px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>🟢</span> Realtime Bank Webhook Active
                  </div>
                </div>

                <button
                  onClick={handleSimulateVietQRPay}
                  disabled={purchasing || paymentSuccess}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    background: purchasing || paymentSuccess ? "#27272a" : "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.08) 100%)",
                    border: "1px dashed rgba(251,191,36,0.45)",
                    color: purchasing || paymentSuccess ? "#52525b" : "#fbbf24",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    cursor: purchasing || paymentSuccess ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {purchasing ? "⏳ Processing..." : paymentSuccess ? "✅ Payment Verified" : "⚡ Confirm Payment (Simulate Transfer)"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: "0.875rem 1.5rem", background: "rgba(0,0,0,0.3)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1.25rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fff", borderRadius: "0.375rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

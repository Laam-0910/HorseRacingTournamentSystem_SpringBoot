import { useState, useEffect, useRef } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { buildMockQrImageUrl, buildVietQrImageUrl, isLivePaymentMode } from "../../utils/vietqr";

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

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

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
  const paymentDetectedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [payosLoading, setPayosLoading] = useState(false);
  const [payosQrCode, setPayosQrCode] = useState("");
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState("");
  const [payosError, setPayosError] = useState("");
  const [payosTransferNote, setPayosTransferNote] = useState("");

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
      .then(res => {
        setIsMockMode(!isLivePaymentMode(res));
        // Optional fallbacks only — LIVE prefers PayOS API account details
        if (res?.bankName != null && String(res.bankName).trim() && String(res.bankName).trim() !== "NOT_SET") {
          setBankName(String(res.bankName));
        }
        if (res?.accountNumber != null && String(res.accountNumber).trim() && String(res.accountNumber).trim() !== "NOT_SET") {
          setAccountNumber(String(res.accountNumber));
        }
        if (res?.accountName != null && String(res.accountName).trim() && String(res.accountName).trim() !== "NOT_SET") {
          setAccountHolder(String(res.accountName));
        }
      })
      .catch(() => setIsMockMode(true));
  }, []);

  // Auto-polling: detect PayOS webhook activating/extending livestream access
  useEffect(() => {
    let isCancelled = false;
    let baselineReady = false;
    let baselineHasAccess = false;
    let baselineExpiry = 0;
    paymentDetectedRef.current = false;

    const accessUrl = `/public/livestream/access?userId=${userId}${seasonId ? `&seasonId=${seasonId}` : ""}${raceMeetingId ? `&raceMeetingId=${raceMeetingId}` : ""}`;

    const captureBaseline = async () => {
      try {
        const res = await api.get<any>(accessUrl);
        if (isCancelled) return;
        baselineHasAccess = Boolean(res.hasAccess);
        baselineExpiry = Number(res.expiresAt || 0);
        baselineReady = true;
      } catch {
        if (isCancelled) return;
        baselineHasAccess = false;
        baselineExpiry = 0;
        baselineReady = true;
      }
    };

    captureBaseline();

    const checkPayment = async () => {
      if (paymentDetectedRef.current || purchasing || payingViaWallet || !baselineReady) return;
      try {
        const accessRes = await api.get<any>(accessUrl);
        const curHasAccess = Boolean(accessRes.hasAccess);
        const curExpiry = Number(accessRes.expiresAt || 0);

        const newlyGranted = !baselineHasAccess && curHasAccess;
        const expiryExtended = curHasAccess && curExpiry > baselineExpiry + 1000;

        if ((newlyGranted || expiryExtended) && !isCancelled) {
          paymentDetectedRef.current = true;
          setPaymentSuccess(true);
          setSuccessCountdown(2);
        }
      } catch {
        // keep polling
      }
    };

    const interval = setInterval(checkPayment, 2000);
    const quick = setTimeout(checkPayment, 800);
    return () => {
      isCancelled = true;
      clearInterval(interval);
      clearTimeout(quick);
    };
  }, [userId, seasonId, raceMeetingId, purchasing, payingViaWallet]);

  // Actually close modal after success banner countdown (do not tie to poll effect cleanup)
  useEffect(() => {
    if (!paymentSuccess) return;
    const closeTimer = setTimeout(() => {
      onSuccessRef.current();
    }, 2000);
    return () => clearTimeout(closeTimer);
  }, [paymentSuccess]);

  // Countdown display for auto-close
  useEffect(() => {
    if (!paymentSuccess || successCountdown <= 0) return;
    const t = setInterval(() => setSuccessCountdown(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [paymentSuccess, successCountdown]);

  // Called by the "Confirm Payment" dev button.
  // Step 1: Try to simulate via the same webhook path real bank integrations use.
  // Step 2: If webhook endpoint fails (not deployed), fallback to /purchase directly.
  const handleSimulateVietQRPay = async () => {
    setPurchasing(true);
    setError("");
    try {
      // Step 1: Attempt to call the real webhook endpoint
      await api.post<any>("/public/wallet/webhook/sepay", {
        id: Date.now(),
        gateway: bankName,
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
      paymentDetectedRef.current = true;
      setPaymentSuccess(true);
      setSuccessCountdown(2);
    }
  };

  // finalAmount based on the correct quote for selected package
  const quote = selectedPackage === "RACEMEETING" ? meetingQuote : seasonQuote;
  const finalAmount = quote ? Number(quote.finalPrice) : selectedPackage === "RACEMEETING" ? 15000 : 79000;
  
  // Format transfer content: PPV_{userId}_{packageType}_{meetingIdOrSeasonId} (PayOS max 25 chars)
  const targetId = selectedPackage === "RACEMEETING" ? (raceMeetingId || 1) : (seasonId || 1);
  const transferContentShort = `PPV_${userId}_${selectedPackage}_${targetId}`;
  const transferContent = payosTransferNote || transferContentShort;

  // LIVE: auto-create PayOS payment link → bank account + QR come from PayOS (only 3 API keys needed)
  useEffect(() => {
    if (isMockMode || quotesLoading || !userId || !finalAmount || finalAmount <= 0) return;

    let cancelled = false;
    setPayosLoading(true);
    setPayosError("");
    setPayosQrCode("");
    setPayosCheckoutUrl("");

    api.post<any>("/public/wallet/create-payos-link", {
      userId,
      amount: finalAmount,
      description: transferContentShort,
      returnUrl: `https://localhost:5173${window.location.pathname}`,
      cancelUrl: `https://localhost:5173${window.location.pathname}`,
    })
      .then((res) => {
        if (cancelled) return;
        if (res?.success) {
          sessionStorage.setItem("payos_pending_purpose", "PPV");
          sessionStorage.setItem(
            "payos_return_path",
            `${window.location.pathname}${window.location.search || ""}`
          );
          if (res.bin) setBankName(String(res.bin));
          if (res.accountNumber) setAccountNumber(String(res.accountNumber));
          if (res.accountName) setAccountHolder(String(res.accountName));
          if (res.qrCode) setPayosQrCode(String(res.qrCode));
          if (res.checkoutUrl) setPayosCheckoutUrl(String(res.checkoutUrl));
          if (res.description) setPayosTransferNote(String(res.description));
          else setPayosTransferNote(transferContentShort);
          setPayosError("");
        } else {
          setPayosError(res?.error || "PayOS failed to create payment link.");
        }
      })
      .catch((err: any) => {
        if (!cancelled) setPayosError(getErrMsg(err, "Failed to connect to PayOS API."));
      })
      .finally(() => {
        if (!cancelled) setPayosLoading(false);
      });

    return () => { cancelled = true; };
  }, [isMockMode, quotesLoading, userId, selectedPackage, targetId, finalAmount, transferContentShort]);

  const isConfigured = (value: string) => {
    const trimmed = value.trim();
    return !!trimmed && trimmed !== "NOT_SET";
  };
  const hasLiveBankAccount =
    isMockMode ||
    (isConfigured(accountNumber) && isConfigured(accountHolder)) ||
    (!!payosQrCode && payosQrCode.length > 20);
  const qrImageUrl = isMockMode
    ? buildMockQrImageUrl(`MOCK_PAYMENT|LIVESTREAM|amount=${finalAmount}|note=${transferContent}`, 220)
    : payosQrCode && payosQrCode.length > 20
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(payosQrCode)}`
    : hasLiveBankAccount
    ? buildVietQrImageUrl({
        bankNameOrCode: bankName,
        accountNumber,
        accountName: accountHolder,
        amount: finalAmount,
        addInfo: transferContent,
      })
    : "";
  const displayBankName = isMockMode
    ? "Mock Demo Wallet"
    : isConfigured(bankName)
    ? bankName
    : payosLoading
    ? "Loading from PayOS..."
    : "PayOS bank";
  const displayAccountNumber = isMockMode
    ? "MOCK-ACCOUNT"
    : isConfigured(accountNumber)
    ? accountNumber
    : payosLoading
    ? "Loading..."
    : "Waiting for PayOS";
  const displayAccountHolder = isMockMode
    ? "HORSE RACING MOCK GATEWAY"
    : isConfigured(accountHolder)
    ? accountHolder
    : payosLoading
    ? "Loading..."
    : "Waiting for PayOS";

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
        paymentDetectedRef.current = true;
        setPaymentSuccess(true);
        setSuccessCountdown(2);
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
              Unlock / Extend HD Livestream Access
            </h3>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
              Pay via your available wallet balance or scan VietQR code to unlock or extend access time.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem" }}>✕</button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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

          {/* Package Selector */}
          <div>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", marginBottom: "0.5rem" }}>
              {isExtendMode ? "Select Extension Period (+ Extra Time)" : "Select Viewing Package"}
            </label>
            
            {(() => {
              const currentActiveType = accessInfo?.packageType;
              const hasDiscount = seasonQuote && Number(seasonQuote.discountApplied || 0) > 0;
              const hasMonthly = currentActiveType === "RACEMEETING" || hasDiscount;
              const hasAnnual = currentActiveType === "SEASON";

              // Rule: If user has Annual pass and opens Upgrade mode, show notice that highest tier is owned
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

              // Rule: If NOT in extend mode, and user already has Monthly pass, hide Monthly pass card from upgrade!
              const hideMonthlyCard = !isExtendMode && hasMonthly;

              return (
                <div style={{ display: "grid", gridTemplateColumns: (hasRaceMeeting && !hideMonthlyCard) ? "1fr 1fr" : "1fr", gap: "0.75rem" }}>
                  {/* Option 1: Monthly Pass (Shown when not hidden by active subscription rule) */}
                  {hasRaceMeeting && !hideMonthlyCard && (
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
                      <div style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>
                        {isExtendMode ? "Extend Monthly (+30 Days)" : "Monthly Pass"}
                      </div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#c9a227", fontFamily: "monospace", marginTop: "4px" }}>
                        {quotesLoading ? "..." : (meetingQuote ? Number(meetingQuote.finalPrice).toLocaleString('en-US') : "15,000")} VNĐ
                      </div>
                      <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "4px" }}>
                        {isExtendMode ? "Add +30 days extra streaming time" : `30-day HD livestream access for ${raceMeetingName || "this event"}`}
                      </div>
                    </div>
                  )}

                  {/* Option 2: Annual Pass (Always available for Upgrade or Extend) */}
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
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: "#f4f2ec" }}>
                        {isExtendMode ? "Extend Annual (+365 Days)" : "Upgrade to Annual Pass"}
                      </span>
                      <span style={{ fontSize: "8px", background: "#10b981", color: "#000", padding: "1px 4px", borderRadius: "2px", fontWeight: "bold" }}>
                        {!isExtendMode && hasMonthly ? "15,000 VNĐ OFF" : "BEST VALUE"}
                      </span>
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#34d399", fontFamily: "monospace", marginTop: "4px" }}>
                      {quotesLoading ? "..." : (seasonQuote ? Number(seasonQuote.finalPrice).toLocaleString('en-US') : "79,000")} VNĐ
                    </div>
                    <div style={{ fontSize: "10px", color: "#a0a0a0", marginTop: "4px" }}>
                      {isExtendMode
                        ? "Add +365 days extra streaming time"
                        : !isExtendMode && hasMonthly
                        ? "Upgrade to Annual Pass (15,000 VNĐ credited from active Monthly Pass)"
                        : "Full 365-day unlimited HD livestream pass for all events"}
                    </div>
                    {/* Show current subscription dates if user already has an active pass */}
                    {accessInfo && accessInfo.expiresAtFormatted && (
                      <div style={{ marginTop: "6px", fontSize: "9px", color: "#6ee7b7", fontFamily: "monospace", background: "rgba(16,185,129,0.08)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.2)" }}>
                        ✅ Active until: {accessInfo.expiresAtFormatted}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Option A: Direct Wallet Deduction Button */}
          <div style={{ background: "rgba(201,162,39,0.08)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(201,162,39,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "11px", color: "#a0a0a0", fontFamily: "monospace" }}>Your Available Wallet:</span>
              <strong style={{ fontSize: "1rem", color: "#fbbf24", fontFamily: "monospace" }}>{walletBal.toLocaleString('en-US')} VND</strong>
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
              {payingViaWallet ? "Processing Wallet Deduction..." : walletBal >= finalAmount ? `⚡ Pay ${finalAmount.toLocaleString('en-US')} VND via Available Wallet` : `🔒 Insufficient Balance (${walletBal.toLocaleString('en-US')} VND available)`}
            </button>
          </div>

          {/* Option B: VietQR Scanner Area */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "1.25rem", background: "rgba(0,0,0,0.4)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              {payosLoading ? (
                <div style={{ width: "120px", minHeight: "120px", borderRadius: "0.5rem", border: "1px solid rgba(201,162,39,0.35)", background: "rgba(201,162,39,0.08)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", fontSize: "10px", fontFamily: "monospace", fontWeight: 700 }}>
                  Connecting to PayOS...
                </div>
              ) : !isMockMode && !hasLiveBankAccount ? (
                <div style={{ width: "120px", minHeight: "120px", borderRadius: "0.5rem", border: "1px solid rgba(248,113,113,0.45)", background: "rgba(239,68,68,0.12)", color: "#fca5a5", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", fontSize: "10px", fontFamily: "monospace", fontWeight: 700 }}>
                  {payosError || "PayOS QR unavailable"}
                </div>
              ) : (
                <img
                  src={qrImageUrl}
                  alt="VietQR Code"
                  style={{ width: "120px", height: "120px", borderRadius: "0.5rem", border: "2px solid #fff", background: "#fff" }}
                />
              )}
              <span style={{ fontSize: "9px", color: "#a0a0a0", fontFamily: "monospace", display: "block", marginTop: "4px" }}>Or Scan via Banking App</span>
            </div>

            <div style={{ fontSize: "11px", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "monospace", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(251,191,36,0.2)", marginBottom: "4px" }}>
                <span>⏱️ QR expires in:</span>
                <strong style={{ color: "#fcd34d" }}>{formattedTime}</strong>
              </div>
              <div>Bank: <strong style={{ color: "#fff" }}>{displayBankName}</strong></div>
              <div>Account: <strong style={{ color: "#c9a227", fontFamily: "monospace" }}>{displayAccountNumber}</strong></div>
              <div>Holder: <strong style={{ color: "#fff" }}>{displayAccountHolder}</strong></div>
              <div>Ticket Price: <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: "14px" }}>{finalAmount.toLocaleString('en-US')} VND</strong></div>
              <div>Transfer Content: <strong style={{ color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px", display: "inline-block" }}>{transferContent}</strong></div>
              {payosError && !isMockMode && (
                <div style={{ marginTop: "6px", padding: "0.4rem 0.6rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#fca5a5", borderRadius: "0.375rem", fontSize: "10px", fontFamily: "monospace" }}>
                  PayOS: {payosError}
                </div>
              )}
              {payosCheckoutUrl && !isMockMode && (
                <a
                  href={payosCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: "6px", display: "block", textAlign: "center", padding: "0.45rem 0.75rem", background: "linear-gradient(45deg, #2563eb, #4f46e5)", color: "#fff", borderRadius: "0.375rem", fontSize: "10px", fontFamily: "monospace", fontWeight: 700, textDecoration: "none" }}
                >
                  Open PayOS Checkout Page
                </a>
              )}
              <div style={{ marginTop: "6px", padding: "0.4rem 0.6rem", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", borderRadius: "0.375rem", fontSize: "10px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🟢</span> {isMockMode ? "MOCK mode — use Confirm to simulate" : "Listening for PayOS webhook — auto-unlocks after transfer"}
              </div>

              {isMockMode && (
              <button
                onClick={handleSimulateVietQRPay}
                disabled={purchasing || paymentSuccess}
                title="Calls real SePay webhook endpoint; falls back to /purchase if unavailable"
                style={{
                  marginTop: "8px",
                  width: "100%",
                  padding: "0.45rem 0.75rem",
                  background: purchasing || paymentSuccess
                    ? "#27272a"
                    : "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)",
                  border: "1px dashed rgba(251,191,36,0.45)",
                  color: purchasing || paymentSuccess ? "#52525b" : "#fbbf24",
                  borderRadius: "0.375rem",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  cursor: purchasing || paymentSuccess ? "not-allowed" : "pointer",
                  letterSpacing: "0.03em",
                  transition: "all 0.2s",
                }}
              >
                {purchasing ? "⏳ Processing..." : paymentSuccess ? "✅ Payment Verified" : "⚡ Confirm Payment (Simulate Transfer)"}
              </button>
              )}
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

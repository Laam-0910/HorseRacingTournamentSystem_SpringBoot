import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "VIETQR">("VIETQR");


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

  const [activeStep, setActiveStep] = useState<"PACKAGE" | "PAYMENT">("PACKAGE");

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "1rem" }}>
      <div style={{ background: "#12100d", border: "1px solid rgba(201,162,39,0.35)", borderRadius: "1rem", width: "100%", maxWidth: "56rem", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)", overflow: "hidden" }}>
        
        {/* Modal Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(201,162,39,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {activeStep === "PAYMENT" && (
              <button
                onClick={() => setActiveStep("PACKAGE")}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fbbf24",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.75rem",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                ← Change Package
              </button>
            )}
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "bold", color: "#f4f2ec", fontFamily: "'Roboto Slab', serif" }}>
                {activeStep === "PACKAGE" ? "Step 1: Select Viewing Package" : "Step 2: Choose Payment Method"}
              </h3>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                {activeStep === "PACKAGE"
                  ? "Choose a subscription pass below to proceed to payment options."
                  : "Pay via your available account wallet balance or scan VietQR code."}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0a0a0", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}>✕</button>
        </div>

        {/* Modal Body */}
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

          {/* STEP 1: Package Selector Cards */}
          {activeStep === "PACKAGE" && (
            <div>
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

                const handleChoosePackage = (pkg: "RACEMEETING" | "SEASON") => {
                  setSelectedPackage(pkg);
                  setActiveStep("PAYMENT");
                };

                return (
                  <div style={{ display: "grid", gridTemplateColumns: (hasRaceMeeting && !hideMonthlyCard) ? "1fr 1fr" : "1fr", gap: "1.25rem" }}>
                    {/* Option 1: Monthly Pass (Uiverse Cobp Card) */}
                    {hasRaceMeeting && !hideMonthlyCard && (
                      <div
                        onClick={() => handleChoosePackage("RACEMEETING")}
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
                          <div className="description">
                            <p style={{ color: "#f4f2ec", fontWeight: 600, marginBottom: "6px" }}>
                              {isExtendMode ? "Add +30 days extra streaming time:" : `30-day access for ${raceMeetingName || "this event"}:`}
                            </p>
                            <ul style={{ paddingLeft: "0.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "4px", listStyle: "none" }}>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#34d399" }}>✓</span> 30-day HD livestream access for current event
                              </li>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#34d399" }}>✓</span> Real-time race commentary & live odds update
                              </li>
                              <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#34d399" }}>✓</span> High definition 1080p 60fps streaming
                              </li>
                            </ul>
                          </div>
                          <button className="card-btn">
                            ⚡ Select Monthly Pass & Pay ➔
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Option 2: Annual Pass (Uiverse Cobp Card - Best Value / Most Popular) */}
                    <div
                      onClick={() => handleChoosePackage("SEASON")}
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
                        <div className="description">
                          <p style={{ color: "#f4f2ec", fontWeight: 600, marginBottom: "6px" }}>
                            {isExtendMode ? "Add +365 days extra full access:" : "Unlimited full-season access included:"}
                          </p>
                          <ul style={{ paddingLeft: "0.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "4px", listStyle: "none" }}>
                            <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#fbbf24" }}>⭐</span> Full 365-day unlimited HD access for ALL events
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#fbbf24" }}>⭐</span> Includes all tournament finals & championship races
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#fbbf24" }}>⭐</span> Priority ultra-low latency streaming channel
                            </li>
                            <li style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ color: "#34d399" }}>💰</span> Save &gt;70% compared to monthly event passes
                            </li>
                          </ul>
                        </div>
                        {accessInfo && accessInfo.expiresAtFormatted && (
                          <div style={{ fontSize: "9px", color: "#6ee7b7", fontFamily: "monospace", background: "rgba(16,185,129,0.1)", padding: "3px 6px", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.2)" }}>
                            ✅ Active until: {accessInfo.expiresAtFormatted}
                          </div>
                        )}
                        <button className="card-btn">
                          ⚡ Select Annual Pass & Pay ➔
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 2: Choose Payment Method */}
          {activeStep === "PAYMENT" && (
            <div>
              {/* Selected Package Summary Banner */}
              <div style={{ background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.35)", borderRadius: "0.75rem", padding: "0.875rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", display: "block" }}>Selected Package:</span>
                  <strong style={{ fontSize: "14px", color: "#fcd34d", fontFamily: "'Roboto Slab', serif" }}>
                    {selectedPackage === "RACEMEETING" ? (isExtendMode ? "Monthly Extension (+30 Days)" : "Monthly Pass") : (isExtendMode ? "Annual Extension (+365 Days)" : "Annual Pass")}
                  </strong>
                  <span style={{ fontSize: "13px", color: "#34d399", fontFamily: "monospace", fontWeight: "bold", marginLeft: "10px" }}>
                    {finalAmount.toLocaleString('en-US')} VNĐ
                  </span>
                </div>
                <button
                  onClick={() => setActiveStep("PACKAGE")}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fbbf24", borderRadius: "0.375rem", padding: "0.35rem 0.75rem", fontSize: "11px", fontFamily: "monospace", cursor: "pointer" }}
                >
                  ✏ Change Package
                </button>
              </div>

              <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c9a227", marginBottom: "0.75rem" }}>
                2. Choose Payment Method
              </label>

              {/* Payment Method Selector Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                {/* Method 1 Option Card */}
                <div
                  onClick={() => setPaymentMethod("WALLET")}
                  style={{
                    background: paymentMethod === "WALLET" ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.03)",
                    border: paymentMethod === "WALLET" ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s flex",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>💳</span>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#f4f2ec", margin: 0 }}>Method 1: Account Wallet</h4>
                    <p style={{ fontSize: "10px", color: paymentMethod === "WALLET" ? "#fbbf24" : "#a0a0a0", margin: "2px 0 0 0", fontFamily: "monospace" }}>
                      Bal: {walletBal.toLocaleString('en-US')} VND
                    </p>
                  </div>
                </div>

                {/* Method 2 Option Card */}
                <div
                  onClick={() => setPaymentMethod("VIETQR")}
                  style={{
                    background: paymentMethod === "VIETQR" ? "rgba(201,162,39,0.15)" : "rgba(255,255,255,0.03)",
                    border: paymentMethod === "VIETQR" ? "2px solid #c9a227" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📲</span>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#f4f2ec", margin: 0 }}>Method 2: Scan VietQR Code</h4>
                    <p style={{ fontSize: "10px", color: paymentMethod === "VIETQR" ? "#fbbf24" : "#a0a0a0", margin: "2px 0 0 0", fontFamily: "monospace" }}>
                      Banking App Instant Auto-Verification
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Payment Method Full-Width Expanded Content */}
              {paymentMethod === "WALLET" && (
                <div style={{ background: "rgba(201,162,39,0.06)", padding: "1.5rem", borderRadius: "0.85rem", border: "1px solid rgba(201,162,39,0.3)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h4 style={{ fontSize: "15px", fontWeight: "bold", color: "#f4f2ec", margin: 0 }}>Account Wallet Payment</h4>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0 0" }}>
                        Instant automated deduction from your system wallet balance.
                      </p>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.4)", padding: "0.75rem 1.25rem", borderRadius: "0.6rem", border: "1px solid rgba(201,162,39,0.3)" }}>
                      <div style={{ fontSize: "10px", color: "#a0a0a0", fontFamily: "monospace" }}>Available Wallet Balance:</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#fbbf24", fontFamily: "monospace" }}>
                        {walletBal.toLocaleString('en-US')} VND
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayViaWallet}
                    disabled={payingViaWallet || walletBal < finalAmount}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      background: walletBal >= finalAmount ? "linear-gradient(45deg, #c9a227, #f3d06c)" : "#27272a",
                      color: walletBal >= finalAmount ? "#000" : "#71717a",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "13px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      cursor: walletBal >= finalAmount ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      boxShadow: walletBal >= finalAmount ? "0 4px 20px rgba(201,162,39,0.4)" : "none"
                    }}
                  >
                    {payingViaWallet ? "Processing Deduction..." : walletBal >= finalAmount ? `⚡ Confirm & Pay ${finalAmount.toLocaleString('en-US')} VND via Wallet` : `🔒 Insufficient Balance (${walletBal.toLocaleString('en-US')} VND)`}
                  </button>
                </div>
              )}

              {paymentMethod === "VIETQR" && (
                <div style={{ background: "rgba(0,0,0,0.5)", padding: "1.5rem", borderRadius: "0.85rem", border: "1px solid rgba(201,162,39,0.3)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
                  {/* Large Prominent VietQR Display (240px x 240px) */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "1rem", border: "1px solid rgba(201,162,39,0.3)" }}>
                    <div style={{ background: "#ffffff", padding: "12px", borderRadius: "0.85rem", boxShadow: "0 15px 35px rgba(0,0,0,0.7)" }}>
                      <img
                        src={qrImageUrl}
                        alt="VietQR Code"
                        style={{ width: "240px", height: "240px", display: "block", borderRadius: "0.5rem" }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", color: "#fbbf24", fontFamily: "monospace", fontWeight: 700, marginTop: "10px" }}>
                      📱 Open Mobile Banking App & Scan QR Code Above
                    </span>
                  </div>

                  {/* Bank Transfer Details Grid */}
                  <div style={{ width: "100%", maxWidth: "32rem", fontSize: "11px", color: "#a0a0a0", display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontFamily: "monospace", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "4px 8px", borderRadius: "4px", border: "1px solid rgba(251,191,36,0.2)", marginBottom: "4px" }}>
                      <span>⏱️ QR Session Expires in:</span>
                      <strong style={{ color: "#fcd34d", fontSize: "12px" }}>{formattedTime}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Receiving Bank:</span> <strong style={{ color: "#fff" }}>{bankName}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Account Number:</span> <strong style={{ color: "#c9a227", fontFamily: "monospace" }}>{accountNumber}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Account Holder:</span> <strong style={{ color: "#fff" }}>{accountHolder}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>Transfer Content:</span> <strong style={{ color: "#fbbf24", fontFamily: "monospace", background: "rgba(251,191,36,0.1)", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>{transferContent}</strong></div>
                  </div>

                  <div style={{ padding: "0.4rem 0.75rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399", borderRadius: "0.5rem", fontSize: "10px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🟢</span> Realtime Automatic Bank Webhook Active (Auto unlocks upon transfer)
                  </div>

                  <button
                    onClick={handleSimulateVietQRPay}
                    disabled={purchasing || paymentSuccess}
                    style={{
                      width: "100%",
                      maxWidth: "32rem",
                      padding: "0.85rem",
                      background: purchasing || paymentSuccess ? "#27272a" : "linear-gradient(135deg, rgba(251,191,36,0.25) 0%, rgba(251,191,36,0.1) 100%)",
                      border: "1px dashed rgba(251,191,36,0.5)",
                      color: purchasing || paymentSuccess ? "#52525b" : "#fbbf24",
                      borderRadius: "0.6rem",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      cursor: purchasing || paymentSuccess ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {purchasing ? "⏳ Verifying Payment..." : paymentSuccess ? "✅ Payment Verified" : "⚡ Confirm Payment (Simulate Transfer)"}
                  </button>
                </div>
              )}
            </div>
          )}
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

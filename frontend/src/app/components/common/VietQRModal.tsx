import { useState, useEffect, useRef } from "react";
import { api } from "../../../lib/api";

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
  amount: number;
  transferNote: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  gatewayMode?: "MOCK" | "LIVE";
  loading?: boolean;
  checkoutUrl?: string;
  qrCode?: string;
  payosError?: string;
  /** Used in LIVE mode to poll wallet until webhook credits the deposit */
  pollUserId?: number;
  /** Admin wallet uses /admin/wallet instead of /admin/users/{id}/wallet */
  pollAsAdmin?: boolean;
}

/**
 * Component VietQRModal - VietQR Banking Payment Gateway Modal.
 * Supports both MOCK (Simulated Virtual Money with instant test trigger) 
 * and LIVE (Real Bank Account Payment Gateway) modes.
 * 100% English UI for international standards.
 */
export default function VietQRModal({
  isOpen,
  onClose,
  onConfirmSuccess,
  amount,
  transferNote,
  accountName = "",
  accountNumber = "",
  bankName = "",
  gatewayMode = "MOCK",
  loading = false,
  checkoutUrl = "",
  qrCode = "",
  payosError = "",
  pollUserId,
  pollAsAdmin = false,
}: VietQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15-minute countdown timer (900s)
  const [liveStatus, setLiveStatus] = useState<"listening" | "detected">("listening");
  const detectedRef = useRef(false);
  const baselineBalanceRef = useRef<number | null>(null);
  const onConfirmSuccessRef = useRef(onConfirmSuccess);
  onConfirmSuccessRef.current = onConfirmSuccess;

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(900);
      setLiveStatus("listening");
      detectedRef.current = false;
      baselineBalanceRef.current = null;
      return;
    }

    // Countdown 15-minute QR code expiration
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen]);

  // LIVE mode: poll wallet until PayOS webhook credits matching deposit
  useEffect(() => {
    if (!isOpen || gatewayMode !== "LIVE" || !pollUserId) return;

    let cancelled = false;
    detectedRef.current = false;
    baselineBalanceRef.current = null;
    setLiveStatus("listening");

    const noteUpper = (transferNote || "").toUpperCase();
    const expectedAmount = Number(amount) || 0;

    const hasMatchingDeposit = (txs: any[], openedAt: number) => {
      if (!Array.isArray(txs)) return false;
      return txs.some((t) => {
        const desc = String(t?.description ?? "").toUpperCase();
        const type = String(t?.transactionType ?? "").toUpperCase();
        const amt = Number(t?.amount ?? 0);
        const createdRaw = t?.createdAt;
        const createdMs = createdRaw ? new Date(createdRaw).getTime() : 0;
        const isDeposit = type.includes("DEPOSIT") || type.includes("TOPUP") || desc.includes("WEBHOOK") || desc.includes("VIETQR");
        const noteOk = !noteUpper || desc.includes(noteUpper);
        const amountOk = expectedAmount <= 0 || Math.abs(amt - expectedAmount) < 1;
        const recentOk = !createdMs || createdMs >= openedAt - 60_000;
        return isDeposit && noteOk && amountOk && recentOk;
      });
    };

    const openedAt = Date.now();

    const tick = async () => {
      if (cancelled || detectedRef.current) return;
      try {
        const res = pollAsAdmin
          ? await api.get<any>("/admin/wallet")
          : await api.get<any>(`/admin/users/${pollUserId}/wallet`);

        const bal = Number(res?.walletBalance ?? 0);
        const txs = res?.transactions ?? [];

        if (baselineBalanceRef.current === null) {
          baselineBalanceRef.current = bal;
        }

        const balanceIncreased =
          baselineBalanceRef.current != null &&
          expectedAmount > 0 &&
          bal >= baselineBalanceRef.current + expectedAmount - 0.5;

        if (hasMatchingDeposit(txs, openedAt) || balanceIncreased) {
          detectedRef.current = true;
          setLiveStatus("detected");
          onConfirmSuccessRef.current();
        }
      } catch {
        // Keep listening; transient API errors should not stop polling
      }
    };

    tick();
    const interval = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOpen, gatewayMode, pollUserId, pollAsAdmin, amount, transferNote]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isMock = gatewayMode === "MOCK";
  const isNotSet = (v?: string) => !v || v.trim() === "" || v.trim().toUpperCase() === "NOT_SET";

  // In MOCK mode: always use demo fallback values
  // In LIVE mode: use values from PayOS API response (passed as props); fallback only if they are valid
  const displayBankName = isNotSet(bankName) ? (isMock ? "Vietcombank (VCB)" : "") : bankName!;
  const displayAccountNumber = isNotSet(accountNumber) ? (isMock ? "9999 8888 6868" : "") : accountNumber!;
  const displayAccountName = isNotSet(accountName) ? (isMock ? "HORSE RACING SYSTEM FUNDING" : "") : accountName!;

  // QR Code logic:
  // - LIVE mode: use qrCode string returned by PayOS API if available; otherwise show nothing (don't generate a broken one)
  // - MOCK mode: generate VietQR from demo account number
  const liveQrAvailable = !isMock && qrCode && qrCode.length > 20;
  const confirmDisabled = loading || !isMock || liveStatus === "detected";
  const qrCodeUrl = liveQrAvailable
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(qrCode!)}`
    : isMock
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(
        `00020101021238580010A000000727012800069704230110${(displayAccountNumber).replace(/\s+/g, '')}0208QRIBFTTA5303704540${amount}5802VN5929${displayAccountName}6007HANOI62190815${transferNote}6304`
      )}`
    : null; // LIVE but no QR yet — show loading/error state instead

  const handleCopyNote = () => {
    navigator.clipboard.writeText(transferNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151310] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 relative text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <span>🇻🇳 VietQR Payment Gateway</span>
            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${gatewayMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              {gatewayMode === "LIVE" ? "LIVE Real Money" : "MOCK Demo Mode"}
            </span>
          </div>
          <h3 className="text-xl font-bold font-serif text-amber-200">
            Scan QR Code to Top Up Wallet
          </h3>
          <p className="text-[11px] text-white/50 font-mono">
            Open Mobile Banking App or E-Wallet to scan QR code
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-gradient-to-b from-white/10 to-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center space-y-3 relative">
          <div className="bg-white p-3 rounded-xl shadow-xl">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="VietQR Payment Code"
                className="w-48 h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex flex-col items-center justify-center rounded-lg bg-gray-50">
                {loading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-xs text-gray-500 font-mono text-center px-2">Connecting to PayOS...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2">⚠️</span>
                    <span className="text-xs text-gray-500 font-mono text-center px-2">
                      PayOS QR not available.<br/>Use the checkout link below or check error message.
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Expiration Countdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <span>⏱️ Transaction expires in:</span>
            <span className="font-bold text-amber-300">{formattedTime}</span>
          </div>
        </div>

        {payosError && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3 text-xs font-mono text-rose-300 space-y-1">
            <span className="font-bold flex items-center gap-1 text-rose-400">⚠️ PayOS API Response:</span>
            <p className="text-[11px] text-white/80">{payosError}</p>
          </div>
        )}

        {/* Bank Transfer Details */}
        <div className="bg-black/50 border border-white/10 p-4 rounded-2xl space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Bank Name:</span>
            <span className="font-bold text-emerald-400">{displayBankName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Account Number:</span>
            <span className="font-bold text-white tracking-widest">{displayAccountNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Account Holder:</span>
            <span className="font-bold text-amber-300">{displayAccountName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Deposit Amount:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {Math.round(amount).toLocaleString("en-US")} VND
            </span>
          </div>

          {/* Transfer Syntax with Copy Button */}
          <div className="pt-1">
            <span className="text-white/50 block mb-1">Transfer Syntax / Note:</span>
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
              <span className="font-bold text-amber-300 text-xs tracking-wider">{transferNote}</span>
              <button
                onClick={handleCopyNote}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg transition"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Liveness Listener & Confirm / Cancel Buttons */}
        <div className="space-y-3 pt-1">
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl transition border border-blue-400/30 flex items-center justify-center gap-2 font-mono uppercase tracking-wider shadow-lg"
            >
              <span>🔗 Open PayOS Payment Checkout Page</span>
            </a>
          )}

          <div className={`flex items-center justify-between text-[11px] font-mono py-2 px-3 rounded-xl border ${
            liveStatus === "detected"
              ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${liveStatus === "detected" ? "bg-emerald-300" : "bg-emerald-400 animate-ping"}`} />
              <span>
                {gatewayMode === "LIVE"
                  ? liveStatus === "detected"
                    ? "Payment detected! Updating wallet..."
                    : "Listening for PayOS webhook / wallet credit..."
                  : "Review details & click Confirm Payment when done."}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition border border-rose-500/30 flex items-center justify-center gap-1 font-mono uppercase tracking-wider cursor-pointer"
            >
              <span>✕ Cancel</span>
            </button>
            <button
              onClick={onConfirmSuccess}
              disabled={confirmDisabled}
              className="py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1 font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {loading || liveStatus === "detected"
                  ? "Processing..."
                  : !isMock
                  ? "Waiting for PayOS"
                  : "✓ Confirm Payment"}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

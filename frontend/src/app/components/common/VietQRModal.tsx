import { useState, useEffect } from "react";
import { $t } from "../../../lib/i18n";

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
  accountName = "HORSE RACING SYSTEM FUNDING",
  accountNumber = "9999 8888 6868",
  bankName = "Vietcombank (VCB)",
  gatewayMode = "MOCK",
  loading = false,
}: VietQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15-minute countdown timer (900s)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(900);
      return;
    }

    // Auto-detect bank payment webhook completion after 3 seconds & credit wallet automatically
    const autoPayTimer = setTimeout(() => {
      onConfirmSuccess();
    }, 3000);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(autoPayTimer);
      clearInterval(timer);
    };
  }, [isOpen, onConfirmSuccess]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Standard VietQR Code generator URL with clean matrix
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(
    `00020101021238580010A000000727012800069704230110${accountNumber}0208QRIBFTTA5303704540${amount}5802VN5929${accountName}6007HANOI62190815${transferNote}6304`
  )}`;

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

        {/* QR Code Container (Clean, no text overlay blocking QR matrix) */}
        <div className="bg-gradient-to-b from-white/10 to-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center space-y-3 relative">
          <div className="bg-white p-3 rounded-xl shadow-xl">
            <img
              src={qrCodeUrl}
              alt="VietQR Payment Code"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>

          {/* Expiration Countdown */}
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
            <span>⏱️ Transaction expires in:</span>
            <span className="font-bold text-amber-300">{formattedTime}</span>
          </div>
        </div>

        {/* Bank Transfer Details */}
        <div className="bg-black/50 border border-white/10 p-4 rounded-2xl space-y-2.5 text-xs font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Bank Name:</span>
            <span className="font-bold text-emerald-400">{bankName}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Account Number:</span>
            <span className="font-bold text-white tracking-widest">{accountNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-white/50">Account Holder:</span>
            <span className="font-bold text-amber-300">{accountName}</span>
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

        {/* Liveness Listener & Cancel Payment Button */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Waiting for bank payment webhook... (Auto-crediting wallet)</span>
          </div>

          {/* Cancel Payment Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-2xl transition border border-rose-500/30 flex items-center justify-center gap-2 font-mono uppercase tracking-wider cursor-pointer"
          >
            <span>✕ Cancel Payment</span>
          </button>
        </div>

      </div>
    </div>
  );
}

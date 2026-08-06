import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../../lib/api";
import { formatDate } from "../../../utils/dateTimeHelper";
import { $t } from "../../../../lib/i18n";
import { showToast } from "../../../../lib/confirm";
import { Pagination } from "../../common/Pagination";
import VietQRModal from "../../common/VietQRModal";
import { useAuth } from "../../../../context/AuthContext";

interface UserWalletViewProps {
  user: any;
  roleLabel?: string;
  roleColor?: string;
}

/**
 * Component UserWalletView - Dedicated Wallet & Transaction History Dashboard View
 * for Horse Owner, Jockey, and other user roles.
 */
export default function UserWalletView({ user: propUser, roleLabel = "User", roleColor = "#fbbf24" }: UserWalletViewProps) {
  const { user: authUser, setUser } = useAuth();
  const user = authUser || propUser;

  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [gatewayMode, setGatewayMode] = useState<"MOCK" | "LIVE">("MOCK");
  const [minWithdrawal, setMinWithdrawal] = useState(50000);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);

  const [amountInput, setAmountInput] = useState("");
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchWalletData = async () => {
    if (!user?.id) return;
    try {
      const [walletRes, wrRes] = await Promise.all([
        api.get<any>(`/admin/users/${user.id}/wallet`),
        api.get<any[]>(`/public/wallet/withdrawal-requests/${user.id}`).catch(() => [])
      ]);
      setWalletData(walletRes);
      if (walletRes?.walletBalance !== undefined && user) {
        setUser({ ...user, walletBalance: Number(walletRes.walletBalance) });
      }
      setWithdrawalRequests(Array.isArray(wrRes) ? wrRes : []);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load wallet data."));
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchWalletData().finally(() => setLoading(false));
    const interval = setInterval(fetchWalletData, 5000);

    api.get<any[]>("/admin/configs").then(configs => {
      const modeConfig = configs.find(c => c.configKey === "PAYMENT_GATEWAY_MODE");
      if (modeConfig && modeConfig.configValue?.toUpperCase() === "LIVE") {
        setGatewayMode("LIVE");
      }
      const minWd = configs.find(c => c.configKey === "MIN_WITHDRAWAL_AMOUNT");
      if (minWd && !isNaN(Number(minWd.configValue))) {
        setMinWithdrawal(Number(minWd.configValue));
      }
    }).catch(() => {});

    return () => clearInterval(interval);
  }, [user?.id]);

  const handleDepositPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amountInput);
    if (!val || val <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setShowDepositModal(false);
    setShowQrModal(true);
  };

  const handleConfirmDeposit = async () => {
    const val = Number(amountInput);
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post<any>("/public/wallet/deposit", { userId: user.id, amount: val });
      if (res.success) {
        const msg = `Successfully deposited ${Math.round(val).toLocaleString('en-US')} VND into your wallet via VietQR! A deposit notification has been sent to your account notifications.`;
        setSuccessMsg(msg);
        showToast(msg, "success");
        setShowQrModal(false);
        setAmountInput("");
        if (user) user.walletBalance = res.newBalance;
        fetchWalletData();
      } else {
        const msg = res.error || "Deposit failed.";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: any) {
      const msg = getErrMsg(err, "Failed to deposit funds.");
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amountInput);
    if (!val || val <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (val < minWithdrawal) {
      setError(`Minimum withdrawal amount is ${minWithdrawal.toLocaleString('en-US')} VND.`);
      return;
    }
    if (val > walletBalance) {
      setError(`Insufficient funds. Your available balance is ${walletBalance.toLocaleString('en-US')} VND.`);
      return;
    }
    if (!accountNumber.trim() || !accountHolder.trim()) {
      setError("Bank Account Number and Account Holder Name are required for cash-out payout.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post<any>("/public/wallet/withdraw", {
        userId: user.id,
        amount: val,
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        notes: notes.trim()
      });
      if (res.success) {
        setSuccessMsg(res.message || `Withdrawal of ${val.toLocaleString('en-US')} VND submitted successfully.`);
        setShowWithdrawModal(false);
        setAmountInput("");
        setAccountNumber("");
        setAccountHolder("");
        setNotes("");
        fetchWalletData();
      } else {
        setError(res.error || "Withdrawal request failed.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to withdraw cash."));
    } finally {
      setSubmitting(false);
    }
  };

  const walletBalance = walletData?.walletBalance !== undefined && walletData?.walletBalance !== null
    ? Number(walletData.walletBalance)
    : (user?.walletBalance !== undefined && user?.walletBalance !== null ? Number(user.walletBalance) : 0);

  const transactions = walletData?.transactions || [];
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + pageSize);

  const getTxBadge = (type: string) => {
    switch (type) {
      case "TICKET_FEE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">TICKET FEE</span>;
      case "TICKET_REFUND":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">TICKET REFUND</span>;
      case "JOCKEY_MOUNT_FEE":
      case "JOCKEY_HIRE_FEE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">MOUNT FEE</span>;
      case "JOCKEY_HIRE_INCOME":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HIRE INCOME</span>;
      case "RACE_PRIZE_MONEY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PRIZE MONEY</span>;
      case "SELF_DEPOSIT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">DEPOSIT</span>;
      case "WITHDRAWAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">WITHDRAWAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Overview Banner */}
      <div
        className="rounded-2xl p-6 pt-10 pb-8 relative overflow-visible flex flex-wrap items-center justify-between gap-4 border"
        style={{
          background: "linear-gradient(135deg, rgba(20,24,38,0.7), rgba(11,13,20,0.8))",
          borderColor: `${roleColor}40`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: roleColor, background: `${roleColor}15`, border: `1px solid ${roleColor}30` }}>
            💳 Personal Wallet & Capital
          </span>
          <h2 className="text-2xl font-bold text-white font-serif mt-2">
            {$t("Wallet Management", (localStorage.getItem('app-lang') || 'en'))}
          </h2>
          <p className="text-xs text-white/60 mt-1 font-mono">
            Welcome, {user?.username ?? user?.fullName ?? roleLabel}. Deposit funds, cash out withdrawals, and view your full transaction history.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-5 font-mono">
          {/* Uiverse Interactive 3D Pocket Wallet */}
          <div className="uiverse-wallet">
            <div className="uiverse-wallet-back"></div>

            {/* Card 1: Gold VIP Member Card */}
            <div className="card stripe">
              <div className="card-inner">
                <div className="card-top">
                  <span>Horse Racing</span>
                  <div className="chip"></div>
                </div>
                <div className="card-bottom">
                  <div className="card-info">
                    <span className="label">Member</span>
                    <span className="value">{(user?.username || user?.fullName || roleLabel).toUpperCase()}</span>
                  </div>
                  <div className="card-number-wrapper">
                    <span className="hidden-stars">**** {user?.id ? String(user.id).padStart(4, '0') : '0001'}</span>
                    <span className="card-number">8810 4242 {user?.id ? String(user.id).padStart(4, '0') : '0001'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Tournament Pass Card */}
            <div className="card wise">
              <div className="card-inner">
                <div className="card-top">
                  <span>{roleLabel} VIP</span>
                  <div className="chip"></div>
                </div>
                <div className="card-bottom">
                  <div className="card-info">
                    <span className="label">Status</span>
                    <span className="value">ACTIVE ACCESS</span>
                  </div>
                  <div className="card-number-wrapper">
                    <span className="hidden-stars">**** 9910</span>
                    <span className="card-number">9012 4432 9910</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Personal Wallet Info Card */}
            <div className="card paypal">
              <div className="card-inner">
                <div className="card-top">
                  <span>Pay<b style={{ color: "#c9a227" }}>Wallet</b></span>
                  <div className="chip"></div>
                </div>
                <div className="card-bottom">
                  <div className="card-info">
                    <span className="label">Account ID</span>
                    <span className="value">{user?.id ? `HR-${String(user.id).padStart(5, '0')}` : 'HR-00001'}</span>
                  </div>
                  <div className="card-number-wrapper">
                    <span className="hidden-stars">**** 0094</span>
                    <span className="card-number">3312 0045 0094</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leather Pocket Cover with Live Balance Display */}
            <div className="pocket">
              <svg className="pocket-svg" viewBox="0 0 280 160" fill="none">
                <path
                  d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                  fill="#1e1912"
                ></path>
                <path
                  d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                  stroke="#c9a227"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                ></path>
              </svg>
              <div className="pocket-content">
                <div style={{ position: "relative", height: "24px", width: "100%" }}>
                  <div className="balance-stars">****** VND</div>
                  <div className="balance-real">{walletBalance.toLocaleString('en-US')} VND</div>
                </div>
                <div style={{ color: "#c9a227", fontSize: "11px", fontWeight: "600", marginTop: "2px" }}>
                  Available Wallet Balance
                </div>
                <div className="eye-icon-wrapper">
                  <svg
                    className="eye-icon eye-slash"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="3" y1="3" x2="21" y2="21"></line>
                  </svg>
                  <svg
                    className="eye-icon eye-open"
                    style={{ opacity: 0 }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => { setAmountInput(""); setError(""); setShowDepositModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span> Deposit Funds
            </button>

            <button
              onClick={() => { setAmountInput(""); setError(""); setShowWithdrawModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>💸</span> Withdraw Cash
            </button>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121110] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <span>💳 Deposit Funds via VietQR Gateway</span>
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-white/50 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleDepositPrompt} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 block mb-1.5 uppercase font-bold">Deposit Amount (VND)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white/60 space-y-1">
                <div className="flex justify-between"><span>Current Balance:</span> <span className="text-white font-bold">{walletBalance.toLocaleString('en-US')} VND</span></div>
                <div className="flex justify-between"><span>Estimated Balance:</span> <span className="text-emerald-400 font-bold">{(walletBalance + (Number(amountInput) || 0)).toLocaleString('en-US')} VND</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  📱 Generate VietQR Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121110] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <span>💸 Cash-Out Withdrawal Payout</span>
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-white/50 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs text-white/60 block mb-1 uppercase font-bold">Withdrawal Amount (VND)</label>
                <input
                  type="number"
                  step="1"
                  min={minWithdrawal}
                  max={walletBalance}
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={`Min: ${minWithdrawal.toLocaleString('en-US')} VND`}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
                <p className="text-[10px] text-amber-400/80 font-mono mt-1">⚠ Minimum withdrawal: {minWithdrawal.toLocaleString('en-US')} VND &nbsp;|&nbsp; Available: {walletBalance.toLocaleString('en-US')} VND</p>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1 uppercase font-bold">Receiving Bank / E-Wallet</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                >
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="MB Bank">MB Bank</option>
                  <option value="ACB">ACB</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="Sacombank">Sacombank</option>
                  <option value="MoMo E-Wallet">MoMo E-Wallet</option>
                  <option value="ZaloPay">ZaloPay</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1 uppercase font-bold">Bank Account Number / ID *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 10123456789"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1 uppercase font-bold">Account Holder Full Name *</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. NGUYEN VAN A"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-rose-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 block mb-1 uppercase font-bold">Payout Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Cash out race earnings"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-[10px] text-white/60 space-y-0.5">
                <div className="flex justify-between"><span>Available Balance:</span> <span className="text-white font-bold">{walletBalance.toLocaleString('en-US')} VND</span></div>
                <div className="flex justify-between"><span>Remaining Balance:</span> <span className="text-amber-400 font-bold">{Math.max(0, walletBalance - (Number(amountInput) || 0)).toLocaleString('en-US')} VND</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Number(amountInput) > walletBalance}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VietQR Modal for Deposit */}
      <VietQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onConfirmSuccess={handleConfirmDeposit}
        amount={Number(amountInput) || 0}
        transferNote={`TOPUP ${user?.username ?? 'USER'}`}
        accountName="HORSE RACING SYSTEM FUNDING"
        accountNumber="9999 8888 6868"
        bankName="Vietcombank (VCB)"
        gatewayMode={gatewayMode}
        loading={submitting}
      />

      {/* Withdrawal Requests History */}
      {withdrawalRequests.length > 0 && (
        <div className="bg-white/[0.015] border border-amber-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <span>💸 Withdrawal Requests</span>
            </h3>
            <span className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {withdrawalRequests.filter(r => r.status === 'PENDING').length} Pending
            </span>
          </div>

          {gatewayMode === 'MOCK' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[10px] font-mono text-emerald-300">
              ⚡ Instant Auto-Disbursement Mode Active (MOCK Gateway): Withdrawals are transferred to your bank account immediately upon request.
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[10px] font-mono text-amber-300/80">
              ℹ️ Live Banking Gateway Active: Withdrawal requests are reviewed & processed by admin within 1-3 business days.
            </div>
          )}

          <div className="border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-black/60 text-white/50 border-b border-white/10 uppercase text-[10px]">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Amount (VND)</th>
                  <th className="px-3 py-2">Bank / Account</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawalRequests.map((wr: any) => (
                  <tr key={wr.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-3 py-2 text-white/40">#WR-{wr.id}</td>
                    <td className="px-3 py-2 font-bold text-amber-300">{Number(wr.amount).toLocaleString('en-US')} VND</td>
                    <td className="px-3 py-2 text-white/70">
                      {wr.bankName}<br/>
                      <span className="text-white/40 text-[10px]">{wr.accountNumber} · {wr.accountHolder}</span>
                    </td>
                    <td className="px-3 py-2">
                      {wr.status === 'PENDING' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ PENDING</span>}
                      {wr.status === 'PROCESSED' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ PROCESSED</span>}
                      {wr.status === 'REJECTED' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">❌ REJECTED</span>}
                    </td>
                    <td className="px-3 py-2 text-white/40 text-[10px]">{formatDate(wr.createdAt)}</td>
                    <td className="px-3 py-2 text-white/70 text-[10px] max-w-xs break-words" title={wr.processedNote || ''}>{wr.processedNote || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction History Log Table */}
      <div className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
            <span>📜 Transaction History Log</span>
          </h3>
          <span className="text-xs font-mono text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {transactions.length} Transactions
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-white/40 font-mono py-8 text-center">Loading transaction history...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-black/20 border border-white/5 rounded-xl text-white/40 text-xs font-mono">
            No wallet transactions recorded for your account yet.
          </div>
        ) : (
          <>
            <div className="border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-black/60 text-white/50 border-b border-white/10 uppercase text-[10px]">
                    <th className="px-4 py-3">TX ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount (VND)</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTransactions.map((tx: any) => {
                    const amt = Number(tx.amount || 0);
                    const isPositive = amt > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 text-white/40">#TX-{tx.id}</td>
                        <td className="px-4 py-3">{getTxBadge(tx.transactionType)}</td>
                        <td className={`px-4 py-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${amt.toLocaleString('en-US')}` : `${amt.toLocaleString('en-US')}`}
                        </td>
                        <td className="px-4 py-3 text-white/80">
                          <div className="max-w-[280px] whitespace-normal break-words leading-snug" title={tx.description}>{tx.description}</div>
                        </td>
                        <td className="px-4 py-3 text-white/40">{formatDate(tx.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={validPage}
              totalItems={transactions.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
}

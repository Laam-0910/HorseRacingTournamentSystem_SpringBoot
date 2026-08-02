import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../../lib/api";
import { formatDate } from "../../../utils/dateTimeHelper";
import { $t } from "../../../../lib/i18n";
import { Pagination } from "../../common/Pagination";

interface UserWalletViewProps {
  user: any;
  roleLabel?: string;
  roleColor?: string;
}

/**
 * Component UserWalletView - Dedicated Wallet & Transaction History Dashboard View
 * for Horse Owner, Jockey, and other user roles.
 */
export default function UserWalletView({ user, roleLabel = "User", roleColor = "#fbbf24" }: UserWalletViewProps) {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchWalletData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get<any>(`/admin/users/${user.id}/wallet`);
      setWalletData(res);
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load wallet data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user?.id]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amountInput);
    if (!val || val <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post<any>("/public/wallet/deposit", { userId: user.id, amount: val });
      if (res.success) {
        setSuccessMsg(`Successfully deposited $${val.toLocaleString()} into your wallet!`);
        setShowDepositModal(false);
        setAmountInput("");
        if (user) user.walletBalance = res.newBalance;
        fetchWalletData();
      } else {
        setError(res.error || "Deposit failed.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to deposit funds."));
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
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await api.post<any>("/public/wallet/withdraw", { userId: user.id, amount: val });
      if (res.success) {
        setSuccessMsg(`Successfully withdrawn $${val.toLocaleString()} from your wallet!`);
        setShowWithdrawModal(false);
        setAmountInput("");
        if (user) user.walletBalance = res.newBalance;
        fetchWalletData();
      } else {
        setError(res.error || "Withdrawal failed.");
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to withdraw cash."));
    } finally {
      setSubmitting(false);
    }
  };

  const walletBalance = user?.walletBalance !== undefined && user?.walletBalance !== null
    ? Number(user.walletBalance)
    : Number(walletData?.walletBalance || 0);

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
        className="rounded-2xl p-6 relative overflow-hidden flex flex-wrap items-center justify-between gap-4 border"
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

        <div className="flex flex-col items-end gap-3 font-mono">
          <div className="bg-black/40 border border-white/10 p-5 rounded-2xl min-w-[16rem] text-right">
            <span className="text-xs text-white/50 block uppercase">Current Available Balance</span>
            <div className="text-3xl font-extrabold mt-1" style={{ color: roleColor }}>
              ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block mt-1">
              ✓ Account Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAmountInput(""); setError(""); setShowDepositModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Deposit Funds
            </button>

            <button
              onClick={() => { setAmountInput(""); setError(""); setShowWithdrawModal(true); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <span>💸</span> Withdraw Cash
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-mono">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121110] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <span>💳 Deposit Funds to Wallet</span>
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-white/50 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 block mb-1.5 uppercase font-bold">Deposit Amount ($USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white/60 space-y-1">
                <div className="flex justify-between"><span>Current Balance:</span> <span className="text-white font-bold">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span>Estimated Balance:</span> <span className="text-emerald-400 font-bold">${(walletBalance + (Number(amountInput) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
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
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121110] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5 font-mono shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
                <span>💸 Cash-Out Withdrawal</span>
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-white/50 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 block mb-1.5 uppercase font-bold">Withdrawal Amount ($USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={walletBalance}
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={`Max: $${walletBalance.toLocaleString()}`}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white/60 space-y-1">
                <div className="flex justify-between"><span>Available Balance:</span> <span className="text-white font-bold">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span>Remaining Balance:</span> <span className="text-amber-400 font-bold">${Math.max(0, walletBalance - (Number(amountInput) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || Number(amountInput) > walletBalance}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
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
                    <th className="px-4 py-3">Amount ($USD)</th>
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
                        <td className="px-4 py-3 text-white/80 max-w-sm truncate">{tx.description}</td>
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

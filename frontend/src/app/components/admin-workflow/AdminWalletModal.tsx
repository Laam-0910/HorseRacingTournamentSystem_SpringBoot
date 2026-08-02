import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { formatDate } from "../../utils/dateTimeHelper";
import { $t } from "../../../lib/i18n";
import { Pagination } from "../common/Pagination";

interface AdminWalletModalProps {
  onClose?: () => void;
  onBalanceUpdated?: () => void;
  isPage?: boolean;
}

/**
 * Component AdminWalletModal - Admin Wallet & Tournament Funding Source Management.
 * Allows Admin to view wallet balance, perform Top-Up, Withdraw funds from the system with notes/reasons,
 * and view complete transaction history logs.
 */
export default function AdminWalletModal({ onClose, onBalanceUpdated, isPage = false }: AdminWalletModalProps) {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Input states for Top-Up and Withdrawal
  const [activeAction, setActiveAction] = useState<"none" | "topup" | "withdraw">("none");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<any>("/admin/wallet");
      setWalletData(res);
      if (onBalanceUpdated) onBalanceUpdated();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load Admin wallet info."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<any>("/admin/wallet/topup", { amount: val });
      setSuccess(res.message || "Top-up successful.");
      setAmount("");
      setActiveAction("none");
      fetchWallet();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to top up Admin wallet."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<any>("/admin/wallet/withdraw", { amount: val, notes });
      setSuccess(res.message || "Withdrawal successful.");
      setAmount("");
      setNotes("");
      setActiveAction("none");
      fetchWallet();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to withdraw from Admin wallet."));
    } finally {
      setSubmitting(false);
    }
  };

  const getTxBadge = (type: string) => {
    switch (type) {
      case "ADMIN_TOPUP":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ADMIN TOP-UP</span>;
      case "ADMIN_WITHDRAWAL":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">WITHDRAWAL</span>;
      case "TICKET_INCOME":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">TICKET INCOME</span>;
      case "TICKET_INCOME_SETTLEMENT":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">TICKET SETTLEMENT</span>;
      case "MEETING_BUDGET_ALLOCATION":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">BUDGET ALLOCATION</span>;
      case "MEETING_BUDGET_REFUND":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">BUDGET REFUND</span>;
      case "TICKET_REFUND_DEDUCTION":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">OWNER REFUND</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">{type}</span>;
    }
  };

  const contentNode = (
    <div className={`bg-[#181613] border border-amber-500/40 rounded-2xl w-full ${isPage ? 'p-6 shadow-xl space-y-6' : 'max-w-3xl my-auto p-6 shadow-2xl space-y-6 relative'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Admin Wallet & Season Capital</span>
          <h3 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <span>🏦 Admin Wallet & Tournament Funding</span>
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >✕</button>
        )}
      </div>

        {/* Banners */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-mono">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-mono">
            ✓ {success}
          </div>
        )}

        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-amber-950/40 via-black to-emerald-950/40 border border-amber-500/20 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-white/50 block">Available Admin Wallet Balance:</span>
            <div className="text-3xl font-extrabold text-amber-400 font-mono mt-1">
              ${Number(walletData?.walletBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-white/40 font-mono mt-1">
              * Funding source for Race Meeting total budget allocations (`totalBudget`) and settled ticket revenue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveAction("topup"); setAmount(""); setError(""); setSuccess(""); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              <span>💳</span> Top Up Admin Wallet
            </button>
            <button
              onClick={() => { setActiveAction("withdraw"); setAmount(""); setNotes(""); setError(""); setSuccess(""); }}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <span>💸</span> Withdraw Funds
            </button>
          </div>
        </div>

        {/* Top Up Form */}
        {activeAction === "topup" && (
          <form onSubmit={handleTopUpSubmit} className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 font-mono">💳 Top Up Admin Wallet Funds</h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to top up ($USD)..."
                className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl hover:bg-emerald-400 transition"
              >
                {submitting ? "Processing..." : "Confirm Top Up"}
              </button>
              <button
                type="button"
                onClick={() => setActiveAction("none")}
                className="px-3 py-2 bg-white/10 text-white/70 text-xs rounded-xl hover:bg-white/15"
              >Cancel</button>
            </div>
          </form>
        )}

        {/* Withdrawal Form */}
        {activeAction === "withdraw" && (
          <form onSubmit={handleWithdrawSubmit} className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-rose-400 font-mono">💸 Withdraw Funds from System (Logged in Audit History)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to withdraw ($USD)..."
                className="px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
              />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Withdrawal reason / Notes (e.g. Bank transfer)..."
                className="px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveAction("none")}
                className="px-3 py-1.5 bg-white/10 text-white/70 text-xs rounded-xl hover:bg-white/15"
              >Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-400 transition"
              >
                {submitting ? "Withdrawing..." : "Confirm Withdrawal"}
              </button>
            </div>
          </form>
        )}

        {/* Transaction History Log Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
              <span>📜 Admin Wallet Transaction Log</span>
            </h4>
            <span className="text-xs font-mono text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {walletData?.transactions?.length || 0} Records
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-white/40 font-mono py-4 text-center">Loading transaction log...</p>
          ) : walletData?.transactions?.length === 0 ? (
            <div className="text-center py-8 bg-black/20 border border-white/5 rounded-xl text-white/40 text-xs font-mono">
              No transaction history recorded yet.
            </div>
          ) : (() => {
            const txs = walletData?.transactions || [];
            const totalItems = txs.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
            const validPage = Math.min(Math.max(1, page), totalPages);
            const startIndex = (validPage - 1) * pageSize;
            const paginatedTxs = txs.slice(startIndex, startIndex + pageSize);

            return (
              <div className="space-y-2">
                <div className="border border-white/10 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-black/60 text-white/50 border-b border-white/10 uppercase text-[10px]">
                        <th className="px-4 py-3">TX ID</th>
                        <th className="px-4 py-3">Transaction Type</th>
                        <th className="px-4 py-3">Amount ($USD)</th>
                        <th className="px-4 py-3">Description / Notes</th>
                        <th className="px-4 py-3">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedTxs.map((tx: any) => {
                        const amt = Number(tx.amount || 0);
                        const isPositive = amt > 0;
                        return (
                          <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-white/40">#TX-{tx.id}</td>
                            <td className="px-4 py-3">{getTxBadge(tx.transactionType)}</td>
                            <td className={`px-4 py-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? `+${amt.toLocaleString('en-US')}` : `${amt.toLocaleString('en-US')}`}
                            </td>
                            <td className="px-4 py-3 text-white/80 max-w-xs truncate">{tx.description}</td>
                            <td className="px-4 py-3 text-white/40">{formatDate(tx.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={validPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </div>
            );
          })()}
        </div>

        {onClose && (
          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
            >Close Modal</button>
          </div>
        )}
      </div>
    );

  if (isPage) {
    return <div className="max-w-4xl mx-auto py-2 animate-fade-in">{contentNode}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      {contentNode}
    </div>
  );
}

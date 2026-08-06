import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { formatDate } from "../../utils/dateTimeHelper";
import { $t } from "../../../lib/i18n";
import { Pagination } from "../common/Pagination";
import VietQRModal from "../common/VietQRModal";
import { useAuth } from "../../../context/AuthContext";
import { confirm } from "../../../lib/confirm";

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
  const { user, setUser } = useAuth();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Input states for Top-Up and Withdrawal
  const [activeAction, setActiveAction] = useState<"none" | "topup" | "withdraw">("none");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State cho VietQR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [gatewayMode, setGatewayMode] = useState<"MOCK" | "LIVE">("MOCK");

  // Withdrawal Requests Management
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [wrFilter, setWrFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [processingWrId, setProcessingWrId] = useState<number | null>(null);
  const [rejectNoteMap, setRejectNoteMap] = useState<Record<number, string>>({});

  const fetchWallet = async () => {
    setLoading(true);
    setError("");
    try {
      const [walletRes, wrRes] = await Promise.all([
        api.get<any>("/admin/wallet"),
        api.get<any[]>(`/admin/withdrawal-requests?status=${wrFilter}`).catch(() => [])
      ]);
      setWalletData(walletRes);
      if (walletRes?.walletBalance !== undefined && user) {
        setUser({ ...user, walletBalance: Number(walletRes.walletBalance) });
      }
      setWithdrawalRequests(Array.isArray(wrRes) ? wrRes : []);
      if (onBalanceUpdated) onBalanceUpdated();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load Admin wallet info."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    api.get<any[]>("/admin/configs").then(configs => {
      const modeConfig = configs.find(c => c.configKey === "PAYMENT_GATEWAY_MODE");
      if (modeConfig && modeConfig.configValue?.toUpperCase() === "LIVE") {
        setGatewayMode("LIVE");
      }
    }).catch(() => {});
  }, []);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10000) {
      setError("Top-up amount must be at least 10,000 VND.");
      return;
    }
    setShowQrModal(true);
  };

  const handleConfirmTopUp = async () => {
    const val = parseFloat(amount);
    setSubmitting(true);
    try {
      const res = await api.post<any>("/admin/wallet/topup", { amount: val });
      setSuccess(res.message || "Top-up completed successfully via VietQR Gateway.");
      setAmount("");
      setShowQrModal(false);
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
    if (!accountNumber.trim() || !accountHolder.trim()) {
      setError("Bank Account Number and Account Holder Name are required for cash-out payout.");
      return;
    }

    const fullNotes = `Bank: ${bankName} | Acc: ${accountNumber.trim()} | Holder: ${accountHolder.trim().toUpperCase()}${notes.trim() ? ' | Note: ' + notes.trim() : ''}`;

    setSubmitting(true);
    try {
      const res = await api.post<any>("/admin/wallet/withdraw", { amount: val, notes: fullNotes });
      setSuccess(res.message || "Cash-out withdrawal payout logged and processed successfully.");
      setAmount("");
      setNotes("");
      setAccountNumber("");
      setAccountHolder("");
      setActiveAction("none");
      fetchWallet();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to process withdrawal payout."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (wrId: number) => {
    if (!await confirm(`Confirm: Have you already transferred the funds to the user's bank account? Clicking OK will deduct the amount from their wallet.`)) return;
    setProcessingWrId(wrId);
    setError(""); setSuccess("");
    try {
      const res = await api.post<any>(`/admin/withdrawal-requests/${wrId}/process`, { note: "Processed and transferred by admin." });
      setSuccess(res.message || `Withdrawal request #${wrId} processed successfully.`);
      fetchWallet();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to process withdrawal request."));
    } finally {
      setProcessingWrId(null);
    }
  };

  const handleRejectWithdrawal = async (wrId: number) => {
    const note = (rejectNoteMap[wrId] || "").trim() || "Rejected by admin.";
    if (!await confirm(`Reject withdrawal request #${wrId}? Reason: "${note}". User wallet will NOT be deducted.`)) return;
    setProcessingWrId(wrId);
    setError(""); setSuccess("");
    try {
      const res = await api.post<any>(`/admin/withdrawal-requests/${wrId}/reject`, { note });
      setSuccess(res.message || `Withdrawal request #${wrId} rejected.`);
      fetchWallet();
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to reject withdrawal request."));
    } finally {
      setProcessingWrId(null);
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
              {Number(walletData?.walletBalance || 0).toLocaleString('en-US')} <span className="text-xl font-bold">VND</span>
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

        {/* System Treasury Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-[10px] text-amber-400/80 uppercase font-bold block">🏦 Available Admin Wallet Balance</span>
            <span className="text-base font-bold text-amber-300 mt-1 block">
              {Number(walletData?.walletBalance || 0).toLocaleString('en-US')} VND
            </span>
          </div>
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <span className="text-[10px] text-blue-400/80 uppercase font-bold block">🏟️ Active Meetings Allocated Budget</span>
            <span className="text-base font-bold text-blue-300 mt-1 block">
              {Number(walletData?.allocatedBudgetSum || 0).toLocaleString('en-US')} VND
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-[10px] text-emerald-400/80 uppercase font-bold block">💎 Total System Treasury (Capital)</span>
            <span className="text-base font-bold text-emerald-300 mt-1 block">
              {Number(walletData?.totalCapital || (Number(walletData?.walletBalance || 0) + Number(walletData?.allocatedBudgetSum || 0))).toLocaleString('en-US')} VND
            </span>
          </div>
        </div>

        {/* Top Up Form */}
        {activeAction === "topup" && (
          <form onSubmit={handleTopUpSubmit} className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-emerald-400 font-mono flex items-center justify-between">
              <span>💳 Top Up Admin Wallet via VietQR Gateway</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${gatewayMode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                Gateway Mode: {gatewayMode}
              </span>
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="10000"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter top-up amount (VND)..."
                className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold rounded-xl hover:brightness-110 transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <span>📱</span> Generate VietQR Code
              </button>
              <button
                type="button"
                onClick={() => setActiveAction("none")}
                className="px-3 py-2 bg-white/10 text-white/70 text-xs rounded-xl hover:bg-white/15"
              >Cancel</button>
            </div>
          </form>
        )}

        {/* Withdrawal Form with Real Bank Account Details */}
        {activeAction === "withdraw" && (
          <form onSubmit={handleWithdrawSubmit} className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-rose-400 font-mono flex items-center gap-2">
              <span>💸 Cash-Out Withdrawal Payout to Bank Account / E-Wallet</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-white/50 block mb-1">Withdrawal Amount (VND)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw..."
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 block mb-1">Receiving Bank / Gateway</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
                >
                  <option value="Vietcombank">Vietcombank (VCB)</option>
                  <option value="Techcombank">Techcombank (TCB)</option>
                  <option value="MB Bank">MB Bank (MBB)</option>
                  <option value="ACB">ACB (Asia Commercial Bank)</option>
                  <option value="VietinBank">VietinBank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="MoMo">MoMo Wallet</option>
                  <option value="PayPal">PayPal (USD)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 block mb-1">Bank Account Number / Wallet ID</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 10123456789"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 block mb-1">Account Holder Name (Full Name)</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="e.g. NGUYEN VAN A"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 block mb-1">Reason / Reference Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Withdrawal reason / Internal audit note..."
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xs font-mono focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveAction("none")}
                className="px-3 py-1.5 bg-white/10 text-white/70 text-xs rounded-xl hover:bg-white/15 cursor-pointer"
              >Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-400 transition cursor-pointer"
              >
                {submitting ? "Processing Cash-Out..." : "Confirm Cash-Out Payout"}
              </button>
            </div>
          </form>
        )}

        {/* Admin Pending Withdrawal Requests Panel */}
        <div className="space-y-3 border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-amber-400 font-serif flex items-center gap-2">
              <span>💸 User Withdrawal Requests</span>
              {withdrawalRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                  {withdrawalRequests.filter(r => r.status === 'PENDING').length} Pending
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setWrFilter(wrFilter === 'PENDING' ? 'ALL' : 'PENDING'); setTimeout(fetchWallet, 50); }}
                className="px-3 py-1 text-[10px] font-mono rounded-lg border border-white/15 text-white/60 hover:bg-white/10 transition"
              >
                {wrFilter === 'PENDING' ? 'Show All' : 'Show Pending Only'}
              </button>
              <button onClick={fetchWallet} className="px-3 py-1 text-[10px] font-mono rounded-lg border border-white/15 text-white/60 hover:bg-white/10 transition">🔄 Refresh</button>
            </div>
          </div>

          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs font-mono">No withdrawal requests found.</div>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-black/60 text-white/50 border-b border-white/10 uppercase text-[10px]">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Amount (VND)</th>
                    <th className="px-3 py-2">Bank / Account</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Submitted</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawalRequests.map((wr: any) => (
                    <tr key={wr.id} className="hover:bg-white/[0.02] transition align-top">
                      <td className="px-3 py-2 text-white/40">#WR-{wr.id}</td>
                      <td className="px-3 py-2 text-white/80">
                        {wr.username}<br/>
                        <span className="text-white/40 text-[10px]">{wr.fullName}</span>
                      </td>
                      <td className="px-3 py-2 font-bold text-amber-300">{Number(wr.amount).toLocaleString('en-US')} VND</td>
                      <td className="px-3 py-2 text-white/70">
                        {wr.bankName}<br/>
                        <span className="text-white/40 text-[10px]">{wr.accountNumber}</span><br/>
                        <span className="text-white/40 text-[10px]">{wr.accountHolder}</span>
                      </td>
                      <td className="px-3 py-2">
                        {wr.status === 'PENDING' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ PENDING</span>}
                        {wr.status === 'PROCESSED' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ PROCESSED</span>}
                        {wr.status === 'REJECTED' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">❌ REJECTED</span>}
                        {wr.processedNote && <div className="text-[9px] text-white/70 mt-1 max-w-[200px] break-words" title={wr.processedNote}>{wr.processedNote}</div>}
                      </td>
                      <td className="px-3 py-2 text-white/40 text-[10px]">{formatDate(wr.createdAt)}</td>
                      <td className="px-3 py-2">
                        {wr.status === 'PENDING' && (
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => handleProcessWithdrawal(wr.id)}
                              disabled={processingWrId === wr.id}
                              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {processingWrId === wr.id ? '...' : '✅ Mark Processed'}
                            </button>
                            <input
                              type="text"
                              placeholder="Reject reason..."
                              value={rejectNoteMap[wr.id] || ''}
                              onChange={e => setRejectNoteMap(m => ({ ...m, [wr.id]: e.target.value }))}
                              className="px-2 py-1 bg-black/50 border border-white/10 rounded-lg text-white text-[10px] font-mono focus:outline-none focus:border-rose-400 w-full"
                            />
                            <button
                              onClick={() => handleRejectWithdrawal(wr.id)}
                              disabled={processingWrId === wr.id}
                              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-lg transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {processingWrId === wr.id ? '...' : '❌ Reject'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
                        <th className="px-4 py-3">Amount (VND)</th>
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
                              {isPositive ? `+${amt.toLocaleString('en-US')} VND` : `${amt.toLocaleString('en-US')} VND`}
                            </td>
                            <td className="px-4 py-3 text-white/80">
                              <div className="max-w-[250px] whitespace-normal break-words leading-snug" title={tx.description}>{tx.description}</div>
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

        <VietQRModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          onConfirmSuccess={handleConfirmTopUp}
          amount={parseFloat(amount) || 0}
          transferNote={`TOPUP ADMIN admin_root`}
          accountName="HORSE RACING SYSTEM FUNDING"
          accountNumber="9999 8888 6868"
          bankName="Vietcombank (VCB)"
          gatewayMode={gatewayMode}
          loading={submitting}
        />
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

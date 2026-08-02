import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../../lib/api";
import { formatDate } from "../../../utils/dateTimeHelper";
import { $t } from "../../../../lib/i18n";

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

  const walletBalance = user?.walletBalance !== undefined && user?.walletBalance !== null
    ? Number(user.walletBalance)
    : Number(walletData?.walletBalance || 0);

  const transactions = walletData?.transactions || [];

  const getTxBadge = (type: string) => {
    switch (type) {
      case "TICKET_FEE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">TICKET FEE</span>;
      case "TICKET_REFUND":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">TICKET REFUND</span>;
      case "JOCKEY_MOUNT_FEE":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">MOUNT FEE</span>;
      case "RACE_PRIZE_MONEY":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PRIZE MONEY</span>;
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
            Welcome, {user?.username ?? user?.fullName ?? roleLabel}. Manage your wallet balance, track ticket fees, and view full transaction history.
          </p>
        </div>

        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl min-w-[16rem] text-right font-mono">
          <span className="text-xs text-white/50 block uppercase">Current Available Balance</span>
          <div className="text-3xl font-extrabold mt-1" style={{ color: roleColor }}>
            ${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-400 font-bold block mt-1">
            ✓ Account Active
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-mono">
          ⚠️ {error}
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
                {transactions.map((tx: any) => {
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
        )}
      </div>
    </div>
  );
}

import { $t } from "../../../lib/i18n";
import { useState, useEffect } from "react";
import { api, getErrMsg } from "../../../lib/api";
import { formatDate, formatDateTime } from "../../utils/dateTimeHelper";
import InlineDatePicker from "../ui/InlineDatePicker";
import { confirm } from "../../../lib/confirm";
import { Pagination } from "../common/Pagination";

/**
 */
export default function RaceMeeting({ onOpenWallet }: { onOpenWallet?: () => void }) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [adminWalletBal, setAdminWalletBal] = useState<number | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<any | null>(null);
  const [viewRegistrantsData, setViewRegistrantsData] = useState<any | null>(null);
  const [meetingTxs, setMeetingTxs] = useState<any[]>([]);
  const [loadingViewData, setLoadingViewData] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleToggleStatus = async (meetingId: number) => {
    try {
      await api.post(`/admin/meetings/${meetingId}/toggle-status`, {});
      fetchData();
    } catch (err: any) {
      alert(getErrMsg(err, "Failed to toggle meeting status."));
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const ms = await api.get<any[]>("/races/meetings");
      setMeetings(ms);

      const ss = await api.get<any[]>("/races/seasons");
      setSeasons(ss);

      try {
        const w = await api.get<any>("/admin/wallet");
        setAdminWalletBal(w.walletBalance);
      } catch (e) {
        console.error("Failed to load admin wallet:", e);
      }

      if (ss.length > 0 && !seasonId) {
        setSeasonId(ss[0].id.toString());
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to load data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchMeetingRegistrations = async (meetingId: number) => {
    setLoadingViewData(true);
    try {
      const res = await api.get<any>(`/registrations/meeting/${meetingId}`);
      setViewRegistrantsData(res);
      try {
        const txs = await api.get<any[]>(`/admin/meetings/${meetingId}/transactions`);
        setMeetingTxs(txs);
      } catch (txErr) {
        setMeetingTxs([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch meeting registrants:", err);
    } finally {
      setLoadingViewData(false);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (viewingMeeting) {
      fetchMeetingRegistrations(viewingMeeting.id);
      interval = setInterval(() => {
        fetchMeetingRegistrations(viewingMeeting.id);
      }, 5000);
    } else {
      setViewRegistrantsData(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewingMeeting]);

  const handleEdit = (m: any) => {
    setEditingMeeting(m);
    setName(m.name || "");
    setVenue(m.venue || "");
    setSeasonId(m.seasonId ? m.seasonId.toString() : "");
    setDate(formatDate(m.startDate || m.date));
    setTotalBudget(m.totalBudget ? m.totalBudget.toString() : "");
    setTicketPrice(m.ticketPrice != null ? m.ticketPrice.toString() : "0");
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingMeeting(null);
    setName("");
    setVenue("");
    setDate("");
    setTotalBudget("");
    setTicketPrice("");
    if (seasons.length > 0) {
      setSeasonId(seasons[0].id.toString());
    }
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id: number) => {
    if (!await confirm("Are you sure you want to delete this race meeting? This action cannot be undone.")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await api.delete(`/races/meetings/${id}`);
      setSuccess("Race meeting deleted successfully.");
      fetchData();
      if (editingMeeting?.id === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to delete meeting."));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const selectedSeason = seasons.find(s => s.id === parseInt(seasonId));
      if (selectedSeason && date) {
        const meetingTime = new Date(date).getTime();
        if (selectedSeason.startDate && meetingTime < new Date(selectedSeason.startDate).getTime()) {
          setError($t("Race Meeting date cannot be before Season start date", (localStorage.getItem('app-lang') || 'en')) + ` (${selectedSeason.startDate} - ${selectedSeason.endDate})`);
          return;
        }
        if (selectedSeason.endDate) {
          const endDate = new Date(selectedSeason.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (meetingTime > endDate.getTime()) {
            setError($t("Race Meeting date cannot be after Season end date", (localStorage.getItem('app-lang') || 'en')) + ` (${selectedSeason.startDate} - ${selectedSeason.endDate})`);
            return;
          }
        }
      }

      const budgetValue = totalBudget ? parseFloat(totalBudget) : 0;
      if (budgetValue < 100000000) {
        setError($t("Total budget must be at least 100,000,000 VND."));
        return;
      }
      if (budgetValue > 10000000000) {
        setError($t("Total budget cannot exceed 10,000,000,000 VND."));
        return;
      }

      // Validate ticket price: non-negative
      const ticketValue = ticketPrice ? parseFloat(ticketPrice) : 0;
      if (ticketValue < 0) {
        setError($t("Ticket Price cannot be negative."));
        return;
      }

      // Check duplicate Race Meeting name in the same Season (client-side pre-check)
      const targetSeasonId = parseInt(seasonId);
      const normName = name.trim().replace(/\s+/g, " ").toLowerCase();
      const isDuplicate = meetings.some(m =>
        (!editingMeeting || m.id !== editingMeeting.id) &&
        m.name && m.name.trim().replace(/\s+/g, " ").toLowerCase() === normName &&
        (m.status !== "CANCELLED") &&
        (!targetSeasonId || !m.seasonId || m.seasonId === targetSeasonId)
      );
      if (isDuplicate) {
        setError(`A Race Meeting named "${name.trim()}" already exists in this Season. Meeting names must be unique within a Season.`);
        return;
      }

      const payload = {
        name,
        startDate: formatDateTime(date),
        venue,
        seasonId: targetSeasonId || selectedSeason,
        totalBudget: budgetValue,
        ticketPrice: ticketValue,
      };

      try {
        if (editingMeeting) {
          await api.post(`/races/meetings/${editingMeeting.id}`, payload);
          setSuccess("Race meeting updated successfully.");
          setEditingMeeting(null);
        } else {
          await api.post("/races/meetings", payload);
          setSuccess("Race meeting created successfully.");
        }

        setName("");
        setDate("");
        setVenue("");
        setTotalBudget("");
        setTicketPrice("");
        fetchData();
      } catch (err: any) {
        if (err.message?.includes("DUPLICATE_MEETING_NAME") || err.message?.toLowerCase().includes("already exists")) {
          const rawMsg = err.message || "";
          const mName = rawMsg.includes("DUPLICATE_MEETING_NAME:") ? rawMsg.split("DUPLICATE_MEETING_NAME:")[1] : name;
          setError(`A Race Meeting named "${mName.trim()}" already exists in this Season. Meeting names must be unique within a Season.`);
        } else {
          setError(getErrMsg(err, "Failed to save meeting."));
        }
      }
    } catch (err: any) {
      setError(getErrMsg(err, "Failed to process meeting data."));
    }
  };

  const totalItems = meetings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedMeetings = meetings.slice(startIndex, startIndex + pageSize);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4 order-last lg:order-first">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{$t("Race Meetings Directory", (localStorage.getItem('app-lang') || 'en'))}</span>
        </h3>

        {loading ? (
          <p className="text-sm text-white/40">{$t("Loading meetings...", (localStorage.getItem('app-lang') || 'en'))}</p>
        ) : isMobile ? (
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {meetings.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", textAlign: "center", padding: "1rem" }}>{$t("No meetings found.", (localStorage.getItem('app-lang') || 'en'))}</p>
            ) : (
              <>
                {paginatedMeetings.map((m) => (
                  <div key={m.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>#{m.id}</span>
                          <h4 style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#f4f2ec" }}>{m.name}</h4>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#a0a0a0", fontFamily: "monospace" }}>
                          📅 {formatDate(m.startDate || m.date)}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                          📍 {m.venue}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#fbbf24", marginTop: "4px", fontFamily: "monospace", fontWeight: "bold" }}>
                          💰 Budget: {Number(m.totalBudget || 0).toLocaleString('en-US')} VND
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "2px", fontFamily: "monospace", fontWeight: "bold" }}>
                          🎟️ Ticket Price: {Number(m.ticketPrice || 0).toLocaleString('en-US')} VND
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flexShrink: 0 }}>
                        <button
                          onClick={() => setViewingMeeting(m)}
                          className="px-2.5 py-1 text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-md transition"
                        >👁️ {$t("View", (localStorage.getItem('app-lang') || 'en'))}</button>
                        <button
                          onClick={() => handleEdit(m)}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition"
                        >{$t("Edit", (localStorage.getItem('app-lang') || 'en'))}</button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md transition"
                        >{$t("Delete", (localStorage.getItem('app-lang') || 'en'))}</button>
                      </div>
                    </div>
                  </div>
                ))}
                <Pagination
                  currentPage={validPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
          </div>
        ) : (
          
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#151310] text-xs font-semibold text-white/60 uppercase tracking-wider border-b border-white/5">
                  <th className="px-5 py-4">{$t("ID", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Meeting Name", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Season", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Status", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Total Budget (VND)", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Registration Fee (VND)", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Date", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4">{$t("Venue", (localStorage.getItem('app-lang') || 'en'))}</th>
                  <th className="px-5 py-4 text-right">{$t("Actions", (localStorage.getItem('app-lang') || 'en'))}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {paginatedMeetings.map((m) => {
                  const mStatus = m.status || "ACTIVE";
                  const matchedSeason = seasons.find(s => s.id === m.seasonId);
                  const isSeasonClosed = m.seasonStatus === 'CLOSED' || m.seasonStatus === 'INACTIVE' || matchedSeason?.status === 'CLOSED' || matchedSeason?.status === 'INACTIVE';

                  return (
                    <tr key={m.id} className="hover:bg-[#151310]/15 transition">
                      <td className="px-5 py-4 font-mono text-white/40">#{m.id}</td>
                      <td className="px-5 py-4 font-semibold text-white">{m.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-amber-400/90">
                        {m.seasonName ? `${m.seasonName} (#${m.seasonId})` : `Season #${m.seasonId}`}
                        {isSeasonClosed && (
                          <span className="block text-[9px] text-rose-400 font-bold font-mono">🔒 Season Closed</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          mStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          mStatus === 'ENDED' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                          mStatus === 'CANCELLED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {mStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">{Number(m.totalBudget || 0).toLocaleString('en-US')} VND</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">{Number(m.ticketPrice || 0).toLocaleString('en-US')} VND</td>
                      <td className="px-5 py-4 text-white/80">{formatDate(m.startDate || m.date)}</td>
                      <td className="px-5 py-4 text-white/60">📍 {m.venue}</td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {isSeasonClosed ? (
                          <>
                            <button
                              onClick={() => setViewingMeeting(m)}
                              className="px-2.5 py-1 text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-md transition"
                            >👁️ {$t("View", (localStorage.getItem('app-lang') || 'en'))}</button>
                            <span className="text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                              🔒 View Only (Season Deactive)
                            </span>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleStatus(m.id)}
                              className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                                mStatus === 'ACTIVE' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                              }`}
                            >{mStatus === 'ACTIVE' ? '⏸️ Deactivate' : '▶️ Activate'}</button>
                            <button
                              onClick={() => setViewingMeeting(m)}
                              className="px-2.5 py-1 text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-md transition"
                            >👁️ {$t("View", (localStorage.getItem('app-lang') || 'en'))}</button>
                            <button
                              onClick={() => handleEdit(m)}
                              className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-md transition"
                            >{$t("Edit", (localStorage.getItem('app-lang') || 'en'))}</button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-md transition"
                            >{$t("Delete", (localStorage.getItem('app-lang') || 'en'))}</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={validPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        )}
      </div>

      <div className="space-y-4 order-first lg:order-last">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span>{editingMeeting ? `${$t("Edit Meeting", (localStorage.getItem('app-lang') || 'en'))} #${editingMeeting.id}` : $t("Add New Meeting", (localStorage.getItem('app-lang') || 'en'))}</span>
        </h3>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/[0.015] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Meeting Name", (localStorage.getItem('app-lang') || 'en'))}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("E.g., Grand Prix Sunday", (localStorage.getItem('app-lang') || 'en'))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Total Budget (VND)", (localStorage.getItem('app-lang') || 'en'))}</label>
              {adminWalletBal != null && (
                <span
                  onClick={() => onOpenWallet && onOpenWallet()}
                  className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition"
                >
                  🏦 Admin Wallet: {Number(adminWalletBal).toLocaleString('en-US')} VND
                </span>
              )}
            </div>
            <input
              type="number"
              min="100000000"
              max="10000000000"
              step="any"
              required
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("Min: 100,000,000 — Max: 10,000,000,000", (localStorage.getItem('app-lang') || 'en'))}
            />
            <p className="text-[10px] text-white/40 font-mono">
              * Budget will be allocated directly from Admin Wallet.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <span>🎟️</span> {$t("Ticket Price (VND)", (localStorage.getItem('app-lang') || 'en'))}
              </label>
              {editingMeeting && (
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  🔒 Locked (Cannot be modified after creation)
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="1"
              disabled={!!editingMeeting}
              required
              value={ticketPrice}
              onChange={(e) => setTicketPrice(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-xl text-xs font-mono font-bold ${
                editingMeeting ? "bg-black/60 border-white/5 text-white/40 cursor-not-allowed" : "bg-black/40 border-amber-500/30 text-amber-300 focus:border-amber-400 focus:outline-none"
              }`}
              placeholder={$t("Enter ticket price in VND (e.g. 50,000, 100,000)", (localStorage.getItem('app-lang') || 'en'))}
            />
            <p className="text-[10px] text-white/40 font-mono">
              {editingMeeting
                ? "* Ticket price is locked after creation to preserve financial integrity for registered participants."
                : $t("Ticket price applied when HorseOwner registers for the Race Meeting.", (localStorage.getItem('app-lang') || 'en'))}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Date", (localStorage.getItem('app-lang') || 'en'))}</label>
            <InlineDatePicker
              value={date ? date.split(" ")[0] : ""}
              onChange={(v) => setDate(v + " 00:00:00")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Venue", (localStorage.getItem('app-lang') || 'en'))}</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs"
              placeholder={$t("E.g., Epsom Downs Track", (localStorage.getItem('app-lang') || 'en'))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block">{$t("Season Association", (localStorage.getItem('app-lang') || 'en'))}</label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white text-xs focus:outline-none"
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition"
          >
            {editingMeeting ? $t("Save Changes", (localStorage.getItem('app-lang') || 'en')) : $t("Create Meeting", (localStorage.getItem('app-lang') || 'en'))}
          </button>
          {editingMeeting && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition mt-2"
            >{$t("Cancel Edit", (localStorage.getItem('app-lang') || 'en'))}</button>
          )}
        </form>
      </div>

      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181613] border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">Meeting Details & Registrations</span>
                <h3 className="text-xl font-bold text-white font-serif">{viewingMeeting.name}</h3>
              </div>
              <button
                onClick={() => setViewingMeeting(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >✕</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl text-xs font-mono">
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Meeting ID</span>
                <span className="text-white font-bold">#{viewingMeeting.id}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Season</span>
                <span className="text-amber-400 font-bold">{viewingMeeting.seasonName ? `${viewingMeeting.seasonName} (#${viewingMeeting.seasonId})` : `Season #${viewingMeeting.seasonId}`}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Date</span>
                <span className="text-white font-bold">{formatDate(viewingMeeting.startDate || viewingMeeting.date)}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Venue</span>
                <span className="text-white font-bold">📍 {viewingMeeting.venue}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px] uppercase">Total Budget</span>
                <span className="text-amber-400 font-bold">${Number(viewingMeeting.totalBudget || 0).toLocaleString('en-US')}</span>
              </div>
              <div>
                <span className="text-amber-400 block text-[10px] uppercase">🎟️ Reg Fee</span>
                <span className="text-emerald-400 font-bold">${Number(viewingMeeting.ticketPrice || 0).toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                  <span>👥 Participant Registrations & Fee Status</span>
                  {loadingViewData && <span className="text-xs text-amber-500 font-mono animate-pulse">(Updating...)</span>}
                </h4>
                <span className="text-xs font-mono text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  {viewRegistrantsData?.registrants?.length || 0} Registrants
                </span>
              </div>

              {viewRegistrantsData?.registrants?.length === 0 ? (
                <div className="text-center py-8 bg-black/20 border border-white/5 rounded-xl text-white/40 text-xs font-mono">
                  No Jockeys or Horse Owners have registered for this meeting yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {viewRegistrantsData?.registrants?.map((r: any) => {
                    const isJockey = r.role === 'Jockey' || r.paymentStatus === 'FREE';
                    return (
                      <div key={r.registrationId + "-" + r.role} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-3 rounded-xl hover:bg-white/[0.05] transition text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isJockey ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                            {isJockey ? '🏇' : '👑'}
                          </div>
                          <div>
                            <div className="font-bold text-white">{r.username} {r.fullName ? `(${r.fullName})` : ''}</div>
                            <div className="text-[10px] text-white/40 font-mono">
                              {r.role} • Registered: {r.registeredAt ? formatDate(r.registeredAt) : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          {isJockey ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              ✓ Free ($0 - Jockey)
                            </span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${r.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                              {r.paymentStatus === 'PAID' ? `✓ Paid ${Number(r.ticketPrice || 0).toLocaleString('en-US')} VND` : `✕ Refunded`}
                            </span>
                          )}
                          <div className="text-[10px] text-white/30 mt-1">Status: {r.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Escrow Revenue Vault Block & Auto Settlement Status */}
            <div className="bg-gradient-to-r from-amber-950/20 via-black to-emerald-950/20 border border-amber-500/20 p-4 rounded-xl font-mono text-xs">
              <span className="text-amber-400 font-bold block">🛡️ Ticket Escrow Revenue Vault:</span>
              <span className="text-white/70 text-[11px] block mt-1">
                Settlement status:{" "}
                <strong className={viewingMeeting.ticketSettled || viewingMeeting.status === "ENDED" ? "text-emerald-400" : "text-amber-400"}>
                  {viewingMeeting.ticketSettled || viewingMeeting.status === "ENDED"
                    ? "✓ Auto-Settled to Admin Wallet upon Race Completion"
                    : "⏳ Held securely in Escrow Vault (Auto-settles when Race becomes OFFICIAL)"}
                </strong>
              </span>
            </div>

            {/* Meeting Financial Transaction History Log */}
            <div className="space-y-2 font-mono text-xs">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>📜</span> Meeting Transaction History Log
              </h4>
              {meetingTxs.length === 0 ? (
                <p className="text-white/40 text-[11px] font-mono italic">No fee transactions logged for this meeting yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {meetingTxs.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-2 rounded-lg text-[11px]">
                      <div>
                        <span className="text-white font-bold block">{tx.transactionType}</span>
                        <span className="text-white/40 text-[10px] block">{tx.description}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold block ${Number(tx.amount) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {Number(tx.amount) >= 0 ? `+${Number(tx.amount).toLocaleString('en-US')} VND` : `-${Math.abs(Number(tx.amount)).toLocaleString('en-US')} VND`}
                        </span>
                        <span className="text-white/30 text-[9px] block">{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setViewingMeeting(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

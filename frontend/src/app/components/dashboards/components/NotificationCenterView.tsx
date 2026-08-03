import React, { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import { $t } from "../../../../lib/i18n";
import { Pagination } from "../../common/Pagination";

interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterViewProps {
  userId?: number;
}

export const NotificationCenterView: React.FC<NotificationCenterViewProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res: any = await api.get(`/notifications?userId=${userId}`);
      if (res && res.notifications && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkRead = async (notifId: number) => {
    try {
      await api.post(`/notifications/${notifId}/read`);
      fetchNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await api.post(`/notifications/read-all?userId=${userId}`);
      setSuccessMsg("All notifications marked as read.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchNotifications();
    } catch {}
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "READ") return n.isRead;
    return true; // ALL
  });

  const validPage = Math.max(1, Math.min(page, Math.ceil(filteredNotifications.length / pageSize) || 1));
  const paginatedNotifs = filteredNotifications.slice((validPage - 1) * pageSize, validPage * pageSize);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch {
      return isoStr;
    }
  };

  const currentLang = localStorage.getItem("app-lang") || "en";

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl text-amber-400">
            🔔
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              <span>{$t("Notifications Center", currentLang)}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h2>
            <p className="text-xs text-white/50 font-mono mt-0.5">
              {$t("View, filter, and manage all your system alerts and activity updates.", currentLang)}
            </p>
          </div>
        </div>

        {/* Action Controls & Filter Dropdown */}
        <div className="flex items-center gap-3">
          {/* Dropdown Filter: All, Unread, Read */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-white/40 font-mono uppercase tracking-wider">Filter:</span>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as any);
                setPage(1);
              }}
              className="bg-transparent text-xs font-mono font-bold text-amber-400 outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#181613] text-white">All Notifications ({notifications.length})</option>
              <option value="UNREAD" className="bg-[#181613] text-rose-300">Unread ({notifications.filter(n => !n.isRead).length})</option>
              <option value="READ" className="bg-[#181613] text-emerald-300">Read ({notifications.filter(n => n.isRead).length})</option>
            </select>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
            >
              ✓ Mark All as Read
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
          ✓ {successMsg}
        </div>
      )}

      {/* Notifications List */}
      {loading && notifications.length === 0 ? (
        <div className="p-8 text-center text-white/40 font-mono text-xs italic bg-white/[0.01] border border-white/5 rounded-2xl">
          Loading notifications...
        </div>
      ) : paginatedNotifs.length === 0 ? (
        <div className="p-10 text-center text-white/40 font-mono text-xs italic bg-white/[0.01] border border-white/5 rounded-2xl space-y-2">
          <div className="text-3xl opacity-30">📭</div>
          <p>No {filter !== "ALL" ? filter.toLowerCase() : ""} notifications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkRead(n.id)}
              className={`p-4 rounded-xl border transition-all ${
                n.isRead
                  ? "bg-white/[0.01] border-white/5 opacity-70 hover:opacity-100"
                  : "bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40 cursor-pointer shadow-[0_0_15px_rgba(201,162,39,0.05)]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 text-base ${n.isRead ? "opacity-50" : ""}`}>
                    {n.isRead ? "💬" : "🔔"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${n.isRead ? "text-white/70" : "text-white font-serif"}`}>
                        {n.title || "System Notification"}
                      </h4>
                      {!n.isRead && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 mt-1 leading-relaxed break-words">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[10px] font-mono text-white/40">
                    {formatDate(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="text-[10px] font-mono text-amber-400 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <Pagination
            currentPage={validPage}
            totalItems={filteredNotifications.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationCenterView;

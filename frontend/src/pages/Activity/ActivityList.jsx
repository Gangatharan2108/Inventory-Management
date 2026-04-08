import { useEffect, useState, useCallback, useMemo } from "react";
import { getActivities } from "../../api/activityService";

/* ══════════════════════════════════════════
   SHARED STYLES
══════════════════════════════════════════ */
const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border text-sm font-medium",
  "bg-white text-slate-800 border-slate-200 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
  "transition-all duration-200",
  "dark:bg-slate-700/80 dark:text-slate-100 dark:border-slate-600",
  "dark:placeholder:text-slate-500 dark:focus:border-blue-400",
].join(" ");

const labelCls =
  "block text-[12.5px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 tracking-wide";

/* ── Pagination Button ── */
const PagBtn = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 border",
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:bg-blue-500 dark:shadow-blue-900/40"
        : disabled
          ? "text-slate-300 border-slate-200 cursor-not-allowed dark:text-slate-600 dark:border-slate-700"
          : "text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700",
    ].join(" ")}
  >
    {children}
  </button>
);

/* ── Action keyword → colour mapping ── */
const actionColor = (action = "") => {
  const a = action.toLowerCase();
  if (a.includes("creat") || a.includes("add"))
    return {
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
      dot: "bg-emerald-500",
      icon: "bi-plus-circle-fill",
    };
  if (a.includes("updat") || a.includes("edit"))
    return {
      badge:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
      dot: "bg-blue-500",
      icon: "bi-pencil-fill",
    };
  if (a.includes("delet") || a.includes("remov"))
    return {
      badge:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60",
      dot: "bg-red-500",
      icon: "bi-trash3-fill",
    };
  if (a.includes("login") || a.includes("logout"))
    return {
      badge:
        "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/60",
      dot: "bg-violet-500",
      icon: "bi-box-arrow-in-right",
    };
  if (a.includes("sale") || a.includes("purchase"))
    return {
      badge:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60",
      dot: "bg-amber-500",
      icon: "bi-receipt",
    };
  return {
    badge:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    dot: "bg-slate-400",
    icon: "bi-activity",
  };
};

/* ── Stat pill in header ── */
const StatPill = ({ icon, count, color }) => (
  <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
    <i className={`bi ${icon} ${color} text-sm`} />
    <span className="text-white/90 text-[12px] font-bold">{count}</span>
  </div>
);

/* ── KPI Summary Card ── */
const KpiCard = ({ label, value, gradient, icon }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
    <div
      className={`w-11 h-11 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <i className={`bi ${icon} text-white text-base`} />
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
        {value}
      </p>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   ACTIVITY LIST COMPONENT
══════════════════════════════════════════ */
const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getActivities();
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setActivities(sorted);
      setFilteredActivities(sorted);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const handleGenerate = () => {
    if (!fromDate && !toDate) {
      setFilteredActivities(activities);
      return;
    }
    const filtered = activities.filter((a) => {
      const d = new Date(a.created_at);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate + "T23:59:59") : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    setFilteredActivities(filtered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setFilteredActivities(activities);
    setCurrentPage(1);
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(s, s + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  /* ── Derived counts ── */
  const countCreate = filteredActivities.filter(
    (a) =>
      a.action?.toLowerCase().includes("creat") ||
      a.action?.toLowerCase().includes("add"),
  ).length;
  const countUpdate = filteredActivities.filter(
    (a) =>
      a.action?.toLowerCase().includes("updat") ||
      a.action?.toLowerCase().includes("edit"),
  ).length;
  const countDelete = filteredActivities.filter((a) =>
    a.action?.toLowerCase().includes("delet"),
  ).length;
  const countLogin = filteredActivities.filter(
    (a) =>
      a.action?.toLowerCase().includes("sale") ||
      a.action?.toLowerCase().includes("purchase"),
  ).length;

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading Activities…
        </p>
      </div>
    );

  /* ── Error ── */
  if (error)
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm dark:bg-red-900/20 dark:border-red-800/60 dark:text-red-400">
          <i className="bi bi-exclamation-triangle-fill text-lg shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ════ FILTER CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <i className="bi bi-funnel-fill text-blue-500 text-sm" />
            </div>
            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
              Filter Activities
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-refreshes every 30s
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className={labelCls}>
                <i className="bi bi-calendar3 me-1.5 text-blue-500" />
                From Date
              </label>
              <input
                type="date"
                className={inputCls}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>
                <i className="bi bi-calendar-check me-1.5 text-blue-500" />
                To Date
              </label>
              <input
                type="date"
                className={inputCls}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:shadow-blue-900/30"
            >
              <i className="bi bi-search" /> Generate
            </button>
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60"
            >
              <i className="bi bi-arrow-clockwise" /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* ════ KPI SUMMARY CARDS ════ */}
      {filteredActivities.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Created"
            value={countCreate}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            icon="bi-plus-circle-fill"
          />
          <KpiCard
            label="Updated"
            value={countUpdate}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            icon="bi-pencil-fill"
          />
          <KpiCard
            label="Deleted"
            value={countDelete}
            gradient="bg-gradient-to-br from-rose-500 to-rose-700"
            icon="bi-trash3-fill"
          />
          <KpiCard
            label="Sales and Purchases"
            value={countLogin}
            gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            icon="bi-shield-lock-fill"
          />
        </div>
      )}

      {/* ════ ACTIVITY TABLE CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <i className="bi bi-clock-history text-blue-300 text-sm" />
            </div>
            Recent Activities
            <span className="text-[11px] font-semibold bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredActivities.length} records
            </span>
          </h5>
          <div className="flex items-center gap-2">
            <StatPill
              icon="bi-pencil-fill"
              count={countUpdate}
              color="text-blue-300"
            />
            <StatPill
              icon="bi-plus-circle-fill"
              count={countCreate}
              color="text-emerald-300"
            />
            <StatPill
              icon="bi-trash3-fill"
              count={countDelete}
              color="text-red-300"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                  {["#", "Action", "User", "Date & Time"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                          <i className="bi bi-clock-history text-4xl text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-slate-600 dark:text-slate-400 m-0">
                            No Activities Found
                          </p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 m-0">
                            Adjust the date range to find activities
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((activity, index) => {
                    const ac = actionColor(activity.action);
                    return (
                      <tr
                        key={activity.id}
                        className="bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition-colors duration-150 group"
                      >
                        {/* # */}
                        <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>

                        {/* Action Badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full border ${ac.badge}`}
                          >
                            <i className={`bi ${ac.icon} text-[10px]`} />
                            {activity.action || "N/A"}
                          </span>
                        </td>

                        {/* User Avatar + Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[12px] font-extrabold shrink-0 shadow-sm">
                              {(activity.user || "S").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                              {activity.user || "System"}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                          {formatDate(activity.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ════ PAGINATION ════ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/50">
              {/* Showing X – Y of Z */}
              <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {" – "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredActivities.length,
                  )}
                </span>
                {" of "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {filteredActivities.length}
                </span>
              </span>

              {/* Page buttons */}
              <div className="flex items-center gap-1">
                <PagBtn
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-chevron-left text-[11px]" />
                </PagBtn>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    const show =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    const eL = page === currentPage - 2 && page > 2;
                    const eR =
                      page === currentPage + 2 && page < totalPages - 1;
                    if (eL || eR)
                      return (
                        <span
                          key={page}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-semibold"
                        >
                          …
                        </span>
                      );
                    if (!show) return null;
                    return (
                      <PagBtn
                        key={page}
                        onClick={() => goToPage(page)}
                        active={page === currentPage}
                      >
                        {page}
                      </PagBtn>
                    );
                  },
                )}

                <PagBtn
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-chevron-right text-[11px]" />
                </PagBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityList;

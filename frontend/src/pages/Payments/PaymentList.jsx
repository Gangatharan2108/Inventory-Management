import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "../../api/axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ══════════════════════════════════════════
   CONSTANTS & SHARED STYLES
══════════════════════════════════════════ */
const ITEMS_PER_PAGE = 10;

const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border text-sm font-medium",
  "bg-white text-slate-800 border-slate-200 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500",
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

/* ── Transaction Type Badge ── */
const TypeBadge = ({ type }) =>
  type === "Credit" ? (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
      <i className="bi bi-arrow-down-circle-fill text-[10px]" />
      Credit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
      <i className="bi bi-arrow-up-circle-fill text-[10px]" />
      Debit
    </span>
  );

/* ── KPI Card ── */
const KpiCard = ({ label, value, gradient, icon, subLabel }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
    <div
      className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <i className={`bi ${icon} text-white text-lg`} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-[19px] font-extrabold text-slate-800 dark:text-slate-100 leading-none truncate">
        {value}
      </p>
      {subLabel && (
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
          {subLabel}
        </p>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════
   PAYMENT LIST COMPONENT
══════════════════════════════════════════ */
const PaymentList = () => {
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedParty, setSelectedParty] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/transactions/");
      setTransactions(res.data || []);
      setFilteredTransactions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleGenerate = () => {
    const f = transactions.filter((t) => {
      const d = t.created_at.split("T")[0];
      return (
        d >= startDate &&
        d <= endDate &&
        (selectedParty === "" || t.party_name === selectedParty)
      );
    });
    setFilteredTransactions(f);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setStartDate(today);
    setEndDate(today);
    setSelectedParty("");
    setFilteredTransactions(transactions);
    setCurrentPage(1);
  };

  const downloadExcel = () => {
    if (!filteredTransactions.length) return;
    const data = filteredTransactions.map((t) => ({
      Party: t.party_name,
      Type: t.type,
      Amount: Number(t.amount).toFixed(2),
      Mode: t.mode,
      Reference: t.reference,
      Date: new Date(t.created_at).toLocaleDateString(),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      "Transactions",
    );
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      `Payment_Report_${startDate}_to_${endDate}.xlsx`,
    );
  };

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTx = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(s, s + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const { totalCredit, totalDebit, netBalance } = useMemo(() => {
    let cr = 0,
      db = 0;
    filteredTransactions.forEach((t) => {
      const a = parseFloat(t.amount) || 0;
      t.type === "Credit" ? (cr += a) : (db += a);
    });
    return { totalCredit: cr, totalDebit: db, netBalance: cr - db };
  }, [filteredTransactions]);

  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v);

  const partyOpts = useMemo(
    () => [...new Set(transactions.map((t) => t.party_name).filter(Boolean))],
    [transactions],
  );

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading payments…
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ════ FILTER CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-colors duration-300">
        {/* Filter Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <i className="bi bi-funnel-fill text-blue-500 text-sm" />
          </div>
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
            Filter Payments
          </span>
        </div>

        {/* Filter Body */}
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* From Date */}
            <div>
              <label className={labelCls}>
                <i className="bi bi-calendar3 me-1.5 text-blue-500" />
                From Date
              </label>
              <input
                type="date"
                className={inputCls}
                max={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div>
              <label className={labelCls}>
                <i className="bi bi-calendar-check me-1.5 text-blue-500" />
                To Date
              </label>
              <input
                type="date"
                className={inputCls}
                max={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Party */}
            <div>
              <label className={labelCls}>
                <i className="bi bi-people me-1.5 text-blue-500" />
                Party
              </label>
              <select
                className={inputCls}
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
              >
                <option value="">All Parties</option>
                {partyOpts.map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:shadow-blue-900/30"
              >
                <i className="bi bi-search" />
                Generate
              </button>
              <button
                onClick={handleClear}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60"
              >
                <i className="bi bi-arrow-clockwise" />
                Clear
              </button>
            </div>
          </div>

          {/* Export Excel */}
          <div className="flex justify-end mt-4">
            <button
              onClick={downloadExcel}
              disabled={!filteredTransactions.length}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:border-emerald-700/60 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white dark:disabled:opacity-30"
            >
              <i className="bi bi-file-earmark-excel-fill" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ════ KPI SUMMARY CARDS ════ */}
      {filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Total Income"
            value={fmt(totalCredit)}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            icon="bi-arrow-down-circle-fill"
            subLabel={`${filteredTransactions.filter((t) => t.type === "Credit").length} credit entries`}
          />
          <KpiCard
            label="Total Expense"
            value={fmt(totalDebit)}
            gradient="bg-gradient-to-br from-rose-500 to-rose-700"
            icon="bi-arrow-up-circle-fill"
            subLabel={`${filteredTransactions.filter((t) => t.type !== "Credit").length} debit entries`}
          />
          <KpiCard
            label="Net Balance"
            value={fmt(netBalance)}
            gradient={
              netBalance >= 0
                ? "bg-gradient-to-br from-blue-500 to-blue-700"
                : "bg-gradient-to-br from-orange-500 to-orange-700"
            }
            icon="bi-wallet2"
            subLabel={netBalance >= 0 ? "Positive balance" : "Negative balance"}
          />
        </div>
      )}

      {/* ════ TABLE CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <i className="bi bi-cash-stack text-blue-300 text-sm" />
            </div>
            Payment Transactions
            <span className="text-[11px] font-semibold bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredTransactions.length} records
            </span>
          </h5>

          {/* Credit / Debit quick stats */}
          {filteredTransactions.length > 0 && (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
                <i className="bi bi-arrow-down-circle-fill text-emerald-400 text-sm" />
                <span className="text-emerald-300 text-[12px] font-bold">
                  {
                    filteredTransactions.filter((t) => t.type === "Credit")
                      .length
                  }
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-xl px-3 py-1.5">
                <i className="bi bi-arrow-up-circle-fill text-red-400 text-sm" />
                <span className="text-red-300 text-[12px] font-bold">
                  {
                    filteredTransactions.filter((t) => t.type !== "Credit")
                      .length
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                  {[
                    "No",
                    "Party",
                    "Type",
                    "Amount",
                    "Mode",
                    "Reference",
                    "Date",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedTx.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                          <i className="bi bi-cash-stack text-4xl text-slate-300 dark:text-slate-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-slate-600 dark:text-slate-400 m-0">
                            No Transactions Found
                          </p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 m-0">
                            Try adjusting the date range or party filter
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTx.map((t, index) => (
                    <tr
                      key={t.id}
                      className="bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition-colors duration-150 group"
                    >
                      {/* # */}
                      <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>

                      {/* Party */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                            {(t.party_name || "P").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[13px]">
                            {t.party_name}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <TypeBadge type={t.type} />
                      </td>

                      {/* Amount */}
                      <td
                        className={`px-4 py-3.5 font-extrabold text-[14px] ${t.type === "Credit" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}
                      >
                        {fmt(t.amount)}
                      </td>

                      {/* Mode */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 px-2.5 py-1 rounded-lg transition-colors duration-150">
                          {t.mode}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[12.5px] font-medium">
                        {t.reference ? (
                          <span className="font-mono text-[11.5px] bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/60 px-2 py-0.5 rounded-lg">
                            {t.reference}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        {t.id.startsWith("S-") ? (
                          <button
                            onClick={() => navigate(`/sales/${t.id.slice(2)}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400 text-[11.5px] font-bold transition-all duration-150"
                          >
                            <i className="bi bi-eye-fill text-[11px]" />
                            View
                          </button>
                        ) : t.id.startsWith("P-") ? (
                          <button
                            onClick={() =>
                              navigate(`/purchases/${t.id.slice(2)}`)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 dark:border-violet-700/50 dark:text-violet-400 text-[11.5px] font-bold transition-all duration-150"
                          >
                            <i className="bi bi-eye-fill text-[11px]" />
                            View
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {" – "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredTransactions.length,
                  )}
                </span>
                {" of "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {filteredTransactions.length}
                </span>
              </span>

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

export default PaymentList;

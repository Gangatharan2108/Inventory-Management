import { useState, useEffect, useMemo } from "react";
import { getPurchases } from "../../api/purchaseService";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { usePermission } from "../../hooks/usePermission";

/* ── Shared Input / Label styles ── */
const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border text-sm font-medium",
  "bg-white text-slate-800 border-slate-200 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500",
  "transition-all duration-200",
  /* dark mode — works with both Tailwind class strategy AND body.dark-mode */
  "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600",
  "dark:placeholder:text-slate-500 dark:focus:border-blue-400",
  ".dark-mode &:bg-slate-700 .dark-mode &:text-slate-100",
].join(" ");

const labelCls =
  "block text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

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

/* ── Status Badge ── */
const StatusBadge = ({ due }) =>
  due === 0 ? (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      Pending
    </span>
  );

/* ── KPI Card ── */
const KpiCard = ({ label, value, color, icon }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
    <div
      className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <i className={`${icon} text-white text-lg`} />
    </div>
    <div>
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
        {value}
      </p>
    </div>
  </div>
);

const PurchaseList = () => {
  const today = new Date().toISOString().split("T")[0];
  const { can } = usePermission();

  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await getPurchases();
      setPurchases(res.data || []);
      setFilteredPurchases(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleGenerate = () => {
    const f = purchases.filter((p) => {
      const d = p.created_at.split("T")[0];
      return d >= startDate && d <= endDate;
    });
    setFilteredPurchases(f);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setStartDate(today);
    setEndDate(today);
    setFilteredPurchases(purchases);
    setCurrentPage(1);
  };

  const downloadExcel = () => {
    if (!filteredPurchases.length) return;
    const data = filteredPurchases.map((p) => ({
      Purchase_No: p.purchase_no,
      Date: new Date(p.created_at).toLocaleDateString(),
      Supplier: p.supplier_name,
      Total: Number(p.total_amount).toFixed(2),
      Paid: Number(p.paid_amount).toFixed(2),
      Due: Number(p.due_amount).toFixed(2),
      Status: p.due_amount === 0 ? "Paid" : "Pending",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      "Purchase Report",
    );
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      `Purchase_Report_${startDate}_to_${endDate}.xlsx`,
    );
  };

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPurchases.slice(s, s + ITEMS_PER_PAGE);
  }, [filteredPurchases, currentPage]);

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const totalAmount = useMemo(
    () => filteredPurchases.reduce((s, p) => s + Number(p.total_amount), 0),
    [filteredPurchases],
  );
  const totalPaid = useMemo(
    () => filteredPurchases.reduce((s, p) => s + Number(p.paid_amount), 0),
    [filteredPurchases],
  );
  const totalDue = useMemo(
    () => filteredPurchases.reduce((s, p) => s + Number(p.due_amount), 0),
    [filteredPurchases],
  );
  const totalPurchases = filteredPurchases.length;

  /* ── Loading State ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading purchases…
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ══════════════════════════════════════
          FILTER CARD
      ══════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-colors duration-300">
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <i className="bi bi-funnel-fill text-blue-500 text-sm" />
            </div>
            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
              Filter Purchases
            </span>
          </div>
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
                value={startDate}
                max={today}
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
                value={endDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 dark:bg-blue-500 dark:hover:bg-blue-400 dark:hover:shadow-blue-900/30"
            >
              <i className="bi bi-search" />
              Generate
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60"
            >
              <i className="bi bi-arrow-clockwise" />
              Clear
            </button>
          </div>

          {/* Export Excel */}
          <div className="flex justify-end mt-4">
            <button
              onClick={downloadExcel}
              disabled={!filteredPurchases.length}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:border-emerald-700/60 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white dark:disabled:opacity-30"
            >
              <i className="bi bi-file-earmark-excel-fill" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          KPI SUMMARY CARDS
      ══════════════════════════════════════ */}
      {filteredPurchases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiCard
            label="Total Purchases"
            value={totalPurchases}
            color="bg-gradient-to-br from-violet-500 to-violet-700"
            icon="bi bi-cart-check-fill"
          />
          <KpiCard
            label="Total Amount"
            value={`₹ ${totalAmount.toLocaleString("en-IN")}`}
            color="bg-gradient-to-br from-blue-500 to-blue-700"
            icon="bi bi-currency-rupee"
          />
          <KpiCard
            label="Total Paid"
            value={`₹ ${totalPaid.toLocaleString("en-IN")}`}
            color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            icon="bi bi-check-circle-fill"
          />
        </div>
      )}

      {/* ══════════════════════════════════════
          PURCHASE TABLE CARD
      ══════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <i className="bi bi-cart-check text-blue-300 text-sm" />
            </div>
            Purchase List
            <span className="text-[11px] font-semibold bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredPurchases.length} records
            </span>
          </h5>
          {can("purchases", "create") && (
            <Link
              to="/purchases/create"
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline shadow-sm hover:-translate-y-px hover:shadow-blue-500/30 hover:shadow-md"
            >
              <i className="bi bi-plus-circle-fill" />
              New Purchase
            </Link>
          )}
        </div>

        {/* Table Body */}
        <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
          {paginatedData.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                <i className="bi bi-cart-x text-4xl text-slate-300 dark:text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-600 dark:text-slate-400 m-0">
                  No Purchases Found
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 m-0">
                  Adjust the date filter or create a new purchase
                </p>
              </div>
              {can("purchases", "create") && (
                <Link
                  to="/purchases/create"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline transition-all duration-200 mt-1 hover:-translate-y-px shadow-sm"
                >
                  <i className="bi bi-plus-circle-fill" />
                  Create Purchase
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                      {[
                        "No",
                        "Invoice No",
                        "Supplier",
                        "Total",
                        "Paid",
                        "Due",
                        "Status",
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
                    {paginatedData.map((p, index) => (
                      <tr
                        key={p.id}
                        className="bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors duration-150 group"
                      >
                        {/* Row # */}
                        <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>

                        {/* Invoice No */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 px-2.5 py-1 rounded-lg text-[12.5px] transition-colors duration-150">
                            {p.purchase_no}
                          </span>
                        </td>

                        {/* Supplier */}
                        <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                          {p.supplier_name}
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100 text-[13px]">
                          ₹{" "}
                          {Number(p.total_amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[13px]">
                          ₹{" "}
                          {Number(p.paid_amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        {/* Due */}
                        <td className="px-4 py-3.5 font-bold text-[13px]">
                          <span
                            className={
                              Number(p.due_amount) > 0
                                ? "text-red-500 dark:text-red-400"
                                : "text-slate-400 dark:text-slate-500"
                            }
                          >
                            ₹{" "}
                            {Number(p.due_amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge due={Number(p.due_amount)} />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/purchases/${p.id}`}
                            className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-md hover:shadow-cyan-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 no-underline dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/60 dark:hover:bg-cyan-500 dark:hover:text-white dark:hover:shadow-cyan-900/30 hover:-translate-y-px"
                          >
                            <i className="bi bi-eye-fill" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
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
                    </span>{" "}
                    –{" "}
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredPurchases.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {filteredPurchases.length}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;

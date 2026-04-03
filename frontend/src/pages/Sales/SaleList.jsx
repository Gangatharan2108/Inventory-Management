import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { getSales, deleteSale } from "../../api/saleService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { usePermission } from "../../hooks/usePermission";

/* ══════════════════════════════════════════
   SHARED STYLE CONSTANTS
══════════════════════════════════════════ */
const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border text-sm font-medium",
  "bg-white text-slate-800 border-slate-200 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500",
  "transition-all duration-200",
  "dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600",
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

/* ── Payment Badge ── */
const PayBadge = ({ mode }) => {
  const map = {
    Cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
    "Credit Card":
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
    UPI: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/60",
    "Net Banking":
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/60",
  };
  const icons = {
    Cash: "bi-cash-stack",
    "Credit Card": "bi-credit-card",
    UPI: "bi-phone",
    "Net Banking": "bi-bank",
  };
  const cls =
    map[mode] ||
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${cls}`}
    >
      {icons[mode] && <i className={`bi ${icons[mode]} text-[10px]`} />}
      {mode || "Pending"}
    </span>
  );
};

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
      <p className="text-[20px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
        {value}
      </p>
    </div>
  </div>
);

/* ══════════════════════════════════════════
   SALE LIST COMPONENT
══════════════════════════════════════════ */
const SaleList = () => {
  const today = new Date().toISOString().split("T")[0];
  const { showToast } = useToast();
  const { can } = usePermission();

  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const showActionCol = can("sales", "view") || can("sales", "delete");

  /* ── Fetch ── */
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSales();
      setSales(res.data || []);
      setFilteredSales(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  /* ── Delete ── */
  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = async () => {
    try {
      await deleteSale(deleteId);
      showToast("Sale deleted successfully", "success");
      fetchSales();
    } catch {
      showToast("Failed to delete sale", "error");
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Filter ── */
  const handleGenerate = () => {
    const f = sales.filter((s) => {
      const sd = s.created_at.split("T")[0];
      return (
        sd >= startDate &&
        sd <= endDate &&
        (selectedCustomer === "" || s.customer_name === selectedCustomer)
      );
    });
    setFilteredSales(f);
    setCurrentPage(1);
  };
  const handleClear = () => {
    setStartDate(today);
    setEndDate(today);
    setSelectedCustomer("");
    setFilteredSales(sales);
    setCurrentPage(1);
  };

  /* ── Excel ── */
  const downloadExcel = () => {
    if (!filteredSales.length) return;
    const data = filteredSales.map((s) => ({
      Invoice_No: s.invoice_no,
      Date: new Date(s.created_at).toLocaleDateString(),
      Customer: s.customer_name || "Walk-in",
      Total_Amount: Number(s.total_amount).toFixed(2),
      Worker: s.worker_name,
      Payment_Mode: s.payment_mode || "Pending",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(data),
      "Sales Report",
    );
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `Sales_Report_${startDate}_to_${endDate}.xlsx`,
    );
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(s, s + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  /* ── Totals ── */
  const totalAmount = useMemo(
    () => filteredSales.reduce((s, x) => s + Number(x.total_amount), 0),
    [filteredSales],
  );
  const totalSalesCount = filteredSales.length;

  const customerOpts = useMemo(
    () =>
      Array.from(new Set(sales.map((s) => s.customer_name).filter(Boolean))),
    [sales],
  );

  /* ── Loading State ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading sales…
        </p>
      </div>
    );

  /* ── Error State ── */
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
    <>
      <div className="space-y-5">
        {/* ════ FILTER CARD ════ */}
        <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-colors duration-300">
          {/* Filter Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <i className="bi bi-funnel-fill text-blue-500 text-sm" />
            </div>
            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
              Filter Sales
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

              {/* Customer */}
              <div>
                <label className={labelCls}>
                  <i className="bi bi-person me-1.5 text-blue-500" />
                  Customer
                </label>
                <select
                  className={inputCls}
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">All Customers</option>
                  {customerOpts.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
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

            {/* Export */}
            <div className="flex justify-end mt-4">
              <button
                onClick={downloadExcel}
                disabled={filteredSales.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:border-emerald-700/60 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white dark:disabled:opacity-30"
              >
                <i className="bi bi-file-earmark-excel-fill" />
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* ════ KPI SUMMARY ════ */}
        {filteredSales.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              label="Total Revenue"
              value={`₹ ${totalAmount.toLocaleString("en-IN")}`}
              color="bg-gradient-to-br from-blue-500 to-blue-700"
              icon="bi bi-currency-rupee"
            />
            <KpiCard
              label="Total Sales"
              value={totalSalesCount}
              color="bg-gradient-to-br from-emerald-500 to-emerald-700"
              icon="bi bi-receipt-cutoff"
            />
          </div>
        )}

        {/* ════ TABLE CARD ════ */}
        <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
            <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2.5 m-0">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <i className="bi bi-receipt text-blue-300 text-sm" />
              </div>
              Sales List
              <span className="text-[11px] font-semibold bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10">
                {filteredSales.length} records
              </span>
            </h5>
            {can("sales", "create") && (
              <Link
                to="/sales/create"
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline shadow-sm hover:-translate-y-px hover:shadow-blue-500/30 hover:shadow-md"
              >
                <i className="bi bi-plus-circle-fill" />
                Create Sale
              </Link>
            )}
          </div>

          {/* Table Body */}
          <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
            {filteredSales.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <i className="bi bi-receipt text-4xl text-slate-300 dark:text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400 m-0">
                    No Sales Recorded
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 m-0">
                    Try adjusting the filters or create a new sale
                  </p>
                </div>
                {can("sales", "create") && (
                  <Link
                    to="/sales/create"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl no-underline transition-all duration-200 mt-1 hover:-translate-y-px shadow-sm"
                  >
                    <i className="bi bi-plus-circle-fill" />
                    Create Sale
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
                          "Customer",
                          "Total",
                          "Payment",
                          "Date",
                          ...(showActionCol ? ["Actions"] : []),
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
                      {paginatedData.map((sale, index) => (
                        <tr
                          key={sale.id}
                          className="bg-white dark:bg-slate-800 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors duration-150 group"
                        >
                          {/* # */}
                          <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>

                          {/* Invoice No */}
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 px-2.5 py-1 rounded-lg text-[12.5px] transition-colors duration-150">
                              {sale.invoice_no}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                            {sale.customer_name || (
                              <span className="text-slate-400 dark:text-slate-500 italic text-xs font-medium">
                                Walk-in
                              </span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">
                            ₹{" "}
                            {Number(sale.total_amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </td>

                          {/* Payment */}
                          <td className="px-4 py-3.5">
                            <PayBadge mode={sale.payment_mode} />
                          </td>

                          {/* Date */}
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                            {new Date(sale.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>

                          {/* Actions */}
                          {showActionCol && (
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                {can("sales", "view") && (
                                  <Link
                                    to={`/sales/${sale.id}`}
                                    className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-md hover:shadow-cyan-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 no-underline dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/60 dark:hover:bg-cyan-500 dark:hover:text-white hover:-translate-y-px"
                                  >
                                    <i className="bi bi-eye-fill" />
                                    View
                                  </Link>
                                )}
                                {can("sales", "delete") && (
                                  <button
                                    onClick={() => handleDelete(sale.id)}
                                    className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white hover:-translate-y-px"
                                  >
                                    <i className="bi bi-trash3-fill" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
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
                          filteredSales.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {filteredSales.length}
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
                            (page >= currentPage - 1 &&
                              page <= currentPage + 1);
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

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Confirm Delete"
        message="Are you sure you want to delete this sale? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
};

export default SaleList;

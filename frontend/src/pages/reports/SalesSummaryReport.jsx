import React, { useState, useEffect, useMemo } from "react";
import axios from "../../api/axios";
import ReportLayout from "./ReportLayout";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ITEMS_PER_PAGE = 10;

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

const inputCls = [
  "w-full h-[42px] rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600",
  "bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100",
  "px-3.5 text-sm font-medium placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
  "focus:bg-white dark:focus:bg-slate-700 transition-all duration-200",
].join(" ");
const labelCls =
  "block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5";

const KpiCard = ({ label, value, color, icon, sub }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
    <div
      className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <i className={`bi ${icon} text-white text-lg`} />
    </div>
    <div>
      <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-[20px] font-extrabold text-slate-800 dark:text-slate-100 leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
          {sub}
        </p>
      )}
    </div>
  </div>
);

const PaymentBadge = ({ mode }) => {
  const cfg = {
    Cash: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50",
      icon: "bi-cash-stack",
    },
    Credit: {
      cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700/50",
      icon: "bi-calendar-check",
    },
    Bank: {
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/50",
      icon: "bi-bank",
    },
    UPI: {
      cls: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/50",
      icon: "bi-phone",
    },
    "Credit Card": {
      cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/50",
      icon: "bi-credit-card",
    },
    "Net Banking": {
      cls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/50",
      icon: "bi-bank",
    },
  };
  const c = cfg[mode] || {
    cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600",
    icon: "bi-wallet2",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${c.cls}`}
    >
      <i className={`bi ${c.icon} text-[10px]`} />
      {mode || "Cash"}
    </span>
  );
};

const BAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#f59e0b",
  "#ea580c",
  "#0d9488",
  "#dc2626",
];

function SalesSummaryReport() {
  const today = new Date().toISOString().split("T")[0];
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [invoiceData, setInvoiceData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReport = async (from, to) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/reports/sales-summary/?start=${from}&end=${to}`,
      );
      const invoices = res.data.invoices || [];
      const products = res.data.products || [];
      setInvoiceData(invoices);
      setProductData(products);
      setCurrentPage(1);
      sessionStorage.setItem(
        "salesSummaryData",
        JSON.stringify({ start: from, end: to, invoices, products }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("salesSummaryData");
    if (stored) {
      const p = JSON.parse(stored);
      setStart(p.start);
      setEnd(p.end);
      setInvoiceData(p.invoices);
      setProductData(p.products);
    } else fetchReport(today, today);
  }, []);

  const handleClear = () => {
    sessionStorage.removeItem("salesSummaryData");
    setStart(today);
    setEnd(today);
    setShowChart(false);
    setCurrentPage(1);
    fetchReport(today, today);
  };

  const totalAmount = useMemo(
    () => invoiceData.reduce((s, r) => s + Number(r.total_price), 0),
    [invoiceData],
  );
  const totalInvoices = invoiceData.length;
  const avgOrderValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  const totalPages = Math.ceil(invoiceData.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return invoiceData.slice(s, s + ITEMS_PER_PAGE);
  }, [invoiceData, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const downloadExcel = () => {
    if (!invoiceData.length) return;
    const d = invoiceData.map((r) => ({
      Invoice_No: r.invoice_no,
      Date: new Date(r.date).toLocaleDateString(),
      Customer: r.customer_name,
      Total_Amount: r.total_price,
      Worker: r.worker_name,
      Payment_Mode: r.payment_mode,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(d),
      "Sales Report",
    );
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      `Sales_Report_${start}_to_${end}.xlsx`,
    );
  };

  return (
    <ReportLayout
      title="Sales Summary Report"
      icon="bi-graph-up-arrow"
      subtitle={start === end ? start : `${start} → ${end}`}
    >
      {/* Filter */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700/60 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <i className="bi bi-funnel-fill text-blue-500 text-sm" />
          </div>
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
            Filter Report
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className={labelCls}>
              <i className="bi bi-calendar3 me-1.5 text-blue-500" />
              From Date
            </label>
            <input
              type="date"
              className={inputCls}
              value={start}
              max={today}
              onChange={(e) => setStart(e.target.value)}
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
              value={end}
              max={today}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchReport(start, end)}
            className="flex items-center justify-center gap-2 h-[42px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200"
          >
            <i className="bi bi-search" /> Generate
          </button>
          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-2 h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-white dark:hover:bg-slate-700/60 transition-all duration-200"
          >
            <i className="bi bi-arrow-clockwise" /> Clear
          </button>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={downloadExcel}
            disabled={!invoiceData.length}
            className="flex items-center gap-2 h-[38px] px-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="bi bi-file-earmark-excel-fill" /> Export Excel
          </button>
        </div>
      </div>

      {invoiceData.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <KpiCard
              label="Total Sales"
              value={`₹ ${totalAmount.toLocaleString("en-IN")}`}
              color="bg-gradient-to-br from-blue-500 to-blue-700"
              icon="bi-currency-rupee"
              sub={start === end ? "Today" : "Selected period"}
            />
            <KpiCard
              label="Total Invoices"
              value={totalInvoices}
              color="bg-gradient-to-br from-indigo-500 to-indigo-700"
              icon="bi-receipt-cutoff"
              sub="Bills generated"
            />
            <KpiCard
              label="Avg Order Value"
              value={`₹ ${avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
              color="bg-gradient-to-br from-violet-500 to-violet-700"
              icon="bi-graph-up-arrow"
              sub="Per invoice"
            />
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setShowChart((s) => !s);
                setCurrentPage(1);
              }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-px shadow-sm"
            >
              <i
                className={`bi ${showChart ? "bi-table" : "bi-bar-chart-fill"} text-[12px]`}
              />
              {showChart ? "Show Table" : "Show Chart"}
            </button>
          </div>
        </>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Loading report…
          </p>
        </div>
      ) : showChart ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 p-6">
          <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-5">
            Product-wise Sales
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={productData}
              margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="product_name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "none",
                  borderRadius: 12,
                  color: "#f1f5f9",
                  fontSize: 12,
                }}
                formatter={(v) => [
                  `₹ ${Number(v).toLocaleString("en-IN")}`,
                  "Total Sales",
                ]}
              />
              <Bar dataKey="total_price" radius={[6, 6, 0, 0]}>
                {productData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
                  {[
                    "#",
                    "Invoice",
                    "Date",
                    "Customer",
                    "Total",
                    "Worker",
                    "Payment",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-[11px] uppercase tracking-wider font-bold text-slate-300 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {invoiceData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                          <i className="bi bi-inbox text-2xl text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-400 m-0">
                          No sales found. Generate a report using the filters
                          above.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, i) => (
                    <tr
                      key={i}
                      className={`transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 group ${i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"}`}
                    >
                      <td className="px-4 py-3.5 text-[12px] font-bold text-slate-400 w-10">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-slate-600 px-2.5 py-1 rounded-lg text-[12.5px] transition-colors">
                          {row.invoice_no}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                        {row.customer_name}
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-blue-600 dark:text-blue-400 text-[13px]">
                        ₹ {Number(row.total_price).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-[13px] font-medium">
                        {row.worker_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentBadge mode={row.payment_mode} />
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/sales/${row.sale_id}`}
                          className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 hover:shadow-md px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 no-underline dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-700/60 dark:hover:bg-cyan-500 dark:hover:text-white hover:-translate-y-px"
                        >
                          <i className="bi bi-eye-fill" /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {invoiceData.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
                    <td
                      colSpan={4}
                      className="px-4 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide"
                    >
                      Total — {totalInvoices} invoices
                    </td>
                    <td className="px-4 py-3.5 text-[15px] font-extrabold text-blue-600 dark:text-blue-400">
                      ₹ {totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/50">
              <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-medium">
                Showing{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                –{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {Math.min(currentPage * ITEMS_PER_PAGE, invoiceData.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {invoiceData.length}
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
      )}
    </ReportLayout>
  );
}

export default SalesSummaryReport;

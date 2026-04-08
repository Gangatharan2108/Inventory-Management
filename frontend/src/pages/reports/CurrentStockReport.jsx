import React, { useEffect, useState, useMemo } from "react";
import axios from "../../api/axios";
import ReportLayout from "./ReportLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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

const StockQtyCell = ({ row }) => {
  const hasSubUnit = Boolean(row.sub_unit_short_name);
  const [showBase, setShowBase] = useState(true);
  if (!hasSubUnit)
    return (
      <span className="font-bold text-slate-800 dark:text-slate-100">
        {Number(row.available_quantity).toLocaleString("en-IN")}
        <span className="text-[11px] text-slate-400 ml-1 font-medium">
          {row.unit}
        </span>
      </span>
    );
  const cf = Number(row.conversion_factor) || 1;
  const baseQty = Number(row.available_quantity) || 0;
  const subQty = +(baseQty * cf).toFixed(2);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-bold text-slate-800 dark:text-slate-100">
        {showBase
          ? `${Number(baseQty).toLocaleString("en-IN")} ${row.unit}`
          : `${Number(subQty).toLocaleString("en-IN")} ${row.sub_unit_short_name}`}
      </span>
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 text-[10px] font-bold w-fit">
        <button
          type="button"
          onClick={() => setShowBase(true)}
          className={`px-2 py-0.5 transition-colors ${showBase ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500"}`}
        >
          {row.unit}
        </button>
        <button
          type="button"
          onClick={() => setShowBase(false)}
          className={`px-2 py-0.5 transition-colors ${!showBase ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500"}`}
        >
          {row.sub_unit_short_name}
        </button>
      </div>
    </div>
  );
};

const StockBar = ({ qty, reorder, maxStock }) => {
  const pct = maxStock > 0 ? Math.min((qty / maxStock) * 100, 100) : 0;
  const isLow = qty <= reorder;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-semibold mb-1">
        <span className={isLow ? "text-red-500" : "text-slate-500"}>
          {pct.toFixed(0)}%
        </span>
        <span className="text-slate-400">max {maxStock}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? "bg-red-500" : pct >= 70 ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const StatusBadge = ({ qty, reorder }) => {
  const isLow = Number(qty) <= Number(reorder);
  return isLow ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
      Low Stock
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Available
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

function CurrentStockReport() {
  const [data, setData] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios
      .get("/reports/current-stock/")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter(
      (r) =>
        r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.category?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(s, s + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const totalProducts = data.length;
  const totalStockValue = useMemo(
    () => data.reduce((a, i) => a + Number(i.stock_value || 0), 0),
    [data],
  );
  const lowStockCount = useMemo(
    () =>
      data.filter(
        (i) => Number(i.available_quantity) <= Number(i.reorder_level),
      ).length,
    [data],
  );
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => Number(b.stock_value) - Number(a.stock_value))
        .slice(0, 12),
    [data],
  );

  return (
    <ReportLayout
      title="Current Stock Report"
      icon="bi-clipboard-data-fill"
      subtitle={`${totalProducts} products`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Total Products"
          value={totalProducts}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          icon="bi-boxes"
          sub="In inventory"
        />
        <KpiCard
          label="Total Stock Value"
          value={`₹ ${totalStockValue.toLocaleString("en-IN")}`}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icon="bi-currency-rupee"
          sub="At cost price"
        />
        <KpiCard
          label="Low Stock Items"
          value={lowStockCount}
          color={
            lowStockCount > 0
              ? "bg-gradient-to-br from-rose-500 to-rose-700"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }
          icon="bi-exclamation-triangle-fill"
          sub={lowStockCount > 0 ? "Needs reorder" : "All good"}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]" />
          <input
            type="text"
            placeholder="Search product or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() =>
            setViewMode((v) => (v === "table" ? "chart" : "table"))
          }
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-px shadow-sm shrink-0"
        >
          <i
            className={`bi ${viewMode === "table" ? "bi-bar-chart-fill" : "bi-table"} text-[12px]`}
          />
          {viewMode === "table" ? "View Chart" : "View Table"}
        </button>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
                  {[
                    "#",
                    "Product",
                    "Category",
                    "Stock",
                    "Reorder",
                    "Fill Level",
                    "Status",
                    "Value (₹)",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className={`px-5 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-300 whitespace-nowrap ${h === "Value (₹)" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {paginated.length > 0 ? (
                  paginated.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 ${idx % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"}`}
                    >
                      <td className="px-5 py-3.5 text-[12px] font-bold text-slate-400 w-10">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-bold text-slate-800 dark:text-slate-100">
                        {row.product_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {row.category || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StockQtyCell row={row} />
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                        {row.reorder_level}
                        <span className="text-[11px] text-slate-400 ml-1">
                          {row.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-28">
                        <StockBar
                          qty={Number(row.available_quantity)}
                          reorder={Number(row.reorder_level)}
                          maxStock={Number(row.maximum_stock || 100)}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          qty={row.available_quantity}
                          reorder={row.reorder_level}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                        ₹ {Number(row.stock_value).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                          <i className="bi bi-inbox text-2xl text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-400 m-0">
                          {search
                            ? "No products match your search"
                            : "No stock data available"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
                    <td
                      colSpan={7}
                      className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide"
                    >
                      Total — {filtered.length} products
                    </td>
                    <td className="px-5 py-3.5 text-right text-[15px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{" "}
                      {filtered
                        .reduce((s, r) => s + Number(r.stock_value || 0), 0)
                        .toLocaleString("en-IN")}
                    </td>
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
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {filtered.length}
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
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 p-6">
          <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-5">
            Top Products by Stock Value
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={chartData}
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
                itemStyle={{ color: "#22c55e" }}
                formatter={(v) => [
                  `₹ ${Number(v).toLocaleString("en-IN")}`,
                  "Stock Value",
                ]}
              />
              <Bar dataKey="stock_value" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportLayout>
  );
}

export default CurrentStockReport;

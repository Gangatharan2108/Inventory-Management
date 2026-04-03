import React, { useEffect, useState, useMemo } from "react";
import axios from "../../api/axios";
import ReportLayout from "./ReportLayout";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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

const SeverityBadge = ({ current, minimum }) => {
  const pct = minimum > 0 ? (current / minimum) * 100 : 100;
  if (pct === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700/60">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse inline-block" />
        Out of Stock
      </span>
    );
  if (pct < 30)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/50">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
        Critical
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      Low
    </span>
  );
};

const StockGauge = ({ current, minimum }) => {
  const pct = minimum > 0 ? Math.min((current / minimum) * 100, 100) : 0;
  const need = Math.max(minimum - current, 0);
  return (
    <div className="w-28">
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-1">
        <div
          className={`h-full rounded-full ${pct === 0 ? "bg-red-600" : pct < 30 ? "bg-rose-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 font-medium">
        Need <span className="font-bold text-rose-500">{need}</span> more
      </p>
    </div>
  );
};

function LowStockReport() {
  const [data, setData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    axios
      .get("/reports/low-stock/")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((r) =>
      r.product_name?.toLowerCase().includes(search.toLowerCase()),
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

  const totalLowStock = data.length;
  const outOfStock = data.filter(
    (r) => Number(r.current_quantity) === 0,
  ).length;
  const critical = data.filter((r) => {
    const pct =
      Number(r.minimum_quantity) > 0
        ? (Number(r.current_quantity) / Number(r.minimum_quantity)) * 100
        : 100;
    return pct > 0 && pct < 30;
  }).length;

  return (
    <ReportLayout
      title="Low Stock Report"
      icon="bi-exclamation-triangle-fill"
      subtitle={`${totalLowStock} products need attention`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Low Stock Products"
          value={totalLowStock}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          icon="bi-exclamation-triangle-fill"
          sub="Below minimum level"
        />
        <KpiCard
          label="Critical / Out of Stock"
          value={outOfStock + critical}
          color={
            outOfStock + critical > 0
              ? "bg-gradient-to-br from-rose-500 to-rose-700"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }
          icon="bi-x-circle-fill"
          sub={`${outOfStock} out of stock, ${critical} critical`}
        />
        <KpiCard
          label="Total Current Qty"
          value={data
            .reduce((a, i) => a + Number(i.current_quantity || 0), 0)
            .toLocaleString("en-IN")}
          color="bg-gradient-to-br from-slate-600 to-slate-800"
          icon="bi-archive-fill"
          sub="Across all low-stock items"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]" />
          <input
            type="text"
            placeholder="Search product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button
          onClick={() => {
            setShowChart((s) => !s);
            setCurrentPage(1);
          }}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-px shadow-sm shrink-0"
        >
          <i
            className={`bi ${showChart ? "bi-table" : "bi-bar-chart-fill"} text-[12px]`}
          />
          {showChart ? "View Table" : "View Chart"}
        </button>
      </div>

      {!showChart ? (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
                  {[
                    "#",
                    "Product",
                    "Current Qty",
                    "Minimum Qty",
                    "Stock Level",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wider font-bold text-slate-300 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        {data.length === 0 ? (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                              <i className="bi bi-check-all text-2xl text-emerald-500" />
                            </div>
                            <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 m-0">
                              All products are well stocked!
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                              <i className="bi bi-search text-2xl text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-[13px] font-semibold text-slate-400 m-0">
                              No products match your search
                            </p>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, i) => (
                    <tr
                      key={i}
                      className={`transition-colors duration-150 hover:bg-amber-50/40 dark:hover:bg-slate-700/40 ${i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"}`}
                    >
                      <td className="px-5 py-4 text-[12px] font-bold text-slate-400 w-10">
                        {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-100 text-[13px]">
                        {row.product_name}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[14px] font-extrabold ${Number(row.current_quantity) === 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}
                        >
                          {Number(row.current_quantity).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                        {Number(row.minimum_quantity).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <StockGauge
                          current={Number(row.current_quantity)}
                          minimum={Number(row.minimum_quantity)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <SeverityBadge
                          current={Number(row.current_quantity)}
                          minimum={Number(row.minimum_quantity)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
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
          <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-1">
            Current vs Minimum Stock
          </p>
          <p className="text-[12px] text-slate-400 mb-5">
            Items below the required minimum quantity
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="product_name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                angle={-40}
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
              />
              <Legend />
              <Bar
                dataKey="current_quantity"
                name="Current Qty"
                fill="#f59e0b"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="minimum_quantity"
                name="Minimum Qty"
                fill="#dc2626"
                radius={[5, 5, 0, 0]}
                opacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ReportLayout>
  );
}

export default LowStockReport;

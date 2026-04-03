import React, { useEffect, useState, useMemo } from "react";
import axios from "../../api/axios";
import ReportLayout from "./ReportLayout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
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

const CollectionBar = ({ paid, total }) => {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  return (
    <div className="w-32">
      <div className="flex justify-between text-[10px] font-semibold mb-1">
        <span className="text-slate-400">{pct.toFixed(0)}% collected</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ea580c",
  "#0d9488",
];
const fmt = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;

function CustomerOutstandingReport() {
  const [data, setData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/reports/customer-outstanding/");
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const summary = useMemo(() => {
    let totalBill = 0,
      totalPaid = 0,
      totalBalance = 0;
    data.forEach((i) => {
      totalBill += Number(i.total_bill);
      totalPaid += Number(i.paid);
      totalBalance += Number(i.balance);
    });
    return { totalBill, totalPaid, totalBalance };
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    return data.filter((r) =>
      r.customer_name?.toLowerCase().includes(search.toLowerCase()),
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

  // Chart: show total_bill for ALL customers — always has data whenever customers exist
  // Shows billing share per customer (not filtered by balance to avoid empty chart)
  const pieData = useMemo(
    () =>
      data
        .filter((i) => Number(i.total_bill) > 0)
        .map((i) => ({
          name: i.customer_name || "Walk-in",
          value: Number(i.total_bill),
        })),
    [data],
  );

  return (
    <ReportLayout
      title="Customer Outstanding Report"
      icon="bi-wallet2"
      loading={loading}
    >
      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard
            label="Total Billing"
            value={fmt(summary.totalBill)}
            color="bg-gradient-to-br from-blue-500 to-blue-700"
            icon="bi-receipt-cutoff"
            sub="All customer bills"
          />
          <KpiCard
            label="Amount Collected"
            value={fmt(summary.totalPaid)}
            color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            icon="bi-check-circle-fill"
            sub="Payments received"
          />
          <KpiCard
            label="Net Outstanding"
            value={fmt(summary.totalBalance)}
            color={
              summary.totalBalance > 0
                ? "bg-gradient-to-br from-rose-500 to-rose-700"
                : "bg-gradient-to-br from-emerald-500 to-emerald-700"
            }
            icon={
              summary.totalBalance > 0
                ? "bi-exclamation-circle-fill"
                : "bi-check-all"
            }
            sub={
              summary.totalBalance > 0
                ? "Pending collection"
                : "Fully collected"
            }
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]" />
          <input
            type="text"
            placeholder="Search customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        {data.length > 0 && (
          <button
            onClick={() => setShowChart((s) => !s)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-[13px] font-bold transition-all duration-200 hover:-translate-y-px shadow-sm shrink-0"
          >
            <i
              className={`bi ${showChart ? "bi-table" : "bi-pie-chart-fill"} text-[12px]`}
            />
            {showChart ? "Show Table" : "Show Chart"}
          </button>
        )}
      </div>

      {/* PIE CHART — shows total_bill share per customer (always renders when data exists) */}
      {showChart ? (
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 p-6">
          <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-1">
            Customer Billing Distribution
          </p>
          <p className="text-[12px] text-slate-400 mb-5">
            Total bill share by customer
          </p>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                <i className="bi bi-pie-chart text-2xl text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                No billing data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={140}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    percent > 0.04
                      ? `${name} (${(percent * 100).toFixed(0)}%)`
                      : ""
                  }
                  labelLine={true}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "none",
                    borderRadius: 12,
                    color: "#f1f5f9",
                    fontSize: 12,
                  }}
                  formatter={(v, name) => [fmt(v), name]}
                  labelFormatter={() => "Total Bill"}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 dark:from-slate-900 dark:to-slate-800">
                  {[
                    "#",
                    "Customer",
                    "Total Bill",
                    "Collected",
                    "Collection %",
                    "Balance",
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
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                          <i className="bi bi-people text-2xl text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-400 m-0">
                          {search
                            ? "No customers match your search"
                            : "No Data Available"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, i) => {
                    const fullyPaid = Number(row.balance) === 0;
                    return (
                      <tr
                        key={i}
                        className={`transition-colors duration-150 hover:bg-blue-50/40 dark:hover:bg-slate-700/40 ${i % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50/50 dark:bg-slate-800/50"}`}
                      >
                        <td className="px-5 py-4 text-[12px] font-bold text-slate-400 w-10">
                          {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
                              <span className="text-white text-[11px] font-extrabold">
                                {(row.customer_name || "W")[0].toUpperCase()}
                              </span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">
                              {row.customer_name || "Walk-in"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200 text-[13px]">
                          {fmt(row.total_bill)}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">
                          {fmt(row.paid)}
                        </td>
                        <td className="px-5 py-4">
                          <CollectionBar
                            paid={Number(row.paid)}
                            total={Number(row.total_bill)}
                          />
                        </td>
                        <td className="px-5 py-4">
                          {fullyPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
                              <i className="bi bi-check-circle-fill text-[10px]" />{" "}
                              Cleared
                            </span>
                          ) : (
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 text-[14px]">
                              {fmt(row.balance)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-t-2 border-slate-200 dark:border-slate-600">
                    <td
                      colSpan={2}
                      className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wide"
                    >
                      Total — {filtered.length} customers
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-700 dark:text-slate-200 text-[14px]">
                      {fmt(
                        filtered.reduce((s, r) => s + Number(r.total_bill), 0),
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-[14px]">
                      {fmt(filtered.reduce((s, r) => s + Number(r.paid), 0))}
                    </td>
                    <td />
                    <td className="px-5 py-3.5 font-extrabold text-rose-600 dark:text-rose-400 text-[14px]">
                      {fmt(filtered.reduce((s, r) => s + Number(r.balance), 0))}
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
      )}
    </ReportLayout>
  );
}

export default CustomerOutstandingReport;

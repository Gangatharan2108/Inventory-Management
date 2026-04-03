import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  Legend as PieLegend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
} from "recharts";
import ReportLayout from "./ReportLayout";

/* SaleList-style KPI card */
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

const MetricRow = ({ label, value, color, icon, borderTop }) => (
  <div
    className={`flex items-center justify-between py-4 ${borderTop ? "border-t-2 border-slate-200 dark:border-slate-600 mt-1" : "border-b border-slate-100 dark:border-slate-700/60 last:border-0"}`}
  >
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace("text-", "bg-").replace("600", "100").replace("400", "900/20")}`}
      >
        <i className={`bi ${icon} ${color} text-sm`} />
      </div>
      <span className="text-[14px] font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </div>
    <span className={`text-[16px] font-extrabold ${color}`}>
      ₹ {Number(value || 0).toLocaleString("en-IN")}
    </span>
  </div>
);

const CHART_STYLE = {
  contentStyle: {
    background: "#1e293b",
    border: "none",
    borderRadius: 12,
    color: "#f1f5f9",
    fontSize: 12,
  },
};

function ProfitLossReport() {
  const [data, setData] = useState(null);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    axios
      .get("/reports/profit-loss/")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data)
    return (
      <ReportLayout title="Profit & Loss Report" icon="bi-currency-rupee">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading…
          </p>
        </div>
      </ReportLayout>
    );

  const isProfit = data.profit >= 0;
  const profitAmt = data.profit >= 0 ? data.profit : 0;
  const lossAmt = data.profit < 0 ? Math.abs(data.profit) : 0;
  const margin =
    data.total_sales > 0
      ? ((profitAmt / data.total_sales) * 100).toFixed(1)
      : 0;

  const pieData = [
    { name: "Total Sales", value: data.total_sales },
    { name: "Total Purchase", value: data.total_purchase },
  ];
  const pieColors = ["#2563eb", "#f59e0b"];
  const barData = [
    { name: "Sales", value: data.total_sales, fill: "#2563eb" },
    { name: "Purchase", value: data.total_purchase, fill: "#f59e0b" },
    {
      name: isProfit ? "Profit" : "Loss",
      value: isProfit ? profitAmt : lossAmt,
      fill: isProfit ? "#16a34a" : "#dc2626",
    },
  ];

  return (
    <ReportLayout title="Profit & Loss Report" icon="bi-currency-rupee">
      {/* KPI — SaleList style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Sales"
          value={`₹ ${Number(data.total_sales).toLocaleString("en-IN")}`}
          color="bg-gradient-to-br from-blue-500 to-blue-700"
          icon="bi-graph-up-arrow"
          sub="All time revenue"
        />
        <KpiCard
          label="Total Purchase"
          value={`₹ ${Number(data.total_purchase).toLocaleString("en-IN")}`}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          icon="bi-cart-fill"
          sub="All time purchases"
        />
        <KpiCard
          label={isProfit ? "Net Profit" : "Net Loss"}
          value={`₹ ${Number(isProfit ? profitAmt : lossAmt).toLocaleString("en-IN")}`}
          color={
            isProfit
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
              : "bg-gradient-to-br from-rose-500 to-rose-700"
          }
          icon={isProfit ? "bi-trending-up" : "bi-trending-down"}
          sub={isProfit ? "You're in profit" : "Running at a loss"}
        />
        <KpiCard
          label="Profit Margin"
          value={`${margin}%`}
          color={
            isProfit
              ? "bg-gradient-to-br from-violet-500 to-violet-700"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }
          icon="bi-percent"
          sub="Net / total sales"
        />
      </div>

      {/* Result banner */}
      <div
        className={`rounded-2xl p-4 mb-6 flex items-center gap-3 border ${isProfit ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/60" : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/60"}`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isProfit ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"}`}
        >
          <i
            className={`bi ${isProfit ? "bi-graph-up-arrow text-emerald-600 dark:text-emerald-400" : "bi-graph-down-arrow text-rose-600 dark:text-rose-400"} text-lg`}
          />
        </div>
        <div>
          <p
            className={`text-[14px] font-extrabold m-0 ${isProfit ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
          >
            {isProfit
              ? `You are currently in profit by ₹ ${Number(profitAmt).toLocaleString("en-IN")}`
              : `You are currently at a loss of ₹ ${Number(lossAmt).toLocaleString("en-IN")}`}
          </p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 m-0 mt-0.5 font-medium">
            {isProfit
              ? `Profit margin is ${margin}% — Sales exceed purchases.`
              : "Purchase costs exceed sales revenue. Review pricing or reduce costs."}
          </p>
        </div>
      </div>

      {/* Toggle charts */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setShowCharts((p) => !p)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-blue-200 dark:border-blue-700/60 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[13px] font-bold transition-all duration-200 hover:-translate-y-px"
        >
          <i
            className={`bi ${showCharts ? "bi-eye-slash" : "bi-bar-chart-fill"} text-[12px]`}
          />
          {showCharts ? "Hide Charts" : "Show Charts"}
        </button>
      </div>

      {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 p-5">
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-1">
              Sales vs Purchase
            </p>
            <p className="text-[12px] text-slate-400 mb-4">
              Revenue vs cost distribution
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ name, percent }) =>
                    `${name.split(" ")[1]}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i]} />
                  ))}
                </Pie>
                <PieTooltip
                  {...CHART_STYLE}
                  formatter={(v, n) => [
                    `₹ ${Number(v).toLocaleString("en-IN")}`,
                    n,
                  ]}
                />
                <PieLegend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 p-5">
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-1">
              Financial Overview
            </p>
            <p className="text-[12px] text-slate-400 mb-4">
              Sales, Purchase & {isProfit ? "Profit" : "Loss"} comparison
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barData}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <BarTooltip
                  {...CHART_STYLE}
                  formatter={(v) => `₹ ${Number(v).toLocaleString("en-IN")}`}
                />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  minPointSize={2}
                  label={{
                    position: "top",
                    formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                >
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 px-6 py-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 pt-4 pb-2">
          Summary Breakdown
        </p>
        <MetricRow
          label="Total Sales Revenue"
          value={data.total_sales}
          color="text-blue-600 dark:text-blue-400"
          icon="bi-graph-up-arrow"
        />
        <MetricRow
          label="Total Purchase Cost"
          value={data.total_purchase}
          color="text-amber-600 dark:text-amber-400"
          icon="bi-cart-fill"
        />
        <MetricRow
          label="Net Profit"
          value={profitAmt}
          color="text-emerald-600 dark:text-emerald-400"
          icon="bi-check-circle-fill"
          borderTop
        />
        <MetricRow
          label="Net Loss"
          value={lossAmt}
          color="text-rose-600 dark:text-rose-400"
          icon="bi-x-circle-fill"
        />
      </div>
    </ReportLayout>
  );
}

export default ProfitLossReport;

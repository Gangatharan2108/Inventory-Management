import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../api/axios";

/* ── Per-item qty cell with base/sub unit toggle ── */
const ItemQtyCell = ({ item }) => {
  const cf = Number(item.conversion_factor) || 1;
  const hasSubUnit = Boolean(item.sub_unit_short_name);
  // Default to sub-unit display when available (mirrors SaleForm behaviour)
  const [showSub, setShowSub] = useState(hasSubUnit);

  if (!hasSubUnit) {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[12px] px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-700/40">
        {Number(item.quantity).toLocaleString("en-IN")}
        <span className="opacity-60 font-semibold">{item.unit_short_name}</span>
      </span>
    );
  }

  const baseQty = Number(item.quantity);
  const subQty = +(baseQty * cf).toFixed(4);

  const displayQty = showSub ? subQty : baseQty;
  const displayUnit = showSub ? item.sub_unit_short_name : item.unit_short_name;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[12px] px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-700/40">
        {Number(displayQty).toLocaleString("en-IN")}
        <span className="opacity-60 font-semibold">{displayUnit}</span>
      </span>
      {/* Unit toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setShowSub(true)}
          className={`px-2 py-0.5 transition-colors ${showSub ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"}`}
        >
          {item.sub_unit_short_name}
        </button>
        <button
          type="button"
          onClick={() => setShowSub(false)}
          className={`px-2 py-0.5 transition-colors ${!showSub ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"}`}
        >
          {item.unit_short_name}
        </button>
      </div>
      {/* Conversion hint */}
      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
        1 {item.unit_short_name} = {cf} {item.sub_unit_short_name}
      </p>
    </div>
  );
};

/* ══════════════════════════════════════════
   SALE DETAIL COMPONENT
══════════════════════════════════════════ */
const SaleDetail = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    const res = await axios.get(`/sales/${id}/`);
    setSale(res.data);
  };

  /* ── Loading State ── */
  if (!sale)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading sale details…
        </p>
      </div>
    );

  /* ── Derived values ── */
  const total = Number(sale.total_amount || 0);

  const saleDate = new Date(sale.created_at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  /* ── Payment badge colours ── */
  const payMap = {
    Cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
    "Credit Card":
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
    UPI: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/60",
    "Net Banking":
      "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/60",
    Credit:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/60",
  };
  const payCls =
    payMap[sale.payment_mode] ||
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600";

  const payIcons = {
    Cash: "bi-cash-stack",
    "Credit Card": "bi-credit-card",
    UPI: "bi-phone",
    "Net Banking": "bi-bank",
    Credit: "bi-calendar-check",
  };
  const payIcon = payIcons[sale.payment_mode] || "bi-wallet2";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ════ INVOICE HEADER CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
        {/* Top Gradient Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <i className="bi bi-receipt-cutoff text-blue-300 text-lg" />
            </div>
            <div>
              <h5 className="text-white font-extrabold text-[16px] tracking-wide m-0 leading-none">
                Sales Invoice
              </h5>
              <p className="text-blue-300 text-[13px] mt-1 m-0 font-bold tracking-wide">
                # {sale.invoice_no}
              </p>
            </div>
          </div>
          <Link
            to="/reports/sales-summary"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white/70 text-[13px] font-semibold hover:bg-white/10 hover:text-white transition-all duration-200 no-underline"
          >
            <i className="bi bi-arrow-left" />
            Back
          </Link>
        </div>

        {/* Info Grid */}
        <div className="bg-white dark:bg-slate-800 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 transition-colors duration-300">
          {/* ── Customer Info Card ── */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-700/20 p-5 transition-colors duration-300">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <i className="bi bi-person-fill text-blue-500 text-[13px]" />
              </div>
              <span className="text-[11.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Customer Information
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Customer
                </span>
                <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 text-right">
                  {sale.customer_name || (
                    <span className="italic text-slate-400 dark:text-slate-500 font-medium text-sm">
                      Walk-in
                    </span>
                  )}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Worker
                </span>
                <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100 text-right">
                  {sale.worker_name || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Sale Details Card ── */}
          <div className="rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-700/20 p-5 transition-colors duration-300">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <i className="bi bi-info-circle-fill text-emerald-500 text-[13px]" />
              </div>
              <span className="text-[11.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Sale Details
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Date
                </span>
                <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 text-right">
                  {saleDate}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Payment Mode
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-3 py-1.5 rounded-full border ${payCls}`}
                >
                  <i className={`bi ${payIcon} text-xs`} />
                  {sale.payment_mode || "—"}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11.5px] font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════ ITEMS TABLE CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
        {/* Table Header */}
        <div className="bg-white dark:bg-slate-800 px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700/70 flex items-center gap-2.5 transition-colors duration-300">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <i className="bi bi-cart3 text-indigo-500 text-sm" />
          </div>
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
            Sold Products
          </span>
          <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
            {sale.items?.length} item{sale.items?.length !== 1 ? "s" : ""}
          </span>
          {/* Unit hint */}
          {sale.items?.some((i) => i.sub_unit_short_name) && (
            <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
              <i className="bi bi-info-circle text-[10px]" />
              Click unit badges to toggle display unit
            </span>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 overflow-x-auto transition-colors duration-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                {["#", "Product", "Qty", "Unit Price", "Total"].map((h, i) => (
                  <th
                    key={h}
                    className={[
                      "px-5 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400",
                      i >= 2 ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {sale.items?.map((item, index) => (
                <tr
                  key={index}
                  className="bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150"
                >
                  {/* # */}
                  <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-semibold w-12 text-[13px]">
                    {index + 1}
                  </td>

                  {/* Product */}
                  <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-100 text-[13.5px]">
                    {item.product_name}
                  </td>

                  {/* Qty — shows with unit toggle if sub_unit exists */}
                  <td className="px-5 py-4 text-right">
                    <ItemQtyCell item={item} />
                  </td>

                  {/* Unit Price */}
                  <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300 font-semibold text-[13px]">
                    ₹{" "}
                    {Number(item.per_item_price).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  {/* Line Total */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[14px]">
                      ₹{" "}
                      {Number(item.total_price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Total Row ── */}
        <div className="bg-white dark:bg-slate-800 px-6 py-5 border-t border-slate-100 dark:border-slate-700/70 transition-colors duration-300">
          <div className="flex items-center justify-end gap-5">
            <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
              Total Amount
            </span>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-2xl px-6 py-3 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
              <span className="text-[22px] font-black text-white tracking-tight">
                ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;

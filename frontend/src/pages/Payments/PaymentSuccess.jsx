import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const confettiRef = useRef(false);

  const isSale = state?.type === "sale";
  const amount = state?.amount ?? 0;
  const partyName = state?.customer || state?.supplier || "—";
  const refNo = state?.invoiceNo || state?.purchaseNo || "—";
  const paymentMode = state?.paymentMode || "Cash";
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Redirect if opened directly without state
  useEffect(() => {
    if (!state) navigate("/dashboard", { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const modeIcons = {
    Cash: "bi-cash-stack",
    "Credit Card": "bi-credit-card",
    UPI: "bi-phone",
    "Net Banking": "bi-bank",
    Bank: "bi-bank",
    Credit: "bi-credit-card",
  };
  const modeIcon = modeIcons[paymentMode] || "bi-wallet2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl ${
            isSale
              ? "bg-emerald-400 dark:bg-emerald-600"
              : "bg-violet-400 dark:bg-violet-600"
          }`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl ${
            isSale
              ? "bg-teal-400 dark:bg-teal-600"
              : "bg-indigo-400 dark:bg-indigo-600"
          }`}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Main Card ── */}
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/50 border border-white/60 dark:border-slate-700/60 backdrop-blur-sm bg-white/90 dark:bg-slate-800/90">
          {/* Header gradient */}
          <div
            className={`relative px-8 pt-10 pb-8 text-center ${
              isSale
                ? "bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500"
                : "bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500"
            }`}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full bg-white/5 translate-x-1/2 translate-y-1/2" />

            {/* Success Icon */}
            <div className="relative mx-auto mb-5 w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center shadow-lg shadow-black/10">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md">
                <i
                  className={`bi bi-check-lg text-3xl font-black ${
                    isSale ? "text-emerald-500" : "text-violet-500"
                  }`}
                />
              </div>
            </div>

            <h1 className="text-white text-2xl font-black tracking-tight mb-1">
              Payment Successful!
            </h1>
            <p className="text-white/75 text-sm font-medium">
              {isSale
                ? "Sale invoice has been created"
                : "Purchase order has been recorded"}
            </p>

            {/* Amount pill */}
            <div className="mt-5 inline-flex items-baseline gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-3">
              <span className="text-white/80 text-lg font-bold">₹</span>
              <span className="text-white text-4xl font-black tracking-tight">
                {Number(amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* ── Details Section ── */}
          <div className="px-8 py-7 space-y-4">
            {/* Info rows */}
            {[
              {
                icon: isSale ? "bi-receipt-cutoff" : "bi-box-seam",
                label: isSale ? "Invoice No." : "Purchase No.",
                value: refNo,
                mono: true,
              },
              {
                icon: isSale ? "bi-person-check" : "bi-truck",
                label: isSale ? "Customer" : "Supplier",
                value: partyName,
              },
              {
                icon: modeIcon,
                label: "Payment Mode",
                value: paymentMode,
                badge: true,
              },
              {
                icon: "bi-calendar3",
                label: "Date",
                value: date,
              },
            ].map(({ icon, label, value, mono, badge }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSale
                        ? "bg-emerald-50 dark:bg-emerald-900/30"
                        : "bg-violet-50 dark:bg-violet-900/30"
                    }`}
                  >
                    <i
                      className={`bi ${icon} text-sm ${
                        isSale
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-violet-600 dark:text-violet-400"
                      }`}
                    />
                  </div>
                  <span className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                    {label}
                  </span>
                </div>
                {badge ? (
                  <span
                    className={`text-[12px] font-bold px-3 py-1 rounded-full border ${
                      isSale
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40"
                        : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/40"
                    }`}
                  >
                    <i className={`bi ${modeIcon} me-1.5`} />
                    {value}
                  </span>
                ) : (
                  <span
                    className={`font-bold text-slate-800 dark:text-slate-100 ${
                      mono
                        ? "font-mono text-[13px] bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/60 px-2.5 py-0.5 rounded-lg"
                        : "text-[13.5px]"
                    }`}
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}

            {/* Type badge */}
            <div className="flex items-center justify-center pt-1">
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11.5px] font-black uppercase tracking-widest border ${
                  isSale
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40"
                    : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/40"
                }`}
              >
                <i
                  className={`bi ${isSale ? "bi-arrow-down-circle-fill text-emerald-500" : "bi-arrow-up-circle-fill text-violet-500"} text-xs`}
                />
                {isSale ? "Credit Transaction" : "Debit Transaction"}
              </span>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="px-8 pb-8 flex flex-col gap-3">
            <button
              onClick={() => navigate(isSale ? "/sales/create" : "/purchases/create")}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all duration-200 hover:-translate-y-px active:translate-y-0 ${
                isSale
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-200/60 dark:shadow-emerald-900/40"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-200/60 dark:shadow-violet-900/40"
              }`}
            >
              <i className={`bi ${isSale ? "bi-plus-circle-fill" : "bi-cart-plus-fill"}`} />
              {isSale ? "New Sale" : "New Purchase"}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(isSale ? `/sales/${state?.saleId}` : `/purchases/${state?.purchaseId}`)}
                disabled={!state?.saleId && !state?.purchaseId}
                className="py-3 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <i className="bi bi-eye" />
                View Detail
              </button>
              <button
                onClick={() => navigate(isSale ? "/sales" : "/purchases")}
                className="py-3 rounded-2xl font-bold text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <i className="bi bi-list-ul" />
                View List
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-400 dark:text-slate-600 text-[11.5px] font-medium mt-4">
          <i className="bi bi-shield-check me-1.5" />
          Transaction recorded securely
        </p>
      </div>
    </div>
  );
}
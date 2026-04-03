import React from "react";

/* ══════════════════════════════════════════
   SHARED REPORT LAYOUT — Professional Edition
══════════════════════════════════════════ */
function ReportLayout({
  title,
  subtitle,
  icon,
  actions,
  loading = false,
  children,
}) {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-0">
      {/* ════ GRADIENT HEADER BANNER ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-5">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {/* Icon Box */}
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                {icon && <i className={`bi ${icon} text-blue-300 text-xl`} />}
              </div>
              <div>
                <h3 className="text-white font-extrabold text-[18px] tracking-tight m-0 leading-none">
                  {title}
                </h3>
                <p className="text-slate-400 text-[12px] mt-1 m-0 font-medium flex items-center gap-1.5">
                  <i className="bi bi-calendar3 text-[10px]" />
                  Generated on {now}
                  {subtitle && <> · {subtitle}</>}
                </p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {actions}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/20 text-white/70 text-[12px] font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <i className="bi bi-printer" /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Thin accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
      </div>

      {/* ════ CONTENT CARD ════ */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-colors duration-300">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                Loading report data…
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportLayout;

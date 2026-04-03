import React from "react";

/* ══════════════════════════════════════════
   SHARED REPORT TABLE
   Generic column-driven table used across
   all report pages.
══════════════════════════════════════════ */
function ReportTable({
  columns,
  data,
  emptyMessage = "No Data Available",
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
      <table className="w-full text-sm border-collapse">

        {/* ── Header ── */}
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3.5 text-left text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {data && data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/40 transition-colors duration-150"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-3.5 text-[13px] text-slate-700 dark:text-slate-200 font-medium"
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-16 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                    <i className="bi bi-inbox text-3xl text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 m-0">
                    {emptyMessage}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ReportTable;
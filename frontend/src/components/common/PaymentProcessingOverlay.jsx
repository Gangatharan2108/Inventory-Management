import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════
   PAYMENT PROCESSING OVERLAY
   Usage:
     <PaymentProcessingOverlay
       show={showPaymentLoader}
       type="sale"          // "sale" | "purchase"
       amount={grandTotal}
       onComplete={() => navigate("/payment-success", { state: {...} })}
     />
═══════════════════════════════════════════════════════ */

const STEPS = [
  { id: 0, label: "Validating order", icon: "bi-shield-check", duration: 1200 },
  {
    id: 1,
    label: "Processing payment",
    icon: "bi-credit-card-2-front",
    duration: 1200,
  },
  {
    id: 2,
    label: "Confirming transaction",
    icon: "bi-patch-check",
    duration: 1200,
  },
];

export default function PaymentProcessingOverlay({
  show,
  type = "sale",
  amount = 0,
  onComplete,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);

  const isSale = type === "sale";

  /* ── Reset & run animation when shown ── */
  useEffect(() => {
    if (!show) {
      setActiveStep(0);
      setDoneSteps([]);
      setProgress(0);
      setFinished(false);
      return;
    }

    let elapsed = 0;
    const totalDuration = STEPS.reduce((s, st) => s + st.duration, 0); // 2000 ms

    STEPS.forEach((step, idx) => {
      // Mark step as active
      setTimeout(() => {
        setActiveStep(idx);
        setProgress(Math.round((elapsed / totalDuration) * 100));
      }, elapsed);

      elapsed += step.duration;

      // Mark step as done
      setTimeout(() => {
        setDoneSteps((prev) => [...prev, idx]);
        setProgress(Math.round((elapsed / totalDuration) * 100));
      }, elapsed - 80);
    });

    // All done → show tick → call onComplete
    setTimeout(() => {
      setProgress(100);
      setFinished(true);
    }, totalDuration - 80);

    setTimeout(() => {
      onComplete?.();
    }, totalDuration + 220);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-sm" />

      {/* Card */}
      <div
        className={[
          "relative w-[340px] rounded-3xl overflow-hidden shadow-2xl",
          "border border-white/10",
          "animate-[fadeScaleIn_0.25s_ease-out]",
        ].join(" ")}
        style={{ animation: "fadeScaleIn 0.25s ease-out" }}
      >
        {/* ── Gradient top strip ── */}
        <div
          className={`h-1.5 w-full ${
            isSale
              ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
              : "bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400"
          }`}
        />

        {/* ── Body ── */}
        <div className="bg-white dark:bg-slate-800 px-8 py-7">
          {/* Spinner / Tick */}
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              {/* Outer spinning ring */}
              {!finished && (
                <svg
                  className="absolute inset-0 w-full h-full animate-spin"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={isSale ? "#d1fae5" : "#ede9fe"}
                    strokeWidth="4"
                  />
                  <path
                    d="M32 4 A28 28 0 0 1 60 32"
                    stroke={isSale ? "#10b981" : "#8b5cf6"}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Center icon */}
              <div
                className={[
                  "absolute inset-0 flex items-center justify-center rounded-full transition-all duration-300",
                  finished
                    ? isSale
                      ? "bg-emerald-500 scale-100"
                      : "bg-violet-500 scale-100"
                    : "bg-slate-50 dark:bg-slate-700 scale-90",
                ].join(" ")}
              >
                {finished ? (
                  <i className="bi bi-check-lg text-white text-2xl font-black" />
                ) : (
                  <i
                    className={`bi ${STEPS[activeStep]?.icon} text-xl ${
                      isSale ? "text-emerald-500" : "text-violet-500"
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <p className="text-center font-black text-slate-800 dark:text-slate-100 text-[15px] mb-1">
            {finished ? "Payment Confirmed!" : "Processing Payment"}
          </p>

          {/* Amount */}
          <p
            className={`text-center text-2xl font-black mb-5 ${
              isSale
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-violet-600 dark:text-violet-400"
            }`}
          >
            ₹{" "}
            {Number(amount).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {/* Steps */}
          <div className="space-y-2.5 mb-5">
            {STEPS.map((step) => {
              const isDone = doneSteps.includes(step.id);
              const isActive = activeStep === step.id && !isDone;

              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div
                    className={[
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                      isDone
                        ? isSale
                          ? "bg-emerald-500"
                          : "bg-violet-500"
                        : isActive
                          ? isSale
                            ? "border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                            : "border-2 border-violet-400 bg-violet-50 dark:bg-violet-900/30"
                          : "border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <i className="bi bi-check text-white text-[10px] font-black" />
                    ) : isActive ? (
                      <span
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isSale ? "bg-emerald-400" : "bg-violet-400"
                        }`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500" />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={[
                      "text-[12.5px] font-semibold transition-all duration-300",
                      isDone
                        ? "text-slate-500 dark:text-slate-400 line-through"
                        : isActive
                          ? "text-slate-800 dark:text-slate-100 font-bold"
                          : "text-slate-400 dark:text-slate-500",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>

                  {/* Active spinner */}
                  {isActive && (
                    <span
                      className={`ml-auto w-3.5 h-3.5 border-2 rounded-full animate-spin border-t-transparent ${
                        isSale ? "border-emerald-400" : "border-violet-400"
                      }`}
                    />
                  )}

                  {isDone && (
                    <i
                      className={`ml-auto bi bi-check-circle-fill text-[13px] ${
                        isSale ? "text-emerald-500" : "text-violet-500"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all duration-300 ease-out",
                isSale
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : "bg-gradient-to-r from-violet-400 to-indigo-400",
              ].join(" ")}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Bottom note */}
          <p className="text-center text-[10.5px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
            <i className="bi bi-lock-fill me-1" />
            Secured &amp; encrypted transaction
          </p>
        </div>
      </div>

      {/* CSS keyframe for card entry */}
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

// ─── Toast Config (Bootstrap theme colors) ────────────────────────────────────
const TOAST_CONFIG = {
  success: { bg: "#198754", icon: "bi-check-circle-fill", label: "Success!" },
  error:   { bg: "#dc3545", icon: "bi-x-circle-fill",     label: "Error!"   },
  warning: { bg: "#fd7e14", icon: "bi-exclamation-triangle-fill", label: "Warning!" },
  info:    { bg: "#0d6efd", icon: "bi-info-circle-fill",   label: "Info"     },
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast Stack: fixed top-right corner ── */}
      <div style={containerStyle}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Single Toast Item ────────────────────────────────────────────────────────
const ToastItem = ({ toast, onClose }) => {
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div style={{ ...toastStyle, backgroundColor: cfg.bg }}>
      <div style={iconWrap}>
        <i className={`bi ${cfg.icon}`} style={{ fontSize: "1.25rem" }} />
      </div>

      <div style={bodyStyle}>
        <span style={labelStyle}>{cfg.label}</span>
        <span style={msgStyle}>{toast.message}</span>
      </div>

      <button style={closeStyle} onClick={onClose}>
        <i className="bi bi-x-lg" />
      </button>

      {/* progress bar */}
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
    </div>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 99999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "340px",
  pointerEvents: "none",
};

const toastStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "14px 14px 22px 16px",
  borderRadius: "12px",
  color: "#fff",
  boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
  position: "relative",
  overflow: "hidden",
  animation: "toastIn 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards",
  pointerEvents: "all",
};

const iconWrap  = { marginTop: "2px", flexShrink: 0 };
const bodyStyle = { flex: 1, display: "flex", flexDirection: "column", gap: "3px" };
const labelStyle = { fontWeight: 700, fontSize: "0.93rem" };
const msgStyle   = { fontSize: "0.84rem", opacity: 0.93, lineHeight: 1.45 };
const closeStyle = {
  background: "none", border: "none", color: "#fff",
  cursor: "pointer", opacity: 0.8, padding: 0,
  fontSize: "0.8rem", flexShrink: 0, lineHeight: 1,
};
const trackStyle = {
  position: "absolute", bottom: 0, left: 0, right: 0,
  height: "4px", backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "0 0 12px 12px",
};
const fillStyle = {
  height: "100%", backgroundColor: "rgba(255,255,255,0.85)",
  borderRadius: "inherit",
  animation: "toastShrink 4s linear forwards",
};

// inject keyframes once
if (!document.getElementById("__toast_kf")) {
  const s = document.createElement("style");
  s.id = "__toast_kf";
  s.innerHTML = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(110%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes toastShrink {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `;
  document.head.appendChild(s);
}

export default ToastProvider;

const VARIANT = {
  danger:  { color: "#dc3545", light: "#fff5f5", border: "#f5c2c7", icon: "bi-trash3-fill",                   btnClass: "btn btn-danger"   },
  warning: { color: "#fd7e14", light: "#fff8f0", border: "#ffddb5", icon: "bi-exclamation-triangle-fill",     btnClass: "btn btn-warning text-white" },
  primary: { color: "#0d6efd", light: "#f0f5ff", border: "#b6d4fe", icon: "bi-check-circle-fill",             btnClass: "btn btn-primary"  },
};

const ConfirmModal = ({
  open,
  title       = "Are you sure?",
  message     = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText  = "Cancel",
  variant     = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const v = VARIANT[variant] || VARIANT.danger;

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

        {/* Colored icon circle */}
        <div style={{ ...circleStyle, backgroundColor: v.light, border: `2px solid ${v.border}` }}>
          <i
            className={`bi ${v.icon}`}
            style={{ color: v.color, fontSize: "1.6rem" }}
          />
        </div>

        {/* Title */}
        <h5 style={titleStyle}>{title}</h5>

        {/* Message */}
        <p style={msgStyle}>{message}</p>

        {/* Divider */}
        <hr style={{ margin: "0 0 20px", borderColor: "#e9ecef" }} />

        {/* Buttons */}
        <div style={btnRowStyle}>
          <button
            className="btn btn-outline-secondary"
            style={cancelBtnStyle}
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            className={v.btnClass}
            style={confirmBtnStyle}
            onClick={onConfirm}
          >
            <i className={`bi ${v.icon} me-2`} />
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(3px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 99998,
  animation: "cfOverlay 0.2s ease",
};

const modalStyle = {
  backgroundColor: "var(--bs-body-bg, #ffffff)",
  color: "var(--bs-body-color, #212529)",
  borderRadius: "16px",
  padding: "32px 28px 24px",
  maxWidth: "420px",
  width: "90%",
  textAlign: "center",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  animation: "cfPop 0.25s cubic-bezier(0.34,1.4,0.64,1)",
};

const circleStyle = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 18px",
};

const titleStyle = {
  fontWeight: 700,
  fontSize: "1.2rem",
  color: "#212529",
  marginBottom: "10px",
};

const msgStyle = {
  color: "#6c757d",
  fontSize: "0.9rem",
  lineHeight: 1.55,
  marginBottom: "20px",
};

const btnRowStyle = {
  display: "flex",
  gap: "12px",
};

const cancelBtnStyle = {
  flex: 1,
  padding: "10px",
  fontWeight: 600,
  borderRadius: "10px",
};

const confirmBtnStyle = {
  flex: 1,
  padding: "10px",
  fontWeight: 700,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// inject keyframes once
if (!document.getElementById("__cf_kf")) {
  const s = document.createElement("style");
  s.id = "__cf_kf";
  s.innerHTML = `
    @keyframes cfOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cfPop { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
  `;
  document.head.appendChild(s);
}

export default ConfirmModal;

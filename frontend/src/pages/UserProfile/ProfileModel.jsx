import { useState, useEffect } from "react";
import { updateUser, verifyOldPassword } from "../../api/usereditService";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

/* ══════════════════════════════════════════
   ROLE CONFIG
══════════════════════════════════════════ */
const ROLE_CONFIG = {
  Owner: {
    bg: "#fff0f0",
    color: "#c0392b",
    border: "#f5c6c6",
    icon: "bi-shield-fill-check",
    badgeCls:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60",
  },
  Manager: {
    bg: "#f0f4ff",
    color: "#2563eb",
    border: "#c3d3fb",
    icon: "bi-briefcase-fill",
    badgeCls:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
  },
  Supervisor: {
    bg: "#f0fdf4",
    color: "#16a34a",
    border: "#bbf7d0",
    icon: "bi-person-badge-fill",
    badgeCls:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
  },
  Employee: {
    bg: "#fefce8",
    color: "#ca8a04",
    border: "#fde68a",
    icon: "bi-person-fill",
    badgeCls:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60",
  },
};

/* ── Shared input class ── */
const inputBase = [
  "w-full h-[43px] rounded-xl border-[1.5px] px-3.5 text-sm font-medium",
  "bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100",
  "border-slate-200 dark:border-slate-600",
  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
  "focus:outline-none focus:bg-white dark:focus:bg-slate-700",
  "focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 dark:focus:border-blue-400",
  "transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700/50",
].join(" ");

const inputErr =
  "!border-red-400 dark:!border-red-500 !ring-2 !ring-red-400/15";

/* ── Field label ── */
const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}
  </label>
);

/* ── Field error ── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-[12px] text-red-500 dark:text-red-400 mt-1.5 font-semibold">
      <i className="bi bi-exclamation-circle-fill text-[10px]" />
      {msg}
    </p>
  ) : null;

/* ── Section divider ── */
const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
    <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
  </div>
);

/* ══════════════════════════════════════════
   PROFILE MODAL COMPONENT
══════════════════════════════════════════ */
export default function ProfileModal({ user, onClose, refreshUser }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isOwner = user.role === "Owner";
  const roleStyle = ROLE_CONFIG[user.role] || {
    color: "#3b82f6",
    icon: "bi-person-fill",
    badgeCls:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
  };
  const accent = roleStyle.color;

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    email: user.email || "",
    phone: user.phone || "",
    profile_image: null,
    old_password: "",
    password1: "",
    password2: "",
  });

  const [preview, setPreview] = useState(user.profile_image || null);
  const [passwordApproved, setPasswordApproved] = useState(false);
  const [oldPasswordVerified, setOldPasswordVerified] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  /* ── Check approval ── */
  const checkApproval = async () => {
    if (isOwner) {
      setCheckingApproval(false);
      return;
    }
    try {
      const res = await axios.get("/check-password-request/");
      setPasswordApproved(res.data.approved);
      if (!res.data.approved) setOldPasswordVerified(false);
    } catch {
      setPasswordApproved(false);
      setOldPasswordVerified(false);
    }
    setCheckingApproval(false);
  };
  useEffect(() => {
    checkApproval();
  }, []);

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_image") {
      const file = files[0];
      if (!file) return;
      setFormData({ ...formData, profile_image: file });
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
      if (errors[name]) setErrors({ ...errors, [name]: null });
    }
  };

  const verifyPassword = async () => {
    setVerifying(true);
    setErrors({});
    try {
      await verifyOldPassword(user.id, { old_password: formData.old_password });
      setOldPasswordVerified(true);
    } catch (err) {
      setOldPasswordVerified(false);
      if (err.response?.data) setErrors(err.response.data);
    }
    setVerifying(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append("first_name", formData.first_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      if (formData.profile_image)
        data.append("profile_image", formData.profile_image);
      if (!isOwner && oldPasswordVerified) {
        data.append("old_password", formData.old_password);
        data.append("password1", formData.password1);
        data.append("password2", formData.password2);
      }
      const res = await updateUser(user.id, data);
      showToast("Profile updated successfully", "success");
      if (res.data.password_changed) {
        showToast("Password changed. Please login again.", "success");
        localStorage.clear();
        navigate("/");
        window.location.reload();
        return;
      }
      refreshUser();
      onClose();
    } catch {
      showToast("Update failed", "error");
    }
    setSaving(false);
  };

  const handlePasswordRequest = async () => {
    setRequesting(true);
    try {
      await axios.post("/request-password-change/");
      showToast("Request sent to Owner", "success");
      setPasswordApproved(false);
      setOldPasswordVerified(false);
      checkApproval();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Request already pending",
        "warning",
      );
    }
    setRequesting(false);
  };

  const avatarUrl =
    preview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.first_name || user.username)}&background=${accent.replace("#", "")}&color=fff&bold=true&size=128`;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-[4px] transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ── Modal ── */}
      <div className="relative w-full max-w-[520px] max-h-[92vh] overflow-y-auto rounded-[24px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_24px_64px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)] transition-colors duration-300 scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200">
        {/* ════ HEADER ════ */}
        <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700/70 overflow-hidden">
          {/* Dynamic accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-colors duration-300"
            style={{ background: accent }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-[34px] h-[34px] rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[15px] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-700/60"
          >
            <i className="bi bi-x-lg" />
          </button>

          {/* Avatar zone */}
          <div className="flex flex-col items-center gap-2.5 pt-4 pb-1">
            <label
              htmlFor="pm_img_input"
              className="relative w-[90px] h-[90px] cursor-pointer group"
            >
              <img
                className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-[0_2px_14px_rgba(0,0,0,0.14)] transition-opacity duration-200 group-hover:opacity-75"
                src={avatarUrl}
                alt="avatar"
              />
              <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <i className="bi bi-camera-fill text-white text-lg" />
              </div>
            </label>
            <input
              id="pm_img_input"
              type="file"
              name="profile_image"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />

            <div className="text-center">
              <p className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 mb-1 leading-tight m-0">
                {formData.first_name || user.username}
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-slate-400 dark:text-slate-500 text-[12.5px] font-medium">
                  @{user.username}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleStyle.badgeCls}`}
                >
                  <i className={`bi ${roleStyle.icon} text-[10px]`} />
                  {user.role}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1.5 m-0 font-medium">
                Click avatar to change photo
              </p>
            </div>
          </div>
        </div>

        {/* ════ TABS (non-Owner only) ════ */}
        {!isOwner && (
          <div className="flex gap-2 px-6 pt-4">
            {[
              { key: "profile", label: "Profile", icon: "bi-person-fill" },
              { key: "password", label: "Password", icon: "bi-lock-fill" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex-1 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-200 border",
                  activeTab === tab.key
                    ? "text-white border-transparent shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
                style={activeTab === tab.key ? { background: accent } : {}}
              >
                <i className={`bi ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ════ FORM ════ */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            {/* ── PROFILE TAB ── */}
            {(isOwner || activeTab === "profile") && (
              <div className="space-y-4">
                {/* Username — disabled */}
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <div className="relative">
                    <i className="bi bi-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[14px] pointer-events-none" />
                    <input
                      className={`${inputBase} pl-9`}
                      value={user.username}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <FieldLabel>Full Name</FieldLabel>
                    <input
                      name="first_name"
                      className={inputBase}
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Your name"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <div className="relative">
                      <i className="bi bi-telephone-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[12px] pointer-events-none" />
                      <input
                        name="phone"
                        className={`${inputBase} pl-9`}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 99999 99999"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <div className="relative">
                    <i className="bi bi-envelope-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[12px] pointer-events-none" />
                    <input
                      name="email"
                      type="email"
                      className={`${inputBase} pl-9`}
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── PASSWORD TAB ── */}
            {!isOwner && activeTab === "password" && !checkingApproval && (
              <div className="space-y-4">
                {/* ── Not approved: show request button ── */}
                {!passwordApproved && (
                  <>
                    {/* Info box — pending */}
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-400 rounded-xl px-4 py-3.5">
                      <i className="bi bi-hourglass-split text-amber-600 dark:text-amber-400 text-[15px] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-bold m-0 leading-tight">
                          Password change requires approval
                        </p>
                        <p className="text-[12px] mt-1 m-0 font-medium opacity-80">
                          Send a request to the Owner to enable password change.
                        </p>
                      </div>
                    </div>

                    {/* Request button */}
                    <button
                      type="button"
                      onClick={handlePasswordRequest}
                      disabled={requesting}
                      className="w-full h-[44px] rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-amber-200/50 dark:shadow-amber-900/20"
                      style={{
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                      }}
                    >
                      {requesting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill" />
                          Request Password Change
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* ── Approved, not yet verified ── */}
                {passwordApproved && !oldPasswordVerified && (
                  <>
                    {/* Info box — approved */}
                    <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-400 rounded-xl px-4 py-3.5">
                      <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400 text-[15px] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-bold m-0 leading-tight">
                          Request approved!
                        </p>
                        <p className="text-[12px] mt-1 m-0 font-medium opacity-80">
                          Verify your old password to continue.
                        </p>
                      </div>
                    </div>

                    {/* Old password + Verify */}
                    <div>
                      <FieldLabel>Old Password</FieldLabel>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showOld ? "text" : "password"}
                            name="old_password"
                            className={`${inputBase} pr-11 ${errors.old_password ? inputErr : ""}`}
                            value={formData.old_password}
                            onChange={handleChange}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOld(!showOld)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                          >
                            <i
                              className={`bi ${showOld ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                            />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={verifyPassword}
                          disabled={verifying || !formData.old_password}
                          className="h-[43px] px-4 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                          }}
                        >
                          {verifying ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <i className="bi bi-shield-check" /> Verify
                            </>
                          )}
                        </button>
                      </div>
                      <FieldError msg={errors.old_password} />
                    </div>
                  </>
                )}

                {/* ── Verified: set new password ── */}
                {oldPasswordVerified && (
                  <>
                    {/* Info box — verified */}
                    <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-400 rounded-xl px-4 py-3.5">
                      <i className="bi bi-unlock-fill text-emerald-600 dark:text-emerald-400 text-[15px] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-bold m-0 leading-tight">
                          Identity verified
                        </p>
                        <p className="text-[12px] mt-1 m-0 font-medium opacity-80">
                          Set your new password below.
                        </p>
                      </div>
                    </div>

                    <Divider label="New Password" />

                    {/* New Password */}
                    <div>
                      <FieldLabel>New Password</FieldLabel>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          name="password1"
                          className={`${inputBase} pr-11 ${errors.password1 ? inputErr : ""}`}
                          value={formData.password1}
                          onChange={handleChange}
                          placeholder="Min 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                        >
                          <i
                            className={`bi ${showNew ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                          />
                        </button>
                      </div>
                      <FieldError msg={errors.password1} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <FieldLabel>Confirm Password</FieldLabel>
                      <div className="relative">
                        <input
                          type={showCfm ? "text" : "password"}
                          name="password2"
                          className={`${inputBase} pr-11 ${errors.password2 ? inputErr : ""}`}
                          value={formData.password2}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCfm(!showCfm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                        >
                          <i
                            className={`bi ${showCfm ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                          />
                        </button>
                      </div>
                      <FieldError msg={errors.password2} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Checking approval loading ── */}
            {!isOwner && activeTab === "password" && checkingApproval && (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400 rounded-full animate-spin" />
                <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                  Checking approval…
                </span>
              </div>
            )}
          </div>

          {/* ════ FOOTER ════ */}
          {(isOwner ||
            activeTab === "profile" ||
            (activeTab === "password" && oldPasswordVerified)) && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700/70">
              <button
                type="button"
                onClick={onClose}
                className="h-[42px] px-5 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-[42px] px-6 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-md transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                }}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
